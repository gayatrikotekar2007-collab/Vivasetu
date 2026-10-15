# VivaSetu — Implementation Tasks

**Derived from:** requirements.md v1.0 + design.md v1.0
**Execution order:** Complete each group fully and verify the app runs before starting the next group.

---

## GROUP 1: FOUNDATION
> Milestone: A running backend with JWT auth and a React frontend scaffold that can register, log in, and hit a protected route. No AI, no college data, no sessions yet.

- [x] **TASK-1.01** — Create project directory structure
  - `backend/app/{core,models,routes,schemas,services}/` with `__init__.py` in each
  - `backend/tests/`, `backend/seed/`, `backend/alembic/`
  - `frontend/src/{pages,components,hooks,services,styles,utils}/`
  - Root-level `docker-compose.yml`, `.github/workflows/`

- [x] **TASK-1.02** — Backend dependency setup
  - Create `backend/requirements.txt` with pinned versions: `fastapi`, `uvicorn[standard]`, `sqlalchemy[asyncio]`, `pydantic[email]`, `pydantic-settings`, `passlib[bcrypt]`, `python-jose[cryptography]`, `python-multipart`, `pypdf`, `python-docx`, `groq`, `slowapi`, `pytest`, `pytest-asyncio`, `httpx`
  - Create `backend/.env.example` with obviously-fake placeholder values for all required vars: `DATABASE_URL`, `JWT_SECRET_KEY`, `ADMIN_SECRET`, `CORS_ORIGINS`, `GROQ_API_KEY`, `AI_REQUEST_TIMEOUT_SECONDS`, `ENABLE_OCR_FALLBACK`, `RATE_LIMIT_PER_MINUTE`, `MASTERY_WEIGHT_NEW`

- [x] **TASK-1.03** — Backend config (`app/core/config.py`)
  - Pydantic `Settings` class reading all env vars
  - `@model_validator` that raises `ValueError` with the variable name for any missing required field (`DATABASE_URL`, `JWT_SECRET_KEY`, `ADMIN_SECRET`, `CORS_ORIGINS`)
  - `GROQ_API_KEY` defaults to `""` (empty = mock mode, not an error)

- [x] **TASK-1.04** — Database module (`app/core/database.py`) — lifespan-gated pattern
  - Expose `create_engine_from_url(url)`, `create_session_factory(engine)`, `reset_session_factory(engine)` as standalone functions
  - Module-level `_session_factory` variable initialized to `None`; `get_db()` dependency raises `RuntimeError` if called before `reset_session_factory` is invoked
  - **No engine creation, no `create_all`, no connection attempt at module import time**
  - `Base = declarative_base()` is the only module-level object touching SQLAlchemy

- [x] **TASK-1.05** — FastAPI app factory + lifespan handler (`app/main.py`)
  - `@asynccontextmanager async def lifespan(app)`: creates engine from `settings.DATABASE_URL`, calls `reset_session_factory(engine)`, calls `Base.metadata.create_all(bind=engine)`, yields, disposes engine
  - Registers all routers with `/api/v1` prefix
  - Configures CORS from `settings.CORS_ORIGINS` (split on comma) — no hardcoded origin
  - Mounts the lifespan handler on the `FastAPI()` instance

- [x] **TASK-1.06** — Import safety test (`tests/test_import_safety.py`)
  - Sets `DATABASE_URL=postgresql://x:x@unreachable-host-that-does-not-exist:5432/db` in environment
  - Imports `from app.main import app`
  - Asserts no exception is raised
  - This test must pass before any other backend work is considered done

- [x] **TASK-1.07** — Test infrastructure (`tests/conftest.py`)
  - Creates an in-memory SQLite engine
  - Calls `Base.metadata.create_all` on it
  - Calls `reset_session_factory` to wire `get_db` to the test engine
  - Provides a `client` fixture using `httpx.AsyncClient` + `ASGITransport`
  - All test DB state is isolated per test via transactions or table truncation

- [x] **TASK-1.08** — Security utilities (`app/core/security.py`)
  - `hash_password(plain: str) -> str` using `passlib[bcrypt]`
  - `verify_password(plain: str, hashed: str) -> bool`
  - `create_access_token(data: dict, expires_delta: timedelta) -> str` using `python-jose`
  - `decode_access_token(token: str) -> dict` — raises `HTTPException(401)` on invalid/expired

- [x] **TASK-1.09** — User model (`app/models/user.py`)
  - SQLAlchemy 2.x declarative style (`mapped_column`, `Mapped`)
  - Fields per design.md §4.1: id (UUID), email, full_name, hashed_password, college_id (nullable FK), branch, branch_other, academic_year, syllabus_mode, exam_date, streak_count, last_drill_date, profile_complete, created_at

