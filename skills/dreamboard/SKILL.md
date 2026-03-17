---
name: dreamboard
description: Create multiplayer, rule-enforced, turn-based board game on Dreamboard.games platform.
metadata:
  short-description: Dreamboard Game Development Workflow
  tags: [dreamboard, cli, game-dev, board-game, turn-based, multiplayer]
---

# Dreamboard

## Goal

Create and iterate on a Dreamboard game locally, then sync rules, scaffold, UI, and tests back to the platform.

## Why Dreamboard

Dreamboard exists to turn a board-game idea into a playable digital prototype quickly.

- Describe the game instead of hand-building every primitive first.
- Generate rules scaffolding, components, and UI structure faster.
- Playtest with real players without repeated print-and-play friction.
- Iterate live while Dreamboard handles turns, hands, and multiplayer plumbing.

## Prereqs

- Dreamboard CLI installed and available as `dreamboard`
  Install with `npm install -g dreamboard`
- Authenticated via `dreamboard login`

## Building Your First Game

Read [references/building-your-first-game.md](references/building-your-first-game.md)

## References

- Rules and manifest:
  [references/rule-authoring.md](references/rule-authoring.md),
  [references/manifest-authoring.md](references/manifest-authoring.md)
- App logic and engine concepts:
  [references/phase-handlers.md](references/phase-handlers.md),
  [references/api-reference.md](references/api-reference.md),
  [references/hands-vs-decks.md](references/hands-vs-decks.md),
  [references/all-players-tracking.md](references/all-players-tracking.md),
  [references/app-best-practices.md](references/app-best-practices.md)
- UI and UX:
  [references/ui-best-practices.md](references/ui-best-practices.md),
  [references/ui-style-guide.md](references/ui-style-guide.md),
  genre references under `references/ui-genre-*.md`
- TypeScript regression harness (`dreamboard test generate/run`):
  [references/test-harness.md](references/test-harness.md)
- JSON runtime scenarios (`dreamboard run --scenario ...`):
  [references/scenario-format.md](references/scenario-format.md)
- Rejection and edge-case pressure using JSON runtime scenarios:
  [references/adversarial-testing.md](references/adversarial-testing.md)

## Testing Modes

There are two different scenario systems:

- `dreamboard test generate` / `dreamboard test run`
  TypeScript scenario files in `test/scenarios/*.scenario.ts` against deterministic generated base snapshots. Use this for regression coverage.
- `dreamboard run --scenario path/to/file.json`
  JSON action scripts that drive a live session. Use this for debugging flows, reproductions, and adversarial experiments.

## Guardrails

- `manifest.json` and `rule.md` are the source of truth for scaffolding.
- Run `dreamboard sync` after manifest or rule changes to keep generated files in sync and advance the remote authoring head.
- Run `dreamboard compile` when you want a new runnable build for the current authored state.
- Use `dreamboard pull` only when you explicitly need to reconcile unexpected remote authored changes into the workspace.
- `dreamboard test generate` should be re-run after base changes, compiled-result changes, or game identity changes.
- Add at least one zero-step `initial-state` scenario so setup invariants fail before action tests begin.
- Keep `scripts/events-extract.mjs` as a debugging helper for `.dreamboard/run/events.ndjson`; assertions belong in test scenarios.

## Editable Surface

Edit:

- `app/phases/*.ts`
- `shared/ui-args.ts`
- `ui/App.tsx`
- `ui/components/*`
- `ui/sdk/components/*`

Do not edit framework-owned files such as:

- `app/index.ts`
- `app/sdk/*`
- `app/generated/*`
- `ui/index.tsx`
- `ui/sdk/context/*`
- `ui/sdk/hooks/*`
- `ui/sdk/types/*`

## Framework Feedback

Use `feedback.md` in the game project root to record framework issues, missing features, or workflow friction. Include reproduction steps, expected behavior, and actual behavior when possible.
