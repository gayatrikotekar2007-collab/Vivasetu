# VivaSetu

Viva (oral exam) practice simulator for engineering students at Pune colleges affiliated with SPPU.

---

## Prerequisites

- Python 3.12+
- Node.js 20+
- Docker + Docker Compose (for containerised setup)

---

## Local Development Setup

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Create your .env from the example
copy .env.example .env   # Windows
cp .env.example .env     # Mac/Linux
# Edit .env — set DATABASE_URL, JWT_SECRET_KEY, ADMIN_SECRET, CORS_ORIGINS at minimum

uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend

# Create your .env from the example
copy .env.example .env   # Windows
cp .env.example .env     # Mac/Linux
# Set VITE_API_BASE_URL=http://localhost:8000

npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## Running Tests

### Backend

```bash
cd backend
pytest
```

All tests use an in-memory SQLite database — no real DB required.

### Frontend

```bash
cd frontend
npm run lint    # 0 errors required
npm run build   # must exit 0
```

---

## Docker Compose

Brings up Postgres + backend + frontend in one command:

```bash
# 1. Create root .env from example
copy .env.example .env
# 2. Fill in real values (DATABASE_URL, JWT_SECRET_KEY, ADMIN_SECRET, CORS_ORIGINS, etc.)
# 3. Start
docker-compose up --build
```

Services:
- Frontend: `http://localhost:80`
- Backend API: `http://localhost:8000`
- Backend docs: `http://localhost:8000/docs`

---

## Environment Variables Reference

See `backend/.env.example` and `frontend/.env.example` for full documentation.
The root `.env.example` covers all variables needed for docker-compose.

**Required (app will not start without these):**
| Variable | Where | Description |
|---|---|---|
| `DATABASE_URL` | Backend | SQLite path or PostgreSQL URI |
| `JWT_SECRET_KEY` | Backend | Long random string for JWT signing |
| `ADMIN_SECRET` | Backend | Shared secret for admin endpoints (`X-Admin-Secret` header) |
| `CORS_ORIGINS` | Backend | Comma-separated frontend origins |
| `VITE_API_BASE_URL` | Frontend | Backend API base URL |

**Optional:**
| Variable | Default | Description |
|---|---|---|
| `GROQ_API_KEY` | `""` (mock mode) | Groq API key — empty enables DEMO mode |
| `AI_REQUEST_TIMEOUT_SECONDS` | `30` | Timeout for AI provider calls |
| `ENABLE_OCR_FALLBACK` | `false` | Enable OCR for scanned PDFs |
| `RATE_LIMIT_PER_MINUTE` | `30` | Rate limit for session endpoints |

---

## Demo / Mock Mode

When `GROQ_API_KEY` is empty, the app runs in **DEMO MODE**:
- The AI examiner uses pre-written canned questions
- All session screens show an amber `▲ DEMO MODE — AI EXAMINER NOT ACTIVE` banner
- `GET /health` returns `"ai_mock_mode": true`
- Voice transcription is unavailable (returns 503 with a clear message)

Demo mode is clearly distinguishable from real AI mode — responses are prefixed with `[DEMO]`.

---

## Deployment Notes

- Never commit a `.env` file — it is gitignored.
- The backend runs as a non-root user inside Docker.
- All CORS origins and secrets are environment-variable-driven — no values are hardcoded.
- For production, set `DATABASE_URL` to a PostgreSQL URI and provide a real `GROQ_API_KEY`.