- [x] **TASK-1.10** — Auth schemas (`app/schemas/auth.py`)
  - `RegisterRequest`: email (validated), password (min 8 chars), full_name
  - `LoginRequest`: email, password
  - `TokenResponse`: access_token, token_type
  - `UserProfile`: all user fields except hashed_password

- [x] **TASK-1.11** — Auth dependency (`app/core/dependencies.py`)
  - `get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)) -> User`
  - Decodes JWT, looks up user by id, raises `HTTPException(401)` if not found or token invalid

- [x] **TASK-1.12** — Auth routes (`app/routes/auth.py`)
  - `POST /auth/register`: validates request, checks email uniqueness (409 if duplicate), hashes password, creates user, returns `TokenResponse`
  - `POST /auth/login`: looks up user by email, verifies password, returns `TokenResponse` or 401

- [x] **TASK-1.13** — User routes (`app/routes/users.py`)
  - `GET /users/me`: returns `UserProfile` for current user
  - `PATCH /users/me/profile`: updates college_id, branch, branch_other, academic_year, syllabus_mode, exam_date; sets `profile_complete=true` when all required fields are present

- [x] **TASK-1.14** — Health route (`app/routes/health.py`)
  - `GET /health`: returns `{"status": "ok", "ai_mock_mode": <bool>, "db_ok": <bool>}`
  - `ai_mock_mode` is `True` when `settings.GROQ_API_KEY` is empty
  - `db_ok` attempts a lightweight DB ping; returns `false` (not 500) if DB is unreachable

- [x] **TASK-1.15** — Auth tests (`tests/test_auth.py`)
  - Register success, duplicate email 409, short password 422
  - Login success, wrong password 401, unknown email 401
  - `GET /users/me` with valid token, with no token (401), with expired token (401)

- [x] **TASK-1.16** — Frontend dependency setup
  - `npm create vite@latest frontend -- --template react`
  - Install: `react-router-dom`, `axios`, `framer-motion` (optional, only if needed)
  - Create `frontend/.env.example` with `VITE_API_BASE_URL=http://your-backend-url-here`
  - Configure ESLint: add `react-hooks/exhaustive-deps`, `no-unused-vars`, `no-console` rules

- [x] **TASK-1.17** — Frontend API service (`src/services/api.js`)
  - Axios instance with `baseURL` from `import.meta.env.VITE_API_BASE_URL`
  - Request interceptor: attaches `Authorization: Bearer <token>` from `localStorage`
  - Response interceptor: on 401, clears token, redirects to `/login`
  - **No hardcoded URL string anywhere in this file**

- [x] **TASK-1.18** — Auth service + hook (`src/services/authService.js`, `src/hooks/useAuth.js`)
  - `authService.register(data)`, `authService.login(data)`, `authService.logout()`
  - `useAuth()` hook: exposes `user`, `token`, `login()`, `logout()`, `isAuthenticated`
  - Token stored/read from `localStorage` only; never in component state directly

- [x] **TASK-1.19** — Protected route + router setup (`src/components/ProtectedRoute.jsx`, `src/App.jsx`)
  - `ProtectedRoute`: if no token → redirect `/login`; if `profile_complete=false` → redirect `/onboarding` (except when already at `/onboarding`)
  - `App.jsx`: sets up all routes from design.md §9 with correct public/protected wrappers
  - React Router v6 `<BrowserRouter>` + `<Routes>`

- [x] **TASK-1.20** — Login and Register pages (`src/pages/LoginPage.jsx`, `src/pages/RegisterPage.jsx`)
  - Terminal/exam-console visual style: dark background, monospace labels, sharp corners
  - Form validation: client-side (empty fields, password min length) + server error display
  - No `console.log` statements; no inline `Date.now()` / `Math.random()`

- [x] **TASK-1.21** — Global CSS design system (`src/styles/globals.css`)
  - All CSS custom properties from design.md §14
  - Base reset, body background, font stacks
  - `.label` utility class (uppercase, letter-spacing, small font)
  - `.badge-verified` / `.badge-unverified` classes

- [x] **TASK-1.22** — Backend `Dockerfile` (initial)
  - Multi-stage: `python:3.12-slim` build stage installs dependencies; runtime stage copies app, creates non-root `appuser`, runs uvicorn
  - Does not hardcode any env var value

- [x] **TASK-1.23** — Frontend `Dockerfile` (initial)
  - Multi-stage: `node:20-alpine` build stage runs `vite build`; nginx stage serves `dist/`
  - `VITE_API_BASE_URL` passed as `ARG` at build time

- [x] **TASK-1.24** — `docker-compose.yml` (initial, backend + frontend only; Postgres added in Group 6)
  - Uses `environment:` referencing `.env` file variables — no hardcoded values
  - Backend healthcheck on `/health`

