"""
AI Service layer.

AIService is a Protocol (structural interface) — route handlers never call
Groq directly. They receive an AIService via FastAPI dependency injection.

Two implementations:
  MockAIService   — active when GROQ_API_KEY is empty; uses canned responses
                    prefixed with [DEMO] so they are NEVER mistaken for real AI.
  GroqAIService   — active when GROQ_API_KEY is set; calls Groq API.

Retry policy:
  - Transient HTTP errors (5xx / timeout): retry once after 0.5s.
  - Score JSON parse failure: retry once with corrective instruction.
    If second parse also fails: return structured scoring_failed response.
"""
import asyncio
import json
import logging
from dataclasses import dataclass, field
from typing import Protocol, runtime_checkable

from app.core.config import settings

logger = logging.getLogger(__name__)


# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class Turn:
    question: str
    answer: str | None = None


@dataclass
class TopicScore:
    topic_name: str
    score: float
    student_answer_summary: str
    model_answer: str
    gap_description: str


@dataclass
class SessionScore:
    status: str  # "ok"
    topics: list[TopicScore]
    mock_mode: bool = False


@dataclass
class ScoringFailedResult:
    status: str = "scoring_failed"
    message: str = "Could not parse AI score. Your session has been saved but could not be scored."
    turns_saved: bool = True


# ── Custom exceptions ─────────────────────────────────────────────────────────

class AIServiceUnavailableError(Exception):
    """Raised when the AI provider is unreachable after retries."""


class AIProviderNotConfiguredError(Exception):
    """Raised when voice transcription is attempted in mock mode."""


# ── Protocol (interface) ──────────────────────────────────────────────────────

@runtime_checkable
class AIService(Protocol):
    @property
    def is_mock_mode(self) -> bool: ...

    async def generate_question(
        self,
        subject: str,
        difficulty: str,
        prior_turns: list[Turn],
        notes_context: str | None,
        reported_questions: list[str],
    ) -> str: ...

    async def score_session(
        self,
        turns: list[Turn],
        subject: str,
    ) -> SessionScore | ScoringFailedResult: ...

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        mime_type: str,
    ) -> str: ...


# ── Mock implementation ───────────────────────────────────────────────────────

_MOCK_QUESTIONS = [
    "[DEMO] Explain the difference between a process and a thread.",
    "[DEMO] What is the CAP theorem and how does it apply to distributed systems?",
    "[DEMO] Describe the four ACID properties of database transactions.",
    "[DEMO] What is the difference between TCP and UDP? When would you use each?",
    "[DEMO] Explain the concept of virtual memory and how page tables work.",
    "[DEMO] What is a deadlock? How can it be prevented?",
    "[DEMO] Describe the OSI model and its seven layers.",
    "[DEMO] What is the difference between synchronous and asynchronous programming?",
]


class MockAIService:
    """
    Mock AI service — active when GROQ_API_KEY is not configured.
    All responses are clearly prefixed with [DEMO] and flagged mock_mode=True.
    These responses must NEVER look identical to real AI responses in the UI.
    """

    @property
    def is_mock_mode(self) -> bool:
        return True

    async def generate_question(
        self,
        subject: str,
        difficulty: str,
        prior_turns: list[Turn],
        notes_context: str | None,
        reported_questions: list[str],
    ) -> str:
        idx = len(prior_turns) % len(_MOCK_QUESTIONS)
        base = _MOCK_QUESTIONS[idx]
        if notes_context:
            return f"{base} (from shared notes)"
        return base

    async def score_session(
        self,
        turns: list[Turn],
        subject: str,
    ) -> SessionScore:
        answered = [t for t in turns if t.answer]
        topics = []
        for i, turn in enumerate(answered[:5]):  # cap at 5 for mock
            topics.append(TopicScore(
                topic_name=f"[DEMO] Topic {i + 1} — {subject}",
                score=float(60 + (i * 7) % 40),
                student_answer_summary=f"[DEMO] Student gave a partial answer to: {turn.question[:60]}",
                model_answer="[DEMO] This is a placeholder model answer. Enable Groq API for real scoring.",
                gap_description="[DEMO] Gap analysis unavailable in demo mode.",
            ))
        return SessionScore(status="ok", topics=topics, mock_mode=True)

    async def transcribe_audio(self, audio_bytes: bytes, mime_type: str) -> str:
        raise AIProviderNotConfiguredError(
            "Voice transcription requires a valid Groq API key. "
            "Set GROQ_API_KEY in your .env file to enable voice mode."
        )


# ── Groq implementation ───────────────────────────────────────────────────────

