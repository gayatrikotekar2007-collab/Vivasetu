# VivaSetu — System Design

**Version:** 1.0
**Derived from:** requirements.md v1.0

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│   React + Vite SPA  (frontend/)                         │
│   React Router · axios interceptor · CSS custom props   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / REST+JSON
                         │ VITE_API_BASE_URL (env only)
┌────────────────────────▼────────────────────────────────┐
│              FastAPI Backend  (backend/)                 │
│  Routes → Services → SQLAlchemy 2.x ORM → DB            │
│  Groq AI service (behind AIService interface)           │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
    ┌──────▼──────┐           ┌───────▼──────┐
    │  PostgreSQL  │           │  Groq API    │
    │  (prod)      │           │  (text+audio)│
    │  SQLite      │           │  [swappable] │
    │  (local dev) │           └──────────────┘
    └─────────────┘
```

All service-to-service wiring (DB URL, CORS origins, JWT secret, Groq key, admin secret) is driven exclusively by environment variables. No URL, origin, or secret appears as a literal string in any non-example, non-test source file.

---

## 2. Backend Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app factory + lifespan handler
│   ├── core/
│   │   ├── config.py            # Pydantic Settings — all env vars, startup validation
│   │   ├── database.py          # Engine factory, session factory, reset_session_factory()
│   │   ├── security.py          # JWT encode/decode, password hashing
│   │   └── dependencies.py      # get_current_user, get_db, rate_limiter
│   ├── models/
│   │   ├── user.py
│   │   ├── college.py
│   │   ├── subject.py
│   │   ├── session.py           # VivaSession, DrillSession
│   │   ├── notes.py             # NotesDocument
│   │   ├── mastery.py           # TopicMastery
│   │   └── questions.py         # ReportedQuestion
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── college.py
│   │   ├── subject.py
│   │   ├── session.py
│   │   ├── notes.py
│   │   ├── mastery.py
│   │   └── questions.py
│   ├── routes/
│   │   ├── health.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── colleges.py
│   │   ├── subjects.py
│   │   ├── sessions.py
│   │   ├── notes.py
│   │   ├── mastery.py
│   │   ├── questions.py
│   │   └── admin.py
│   └── services/
│       ├── ai_service.py        # AIService interface + GroqAIService + MockAIService
│       ├── document_service.py  # PDF/DOCX/TXT extraction, OCR flag
│       ├── mastery_service.py   # Moving average, next_review_due calc
│       └── streak_service.py    # Streak increment/reset logic
├── tests/
│   ├── conftest.py              # reset_session_factory, test client, in-memory DB
│   ├── test_import_safety.py    # AC-1.2.2: import with unreachable DB
│   ├── test_auth.py
│   ├── test_sessions.py         # includes session ownership 403 tests
│   ├── test_colleges.py
│   ├── test_notes.py
│   └── test_mastery.py
├── alembic/                     # migration history (Alembic, optional for prod)
├── seed/
│   ├── colleges.py
│   └── subjects.py
├── requirements.txt             # pinned versions
├── Dockerfile
└── .env.example
```

---

## 3. Frontend Structure

```
frontend/
├── src/
│   ├── main.jsx
│   ├── App.jsx                  # Router setup, ProtectedRoute
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── OnboardingPage.jsx
│   │   ├── HomePage.jsx         # streak, countdown, weak topics
│   │   ├── SessionPage.jsx      # examiner loop (text + voice)
│   │   ├── ResultsPage.jsx
│   │   ├── DrillPage.jsx
│   │   ├── SubjectsPage.jsx
│   │   ├── NotesUploadPage.jsx
│   │   ├── ReportedQuestionsPage.jsx
│   │   └── ProfilePage.jsx
│   ├── components/
│   │   ├── MockModeBanner.jsx   # amber banner shown in all mock-mode sessions
│   │   ├── CollegeSearch.jsx    # type-ahead search + add-new fallback
│   │   ├── QuestionCard.jsx
│   │   ├── ScoreBreakdown.jsx   # guarded array rendering
│   │   ├── TopicMasteryCard.jsx
│   │   ├── StreakWidget.jsx
│   │   ├── ExamCountdown.jsx    # driven by useEffect, not render body
│   │   ├── VoiceRecorder.jsx    # hold-to-talk, fallback handling
│   │   ├── TranscriptConfirm.jsx
│   │   ├── CountdownTimer.jsx
│   │   └── ProtectedRoute.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useVoiceRecorder.js
│   │   └── useCountdown.js      # single source of truth for timer state
│   ├── services/
│   │   ├── api.js               # axios instance, base URL from env, auth interceptor
│   │   ├── authService.js
│   │   ├── sessionService.js
│   │   ├── collegeService.js
│   │   ├── subjectService.js
│   │   ├── notesService.js
│   │   ├── masteryService.js
│   │   └── questionsService.js
│   ├── styles/
│   │   ├── globals.css          # CSS custom properties, dark theme, typography
│   │   └── components.css
│   └── utils/
│       └── guards.js            # safeArray(), isInsufficientData(), etc.
├── index.html
├── vite.config.js
├── .eslintrc.cjs
├── Dockerfile
└── .env.example
```

