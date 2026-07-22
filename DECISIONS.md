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

## Phase 2

Product decisions approved by the product owner before Phase 2 planning
began. SPEC.md is updated in the places these change actual product
behavior (§3, §5, §9, §11); this log keeps the rationale.

**D17 — Visual direction.** Warm, elegant, classic, premium — like a
restrained fashion boutique. Warm off-white/beige tones around `#F2EDE4`,
generous whitespace, serif headings, clean sans-serif UI text.
*Rationale:* luxury reads through restraint, not decoration; also keeps the
UI palette consistent with the catalog-image background already specified
in SPEC.md §8.1.

**D18 — Gallery presentation.** The wardrobe gallery should feel like a
premium fashion e-commerce catalog: images are the main focus, cards stay
visually quiet and uncluttered.
*Rationale:* the catalog is the product's core asset (SPEC.md D1); it
should look like one from day one, even before AI-processed images exist.

**D19 — Fast intake first.** The first digitization flow prioritizes speed.
Full metadata enrichment can happen later; users should be able to add many
garments without completing a long form each time.
*Rationale:* the fastest path to a populated, testable wardrobe is a short
add-item loop, consistent with SPEC.md §3.1's 60-second target.

**D20 — Home screen.** Title "My Wardrobe". Shows a minimal item count, a
minimal category count, and the wardrobe gallery. No dashboards, charts,
recommendations, or complex navigation in Phase 2.
*Rationale:* Phase 2 is a vertical slice, not the analytics-rich M2/M4
product; keep the home screen legible and simple.

**D21 — Add item entry points.** One clear "Add New Item" button near the
top of the home screen, plus one larger call-to-action in the empty state.
*Rationale:* two entry points cover both the populated-gallery case and the
first-run case without adding navigation complexity.

**D22 — Photo flow.** Front photo uploads first; afterward the user is
asked whether to add an optional back photo. The back photo is never
mandatory.
*Rationale:* matches SPEC.md §6 (`original_back_path` is nullable) and
keeps the fast-intake loop (D19) from being blocked by an optional step.

**D23 — Minimal review screen.** After photo upload, the Review step shows
exactly Name, Category, Color, each with a usable default so the user can
save quickly. Never create items named e.g. "Untitled 001". In Phase 3, AI
may suggest values for these same three fields.
*Rationale:* full metadata (subtype, brand, style tags, condition, notes —
SPEC.md §6) stays available in the schema but isn't part of the Phase 2 UI;
this is what "no long form per item" (D19) means concretely.
*Final defaults (approved after technical review):* Name starts as "New
Item"; once a category is picked, it becomes "New {Category}" (e.g. "New
Top", "New Shoes") — but only if the user hasn't already edited the name
by hand. Category has no fake default; the user must pick one of the seven
approved values before Save is enabled — a guessed category would be
actively misleading (a shoe defaulted to "top" reads as a bug, not a
convenience). Color defaults to the literal text "Not specified" and stays
editable.

**D24 — Gallery card.** Each card shows front image, garment name, and
category only — not all metadata.
*Rationale:* keeps cards quiet per D18; matches SPEC.md §5.2's original
"processed images + key metadata" intent, scoped down for Phase 2's
non-AI images.

**D25 — Responsive grid.** 4 columns on desktop, 2 columns on mobile.
*Rationale:* simple, standard catalog breakpoints; no need for a
configurable grid at this stage.

**D26 — Empty state copy.** Title "Your wardrobe starts here"; text "Add
your first piece and begin building your digital closet."; includes a clear
add-item call-to-action.
*Rationale:* approved copy, paired with D21's larger empty-state CTA.

**D27 — Delete item.** Phase 2 includes item deletion, gated by a
confirmation step. Deleting removes both the database record and its
stored image files.
*Rationale:* moved forward from SPEC.md §11's original Phase 4 ("Item page
& editing"), since a fast-intake flow (D19) needs a way to remove mistakes
without waiting two more phases. This is a scope correction to the Phase
table, applied in SPEC.md §11 — Phase 4 keeps edit/retry/regenerate, not
delete.

**D28 — Naming.** Keep the product name "AI Wardrobe" and the main page
title "My Wardrobe" (see D20). No branding or renaming exercise.
*Rationale:* explicit confirmation to close off any naming ambiguity before
Phase 2 UI work starts.

### Phase 2 implementation corrections (technical review)

Before implementation, ChatGPT and the Technical Lead reviewed the Phase 2
plan and required these corrections to what was originally proposed:

- **Full schema now, not a trimmed one.** Every column from SPEC.md §6
  exists in the `items` table from the start (not just the columns Phase 2
  writes to), so Phase 3 never needs a schema migration to add AI-suggested
  fields — it just starts writing to columns that already exist. Phase 2
  populates only `id`, `source_hash_front`, `source_hash_back`, `name`,
  `category`, `colors`, `original_front_path`, `original_back_path`;
  everything else is `NULL` or its declared default. Still no migration
  framework (Alembic etc.) — one table, `CREATE TABLE IF NOT EXISTS` is
  enough.
- **Duplicate protection uses SPEC's own idempotency design**, not a
  frontend-generated `submission_id`: SHA256 of the actual front-image
  bytes, stored in `source_hash_front` (`UNIQUE`), checked before insert
  and backstopped by catching `sqlite3.IntegrityError` for the race case.
  A duplicate upload returns the existing item with `duplicate: true`
  rather than erroring or silently creating a second row. Documented
  limitation: two different physical garments photographed identically
  (same bytes) would incorrectly be treated as the same item — accepted
  for Phase 2.
