# docs/conversation-context.md

Structured context from planning conversations that isn't already captured
in `SPEC.md`, `DECISIONS.md`, `ARCHITECTURE.md`, or `CLAUDE.md`. This is not
a chat transcript — only conclusions worth remembering.

## Who's building this

Product owner is a systems analyst and product owner, first time doing
"vibe coding" (delegating implementation to Claude Code while directing
product/architecture decisions). Two goals run in parallel for this project:
1. ship a working AI Wardrobe v0.1,
2. use it to learn how a real software project is structured, developed,
   tested and improved with Claude Code.

Practical implication: explanations should stay at the architecture/
product-flow level (see `CLAUDE.md`), and `LEARNING_LOG.md` exists
specifically to serve goal 2 without cluttering `PROGRESS.md`.

## Working agreements not already in CLAUDE.md

- **Commit gating is per-instruction, not a blanket rule.** For Phase 1
  specifically, the product owner asked to hold the final commit until they
  personally run backend + frontend and confirm the health screen works.
  `CLAUDE.md` generalizes this as a default; if a future phase doesn't
  repeat the instruction, ask rather than assume either way.
- **Documentation must stay concise and non-duplicative.** Explicitly: don't
  copy SPEC.md content into other docs, don't turn `LEARNING_LOG.md` into an
  activity log (that's `PROGRESS.md`'s job), and keep
  `docs/conversation-context.md` limited to context not captured elsewhere
  (this file).

## M0 status

Image-generation validation in Google AI Studio was completed successfully
before this project's repo existed. Treated as closed/given — not
re-verified or re-tested as part of Phase 1. SPEC.md §12 tracks it as
`M0 ✅`.

## Open items for later phases

- SPEC.md's header still reads "v0.2" while the tracked document revision is
  `0.3` (see `DECISIONS.md`). Not fixed automatically — flagged for the
  product owner to correct in SPEC.md whenever convenient, since Claude Code
  treats SPEC.md as authoritative input rather than a file it edits
  unprompted.
- Exact Gemini model IDs/pricing (`IMAGE_MODEL=gemini-3.1-flash-image`,
  `TEXT_MODEL=gemini-2.5-flash`) are placeholders confirmed for Phase 1's
  `.env.example` only; SPEC.md §10 already calls for verifying current
  pricing/IDs against ai.google.dev when Phase 3 begins.
