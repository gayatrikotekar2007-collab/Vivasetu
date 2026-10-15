"""
Tests for rate limiting on AI-heavy endpoints:
- POST /api/v1/sessions/start
- POST /api/v1/sessions/{id}/answer

Acceptance Criteria:
- AC-6.1.1: Configurable per authenticated user
- AC-6.1.3: 429 shape {"error": "rate_limit_exceeded", "retry_after_seconds": <n>}
- Keyed by user ID: User B is not blocked when User A exceeds their limit.
"""
import pytest
from app.core.config import settings
from app.core.dependencies import limiter
from app.models.subject import Subject


@pytest.fixture(autouse=True)
def reset_limiter_storage():
    """Ensure limiter is reset before each test."""
    limiter.reset()
    yield
    limiter.reset()


@pytest.fixture
def sample_subject(db):
    subj = Subject(name="Operating Systems", branch="COMP", academic_year="TE")
    db.add(subj)
    db.commit()
    db.refresh(subj)
    return subj


@pytest.mark.asyncio
async def test_session_start_rate_limit_exceeded(client, auth_headers, second_auth_headers, sample_subject):
    """
    Making requests up to settings.RATE_LIMIT_PER_MINUTE succeeds;
    exceeding it returns 429 with expected JSON shape.
    A different user making a request is NOT rate-limited (proves user-keyed).
    """
    limit = settings.RATE_LIMIT_PER_MINUTE
    payload = {"subject_id": sample_subject.id, "difficulty": "Friendly"}

    # Exhaust rate limit for User A
    for _ in range(limit):
        res = await client.post("/api/v1/sessions/start", json=payload, headers=auth_headers)
        assert res.status_code == 201

    # Next request for User A should be 429
    res_exceeded = await client.post("/api/v1/sessions/start", json=payload, headers=auth_headers)
    assert res_exceeded.status_code == 429

    data = res_exceeded.json()
    assert data["error"] == "rate_limit_exceeded"
    assert isinstance(data["retry_after_seconds"], int)
    assert data["retry_after_seconds"] > 0
    assert "retry-after" in res_exceeded.headers

    # User B should NOT be rate-limited (proves keyed by user, not IP)
    res_user_b = await client.post("/api/v1/sessions/start", json=payload, headers=second_auth_headers)
    assert res_user_b.status_code == 201


@pytest.mark.asyncio
async def test_answer_session_rate_limit(client, auth_headers, sample_subject):
    """
    Submitting answers above limit returns 429 with expected shape.
    """
    # Start a session
    start_res = await client.post("/api/v1/sessions/start", json={
        "subject_id": sample_subject.id,
        "difficulty": "Friendly",
    }, headers=auth_headers)
    assert start_res.status_code == 201
    session_id = start_res.json()["session_id"]

    limit = settings.RATE_LIMIT_PER_MINUTE
    answer_payload = {"answer": "A process is an executing instance of a program."}

    # Exhaust limit on answer endpoint
    hit_429 = False
    for i in range(limit + 2):
        res = await client.post(f"/api/v1/sessions/{session_id}/answer", json=answer_payload, headers=auth_headers)
        if res.status_code == 429:
            hit_429 = True
            body = res.json()
            assert body["error"] == "rate_limit_exceeded"
            assert isinstance(body["retry_after_seconds"], int)
            break

    assert hit_429, f"Expected 429 after {limit} calls on answer endpoint"
