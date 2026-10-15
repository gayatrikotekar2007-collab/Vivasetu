"""
Auth and user profile schemas (Pydantic v2).
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    full_name: str = Field(..., min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    college_id: Optional[str] = None
    branch: Optional[str] = None
    branch_other: Optional[str] = None
    academic_year: Optional[str] = None
    syllabus_mode: Optional[str] = None
    exam_date: Optional[date] = None
    profile_complete: bool
    streak_count: int
    last_drill_date: Optional[date] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    college_id: Optional[str] = None
    branch: Optional[str] = None
    branch_other: Optional[str] = Field(None, max_length=100)
    academic_year: Optional[str] = None
    syllabus_mode: Optional[str] = None
    exam_date: Optional[date] = None

    @field_validator("branch")
    @classmethod
    def validate_branch(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid = {
            "Computer Engineering",
            "Information Technology",
            "Electronics and Telecommunication Engineering (E&TC)",
            "Mechanical Engineering",
            "Civil Engineering",
            "Electrical Engineering",
            "Artificial Intelligence and Data Science (AI&DS)",
            "Automation and Robotics",
            "Chemical Engineering",
            "Instrumentation and Control Engineering",
            "Biotechnology",
            "Production Engineering",
            "Metallurgy and Material Science",
            "Printing and Packaging Technology",
            "Aerospace Engineering",
            "Agricultural Engineering",
            "Automobile Engineering",
            "Biomedical Engineering",
            "Environmental Engineering",
            "Industrial Engineering",
            "Mining Engineering",
            "Petroleum Engineering",
            "Polymer Engineering",
            "Textile Engineering",
            "Electronics & Telecommunication",
            "AI & ML",
            "AI & Data Science",
            "Other",
        }
        if v not in valid:
            raise ValueError(f"Invalid branch. Must be one of: {', '.join(sorted(valid))}")
        return v

    @field_validator("academic_year")
    @classmethod
    def validate_academic_year(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid = {"FE", "SE", "TE", "BE"}
        if v not in valid:
            raise ValueError(f"Invalid academic year. Must be one of: {', '.join(sorted(valid))}")
        return v

    @field_validator("syllabus_mode")
    @classmethod
    def validate_syllabus_mode(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid = {"sppu", "college_own"}
        if v not in valid:
            raise ValueError("syllabus_mode must be 'sppu' or 'college_own'")
        return v
