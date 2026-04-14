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
- Authenticated via `dreamboard login`

## New game workflow

Copy this checklist and track your progress:

```
New Game Development Progress:
- [ ] Step 1: Author rule.md
- [ ] Step 2: Author manifest.ts to define game topology
- [ ] Step 3: Run `dreamboard sync` to update generated type-safe contracts
- [ ] Step 4: Implement reducer contract, phases, actions, and views in `app/`
- [ ] Step 5: Run `dreamboard compile` and fix any type errors
- [ ] Step 6: Write bases and scenarios in `test/`, then run `dreamboard test generate` and `dreamboard test run`
- [ ] Step 7: Implement the playable UI in `ui/App.tsx` — prefer components from `ui/components/dreamboard/` before writing custom elements (see [references/ui-library.md](references/ui-library.md))
- [ ] Step 8: Verify end-to-end with `dreamboard dev`
```

For a full walkthrough of each step, see [references/building-your-first-game.md](references/building-your-first-game.md)

## References

- Quickstart:
  [references/quickstart.md](references/quickstart.md)
- CLI:
  [references/cli.md](references/cli.md)
- Rules:
  [references/rule-authoring.md](references/rule-authoring.md)
- Manifest:
  [references/manifest-authoring.md](references/manifest-authoring.md)
- Tiled Boards:
  [references/tiled-board-topology.md](references/tiled-board-topology.md)
- Reducer:
  [references/reducer.md](references/reducer.md)
- UI Library:
  [references/ui-library.md](references/ui-library.md)
- Testing:
  [references/testing.md](references/testing.md)

## Current Scaffold

A fresh `dreamboard new` workspace contains:

- authored source:
  `rule.md`, `manifest.ts`
- reducer:
  `app/game-contract.ts`, `app/game.ts`, `app/phases/setup.ts`,
  `app/setup-profiles.ts`, `app/reducer-support.ts`
- UI:
  `ui/App.tsx`, `ui/components/dreamboard/` (pre-built component library —
  presentational: `Card`, `Hand`, `PlayArea`, `PlayerInfo`, `ActionButton`, `ActionPanel`, `DiceRoller`, `PhaseIndicator`, `GameEndDisplay`, `Drawer`;
  board: `SquareGrid`, `HexGrid`, `TrackBoard`, `NetworkGraph`, `ZoneMap`, `SlotSystem`)
- tests:
  `test/bases/initial-turn.base.ts`, `test/testing-types.ts`
  _(scenarios are not scaffolded — create them in `test/scenarios/`)_
- generated (do not edit):
  `shared/manifest-contract.ts`, `shared/generated/ui-contract.ts`

## Command Flow

Use the commands for different kinds of state:

- `dreamboard sync`
  Upload local authored changes and advance the remote authored head. Run this after editing `rule.md`, `manifest.ts`, or authored source files that should be part of the next remote build. Re-running `sync` against the same authored content is safe; Dreamboard reuses already-uploaded source blobs and still refreshes framework-owned generated files. When `package.json` changes, `sync` also prepares workspace dependencies automatically. If Dreamboard reports missing dependency tooling, see https://dreamboard.games/docs/reference/dependency-setup.
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
