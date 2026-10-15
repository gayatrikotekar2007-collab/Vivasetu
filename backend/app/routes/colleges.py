"""
College routes: search, add, report autonomy correction.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.college import College, CollegeAutonomyCorrection, _normalize
from app.models.user import User
from app.schemas.college import (
    AutonomyCorrectionResponse,
    CollegeResponse,
    CreateCollegeRequest,
    ReportAutonomyRequest,
)

router = APIRouter(prefix="/colleges", tags=["colleges"])


@router.get("/search", response_model=list[CollegeResponse])
def search_colleges(
    q: str = Query(..., min_length=2, description="Search term (min 2 chars)"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Case-insensitive substring search on normalized college name. Max 10 results."""
    normalized_q = _normalize(q)
    results = (
        db.query(College)
        .filter(College.normalized_name.contains(normalized_q))
        .limit(10)
        .all()
    )
    return results


@router.post("", response_model=CollegeResponse, status_code=status.HTTP_201_CREATED)
def create_college(
    request: CreateCollegeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a college that doesn't exist yet. Marked as unverified."""
    normalized = _normalize(request.name)
    # Prevent exact duplicates
    existing = db.query(College).filter(College.normalized_name == normalized).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A college with this name already exists.",
        )
    college = College(
        name=request.name,
        normalized_name=normalized,
        city=request.city,
        sppu_college_code=request.sppu_college_code,
        is_autonomous=None,  # Unknown until admin verifies
        verified_by_admin=False,
        added_by_user_id=current_user.id,
    )
    db.add(college)
    db.commit()
    db.refresh(college)
    return college


@router.post("/{college_id}/report-autonomy", response_model=AutonomyCorrectionResponse, status_code=status.HTTP_201_CREATED)
def report_autonomy(
    college_id: str,
    request: ReportAutonomyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a correction request for a college's autonomy status."""
    college = db.get(College, college_id)
    if not college:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="College not found.")

    correction = CollegeAutonomyCorrection(
        college_id=college_id,
        reported_by=current_user.id,
        suggested_value=request.is_autonomous,
        reason=request.reason,
    )
    db.add(correction)
    db.commit()
    db.refresh(correction)
    return correction
