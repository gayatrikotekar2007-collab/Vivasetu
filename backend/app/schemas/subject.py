"""Subject schemas (Pydantic v2)."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import AcademicYearEnum


class BranchResponse(BaseModel):
    id: str
    name: str
    is_active: bool
    has_curriculum: bool = False

    model_config = {"from_attributes": True}


class SubjectResponse(BaseModel):
    id: str
    name: str
    branch: Optional[str] = None
    academic_year: str
    semester: Optional[int] = None
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SuggestSubjectRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    branch: Optional[str] = None
    academic_year: AcademicYearEnum
    semester: Optional[int] = None
