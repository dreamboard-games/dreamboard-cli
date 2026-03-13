# Adversarial Testing

Adversarial testing uses scenario files to intentionally stress game rules, turn gating, and edge conditions.

Use this guide with `dreamboard run --scenario <file>`.

This file is about adversarial coverage strategy, not JSON schema.

- For the JSON step format itself, see [scenario-format.md](scenario-format.md).
- For TypeScript regression tests, see [test-harness.md](test-harness.md).

## Goals

1. Validate that illegal or out-of-sequence actions are rejected.
2. Validate that legal actions still work after edge-state pressure.
3. Catch flaky behavior by running with deterministic seeds.

## Core Workflow

1. Start from a known state:

```bash
dreamboard run --new-session --seed 1337 --players <playerCount>
```

2. Inspect `.dreamboard/run/latest-your-turn.json` to identify:

   - Current controllable player(s)
   - Available actions and parameter shapes
   - Turn/phase context

3. Write a focused scenario file that targets one adversarial behavior.
4. Execute the scenario:

```bash
dreamboard run --players <playerCount> --scenario scenario-for-<case>.json
```

5. Validate outcomes using:
   - CLI exit result (`scenario_completed` vs `scenario_rejected`)
   - `.dreamboard/run/events.ndjson`
   - `.dreamboard/run/last-run-summary.json`

For deeper inspection, extract specific fields from events:

```bash
node .agents/skills/dreamboard/scripts/events-extract.mjs --type ACTION_REJECTED --field message.reason
node .agents/skills/dreamboard/scripts/events-extract.mjs --type YOUR_TURN --field message.availableActions --limit 1
```

## Progression Strategy

1. Start simple first:
   - Begin with 1-step or 2-step scenarios.
   - Use a single player (`player-1`) and one expected behavior per file.
   - Confirm your action names and parameter shapes are correct before scaling up.
2. Then move to complex simulations:
   - Create multi-step scenarios that chain several turns.
   - Include multiple players across steps (for example `player-1`, `player-2`, `player-3`).
   - Combine normal and adversarial actions in the same flow to test resilience after state transitions.
3. Create scenario that fully tests a round (e.g. all players played their hand, or all players placed their workers)
4. Ensure AUTO phase transitions are correct.
5. Keep deterministic inputs (`--new-session --seed 1337`) while increasing complexity so failures stay reproducible.

Build scenario files using the contract in [scenario-format.md](scenario-format.md), then use the patterns below to decide what to test.

## Adversarial Patterns

Create one scenario per pattern so failures are easy to triage.

1. Invalid parameters: missing required input, invalid enum, or out-of-range values.
2. Wrong player: action submitted by a non-active/non-controllable player.
3. Order violation: execute actions in a sequence that should be illegal.
4. Resource exhaustion: repeat actions until resources/cards/slots are depleted.
5. Duplicate or replay behavior: attempt the same step repeatedly in one turn.
6. Boundary transitions: move through end-of-round/end-of-game boundaries and attempt one extra action.

## Practical Conventions

1. Keep each scenario small and single-purpose.
2. Name files by expected behavior, for example:
   - `scenario-reject-invalid-params.json`
   - `scenario-reject-wrong-player.json`
   - `scenario-endgame-boundary.json`
3. Prefer `--new-session --seed 1337` while authoring/debugging to avoid random drift.
4. If turn context is missing, `dreamboard run --scenario ...` will wait for the first `YOUR_TURN` automatically.
5. API scenarios are strict: if a step gets `ACTION_REJECTED`, the run stops with `scenario_rejected`.
6. Use `events-extract.ts` to quickly inspect rejection reasons, available actions, and player transitions before editing scenarios.

### Error: `Card is not in your hand`

When this rejection appears, verify the target player's hand state across turns before and after each scenario step.

1. Extract rejection events first:

```bash
node .agents/skills/dreamboard/scripts/events-extract.mjs --type ACTION_REJECTED --field message.reason
```

2. Inspect hand snapshots from turn events for the target player (example: `player-2`):

```bash
node .agents/skills/dreamboard/scripts/events-extract.mjs --type YOUR_TURN --player player-2 --field message.gameState.hands
```

3. Compare entries by `index` in output to see how the player's hand changes between turns.
4. Confirm the `cardId` in your scenario step exists in the target player's hand at the turn where the action is submitted.
5. If the card disappears earlier than expected, inspect preceding steps for draws/discards/transfers that changed ownership.

## Optional UI Driver

Use `--scenario-driver ui` only for browser input-path coverage (click targets, interaction wiring).
Keep most adversarial rule tests on the API driver for reliability and speed.
