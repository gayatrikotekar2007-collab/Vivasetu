"""Topic mastery schemas (Pydantic v2)."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class TopicMasteryResponse(BaseModel):
    id: str
    topic_name: str
    branch: str
    subject_id: str
    mastery_score: float
    session_count: int
    last_practiced_at: Optional[datetime] = None
    next_review_due: date

    model_config = {"from_attributes": True}
