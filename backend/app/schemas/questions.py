"""Reported questions schemas (Pydantic v2)."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import BranchEnum


class ReportQuestionRequest(BaseModel):
    subject_id: str
    topic: str = Field(..., min_length=2, max_length=255)
    college_id: Optional[str] = None
    branch: str
    question_text: str = Field(..., min_length=5, max_length=1000)


class ReportedQuestionResponse(BaseModel):
    id: str
    subject_id: str
    topic: str
    college_id: Optional[str] = None
    branch: str
    question_text: str
    upvotes: int
    approval_status: str
    created_at: datetime
    has_upvoted: bool = False

    model_config = {"from_attributes": True}
