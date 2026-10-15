# VivaSetu — Requirements 

**Product:** VivaSetu — Viva (oral exam) practice simulator for SPPU engineering students
**Target users:** Engineering students at Pune colleges affiliated with Savitribai Phule Pune University (SPPU), including autonomous colleges
**Spec version:** 1.0

---

## Group 1: Foundation

### REQ-1.1 — Project Scaffold

**User Story:**
As a developer, I need a well-structured project scaffold with clearly separated concerns so the codebase is maintainable and testable from day one.

**Acceptance Criteria:**
- AC-1.1.1: Backend follows the directory structure `backend/app/{models, routes, schemas, services, core}` with an `__init__.py` in each package.
- AC-1.1.2: Frontend follows `frontend/src/{pages, components, hooks, services}`.
- AC-1.1.3: A `.env.example` file exists at `backend/.env.example` with all required variables listed and placeholder values only (no real secrets, keys, or credentials — placeholders must be obviously fake, e.g. `your-secret-key-here`, not a real-looking random string).
- AC-1.1.4: A `.env.example` file exists at `frontend/.env.example` with all required frontend variables.
- AC-1.1.5: A `GET /health` endpoint returns `{"status": "ok"}` with HTTP 200 and no authentication required.
- AC-1.1.6: Both backend and frontend have a `README.md` explaining local setup and how to run.

---

### REQ-1.2 — Database Initialization (Critical — lifespan-gated)

**User Story:**
As a developer, I need the database to initialize only on real app startup so that importing the app module for testing never accidentally connects to or migrates a real database.

**Acceptance Criteria:**
- AC-1.2.1: `SQLAlchemy.create_all()` (or any migration call) is invoked **only** inside a FastAPI `lifespan` async context manager, never at module import time.
- AC-1.2.2: A pytest test must exist that sets `DATABASE_URL` to a syntactically valid but unreachable host (e.g., `postgresql://user:pass@unreachable-host:5432/db`) and imports the FastAPI `app` object — this import must complete without raising any exception, without attempting any network connection, and without creating any files. This test must pass.
- AC-1.2.3: A `reset_session_factory(engine)` utility function is provided for test isolation; tests can call it to point the session factory at an in-memory SQLite engine without restarting the process.
- AC-1.2.4: The database URL is read exclusively from the `DATABASE_URL` environment variable; SQLite is used when the variable points to a file path (local dev), Postgres when it points to a `postgresql://` URI (production). No other database configuration mechanism exists in shipped code.
- AC-1.2.5: No database file, migration log, or connection attempt artifact is produced by running the backend's test suite in a clean environment.

---

### REQ-1.3 — JWT Authentication

**User Story:**
As a student, I need to create an account and log in securely so my practice history and progress are mine alone.

**Acceptance Criteria:**
- AC-1.3.1: `POST /auth/register` accepts `{email, password, full_name}`, validates email format and password minimum length (≥8 chars), and returns a JWT access token on success.
- AC-1.3.2: Passwords are hashed using a well-maintained library (e.g., `passlib[bcrypt]` or `bcrypt` directly); no hand-rolled hashing.
- AC-1.3.3: `POST /auth/login` accepts `{email, password}` and returns a JWT access token, or HTTP 401 on invalid credentials.
- AC-1.3.4: A `get_current_user` FastAPI dependency reads the JWT from the `Authorization: Bearer <token>` header and returns the authenticated user, or raises HTTP 401.
- AC-1.3.5: The JWT secret is read from an environment variable; a missing or empty secret must cause the app to fail at startup, not silently generate insecure tokens.
- AC-1.3.6: Frontend stores the token in `localStorage`, attaches it automatically to every authenticated request via an axios interceptor, and redirects unauthenticated users to `/login` when a 401 is received.
- AC-1.3.7: A protected-route component on the frontend prevents accessing authenticated pages without a valid token stored client-side.
- AC-1.3.8: Token expiry is configurable via environment variable; default is 24 hours.

---

## Group 2: Core Loop

### REQ-2.1 — College Model and Search

**User Story:**
As a student, I need to find my college by name and have the app know whether it follows the standard SPPU syllabus or its own, so questions are relevant to my actual curriculum.

