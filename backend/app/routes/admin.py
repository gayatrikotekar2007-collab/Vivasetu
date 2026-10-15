"""
Admin routes — protected by X-Admin-Secret header.
Lightweight shared-secret pattern (not a full role system).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_admin
from app.models.college import College, CollegeAutonomyCorrection
from app.models.enums import ApprovalStatusEnum

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/college-autonomy-corrections/{correction_id}/approve")
def approve_autonomy_correction(
    correction_id: str,
    db: Session = Depends(get_db),
    _: bool = Depends(get_admin),
):
    """Approve a college autonomy correction and apply it to the college record."""
    correction = db.get(CollegeAutonomyCorrection, correction_id)
    if not correction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Correction not found.")

    correction.status = ApprovalStatusEnum.APPROVED
    college = db.get(College, correction.college_id)
    if college:
        college.is_autonomous = correction.suggested_value
        college.verified_by_admin = True
    db.commit()
    return {"status": "approved", "college_id": correction.college_id}


@router.post("/college-autonomy-corrections/{correction_id}/reject")
def reject_autonomy_correction(
    correction_id: str,
    db: Session = Depends(get_db),
    _: bool = Depends(get_admin),
):
    """Reject a college autonomy correction."""
    correction = db.get(CollegeAutonomyCorrection, correction_id)
    if not correction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Correction not found.")

    correction.status = ApprovalStatusEnum.REJECTED
    db.commit()
    return {"status": "rejected"}


@router.delete("/notes/{note_id}")
def delete_notes_document(
    note_id: str,
    db: Session = Depends(get_db),
    _: bool = Depends(get_admin),
):
    """
    Soft-delete a notes document (sets is_active=False).
    Does not destroy the record. Protected by X-Admin-Secret.
    """
    from app.models.notes import NotesDocument

    doc = db.get(NotesDocument, note_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notes document not found.")

    doc.is_active = False
    db.commit()
    return {"status": "deleted", "id": note_id}


@router.post("/reported-questions/{question_id}/approve")
def approve_reported_question(
    question_id: str,
    db: Session = Depends(get_db),
    _: bool = Depends(get_admin),
):
    """Approve a crowdsourced viva question so it appears publicly."""
    from app.models.questions import ReportedQuestion

    question = db.get(ReportedQuestion, question_id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

    question.approval_status = "approved"
    db.commit()
    return {"status": "approved", "id": question_id}


@router.post("/reported-questions/{question_id}/reject")
def reject_reported_question(
    question_id: str,
    db: Session = Depends(get_db),
    _: bool = Depends(get_admin),
):
    """Reject a crowdsourced viva question."""
    from app.models.questions import ReportedQuestion

    question = db.get(ReportedQuestion, question_id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

    question.approval_status = "rejected"
    db.commit()
    return {"status": "rejected", "id": question_id}


@router.post("/seed-demo-account")
def seed_demo_endpoint(
    db: Session = Depends(get_db),
    _: bool = Depends(get_admin),
):
    """
    Seed a fully populated demo student account (demo@vivasetu.edu)
    with PICT college, SE Computer Engineering curriculum, 3 real completed viva sessions,
    active streak, and topic mastery.
    """
    from seed.demo_seed import seed_demo_account
    result = seed_demo_account(db)
    return result



