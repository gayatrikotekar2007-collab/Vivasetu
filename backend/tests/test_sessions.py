"""
Session endpoint tests.

Critical tests (from requirements):
  - Session ownership: 403 for wrong user on answer, end, get
  - Insufficient data: < 2 answers → status='insufficient_data'
  - Invalid difficulty → 422
  - Valid session → score shape with all required fields
"""
import pytest


async def _create_subject(client, auth_headers):
    """Helper: create and return a subject for testing."""
    resp = await client.post("/api/v1/subjects/suggest", json={
        "name": "Test Subject for Sessions",
        "branch": "Computer Engineering",
        "academic_year": "BE",
    }, headers=auth_headers)
    assert resp.status_code == 201
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_start_session_success(client, auth_headers):
    subject_id = await _create_subject(client, auth_headers)
    resp = await client.post("/api/v1/sessions/start", json={
        "subject_id": subject_id,
        "difficulty": "Friendly",
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert "session_id" in data
    assert "question" in data
    assert data["mock_mode"] is True  # GROQ_API_KEY is empty in tests
    assert data["turn_index"] == 0


@pytest.mark.asyncio
async def test_start_session_invalid_difficulty(client, auth_headers):
    subject_id = await _create_subject(client, auth_headers)
    resp = await client.post("/api/v1/sessions/start", json={
        "subject_id": subject_id,
        "difficulty": "easy",  # Invalid — must be exactly Friendly/Strict/Brutal
    }, headers=auth_headers)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_start_session_nonexistent_subject(client, auth_headers):
    resp = await client.post("/api/v1/sessions/start", json={
        "subject_id": "00000000-0000-0000-0000-000000000000",
        "difficulty": "Strict",
    }, headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_answer_session_success(client, auth_headers):
    subject_id = await _create_subject(client, auth_headers)
    start = await client.post("/api/v1/sessions/start", json={
        "subject_id": subject_id, "difficulty": "Strict",
    }, headers=auth_headers)
    session_id = start.json()["session_id"]

    resp = await client.post(f"/api/v1/sessions/{session_id}/answer",
        json={"answer": "My answer to the first question"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "question" in data
    assert data["turn_index"] == 1


@pytest.mark.asyncio
async def test_end_session_insufficient_data_zero(client, auth_headers):
    """End with 0 answers → insufficient_data."""
    subject_id = await _create_subject(client, auth_headers)
    start = await client.post("/api/v1/sessions/start", json={
        "subject_id": subject_id, "difficulty": "Friendly",
    }, headers=auth_headers)
    session_id = start.json()["session_id"]

    resp = await client.post(f"/api/v1/sessions/{session_id}/end", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "insufficient_data"
    assert "message" in data
    assert data["answered_count"] == 0
    # Must NOT have a 'topics' key (structurally distinct from score)
    assert "topics" not in data


@pytest.mark.asyncio
async def test_end_session_insufficient_data_one(client, auth_headers):
    """End with 1 answer → insufficient_data."""
    subject_id = await _create_subject(client, auth_headers)
    start = await client.post("/api/v1/sessions/start", json={
        "subject_id": subject_id, "difficulty": "Friendly",
    }, headers=auth_headers)
    session_id = start.json()["session_id"]

    await client.post(f"/api/v1/sessions/{session_id}/answer",
        json={"answer": "Only one answer"}, headers=auth_headers)

    resp = await client.post(f"/api/v1/sessions/{session_id}/end", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "insufficient_data"
    assert data["answered_count"] == 1


@pytest.mark.asyncio
async def test_end_session_valid_score(client, auth_headers):
    """End with 2+ answers → valid score shape with all required fields."""
    subject_id = await _create_subject(client, auth_headers)
    start = await client.post("/api/v1/sessions/start", json={
        "subject_id": subject_id, "difficulty": "Brutal",
    }, headers=auth_headers)
    session_id = start.json()["session_id"]

    # Answer 2 questions
    for _ in range(2):
        ans = await client.post(f"/api/v1/sessions/{session_id}/answer",
            json={"answer": "My answer here"}, headers=auth_headers)
        assert ans.status_code == 200

    resp = await client.post(f"/api/v1/sessions/{session_id}/end", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert isinstance(data["topics"], list)
    assert len(data["topics"]) > 0
    # Verify all required per-topic fields are present
    for topic in data["topics"]:
        assert "topic_name" in topic
        assert "score" in topic
        assert "student_answer_summary" in topic
        assert "model_answer" in topic
        assert "gap_description" in topic
    assert "mock_mode" in data
    assert data["mock_mode"] is True


# ── Session Ownership Tests (CRITICAL — must cover all three endpoints) ────────

@pytest.mark.asyncio
async def test_answer_session_wrong_user_403(client, auth_headers, second_auth_headers):
    """User B cannot answer User A's session."""
    subject_id = await _create_subject(client, auth_headers)
    start = await client.post("/api/v1/sessions/start", json={
        "subject_id": subject_id, "difficulty": "Friendly",
    }, headers=auth_headers)
    session_id = start.json()["session_id"]

    resp = await client.post(f"/api/v1/sessions/{session_id}/answer",
        json={"answer": "intruder answer"},
        headers=second_auth_headers,  # Wrong user!
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_end_session_wrong_user_403(client, auth_headers, second_auth_headers):
    """User B cannot end User A's session."""
    subject_id = await _create_subject(client, auth_headers)
    start = await client.post("/api/v1/sessions/start", json={
        "subject_id": subject_id, "difficulty": "Strict",
    }, headers=auth_headers)
    session_id = start.json()["session_id"]

    resp = await client.post(f"/api/v1/sessions/{session_id}/end",
        headers=second_auth_headers,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_get_session_wrong_user_403(client, auth_headers, second_auth_headers):
    """User B cannot read User A's session."""
    subject_id = await _create_subject(client, auth_headers)
    start = await client.post("/api/v1/sessions/start", json={
        "subject_id": subject_id, "difficulty": "Friendly",
    }, headers=auth_headers)
    session_id = start.json()["session_id"]

    resp = await client.get(f"/api/v1/sessions/{session_id}",
        headers=second_auth_headers,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_get_session_not_found_404(client, auth_headers):
    """Non-existent session returns 404."""
    resp = await client.get(
        "/api/v1/sessions/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    assert resp.status_code == 404


# ── Group 5: Voice mode transcribe endpoint tests ─────────────────────────────

@pytest.mark.asyncio
async def test_transcribe_wrong_user_403(client, auth_headers, second_auth_headers):
    """User B cannot transcribe for User A's session."""
    subject_id = await _create_subject(client, auth_headers)
    start = await client.post("/api/v1/sessions/start", json={
        "subject_id": subject_id, "difficulty": "Friendly",
    }, headers=auth_headers)
    session_id = start.json()["session_id"]

    files = {"file": ("audio.webm", b"fake audio content", "audio/webm")}
    resp = await client.post(
        f"/api/v1/sessions/{session_id}/transcribe",
        files=files,
        headers=second_auth_headers,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_transcribe_session_not_found_404(client, auth_headers):
    """Non-existent session returns 404 on transcribe."""
    files = {"file": ("audio.webm", b"fake audio content", "audio/webm")}
    resp = await client.post(
        "/api/v1/sessions/00000000-0000-0000-0000-000000000000/transcribe",
        files=files,
        headers=auth_headers,
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_transcribe_invalid_format_422(client, auth_headers):
    """Audio format not in allowed set returns 422."""
    subject_id = await _create_subject(client, auth_headers)
    start = await client.post("/api/v1/sessions/start", json={
        "subject_id": subject_id, "difficulty": "Friendly",
    }, headers=auth_headers)
    session_id = start.json()["session_id"]

    files = {"file": ("test.txt", b"not audio", "text/plain")}
    resp = await client.post(
        f"/api/v1/sessions/{session_id}/transcribe",
        files=files,
        headers=auth_headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_transcribe_mock_mode_503(client, auth_headers):
    """In mock mode (no GROQ_API_KEY), transcribe returns 503 with structured message."""
    subject_id = await _create_subject(client, auth_headers)
    start = await client.post("/api/v1/sessions/start", json={
        "subject_id": subject_id, "difficulty": "Friendly",
    }, headers=auth_headers)
    session_id = start.json()["session_id"]

    files = {"file": ("audio.webm", b"fake audio content", "audio/webm")}
    resp = await client.post(
        f"/api/v1/sessions/{session_id}/transcribe",
        files=files,
        headers=auth_headers,
    )
    assert resp.status_code == 503
    data = resp.json()
    assert data["error"] == "transcription_unavailable"
    assert "Groq API key" in data["message"]


@pytest.mark.asyncio
async def test_transcribe_too_large_422(client, auth_headers):
    """File exceeding 25 MB returns 422."""
    subject_id = await _create_subject(client, auth_headers)
    start = await client.post("/api/v1/sessions/start", json={
        "subject_id": subject_id, "difficulty": "Friendly",
    }, headers=auth_headers)
    session_id = start.json()["session_id"]

    # 25 MB + 1 byte
    too_large_bytes = b"0" * (25 * 1024 * 1024 + 1)
    files = {"file": ("audio.webm", too_large_bytes, "audio/webm")}
    resp = await client.post(
        f"/api/v1/sessions/{session_id}/transcribe",
        files=files,
        headers=auth_headers,
    )
    assert resp.status_code == 422

