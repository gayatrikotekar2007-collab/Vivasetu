"""
NotesDocument model — shared lecture notes for autonomous-college syllabus tracking.

Students upload notes once; they are validated, extracted, and placed in a shared pool
per (college_id, branch, subject_id). Future students from the same college/branch/subject
are offered existing notes before being asked to upload.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
import app.models.college  # noqa: F401
import app.models.subject  # noqa: F401
import app.models.user     # noqa: F401


class NotesDocument(Base):
    __tablename__ = "notes_documents"
    __table_args__ = (
        Index(
            "ix_notes_lookup",
            "college_id",
            "branch",
            "subject_id",
            "is_active",
            "uploaded_at",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    college_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("colleges.id"), nullable=False, index=True
    )
    branch: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    subject_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("subjects.id"), nullable=False, index=True
    )
    uploader_user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    extracted_text: Mapped[str] = mapped_column(Text, nullable=False)
    word_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
