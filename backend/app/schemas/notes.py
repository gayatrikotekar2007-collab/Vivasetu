"""Notes schemas (Pydantic v2)."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NotesDocumentResponse(BaseModel):
    id: str
    college_id: str
    branch: str
    subject_id: str
    filename: str
    word_count: int
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class NotesUploadResponse(BaseModel):
    document: NotesDocumentResponse
    shared_message: str


class NotesCheckResponse(BaseModel):
    exists: bool
    document: Optional[NotesDocumentResponse] = None