- [x] **TASK-1.25** — Verify Group 1 milestone
  - `pytest tests/test_import_safety.py tests/test_auth.py` passes
  - Frontend `npm run build` exits 0, `eslint` exits 0
  - `docker-compose up` brings backend to healthy state
  - Manual: register an account, log in, hit `/health`, `/users/me`

---

## GROUP 2: CORE LOOP
> Milestone: A student can complete the full viva flow — onboarding → start session → answer questions (mock AI) → end session → see results screen. Session ownership enforced. Mock mode visibly labeled.

- [x] **TASK-2.01** — Enums (`app/models/enums.py`)
  - `BranchEnum`: all 9 values from REQ-2.2.1
  - `AcademicYearEnum`: FE, SE, TE, BE
  - `DifficultyEnum`: Friendly, Strict, Brutal
  - `SyllabusModeEnum`: sppu, college_own
  - `ApprovalStatusEnum`: pending, approved, rejected
  - All as Python `str` enum so SQLAlchemy stores them as strings

- [x] **TASK-2.02** — College model + seed (`app/models/college.py`, `seed/colleges.py`)
  - Model fields per design.md §4.2
  - `normalized_name` computed property: lowercase, strip punctuation
  - `CollegeAutonomyCorrection` model
  - Seed file with 8–10 well-known Pune engineering colleges; must include the required comment about COEP and correctable status
  - Seed is called once from lifespan handler only if `colleges` table is empty

- [x] **TASK-2.03** — College routes + schemas (`app/routes/colleges.py`, `app/schemas/college.py`)
  - `GET /colleges/search?q=`: substring match on `normalized_name`, max 10 results
  - `POST /colleges`: create new, `verified_by_admin=false`
  - `POST /colleges/{id}/report-autonomy`: create `CollegeAutonomyCorrection`

- [x] **TASK-2.04** — College tests (`tests/test_colleges.py`)
  - Search returns correct results, empty results for no match
  - Add new college; verify `verified_by_admin=false`
  - Report autonomy correction created

- [x] **TASK-2.05** — Subject model + seed (`app/models/subject.py`, `seed/subjects.py`)
  - Model fields per design.md §4.3
  - Seed: at least Computer Engineering/BE and IT/BE subjects with required code comment
  - Unique constraint on `(name, branch, academic_year)`

- [x] **TASK-2.06** — Subject routes + schemas
  - `GET /subjects?branch=&year=`: returns all subjects including `is_verified` field
  - `POST /subjects/suggest`: creates subject with `is_verified=false`, visible immediately

- [x] **TASK-2.07** — Onboarding page (`src/pages/OnboardingPage.jsx`)
  - 4-step flow: college search → syllabus mode (conditional on `is_autonomous`) → branch → academic year
  - College search: type-ahead using `GET /colleges/search`, debounced input, "Add new college" fallback
  - All steps editable; submits to `PATCH /users/me/profile`
  - Redirects to `/` on completion
  - Shows correction affordance ("Report incorrect classification") next to autonomy status

- [x] **TASK-2.08** — AI service interface + implementations (`app/services/ai_service.py`)
  - `AIService` Protocol with `is_mock_mode`, `generate_question`, `score_session`, `transcribe_audio`
  - `MockAIService`: `is_mock_mode=True`; questions prefixed `[DEMO]`; score returns valid shape with `mock_mode=True`; `transcribe_audio` raises `AIProviderNotConfiguredError`
  - `GroqAIService`: implements all methods against Groq API; request timeout from `settings.AI_REQUEST_TIMEOUT_SECONDS`
  - `get_ai_service()` FastAPI dependency: returns `GroqAIService` if `GROQ_API_KEY` non-empty, else `MockAIService`
  - Retry-once on transient errors; retry-with-corrective-instruction on JSON parse failure

- [x] **TASK-2.09** — VivaSession model (`app/models/session.py`)
  - `VivaSession` fields per design.md §4.4
  - `SessionTurn` model: session_id FK, turn_index, question, answer, answered_at

- [x] **TASK-2.10** — Session schemas (`app/schemas/session.py`)
  - `StartSessionRequest`: subject_id (UUID), difficulty (DifficultyEnum — 422 on invalid value)
  - `AnswerRequest`: answer (str, min 1 char)
  - `SessionResponse`: question, session_id, mock_mode (bool), turn_index
  - `SessionScoreResponse`: status ("ok"), topics (list of TopicScore), mock_mode
  - `TopicScore`: topic_name, score, student_answer_summary, model_answer, gap_description
  - `InsufficientDataResponse`: status ("insufficient_data"), message
  - `ScoringFailedResponse`: status ("scoring_failed"), message, turns_saved

