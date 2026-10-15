"""
Database module — LIFESPAN-GATED INITIALIZATION.

CRITICAL DESIGN CONSTRAINT:
  This module MUST NOT create any SQLAlchemy engine, session, or database
  connection at import time. Doing so would cause tests (and any code that
  merely imports the app) to attempt a real DB connection before test
  isolation can be set up.

  The only module-level SQLAlchemy objects are:
    - Base: the declarative base (no connection needed to create it)
    - _session_factory: a module-level variable, starts as None

  The engine is created inside the FastAPI lifespan handler in main.py.
  Tests call reset_session_factory() with an in-memory SQLite engine.
"""
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    """Shared declarative base for all models."""
    pass


# Module-level session factory — stored in a mutable dict so it survives
# across multiple test module imports (reassigning a plain variable in a
# re-imported module loses the value; a dict key survives).
_state: dict = {"session_factory": None}


def create_engine_from_url(url: str) -> Engine:
    """
    Create a SQLAlchemy engine from a DATABASE_URL string.
    Supports SQLite (local dev) and PostgreSQL (production).
    Called only from the lifespan handler or test fixtures — never at module import.
    """
    connect_args = {}
    if url.startswith("sqlite"):
        # SQLite requires check_same_thread=False when used with multiple threads
        connect_args["check_same_thread"] = False

    return create_engine(url, connect_args=connect_args)


def create_session_factory(engine: Engine) -> sessionmaker:
    """Create a new sessionmaker bound to the given engine."""
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


def reset_session_factory(engine: Engine) -> None:
    """
    Wire the module-level session factory to the given engine.
    Uses a dict (_state) so the value persists across test module re-imports.
    """
    _state["session_factory"] = create_session_factory(engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session.
    """
    factory = _state.get("session_factory")
    if factory is None:
        raise RuntimeError(
            "Database session factory is not initialized. "
            "reset_session_factory() must be called before get_db() is used."
        )
    db: Session = factory()
    try:
        yield db
    finally:
        db.close()


def apply_schema_patches(engine: Engine) -> None:
    """
    Apply safe, idempotent schema updates for existing tables.
    Runs only after Base.metadata.create_all(bind=engine) during lifespan startup.
    Ensures missing columns and constraints are added when existing databases
    are out-of-sync with updated SQLAlchemy models.
    """
    from sqlalchemy import inspect
    insp = inspect(engine)
    dialect_name = engine.dialect.name

    with engine.begin() as conn:
        # Patch colleges table
        if insp.has_table("colleges"):
            existing_cols = {c["name"] for c in insp.get_columns("colleges")}
            if "sppu_college_code" not in existing_cols:
                conn.execute(text("ALTER TABLE colleges ADD COLUMN sppu_college_code VARCHAR(20)"))
                if dialect_name == "postgresql":
                    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_colleges_sppu_college_code ON colleges (sppu_college_code)"))

        # Patch subjects table
        if insp.has_table("subjects"):
            cols = {c["name"]: c for c in insp.get_columns("subjects")}
            if "semester" not in cols:
                conn.execute(text("ALTER TABLE subjects ADD COLUMN semester INTEGER"))
                if dialect_name == "postgresql":
                    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_subjects_semester ON subjects (semester)"))
            if "branch" in cols and not cols["branch"].get("nullable", True) and dialect_name == "postgresql":
                conn.execute(text("ALTER TABLE subjects ALTER COLUMN branch DROP NOT NULL"))
            
            if dialect_name == "postgresql":
                uqs = {u["name"] for u in insp.get_unique_constraints("subjects")}
                if "uq_subject_branch_year" in uqs:
                    conn.execute(text("ALTER TABLE subjects DROP CONSTRAINT IF EXISTS uq_subject_branch_year"))
                if "uq_subject_branch_year_sem" not in uqs:
                    conn.execute(text("ALTER TABLE subjects DROP CONSTRAINT IF EXISTS uq_subject_branch_year_sem"))
                    conn.execute(text("ALTER TABLE subjects ADD CONSTRAINT uq_subject_branch_year_sem UNIQUE (name, branch, academic_year, semester)"))

        # Patch topic_mastery table
        if insp.has_table("topic_mastery"):
            cols = {c["name"]: c for c in insp.get_columns("topic_mastery")}
            if "branch" in cols and not cols["branch"].get("nullable", True) and dialect_name == "postgresql":
                conn.execute(text("ALTER TABLE topic_mastery ALTER COLUMN branch DROP NOT NULL"))


def ping_db(engine: Engine) -> bool:
    """Lightweight health check — returns True if DB is reachable, False otherwise."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
