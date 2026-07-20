# LEARNING_LOG.md

What to take away from each phase, conceptually. Not an activity log — see
`PROGRESS.md` for what was actually built.

## Phase 1 — Scaffold

**Frontend and backend are two separate programs that only talk over HTTP.**
The React app (port 5173) and the FastAPI app (port 8000) don't share
memory, imports, or a process — the only connection between them is the
`fetch("/api/health")` call and the JSON it gets back. This is why they can
be developed, restarted, and even deployed independently later. It's also
why "the backend is down" and "the frontend is down" are two different,
independently diagnosable failures — you saw this directly in the red vs.
green connection dot.

**An API contract is a promise about shape, not implementation.** SPEC.md
§9 lists routes like `GET /api/items` before any of them exist. That's
normal: defining *what goes in and what comes out* of an endpoint is a
design decision that can be made and agreed on before the logic behind it is
written. `/api/health`'s contract (`{status, version, database}`) is the
simplest possible example of this pattern.

**Config lives outside code, in `.env`.** `GEMINI_API_KEY`,
`IMAGE_MODEL`, `TEXT_MODEL` are read from environment variables via
`config.py`, not hardcoded. This means swapping a model version, or handing
the API key to a teammate, never requires touching or redeploying code —
and secrets never end up in git history, which is permanent and hard to
scrub from.

**Tests don't need a running server.** `pytest` exercises the FastAPI app
in-process via `TestClient` — no `uvicorn` process, no real network call.
This is why tests can run in seconds and why they'll be safe to run
automatically (e.g. before every commit) without needing paid AI calls or a
live database of real data.

**A virtual environment (`.venv`) and `package.json`/`node_modules` do the
same job for two ecosystems.** Both exist so that this project's exact
dependency versions are isolated from whatever else is installed on your
machine — critical once Phase 3 pins specific Gemini SDK versions.
