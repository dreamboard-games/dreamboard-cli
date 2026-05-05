---
name: dreamboard
description: Guides development of multiplayer, rule-enforced, turn-based games on the Dreamboard.games platform. Use this skill when building a new Dreamboard game, implementing game logic with the reducer pattern, writing game rules or manifest, using the Dreamboard CLI, or iterating on game UI and tests.
metadata:
  short-description: Dreamboard Game Development Workflow
  tags: [dreamboard, cli, game-dev, board-game, turn-based, multiplayer]
---

# Dreamboard CLI

## Goal

Create and iterate on a Dreamboard game locally, then sync authored changes,
compile, run, and test against the current reducer-native scaffold.

## Prereqs

- Dreamboard CLI installed and available as `dreamboard`
  Install with `npm install -g dreamboard`
- Authenticated via `dreamboard auth status` or log in via `dreamboard login`

## New game workflow

Copy this checklist and track your progress:

```
New Game Development Progress:
- [ ] Step 1: Author rule.md
- [ ] Step 2: Author manifest.ts to define game topology
- [ ] Step 3: Run `dreamboard sync` to update generated type-safe contracts
- [ ] Step 4: Implement reducer contract, phases, interactions, and views in `app/`
- [ ] Step 5: Keep reducer files organized by ownership: `game-contract.ts` for schemas, `game.ts` for assembly, phase `index.ts` files for `definePhase` registration, and concept files for reducer bodies
- [ ] Step 6: Run `dreamboard compile` and fix any type errors
- [ ] Step 7: Write bases and scenarios in `test/`, then run `dreamboard test generate` and `dreamboard test run`
- [ ] Step 8: Implement the playable UI in `ui/App.tsx` — start from generated `WorkspaceGameShell` and surface renderers before writing custom runtime plumbing (see [references/ui-architecture.md](references/ui-architecture.md))
- [ ] Step 9: Verify end-to-end with `dreamboard dev`
```

For the end-to-end authoring loop, start with [references/quickstart.md](references/quickstart.md) and [references/authoring-lifecycle.md](references/authoring-lifecycle.md).

## References

- Quickstart:
  [references/quickstart.md](references/quickstart.md)
- Workspace layout:
  [references/workspace-layout.md](references/workspace-layout.md)
- Core concepts:
  [references/core-concepts.md](references/core-concepts.md)
- CLI:
  [references/cli.md](references/cli.md)
- Rules:
  [references/rule-authoring.md](references/rule-authoring.md)
- Manifest:
  [references/manifest.md](references/manifest.md),
  [references/manifest-fields.md](references/manifest-fields.md)
- Reducer authoring:
  [references/game-contract.md](references/game-contract.md),
  [references/game-definition.md](references/game-definition.md),
  [references/phases.md](references/phases.md),
  [references/interactions.md](references/interactions.md),
  [references/card-actions.md](references/card-actions.md),
  [references/effects.md](references/effects.md),
  [references/views.md](references/views.md)
- Tiled Boards:
  [references/board-topology.md](references/board-topology.md)
- UI:
  [references/ui-architecture.md](references/ui-architecture.md),
  [references/game-shell.md](references/game-shell.md),
  [references/board-surfaces.md](references/board-surfaces.md),
  [references/hand-surfaces.md](references/hand-surfaces.md),
  [references/prompts-and-choices.md](references/prompts-and-choices.md),
  [references/custom-renderers.md](references/custom-renderers.md),
  [references/ui-components.md](references/ui-components.md)
- Testing:
  [references/testing.md](references/testing.md),
  [references/testing-bases.md](references/testing-bases.md),
  [references/testing-scenarios.md](references/testing-scenarios.md),
  [references/testing-runtime-assertions.md](references/testing-runtime-assertions.md),
  [references/testing-ui-tests.md](references/testing-ui-tests.md),
  [references/testing-generated-contracts.md](references/testing-generated-contracts.md)

## Current Scaffold

A fresh `dreamboard new` workspace contains:

- authored source:
  `rule.md`, `manifest.ts`
- reducer:
  `app/game-contract.ts`, `app/game.ts`, `app/phases/setup.ts`,
  `app/setup-profiles.ts`, `app/reducer-support.ts`, `app/README.md`