**Acceptance Criteria:**
- AC-2.1.1: A `College` model exists with fields: `id`, `name`, `normalized_name` (lowercase, punctuation-stripped, for fuzzy search), `is_autonomous` (nullable boolean — `None` means "unknown/needs verification"), `city`, `verified_by_admin` (boolean, default false), `added_by_user_id` (FK, nullable), `created_at`.
- AC-2.1.2: `GET /colleges/search?q=<term>` performs a case-insensitive substring match on `normalized_name` and returns up to 10 results.
- AC-2.1.3: `POST /colleges` allows any authenticated user to add a college that doesn't exist yet; the new record has `verified_by_admin=false`.
- AC-2.1.4: A seed file contains a small, explicitly illustrative set of well-known Pune autonomous engineering colleges. The seed file must include a code comment stating: "This list is illustrative only. Autonomy status changes — e.g., COEP became a fully independent deemed university and is no longer SPPU-affiliated. Treat all entries as correctable, not ground truth."
- AC-2.1.5: `POST /colleges/{id}/report-autonomy` accepts `{is_autonomous: bool, reason: string}` from any authenticated user and creates a correction request; admin can approve it via `POST /admin/college-autonomy-corrections/{id}/approve` protected by a shared-secret header (`X-Admin-Secret`), not a full role system.
- AC-2.1.6: The `is_autonomous` field is **never** treated as permanent; UI must show a "Report correction" affordance on any college whose autonomy status is shown.

---

### REQ-2.2 — Branch and Academic Year

**User Story:**
As a student, I need to specify my engineering branch and academic year so questions are drawn from my actual syllabus.

**Acceptance Criteria:**
- AC-2.2.1: Branch is a validated server-side enum with values: `Computer Engineering`, `Information Technology`, `Electronics & Telecommunication`, `AI & ML`, `AI & Data Science`, `Mechanical Engineering`, `Civil Engineering`, `Electrical Engineering`, `Other`.
- AC-2.2.2: When branch is `Other`, a free-text `branch_other` field (max 100 chars) is accepted and stored.
- AC-2.2.3: Academic year is a validated enum: `FE` (First Year), `SE` (Second Year), `TE` (Third Year), `BE` (Final Year).
- AC-2.2.4: Both are stored on the student's profile and editable at any time — not a one-time irreversible choice.

---

### REQ-2.3 — Onboarding Flow

**User Story:**
As a first-time user, I need a guided setup that asks for my college, branch, academic year, and syllabus preference so I can immediately start relevant practice.

**Acceptance Criteria:**
- AC-2.3.1: After first login (profile incomplete), the frontend routes the user to an onboarding screen before any other page.
- AC-2.3.2: Onboarding step 1: College search with type-as-you-go results; "Add new college" option appears if no match is found or the student's college is not listed.
- AC-2.3.3: Onboarding step 2: If the selected college `is_autonomous=true`, a choice is shown: "Practice with standard SPPU syllabus" or "Use my college's own syllabus." If `is_autonomous=false` or `null`, standard SPPU syllabus is used (with a note if status is unknown).
- AC-2.3.4: Onboarding step 3: Branch selection (enum + optional free-text for Other).
- AC-2.3.5: Onboarding step 4: Academic year selection.
- AC-2.3.6: All onboarding choices are written to `PATCH /users/me/profile`; any step can be revisited from a "Edit profile" page after onboarding.
- AC-2.3.7: Profile completeness is checked on every page load; incomplete profiles redirect to onboarding.

---

### REQ-2.4 — Viva Session and Examiner Flow

**User Story:**
As a student, I need an AI examiner to ask me questions, evaluate my answers, and end the session with a scored breakdown so I know exactly where I'm weak.

