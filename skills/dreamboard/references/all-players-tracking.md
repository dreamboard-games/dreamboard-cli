# ALL_PLAYERS Phase - Tracking Who Has Acted

The engine automatically tracks action progress in `ALL_PLAYERS` (`MultiplePlayer`) phases through `ctx.phase`. Do not implement manual KV tracking for this.

## Built-in phase tracking API

Use `ctx.phase` in `validateAction` and `checkCompletion`:

- `ctx.phase.hasPlayerActed(playerId)` - has this player already submitted an action?
- `ctx.phase.haveAllExpectedPlayersActed()` - are all currently expected players done?
- `ctx.phase.getPlayersStillWaiting()` - which players are still pending?
- `ctx.phase.getExpectedPlayers()` - who is expected to act this phase?
- `ctx.phase.getPlayersWhoActed()` - who has already acted?

## Recommended pattern

```typescript
import type { MultiplePlayerPhaseDefinition } from "../sdk/phaseHandlers";
import { createMultiplePlayerPhase } from "../sdk/phaseHandlers";
import { validationSuccess, validationError } from "../sdk/validation.js";

type PhaseAction = "revealCard";

const phaseDefinition = {
  onEnter(ctx) {
    const { state, apis } = ctx;
    apis.gameApi.setActivePlayers(state.player.getOrder());
    // No manual tracking setup required.
  },

  validateAction(ctx, playerId, actionType, parameters) {
    if (ctx.phase.hasPlayerActed(playerId)) {
      return validationError("already-acted", "You already acted this phase");
    }
    return validationSuccess();
  },

  onPlayerAction(ctx, playerId, actionType, parameters) {
    const { apis } = ctx;
    // ... process action ...
    // Engine tracking updates automatically after accepted actions.
  },

  checkCompletion(ctx) {
    if (ctx.phase.haveAllExpectedPlayersActed()) {
      return "nextPhase";
    }
    return null;
  },

  onComplete(ctx) {
    // Optional cleanup only. No action-tracking cleanup required.
  },

  getUIArgs(ctx, playerId) {
    return {
      waitingOn: ctx.phase.getPlayersStillWaiting(),
    };
  },
} satisfies MultiplePlayerPhaseDefinition<"revealCards", PhaseAction>;

export const phase = createMultiplePlayerPhase(phaseDefinition);
```

## If UI needs progress data

`ctx.phase` is available in app logic. For UI, pass derived values via `getUIArgs()` (for example `waitingOn`), or write explicit UI-facing values via global/player state APIs.

## Checklist for ALL_PLAYERS phases

1. Call `apis.gameApi.setActivePlayers(state.player.getOrder())` in `onEnter`.
2. Block duplicate actions with `ctx.phase.hasPlayerActed(playerId)` in `validateAction`.
3. Process each action in `onPlayerAction` without manual tracking writes.
4. Transition from `checkCompletion` when `ctx.phase.haveAllExpectedPlayersActed()` is true.
5. Use `ctx.phase.getPlayersStillWaiting()` / `getPlayersWhoActed()` for logs or UI args as needed.
