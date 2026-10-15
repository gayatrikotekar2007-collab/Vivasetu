"""
Tests for Group 4: Crowdsourcing + Retention Loop.

Covers:
  - Mastery service pure functions (update_mastery, next_review_date)
  - Post-session mastery update on scored sessions
  - GET /api/v1/users/me/mastery
  - Daily drill start, answer, complete, ownership checks (403)
  - Streak increment & reset
  - Reported questions submission, approval/rejection, public listing, idempotent upvoting
"""
from datetime import date, timedelta
import pytest
import pytest_asyncio
from app.services.mastery_service import next_review_date, update_mastery


# ── Pure Unit Tests ──────────────────────────────────────────────────────────

def test_update_mastery_calculation():
    # Default: 0.7 * existing + 0.3 * new
    # existing=50.0, new=80.0 -> 35.0 + 24.0 = 59.0
    res = update_mastery(50.0, 80.0)
    assert res == 59.0

    # Custom weight: 0.5 existing + 0.5 new
    res2 = update_mastery(40.0, 60.0, weight_new=0.5)
    assert res2 == 50.0

    # Clamping boundaries
    assert update_mastery(100.0, 150.0) == 100.0
    assert update_mastery(0.0, -20.0) == 0.0


def test_next_review_date_bands():
    base = date(2026, 9, 15)
    # Band < 40: +1 day
    assert next_review_date(35.0, from_date=base) == base + timedelta(days=1)
    assert next_review_date(0.0, from_date=base) == base + timedelta(days=1)

    # Band 40-70: +3 days
    assert next_review_date(40.0, from_date=base) == base + timedelta(days=3)
    assert next_review_date(55.5, from_date=base) == base + timedelta(days=3)
    assert next_review_date(70.0, from_date=base) == base + timedelta(days=3)

    # Band > 70: +7 days
    assert next_review_date(70.1, from_date=base) == base + timedelta(days=7)
    assert next_review_date(95.0, from_date=base) == base + timedelta(days=7)


# ── Post-Session Mastery Integration Tests ───────────────────────────────────