**Acceptance Criteria:**
- AC-2.4.1: `POST /sessions/start` creates a `VivaSession` record and returns the first question. Required body fields: `subject_id`, `difficulty`. Difficulty is a validated enum: `Friendly`, `Strict`, `Brutal` — a request with any other value must return HTTP 422, not silently fall back to a default.
- AC-2.4.2: `POST /sessions/{id}/answer` accepts the student's answer, generates the next question, and returns it. Returns 403 if the session does not belong to the requesting user.
- AC-2.4.3: `POST /sessions/{id}/end` ends the session and returns the score. Returns 403 if the session does not belong to the requesting user.
- AC-2.4.4: Every session-touching endpoint verifies `session.user_id == current_user.id` and returns HTTP 403 (not 404) if the check fails. This must be tested explicitly.
- AC-2.4.5: Ending a session with fewer than 2 answered questions returns HTTP 200 with a payload of shape `{"status": "insufficient_data", "message": "<human-readable reason>"}` — **not** a score-shaped payload. The frontend must check for `status === "insufficient_data"` before rendering any results and must show an informative message instead of navigating to the results screen.
- AC-2.4.6: The final score payload includes, per topic: `topic_name`, `score` (0–100), `student_answer_summary` (brief summary of what the student said), `model_answer` (concise correct answer), `gap_description` (specific description of what was missing or incorrect). All arrays in the score payload must be present (never `undefined` or `null`) — the frontend must defensively check each array before mapping over it.
- AC-2.4.7: The AI service layer has a clearly queryable `is_mock_mode: bool` property. When mock mode is active (no API key configured or no Groq package installed), every session-start response includes `"mock_mode": true` in the body. The frontend must display a visible, amber-colored banner reading "DEMO MODE — AI examiner not active" on every screen within a mock-mode session. Mock mode responses must never look identical to real AI responses in the UI.
- AC-2.4.8: The AI service includes retry-once logic for transient HTTP errors from the Groq provider (5xx, timeout).
- AC-2.4.9: The AI service includes a retry-with-corrective-instruction policy for scoring responses: if the first parse of the score JSON fails, a second call is made with an instruction to return valid JSON only; if the second parse also fails, the session is ended with a structured error payload (not a crash).
- AC-2.4.10: The `VivaSession` model stores: `id`, `user_id`, `subject_id`, `difficulty`, `started_at`, `ended_at`, `question_count`, `mock_mode` (bool).

---

## Group 3: SPPU Syllabus + Shared Notes

### REQ-3.1 — Subject Model

**User Story:**
As a student, I need the app to know which subjects exist for my branch and year so it can ask relevant questions without me manually entering topics.

**Acceptance Criteria:**
- AC-3.1.1: A `Subject` model exists with fields: `id`, `name`, `branch` (enum), `academic_year` (enum), `is_verified` (bool, default false for student-suggested), `added_by_user_id` (nullable FK), `created_at`.
- AC-3.1.2: A seed set of subjects is provided for at least `Computer Engineering` / `BE` and `IT` / `BE` to demonstrate the pattern. Subjects in the seed must be labeled as illustrative starter data in a code comment.
- AC-3.1.3: `GET /subjects?branch=<>&year=<>` returns all subjects for the given branch and year, with `is_verified` included in the response so the frontend can label unverified ones.
- AC-3.1.4: `POST /subjects/suggest` allows any authenticated user to suggest a missing subject. Suggestions appear immediately in `GET /subjects` results labeled `is_verified=false` — they are **not** hidden pending moderation.
- AC-3.1.5: Subjects store names only — no unit-by-unit syllabus content, no scraped PDF data. The code must include a comment: "Subject names only — do not store or embed official SPPU syllabus PDFs (copyrighted, changes yearly)."

---

### REQ-3.2 — Shared Notes Documents

**User Story:**
As a student at an autonomous college using the "college's own syllabus" path, I need to be able to upload notes once, have them used immediately for my session, and have future students from my college and branch benefit from them automatically.

**Acceptance Criteria:**
- AC-3.2.1: A `NotesDocument` model exists with fields: `id`, `college_id`, `branch` (enum), `subject_id`, `uploader_user_id`, `filename`, `extracted_text`, `word_count`, `uploaded_at`, `is_active` (bool).
- AC-3.2.2: Before prompting a student to upload, `GET /notes?college_id=<>&branch=<>&subject_id=<>` is called. If an active document exists, the frontend offers "Use existing notes from [college name]" and only offers the upload option as a secondary action.
- AC-3.2.3: `POST /notes/upload` accepts PDF, DOCX, or TXT files. Validates: max 10 MB file size, minimum 200 words extracted. Returns HTTP 422 with a specific error message if either validation fails.
- AC-3.2.4: When multiple documents exist for the same `(college, branch, subject)`, the most recently uploaded active document is used — documents are **not** concatenated (to avoid exceeding LLM context limits). A code comment must note: "Smarter multi-document ranking is a future upgrade — use most recent for now."
- AC-3.2.5: At upload time, a single visible line is shown to the student (not a modal, not small print): "This document will be shared with future students from your college in the same branch and subject." This line must appear before the upload is submitted.
- AC-3.2.6: An OCR fallback for scanned PDFs is available behind a `ENABLE_OCR_FALLBACK` environment variable flag (default off); when off, scanned PDFs with no extractable text return HTTP 422 with a message "Could not extract text. Enable OCR or upload a text-based PDF."
- AC-3.2.7: `DELETE /admin/notes/{id}` is protected by `X-Admin-Secret` header and sets `is_active=false` (soft delete). It does not permanently destroy the record.
- AC-3.2.8: Uploaded documents are validated to have a minimum word count before being used for AI question generation; sessions started with zero extracted text must return an error, not silently generate generic questions.

