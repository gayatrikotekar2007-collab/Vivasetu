"""Curriculum and branches tests."""
import pytest
from app.core.database import Base
from seed.subjects import seed_subjects


@pytest.mark.asyncio
async def test_list_branches_25_and_curriculum_flags(client, auth_headers, db):
    # Ensure seed subjects & branches are loaded into test db
    seed_subjects(db)

    resp = await client.get("/api/v1/subjects/branches", headers=auth_headers)
    assert resp.status_code == 200
    branches = resp.json()

    assert len(branches) == 25
    branch_map = {b["name"]: b["has_curriculum"] for b in branches}

    # Verify 15 active branches have curriculum
    active_branches = [
        "Computer Engineering",
        "Computer Science",
        "Computer Science & Engineering",
        "CSE (Artificial Intelligence)",
        "CSE (Data Science)",
        "AI & Machine Learning",
        "Electronics & Computer Engineering",
        "Mechatronics Engineering",
        "Robotics & Automation Engineering",
        "Robotics & Artificial Intelligence",
        "Electronics Engineering (VLSI Design & Technology)",
        "Mechanical Engineering (Sandwich)",
        "Printing & Packaging Technology",
        "Biotechnology",
        "Internet of Things",
    ]
    assert len(active_branches) == 15
    for b in active_branches:
        assert branch_map.get(b) is True, f"Expected {b} to have curriculum"

    # Verify 10 branches have no curriculum (empty states)
    empty_branches = [
        "AI & Data Science",
        "Civil Engineering",
        "Mechanical Engineering",
        "Electrical Engineering",
        "Electronics & Telecommunication",
        "Instrumentation & Control Engineering",
        "Chemical Engineering",
        "Automobile Engineering",
        "Information Technology",
        "Computer Science & Design",
    ]
    assert len(empty_branches) == 10
    for b in empty_branches:
        assert branch_map.get(b) is False, f"Expected {b} to not have curriculum"


@pytest.mark.asyncio
async def test_fe_curriculum_common_and_semesters(client, auth_headers, db):
    seed_subjects(db)

    # FE without branch specified
    resp_fe = await client.get("/api/v1/subjects?year=FE", headers=auth_headers)
    assert resp_fe.status_code == 200
    all_fe = resp_fe.json()
    assert len(all_fe) >= 16

    # Sem 1
    resp_sem1 = await client.get("/api/v1/subjects?year=FE&semester=1", headers=auth_headers)
    assert resp_sem1.status_code == 200
    sem1_subjects = resp_sem1.json()
    assert len(sem1_subjects) == 11
    sem1_names = [s["name"] for s in sem1_subjects]
    assert "Engineering Mathematics I" in sem1_names
    assert "Engineering Physics" in sem1_names
    assert "Basic Civil and Environmental Engineering" in sem1_names

    # Sem 2 includes core Sem 2 + alternating split subjects
    resp_sem2 = await client.get("/api/v1/subjects?year=FE&semester=2", headers=auth_headers)
    assert resp_sem2.status_code == 200
    sem2_subjects = resp_sem2.json()
    sem2_names = [s["name"] for s in sem2_subjects]
    assert "Engineering Mathematics II" in sem2_names
    assert "Programming and Problem Solving" in sem2_names
    # alternating subjects are available
    assert "Engineering Physics" in sem2_names or "Engineering Mechanics" in sem2_names


@pytest.mark.asyncio
async def test_se_empty_branch_returns_empty(client, auth_headers, db):
    seed_subjects(db)

    resp = await client.get(
        "/api/v1/subjects?year=SE&branch=Civil Engineering", headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_fe_user_profile_complete_without_branch(client, auth_headers):
    # Set FE profile without branch
    resp = await client.patch(
        "/api/v1/users/me/profile",
        json={
            "college_id": "test-college-id",
            "academic_year": "FE",
            "syllabus_mode": "sppu",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["branch"] is None
    assert data["academic_year"] == "FE"
    assert data["profile_complete"] is True


@pytest.mark.asyncio
async def test_se_user_profile_incomplete_without_branch(client, auth_headers):
    # Set SE profile without branch
    resp = await client.patch(
        "/api/v1/users/me/profile",
        json={
            "college_id": "test-college-id",
            "academic_year": "SE",
            "syllabus_mode": "sppu",
            "branch": None,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["profile_complete"] is False

    # Now set branch
    resp2 = await client.patch(
        "/api/v1/users/me/profile",
        json={"branch": "Mechanical Engineering"},
        headers=auth_headers,
    )
    assert resp2.status_code == 200
    assert resp2.json()["profile_complete"] is True


@pytest.mark.asyncio
async def test_seed_demo_account(client, db):
    # Call admin seed demo endpoint
    seed_subjects(db)
    resp = await client.post(
        "/api/v1/admin/seed-demo-account",
        headers={"X-Admin-Secret": "test-admin-secret-not-for-production"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["account"]["email"] == "demo@vivasetu.edu"
    assert data["account"]["streak_count"] == 5

    # Login as demo user
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "demo@vivasetu.edu", "password": "DemoPassword123!"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    demo_headers = {"Authorization": f"Bearer {token}"}

    # Verify dashboard stats
    stats_resp = await client.get("/api/v1/sessions/dashboard-stats", headers=demo_headers)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["streak_count"] == 5
    assert stats["questions_practiced"] >= 9
    assert stats["days_to_exam"] == 28
    assert len(stats["recent_sessions"]) == 3

