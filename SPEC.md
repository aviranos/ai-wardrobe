# SPEC.md — AI Wardrobe · v0.2 (Catalog Core, Foundation Release)

> **Read this first:** This document is the single source of truth for the project.
> v0.1 of the app is a **foundation release**: an initial, extensible base that will
> evolve heavily. Build it correct and clean, not big. The product owner is a systems
> analyst, not a professional developer — explain decisions at the architecture level.

---

## 1. Product context & vision

**Long-term vision:** a public-facing consumer app where people digitize their real
wardrobe — every garment becomes a structured, visual object — and then get a
**personal AI stylist**: "what should I wear tonight?" answered from the clothes
they actually own, considering occasion, weather and preferences, with virtual
try-on of the chosen outfit. Garment *design* (recoloring, redesigning items) is a
possible future extension, not the core vision. The catalog is the data layer the
stylist will think on top of.

**Current build (v0.1 — "Catalog Core"):** a **single-user prototype with
product-quality UX**, running locally. The wardrobe catalog is the core asset of the
whole product; if the catalog flow works, we have half the app. Architecture should
be extensible for the future product, but nothing beyond v0.1 scope gets built now.

**Guiding principle:** this is a pipeline-driven product, not an "agent" product.
Upload → process → classify → review → save. Deterministic, repeatable, debuggable.

## 2. Target audience & personas

v0.1 has exactly one real user: the product owner (persona P1). Personas P2–P3
describe the future audience and must inform UX decisions now, so the foundation
doesn't need a redesign later.

| # | Persona | Core need | What it implies for v0.1 |
|---|---------|-----------|--------------------------|
| P1 | **The Builder** — tech-savvy owner validating the product on his own wardrobe | See his real closet digitized with minimal manual work | Fast add-item loop, forgiving editing, visible processing status |
| P2 | **The Organizer** — wants to know what they own, stop buying duplicates, find things fast | Browse & filter a clean visual catalog | Category tabs, color/metadata on cards, search-ready data model |
| P3 | **The Style-Conscious user** — cares how the closet *looks* and will later want outfits/try-on | A beautiful, "shoppable" feel for their own clothes | Polished catalog imagery, consistent visual language, delightful gallery |

## 3. UX & human-factors principles (הנדסת אנוש)

1. **The core loop must be short:** Add Item → upload → AI works → review → save.
   Target: under 60 seconds of *user* effort per item (AI processing time excluded).
2. **Never block the user on AI:** processing runs with a clear visible status
   (pending / processing / done / failed). The user can keep browsing meanwhile.
3. **Review before commit:** AI fills the form; the human approves. Every AI field
   is editable. The user is always the final authority on their own data.
4. **Errors are recoverable, never dead ends:** failed processing shows a friendly
   message + a Retry button. No silent failures.
5. **Progressive disclosure:** required fields visible first (name, category,
   color); optional fields (brand, purchase info, condition, notes) in an expandable
   section. Don't overwhelm.
6. **Catalog shows only processed images** — the "wow" of the product. Raw photos
   are never displayed (but are kept internally, see §7).
7. **Familiar patterns:** standard upload interactions (file picker; camera on
   mobile browsers), card grid gallery, modal/page for item details.
8. **UI language:** English for v0.1. Structure components so RTL/Hebrew can be
   added later without rework (no hardcoded directional CSS where avoidable).
9. **Visual direction:** warm, elegant, classic, premium — like a restrained
   fashion boutique. Warm off-white/beige tones around `#F2EDE4`, generous
   whitespace, serif headings, clean sans-serif UI text. Luxury through
   restraint, not decoration (DECISIONS.md D17).

## 4. Scope

### In scope (v0.1)
- Add new clothing item: upload **front image** + **optional back image**
- Automatic AI pipeline per image: clean catalog image + metadata suggestion
- Review form: AI-suggested fields, user edits, save
- Wardrobe gallery: processed images only, category tabs, item count
- Item details page: front (+ back if exists), full metadata, edit, retry, delete
- Local persistence (SQLite + local folders), idempotency, cost guardrails