- [x] **TASK-2.11** — Session routes (`app/routes/sessions.py`)
  - `POST /sessions/start`: creates VivaSession, generates first question, returns `SessionResponse`
  - `POST /sessions/{id}/answer`: **ownership check first (403)**, appends turn, generates next question
  - `POST /sessions/{id}/end`: **ownership check first (403)**, checks answered count ≥ 2, scores or returns `InsufficientDataResponse`
  - `GET /sessions/{id}`: ownership check, returns session detail

- [x] **TASK-2.12** — Session ownership tests (`tests/test_sessions.py`)
  - Register two users (user A, user B)
  - User A starts a session
  - Assert `POST /sessions/{id}/answer` with user B's token → 403
  - Assert `POST /sessions/{id}/end` with user B's token → 403
  - Assert `GET /sessions/{id}` with user B's token → 403
  - Assert end session with 0 answers → `{"status": "insufficient_data"}`
  - Assert end session with 1 answer → `{"status": "insufficient_data"}`
  - Assert end session with 2+ answers (mock mode) → score shape with all required fields

- [x] **TASK-2.13** — Admin route (`app/routes/admin.py`)
  - `get_admin_user` dependency: reads `X-Admin-Secret` header, compares to `settings.ADMIN_SECRET`, raises 403 if mismatch
  - `POST /admin/college-autonomy-corrections/{id}/approve`
  - `POST /admin/college-autonomy-corrections/{id}/reject`

- [x] **TASK-2.14** — MockModeBanner component (`src/components/MockModeBanner.jsx`)
  - Renders only when `mockMode === true`
  - Full-width amber bar: `▲ DEMO MODE — AI EXAMINER NOT ACTIVE`
  - Monospace font, `var(--accent-warn)` background, always topmost in session layout
  - No prop → no render (controlled by session state, not a toggle)

- [x] **TASK-2.15** — Session page (`src/pages/SessionPage.jsx`)
  - Loads session on mount; renders `MockModeBanner` if `session.mock_mode`
  - Displays current question in a styled card with turn counter
  - Text answer input with "Submit" button
  - "End session" button → calls end endpoint → navigates to results
  - All session state in `useState`/`useEffect`; no inline computed values

- [x] **TASK-2.16** — Results page (`src/pages/ResultsPage.jsx`)
  - Entry guard: if `result.status === 'insufficient_data'` or `result.status === 'scoring_failed'` → render informative message, no `ScoreBreakdown`, no navigation to score view
  - `ScoreBreakdown` component: `(scoreData.topics ?? []).map(...)` — every field has a `?? '—'` fallback
  - Displays per-topic: score bar, student_answer_summary, model_answer, gap_description
  - Mock mode banner if applicable

- [x] **TASK-2.17** — Home page skeleton (`src/pages/HomePage.jsx`)
  - Placeholder sections for streak, countdown, weak topics (populated in Group 4)
  - "Start Practice Session" button → subject selection → `/session/:id`
  - Reads `profile_complete` from auth; redirects to onboarding if false

- [x] **TASK-2.18** — Verify Group 2 milestone
  - Full flow: register → onboard → start session (mock) → answer 3 questions → end → results screen with all fields populated
  - Start session with `"difficulty": "invalid"` → 422
  - End session with 1 answer → informative message (not results screen)
  - User B cannot access User A's session (403)
  - MockModeBanner visible throughout session
  - `pytest tests/test_sessions.py tests/test_colleges.py` passes

---

## GROUP 3: SPPU SYLLABUS + SHARED NOTES
> Milestone: Autonomous-college students can upload notes, those notes are stored in the shared pool, and future students from the same college/branch/subject are offered existing notes before uploading.

- [x] **TASK-3.01** — NotesDocument model (`app/models/notes.py`)
  - Fields per design.md §4.6
  - Composite index on `(college_id, branch, subject_id, is_active, uploaded_at DESC)`

- [x] **TASK-3.02** — Document extraction service (`app/services/document_service.py`)
  - `DocumentExtractor` class with `extract(file_bytes, filename) -> str`
  - PDF extraction via `pypdf`; DOCX via `python-docx`; TXT direct decode
  - Raises `DocumentTooLargeError` if `len(file_bytes) > 10 MB`
  - Raises `InsufficientTextError` if `word_count < 200`
  - Raises `UnsupportedFormatError` for other extensions
  - OCR path (pytesseract) behind `settings.ENABLE_OCR_FALLBACK` flag; off by default
  - Code comment: "Smarter multi-document ranking is a future upgrade — use most recent for now."

