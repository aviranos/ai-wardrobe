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

## Phase 2 — Slice without AI

**Never trust what the browser tells you about a file.** A malicious or
just careless upload can claim to be `photo.jpg` with `Content-Type:
image/jpeg` while actually containing something else entirely. The backend
opens the *bytes* with an image library and checks what they actually are,
independent of the filename or the claimed type. This is also why the file
saved to disk is never named after the original upload — it's always a
fresh server-generated name — so nothing the user typed or uploaded can
influence a filesystem path.

**A hash is a fingerprint, not an ID.** `source_hash_front` is the SHA256
of the uploaded photo's bytes — two uploads of the literal same file
produce the same hash, which is how "did I already add this?" gets
answered without asking the user. It's deliberately narrow: it only
recognizes the *exact same photo*, not the same garment photographed
twice. That's a real limitation (documented in `PROGRESS.md`), not a bug —
recognizing "this is the same shirt from a different angle" is a
Phase-3-or-later, AI-shaped problem.

**A `UNIQUE` database constraint is a safety net, not the main check.**
The code checks for a duplicate hash before writing anything — but if two
uploads of the same photo happened at the exact same instant, both could
pass that check before either one commits. The database's `UNIQUE`
constraint on `source_hash_front` is what actually prevents two rows with
the same hash from ever existing, and the code catches that specific
database error as the backstop. This "check first, but still handle the
database saying no" pattern shows up anywhere two things might happen
concurrently.

**"Rollback" for files means "delete what you just wrote."** Databases can
undo a failed transaction automatically; a filesystem can't. So whenever
the create-item flow fails after writing an image but before the database
row is safely committed, the code explicitly deletes that file. The rule
driving this: a database row should never point at a file that doesn't
exist, and a file should never exist with nothing in the database
pointing at it.

**A schema can be bigger than what's populated yet.** The `items` table
already has every column Phase 3's AI pipeline will eventually fill in
(`subtype`, `brand`, `catalog_front_path`, ...), even though Phase 2 only
writes a handful of them. This avoids a schema migration later — Phase 3
will `UPDATE` existing rows and start writing to columns that already
exist, rather than needing to add them to a live table.

**Tests run against a temporary, throwaway database and folder.** Every
test in `test_items.py` gets its own empty SQLite file and image folder
(`tests/conftest.py`'s fixture), created fresh and discarded after. This
is why the test suite can freely create and delete items without any risk
of touching your real wardrobe data in `data/`.
