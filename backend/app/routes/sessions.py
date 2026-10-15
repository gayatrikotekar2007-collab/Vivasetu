"""
Session routes: start, answer, end, get.

SECURITY: Every endpoint that touches a VivaSession checks ownership:
  1. 404 if session doesn't exist
  2. 403 if session.user_id != current_user.id

This order intentionally avoids leaking session existence to other users.
The 403 check is MANDATORY and tested explicitly in test_sessions.py.
"""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, limiter
from app.models.session import DrillSession, DrillTurn, SessionTurn, VivaSession
from app.models.subject import Subject
from app.models.user import User
from app.schemas.session import (
    AnswerRequest,
    DrillAnswerRequest,
    DrillCompleteResponse,
    DrillResponse,
    DrillTurnResponse,
    InsufficientDataResponse,
    ScoringFailedResponse,
    SessionDetailResponse,
    SessionResponse,
    SessionScoreResponse,
    StartSessionRequest,
    TopicScore,
)
from app.services.ai_service import (
    AIProviderNotConfiguredError,
    AIService,
    AIServiceUnavailableError,
    ScoringFailedResult,
    Turn,
    get_ai_service,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])
drill_router = APIRouter(prefix="/drill", tags=["drill"])

# Minimum answered questions required to produce a score
_MIN_ANSWERS_FOR_SCORE = 2


def _get_session_or_raise(session_id: str, current_user: User, db: Session) -> VivaSession:
    """
    Fetch a session, enforcing ownership.
    404 if not found, 403 if wrong user.
    Call this at the top of every session-touching endpoint.
    """
    session = db.get(VivaSession, session_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")
    return session


@router.post("/start", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def start_session(
    request: Request,
    body: StartSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    ai: AIService = Depends(get_ai_service),
):
    """
    Start a new viva session. Returns the first question.
    difficulty must be exactly Friendly/Strict/Brutal — 422 on any other value.
    mock_mode is set once here and never changes for this session.
    """
    subject = db.get(Subject, body.subject_id)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found.")

    # Get notes context if notes_document_id provided (Group 3)
    notes_context = None
    if body.notes_document_id:
        from app.models.notes import NotesDocument
        doc = db.get(NotesDocument, body.notes_document_id)
        if doc and doc.is_active and doc.word_count > 0:
            notes_context = doc.extracted_text
        elif doc and doc.word_count == 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The selected notes document has no extractable text. Please upload a different document.",
            )

    # Generate first question
    try:
        question = await ai.generate_question(
            subject=subject.name,
            difficulty=body.difficulty.value,
            prior_turns=[],
            notes_context=notes_context,
            reported_questions=[],
        )
    except AIServiceUnavailableError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))

    # Create session and first turn
    viva = VivaSession(
        user_id=current_user.id,
        subject_id=subject.id,
        difficulty=body.difficulty.value,
        mock_mode=ai.is_mock_mode,
    )
    db.add(viva)
    db.flush()  # get viva.id before creating turn

    turn = SessionTurn(session_id=viva.id, turn_index=0, question=question)
    db.add(turn)
    viva.question_count = 1
    db.commit()
    db.refresh(viva)

    return SessionResponse(
        session_id=viva.id,
        question=question,
        turn_index=0,
        mock_mode=viva.mock_mode,
    )