- [x] **TASK-3.03** — Notes schemas (`app/schemas/notes.py`)
  - `NotesDocumentResponse`: id, college_id, branch, subject_id, filename, word_count, uploaded_at
  - `NotesUploadResponse`: document (NotesDocumentResponse), shared_message (str — the disclosure line)
  - `NotesCheckResponse`: exists (bool), document (NotesDocumentResponse | None)

- [x] **TASK-3.04** — Notes routes (`app/routes/notes.py`)
  - `GET /notes?college_id=&branch=&subject_id=`: returns most recent active document or `{"exists": false}`
  - `POST /notes/upload`: multipart form with file + college_id + branch + subject_id; validates size and word count; persists; returns `NotesUploadResponse` with `shared_message = "This document will be shared with future students from your college in the same branch and subject."`
  - Document selection: query for most recent active doc for the (college, branch, subject) triple; if multiple exist, take the one with highest `uploaded_at` — do not concatenate

- [x] **TASK-3.05** — Notes tests (`tests/test_notes.py`)
  - Upload valid PDF → success, word_count populated, shared_message present
  - Upload file > 10 MB → 422
  - Upload file with < 200 words → 422
  - Upload unsupported format → 422
  - Upload two documents for same (college, branch, subject); verify GET returns the more recent one
  - GET with no existing notes → `{"exists": false}`

- [x] **TASK-3.06** — Integrate notes into session start
  - `POST /sessions/start` accepts optional `notes_document_id`
  - If provided, fetches `extracted_text` and passes it to `AIService.generate_question` as `notes_context`
  - If the document's `word_count == 0` or `extracted_text` is empty, return 422 — do not start a session with empty context

- [x] **TASK-3.07** — Notes upload page (`src/pages/NotesUploadPage.jsx`)
  - On mount: calls `GET /notes` for current user's college/branch/subject
  - If notes exist: shows "Use existing notes from [college name]" as primary action, upload as secondary
  - Before upload form submit: renders the disclosure line ("This document will be shared…") visibly above the submit button — not in fine print, not in a modal
  - On upload success: navigates to session start with `notes_document_id` pre-filled

- [x] **TASK-3.08** — Admin notes delete route
  - `DELETE /admin/notes/{id}`: requires `X-Admin-Secret`; sets `is_active=false` (soft delete); does not destroy record

- [x] **TASK-3.09** — Verify Group 3 milestone
  - Upload notes → start session using those notes → AI (mock) uses notes context label in question
  - Second student from same college sees "Use existing notes" before upload option
  - Upload with < 200 words → 422 with clear message
  - Soft delete via admin endpoint → document no longer returned in GET
  - `pytest tests/test_notes.py` passes

---

## GROUP 4: CROWDSOURCING + RETENTION LOOP
> Milestone: Topic mastery tracked across sessions. Home screen shows weak topics and streak. Exam countdown visible. Daily drill functional. Post-session question reporting prompt appears.

- [x] **TASK-4.01** — TopicMastery model (`app/models/mastery.py`)
  - Fields per design.md §4.7
  - Unique constraint on `(user_id, topic_name, subject_id)`

- [x] **TASK-4.02** — ReportedQuestion model (`app/models/questions.py`)
  - `ReportedQuestion` fields per design.md §4.8
  - `ReportedQuestionUpvote` junction table with composite PK `(user_id, question_id)`

- [x] **TASK-4.03** — DrillSession model (`app/models/session.py` — add to existing file)
  - Fields per design.md §4.5
  - `drill_date` is a `DATE` type (not timestamp); indexed for streak queries

- [x] **TASK-4.04** — Mastery service (`app/services/mastery_service.py`)
  - `update_mastery(existing_score, new_score, weight_new) -> float`
  - `next_review_date(mastery_score) -> date`: <40 → +1 day; 40–70 → +3 days; >70 → +7 days
  - Both are pure functions with no DB access — fully unit-testable

- [x] **TASK-4.05** — Streak service (`app/services/streak_service.py`)
  - `update_streak(streak_count, last_drill_date, completed_date) -> tuple[int, date]`
  - Pure function per design.md §12: +1 if consecutive day, no change if same day, reset to 1 if gap > 1 day
  - Unit tests for all three branches in `tests/test_streak.py`

- [x] **TASK-4.06** — Post-session mastery update
  - After `POST /sessions/{id}/end` produces a valid score, extract per-topic scores
  - Upsert `TopicMastery` records: if exists → `update_mastery()`; if new → create with score as initial
  - Call `next_review_date()` and set `next_review_due`
  - This runs inside the same DB transaction as session end

- [x] **TASK-4.07** — Mastery routes + schemas (`app/routes/mastery.py`, `app/schemas/mastery.py`)
  - `GET /users/me/mastery`: returns all `TopicMastery` for current user, sorted by `next_review_due ASC`
  - Response includes: topic_name, mastery_score, next_review_due, subject_id, branch, session_count

