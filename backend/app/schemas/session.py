"""
Session schemas (Pydantic v2).

Key shapes:
  InsufficientDataResponse — returned when < 2 questions answered.
    MUST be structurally distinct from a valid score. Frontend checks
    result.status === 'insufficient_data' before rendering results.

  ScoringFailedResponse — returned when AI score JSON cannot be parsed.
    Also structurally distinct. Frontend checks result.status === 'scoring_failed'.

  SessionScoreResponse — the only valid score shape. status === 'ok'.
    Every array field (topics) is guaranteed non-null by this schema.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import DifficultyEnum


# ── Request schemas ───────────────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    subject_id: str
    # DifficultyEnum validation: 422 on any value not in {Friendly, Strict, Brutal}
    difficulty: DifficultyEnum
    notes_document_id: Optional[str] = None


class AnswerRequest(BaseModel):
    answer: str = Field(..., min_length=1)


# ── Response schemas ──────────────────────────────────────────────────────────

class SessionResponse(BaseModel):
    """Returned after start or each answer — contains the next question."""
    session_id: str
    question: str
    turn_index: int
    mock_mode: bool  # Frontend MUST show MockModeBanner when True


class TopicScore(BaseModel):
    topic_name: str
    score: float
    student_answer_summary: str
    model_answer: str
    gap_description: str


class SessionScoreResponse(BaseModel):
    """Valid score shape. status is always 'ok'."""
    status: str = "ok"
    topics: list[TopicScore]  # Never null — always a list (may be empty)
    mock_mode: bool
    session_id: str


class InsufficientDataResponse(BaseModel):
    """
    Returned when session ends with < 2 answered questions.
    Structurally DISTINCT from SessionScoreResponse.
    Frontend must check status == 'insufficient_data' and NOT render ScoreBreakdown.
    """
    status: str = "insufficient_data"
    message: str
    answered_count: int


class ScoringFailedResponse(BaseModel):
    """
    Returned when AI score JSON cannot be parsed after two attempts.
    Structurally DISTINCT from SessionScoreResponse.
    Frontend must check status == 'scoring_failed' and NOT render ScoreBreakdown.
    """
    status: str = "scoring_failed"
    message: str
    turns_saved: bool = True


class SessionDetailResponse(BaseModel):
    id: str
    user_id: str
    subject_id: str
    difficulty: str
    started_at: datetime
    ended_at: Optional[datetime]
    question_count: int
    mock_mode: bool

    model_config = {"from_attributes": True}


class DrillTurnResponse(BaseModel):
    id: str
    turn_index: int
    question: str
    topic: str
    answer: Optional[str] = None

    model_config = {"from_attributes": True}


class DrillResponse(BaseModel):
    id: str
    drill_date: date
    completed: bool
    question_count: int
    turns: list[DrillTurnResponse]

    model_config = {"from_attributes": True}


class DrillAnswerRequest(BaseModel):
    turn_index: int = Field(..., ge=0, le=4)
    answer: str = Field(..., min_length=1)


class DrillCompleteResponse(BaseModel):
    completed: bool
    streak_count: int
    last_drill_date: date