### Out of scope (future phases — do NOT build now)
Try-On · outfit builder · stylist/recommendations · weather integration ·
multi-user & auth · cloud infrastructure · background workers/queues (simple async
in-process is fine) · n8n · social features · subscriptions.

## 5. Main user flows

### 5.1 Add Item
1. User clicks **Add New Item**
2. Uploads front image (file picker / camera) — required. System then asks
   whether to add an optional back image; the back image is never mandatory
   (DECISIONS.md D22).
3. *(Phase 3+)* System automatically runs the AI pipeline on each image:
   a. Product-shot generation → catalog image
   b. Classification (front image only) → suggested name, category, subtype, colors, style tags
4. Review form opens. **Phase 2 (no AI):** a minimal Review step with
   exactly Name, Category, Type, Color, pre-filled with usable defaults so
   the user can save quickly — never a placeholder like "Untitled 001"
   (DECISIONS.md D19, D23). Category shows friendly plural labels ("Tops",
   "Bottoms", ...), never the raw `top`/`bottom` enum values (D29). Type
   is optional, maps to the `subtype` column, and its options depend on
   the chosen Category (D29) — e.g. picking "Bottoms" offers "Jeans,
   Trousers, Shorts, ...". Remaining metadata (brand, style tags,
   condition, notes) stays in the schema (§6) but isn't part of this
   screen yet — deferred to a future "More details" section or the item
   details page (D29). **Phase 3+:** AI suggests values for Name,
   Category, and Color; the user still approves before saving (§3,
   principle 3).
5. Save → item appears in gallery (front image as card, DECISIONS.md D24)

### 5.2 Gallery ("My Wardrobe")
Home screen title "My Wardrobe"; shows a minimal item count and category
count only — no dashboards, charts, or recommendations (DECISIONS.md D20).
"Add New Item" button near the top at all times, plus a larger CTA in the
empty state (D21). Responsive card grid, 4 columns desktop / 2 columns
mobile (D25) · each card shows front image, name, and category only (D24)
· click card → item page. Empty state: title "Your wardrobe starts here",
text "Add your first piece and begin building your digital closet." (D26).
Category tabs rendered from the taxonomy config (All + categories; hide
empty ones) are part of the v0.1 vision but explicitly *not* built in
Phase 2 — a plain grid only, no filtering yet (DECISIONS.md, Phase 2
corrections).

### 5.3 Item details
Front + back catalog images (front primary; back shown only here, not in
gallery) · all metadata · Edit · Regenerate catalog image (explicit,
confirmed action — it costs money) · Retry on failure. Delete (confirmation
required; removes both the DB record and stored image files) is available
starting Phase 2 directly from the gallery card, ahead of this page — see
§11's Phase 2/4 split (DECISIONS.md D27).

## 6. Data model (SQLite)

### 6.1 Phase 2 schema (shipped)

