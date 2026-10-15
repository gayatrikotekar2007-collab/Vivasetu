"""College schemas (Pydantic v2)."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CollegeResponse(BaseModel):
    id: str
    name: str
    normalized_name: str
    is_autonomous: Optional[bool] = None
    sppu_college_code: Optional[str] = None
    city: str
    verified_by_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class CreateCollegeRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    sppu_college_code: Optional[str] = Field(default=None, max_length=20)
    city: str = Field(default="Pune", max_length=100)


class ReportAutonomyRequest(BaseModel):
    is_autonomous: bool
    reason: str = Field(..., min_length=5, max_length=500)


class AutonomyCorrectionResponse(BaseModel):
    id: str
    college_id: str
    suggested_value: bool
    reason: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