- UI:
  `ui/App.tsx`, usually built from the generated `WorkspaceGameShell`, UI surfaces, and components from `@dreamboard/ui-sdk/components`
- tests:
  `test/bases/initial-turn.base.ts`, `test/testing-types.ts`
  _(scenarios are not scaffolded — create them in `test/scenarios/`)_
- generated (do not edit):
  `shared/manifest-contract.ts`, `shared/generated/ui-contract.ts`

## Command Flow

Use the commands for different kinds of state:

- `dreamboard sync`
  Upload local authored changes and advance the remote authored head. Run this after editing `rule.md`, `manifest.ts`, or authored source files that should be part of the next remote build. Re-running `sync` against the same authored content is safe; Dreamboard reuses already-uploaded source blobs and still refreshes framework-owned generated files. When `package.json` changes, `sync` also prepares workspace dependencies automatically.
- `dreamboard compile`
  Compile the current remote authored head. Run this after `sync`, or re-run it after a failed compile when you have not made new authored edits.
- `dreamboard pull`
  Reconcile remote authored changes into the current workspace. Run this when someone else advanced the remote authored head or `dreamboard status` shows authored state `behind` or `diverged`.

Quick rule:

- edited files locally: `dreamboard sync` then `dreamboard compile`
- compile failed but you have not edited files since: `dreamboard compile` again
- remote authored head moved: `dreamboard pull` first

## Guardrails

- `manifest.ts` and `rule.md` are the source of truth for scaffolding.
- Choose files by ownership before editing: schemas in `app/game-contract.ts`, `defineGame` wiring in `app/game.ts`, player projections in view files, and phase reducers in `app/phases/*`.
- A single `app/phases/<phase>.ts` is fine while small. Once a phase has multiple action families, shared input/presentation helpers, card actions, or is roughly 250-300 lines, move to `app/phases/<phase>/index.ts` plus neighboring concept files such as `build.ts`, `trade.ts`, or `dev-cards.ts`.
- Keep phase `index.ts` files as assembly: import interactions, register them with `definePhase`, and export the phase plus stable test-facing schemas.
- Keep `app/reducer-support.ts` small. Split real game rules into `app/rules/*` modules by domain instead of adding unrelated helpers to one catch-all file.
- Run `dreamboard sync` after authored changes to keep generated files and the remote authored head in sync.
- Fresh `app/setup-profiles.ts` placeholders are framework-owned until you customize them. `dreamboard sync` refreshes empty placeholder entries to match manifest profile IDs, then preserves the file once you add real setup logic.
- `dreamboard pull` reconciles authored divergence into the current workspace.
- `dreamboard compile` is separate from authored sync; failed compiles do not mean the workspace needs a pull or another sync unless you changed authored files again.
- Use `dreamboard status` to distinguish authored sync from compile health before deciding whether the next command should be `sync`, `compile`, or `pull`.
- Re-run `dreamboard test generate` after runtime-shape changes in `manifest.ts` or `app/`.
- Keep reducer-owned UI data in views; do not reintroduce the old `shared/ui-args.ts` pattern in new scaffolds.

## Editable Surface

Edit:

- `rule.md`
- `manifest.ts`
- `app/game-contract.ts`
- `app/game.ts`
- `app/phases/*.ts`
- `app/phases/*/*.ts`
- `app/rules/*.ts` (when you split game-domain helpers)
- `app/setup-profiles.ts`
- `app/reducer-support.ts`
- `app/*-view.ts` (view files you create, e.g. `app/player-view.ts`)
- `ui/App.tsx`
- `test/bases/*.base.ts`
- `test/scenarios/*.scenario.ts`

Do not edit generated or framework-owned files such as:

- `app/index.ts`
- `shared/manifest-contract.ts`
- `shared/generated/ui-contract.ts`
- `ui/index.tsx`
- `test/generated/*`

## Official Documentation

Visit https://dreamboard.games/docs

## Framework Feedback

Use `feedback.md` in the game project root to record framework issues, missing features, or workflow friction. Include reproduction steps, expected behavior, and actual behavior when possible.