---

## 4. Database Schema

### Design Principle — Lifespan-Gated Initialization (Critical)

**`app/core/database.py` must never create the engine or call `create_all` at module import time.** The module exposes:

```python
# database.py — module-level: only type definitions and factory functions, NO engine creation

def create_engine_from_url(url: str) -> Engine: ...
def create_session_factory(engine: Engine) -> sessionmaker: ...
def reset_session_factory(engine: Engine) -> None: ...  # for test isolation
```

The `SessionLocal` used by `get_db` is a module-level variable that is **assigned** (not created) inside the FastAPI `lifespan` handler in `main.py`:

```python
# main.py
@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = create_engine_from_url(settings.DATABASE_URL)
    reset_session_factory(engine)          # wires get_db to real DB
    Base.metadata.create_all(bind=engine)  # schema init — ONLY here
    yield
    engine.dispose()
```

Importing `from app.main import app` in a test does **not** execute the lifespan block. The test's `conftest.py` calls `reset_session_factory` with an in-memory SQLite engine independently.

---

### 4.1 Users

```sql
users
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  email           TEXT UNIQUE NOT NULL
  full_name       TEXT NOT NULL
  hashed_password TEXT NOT NULL
  college_id      UUID REFERENCES colleges(id) NULLABLE
  branch          TEXT NULLABLE          -- BranchEnum value
  branch_other    TEXT NULLABLE          -- free text when branch = Other
  academic_year   TEXT NULLABLE          -- AcademicYearEnum value
  syllabus_mode   TEXT NULLABLE          -- 'sppu' | 'college_own'
  exam_date       DATE NULLABLE
  streak_count    INT NOT NULL DEFAULT 0
  last_drill_date DATE NULLABLE
  profile_complete BOOL NOT NULL DEFAULT false
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 4.2 Colleges

```sql
colleges
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
  name             TEXT NOT NULL
  normalized_name  TEXT NOT NULL          -- lowercase, punctuation-stripped
  is_autonomous    BOOL NULLABLE          -- NULL = unknown
  city             TEXT NOT NULL DEFAULT 'Pune'
  verified_by_admin BOOL NOT NULL DEFAULT false
  added_by_user_id UUID REFERENCES users(id) NULLABLE
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()

college_autonomy_corrections
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
  college_id       UUID REFERENCES colleges(id) NOT NULL
  reported_by      UUID REFERENCES users(id) NOT NULL
  suggested_value  BOOL NOT NULL
  reason           TEXT NOT NULL
  status           TEXT NOT NULL DEFAULT 'pending'   -- pending | approved | rejected
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 4.3 Subjects

```sql
subjects
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  name            TEXT NOT NULL
  branch          TEXT NOT NULL        -- BranchEnum
  academic_year   TEXT NOT NULL        -- AcademicYearEnum
  is_verified     BOOL NOT NULL DEFAULT false
  added_by_user_id UUID REFERENCES users(id) NULLABLE
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()

  UNIQUE (name, branch, academic_year)
```

### 4.4 Viva Sessions

```sql
viva_sessions
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) NOT NULL
  subject_id    UUID REFERENCES subjects(id) NOT NULL
  difficulty    TEXT NOT NULL        -- DifficultyEnum: Friendly | Strict | Brutal
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  ended_at      TIMESTAMPTZ NULLABLE
  question_count INT NOT NULL DEFAULT 0
  mock_mode     BOOL NOT NULL DEFAULT false

session_turns
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  session_id    UUID REFERENCES viva_sessions(id) NOT NULL
  turn_index    INT NOT NULL
  question      TEXT NOT NULL
  answer        TEXT NULLABLE
  answered_at   TIMESTAMPTZ NULLABLE
```

### 4.5 Drill Sessions