- [x] **TASK-4.08** — Reported questions routes + schemas
  - `POST /reported-questions`: creates with `approval_status=pending`
  - `GET /reported-questions?branch=&subject_id=`: returns only `approved` records
  - `POST /reported-questions/{id}/upvote`: upsert into `ReportedQuestionUpvote`; idempotent (200 always)
  - `POST /admin/reported-questions/{id}/approve` and `/reject`: admin-gated

- [x] **TASK-4.09** — Drill routes (`app/routes/sessions.py` — add drill endpoints)
  - `POST /drill/start`: checks if drill already completed today (UTC); if so, returns existing; creates `DrillSession`, selects 5 questions from weakest/most-overdue topics
  - `POST /drill/{id}/answer`: ownership check (403); records answer
  - `POST /drill/{id}/complete`: ownership check; marks completed; calls `update_streak()`; saves `streak_count` and `last_drill_date` to user profile

- [x] **TASK-4.10** — Exam countdown component (`src/components/ExamCountdown.jsx`)
  - Receives `examDate` prop (ISO string or null)
  - Computes days remaining in `useEffect`, stores in `useState` — **not** in render body
  - Renders: "X days until your viva" / "Your viva is today!" / "Your viva was N days ago" / nothing if no date
  - Re-computes only when `examDate` prop changes

- [x] **TASK-4.11** — Streak widget (`src/components/StreakWidget.jsx`)
  - Receives `streakCount` prop
  - Renders flame icon + count; "Start your streak today" if count is 0
  - No date computation in render body

- [x] **TASK-4.12** — Topic mastery card (`src/components/TopicMasteryCard.jsx`)
  - Displays topic name, mastery score bar (color: red < 40, amber 40–70, green > 70), next_review_due
  - "Practice this topic" button → navigates to `/session/new?topic=<>&subject_id=<>`

- [x] **TASK-4.13** — Home page (complete) (`src/pages/HomePage.jsx`)
  - Fetches `GET /users/me/mastery` on mount → top 5 due topics via `TopicMasteryCard`
  - Renders `ExamCountdown` and `StreakWidget` from user profile data
  - "Daily Drill" button → `/drill` (visually distinct from "Start Practice Session")
  - All fetched data stored in `useState`; no inline fetching in render

- [x] **TASK-4.14** — Drill page (`src/pages/DrillPage.jsx`)
  - Different visual header: "DAILY DRILL — 5 QUESTIONS" (not "Practice Session")
  - No difficulty selector
  - 5-question flow; on completion calls `/drill/{id}/complete`
  - Shows updated streak count on completion screen

- [x] **TASK-4.15** — Post-session report prompt
  - After results screen loads (and only for non-insufficient-data results), shows a dismissible card: "Did any of these match a question from your real viva? Report it to help others."
  - "Report a question" → modal/page with question text field + subject pre-filled
  - "Dismiss" → closes card, no state change to session result
  - Dismissal does not affect navigation or result display

- [x] **TASK-4.16** — Reported questions page (`src/pages/ReportedQuestionsPage.jsx`)
  - Shows approved questions filtered by user's branch
  - Upvote button (idempotent); shows upvote count
  - Search/filter by subject

- [x] **TASK-4.17** — Profile page (`src/pages/ProfilePage.jsx`)
  - Editable form for college, branch, academic year, syllabus mode, exam date
  - Exam date input: date picker, clearable
  - Shows college's autonomy status with "Report correction" link

- [x] **TASK-4.18** — Mastery tests (`tests/test_mastery.py`)
  - `update_mastery` pure function: correct weighted average
  - `next_review_date`: correct intervals for scores in each band
  - After a scored session, `GET /users/me/mastery` returns updated records

- [x] **TASK-4.19** — Verify Group 4 milestone
  - Complete 2 sessions; verify mastery updates; verify home screen shows weak topics
  - Complete daily drill; verify streak increments
  - Miss a day (set `last_drill_date` back 2 days in test DB); complete drill; verify streak resets to 1
  - Set exam date; verify countdown displays correctly on home screen
  - Report a question post-session; verify it appears as pending (not in public list until approved)
  - Approve via admin endpoint; verify it appears in public list
  - `pytest tests/test_mastery.py tests/test_streak.py` passes

---

## GROUP 5: VOICE MODE
> Milestone: Student can hold-to-talk, review transcript, and submit. Fallback to text on mic denial. Questions read aloud. Countdown auto-submits.

