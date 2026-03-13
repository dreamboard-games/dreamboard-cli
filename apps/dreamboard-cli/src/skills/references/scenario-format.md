# Scenario Format

Scenarios are JSON files used with `dreamboard run --scenario <file>` to automate gameplay actions.

Use this file for the JSON runtime-scenario contract.

- For TypeScript regression tests with `dreamboard test generate` / `dreamboard test run`, see [test-harness.md](test-harness.md).
- For what adversarial cases to write with these JSON scenarios, see [adversarial-testing.md](adversarial-testing.md).

`dreamboard run` is now a single command flow:

1. Without `--scenario`, it observes SSE until a stop condition (default `YOUR_TURN`).
2. With `--scenario`, it executes scenario steps (default `--max-steps 1`).
3. Scenario driver defaults to `api` (no Playwright required).
4. Playwright is used only for `--scenario-driver ui` or `--screenshot`.

## Default Structure (API Driver)

```json
{
  "steps": [
    {
      "playerId": "player-1",
      "actionType": "playCard",
      "parameters": { "cardId": "hearts-7" },
      "turns": 1
    },
    {
      "playerId": "player-1",
      "actionType": "endTurn",
      "parameters": {},
      "turns": 1
    }
  ]
}
```

## API Step Fields (Default)

| Field        | Type                      | Description                                                       |
| ------------ | ------------------------- | ----------------------------------------------------------------- |
| `playerId`   | `string`                  | Player ID this step applies to (required)                         |
| `actionType` | `string`                  | Action type submitted to runtime API (required)                   |
| `parameters` | `Record<string, unknown>` | Action parameters object (optional, default `{}`)                 |
| `turns`      | `number`                  | Number of turns to wait after this action (optional, default `1`) |

## UI Step Fields (`--scenario-driver ui`)

| Field      | Type       | Description                                                                 |
| ---------- | ---------- | --------------------------------------------------------------------------- |
| `playerId` | `string`   | Player ID this step applies to (required)                                   |
| `buttons`  | `string[]` | Mouse/keyboard buttons to simulate (`"left_mouse_button"`, `"right"`, etc.) |
| `turns`    | `number`   | Number of turns to apply this step                                          |
| `mouse_x`  | `number`   | X coordinate of the simulated click (optional)                              |
| `mouse_y`  | `number`   | Y coordinate of the simulated click (optional)                              |

## Conventions

1. `playerId` is required on every step.
2. Run one acting step per invocation for deterministic agent loops:
   - `dreamboard run` (observe turn context)
   - `dreamboard run --scenario ... --max-steps 1` (act once)
3. All steps executed in one invocation must target the same `playerId`.
4. The step `playerId` must be eligible for the latest `YOUR_TURN` context.

## Observe Artifacts

When running without `--scenario`, the CLI writes:

1. `.dreamboard/run/session.json`
2. `.dreamboard/run/events.ndjson`
3. `.dreamboard/run/latest-your-turn.json`
4. `.dreamboard/run/last-run-summary.json`

By default, `events.ndjson` stores only `YOUR_TURN` messages.

## Usage

```bash
# Observe until actionable state (default: until YOUR_TURN)
dreamboard run

# Observe stream behavior
dreamboard run --until GAME_ENDED
dreamboard run --observe-events all
dreamboard run --timeout-ms 15000
dreamboard run --screenshot

# Execute API scenario steps (default driver, no Playwright required)
dreamboard run --scenario path/to/scenario.json
dreamboard run --scenario path/to/scenario.json --max-steps 1

# Execute UI scenario steps (Playwright driver)
dreamboard run --scenario path/to/scenario.json --scenario-driver ui --max-steps 1
dreamboard run --scenario path/to/scenario.json --scenario-driver ui --max-steps 1 --screenshot

# Start a fresh session instead of resuming
dreamboard run --new-session --players 4
```