- **`GET /api/status` was cut from Phase 2.** Item and category counts for
  the "My Wardrobe" header are computed client-side from `GET /api/items`.
  A real pipeline-status endpoint (pending/processing/failed) belongs in
  Phase 3, once those states exist.
- **Category tabs are not built in Phase 2** even though SPEC.md §5.2
  describes them as part of the eventual v0.1 gallery — plain responsive
  grid only.
- Create/delete consistency rules (validate → write → insert, roll back
  written files on any failure; delete DB row → best-effort file removal,
  missing-file counts as success, genuine failures reported not hidden)
  were confirmed as proposed, not changed.

**D29 — Category/Type usability correction.** After hands-on testing, the
raw `category` enum values (`top`, `bottom`, `one_piece`, ...) were found
too broad and too technical to show directly to the user. Approved fix,
applied before Phase 2 was closed:
- The seven-value `category` enum (SPEC.md §6/D12) is unchanged — it's
  still the data model's broad grouping.
- Category is now shown with friendly plural labels in the UI: Tops,
  Bottoms, Outerwear, Dresses, One-piece, Shoes, Accessories. Raw
  snake_case values are never shown to the user.
- A new optional **Type** field was added to the Review screen, mapped to
  the existing (previously unused-by-the-UI) `subtype` column. Its options
  depend on the chosen Category — e.g. Category "Bottoms" offers Jeans,
  Trousers, Shorts, Bermuda shorts, Skirt, Leggings, Other. Each category's
  list ends with "Other" as an escape hatch. Leaving Type unset is valid
  (stored as `NULL`); Category still has no fake default and must be
  explicitly chosen.
- Review screen order is now Name, Category, Type, Color.
- Extended metadata (fabric/material, style, brand, size, purchase source,
  purchase date, condition, notes) remains deferred — SPEC.md §6 already
  has columns for several of these, but no UI for them ships in Phase 2.
  They're earmarked for a future "More details" section or the Phase 4
  item details page, keeping the fast-intake principle (D19) intact: this
  correction adds one optional field to the form, not a longer one.
*Rationale:* the data model's broad categories are right for filtering and
future stylist logic, but a user adding "jeans" shouldn't have to think in
terms of "bottom" — Type gives them a familiar, specific label while the
underlying `category` stays simple and stable.

## Phase 3 (planning)

Schema and processing-state decisions approved ahead of Phase 3 implementation.
No Phase 3 code exists yet — this section documents design only.

**D30 — Phase 3 schema boundary, legacy fields, explicit placeholders, multi-column
processing status, `overall_status` projection, approval invariant, and
`original_delete_at` rejection.**

- **Schema boundary.** The Phase 2 `items` table (SPEC.md §6.1) is not dropped or
  rebuilt for Phase 3. Phase 3 changes (§6.2) are additive `ALTER TABLE ... ADD COLUMN`
  statements only, applied to the existing table.
  *Rationale:* one table, no migration framework (per the Phase 2 correction, above);
  additive changes carry no data-loss risk and keep existing Phase 2 rows valid.

- **Legacy fields kept, not removed.** `status_catalog` and `error_msg` (shipped in
  Phase 2) stay in the table, marked deprecated/legacy in SPEC.md §6.1. They are
  superseded by the Phase 3 per-stage status/error columns (§6.2) and are not the
  source of truth for Phase 3 processing state.
  *Rationale:* backward compatibility; no reason to force a destructive rebuild of a
  single-table SQLite DB to remove two now-unused columns.

- **Explicit server-side placeholders, not SQL defaults.** `name`, `category`, and
  `colors` remain `NOT NULL` with no SQL-level `DEFAULT`. Phase 3's server-side insert
  logic must always supply explicit values when AI classification hasn't run yet or has
  failed: `name = "Untitled item"`, `category = "uncategorized"`, `colors = "[]"`.
  *Rationale:* keeps "what value did this column get and why" visible in application
  code, not hidden in schema DDL — consistent with Phase 2's D23 approach of
  application-level, not SQL-level, defaults.

- **Multi-column processing status.** Front catalog image, back catalog image, and
  metadata classification (§8) are each tracked with their own independent
  `status`/`error`/`attempts`/`updated_at` columns.
  *Rationale:* a single legacy `status_catalog` column can't represent "front done,
  back failed, metadata pending" simultaneously; per-stage tracking is required once
  three independently-retryable AI calls exist per item.

- **`overall_status` projection rule.** `overall_status` is a server-maintained
  projection, not independently writable via normal `PATCH`. Derivation order:
  (1) `review_status = approved` → `ready`; (2) `front_catalog_status = failed` →
  `failed`; (3) `front_catalog_status = done` → `needs_review`, even if metadata
  processing failed; (4) otherwise `pending`/`processing`.
  *Rationale:* the front catalog image is the one artifact the gallery/item-detail
  views actually require (SPEC §5.2/§5.3); a metadata-classification failure shouldn't
  block review, so rule 3 explicitly outranks a failed `metadata_status`.

- **Approval invariant.** An item cannot be approved (`review_status = approved`)
  until `front_catalog_status = done`.
  *Rationale:* approval implies the item is ready to display; approving an item with
  no processed front image would produce a broken gallery card.

- **`original_delete_at` — proposed and not approved.** Automatic deletion of
  original uploads after a retention period was proposed for Phase 3 and rejected.
  SPEC.md D2 (retain original uploads internally) stands unchanged; no deletion
  timestamp column is added.
  *Rationale:* originals remain useful for reprocessing/debugging/future features per
  D2; no product requirement yet justifies the complexity/risk of automatic deletion.
