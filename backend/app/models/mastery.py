"""
TopicMastery model — tracks student mastery per topic across viva sessions.

Mastery score is updated using an exponentially weighted moving average after
each scored viva session. Reviews are scheduled using spaced repetition bands.
"""
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
import app.models.subject  # noqa: F401
import app.models.user     # noqa: F401


class TopicMastery(Base):
    __tablename__ = "topic_mastery"
    __table_args__ = (
        UniqueConstraint("user_id", "topic_name", "subject_id", name="uq_user_topic_subject"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    topic_name: Mapped[str] = mapped_column(String(255), nullable=False)
    branch: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    subject_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("subjects.id"), nullable=False, index=True
    )
    mastery_score: Mapped[float] = mapped_column(Float, nullable=False, default=50.0)
    session_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_practiced_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    next_review_due: Mapped[date] = mapped_column(Date, nullable=False, index=True)
