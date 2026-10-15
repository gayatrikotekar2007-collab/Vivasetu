"""College endpoint tests."""
import pytest


@pytest.mark.asyncio
async def test_search_colleges_returns_results(client, auth_headers):
    # Add a college first
    await client.post("/api/v1/colleges", json={"name": "Vishwakarma Institute of Technology"}, headers=auth_headers)
    resp = await client.get("/api/v1/colleges/search?q=vishwa", headers=auth_headers)
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) >= 1
    assert any("Vishwakarma" in r["name"] for r in results)


@pytest.mark.asyncio
async def test_search_colleges_empty(client, auth_headers):
    resp = await client.get("/api/v1/colleges/search?q=xyznonexistent", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_search_requires_auth(client):
    resp = await client.get("/api/v1/colleges/search?q=test")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_add_new_college(client, auth_headers):
    resp = await client.post("/api/v1/colleges", json={"name": "My Test College Pune"}, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "My Test College Pune"
    assert data["verified_by_admin"] is False
    assert data["is_autonomous"] is None  # Unknown until verified


@pytest.mark.asyncio
async def test_add_duplicate_college(client, auth_headers):
    payload = {"name": "Duplicate College Pune"}
    r1 = await client.post("/api/v1/colleges", json=payload, headers=auth_headers)
    assert r1.status_code == 201
    r2 = await client.post("/api/v1/colleges", json=payload, headers=auth_headers)
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_report_autonomy_correction(client, auth_headers):
    # Create college
    college_resp = await client.post(
        "/api/v1/colleges", json={"name": "Correction Test College"}, headers=auth_headers
    )
    college_id = college_resp.json()["id"]

    # Report correction
    resp = await client.post(
        f"/api/v1/colleges/{college_id}/report-autonomy",
        json={"is_autonomous": True, "reason": "This college was granted autonomous status last year."},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["suggested_value"] is True
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_admin_approve_autonomy(client, auth_headers):
    college_resp = await client.post(
        "/api/v1/colleges", json={"name": "Admin Approve College"}, headers=auth_headers
    )
    college_id = college_resp.json()["id"]
    correction_resp = await client.post(
        f"/api/v1/colleges/{college_id}/report-autonomy",
        json={"is_autonomous": True, "reason": "Confirmed autonomous."},
        headers=auth_headers,
    )
    correction_id = correction_resp.json()["id"]

    # Approve via admin endpoint
    resp = await client.post(
        f"/api/v1/admin/college-autonomy-corrections/{correction_id}/approve",
        headers={"X-Admin-Secret": "test-admin-secret-not-for-production"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "approved"


@pytest.mark.asyncio
async def test_admin_wrong_secret(client, auth_headers):
    college_resp = await client.post(
        "/api/v1/colleges", json={"name": "Wrong Secret College"}, headers=auth_headers
    )
    assert college_resp.status_code == 201
    college_id = college_resp.json()["id"]
    correction_resp = await client.post(
        f"/api/v1/colleges/{college_id}/report-autonomy",
        json={"is_autonomous": False, "reason": "test correction reason"},
        headers=auth_headers,
    )
    assert correction_resp.status_code == 201
    correction_id = correction_resp.json()["id"]
    resp = await client.post(
        f"/api/v1/admin/college-autonomy-corrections/{correction_id}/approve",
        headers={"X-Admin-Secret": "wrong-secret"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_add_college_with_sppu_code(client, auth_headers):
    resp = await client.post(
        "/api/v1/colleges",
        json={"name": "Code Test College", "sppu_college_code": "06999"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Code Test College"
    assert data["sppu_college_code"] == "06999"

