"""Mastery routes — student topic mastery tracking."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.mastery import TopicMastery
from app.models.user import User
from app.schemas.mastery import TopicMasteryResponse

router = APIRouter(prefix="/users/me/mastery", tags=["mastery"])


@router.get("", response_model=list[TopicMasteryResponse])
def get_user_mastery(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns all topic mastery records for the authenticated user,
    sorted by next_review_due ascending (most overdue / urgent first).
    """
    return (
        db.query(TopicMastery)
        .filter(TopicMastery.user_id == current_user.id)
        .order_by(TopicMastery.next_review_due.asc())
        .all()
    )
