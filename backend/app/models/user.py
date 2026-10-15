"""
User model — stores account info, profile, streak, and exam date.
Profile fields are editable at any time (not a one-time irreversible choice).
"""
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
import app.models.college  # noqa: F401


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # Profile — all nullable; profile_complete=True once all required fields are set
    # FK to colleges.id — College model defined in app/models/college.py
    college_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("colleges.id"), nullable=True
    )
    branch: Mapped[str | None] = mapped_column(String(100), nullable=True)
    branch_other: Mapped[str | None] = mapped_column(String(100), nullable=True)
    academic_year: Mapped[str | None] = mapped_column(String(10), nullable=True)
    syllabus_mode: Mapped[str | None] = mapped_column(String(20), nullable=True)  # sppu | college_own
    exam_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    profile_complete: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Streak tracking
    streak_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_drill_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships (populated in later groups)
    # college: relationship back-populated from College model
