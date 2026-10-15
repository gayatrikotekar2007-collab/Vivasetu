"""Subject routes: branches list, subjects list, and suggest subject."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.branch import Branch
from app.models.enums import AcademicYearEnum
from app.models.subject import Subject
from app.models.user import User
from app.schemas.subject import BranchResponse, SubjectResponse, SuggestSubjectRequest

router = APIRouter(prefix="/subjects", tags=["subjects"])

# Subjects alternating across divisions/groups between Sem 1 and Sem 2 in SPPU FE
FE_SPLIT_SUBJECT_NAMES = {
    "Engineering Physics",
    "Engineering Chemistry",
    "Basic Electrical Engineering",
    "Basic Electronics Engineering",
    "Engineering Mechanics",
    "Engineering Graphics",
    "Systems in Mechanical Engineering",
}


@router.get("/branches", response_model=list[BranchResponse])
def list_branches(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    List all 24 engineering branches.
    Each branch indicates whether it currently has an active curriculum (has_curriculum).
    """
    branches = db.query(Branch).order_by(Branch.name.asc()).all()

    # Pre-fetch distinct branch names that have at least one subject
    branches_with_subjects = set(
        db.query(Subject.branch)
        .filter(Subject.branch.isnot(None))
        .distinct()
        .all()
    )
    # unpack tuple results
    active_branch_names = {b[0] for b in branches_with_subjects if b[0]}

    response = []
    for b in branches:
        has_curr = b.name in active_branch_names
        response.append(
            BranchResponse(
                id=b.id,
                name=b.name,
                is_active=b.is_active,
                has_curriculum=has_curr,
            )
        )
    return response


@router.get("", response_model=list[SubjectResponse])
def list_subjects(
    year: AcademicYearEnum = Query(...),
    branch: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    List subjects scoped by year, optional branch, and optional semester.
    - For FE: branch-independent common curriculum.
    - If FE and semester=2: includes core Sem 2 subjects plus SPPU alternating group subjects.
    - For SE/TE/BE: filtered by branch and semester.
    """
    query = db.query(Subject).filter(Subject.academic_year == year.value)

    if year == AcademicYearEnum.FE:
        # FE curriculum is common across branches
        if semester == 1:
            query = query.filter(Subject.semester == 1)
            subjects = query.order_by(Subject.is_verified.desc(), Subject.name.asc()).all()
            return subjects
        elif semester == 2:
            # Sem 2 subjects PLUS the alternating group subjects from Sem 1
            sem2_query = db.query(Subject).filter(
                Subject.academic_year == "FE",
                or_(
                    Subject.semester == 2,
                    Subject.name.in_(FE_SPLIT_SUBJECT_NAMES),
                ),
            )
            # Deduplicate by subject name
            seen_names = set()
            unique_subjects = []
            for s in sem2_query.order_by(Subject.semester.asc(), Subject.name.asc()).all():
                if s.name not in seen_names:
                    seen_names.add(s.name)
                    unique_subjects.append(s)
            return unique_subjects
        else:
            return query.order_by(Subject.semester.asc(), Subject.name.asc()).all()

    # Non-FE: filter by branch if provided
    if branch:
        branch_str = branch.value if hasattr(branch, "value") else str(branch)
        query = query.filter(Subject.branch == branch_str)

    if semester is not None:
        query = query.filter(Subject.semester == semester)

    return query.order_by(Subject.is_verified.desc(), Subject.name.asc()).all()


@router.post("/suggest", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def suggest_subject(
    request: SuggestSubjectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Suggest a missing subject. Appears immediately with is_verified=False.
    Not hidden pending moderation — shown with an UNVERIFIED label.
    """
    branch_val = None
    if request.branch:
        branch_val = request.branch.value if hasattr(request.branch, "value") else str(request.branch)

    # Check for duplicate
    query = db.query(Subject).filter(
        Subject.name == request.name,
        Subject.academic_year == request.academic_year.value,
    )
    if branch_val:
        query = query.filter(Subject.branch == branch_val)
    else:
        query = query.filter(Subject.branch.is_(None))

    if request.semester:
        query = query.filter(Subject.semester == request.semester)

    existing = query.first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This subject already exists for the given branch, year, and semester.",
        )

    subject = Subject(
        name=request.name,
        branch=branch_val,
        academic_year=request.academic_year.value,
        semester=request.semester,
        is_verified=False,
        added_by_user_id=current_user.id,
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject
