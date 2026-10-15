"""
ReportedQuestion model — crowdsourced viva questions reported by students.

Questions are submitted with 'pending' status. Only 'approved' questions appear publicly.
Upvoting is tracked via ReportedQuestionUpvote to ensure idempotency.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
import app.models.college  # noqa: F401
import app.models.subject  # noqa: F401
import app.models.user     # noqa: F401


class ReportedQuestion(Base):
    __tablename__ = "reported_questions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    subject_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("subjects.id"), nullable=False, index=True
    )
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    college_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("colleges.id"), nullable=True, index=True
    )
    branch: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    upvotes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    approval_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", index=True
    )
    reported_by_user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


class ReportedQuestionUpvote(Base):
    __tablename__ = "reported_question_upvotes"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), primary_key=True
    )
    question_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("reported_questions.id"), primary_key=True
    )
