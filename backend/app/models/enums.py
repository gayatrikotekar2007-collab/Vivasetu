"""
Shared enums used across models and schemas.
All are str enums so SQLAlchemy stores them as plain strings.
"""
from enum import Enum


class BranchEnum(str, Enum):
    COMPUTER = "Computer Engineering"
    IT = "Information Technology"
    ENTC = "Electronics & Telecommunication"
    AI_ML = "AI & ML"
    AI_DS = "AI & Data Science"
    MECHANICAL = "Mechanical Engineering"
    CIVIL = "Civil Engineering"
    ELECTRICAL = "Electrical Engineering"
    OTHER = "Other"


class AcademicYearEnum(str, Enum):
    FE = "FE"
    SE = "SE"
    TE = "TE"
    BE = "BE"


class DifficultyEnum(str, Enum):
    FRIENDLY = "Friendly"
    STRICT = "Strict"
    BRUTAL = "Brutal"


class SyllabusModeEnum(str, Enum):
    SPPU = "sppu"
    COLLEGE_OWN = "college_own"


class ApprovalStatusEnum(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
