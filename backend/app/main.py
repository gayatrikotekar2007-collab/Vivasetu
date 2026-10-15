"""
FastAPI application factory.

LIFESPAN HANDLER — database initialization happens here and ONLY here.
Importing this module does NOT create any database connection.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: create engine → wire session factory → create_all tables → seed.
    Shutdown: dispose engine.

    This is the ONLY place database initialization runs.
    It does NOT run during module import — only on real app startup.
    """
    from app.core.database import (
        Base,
        apply_schema_patches,
        create_engine_from_url,
        reset_session_factory,
    )

    # Import ALL models so their tables are registered with Base.metadata
    # before create_all is called. Order matters for FK dependencies.
    import app.models.user       # noqa: F401
    import app.models.branch     # noqa: F401
    import app.models.college    # noqa: F401
    import app.models.subject    # noqa: F401
    import app.models.session    # noqa: F401
    import app.models.notes      # noqa: F401
    import app.models.mastery    # noqa: F401
    import app.models.questions  # noqa: F401

    engine = create_engine_from_url(settings.DATABASE_URL)
    reset_session_factory(engine)
    Base.metadata.create_all(bind=engine)
    apply_schema_patches(engine)

    # Seed data (no-ops if tables already populated)
    from app.core.database import _state
    db = _state["session_factory"]()
    try:
        from seed.colleges import seed_colleges
        from seed.subjects import seed_subjects
        seed_colleges(db)
        seed_subjects(db)
    finally:
        db.close()

    yield

    engine.dispose()


def create_app() -> FastAPI:
    from slowapi.errors import RateLimitExceeded
    from app.core.dependencies import limiter, rate_limit_exceeded_handler

    app = FastAPI(
        title="VivaSetu API",
        description="Viva practice simulator for SPPU engineering students",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from app.routes import admin, auth, colleges, health, mastery, notes, questions, sessions, subjects, users

    app.include_router(health.router)
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(users.router, prefix="/api/v1")
    app.include_router(colleges.router, prefix="/api/v1")
    app.include_router(subjects.router, prefix="/api/v1")
    app.include_router(sessions.router, prefix="/api/v1")
    app.include_router(sessions.drill_router, prefix="/api/v1")
    app.include_router(notes.router, prefix="/api/v1")
    app.include_router(mastery.router, prefix="/api/v1")
    app.include_router(questions.router, prefix="/api/v1")
    app.include_router(admin.router, prefix="/api/v1")

    return app


app = create_app()