- [x] **TASK-5.01** — Transcription route (`app/routes/sessions.py` — add to existing)
  - `POST /sessions/{id}/transcribe`: ownership check (403); accepts multipart audio file
  - Validates format (webm, wav, mp4, m4a, ogg) → 422 for others
  - Validates size ≤ 25 MB → 422
  - Calls `ai_service.transcribe_audio()`; returns `{"transcript": "<text>"}`
  - When `ai_service.is_mock_mode`: returns 503 with `{"error": "transcription_unavailable", "message": "AI provider not configured. Voice mode requires a valid Groq API key."}`
  - Never returns 500 for a misconfigured provider

- [x] **TASK-5.02** — `useVoiceRecorder` hook (`src/hooks/useVoiceRecorder.js`)
  - On mount: checks `typeof MediaRecorder !== 'undefined'`; sets `isSupported` state
  - `startRecording()`: calls `navigator.mediaDevices.getUserMedia({audio: true})`; on `NotAllowedError` sets `error = 'permission_denied'`; on other error sets `error = 'unavailable'`
  - Records to webm chunks in a ref
  - `stopRecording()`: assembles `Blob`, sets `audioBlob` state
  - All state: `isSupported`, `isRecording`, `audioBlob`, `error` — no computed values in return

- [x] **TASK-5.03** — `useCountdown` hook (`src/hooks/useCountdown.js`)
  - `useCountdown(initialSeconds, onExpire)`
  - Initializes `secondsLeft` in `useEffect` (not in initial state inline call or render)
  - Decrements via `setInterval` in `useEffect`; clears interval on unmount
  - Calls `onExpire()` when `secondsLeft` reaches 0
  - Exposes: `secondsLeft`, `reset()`

- [x] **TASK-5.04** — VoiceRecorder component (`src/components/VoiceRecorder.jsx`)
  - If `!isSupported`: renders text input with note "Voice mode not supported in this browser"
  - If `error === 'permission_denied'`: renders text input with message "Microphone access denied — using text mode"
  - If `error === 'unavailable'`: renders text input with message "Microphone unavailable — using text mode"
  - Otherwise: hold-to-talk button (`onPointerDown` → start, `onPointerUp`/`onPointerCancel` → stop)
  - Visual states: idle, recording (pulsing indicator), uploading transcript

- [x] **TASK-5.05** — TranscriptConfirm component (`src/components/TranscriptConfirm.jsx`)
  - Receives `transcript` string and `onSubmit(text)` callback
  - Renders editable `<textarea>` pre-filled with transcript
  - "Submit answer" button — the only way to submit; no auto-submit on mount or transcript change
  - "Re-record" button clears transcript and re-activates recorder

- [x] **TASK-5.06** — CountdownTimer component (`src/components/CountdownTimer.jsx`)
  - Uses `useCountdown` hook
  - Displays `MM:SS` format
  - Color transitions: green → amber (< 30s) → red (< 10s) using CSS classes, not inline style
  - Calls `onExpire` which auto-submits whatever answer is currently in state

- [x] **TASK-5.07** — Integrate voice mode into SessionPage (`src/pages/SessionPage.jsx`)
  - Voice mode toggle (only shown if `isSupported`)
  - When voice mode active: render `VoiceRecorder`, `TranscriptConfirm` (after recording), `CountdownTimer`
  - Speech synthesis: `window.speechSynthesis.speak(new SpeechSynthesisUtterance(question))` called in `useEffect` when `question` state changes — not inline
  - Countdown expiry: auto-submits `currentAnswer` state value (transcript or typed text, whichever is present)

- [x] **TASK-5.08** — Verify Group 5 milestone
  - Hold-to-talk → transcript shown in editable field → edit → submit → answer sent
  - Deny microphone → fallback text mode shown with clear message
  - Mock mode → hold-to-talk unavailable with message about API key; text mode still works
  - Countdown reaches 0 → answer auto-submitted; results page loads normally
  - Question text is read aloud on new question arrival (test in browser manually)
  - `pytest tests/test_sessions.py` (transcribe endpoint: wrong format 422, too large 422, mock mode 503)

---

## GROUP 6: HARDENING AND DEPLOYMENT
> Milestone: Rate limiting, timeouts, full Docker stack with Postgres, CI pipelines, zero ESLint errors, README.

- [x] **TASK-6.01** — Rate limiting (`app/core/dependencies.py`)
  - Add `slowapi` limiter; apply `@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")` to `POST /sessions/start` and `POST /sessions/{id}/answer`
  - 429 response shape: `{"error": "rate_limit_exceeded", "retry_after_seconds": <n>}`
  - Limit keyed by authenticated user id (not IP)

