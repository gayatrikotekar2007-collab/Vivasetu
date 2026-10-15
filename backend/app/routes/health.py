"""
Health check endpoint — no authentication required.
Returns app status, AI mock mode flag, and DB connectivity.
"""
from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    """
    Returns:
      status: always "ok" if the app is running
      ai_mock_mode: True when GROQ_API_KEY is not configured (demo mode)
      db_ok: True if the database is reachable
    """
    db_ok = _check_db()
    return {
        "status": "ok",
        "ai_mock_mode": settings.is_mock_ai,
        "db_ok": db_ok,
    }


def _check_db() -> bool:
    """Attempt a lightweight DB ping. Returns False (not 500) if unreachable."""
    try:
        from app.core.database import _state
        factory = _state.get("session_factory")
        if factory is None:
            return False
        from sqlalchemy import text
        session = factory()
        try:
            session.execute(text("SELECT 1"))
            return True
        finally:
            session.close()
    except Exception:
        return False
