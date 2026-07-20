# ARCHITECTURE.md

Systems-analysis level description of how the app is put together. Updated
as each phase adds real behavior — Phase 1 only has a connectivity check, so
the "data flow" section below is deliberately thin.

## Components

```
┌─────────────────┐        HTTP (fetch)        ┌──────────────────┐
│  frontend/       │ ─────────────────────────▶ │  backend/         │
│  React + Vite    │ ◀───────────────────────── │  FastAPI          │
│  localhost:5173  │        JSON response        │  localhost:8000   │
└─────────────────┘                             └─────────┬─────────┘
                                                            │ sqlite3
                                                            ▼
                                                  ┌──────────────────┐
                                                  │ data/wardrobe.db  │
                                                  └──────────────────┘
```

- **`frontend/`** — the browser UI. React components call the backend over
  plain HTTP `fetch`. Nothing else talks to the backend; the frontend never
  touches the database or the filesystem directly.
- **`backend/`** — the FastAPI app. Owns all business logic and is the only
  thing that reads/writes `data/`. Organized as:
  - `app/main.py` — creates the FastAPI app, registers routes, wires CORS.
  - `app/config.py` — typed settings loaded from `.env` (API keys, model
    names, the database path). Nothing else in the codebase should read
    environment variables directly.
  - `app/database.py` — owns the SQLite connection. Phase 1 only proves a
    connection opens and closes; table schemas start in Phase 2.
  - `tests/` — pytest tests. `test_health.py` drives the API in-process via
    FastAPI's `TestClient` (no real network call, no server process needed).
- **`data/`** — local storage. `wardrobe.db` (the SQLite file) plus, from
  Phase 2 on, `originals/` and `catalog/` for uploaded/processed images.
  Never committed to git except as an empty placeholder (`.gitkeep`).
- **`prompts/`** — will hold the Gemini prompt text files from Phase 3
  (SPEC.md §8), kept as plain text (not Python code) so prompts can be
  tuned without a deploy.

## Request/response: `GET /api/health`

- **Caller:** the frontend, once on page load (`App.tsx`).
- **Backend does:** opens and closes a SQLite connection at startup and
  again on each call to `check_connection()`; returns app version and DB
  status. Makes no external network calls, touches no files.
- **Response shape:** `{"status": "ok", "version": "0.1.0", "database": "connected"}`.
- **Frontend does:** renders a connection dot (amber while checking, green
  once connected, red on fetch failure) and the two returned fields.

This is the only endpoint that exists in Phase 1. SPEC.md §9 lists the full
API contract that later phases will implement.

## Where things are stored

| What | Where |
|---|---|
| SQLite database | `data/wardrobe.db`, path fixed relative to `backend/app/config.py`'s own location — independent of the terminal's working directory |
| Secrets | `.env` at project root (git-ignored); `.env.example` documents the required keys with no real values |
| Frontend build output | `frontend/dist/` (git-ignored, produced by `npm run build`) |

## How to run and test

See `README.md` for exact commands. In short: `uvicorn` serves the backend
on :8000, `npm run dev` serves the frontend on :5173, and `pytest` runs the
backend test suite against an in-process app instance (no server needs to be
running for tests).

## What can fail, and how it's handled today

- **Backend not running / unreachable:** the frontend's `fetch` rejects, the
  UI shows a red "Backend unreachable" state with the error message. No
  crash, no blank screen.
- **SQLite path not writable:** `database_path.parent.mkdir()` creates the
  `data/` directory if missing; a genuine permissions failure would raise
  from `check_connection()` and FastAPI would return a 500 — there is no
  bespoke error handling for this yet, since it's not a realistic failure
  mode for a local single-user app.
- **CORS mismatch:** if the frontend were ever served from a different
  origin than `localhost:5173`, the browser would block the response
  silently (visible as a console CORS error, not a UI state). This is a
  known limitation to revisit if the dev port ever changes.