```sql
drill_sessions
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) NOT NULL
  drill_date    DATE NOT NULL            -- UTC calendar date
  completed     BOOL NOT NULL DEFAULT false
  completed_at  TIMESTAMPTZ NULLABLE
  question_count INT NOT NULL DEFAULT 5
```

### 4.6 Notes Documents

```sql
notes_documents
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
  college_id       UUID REFERENCES colleges(id) NOT NULL
  branch           TEXT NOT NULL
  subject_id       UUID REFERENCES subjects(id) NOT NULL
  uploader_user_id UUID REFERENCES users(id) NOT NULL
  filename         TEXT NOT NULL
  extracted_text   TEXT NOT NULL
  word_count       INT NOT NULL
  uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  is_active        BOOL NOT NULL DEFAULT true
```

Index on `(college_id, branch, subject_id, is_active, uploaded_at DESC)` to support the "most recent active document" query efficiently.

### 4.7 Topic Mastery

```sql
topic_mastery
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id          UUID REFERENCES users(id) NOT NULL
  topic_name       TEXT NOT NULL
  branch           TEXT NOT NULL
  subject_id       UUID REFERENCES subjects(id) NOT NULL
  mastery_score    FLOAT NOT NULL DEFAULT 50.0
  session_count    INT NOT NULL DEFAULT 0
  last_practiced_at TIMESTAMPTZ NULLABLE
  next_review_due  DATE NOT NULL

  UNIQUE (user_id, topic_name, subject_id)
```

### 4.8 Reported Questions

```sql
reported_questions
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
  subject_id          UUID REFERENCES subjects(id) NOT NULL
  topic               TEXT NOT NULL
  college_id          UUID REFERENCES colleges(id) NULLABLE
  branch              TEXT NOT NULL
  question_text       TEXT NOT NULL
  upvotes             INT NOT NULL DEFAULT 0
  approval_status     TEXT NOT NULL DEFAULT 'pending'  -- pending | approved | rejected
  reported_by_user_id UUID REFERENCES users(id) NOT NULL
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()

reported_question_upvotes          -- prevents double-upvoting
  user_id     UUID REFERENCES users(id) NOT NULL
  question_id UUID REFERENCES reported_questions(id) NOT NULL
  PRIMARY KEY (user_id, question_id)
```

---

## 5. AI Service Layer

### 5.1 Interface Contract

```python
# services/ai_service.py

class AIService(Protocol):
    @property
    def is_mock_mode(self) -> bool: ...

    async def generate_question(
        self,
        subject: str,
        difficulty: DifficultyEnum,
        prior_turns: list[Turn],
        notes_context: str | None,
        reported_questions: list[str],
    ) -> str: ...

    async def score_session(
        self,
        turns: list[Turn],
        subject: str,
    ) -> SessionScore: ...

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        mime_type: str,
    ) -> str: ...
```

`GroqAIService` implements this against the Groq API. `MockAIService` implements it with static, clearly-labeled canned responses. The active implementation is selected at startup based on whether `GROQ_API_KEY` is set and non-empty — never switched mid-request.

Route handlers receive the service via FastAPI dependency injection:

```python
def get_ai_service() -> AIService:
    if settings.GROQ_API_KEY:
        return GroqAIService(api_key=settings.GROQ_API_KEY)
    return MockAIService()
```

### 5.2 Retry Policy

**Transient HTTP errors (5xx, timeout):** Retry once after a short delay (0.5s). If the second attempt also fails, raise `AIServiceUnavailableError` — the route handler catches this and returns HTTP 503.

**Structured scoring JSON parse failure:** On first parse failure, retry the scoring call with an appended system instruction: "Respond with valid JSON only, no prose, no markdown code fences." If the second parse also fails, return a structured error payload:

```json
{
  "status": "scoring_failed",
  "message": "Could not parse AI score. Your session has been saved but could not be scored.",
  "turns_saved": true
}
```

This is **never** treated as a valid score shape by the frontend.

### 5.3 Mock Mode Visibility

When `MockAIService` is active:
- Every `generate_question` response is prefixed with `[DEMO]` in the returned text.
- Every `score_session` response includes `"mock_mode": true` at the top level.
- `GET /health` returns `"ai_mock_mode": true`.
- The frontend `MockModeBanner` component reads `session.mock_mode` and renders an amber banner on every session screen when true.

---

## 6. API Route Design

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login, return JWT |
| GET | `/users/me` | JWT | Get current user profile |
| PATCH | `/users/me/profile` | JWT | Update profile (college, branch, year, exam_date) |

