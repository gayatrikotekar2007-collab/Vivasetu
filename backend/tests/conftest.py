"""
Test infrastructure — canonical FastAPI dependency override pattern.

Instead of trying to wire a module-level session factory (fragile across
multiple test file imports), we override the get_db FastAPI dependency
directly on the app instance. This is the recommended FastAPI testing approach.

The in-memory SQLite engine uses StaticPool so all connections share the
same in-memory database.
"""
import os

# Set required env vars BEFORE any app module is imported.
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["JWT_SECRET_KEY"] = "test-only-fake-jwt-secret-do-not-use-in-production"
os.environ["ADMIN_SECRET"] = "test-admin-secret-not-for-production"
os.environ["GROQ_API_KEY"] = ""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Import app modules AFTER env vars are set
from app.core.database import Base, get_db
import app.models.user       # noqa: F401
import app.models.branch     # noqa: F401
import app.models.college    # noqa: F401
import app.models.subject    # noqa: F401
import app.models.session    # noqa: F401
import app.models.notes      # noqa: F401
import app.models.mastery    # noqa: F401
import app.models.questions  # noqa: F401

# ── Shared in-memory engine (StaticPool = same connection everywhere) ─────────
TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
Base.metadata.create_all(bind=TEST_ENGINE)

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)


def override_get_db():
    """Dependency override — yields a session bound to the test engine."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Apply the override to the app — this persists for the entire test session
from app.main import app
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def clean_tables():
    """Delete all rows after each test in FK-safe order."""
    yield
    with TEST_ENGINE.connect() as conn:
        table_names = [
            "reported_question_upvotes",
            "reported_questions",
            "drill_turns",
            "drill_sessions",
            "topic_mastery",
            "notes_documents",
            "session_turns", "viva_sessions",
            "college_autonomy_corrections", "subjects",
            "colleges", "users",
        ]
        for name in table_names:
            table = Base.metadata.tables.get(name)
            if table is not None:
                conn.execute(table.delete())
        conn.commit()


@pytest.fixture
def db():
    """Yield a DB session for direct row manipulation in tests."""
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest_asyncio.fixture
async def client():
    """Async HTTP test client with dependency overrides applied."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as ac:
        yield ac


# ── Helper fixtures ────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def registered_user(client):
    resp = await client.post("/api/v1/auth/register", json={
        "email": "testuser@example.com",
        "password": "testpassword123",
        "full_name": "Test User",
    })
    assert resp.status_code == 201, f"Register failed: {resp.text}"
    return {"token": resp.json()["access_token"], "email": "testuser@example.com"}


@pytest_asyncio.fixture
async def auth_headers(registered_user):
    return {"Authorization": f"Bearer {registered_user['token']}"}


@pytest_asyncio.fixture
async def second_user(client):
    resp = await client.post("/api/v1/auth/register", json={
        "email": "second@example.com",
        "password": "secondpassword123",
        "full_name": "Second User",
    })
    assert resp.status_code == 201, f"Second register failed: {resp.text}"
    return {"token": resp.json()["access_token"], "email": "second@example.com"}


@pytest_asyncio.fixture
async def second_auth_headers(second_user):
    return {"Authorization": f"Bearer {second_user['token']}"}