```sql
items (
  id TEXT PRIMARY KEY,                 -- uuid
  source_hash_front TEXT UNIQUE,       -- SHA256 of original front upload (idempotency)
  source_hash_back TEXT,
  name TEXT NOT NULL,                  -- AI-suggested (Phase 3+), user-editable; no SQL default —
                                        -- server always supplies an explicit value on insert (D30)
  category TEXT NOT NULL,              -- top | bottom | outerwear | dress | one_piece | shoes | accessory;
                                        -- no SQL default — server always supplies an explicit value (D30)
  subtype TEXT,                        -- "Type" in the UI; e.g. "T-shirt", "Jeans" — user-picked
                                        -- from a Category-dependent list from Phase 2 on (D29);
                                        -- AI may suggest it too from Phase 3
  colors TEXT NOT NULL,                -- JSON array, e.g. ["navy","white"]; no SQL default —
                                        -- server always supplies an explicit value on insert (D30)
  style_tags TEXT,                     -- JSON array (optional, AI-suggested)
  brand TEXT,                          -- optional; AI suggests if a logo is visible
  size TEXT,                           -- optional, manual
  purchase_source TEXT,                -- optional, manual
  purchase_date TEXT,                  -- optional, manual (ISO date)
  condition TEXT DEFAULT 'good',       -- new | good | worn | damaged
  special_notes TEXT,                  -- defects etc. ("tear in left knee", "stain near hem")
  user_notes TEXT,                     -- free text ("favorite weekend shirt")
  original_front_path TEXT,            -- kept internally, never shown in UI
  original_back_path TEXT,
  catalog_front_path TEXT,
  catalog_back_path TEXT,
  status_catalog TEXT DEFAULT 'pending',  -- LEGACY (D30): shipped in Phase 2, superseded by the
                                           -- Phase 3 per-stage status columns (§6.2). Not the source
                                           -- of truth for Phase 3 processing state. Kept in place for
                                           -- backward compatibility — not dropped, not rebuilt.
  error_msg TEXT,                         -- LEGACY (D30): superseded by the Phase 3 per-stage error
                                           -- columns (§6.2). Kept for backward compatibility.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

Folder layout: `data/originals/`, `data/catalog/` (never expose `originals` via the UI).
Original uploads are retained internally, unchanged from D2 — no automatic deletion of
originals. A Phase 3 `original_delete_at` retention-timestamp column was proposed and is
**not approved** (D30); it does not exist in this schema and is not planned.

Phase 2 (no AI yet) populates `name`, `category`, `subtype` (optional),
`colors` (single-entry array) and the image path/status columns directly
from the user's minimal Review step (§5.1, DECISIONS.md D23, D29); the
remaining columns stay `NULL` until Phase 3 fills them from the AI
pipeline.

### 6.2 Phase 3 schema additions (additive — not yet applied)

Phase 3 adds processing-state tracking via `ALTER TABLE ... ADD COLUMN` only. The
existing Phase 2 table (§6.1) is not dropped or rebuilt, and its legacy
`status_catalog`/`error_msg` columns remain in place unchanged. **These statements are
documentation of the planned migration; they are not run as part of this change.**

```sql
ALTER TABLE items ADD COLUMN front_catalog_status TEXT DEFAULT 'pending';   -- pending | processing | done | failed
ALTER TABLE items ADD COLUMN front_catalog_error TEXT;
ALTER TABLE items ADD COLUMN front_catalog_attempts INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN front_catalog_updated_at TIMESTAMP;

ALTER TABLE items ADD COLUMN back_catalog_status TEXT DEFAULT 'pending';    -- pending | processing | done | failed
ALTER TABLE items ADD COLUMN back_catalog_error TEXT;
ALTER TABLE items ADD COLUMN back_catalog_attempts INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN back_catalog_updated_at TIMESTAMP;

ALTER TABLE items ADD COLUMN metadata_status TEXT DEFAULT 'pending';        -- pending | processing | done | failed
ALTER TABLE items ADD COLUMN metadata_error TEXT;
ALTER TABLE items ADD COLUMN metadata_attempts INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN metadata_updated_at TIMESTAMP;

