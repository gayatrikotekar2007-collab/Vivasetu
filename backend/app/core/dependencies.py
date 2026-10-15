"""
FastAPI shared dependencies:
  - get_db: yields a database session
  - get_current_user: decodes JWT and returns the authenticated User
  - get_admin: validates X-Admin-Secret header
  - limiter: slowapi rate limiter keyed by authenticated user
"""
import time
from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_user_rate_limit_key(request: Request) -> str:
    """
    Key rate limiting by authenticated user ID (extracted from Bearer token),
    falling back to client IP address if unauthenticated.
    """
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_access_token(token)
            user_id = payload.get("sub")
            if user_id:
                return f"user:{user_id}"
        except Exception:
            pass
    return get_remote_address(request)


limiter = Limiter(key_func=get_user_rate_limit_key)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    Custom 429 handler per spec:
    {"error": "rate_limit_exceeded", "retry_after_seconds": <n>}
    """
    retry_after = 60
    try:
        current_limit = getattr(request.state, "view_rate_limit", None)
        if current_limit and hasattr(request.app.state, "limiter"):
            limiter_instance = request.app.state.limiter
            window_stats = limiter_instance.limiter.get_window_stats(current_limit[0], *current_limit[1])
            reset_in = 1 + window_stats[0]
            retry_after = max(1, int(reset_in - time.time()))
    except Exception:
        pass
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "retry_after_seconds": retry_after,
        },
        headers={"Retry-After": str(retry_after)},
    )



def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Decode the JWT from the Authorization header and return the User ORM object.
    Raises HTTP 401 if the token is invalid, expired, or the user no longer exists.
    Import User here (not at module level) to avoid circular imports.
    """
    from app.models.user import User  # local import to avoid circular dependency

    payload = decode_access_token(token)
    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing subject",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_admin(x_admin_secret: str = Header(..., alias="X-Admin-Secret")) -> bool:
    """
    Validate the X-Admin-Secret header for admin endpoints.
    Returns True on success; raises HTTP 403 on mismatch.
    This is a lightweight shared-secret pattern, not a full role system.
    """
    if x_admin_secret != settings.ADMIN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin secret",
        )
    return True