class GroqAIService:
    """Real AI service backed by Groq API."""

    def __init__(self, api_key: str) -> None:
        try:
            from groq import Groq
            self._client = Groq(api_key=api_key)
        except ImportError:
            raise ImportError("groq package is required. Run: pip install groq")
        self._timeout = settings.AI_REQUEST_TIMEOUT_SECONDS

    @property
    def is_mock_mode(self) -> bool:
        return False

    async def generate_question(
        self,
        subject: str,
        difficulty: str,
        prior_turns: list[Turn],
        notes_context: str | None,
        reported_questions: list[str],
    ) -> str:
        system = self._build_examiner_system(subject, difficulty, notes_context, reported_questions)
        messages = [{"role": "system", "content": system}]
        for turn in prior_turns:
            messages.append({"role": "assistant", "content": turn.question})
            if turn.answer:
                messages.append({"role": "user", "content": turn.answer})
        messages.append({"role": "user", "content": "Ask the next question."})

        return await self._call_with_retry(messages, parse_json=False)

    async def score_session(
        self,
        turns: list[Turn],
        subject: str,
    ) -> SessionScore | ScoringFailedResult:
        answered = [t for t in turns if t.answer]
        transcript = "\n".join(
            f"Q: {t.question}\nA: {t.answer}" for t in answered
        )
        prompt = (
            f"You are scoring a viva exam on the subject: {subject}.\n"
            f"Here is the complete Q&A transcript:\n{transcript}\n\n"
            "Return a JSON object with this exact structure:\n"
            '{"status": "ok", "topics": [{"topic_name": "...", "score": 0-100, '
            '"student_answer_summary": "...", "model_answer": "...", "gap_description": "..."}]}\n'
            "One entry per question. No prose, no markdown, just valid JSON."
        )
        messages = [{"role": "user", "content": prompt}]

        # First attempt
        raw = await self._call_with_retry(messages, parse_json=False)
        score = self._parse_score_json(raw)
        if score is not None:
            return score

        # Second attempt with corrective instruction
        logger.warning("Score JSON parse failed on first attempt; retrying with corrective instruction.")
        messages.append({"role": "assistant", "content": raw})
        messages.append({"role": "user", "content": "Your response was not valid JSON. Return ONLY the JSON object, no markdown, no prose."})
        raw2 = await self._call_with_retry(messages, parse_json=False)
        score2 = self._parse_score_json(raw2)
        if score2 is not None:
            return score2

        logger.error("Score JSON parse failed on second attempt. Returning scoring_failed.")
        return ScoringFailedResult()

    async def transcribe_audio(self, audio_bytes: bytes, mime_type: str) -> str:
        if not audio_bytes:
            return ""

        import io
        import groq

        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(
                    self._client.audio.transcriptions.create,
                    model="whisper-large-v3",
                    file=("audio.webm", io.BytesIO(audio_bytes), mime_type),
                ),
                timeout=self._timeout,
            )
            return result.text
        except asyncio.TimeoutError:
            logger.warning("Transcription timed out after %s seconds", self._timeout)
            raise AIServiceUnavailableError("Transcription timed out.")
        except groq.RateLimitError as rle:
            logger.warning("Groq transcription rate limit reached: %s", rle)
            raise AIServiceUnavailableError(
                "AI transcription rate limit reached. Please wait a moment and try again."
            ) from rle
        except groq.BadRequestError as bre:
            logger.warning("Groq transcription rejected audio format/content: %s", bre)
            return ""
        except Exception as exc:
            logger.error("Groq transcription failed: %s", exc)
            raise AIServiceUnavailableError(f"Transcription failed: {exc}") from exc

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _build_examiner_system(
        self,
        subject: str,
        difficulty: str,
        notes_context: str | None,
        reported_questions: list[str],
    ) -> str:
        base = (
            f"You are a strict SPPU viva examiner for the subject: {subject}. "
            f"Difficulty level: {difficulty}. "
            "Ask ONE question at a time. Be concise. Do not repeat previous questions."
        )
        if notes_context:
            base += f"\n\nRelevant course notes:\n{notes_context[:3000]}"
        if reported_questions:
            base += f"\n\nReal questions from past vivas (prioritise these):\n" + "\n".join(f"- {q}" for q in reported_questions[:10])
        return base

    async def _call_with_retry(
        self,
        messages: list[dict],
        parse_json: bool = False,
    ) -> str:
        """Call Groq with one retry on transient errors."""
        for attempt in range(2):
            try:
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        self._client.chat.completions.create,
                        model="openai/gpt-oss-20b",
                        messages=messages,
                        temperature=0.7,
                    ),
                    timeout=self._timeout,
                )
                return response.choices[0].message.content.strip()
            except asyncio.TimeoutError:
                if attempt == 0:
                    await asyncio.sleep(0.5)
                    continue
                raise AIServiceUnavailableError("AI provider timed out after retry.")
            except Exception as exc:
                if attempt == 0:
                    await asyncio.sleep(0.5)
                    continue
                raise AIServiceUnavailableError(f"AI provider error: {exc}") from exc
        raise AIServiceUnavailableError("AI provider failed after retry.")

    def _parse_score_json(self, raw: str) -> SessionScore | None:
        """Try to parse raw string as a SessionScore JSON. Returns None on failure."""
        try:
            # Strip markdown code fences if present
            text = raw.strip()
            if text.startswith("```"):
                text = "\n".join(text.split("\n")[1:])
                text = text.rstrip("`").strip()
            data = json.loads(text)
            topics = [
                TopicScore(
                    topic_name=t["topic_name"],
                    score=float(t["score"]),
                    student_answer_summary=t.get("student_answer_summary", ""),
                    model_answer=t.get("model_answer", ""),
                    gap_description=t.get("gap_description", ""),
                )
                for t in data.get("topics", [])
            ]
            return SessionScore(status="ok", topics=topics, mock_mode=False)
        except (json.JSONDecodeError, KeyError, TypeError, ValueError):
            return None


# ── Dependency ────────────────────────────────────────────────────────────────

def get_ai_service() -> AIService:
    """
    FastAPI dependency. Returns GroqAIService if API key is configured,
    MockAIService otherwise. Never called at module import time.
    """
    if settings.GROQ_API_KEY:
        return GroqAIService(api_key=settings.GROQ_API_KEY)
    return MockAIService()
