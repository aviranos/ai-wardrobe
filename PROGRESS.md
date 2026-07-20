# PROGRESS.md

## Current phase

**Phase 2 — Slice without AI**, per SPEC.md §11 (as corrected — see
DECISIONS.md D27). **Complete.** Personally tested and approved by the
product owner (including the Add Item UX polish and the Category/Type
correction, D29), committed, and pushed to `origin/master`.

## Completed

**Phase 1 — Scaffold** (commit `980bb533d684268b3fd19f7938efc74ce5b0fc4f`,
pushed to `origin/master`): see git history for details.

**Phase 2 — Slice without AI:**

- `backend/app/database.py`: full `items` table from SPEC.md §6 (all
  columns), created via `CREATE TABLE IF NOT EXISTS` — no migration
  framework introduced.
- `backend/app/images.py`: upload safety — content-sniffs the real image
  type (JPEG/PNG/WebP) instead of trusting the filename/Content-Type,
  enforces a 10 MB size limit, generates server-side UUID-based filenames,
  computes the SHA256 hash used for duplicate detection.
- `backend/app/items.py`: `POST /api/items` (create, with front-image-hash
  deduplication + file/DB rollback on failure), `GET /api/items` (list),
  `DELETE /api/items/{id}` (delete, DB row + files, partial-failure
  reporting). `GET /api/status` was **not** built — counts are computed
  client-side from `GET /api/items` (per corrected instructions).
- `backend/tests/test_items.py`: 11 tests covering create (front-only,
  front+back, optional Type/`subtype`), rejecting a missing front image,
  rejecting an unsupported upload, listing, persistence, delete (DB +
  files), duplicate-hash handling, and a guard proving no outbound network
  call happens during item creation. All 12 backend tests pass (including
  Phase 1's health check).
- `frontend/src/App.tsx` replaced the Phase 1 health screen with the "My
  Wardrobe" home screen (title, item/category counts, gallery, empty
  state, unobtrusive error banner if the backend is unreachable).
- `frontend/src/components/`: `EmptyState`, `ItemCard`, `Gallery`,
  `AddItemFlow`, and `DeleteConfirmDialog`.
- `frontend/src/api.ts`: typed fetch client for the items API, including
  `CATEGORY_LABELS` (friendly plural labels) and `TYPE_OPTIONS`
  (category-dependent Type choices).
- Visual direction (D17): warm `#F2EDE4` background, serif headings, plain
  sans-serif UI text. Gallery grid: 4 columns desktop / 2 columns mobile
  (D25). No category tabs (explicitly out of scope for Phase 2).
- **Add Item UX polish** (post-product-owner-testing round): custom front-
  photo picker ("Take a photo" / "Choose from device", hidden native
  inputs, no browser-native "No file selected" text), the separate
  back-photo question step was removed — it's now an inline optional
  section on the Review screen — and the modal no longer shows an
  oversized empty preview before a photo is chosen.
- **Category/Type correction** (D29, post-product-owner-testing round):
  Category now shows friendly plural labels (Tops, Bottoms, ...) instead
  of raw enum values; a new optional Type field (mapped to the `subtype`
  column) offers a category-dependent list of familiar garment types
  (e.g. Jeans, T-shirt, Sneakers), always with an "Other" option. Review
  screen is now Name, Category, Type, Color.
- `npm run build` succeeds with no TypeScript errors.
- Manually verified in the browser preview: add-item flow, the
  name-touched lock (editing the name stops further auto-fill from the
  category picker), save → item appears in the gallery, delete with
  confirmation removes the card and the underlying files, the
  duplicate-hash path (re-uploading the same front image shows the
  existing item with a banner instead of creating a second one), and the
  revised upload UX (custom front-photo picker, inline back-photo section)
  — all exercised against the real running backend, not mocks.
- `.claude/launch.json` added (not part of the app) so the frontend dev
  server can be previewed in-browser going forward.

## Next step

Phase 3 planning (AI pipeline, per SPEC.md §8/§11) — not started.

## Known limitations (expected at this phase, not bugs)

- **Duplicate detection is by exact front-image byte hash** (D-approved,
  see DECISIONS.md "Phase 2" section item 2 in the corrections). Uploading
  the exact same front photo for two different physical garments will be
  treated as a duplicate and will not create a second item. This is a
  deliberate Phase 2 limitation — real per-garment fingerprinting is an
  AI-era (Phase 3+) concern.
- **Possible orphan files on a failed delete.** If deleting a file after
  its DB row is already removed fails for a reason other than "already
  missing" (e.g. a locked file on Windows), the API reports
  `files_removed: false` with a warning rather than silently succeeding —
  but Phase 2 does not retry or use a trash-directory protocol, so a
  leftover file can remain on disk in that rare case.
- No server-side idempotency key for double-submitted forms — the Save
  button disables itself while a request is in flight, which is
  sufficient for a single-user local prototype clicking one button.
- No category tabs/filtering in the gallery yet (explicitly out of scope
  for Phase 2, per the approved corrections).
- No image compression or resizing — originals are stored and displayed
  as-is; catalog-quality processed images are a Phase 3 concern.
- Full item detail page, edit, retry, and regenerate remain Phase 4.
- Extended metadata (fabric/material, style, brand, size, purchase source,
  purchase date, condition, notes) has no UI yet — deferred to a future
  "More details" section or the Phase 4 item details page (D29). The
  database already has columns for several of these.
- Starlette's `TestClient` still emits the `httpx` → `httpx2` deprecation
  warning noted in Phase 1 — unchanged, not an action item.
