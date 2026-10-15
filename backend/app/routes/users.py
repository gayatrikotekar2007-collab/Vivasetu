"""
User profile routes.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import UpdateProfileRequest, UserProfile

router = APIRouter(prefix="/users", tags=["users"])

# Required profile fields — all must be non-null for profile_complete=True
_REQUIRED_PROFILE_FIELDS = ("college_id", "branch", "academic_year", "syllabus_mode")


@router.get("/me", response_model=UserProfile)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    return current_user


@router.patch("/me/profile", response_model=UserProfile)
def update_profile(
    request: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update the current user's profile fields.
    Any subset of fields can be updated in a single request.
    Sets profile_complete=True once all required fields are present.
    """
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    # Determine if profile is now complete.
    # First Year (FE) is common across all programs — branch is NOT required for FE.
    # For SE/TE/BE, branch is required.
    if current_user.academic_year == "FE":
        current_user.profile_complete = (
            current_user.college_id is not None
            and current_user.academic_year is not None
            and current_user.syllabus_mode is not None
        )
    else:
        all_required_set = all(
            getattr(current_user, f) is not None for f in _REQUIRED_PROFILE_FIELDS
        )
        current_user.profile_complete = all_required_set

    db.commit()
    db.refresh(current_user)
    return current_user
