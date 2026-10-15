"""
Reported questions routes — crowdsourced questions from real viva exams.

Authenticated students report questions (default pending).
Public list returns only approved questions, sorted by upvotes descending.
Upvotes are tracked via ReportedQuestionUpvote to ensure idempotency.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.enums import BranchEnum
from app.models.questions import ReportedQuestion, ReportedQuestionUpvote
from app.models.user import User
from app.schemas.questions import ReportedQuestionResponse, ReportQuestionRequest

router = APIRouter(prefix="/reported-questions", tags=["questions"])


@router.post("", response_model=ReportedQuestionResponse, status_code=status.HTTP_201_CREATED)
def report_question(
    request: ReportQuestionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Report a question encountered in a real viva.
    Saved with approval_status='pending' and requires admin moderation before appearing publicly.
    """
    question = ReportedQuestion(
        subject_id=request.subject_id,
        topic=request.topic,
        college_id=request.college_id or current_user.college_id,
        branch=request.branch.value if hasattr(request.branch, "value") else str(request.branch),
        question_text=request.question_text,
        upvotes=0,
        approval_status="pending",
        reported_by_user_id=current_user.id,
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    return ReportedQuestionResponse(
        id=question.id,
        subject_id=question.subject_id,
        topic=question.topic,
        college_id=question.college_id,
        branch=question.branch,
        question_text=question.question_text,
        upvotes=question.upvotes,
        approval_status=question.approval_status,
        created_at=question.created_at,
        has_upvoted=False,
    )


@router.get("", response_model=list[ReportedQuestionResponse])
def get_reported_questions(
    branch: Optional[str] = Query(None),
    subject_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all approved reported questions, filtered by branch and/or subject.
    Sorted by upvotes descending.
    has_upvoted is True if the current user has already upvoted this question.
    """
    query = db.query(ReportedQuestion).filter(ReportedQuestion.approval_status == "approved")

    if branch:
        branch_str = branch.value if hasattr(branch, "value") else branch
        query = query.filter(ReportedQuestion.branch == branch_str)
    if subject_id:
        query = query.filter(ReportedQuestion.subject_id == subject_id)

    questions = query.order_by(ReportedQuestion.upvotes.desc(), ReportedQuestion.created_at.desc()).all()

    # Find which questions current user has upvoted
    upvoted_ids = {
        row[0]
        for row in db.query(ReportedQuestionUpvote.question_id)
        .filter(ReportedQuestionUpvote.user_id == current_user.id)
        .all()
    }

    return [
        ReportedQuestionResponse(
            id=q.id,
            subject_id=q.subject_id,
            topic=q.topic,
            college_id=q.college_id,
            branch=q.branch,
            question_text=q.question_text,
            upvotes=q.upvotes,
            approval_status=q.approval_status,
            created_at=q.created_at,
            has_upvoted=q.id in upvoted_ids,
        )
        for q in questions
    ]


@router.post("/{question_id}/upvote")
def upvote_question(
    question_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upvote a reported question.
    Idempotent: if already upvoted by this user, returns 200 without double-counting.
    """
    question = db.get(ReportedQuestion, question_id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

    existing_upvote = db.get(ReportedQuestionUpvote, (current_user.id, question_id))
    if not existing_upvote:
        upvote = ReportedQuestionUpvote(user_id=current_user.id, question_id=question_id)
        db.add(upvote)
        question.upvotes += 1
        db.commit()
        db.refresh(question)

    return {
        "status": "ok",
        "question_id": question.id,
        "upvotes": question.upvotes,
        "has_upvoted": True,
    }