@router.post("/{session_id}/answer", response_model=SessionResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def submit_answer(
    session_id: str,
    request: Request,
    body: AnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    ai: AIService = Depends(get_ai_service),
):
    """
    Submit an answer to the current question and receive the next question.
    Returns 403 if session does not belong to the requesting user.
    """
    viva = _get_session_or_raise(session_id, current_user, db)

    if viva.ended_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session already ended.")

    # Record answer on the latest unanswered turn
    current_turn = next(
        (t for t in sorted(viva.turns, key=lambda x: x.turn_index, reverse=True) if t.answer is None),
        None,
    )
    if current_turn is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No pending question to answer.")

    current_turn.answer = body.answer
    current_turn.answered_at = datetime.now(timezone.utc)

    # Build prior turns for context
    prior_turns = [
        Turn(question=t.question, answer=t.answer)
        for t in sorted(viva.turns, key=lambda x: x.turn_index)
    ]

    # Get subject for context
    subject = db.get(Subject, viva.subject_id)

    # Generate next question
    try:
        next_question = await ai.generate_question(
            subject=subject.name if subject else "Unknown",
            difficulty=viva.difficulty,
            prior_turns=prior_turns,
            notes_context=None,
            reported_questions=[],
        )
    except AIServiceUnavailableError as exc:
        db.commit()  # Save the answer even if next question fails
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))

    next_index = current_turn.turn_index + 1
    new_turn = SessionTurn(session_id=viva.id, turn_index=next_index, question=next_question)
    db.add(new_turn)
    viva.question_count = next_index + 1
    db.commit()

    return SessionResponse(
        session_id=viva.id,
        question=next_question,
        turn_index=next_index,
        mock_mode=viva.mock_mode,
    )


@router.post("/{session_id}/end")
async def end_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    ai: AIService = Depends(get_ai_service),
):
    """
    End a session and return the score.
    Returns 403 if session does not belong to the requesting user.

    If fewer than 2 questions were answered, returns InsufficientDataResponse
    (status='insufficient_data') — structurally distinct from a valid score.
    The frontend MUST check for this before rendering the results screen.
    """
    viva = _get_session_or_raise(session_id, current_user, db)

    if viva.ended_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session already ended.")

    # Mark session as ended
    viva.ended_at = datetime.now(timezone.utc)
    db.commit()

    # Count answered questions
    answered_turns = [t for t in viva.turns if t.answer is not None]
    answered_count = len(answered_turns)

    # Guard: insufficient data
    if answered_count < _MIN_ANSWERS_FOR_SCORE:
        return InsufficientDataResponse(
            status="insufficient_data",
            message=f"Session ended with only {answered_count} answered question(s). "
                    f"A minimum of {_MIN_ANSWERS_FOR_SCORE} is required for scoring.",
            answered_count=answered_count,
        )

    # Build turns for scoring
    subject = db.get(Subject, viva.subject_id)
    turns = [
        Turn(question=t.question, answer=t.answer)
        for t in sorted(answered_turns, key=lambda x: x.turn_index)
    ]

    # Score the session
    try:
        result = await ai.score_session(
            turns=turns,
            subject=subject.name if subject else "Unknown",
        )
    except AIServiceUnavailableError as exc:
        return ScoringFailedResponse(
            message=f"AI provider unavailable: {exc}",
            turns_saved=True,
        )

    if isinstance(result, ScoringFailedResult):
        return ScoringFailedResponse(
            message=result.message,
            turns_saved=result.turns_saved,
        )

    # Update topic mastery records in the same transaction (Group 4)
    from app.models.mastery import TopicMastery
    from app.services.mastery_service import next_review_date, update_mastery

    for topic_data in result.topics:
        tm = (
            db.query(TopicMastery)
            .filter(
                TopicMastery.user_id == current_user.id,
                TopicMastery.topic_name == topic_data.topic_name,
                TopicMastery.subject_id == viva.subject_id,
            )
            .first()
        )
        if tm:
            tm.mastery_score = update_mastery(tm.mastery_score, topic_data.score)
            tm.session_count += 1
            tm.last_practiced_at = datetime.now(timezone.utc)
            tm.next_review_due = next_review_date(tm.mastery_score)
        else:
            new_score = round(float(topic_data.score), 2)
            tm = TopicMastery(
                user_id=current_user.id,
                topic_name=topic_data.topic_name,
                subject_id=viva.subject_id,
                branch=current_user.branch or "General",
                mastery_score=new_score,
                session_count=1,
                last_practiced_at=datetime.now(timezone.utc),
                next_review_due=next_review_date(new_score),
            )
            db.add(tm)
    db.commit()

    # Update user streak upon completing a full viva session
    from app.services.streak_service import update_streak
    today_date = datetime.now(timezone.utc).date()
    new_streak, new_date = update_streak(
        current_streak=current_user.streak_count,
        last_drill_date=current_user.last_drill_date,
        completed_date=today_date,
    )
    current_user.streak_count = new_streak
    current_user.last_drill_date = new_date

    # Return valid score
    return SessionScoreResponse(
        status="ok",
        topics=[
            TopicScore(
                topic_name=t.topic_name,
                score=t.score,
                student_answer_summary=t.student_answer_summary,
                model_answer=t.model_answer,
                gap_description=t.gap_description,
            )
            for t in result.topics
        ],
        mock_mode=result.mock_mode,
        session_id=viva.id,
    )