- [x] **TASK-6.02** — AI provider timeout enforcement
  - All Groq API calls wrapped with `asyncio.wait_for(..., timeout=settings.AI_REQUEST_TIMEOUT_SECONDS)`
  - On `asyncio.TimeoutError`: raise `AIServiceUnavailableError` — route handler catches and returns 503
  - Test: mock a slow Groq response, assert 503 returned within timeout + 1s

- [x] **TASK-6.03** — CORS hardening audit
  - Grep entire `backend/` and `frontend/src/` for string literals `localhost` and `127.0.0.1` in URL contexts
  - Every occurrence must be in a `.env.example`, a test file, or a comment — never in shipped app code
  - Verify `CORS_ORIGINS` split and applied correctly in `main.py`

- [x] **TASK-6.04** — Frontend env audit
  - Grep `frontend/src/` for any hardcoded URL string — every API call must go through `api.js`
  - `VITE_API_BASE_URL` is the only place the backend URL is configured

- [x] **TASK-6.05** — ESLint final pass
  - Run `eslint src/` — fix all errors to zero
  - Check all `array.map()` calls in JSX: wrap with `(arr ?? []).map(...)` or `arr?.map(...)` where array could be undefined
  - Check all `Date.now()`, `new Date()`, `Math.random()` calls — none may appear inside a component function body outside a `useEffect` or event handler
  - Remove all `console.log` statements

- [x] **TASK-6.06** — Dead code cleanup
  - Remove any empty files, placeholder components with no implementation, unused imports
  - Verify every file in `src/pages/` and `src/components/` is imported and used somewhere

- [x] **TASK-6.07** — Backend Dockerfile finalize
  - Multi-stage build confirmed working
  - Non-root user confirmed
  - `EXPOSE 8000`, `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`

- [x] **TASK-6.08** — Frontend Dockerfile finalize
  - Multi-stage: build stage passes `VITE_API_BASE_URL` as `ARG`
  - nginx stage: serves `dist/` on port 80; includes nginx config for React Router (try_files fallback)

- [x] **TASK-6.09** — `docker-compose.yml` finalize
  - Add `db` service: `postgres:16-alpine`, named volume `pgdata`, healthcheck via `pg_isready`
  - `backend` depends on `db` with `condition: service_healthy`
  - `frontend` depends on `backend`
  - All credentials/URLs via environment variables, no hardcoded values
  - `docker-compose up --build` must bring all three services healthy

- [x] **TASK-6.10** — GitHub Actions: backend CI (`.github/workflows/backend.yml`)
  - Triggers on `push` and `pull_request` with path filter `backend/**`
  - Steps: checkout → `pip install -r requirements.txt` → `pytest` with SQLite test DB
  - Uses `actions/setup-python@v5` pinned to Python 3.12

- [x] **TASK-6.11** — GitHub Actions: frontend CI (`.github/workflows/frontend.yml`)
  - Triggers on `push` and `pull_request` with path filter `frontend/**`
  - Steps: checkout → `npm ci` → `npm run lint` → `npm run build`
  - Uses `actions/setup-node@v4` pinned to Node 20

- [x] **TASK-6.12** — Top-level README
  - Sections: Project overview, Prerequisites, Local dev setup (with `.env` from `.env.example`), Running with Docker Compose, Running tests (backend pytest, frontend lint+build), Environment variables reference, Deployment notes
  - No hardcoded URLs or credentials in examples; use placeholder values matching `.env.example`

- [x] **TASK-6.13** — Final integration verification
  - `docker-compose up --build` → all three services healthy
  - `pytest` (full suite) → all pass
  - `npm run lint` → 0 errors; `npm run build` → exits 0
  - Manual flow: register → onboard → start session → answer → end → results (full score)
  - Manual flow: voice mode (if browser supports) → hold-to-talk → confirm transcript → submit
  - Manual flow: daily drill → streak increments on home screen
  - Manual flow: set exam date → countdown shows on home screen
  - `/health` returns `{"status": "ok", "ai_mock_mode": true, "db_ok": true}` (or false for mock)
  - Attempt to access another user's session → 403 confirmed in network tab

---

## Task Summary

| Group | Tasks | Milestone |
|-------|-------|-----------|
| 1 — Foundation | TASK-1.01 to 1.25 | Running app with JWT auth |
| 2 — Core Loop | TASK-2.01 to 2.18 | Full viva session end-to-end (mock AI) |
| 3 — Syllabus + Notes | TASK-3.01 to 3.09 | Shared notes pool working |
| 4 — Crowdsourcing + Retention | TASK-4.01 to 4.19 | Mastery, streak, drill, countdown |
| 5 — Voice Mode | TASK-5.01 to 5.08 | Voice input + transcript confirm |
| 6 — Hardening | TASK-6.01 to 6.13 | Rate limits, Docker, CI, zero lint errors |

**Total: 74 tasks**
