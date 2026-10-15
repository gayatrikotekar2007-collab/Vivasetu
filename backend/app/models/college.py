"""
College model and autonomy correction model.

IMPORTANT: autonomy status (is_autonomous) is NULLABLE and CORRECTABLE.
- NULL  = unknown / not yet verified
- True  = autonomous college
- False = SPPU-affiliated

The seed list is illustrative only. Autonomy status changes over time
(e.g. COEP became a fully independent deemed university and is no longer
SPPU-affiliated at all). Never treat seeded values as permanent ground truth.
"""
import re
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ApprovalStatusEnum
import app.models.user  # noqa: F401


def _normalize(name: str) -> str:
    """Lowercase + strip punctuation for fuzzy search."""
    return re.sub(r"[^a-z0-9\s]", "", name.lower()).strip()


class College(Base):
    __tablename__ = "colleges"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    # NULL = unknown; True = autonomous; False = SPPU-affiliated.
    # This is correctable — never treat it as permanent ground truth.
    is_autonomous: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    sppu_college_code: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False, default="Pune")
    verified_by_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    added_by_user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    corrections: Mapped[list["CollegeAutonomyCorrection"]] = relationship(
        back_populates="college", cascade="all, delete-orphan"
    )


class CollegeAutonomyCorrection(Base):
    __tablename__ = "college_autonomy_corrections"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    college_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("colleges.id"), nullable=False, index=True
    )
    reported_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )
    suggested_value: Mapped[bool] = mapped_column(Boolean, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=ApprovalStatusEnum.PENDING
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    college: Mapped[College] = relationship(back_populates="corrections")
