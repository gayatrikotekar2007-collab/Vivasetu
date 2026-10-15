"""
Subject model — stores subject NAMES only, scoped by branch and academic year.

IMPORTANT: Do NOT store or embed official SPPU syllabus PDFs or unit-by-unit
content here. SPPU syllabus PDFs are copyrighted and change every year.
This model stores only subject names, which are lightweight and crowdsource-correctable.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
import app.models.user  # noqa: F401


class Subject(Base):
    __tablename__ = "subjects"
    __table_args__ = (
        UniqueConstraint("name", "branch", "academic_year", "semester", name="uq_subject_branch_year_sem"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # Subject name only — no syllabus content
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    branch: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    academic_year: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    semester: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    # False for student-suggested subjects; shown immediately but labeled unverified
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    added_by_user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