---

## Group 4: Crowdsourcing + Retention Loop

### REQ-4.1 — Reported Questions Bank

**User Story:**
As a student, I want to report real questions I was asked in my actual viva so future students practicing on VivaSetu can encounter those exact questions.

**Acceptance Criteria:**
- AC-4.1.1: A `ReportedQuestion` model exists with fields: `id`, `subject_id`, `topic`, `college_id` (nullable), `branch` (enum), `question_text`, `upvotes` (int, default 0), `approval_status` (enum: `pending`, `approved`, `rejected`), `reported_by_user_id`, `created_at`.
- AC-4.1.2: Post-session, a dismissible, non-blocking prompt appears asking if any session question matched a real viva question. Dismissing does not affect the session result or prevent navigation.
- AC-4.1.3: `POST /reported-questions` creates a new report with `approval_status=pending`.
- AC-4.1.4: `GET /reported-questions?branch=<>&subject_id=<>` returns only `approved` questions publicly.
- AC-4.1.5: `POST /reported-questions/{id}/upvote` increments `upvotes` by 1; authenticated users only; a user cannot upvote the same question twice (idempotent, returns 200 without double-counting).
- AC-4.1.6: `POST /admin/reported-questions/{id}/approve` and `…/reject` are protected by `X-Admin-Secret` and set `approval_status` accordingly.
- AC-4.1.7: Approved reported questions are incorporated into the question pool for future sessions for the relevant subject/branch.

---

### REQ-4.2 — Topic Mastery and Spaced Repetition

**User Story:**
As a student, I want the app to track which topics I'm weak in across all my sessions and tell me what to study next, so I don't waste time re-practicing things I already know.

**Acceptance Criteria:**
- AC-4.2.1: A `TopicMastery` model exists with fields: `id`, `user_id`, `topic_name`, `branch` (enum), `subject_id`, `mastery_score` (float 0–100), `session_count` (int), `last_practiced_at`, `next_review_due` (date).
- AC-4.2.2: After every session, `mastery_score` is updated using a simple moving average (new score weighted against existing — configurable weight, default 0.3 new / 0.7 old).
- AC-4.2.3: `next_review_due` is calculated as: if `mastery_score < 40`, review in 1 day; if 40–70, review in 3 days; if >70, review in 7 days.
- AC-4.2.4: `GET /users/me/mastery` returns all topic mastery records for the current user, sorted by `next_review_due` ascending (most overdue first).
- AC-4.2.5: The home screen displays the top 5 due/weak topics with a "Practice this topic" button that navigates directly to a session pre-configured for that topic and subject.
- AC-4.2.6: Topic mastery is computed across **all** sessions, not just the most recent one.

---

### REQ-4.3 — Exam Date Countdown

**User Story:**
As a student, I want to set my exam date and see a countdown so I have a constant sense of urgency and time remaining to prepare.

**Acceptance Criteria:**
- AC-4.3.1: `PATCH /users/me/profile` accepts an `exam_date` field (ISO 8601 date string).
- AC-4.3.2: When `exam_date` is set, the home screen displays a countdown in the format "X days until your viva" (or "Your viva is today!" if same day, or "Your viva was N days ago" if past).
- AC-4.3.3: The countdown is computed in a `useEffect` or derived from a single state variable — **not** computed directly in the render body, to avoid flicker on re-renders.
- AC-4.3.4: The exam date can be updated or cleared at any time.

---

### REQ-4.4 — Daily Drill and Streak

**User Story:**
As a student, I want a short daily practice drill that takes under 5 minutes so I can maintain a study streak without committing to a full session every day.