### Colleges
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/colleges/search?q=` | JWT | Fuzzy search colleges |
| POST | `/colleges` | JWT | Add new college |
| POST | `/colleges/{id}/report-autonomy` | JWT | Submit autonomy correction |

### Subjects
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/subjects?branch=&year=` | JWT | List subjects for branch/year |
| POST | `/subjects/suggest` | JWT | Suggest a new subject |

### Sessions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/sessions/start` | JWT | Start viva session |
| POST | `/sessions/{id}/answer` | JWT | Submit answer, get next question |
| POST | `/sessions/{id}/end` | JWT | End session, get score |
| POST | `/sessions/{id}/transcribe` | JWT | Transcribe audio for voice mode |
| GET | `/sessions/{id}` | JWT | Get session detail (own only) |

### Notes
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notes?college_id=&branch=&subject_id=` | JWT | Check for existing notes |
| POST | `/notes/upload` | JWT | Upload notes document |

### Mastery & Drill
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me/mastery` | JWT | All topic mastery, sorted by due date |
| POST | `/drill/start` | JWT | Start daily drill |
| POST | `/drill/{id}/answer` | JWT | Submit drill answer |
| POST | `/drill/{id}/complete` | JWT | Complete drill, update streak |

### Reported Questions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/reported-questions` | JWT | Report a real viva question |
| GET | `/reported-questions?branch=&subject_id=` | JWT | Get approved questions |
| POST | `/reported-questions/{id}/upvote` | JWT | Upvote (idempotent) |

### Admin (all require `X-Admin-Secret` header)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/admin/college-autonomy-corrections/{id}/approve` | Admin | Approve autonomy correction |
| POST | `/admin/college-autonomy-corrections/{id}/reject` | Admin | Reject correction |
| POST | `/admin/reported-questions/{id}/approve` | Admin | Approve reported question |
| POST | `/admin/reported-questions/{id}/reject` | Admin | Reject reported question |
| DELETE | `/admin/notes/{id}` | Admin | Soft-delete notes document |

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Returns `{status, ai_mock_mode, db_ok}` |

---

## 7. Session Ownership Enforcement

Every route that touches a `VivaSession` or `DrillSession` follows this exact pattern — no exceptions:

```python
session = db.get(VivaSession, session_id)
if session is None:
    raise HTTPException(status_code=404)
if session.user_id != current_user.id:
    raise HTTPException(status_code=403, detail="Forbidden")
```

The 403 check happens **before** any business logic. The order (404 then 403) intentionally avoids leaking existence of other users' sessions. Tests assert both the 404 case (non-existent session) and the 403 case (wrong user's session) for every session endpoint.

---

## 8. Session End Logic — Insufficient Data Guard

```python
# sessions route — end session
answered_count = len([t for t in session.turns if t.answer is not None])
if answered_count < 2:
    return {
        "status": "insufficient_data",
        "message": f"Session ended with only {answered_count} answered question(s). A minimum of 2 is required for scoring."
    }
# else: proceed to AI scoring
```

The frontend `ResultsPage` entry point:

```jsx
// ResultsPage.jsx
useEffect(() => {
  if (!result) return navigate('/');
  if (result.status === 'insufficient_data' || result.status === 'scoring_failed') {
    // render informative message, do NOT pass to ScoreBreakdown
    return;
  }
  // safe to render ScoreBreakdown
}, [result]);
```

`ScoreBreakdown` itself also guards every array:

```jsx
{(scoreData.topics ?? []).map(topic => (
  <TopicRow
    key={topic.topic_name}
    summary={topic.student_answer_summary ?? '—'}
    modelAnswer={topic.model_answer ?? '—'}
    gap={topic.gap_description ?? '—'}
  />
))}
```

---

## 9. Frontend Routing and Auth

```
/                    → HomePage (protected)
/login               → LoginPage (public)
/register            → RegisterPage (public)
/onboarding          → OnboardingPage (protected, shown when profile_complete=false)
/session/:id         → SessionPage (protected)
/session/:id/results → ResultsPage (protected)
/drill               → DrillPage (protected)
/subjects            → SubjectsPage (protected)
/notes               → NotesUploadPage (protected)
/questions           → ReportedQuestionsPage (protected)
/profile             → ProfilePage (protected)
```

`ProtectedRoute` checks for a token in `localStorage`. If absent, redirects to `/login`. If profile is incomplete, redirects to `/onboarding` (except when already on `/onboarding`).

Axios interceptor: on any 401 response, clears token from `localStorage` and triggers a redirect to `/login`.

---

## 10. Voice Mode Architecture