@router.get("/dashboard-stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return honest aggregated metrics and data for the home dashboard:
    Streak, accuracy %, questions practiced, exam countdown, college & branch,
    subjects mastery progress, and recent viva sessions.
    Shows honest empty/zero states when data does not exist.
    """
    from app.models.college import College
    from app.models.mastery import TopicMastery

    today = datetime.now(timezone.utc).date()

    # 1. Streak count
    streak_count = current_user.streak_count or 0

    # 2. Days to exam
    days_to_exam = None
    if current_user.exam_date:
        delta = (current_user.exam_date - today).days
        days_to_exam = max(0, delta)

    # 3. Overall accuracy from topic mastery
    mastery_records = (
        db.query(TopicMastery)
        .filter(TopicMastery.user_id == current_user.id)
        .all()
    )
    if mastery_records:
        overall_accuracy = round(
            sum(r.mastery_score for r in mastery_records) / len(mastery_records)
        )
    else:
        overall_accuracy = None

    # 4. Total questions practiced
    viva_turns_count = (
        db.query(SessionTurn)
        .join(VivaSession, SessionTurn.session_id == VivaSession.id)
        .filter(VivaSession.user_id == current_user.id, SessionTurn.answer.isnot(None))
        .count()
    )
    drill_turns_count = (
        db.query(DrillTurn)
        .join(DrillSession, DrillTurn.drill_id == DrillSession.id)
        .filter(DrillSession.user_id == current_user.id, DrillTurn.answer.isnot(None))
        .count()
    )
    questions_practiced = viva_turns_count + drill_turns_count

    # 5. College & Branch
    college_name = None
    is_autonomous = None
    if current_user.college_id:
        college = db.get(College, current_user.college_id)
        if college:
            college_name = college.name
            is_autonomous = college.is_autonomous

    branch_display = current_user.branch
    syllabus_display = (
        "SPPU Syllabus"
        if current_user.syllabus_mode == "sppu"
        else "Autonomous Syllabus"
        if current_user.syllabus_mode == "college_own"
        else None
    )

    # 6. Subjects and Mastery
    subjects_query = db.query(Subject)
    if current_user.academic_year == "FE":
        subjects_query = subjects_query.filter(Subject.academic_year == "FE")
    else:
        if current_user.branch:
            subjects_query = subjects_query.filter(Subject.branch == current_user.branch)
        if current_user.academic_year:
            subjects_query = subjects_query.filter(Subject.academic_year == current_user.academic_year)
    user_subjects = subjects_query.limit(6).all()

    icon_cycle = ["code", "database", "cpu", "wifi", "book", "layers"]
    subjects_data = []
    for idx, s in enumerate(user_subjects):
        s_masteries = [m for m in mastery_records if m.subject_id == s.id]
        if s_masteries:
            avg_m = round(sum(m.mastery_score for m in s_masteries) / len(s_masteries))
            weakest = min(s_masteries, key=lambda x: x.mastery_score)
            is_strong = avg_m >= 75
            weak_topic = weakest.topic_name if not is_strong else None
        else:
            avg_m = None
            weak_topic = None
            is_strong = False
        subjects_data.append({
            "id": s.id,
            "name": s.name,
            "mastery": avg_m,
            "weak_topic": weak_topic,
            "is_strong": is_strong,
            "icon_type": icon_cycle[idx % len(icon_cycle)],
        })

    # 7. Recent Sessions (only real sessions, empty list if none)
    recent_vivas = (
        db.query(VivaSession)
        .filter(VivaSession.user_id == current_user.id)
        .order_by(VivaSession.started_at.desc())
        .limit(4)
        .all()
    )
    recent_sessions_data = []
    for vs in recent_vivas:
        subj = db.get(Subject, vs.subject_id)
        subj_name = subj.name if subj else "Viva Practice"
        duration_min = 10
        if vs.ended_at and vs.started_at:
            duration_min = max(1, int((vs.ended_at - vs.started_at).total_seconds() // 60))
        
        # Calculate score from subject mastery or turns
        s_masteries = [m for m in mastery_records if m.subject_id == vs.subject_id]
        session_score = (
            round(sum(m.mastery_score for m in s_masteries) / len(s_masteries))
            if s_masteries
            else None
        )

        recent_sessions_data.append({
            "id": vs.id,
            "subject": subj_name,
            "topic": s_masteries[0].topic_name if s_masteries else "General Practice",
            "date_formatted": vs.started_at.strftime("%d %b %Y, %I:%M %p"),
            "duration_min": duration_min,
            "score_percent": session_score,
            "mock_mode": vs.mock_mode,
        })

    return {
        "streak_count": streak_count,
        "overall_accuracy": overall_accuracy,
        "questions_practiced": questions_practiced,
        "days_to_exam": days_to_exam,
        "college": {
            "name": college_name,
            "is_autonomous": is_autonomous,
            "branch": branch_display,
            "syllabus_source": syllabus_display,
        },
        "subjects": subjects_data,
        "recent_sessions": recent_sessions_data,
    }


@router.get("/{session_id}", response_model=SessionDetailResponse)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get session details.
    Returns 403 if session does not belong to the requesting user.
    """
    viva = _get_session_or_raise(session_id, current_user, db)
    return viva


_ALLOWED_AUDIO_EXTENSIONS = {"webm", "wav", "mp4", "m4a", "ogg"}
_MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


@router.post("/{session_id}/transcribe")
async def transcribe_session_audio(
    session_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    ai: AIService = Depends(get_ai_service),
):
    """
    Transcribe audio for voice mode (Group 5).
    Enforces ownership check (404/403).
    Validates audio format (webm, wav, mp4, m4a, ogg) and size <= 25 MB.
    Returns 503 when AI provider is in mock mode or unavailable. Never returns 500.
    """
    _get_session_or_raise(session_id, current_user, db)

    # Validate file format
    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in _ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported audio format '{ext}'. Allowed formats: {', '.join(sorted(_ALLOWED_AUDIO_EXTENSIONS))}.",
        )

    audio_bytes = await file.read()
    if len(audio_bytes) > _MAX_AUDIO_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Audio file exceeds maximum size of 25 MB ({len(audio_bytes)} bytes).",
        )

    # In mock mode, voice mode is unavailable per specification
    if ai.is_mock_mode:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "transcription_unavailable",
                "message": "AI provider not configured. Voice mode requires a valid Groq API key.",
            },
        )

    if not audio_bytes:
        return {"transcript": ""}

    try:
        transcript = await ai.transcribe_audio(audio_bytes, file.content_type or f"audio/{ext}")
        return {"transcript": transcript}
    except AIProviderNotConfiguredError:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "transcription_unavailable",
                "message": "AI provider not configured. Voice mode requires a valid Groq API key.",
            },
        )
    except AIServiceUnavailableError as exc:
        logger.error("Transcription error for session %s: %s", session_id, exc)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "transcription_unavailable",
                "message": str(exc),
            },
        )


