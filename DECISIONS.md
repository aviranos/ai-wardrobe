# DECISIONS.md

Build-time technical/product decisions, in addition to SPEC.md §7 (D1-D15,
which this file does not repeat). Newest at the bottom.

## Phase 1

**Versioning split.** The application reports its own product version
(`0.1.0`, currently hardcoded in `backend/app/main.py`). `SPEC.md`'s document
revision is tracked separately and is currently `0.3`, even though its
in-file header still reads "v0.2" — the header wasn't bumped when the
revision moved. These two version numbers are independent: one describes the
spec document, the other describes the running app.
*Rationale:* the spec document and the shipped product don't necessarily
move in lockstep; conflating them would force an app version bump on every
doc edit.

**Tailwind CSS v4 via `@tailwindcss/vite`.** Installed `tailwindcss@^4.3.3`
and `@tailwindcss/vite@^4.3.3` as the Vite plugin. No `tailwind.config.js` or
`postcss.config.js` — v4's Vite plugin handles this without them. Styling is
enabled with a single `@import "tailwindcss";` in `src/index.css`.
*Rationale:* this is Tailwind's current official integration path for Vite
projects; the old PostCSS-config approach is the legacy pattern for v3 and
earlier.

**SQLite path resolution.** `backend/app/config.py` computes the database
path (`data/wardrobe.db`) from the config file's own location
(`Path(__file__).resolve()`), not from the process's current working
directory.
*Rationale:* `uvicorn` can be launched from different directories; a
cwd-relative path would silently create a second, empty database if run from
the wrong place.

**CORS restricted to the Vite dev origin.** Backend allows
`http://localhost:5173` only.
*Rationale:* least-privilege default; there is exactly one frontend origin
in local dev, so there's no reason to allow `*`.

**No frontend `.env` yet.** The API base URL defaults to
`http://localhost:8000` in code (`frontend/src/App.tsx`), overridable via an
optional `VITE_API_BASE_URL` if ever needed, but no `.env` file is required
to run Phase 1.
*Rationale:* avoids a second env-file convention for a value that has one
sane default during local-only development.

### Deployment timing

Deployment is deferred until the core upload and AI catalog flow works.
During development, mobile testing may use the home network. A private
server deployment may be added after M1 and before the public-product
milestone M7.
