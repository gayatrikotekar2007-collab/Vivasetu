"""
Auth endpoint tests — register, login, profile access.
"""
import pytest


@pytest.mark.asyncio
async def test_register_success(client):
    response = await client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "password": "securepassword",
        "full_name": "New User",
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    payload = {
        "email": "duplicate@example.com",
        "password": "securepassword",
        "full_name": "Dup User",
    }
    r1 = await client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201

    r2 = await client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 409
    assert "already exists" in r2.json()["detail"]


@pytest.mark.asyncio
async def test_register_short_password(client):
    response = await client.post("/api/v1/auth/register", json={
        "email": "shortpw@example.com",
        "password": "short",
        "full_name": "Short PW",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_invalid_email(client):
    response = await client.post("/api/v1/auth/register", json={
        "email": "not-an-email",
        "password": "validpassword",
        "full_name": "Bad Email",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client, registered_user):
    response = await client.post("/api/v1/auth/login", json={
        "email": registered_user["email"],
        "password": "testpassword123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client, registered_user):
    response = await client.post("/api/v1/auth/login", json={
        "email": registered_user["email"],
        "password": "wrongpassword",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client):
    response = await client.post("/api/v1/auth/login", json={
        "email": "nobody@example.com",
        "password": "somepassword",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_authenticated(client, auth_headers):
    response = await client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert "hashed_password" not in data
    assert data["profile_complete"] is False


@pytest.mark.asyncio
async def test_get_me_no_token(client):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_invalid_token(client):
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer totally-invalid-token"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_profile(client, auth_headers):
    response = await client.patch("/api/v1/users/me/profile", json={
        "branch": "Computer Engineering",
        "academic_year": "BE",
        "syllabus_mode": "sppu",
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["branch"] == "Computer Engineering"
    assert data["academic_year"] == "BE"
    # profile_complete still False — college_id not set yet
    assert data["profile_complete"] is False


@pytest.mark.asyncio
async def test_update_profile_invalid_branch(client, auth_headers):
    response = await client.patch("/api/v1/users/me/profile", json={
        "branch": "InvalidBranch",
    }, headers=auth_headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_profile_invalid_year(client, auth_headers):
    response = await client.patch("/api/v1/users/me/profile", json={
        "academic_year": "GE",
    }, headers=auth_headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "ai_mock_mode" in data
    assert "db_ok" in data
    # In test mode, GROQ_API_KEY is empty so mock mode should be True
    assert data["ai_mock_mode"] is True
