"""
Notes routes: check and upload shared notes documents.

Autonomous-college students upload notes once; they are validated and saved to the
shared pool. Future students from the same college, branch, and subject can reuse them.
"""
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.college import College
from app.models.enums import BranchEnum
from app.models.notes import NotesDocument
from app.models.subject import Subject
from app.models.user import User
from app.schemas.notes import NotesCheckResponse, NotesDocumentResponse, NotesUploadResponse
from app.services.document_service import (
    DocumentExtractor,
    DocumentTooLargeError,
    InsufficientTextError,
    UnsupportedFormatError,
)

router = APIRouter(prefix="/notes", tags=["notes"])

SHARED_DISCLOSURE_MESSAGE = (
    "This document will be shared with future students from your college in the same branch and subject."
)


@router.get("", response_model=NotesCheckResponse)
def check_notes(
    college_id: str = Query(...),
    branch: str = Query(...),
    subject_id: str = Query(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Check if notes exist for the given (college, branch, subject) triple.
    Returns the most recent active document, or exists=False.
    """
    branch_str = branch.value if hasattr(branch, "value") else str(branch)
    doc = (
        db.query(NotesDocument)
        .filter(
            NotesDocument.college_id == college_id,
            NotesDocument.branch == branch_str,
            NotesDocument.subject_id == subject_id,
            NotesDocument.is_active.is_(True),
        )
        .order_by(NotesDocument.uploaded_at.desc())
        .first()
    )
    if not doc:
        return NotesCheckResponse(exists=False, document=None)

    return NotesCheckResponse(
        exists=True,
        document=NotesDocumentResponse.model_validate(doc),
    )


@router.post("/upload", response_model=NotesUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_notes(
    file: UploadFile = File(...),
    college_id: str = Form(...),
    branch: str = Form(...),
    subject_id: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload and extract a lecture notes document (PDF, DOCX, TXT).
    Validates file size (max 10 MB) and word count (min 200 words).
    """
    # Verify college exists
    college = db.get(College, college_id)
    if not college:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="College not found.")

    # Verify subject exists
    subject = db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found.")

    file_bytes = await file.read()
    filename = file.filename or "notes.txt"

    extractor = DocumentExtractor()
    try:
        text = extractor.extract(file_bytes, filename)
    except (DocumentTooLargeError, InsufficientTextError, UnsupportedFormatError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    words = text.split()
    branch_str = branch.value if hasattr(branch, "value") else str(branch)
    doc = NotesDocument(
        college_id=college_id,
        branch=branch_str,
        subject_id=subject_id,
        uploader_user_id=current_user.id,
        filename=filename,
        extracted_text=text,
        word_count=len(words),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return NotesUploadResponse(
        document=NotesDocumentResponse.model_validate(doc),
        shared_message=SHARED_DISCLOSURE_MESSAGE,
    )
