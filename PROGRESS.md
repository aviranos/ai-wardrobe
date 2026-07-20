# PROGRESS.md

## Current phase

**Phase 1 — Scaffold**, per SPEC.md §11. Implementation complete, pending
your personal run/confirm before the final commit (per our working
agreement in `CLAUDE.md`).

## Completed

- Git repository initialized (not yet committed — see "Next step").
- `backend/`: FastAPI app, `pydantic-settings`-based config, SQLite
  connection helper, `GET /api/health` (returns status, app version,
  DB connectivity). CORS restricted to `http://localhost:5173`.
- `backend/tests/test_health.py`: passes (`pytest -v`).
- `frontend/`: Vite + React + TypeScript, Tailwind CSS v4 via
  `@tailwindcss/vite` (no legacy config files). Single screen that calls
  `/api/health` on load and shows a connected/checking/error state.
- Verified end-to-end in the browser preview: backend + frontend running
  together, health screen shows "Backend connected", version `0.1.0`,
  database `connected`. No console errors.
- `.env.example`, `README.md` with exact run/test commands.
- `CLAUDE.md`, `DECISIONS.md`, `ARCHITECTURE.md`, `LEARNING_LOG.md`,
  `docs/conversation-context.md`.

## Next step

You run the app locally yourself (see README.md), confirm the health screen
works, then approve the commit. Once committed, Phase 2 ("Slice without AI"
— Add Item upload, file storage, `items` table, gallery showing raw images)
is planned and executed the same way: plan → approval → small steps.

## Known limitations (expected at this phase, not bugs)

- No `items` table yet — SQLite connection is proven, but there's no schema.
- No upload, gallery, or item pages — just the health screen.
- Starlette's `TestClient` currently emits a `StarletteDeprecationWarning`
  about a future `httpx` → `httpx2` migration. It's a warning, not a
  failure; worth a glance when upgrading dependencies later, not an action
  item now.
- Frontend has no routing or state management library — not needed until
  there's more than one screen (Phase 2+).