**Acceptance Criteria:**
- AC-4.4.1: A daily drill consists of exactly 5 questions drawn from the student's weakest or most-overdue topics (based on `TopicMastery.next_review_due`).
- AC-4.4.2: The drill is visually distinct from a full practice session (different header label, no difficulty selection, time-boxed UI cue).
- AC-4.4.3: Completing a drill on a calendar day (UTC) where the student has not already completed one increments `streak_count` by 1.
- AC-4.4.4: If a student has no completed drill for the previous calendar day, `streak_count` resets to 1 (not 0) on the next completion.
- AC-4.4.5: `streak_count` and `last_drill_date` are stored on the student profile. Streak calculation must be deterministic and tested — no randomness or time-based logic in the business logic layer.
- AC-4.4.6: A `DrillSession` model exists, separate from `VivaSession`, to avoid polluting full-session analytics with drill data.
- AC-4.4.7: The home screen displays the current streak with a flame or indicator icon; if streak is 0, it shows "Start your streak today."

---

## Group 5: Voice Mode

### REQ-5.1 — Audio Transcription (Server-Side)

**User Story:**
As a student, I want to answer viva questions by speaking, just like a real viva, so the practice feels authentic.

**Acceptance Criteria:**
- AC-5.1.1: `POST /sessions/{id}/transcribe` accepts a multipart audio file upload and returns `{"transcript": "<text>"}`.
- AC-5.1.2: Transcription is performed via Groq's Whisper-compatible endpoint. The AI service wrapper handles this call; it is not called directly from the route handler.
- AC-5.1.3: When the AI provider is not configured (mock mode), the endpoint returns HTTP 503 with `{"error": "transcription_unavailable", "message": "AI provider not configured. Voice mode requires a valid Groq API key."}` — it must never crash or return a 500 in this case.
- AC-5.1.4: Accepted audio formats: webm, wav, mp4, m4a, ogg. Other formats return HTTP 422.
- AC-5.1.5: Maximum audio file size: 25 MB. Larger files return HTTP 422.

---

### REQ-5.2 — Client-Side Voice Interface

**User Story:**
As a student, I need a hold-to-talk recording button, a countdown timer, and the ability to review and edit my transcription before submitting, so I'm never penalized for a mishearing.

**Acceptance Criteria:**
- AC-5.2.1: A hold-to-talk button starts recording on `pointerdown` and stops on `pointerup` or `pointercancel`.
- AC-5.2.2: After recording stops, the transcript is fetched from the server and displayed in an editable text field. The student must explicitly click "Submit answer" — transcripts are **never** auto-submitted without user confirmation.
- AC-5.2.3: A visible countdown timer (configurable seconds per question, default 90 seconds) is shown during the answer period. When it reaches zero, the current answer (transcript if available, typed text if in text mode) is automatically submitted.
- AC-5.2.4: The examiner's question text is read aloud using the browser's `window.speechSynthesis` API when voice mode is active.
- AC-5.2.5: If `navigator.mediaDevices.getUserMedia` is unavailable or permission is denied, a visible message is shown: "Microphone access unavailable — switching to text mode." The UI seamlessly falls back to text input. No crash, no blank screen.
- AC-5.2.6: Voice mode is only offered if the browser supports `MediaRecorder` API; if not supported, the text input is shown by default with a note "Voice mode not supported in this browser."
- AC-5.2.7: All voice-mode UI state (recording, uploading, awaiting confirmation, countdown ticking) is managed through React state/effects, never computed inline in JSX.

---

## Group 6: Hardening and Deployment

### REQ-6.1 — Rate Limiting and Timeouts

**User Story:**
As the system operator, I need rate limits on AI-heavy endpoints and timeouts on all provider calls to prevent quota exhaustion from abuse or runaway requests.

**Acceptance Criteria:**
- AC-6.1.1: `POST /sessions/start` and `POST /sessions/{id}/answer` are rate-limited per authenticated user: configurable via environment variable, default 30 requests per minute per user.
- AC-6.1.2: All Groq API calls have a configurable request timeout (env var `AI_REQUEST_TIMEOUT_SECONDS`, default 30). A timeout raises a structured service error, not an unhandled exception.
- AC-6.1.3: Rate limit exceeded returns HTTP 429 with `{"error": "rate_limit_exceeded", "retry_after_seconds": <n>}`.

---

### REQ-6.2 — CORS and Environment Configuration

**User Story:**
As a developer deploying VivaSetu, I need all URLs, secrets, and CORS origins to come from environment variables so I can deploy to any environment without modifying code.

