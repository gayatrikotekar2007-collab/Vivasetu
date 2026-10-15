"""
VivaSession and SessionTurn models.
DrillSession added in Group 4.
"""
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
import app.models.subject  # noqa: F401
import app.models.user     # noqa: F401


class VivaSession(Base):
    __tablename__ = "viva_sessions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    subject_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("subjects.id"), nullable=False
    )
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    question_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # mock_mode is set at session creation and never changes for that session.
    # The frontend MUST show the MockModeBanner whenever this is True.
    mock_mode: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    turns: Mapped[list["SessionTurn"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="SessionTurn.turn_index",
    )


class SessionTurn(Base):
    __tablename__ = "session_turns"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("viva_sessions.id"), nullable=False, index=True
    )
    turn_index: Mapped[int] = mapped_column(Integer, nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    session: Mapped[VivaSession] = relationship(back_populates="turns")


class DrillSession(Base):
    __tablename__ = "drill_sessions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    drill_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    question_count: Mapped[int] = mapped_column(Integer, nullable=False, default=5)

    turns: Mapped[list["DrillTurn"]] = relationship(
        back_populates="drill",
        cascade="all, delete-orphan",
        order_by="DrillTurn.turn_index",
    )


class DrillTurn(Base):
    __tablename__ = "drill_turns"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    drill_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("drill_sessions.id"), nullable=False, index=True
    )
    turn_index: Mapped[int] = mapped_column(Integer, nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    drill: Mapped[DrillSession] = relationship(back_populates="turns")