ALTER TABLE items ADD COLUMN review_status TEXT DEFAULT 'pending';          -- pending | approved
ALTER TABLE items ADD COLUMN overall_status TEXT DEFAULT 'pending';         -- server-maintained projection, see below
```

Each of the three processing pipelines — front catalog image, back catalog image, and
metadata classification (§8) — is a separate, independently-retryable AI call, so each
gets its own `status` / `error` / `attempts` / `updated_at` quartet rather than sharing
one column.

**`overall_status`** is a server-maintained projection, not an independent source of
truth. It is **not directly writable** through a normal `PATCH /api/items/{id}` call —
the server recomputes it whenever a contributing column changes, in this order:

1. `review_status = approved` → `overall_status = ready`
2. `front_catalog_status = failed` → `overall_status = failed`
3. `front_catalog_status = done` → `overall_status = needs_review`, even if
   `metadata_status` failed
4. Otherwise `overall_status` is `pending` or `processing`

**Approval invariant:** an item cannot be approved (`review_status = approved`) until
`front_catalog_status = done`. A failed or incomplete back-image or metadata step does
not block approval — this is what rule 3 above encodes.

## 7. Decisions log (already made — do not reopen)

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Catalog-first; Try-On deferred | Structured wardrobe data is the core asset; lowest-risk highest-value half |
| D2 | Keep original uploads internally; show only processed images | Enables reprocessing, debugging, future features; storage is cheap |
| D3 | Pipeline/service, not autonomous agents | Deterministic, debuggable; "agent" adds no value at this stage |
| D4 | Single-user prototype, extensible architecture | Public product is vision, not v0.1 scope; prevents over-engineering |
| D5 | name, category, color = required; style, brand, size, purchase info = optional | Brand is AI-suggested when a logo is visible, else manual |
| D6 | condition = structured enum (new/good/worn/damaged) + free-text special_notes | Cheap now; future stylist will use it ("don't suggest the stained pants for an interview") |
| D7 | Gallery shows front only; item page shows front + back | Keeps the gallery clean |
| D8 | Image model name lives in env config (default: gemini-3.1-flash-image) | Model generations change fast; never hardcode |
| D9 | Every paid AI call is explicit or automatic-once; idempotency via source hash | Cost control; no silent regeneration |
| D10 | English UI now, RTL-ready structure | Speed now, Hebrew later |
| D11 | Core product = wardrobe digitization + personal styling; garment design/generation = future extension only | Keeps the vision sharp and the scope from drifting |
| D12 | Extensible category taxonomy: top, bottom, outerwear, dress, one_piece, shoes, accessory (+ free subtype) | Won't break when a user uploads a dress; unisex from day one |
| D13 | Future stylist metadata (formality, seasons, occasions, layer, pattern, fit) is a declared backlog goal; NOT in the v0.1 UI | Direction recorded so the data model can absorb it later |
| D14 | Try-On (future) is generated per *selected outfit*, not automatically per item | Images are created only when they have value; cost control |
| D15 | Data model and pipeline are gender-neutral from day one; v0.1 test data is the owner's closet | Zero extra cost now, no rework later |

## 8. AI pipeline

Two model calls per item (three if back image exists), via Gemini API.
Prompts live in `prompts/*.txt` — configuration, not code. Model IDs from `.env`.

**8.1 Catalog image** (image → image, model: `IMAGE_MODEL`, default `gemini-3.1-flash-image`):
```
Extract the clothing item from this photo. Render it as a clean e-commerce
product photo: front-facing, neatly presented, centered, on a uniform warm
beige background (#F2EDE4), soft even studio lighting, subtle natural shadow.
No person, no background objects, no text. Preserve the exact colors, logos,
prints, textures and proportions of the original garment. Square 1:1.
```
For back images, replace "front-facing" with "back view of the garment".

**8.2 Classification** (image → JSON, model: `TEXT_MODEL`, default `gemini-flash` family):
```
Analyze the clothing item in this image. Return ONLY valid JSON, no markdown:
{"name": "short descriptive name",
 "category": "top|bottom|outerwear|dress|one_piece|shoes|accessory",
 "subtype": "specific type, e.g. t-shirt, hoodie, jeans",
 "colors": ["primary","secondary"],
 "style_tags": ["casual|formal|sport|office|street"],
 "brand": "brand name if a logo/label is clearly visible, else null",
 "suggested_notes": "any visible defect or notable detail, else null"}
```

**8.3 Pipeline rules**
- Validate outputs: JSON must parse; image response must contain an image. Otherwise → `status=failed` + human-readable `error_msg`.
- Retry with backoff on 429/5xx, max 2 attempts; then fail gracefully.
- Idempotency: identical source hash → skip processing, inform the user.
- Max 3 concurrent AI calls.
- Log every AI call (timestamp, item id, model, success/fail) to a local table or file — future cost dashboard.

## 9. API contract (FastAPI)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/items` | multipart: front (required) + back (optional) → creates item, triggers pipeline (Phase 3+; Phase 2 stores files + minimal metadata only), returns id |
| GET | `/api/items?category=` | gallery list (processed images + key metadata) |
| GET | `/api/items/{id}` | full item |
| PATCH | `/api/items/{id}` | edit metadata |
| POST | `/api/items/{id}/retry` | re-run failed pipeline step |
| POST | `/api/items/{id}/regenerate` | explicit paid regeneration of catalog image |
| DELETE | `/api/items/{id}` | delete item + files |
| GET | `/api/status` | counts: total, processing, failed |
| GET | `/api/health` | liveness |

Static serving for `data/catalog/` images.

## 10. Non-functional requirements

- **Stack:** FastAPI (Python, type hints) · React + Vite + Tailwind · SQLite · local file storage. Two commands to run everything.
- **Cost:** reference ~ $0.03–0.05 per generated image (verify current pricing at ai.google.dev). No automatic regeneration, ever.
- **Privacy:** all data local; images are sent to the Gemini API for processing only.
- **Secrets:** `.env` only (`GEMINI_API_KEY`, `IMAGE_MODEL`, `TEXT_MODEL`). Never in the repo.
- **Testing:** pytest for pipeline and API logic with **mocked** Gemini calls; no paid calls in tests.
- **Design quality:** the app must feel like a product, not an internal tool — clean typography, pleasant spacing, consistent visual language. Function first, but beautiful.

## 11. Build phases (one phase per session)

| Phase | Deliverable | Done when |
|-------|-------------|-----------|
| 1 — Scaffold | Repo structure, FastAPI + React/Vite + SQLite, `/api/health`, frontend shows API connected, CLAUDE.md, PROGRESS.md, README, .env.example, 1 backend test | Runs with two commands |
| 2 — Slice without AI | Add Item (front+back upload) → files saved → DB record → minimal Review (name/category/color) → gallery shows raw image → delete with confirmation | Uploaded item visible after refresh; item can be deleted (DB record + files both removed) |
| 3 — AI pipeline | Catalog image + classification on upload; statuses; review form pre-filled; gallery switches to processed images | Real garment in → clean classified card out |
| 4 — Item page & editing | Details page, edit form, retry, regenerate (confirmed) | Full metadata editing on a real item |
| 5 — Polish & real data | 5+ real garments loaded, empty/error states, visual polish per §3 | Owner proudly demos it |

## 12. Product roadmap (milestones beyond v0.1 — context only, do NOT build)

| Milestone | Content | Value proven |
|-----------|---------|--------------|
| M0 ✅ | Image-engine validation in AI Studio (done — passed) | The core magic works |
| M1 = v0.1 | Catalog Core (phases 1–5 above) | Garments become structured objects |
| M2 | Real wardrobe management: search, filters, fast bulk intake, 20–50 real items | Portfolio-grade useful tool |
| M3 | Manual Outfit Builder (user composes & saves looks) | Data model supports outfit logic |
| M4 | AI Stylist: free-text request ("date tonight, hot outside, casual-sharp") → 2–3 outfits from the actual closet, with reasoning, using formality/season/occasion/condition metadata (D13) | The real product begins |
| M5 | Virtual Try-On of a *selected* outfit (D14) | Emotional "wow" on demand |
| M6 | Personal context: weather, calendar, favorites, recently worn, laundry state | Daily-use stickiness |
| M7 | Public product: auth, cloud, mobile/PWA, privacy, billing | Consumer launch |

**Working agreement with Claude Code:** plan first and wait for approval · small
reviewable changes · run tests/app after each step · explain failures before fixing ·
no new dependencies without need · update PROGRESS.md at phase end · finish each
phase with an architecture-level explanation for the product owner.