**Acceptance Criteria:**
- AC-6.2.1: CORS allowed origins are read from a `CORS_ORIGINS` environment variable (comma-separated list). No origin is hardcoded in any shipped code path (including dev defaults in source files).
- AC-6.2.2: The frontend API base URL is read from `VITE_API_BASE_URL` environment variable only.
- AC-6.2.3: The `.env.example` files document every required variable. Missing required variables cause the app to fail at startup with a clear error message naming the missing variable.
- AC-6.2.4: No string `localhost` or `127.0.0.1` appears in any non-example, non-test source file in a URL context.

---

### REQ-6.3 — Docker and docker-compose

**User Story:**
As a developer or operator, I need to bring up the entire stack (backend + Postgres + frontend) with a single `docker-compose up` so setup is reproducible.

**Acceptance Criteria:**
- AC-6.3.1: A `Dockerfile` exists for the backend that builds a production-ready image; does not run as root.
- AC-6.3.2: A `Dockerfile` exists for the frontend that builds a production-ready static bundle and serves it (e.g., via nginx).
- AC-6.3.3: `docker-compose.yml` at the repo root wires backend + Postgres + frontend, uses named volumes for Postgres data, and configures a `healthcheck` on the backend container using the `/health` endpoint.
- AC-6.3.4: No service in `docker-compose.yml` has hardcoded credentials or URLs; all are passed via environment variables referenced from a `.env` file.
- AC-6.3.5: `docker-compose up` must bring the stack to a healthy state with no manual steps beyond creating a `.env` from `.env.example`.

---

### REQ-6.4 — CI Pipeline

**User Story:**
As a developer, I need CI to run backend tests and frontend lint + build on every push so regressions are caught automatically.

**Acceptance Criteria:**
- AC-6.4.1: A GitHub Actions workflow runs `pytest` for the backend, triggered on changes to `backend/**`.
- AC-6.4.2: A GitHub Actions workflow runs `eslint` and `vite build` for the frontend, triggered on changes to `frontend/**`.
- AC-6.4.3: Both pipelines must pass before a feature is considered done.
- AC-6.4.4: The CI workflow installs Python/Node dependencies from a lockfile (not floating versions).

---

### REQ-6.5 — Code Quality

**User Story:**
As a developer, I need the codebase to be free of dead code, ESLint errors, and render-body anti-patterns so it's maintainable and correct.

**Acceptance Criteria:**
- AC-6.5.1: Zero ESLint errors in the frontend at time of delivery.
- AC-6.5.2: No dead scaffold code (empty files, placeholder components with no content, unused imports).
- AC-6.5.3: No time- or randomness-based value (e.g., `Date.now()`, `Math.random()`, `new Date()`) is computed directly inside a React render body or JSX expression. All such values are derived from state or computed in a `useEffect`.
- AC-6.5.4: No `console.log` debugging statements in shipped frontend code.
- AC-6.5.5: All `array.map()` calls in JSX are guarded: either the array is typed to never be `null/undefined`, or there is an explicit `?.map()` or `(arr ?? []).map()` guard.

---

## Cross-Cutting Security and Data-Integrity Requirements

These apply across all groups and must not be softened or dropped:

### REQ-SEC-1 — Session Ownership Enforcement
Every endpoint that reads or writes a `VivaSession` or `DrillSession` must verify the session's `user_id` matches the authenticated user. A mismatch must return HTTP 403. This must be covered by an explicit test for each endpoint.

### REQ-SEC-2 — Mock Mode Transparency
When the AI service is in mock mode (no provider key configured), this fact must be visibly surfaced in:
- Every session-start API response (`"mock_mode": true`)
- Every session screen in the frontend (amber banner: "DEMO MODE — AI examiner not active")
- The `/health` endpoint response (`"ai_mock_mode": true/false`)

Mock mode responses must be structurally distinguishable from real AI responses in the API contract — they must never look identical.

### REQ-SEC-3 — No Real-Looking Dev Fallbacks
No environment variable, config file, or source code default may contain a value that looks like a real secret (e.g., a randomly-generated string, a real API key, a plausible JWT secret). All defaults and examples must be obviously fake (e.g., `your-groq-api-key-here`).

### REQ-SEC-4 — Correctable Classifications
College autonomy status, subject verification status, and notes document quality are all correctable, not permanent. The system must provide correction/reporting endpoints for each. No piece of seeded or user-submitted classification is trusted without the ability to override it.

### REQ-SEC-5 — Insufficient Session Guard
The frontend must treat `{"status": "insufficient_data"}` as a non-navigable terminal state. It must never pass this shape to the results rendering component. The results component must itself guard against missing or malformed arrays regardless of caller intent.
