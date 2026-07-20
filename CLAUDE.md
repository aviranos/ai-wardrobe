# CLAUDE.md — Working Instructions for Claude Code

Permanent operating rules for this project. Read this together with
`SPEC.md` (product source of truth), `PROGRESS.md` (current state) and
`DECISIONS.md` (decision log) at the start of every session.

## Who you're working with

The product owner is a systems analyst, not a professional developer. This is
their first "vibe coding" project — treat it as both a build and a teaching
exercise. Explain at the architecture/product-flow level, not line-by-line.
Introduce a technical term once, briefly, the first time it's used.

## Per-phase sequence

For every phase, in order:

1. Read `SPEC.md`, `CLAUDE.md`, `PROGRESS.md`, `DECISIONS.md`.
2. State the current phase and its exact acceptance criteria.
3. Inspect the existing repo before proposing changes.
4. Present a short implementation plan; name assumptions, risks, unnecessary
   complexity.
5. Wait for explicit approval before touching files.
6. Implement in small, reviewable steps.
7. Run relevant tests/app after each meaningful step.
8. If something fails, explain the likely cause before fixing it.
9. Self-review against the phase's acceptance criteria.
10. Update project documentation (this list of files, not chat history).
11. Explain the result at the architecture/product-flow level.
12. Propose a git commit message.
13. Stop. Do not start the next phase automatically.

## Guardrails

- Stay inside the current phase's scope — no features, infra, or
  dependencies pulled forward from later phases "while we're at it."
- No new dependency without explaining why it's needed.
- No secrets in the repo. Config via `.env` (see `.env.example`); never
  hardcode keys or commit `.env`.
- Never call paid AI services (Gemini) from automated tests — mock them.
- Never trigger automatic/silent regeneration of paid AI images.
- Never delete files, rewrite git history, or run destructive commands
  (`git reset --hard`, force-push, `rm -rf` on tracked content) without
  explicit approval in that specific instance.
- Do not create the final commit for a phase until the product owner has
  personally run and confirmed it works, unless they say otherwise for a
  given phase.
- Prefer simple, boring, maintainable structure over clever abstraction.
  Build for v0.1 scope; keep the future (§12 of SPEC.md) in mind but don't
  build it now.

## Documentation upkeep

When a conversation produces a decision or durable context, write it into
the relevant doc below instead of leaving it only in chat history:

| File | Holds |
|---|---|
| `SPEC.md` | Product scope, decisions log D1-D15, phase table. Source of truth — don't duplicate its content elsewhere. |
| `PROGRESS.md` | What's done, current phase, next step, known limitations. Kept current, not historical. |
| `DECISIONS.md` | Technical/product decisions made *during build* (not already in SPEC.md's own log), each with a one-line rationale. |
| `ARCHITECTURE.md` | Components, data flow, folder responsibilities — systems-analysis level. |
| `LEARNING_LOG.md` | What the product owner should take away from each phase conceptually. Not an activity log. |
| `docs/conversation-context.md` | Structured context from planning conversations that doesn't fit the files above (working agreements, user profile notes, open questions). |

Keep all of these concise. Don't copy SPEC.md content into them — link to
the relevant SPEC section instead.
