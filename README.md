# AI Wardrobe

Local-first wardrobe digitization prototype. See [SPEC.md](SPEC.md) for full
product scope and [ARCHITECTURE.md](ARCHITECTURE.md) for how the system fits
together.

**Current phase:** Phase 2 — Slice without AI (see [PROGRESS.md](PROGRESS.md)).

## Prerequisites

- Python 3.12+
- Node.js 24 LTS+

## Run it (two terminals, two commands)

**Terminal 1 — backend:**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — frontend:**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — it should show the "My Wardrobe" home screen
(empty state on first run). Add an item via "Add New Item": upload a front
photo, optionally add a back photo, fill in the minimal Review step, and
save — it should appear in the gallery and survive a page refresh. The
health check API is still available at http://localhost:8000/api/health.

## Configuration

Copy `.env.example` to `.env` at the project root and fill in real values when
Phase 3 (AI pipeline) begins. Phases 1–2 run with no `.env` at all — defaults
are built in.

## Tests

```bash
cd backend
.venv\Scripts\activate
pytest -v
```

## Project layout

See [ARCHITECTURE.md](ARCHITECTURE.md) for what each folder is responsible for.
