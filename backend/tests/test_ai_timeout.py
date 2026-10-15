"""
Tests for AI provider timeout enforcement (TASK-6.02).
All Groq API calls are wrapped with asyncio.wait_for(..., timeout=settings.AI_REQUEST_TIMEOUT_SECONDS).
A slow response times out, raises AIServiceUnavailableError, and returns HTTP 503.
"""
import time
from unittest.mock import MagicMock

import pytest
from app.models.subject import Subject
from app.services.ai_service import GroqAIService, get_ai_service


@pytest.fixture
def sample_subject(db):
    subj = Subject(name="Database Management Systems", branch="COMP", academic_year="TE")
    db.add(subj)
    db.commit()
    db.refresh(subj)
    return subj


@pytest.mark.asyncio
async def test_ai_timeout_returns_503(client, auth_headers, sample_subject):
    """
    Mock a slow Groq client (calls hang/sleep).
    Assert that the endpoint catches timeout, returns 503, and terminates within timeout + 1s.
    """
    from app.main import app

    # Create a real GroqAIService instance with a very short timeout for testing
    groq_service = GroqAIService(api_key="fake-key-for-testing")
    groq_service._timeout = 0.2  # 200ms timeout for test speed

    # Mock client call to simulate slow provider
    def slow_call(*args, **kwargs):
        time.sleep(2.0)  # Exceeds 200ms timeout
        return MagicMock()

    groq_service._client = MagicMock()
    groq_service._client.chat.completions.create = slow_call

    # Override get_ai_service dependency
    app.dependency_overrides[get_ai_service] = lambda: groq_service

    start_time = time.monotonic()
    try:
        res = await client.post(
            "/api/v1/sessions/start",
            json={"subject_id": sample_subject.id, "difficulty": "Friendly"},
            headers=auth_headers,
        )
        elapsed = time.monotonic() - start_time

        # Assert 503 Service Unavailable returned
        assert res.status_code == 503
        assert "timed out" in res.json()["detail"].lower()

        # Assert returned within timeout bounds (2 attempts of 0.2s + 0.5s retry delay + 1.0s buffer < 2.5s)
        assert elapsed < 2.5, f"Expected timeout response in < 2.5s, took {elapsed}s"
    finally:
        # Restore dependency override
        app.dependency_overrides.pop(get_ai_service, None)