```
VoiceRecorder (component)
  └── useVoiceRecorder (hook)
        ├── Checks MediaRecorder API support on mount
        ├── Requests getUserMedia on hold-start
        ├── Records to webm chunks in state
        └── On stop: assembles Blob, calls sessionService.transcribeAudio()

TranscriptConfirm (component)
  └── Receives transcript string
  └── Renders editable <textarea>
  └── "Submit answer" button → submits to /sessions/{id}/answer
  └── Never auto-submits on mount

CountdownTimer (component)
  └── useCountdown(seconds) hook
        ├── Initializes from prop in useEffect (not render body)
        ├── Decrements via setInterval in useEffect
        └── Calls onExpire callback at 0

SpeechSynthesis: called in useEffect after each new question arrives, not inline
```

Fallback decision tree:
1. `typeof MediaRecorder === 'undefined'` → text mode, static note "Voice mode not supported in this browser"
2. `getUserMedia` throws `NotAllowedError` → text mode, toast "Microphone access denied — using text mode"
3. `getUserMedia` throws any other error → text mode, toast "Microphone unavailable — using text mode"
4. Transcription API returns 503 → text mode, toast "Transcription unavailable — type your answer"

---

## 11. Document Extraction Service

```python
# services/document_service.py

class DocumentExtractor:
    MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024   # 10 MB
    MIN_WORD_COUNT = 200

    def extract(self, file_bytes: bytes, filename: str) -> str:
        # dispatches to _extract_pdf, _extract_docx, _extract_txt
        # raises DocumentTooLargeError, InsufficientTextError, UnsupportedFormatError

    def _extract_pdf(self, file_bytes: bytes) -> str:
        # uses pypdf (text-based)
        # if word_count < MIN_WORD_COUNT and ENABLE_OCR_FALLBACK=true:
        #   falls through to pytesseract OCR
        # else: raises InsufficientTextError with message about OCR flag
```

---

## 12. Mastery and Streak Service

```python
# services/mastery_service.py
MASTERY_WEIGHT_NEW = 0.3  # configurable via env MASTERY_WEIGHT_NEW
MASTERY_WEIGHT_OLD = 0.7

def update_mastery(existing: float, new_score: float) -> float:
    return MASTERY_WEIGHT_OLD * existing + MASTERY_WEIGHT_NEW * new_score

def next_review_date(mastery_score: float) -> date:
    today = date.today()
    if mastery_score < 40:
        return today + timedelta(days=1)
    elif mastery_score <= 70:
        return today + timedelta(days=3)
    else:
        return today + timedelta(days=7)
```

```python
# services/streak_service.py
def update_streak(user: User, drill_completed_date: date) -> tuple[int, date]:
    """
    Returns (new_streak_count, new_last_drill_date).
    Pure function — no side effects, fully testable without DB.
    """
    if user.last_drill_date is None:
        return 1, drill_completed_date
    delta = (drill_completed_date - user.last_drill_date).days
    if delta == 1:
        return user.streak_count + 1, drill_completed_date
    elif delta == 0:
        return user.streak_count, user.last_drill_date  # already done today
    else:
        return 1, drill_completed_date  # missed a day, reset to 1
```

---

## 13. Configuration (Pydantic Settings)

```python
# core/config.py
class Settings(BaseSettings):
    # Database
    DATABASE_URL: str                          # required — no default

    # Auth
    JWT_SECRET_KEY: str                        # required — no default
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440   # 24h

    # AI
    GROQ_API_KEY: str = ""                    # empty = mock mode
    AI_REQUEST_TIMEOUT_SECONDS: int = 30

    # Admin
    ADMIN_SECRET: str                          # required — no default

    # CORS
    CORS_ORIGINS: str                          # required — comma-separated

    # Features
    ENABLE_OCR_FALLBACK: bool = False
    MASTERY_WEIGHT_NEW: float = 0.3

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 30

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def check_required_non_empty(self) -> "Settings":
        for field in ("DATABASE_URL", "JWT_SECRET_KEY", "ADMIN_SECRET", "CORS_ORIGINS"):
            if not getattr(self, field):
                raise ValueError(f"Required environment variable '{field}' is missing or empty")
        return self
```

Missing required variables fail at `settings = Settings()` in `main.py` — before any route is registered — so the startup error is immediately obvious.

---

## 14. Visual Design System

### Theme Tokens (CSS custom properties)

