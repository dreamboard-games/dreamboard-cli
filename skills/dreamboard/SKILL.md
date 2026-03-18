---
name: dreamboard-cli
description: Create multiplayer, rule-enforced, turn-based game on Dreamboard.games platform.
metadata:
  short-description: Dreamboard Game Development Workflow
  tags: [dreamboard, cli, game-dev, board-game, turn-based, multiplayer]
---

# Dreamboard CLI

## Goal

Create and iterate on a Dreamboard game locally, then sync rules, scaffold, UI, and tests back to the platform.

## Prereqs

- Dreamboard CLI installed and available as `dreamboard`
  Install with `npm install -g dreamboard`
- Authenticated via `dreamboard login`

## Overview

This skill covers the full local-to-platform workflow for shipping a Dreamboard game:

- Create a new game workspace from the CLI scaffold.
- Author the canonical game contract in `rule.md` and `manifest.json`.
- Sync authored changes after rule or manifest updates with `dreamboard sync`.
- Implement gameplay logic across the app phases and expose complete UI data for every playable state.
- Build a production-quality UI that is fully playable, not a placeholder, and follows the shared style guide.
- Compile the current authored head with `dreamboard compile` and validate the integrated experience with deterministic tests and runtime checks.

## Command Flow

Use the commands for different kinds of state:

- `dreamboard sync`
  Upload local authored changes and advance the remote authored head. Run this after editing `rule.md`, `manifest.json`, or authored source files that should be part of the next remote build.
- `dreamboard compile`
  Compile the current remote authored head. Run this after `sync`, or re-run it after a failed compile when you have not made new authored edits.
- `dreamboard pull`
  Reconcile remote authored changes into the current workspace. Run this when someone else advanced the remote authored head or `dreamboard status` shows authored state `behind` or `diverged`.

Quick rule:

- edited files locally: `dreamboard sync` then `dreamboard compile`
- compile failed but you have not edited files since: `dreamboard compile` again
- remote authored head moved: `dreamboard pull` first

## Building Your First Game

Read [references/building-your-first-game.md](references/building-your-first-game.md)

## Reference

- Rules and manifest:
  [references/rule-authoring.md](references/rule-authoring.md),
  [references/manifest-authoring.md](references/manifest-authoring.md)
- App logic and engine concepts:
  [references/phase-handlers.md](references/phase-handlers.md),
  [references/api-reference.md](references/api-reference.md),
  [references/board-systems.md](references/board-systems.md),
  [references/hands-vs-decks.md](references/hands-vs-decks.md),
  [references/all-players-tracking.md](references/all-players-tracking.md),
  [references/app-best-practices.md](references/app-best-practices.md)
- UI and UX:
  [references/ui-best-practices.md](references/ui-best-practices.md),
  [references/ui-style-guide.md](references/ui-style-guide.md),
  genre references under `references/ui-genre-*.md`
- TypeScript regression harness (`dreamboard test generate/run`):
  [references/test-harness.md](references/test-harness.md)
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
- Run `dreamboard sync` after authored changes to keep generated files and the remote authored head in sync.
- `dreamboard pull` reconciles authored divergence into the current workspace.
- `dreamboard compile` is separate from authored sync; failed compiles do not mean the workspace needs a pull or another sync unless you changed authored files again.
- Use `dreamboard status` to distinguish authored sync from compile health before deciding whether the next command should be `sync`, `compile`, or `pull`.
- `dreamboard test generate` should be re-run after base changes, compiled-result changes, or game identity changes.
- Add at least one zero-step `initial-state` scenario so setup invariants fail before action tests begin.
- Keep `scripts/events-extract.ts` as a debugging helper for `.dreamboard/run/events.ndjson`; assertions belong in test scenarios.

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
