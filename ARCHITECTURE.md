# ARCHITECTURE.md

Systems-analysis level description of how the app is put together. Updated
as each phase adds real behavior.

## Components

```
┌─────────────────┐        HTTP (fetch)        ┌──────────────────┐
│  frontend/       │ ─────────────────────────▶ │  backend/         │
│  React + Vite    │ ◀───────────────────────── │  FastAPI          │
│  localhost:5173  │      JSON / image bytes     │  localhost:8000   │
└─────────────────┘                             └─────────┬─────────┘
                                                            │ sqlite3 + filesystem
                                                            ▼
                                        ┌──────────────────────────────────┐
                                        │ data/wardrobe.db                  │
                                        │ data/originals/<uuid>_front.jpg   │
                                        │ data/originals/<uuid>_back.jpg    │
                                        └──────────────────────────────────┘
```

- **`frontend/`** — the browser UI. React components call the backend over
  plain HTTP `fetch`/`FormData`. Nothing else talks to the backend; the
  frontend never touches the database or the filesystem directly — it only
  ever sees the `front_image_url`/`back_image_url` strings the API hands
  back, and loads them as `<img>` tags against the backend's static mount.
- **`backend/`** — the FastAPI app. Owns all business logic and is the only
  thing that reads/writes `data/`. Organized as:
  - `app/main.py` — creates the FastAPI app, registers routes, wires CORS,
    mounts `data/originals/` for static image serving at `/data/originals`.
  - `app/config.py` — typed settings loaded from `.env` (API keys, model
    names, the database path, the originals/catalog folders, the upload
    size limit). Nothing else in the codebase should read environment
    variables directly.
  - `app/database.py` — owns the SQLite connection and the schema. The
    full `items` table from SPEC.md §6 is created up front with
    `CREATE TABLE IF NOT EXISTS`; Phase 2 populates only a subset of its
    columns (see below).
  - `app/images.py` — upload safety: sniffs the real image format from
    file bytes (never trusts the filename or the browser-supplied
    Content-Type), enforces a size limit, computes the SHA256 hash used
    for duplicate detection, and writes files under server-generated
    `<uuid>_front.<ext>` / `<uuid>_back.<ext>` names — user input never
    becomes part of a filesystem path.
  - `app/items.py` — the item routes: create (with dedup + rollback),
    list, delete (with best-effort file cleanup and failure reporting).
  - `app/models.py` — Pydantic request/response shapes, including the
    approved category list.
  - `tests/` — pytest tests, all driven in-process via FastAPI's
    `TestClient` against a temporary SQLite file and a temporary originals
    folder (`tests/conftest.py`'s `client` fixture) so tests never touch
    real wardrobe data.
- **`data/`** — local storage. `wardrobe.db` (SQLite) plus `originals/` for
  uploaded photos (`catalog/` stays empty until Phase 3's AI pipeline
  writes processed images there). Never committed to git except as an
  empty placeholder (`.gitkeep`).
- **`prompts/`** — will hold the Gemini prompt text files from Phase 3
  (SPEC.md §8), kept as plain text (not Python code) so prompts can be
  tuned without a deploy.

## What the `items` table stores today

The table has every column from SPEC.md §6 (so Phase 3 never needs a
migration to add AI-suggested fields), but Phase 2's create flow only
writes: `id`, `source_hash_front`, `source_hash_back`, `name`, `category`,
`colors`, `original_front_path`, `original_back_path`. Everything else
(`subtype`, `style_tags`, `brand`, `catalog_front_path`, `status_catalog`,
etc.) stays `NULL` or keeps its declared default (`condition='good'`,
`status_catalog='pending'`) until the AI pipeline fills them in.

## Request/response: item endpoints

- **`POST /api/items`** — multipart form (`front` required, `back`
  optional, plus `name`/`category`/`color`). The backend validates both
  images' actual content before writing anything to disk, hashes the front
  image, and checks for an existing item with that hash. If one exists, no
  new files or DB row are written — the existing item is returned with
  `duplicate: true` and the frontend shows a small banner instead of a
  second gallery card. Otherwise: write the file(s), insert the DB row: if
  the insert fails for any reason (including a `sqlite3.IntegrityError`
  race against a near-simultaneous duplicate upload), the just-written
  file(s) are deleted before the error is returned, so a failed create
  never leaves an orphan file on disk.
- **`GET /api/items`** — lists all items, newest first. The frontend
  derives the "N pieces · N categories" header text from this list
  client-side rather than calling a separate status endpoint.
- **`DELETE /api/items/{id}`** — deletes the DB row first, then attempts to
  remove its file(s). A file that's already missing counts as removed; a
  genuine removal failure (e.g. a locked file) is logged and reported back
  as `files_removed: false` with a warning, rather than silently hidden or
  turned into a 500.
- **`GET /api/health`** — unchanged from Phase 1.

SPEC.md §9 lists the full API contract, including the endpoints later
phases will add (`PATCH`, `/retry`, `/regenerate`).

## Where things are stored

| What | Where |
|---|---|
| SQLite database | `data/wardrobe.db`, path fixed relative to `backend/app/config.py`'s own location — independent of the terminal's working directory |
| Uploaded photos | `data/originals/<item-id>_front.<ext>` and `..._back.<ext>` — filenames are always server-generated, never derived from the upload's original filename |
| Secrets | `.env` at project root (git-ignored); `.env.example` documents the required keys with no real values |
| Frontend build output | `frontend/dist/` (git-ignored, produced by `npm run build`) |

## How to run and test

See `README.md` for exact commands. In short: `uvicorn` serves the backend
on :8000, `npm run dev` serves the frontend on :5173, and `pytest` runs the
backend test suite against an in-process app instance with a temporary
database and folder (no server needs to be running for tests, and no real
wardrobe data is touched).

## What can fail, and how it's handled today

- **Backend not running / unreachable:** the frontend's `fetch` rejects,
  the UI shows a small red "Backend unreachable" banner with a Retry
  button. No crash, no blank screen.
- **Bad or oversized upload:** rejected with a 400 and a specific message
  ("Front image: ..."), shown inline on the Review step so the user can
  pick a different file without losing the name/category/color they'd
  already entered.
- **Duplicate front photo:** not an error — treated as "you already added
  this," returns the existing item instead of failing.
- **Partial delete failure:** the DB row is removed either way (so the
  item disappears from the gallery); if a file genuinely can't be removed,
  that's reported in the response and logged server-side rather than
  silently swallowed. See PROGRESS.md's "known limitations" for the rare
  case this can leave an orphan file.
- **SQLite path not writable:** `database_path.parent.mkdir()` creates the
  `data/` directory if missing; a genuine permissions failure would raise
  and FastAPI would return a 500 — there is no bespoke error handling for
  this, since it's not a realistic failure mode for a local single-user
  app.
- **CORS mismatch:** if the frontend were ever served from a different
  origin than `localhost:5173`, the browser would block the response
  silently (visible as a console CORS error, not a UI state). This is a
  known limitation to revisit if the dev port ever changes.