```css
:root {
  --bg-primary:    #0d0d0d;
  --bg-surface:    #141414;
  --bg-elevated:   #1c1c1c;
  --border:        #2a2a2a;
  --text-primary:  #e8e8e8;
  --text-muted:    #6a6a6a;
  --text-label:    #4a4a4a;
  --accent-ok:     #22c55e;   /* correct / good */
  --accent-warn:   #f59e0b;   /* demo mode / warnings */
  --accent-error:  #ef4444;   /* errors / weak topics */
  --accent-blue:   #3b82f6;   /* primary interactive */
  --radius:        2px;        /* sharp corners */
  --font-mono:     'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  --font-sans:     'Inter', system-ui, sans-serif;
  --label-style:   uppercase; letter-spacing: 0.08em; font-size: 0.7rem;
}
```

### Component Patterns

- **MockModeBanner:** Full-width, `var(--accent-warn)` background, `--bg-primary` text, `font-family: var(--font-mono)`, text: `▲ DEMO MODE — AI EXAMINER NOT ACTIVE`. Always rendered as the topmost element inside a session layout.
- **Labels:** All field labels, section headers use `--label-style` (uppercase + letter-spacing). Think "SUBJECT:", "DIFFICULTY:", "SCORE:".
- **Cards/surfaces:** `background: var(--bg-surface)`, `border: 1px solid var(--border)`, `border-radius: var(--radius)`. No box-shadow.
- **Error states:** `color: var(--accent-error)`, inline, never a toast for validation errors.
- **Verified/unverified badges:** Green `VERIFIED` / amber `UNVERIFIED` in label style for subjects and colleges.

---

## 15. Pitfall Mitigations (explicitly called out)

| Pitfall | Design decision that prevents it |
|---------|----------------------------------|
| DB init at import time | `create_all` only inside `lifespan` handler in `main.py`. `database.py` exposes factory functions, never creates an engine at module level. Proven by `test_import_safety.py`. |
| Results screen crash on bad payload | `ResultsPage` checks `result.status` before rendering. `ScoreBreakdown` guards all arrays with `?? []`. Insufficient session returns a structurally distinct shape. |
| Silent mock mode | `MockAIService` prefixes all output with `[DEMO]`. Session response includes `mock_mode: true`. Frontend `MockModeBanner` is mandatory in session layout when `mock_mode` is true. |
| Real-looking dev secrets | `Settings` has no default for `JWT_SECRET_KEY`, `DATABASE_URL`, `ADMIN_SECRET`. `.env.example` uses values like `your-jwt-secret-here`. |
| Render-body time/random values | `ExamCountdown`, `StreakWidget` date comparisons all computed in `useEffect`. `useCountdown` hook owns the timer state. ESLint rule `react-hooks/exhaustive-deps` enforced. |
| Seeded data as ground truth | College seed file has explicit code comment. `is_autonomous` is nullable. Correction endpoint exists. `verified_by_admin=false` by default for all user-submitted data. |

---

## 16. Testing Strategy

### Backend
- `test_import_safety.py`: Sets `DATABASE_URL=postgresql://x:x@unreachable:5432/db`, imports `app`, asserts no exception and no socket connection attempt.
- `conftest.py`: Creates an in-memory SQLite engine, calls `reset_session_factory`, runs `create_all` — completely isolated from any real DB.
- Each session endpoint test includes a sub-test with a different user's JWT asserting HTTP 403.
- `test_insufficient_session.py`: Ends a session with 0 and 1 answers, asserts `status == "insufficient_data"` in both cases.

### Frontend
- ESLint with `react-hooks/exhaustive-deps`, `no-unused-vars`, `no-console` rules enabled.
- `vite build` must exit 0 with no warnings treated as errors.
- No Jest/Vitest unit tests required at this stage (ESLint + build is the frontend gate per requirements).

---

## 17. Docker / Deployment

```yaml
# docker-compose.yml (structure)
services:
  db:
    image: postgres:16-alpine
    environment: [POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB]  # from .env
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck: pg_isready

  backend:
    build: ./backend
    depends_on: {db: {condition: service_healthy}}
    environment: [DATABASE_URL, JWT_SECRET_KEY, GROQ_API_KEY, CORS_ORIGINS, ADMIN_SECRET, ...]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      retries: 5

  frontend:
    build: ./frontend
    depends_on: [backend]
    environment: [VITE_API_BASE_URL]  # set at build time via ARG
    ports: ["80:80"]
```

Backend `Dockerfile`: multi-stage, runs as non-root user `appuser`. Frontend `Dockerfile`: multi-stage, Vite build stage → nginx serve stage.