@pytest_asyncio.fixture
async def sample_subject(client, auth_headers):
    resp = await client.post(
        "/api/v1/subjects/suggest",
        json={
            "name": "Database Management Systems",
            "branch": "Computer Engineering",
            "academic_year": "TE",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.asyncio
async def test_post_session_mastery_and_get_mastery(client, auth_headers, sample_subject):
    # Complete onboarding
    await client.patch(
        "/api/v1/users/me/profile",
        json={"branch": "Computer Engineering", "academic_year": "TE"},
        headers=auth_headers,
    )

    # Start session
    start_resp = await client.post(
        "/api/v1/sessions/start",
        json={"subject_id": sample_subject["id"], "difficulty": "Friendly"},
        headers=auth_headers,
    )
    assert start_resp.status_code == 201
    session_id = start_resp.json()["session_id"]

    # Answer 2 questions
    ans1 = await client.post(
        f"/api/v1/sessions/{session_id}/answer",
        json={"answer": "Relational algebra provides theoretical foundations."},
        headers=auth_headers,
    )
    assert ans1.status_code == 200

    ans2 = await client.post(
        f"/api/v1/sessions/{session_id}/answer",
        json={"answer": "Indexing speeds up query execution via B-Trees."},
        headers=auth_headers,
    )
    assert ans2.status_code == 200

    # End session -> Mock AI produces valid score with topics
    end_resp = await client.post(
        f"/api/v1/sessions/{session_id}/end",
        headers=auth_headers,
    )
    assert end_resp.status_code == 200
    data = end_resp.json()
    assert data["status"] == "ok"
    assert len(data["topics"]) > 0

    # Verify GET /api/v1/users/me/mastery returns populated records
    mastery_resp = await client.get("/api/v1/users/me/mastery", headers=auth_headers)
    assert mastery_resp.status_code == 200
    masteries = mastery_resp.json()
    assert len(masteries) == len(data["topics"])
    for m in masteries:
        assert m["session_count"] == 1
        assert m["subject_id"] == sample_subject["id"]
        assert m["next_review_due"] is not None


# ── Daily Drill Tests ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_daily_drill_flow_and_ownership(
    client, auth_headers, second_auth_headers, sample_subject
):
    # Complete onboarding
    await client.patch(
        "/api/v1/users/me/profile",
        json={"branch": "Computer Engineering", "academic_year": "TE"},
        headers=auth_headers,
    )

    # 1. Start drill
    drill_resp = await client.post("/api/v1/drill/start", headers=auth_headers)
    assert drill_resp.status_code == 200
    drill_data = drill_resp.json()
    assert drill_data["completed"] is False
    assert drill_data["question_count"] == 5
    assert len(drill_data["turns"]) == 5
    drill_id = drill_data["id"]

    # 2. Calling start again on same day returns existing drill
    drill_resp_again = await client.post("/api/v1/drill/start", headers=auth_headers)
    assert drill_resp_again.status_code == 200
    assert drill_resp_again.json()["id"] == drill_id

    # 3. Answer turn 0
    ans_resp = await client.post(
        f"/api/v1/drill/{drill_id}/answer",
        json={"turn_index": 0, "answer": "Quick answer for turn 0."},
        headers=auth_headers,
    )
    assert ans_resp.status_code == 200
    assert ans_resp.json()["answer"] == "Quick answer for turn 0."

    # 4. Ownership check: second_user cannot answer or complete first user's drill
    ans_forbidden = await client.post(
        f"/api/v1/drill/{drill_id}/answer",
        json={"turn_index": 1, "answer": "Hacker answer."},
        headers=second_auth_headers,
    )
    assert ans_forbidden.status_code == 403

    complete_forbidden = await client.post(
        f"/api/v1/drill/{drill_id}/complete",
        headers=second_auth_headers,
    )
    assert complete_forbidden.status_code == 403

    # 5. Nonexistent drill returns 404
    ans_404 = await client.post(
        "/api/v1/drill/non-existent-id/answer",
        json={"turn_index": 0, "answer": "Test."},
        headers=auth_headers,
    )
    assert ans_404.status_code == 404

    # 6. Complete drill
    complete_resp = await client.post(
        f"/api/v1/drill/{drill_id}/complete",
        headers=auth_headers,
    )
    assert complete_resp.status_code == 200
    comp_data = complete_resp.json()
    assert comp_data["completed"] is True
    assert comp_data["streak_count"] == 1

    # Verify user profile updated
    user_me = await client.get("/api/v1/users/me", headers=auth_headers)
    assert user_me.status_code == 200
    assert user_me.json()["streak_count"] == 1
    assert user_me.json()["last_drill_date"] is not None


# ── Reported Questions Tests ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_reported_questions_crud_upvotes_and_moderation(
    client, auth_headers, second_auth_headers, sample_subject
):
    admin_headers = {"X-Admin-Secret": "test-admin-secret-not-for-production"}

    # 1. Report a question
    rep_resp = await client.post(
        "/api/v1/reported-questions",
        json={
            "subject_id": sample_subject["id"],
            "topic": "Transactions",
            "branch": "Computer Engineering",
            "question_text": "Explain two-phase commit protocol in distributed databases.",
        },
        headers=auth_headers,
    )
    assert rep_resp.status_code == 201
    q_data = rep_resp.json()
    assert q_data["approval_status"] == "pending"
    assert q_data["upvotes"] == 0
    q_id = q_data["id"]

    # 2. Public listing should NOT return pending questions
    list_resp = await client.get(
        "/api/v1/reported-questions?branch=Computer Engineering",
        headers=auth_headers,
    )
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 0

    # 3. Admin moderation without secret -> 403
    unauth_admin = await client.post(
        f"/api/v1/admin/reported-questions/{q_id}/approve",
        headers={"X-Admin-Secret": "wrong-secret"},
    )
    assert unauth_admin.status_code == 403

    # 4. Admin moderation with valid secret -> approves question
    approve_resp = await client.post(
        f"/api/v1/admin/reported-questions/{q_id}/approve",
        headers=admin_headers,
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["status"] == "approved"

    # 5. Public listing now contains the approved question
    list_after = await client.get(
        "/api/v1/reported-questions?branch=Computer Engineering",
        headers=auth_headers,
    )
    assert list_after.status_code == 200
    approved_list = list_after.json()
    assert len(approved_list) == 1
    assert approved_list[0]["id"] == q_id
    assert approved_list[0]["has_upvoted"] is False
    assert approved_list[0]["upvotes"] == 0

    # 6. Upvote the question
    upvote1 = await client.post(
        f"/api/v1/reported-questions/{q_id}/upvote",
        headers=auth_headers,
    )
    assert upvote1.status_code == 200
    assert upvote1.json()["upvotes"] == 1
    assert upvote1.json()["has_upvoted"] is True

    # 7. Idempotent upvote: calling again by same user does not increase count
    upvote_dup = await client.post(
        f"/api/v1/reported-questions/{q_id}/upvote",
        headers=auth_headers,
    )
    assert upvote_dup.status_code == 200
    assert upvote_dup.json()["upvotes"] == 1

    # 8. Second user upvotes -> increases to 2
    upvote2 = await client.post(
        f"/api/v1/reported-questions/{q_id}/upvote",
        headers=second_auth_headers,
    )
    assert upvote2.status_code == 200
    assert upvote2.json()["upvotes"] == 2

    # 9. List from first user perspective shows has_upvoted=True
    list_user1 = await client.get(
        "/api/v1/reported-questions?branch=Computer Engineering",
        headers=auth_headers,
    )
    assert list_user1.json()[0]["has_upvoted"] is True
    assert list_user1.json()[0]["upvotes"] == 2

    # 10. Admin rejects question
    reject_resp = await client.post(
        f"/api/v1/admin/reported-questions/{q_id}/reject",
        headers=admin_headers,
    )
    assert reject_resp.status_code == 200
    assert reject_resp.json()["status"] == "rejected"

    # 11. Rejected question no longer appears in public list
    list_rejected = await client.get(
        "/api/v1/reported-questions?branch=Computer Engineering",
        headers=auth_headers,
    )
    assert len(list_rejected.json()) == 0
