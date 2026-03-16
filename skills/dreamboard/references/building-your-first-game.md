# Building Your First Game

Use this as the default end-to-end workflow for a new Dreamboard game. The goal is not just "something renders"; the goal is a complete, playable game with rules, app logic, UI, and tests all aligned.

## Core Workflow

1. Create a game: `dreamboard new <slug> --description "<<short description>>"`
2. Author `rule.md` and `manifest.json`
   Quality bar: define the full game loop up front, including setup, turn structure, win/loss conditions, scoring, tie behavior, hidden/public information, and every player action the app must support. `manifest.json` should reflect the real player counts, entities, zones, and controls needed by the rules, not a partial guess.
   Refer to
   - [references/rule-authoring.md](rule-authoring.md),
   - [references/manifest-authoring.md](manifest-authoring.md)
3. Run `dreamboard update` after every manifest or rule change
   Quality bar: do this immediately after each rule or manifest edit so generated scaffold, types, and framework assumptions stay in sync. Do not keep coding against stale generated files.
4. Implement rules in `app/phases/*.ts` and UI data in `shared/ui-args.ts`
   Quality bar: every gameplay phase must be implemented end to end. Cover all rule branches, all legal player actions, all transitions, all round-resolution logic, and all game-end paths. `shared/ui-args.ts` must provide enough data for the UI to render every playable state without guessing or reconstructing hidden game logic in React.
   Refer to
   - [references/phase-handlers.md](phase-handlers.md),
   - [references/api-reference.md](api-reference.md),
   - [references/hands-vs-decks.md](hands-vs-decks.md),
   - [references/all-players-tracking.md](all-players-tracking.md),
   - [references/app-best-practices.md](app-best-practices.md)
5. Implement UI in `ui/App.tsx` and `ui/components/*`
   Quality bar: the entire game must be playable through the UI, including setup, core turns, confirmations, resolution states, errors and disabled states, and end-of-game feedback. Follow the styling requirements in [ui-style-guide.md](ui-style-guide.md). Avoid half-finished interfaces such as raw debug JSON, missing controls, placeholder labels, or flows that require reading logs to understand what to do next.
   Refer to
   - [references/ui-best-practices.md](ui-best-practices.md)
6. Typecheck from the game root: `bun install && bun run typecheck`
   Quality bar: typecheck must pass cleanly from the game root with no ignored errors and no dead code left behind from iteration.
7. Push compiled changes: `dreamboard push`
   Quality bar: the pushed build should reflect the same rules and UI you validated locally, with no pending local-only fixes or known desync between authored files and compiled output.
8. Generate deterministic bases for testing: `dreamboard test generate`
   Quality bar: regenerate bases whenever initial setup, compiled behavior, or game identity changes. The generated bases should be stable enough that regressions are easy to spot.
9. Run regression scenarios: `dreamboard test run`
   Quality bar: cover the happy path, invalid actions, boundary conditions, phase transitions, simultaneous or multi-player interactions where relevant, and every game-ending outcome. All scenario statuses should be green.
   Refer to
   - [references/test-harness.md](test-harness.md)
10. Validate the runtime behavior and live UI with `dreamboard run --scenario <scenario_file>` and `dreamboard run --screenshot`
    Quality bar: if Playwright is installed locally, screenshot verification is required. Confirm the UI looks complete and usable in real runtime states, including the initial view, an active turn, resolution moments, and the end-game state. Fix any broken layout, missing affordances, or styling drift before considering the game done.
    Refer to
    - [references/adversarial-testing.md](adversarial-testing.md)

Do not treat UI, rules, and tests as separate finish-later tracks. A game is only complete when the authored rules, app logic, UI flow, pushed build, and regression coverage all agree on the same behavior.

## What "Done" Means

- App and logic are complete: all phases are implemented, all rule branches are covered, and no required gameplay path is left as a TODO or inferred only in the UI.
- UI is complete: the full game is playable without relying on logs, debug panels, or manual backend intervention.
- Styling is complete: the game follows [ui-style-guide.md](ui-style-guide.md) rather than shipping a generic or half-finished interface.
- Verification is complete: typecheck passes, regression scenarios are green, and runtime screenshot verification has been performed when Playwright is available.