# ── Drill routes ──────────────────────────────────────────────────────────────

def _get_drill_or_raise(drill_id: str, current_user: User, db: Session) -> DrillSession:
    """Fetch drill session, enforcing 404/403 ownership check."""
    drill = db.get(DrillSession, drill_id)
    if drill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drill not found.")
    if drill.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")
    return drill


@drill_router.post("/start", response_model=DrillResponse)
def start_drill(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Start or retrieve today's daily drill (5 questions).
    If a drill already exists for today (UTC calendar date), returns it.
    Otherwise builds 5 questions from weakest / overdue topics.
    """
    from app.models.mastery import TopicMastery
    from app.models.questions import ReportedQuestion

    today = datetime.now(timezone.utc).date()
    existing = (
        db.query(DrillSession)
        .filter(DrillSession.user_id == current_user.id, DrillSession.drill_date == today)
        .first()
    )
    if existing:
        return existing

    # Find weakest / most overdue topics
    weak_topics = (
        db.query(TopicMastery)
        .filter(TopicMastery.user_id == current_user.id)
        .order_by(TopicMastery.next_review_due.asc(), TopicMastery.mastery_score.asc())
        .limit(5)
        .all()
    )

    drill = DrillSession(
        user_id=current_user.id,
        drill_date=today,
        completed=False,
        question_count=5,
    )
    db.add(drill)
    db.flush()

    questions: list[tuple[str, str]] = []
    for wt in weak_topics:
        questions.append((
            f"Explain the key principles and common viva questions for {wt.topic_name}.",
            wt.topic_name,
        ))

    # Fill from approved reported questions if needed
    if len(questions) < 5:
        rqs = (
            db.query(ReportedQuestion)
            .filter(
                ReportedQuestion.approval_status == "approved",
                ReportedQuestion.branch == (current_user.branch or ""),
            )
            .order_by(ReportedQuestion.upvotes.desc())
            .limit(5 - len(questions))
            .all()
        )
        for rq in rqs:
            questions.append((rq.question_text, rq.topic))

    # Fill from subjects if needed
    if len(questions) < 5:
        subjs = (
            db.query(Subject)
            .filter(Subject.branch == (current_user.branch or ""))
            .limit(5 - len(questions))
            .all()
        )
        for s in subjs:
            questions.append((
                f"What are the core principles and common practical questions in {s.name}?",
                s.name,
            ))

    # Defaults if still < 5
    defaults = [
        ("Explain the trade-offs between array-based and linked-list structures.", "Data Structures"),
        ("Explain the difference between process and thread synchronization.", "Operating Systems"),
        ("Explain ACID properties and why they are necessary in database systems.", "Database Management"),
        ("Explain the TCP 3-way handshake and how flow control works.", "Computer Networks"),
        ("What is the difference between verification and validation in software engineering?", "Software Engineering"),
    ]
    idx = 0
    while len(questions) < 5:
        questions.append(defaults[idx % len(defaults)])
        idx += 1

    for i in range(5):
        q_text, topic_name = questions[i]
        turn = DrillTurn(
            drill_id=drill.id,
            turn_index=i,
            question=q_text,
            topic=topic_name,
        )
        db.add(turn)

    db.commit()
    db.refresh(drill)
    return drill


@drill_router.get("/{drill_id}", response_model=DrillResponse)
def get_drill(
    drill_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get drill session details. Ownership check enforced."""
    drill = _get_drill_or_raise(drill_id, current_user, db)
    return drill


@drill_router.post("/{drill_id}/answer", response_model=DrillTurnResponse)
def answer_drill_turn(
    drill_id: str,
    request: DrillAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Record answer for a drill turn.
    Ownership check enforced (403 if not owner, 404 if drill not found).
    """
    drill = _get_drill_or_raise(drill_id, current_user, db)

    turn = next((t for t in drill.turns if t.turn_index == request.turn_index), None)
    if not turn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drill turn not found.")

    turn.answer = request.answer
    turn.answered_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(turn)
    return turn


@drill_router.post("/{drill_id}/complete", response_model=DrillCompleteResponse)
def complete_drill(
    drill_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Complete the daily drill and update the user's streak.
    Ownership check enforced.
    """
    drill = _get_drill_or_raise(drill_id, current_user, db)

    drill.completed = True
    drill.completed_at = datetime.now(timezone.utc)

    from app.services.streak_service import update_streak
    new_streak, new_date = update_streak(
        current_streak=current_user.streak_count,
        last_drill_date=current_user.last_drill_date,
        completed_date=drill.drill_date,
    )
    current_user.streak_count = new_streak
    current_user.last_drill_date = new_date

    db.commit()

    return DrillCompleteResponse(
        completed=True,
        streak_count=current_user.streak_count,
        last_drill_date=current_user.last_drill_date,
    )

