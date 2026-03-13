# Phase Handlers

Phase handlers are the core abstraction for implementing game logic. Each state in the manifest's `stateMachine` maps to a phase handler file in `app/phases/`.

## Phase Types

| Type            | File Import                 | When to use                                                  |
| --------------- | --------------------------- | ------------------------------------------------------------ |
| `AUTO`          | `createAutoPhase`           | No player input needed (deal, resolve, score)                |
| `SINGLE_PLAYER` | `createSinglePlayerPhase`   | One player acts at a time (play a card, roll dice)           |
| `ALL_PLAYERS`   | `createMultiplePlayerPhase` | All players act simultaneously (reveal, pass cards, discard) |

## Phase Lifecycle

**AUTO**: `execute(ctx)` → returns next state name

**SINGLE_PLAYER / ALL_PLAYERS**:

1. `onEnter(ctx)` — initialize phase state, set active players
2. `validateAction(ctx, playerId, actionType, parameters)` — validate before execution
3. `onPlayerAction(ctx, playerId, actionType, parameters)` — process the action (mutate state)
4. `onAfterAction(ctx, playerId, actionType)` — per-action side effects (e.g., advance turn)
5. `checkCompletion(ctx)` — return `null` if not done, or the next state name if done
6. `onComplete(ctx)` — cleanup after transition decision

## PhaseContext (`ctx`)

```typescript
interface PhaseContext {
  readonly state: StateApi; // Read game state
  readonly apis: GameApis; // Mutate game state
  readonly logger: Logger; // Log messages
}
```

## AUTO Phase Example

```typescript
import type { AutoPhaseDefinition } from "../sdk/phaseHandlers";
import { createAutoPhase } from "../sdk/phaseHandlers";

const phaseDefinition = {
  execute(ctx) {
    const { state, apis, logger } = ctx;
    apis.deckApi.shuffle("main-deck");
    for (const playerId of state.player.getOrder()) {
      apis.deckApi.moveCardsFromDeckToPlayer(
        "main-deck",
        playerId,
        "main-hand",
        5,
      );
    }
    return "playPhase";
  },
} satisfies AutoPhaseDefinition<"dealCards">;

export const phase = createAutoPhase(phaseDefinition);
```

## SINGLE_PLAYER Phase Example

```typescript
import type { SinglePlayerPhaseDefinition } from "../sdk/phaseHandlers";
import { createSinglePlayerPhase } from "../sdk/phaseHandlers";
import { validationSuccess, validationError } from "../sdk/validation.js";

const phaseDefinition = {
  onEnter(ctx) {
    const { state, apis } = ctx;
    const firstPlayer = state.player.getOrder()[0];
    apis.gameApi.setNextPlayer(firstPlayer);
  },

  validateAction(ctx, playerId, actionType, parameters) {
    return validationSuccess();
  },

  onPlayerAction(ctx, playerId, actionType, parameters) {
    const { apis } = ctx;
    // Process action...
  },

  onAfterAction(ctx, playerId, actionType) {
    const { apis } = ctx;
    apis.gameApi.advanceTurn(); // Move to next player
  },

  checkCompletion(ctx) {
    // Return null to keep playing, or next state name to transition
    return null;
  },

  getUIArgs(ctx, playerId) {
    return {};
  },
} satisfies SinglePlayerPhaseDefinition<"playPhase", "playCard">;

export const phase = createSinglePlayerPhase(phaseDefinition);
```

## ALL_PLAYERS Phase Example

See [all-players-tracking.md](all-players-tracking.md) for the recommended tracking pattern.

## Terminal Phase (Game End)

For states with no transitions (game end), use `TerminalPhaseDefinition`:

```typescript
import type { TerminalPhaseDefinition } from "../sdk/phaseHandlers";
import { createTerminalPhase } from "../sdk/phaseHandlers";

const phaseDefinition = {
  execute(ctx) {
    const { state, apis } = ctx;
    // Optionally declare winner
    apis.gameApi.declareWinner("player-1", "Most points");
    apis.gameApi.endGame();
    return "endGame";
  },
} satisfies TerminalPhaseDefinition<"endGame">;

export const phase = createTerminalPhase(phaseDefinition);
```

## Type Safety

Phase definitions use `satisfies` for type checking:

- `AutoPhaseDefinition<'stateName'>` — state name from manifest
- `SinglePlayerPhaseDefinition<'stateName', 'actionName'>` — with action type union
- `MultiplePlayerPhaseDefinition<'stateName', 'actionName'>` — for ALL_PLAYERS
- Union multiple actions: `'playCard' | 'drawCard'`
