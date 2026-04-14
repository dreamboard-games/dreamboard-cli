# App Best Practices

Use this guide when implementing `app/phases/*.ts`.

This page is about phase logic and engine APIs. If you are still deciding the game model itself, fix `rule.md` or `manifest.json` first.

## Before Writing Code

1. Read `shared/manifest.ts` so you know the actual generated IDs and types.
2. Read every file in `app/phases/` to understand the current flow.
3. Review the generated SDK types in `app/sdk/`.

If the card model is still unclear, stop and revisit [hands-vs-decks.md](hands-vs-decks.md) and [manifest-authoring.md](manifest-authoring.md).

## Core Principles

1. **The app is authoritative**
   All gameplay mutations must go through `ctx.apis.*`. Do not assume the UI moved cards or tracked state correctly.
2. **Prefer mutation results inside the current transaction**
   Values returned by mutation APIs are safer than immediately rereading `ctx.state.*`, which may still reflect the previous snapshot.
3. **Use the right active-player API**
   Use `setActivePlayers()` for `ALL_PLAYERS` phases and `setNextPlayer()` for `SINGLE_PLAYER` phases.
4. **All card movement goes through move APIs**
   Never hand-edit card locations in your own state.
5. **Use generated IDs exactly**
   Deck IDs, hand IDs, resource IDs, board IDs, and action names should come from `shared/manifest.ts`.
6. **KV is internal-only**
   `kvApi` is for app logic, not UI data. Pass UI-facing data through `getUIArgs()` or stored state.
7. **Keep player-visible outcomes around long enough to render**
   If an `AUTO` phase resolves a trick, round, or reveal, preserve that result until the next player-facing phase can show it.

## Validation

- Implement `validateAction` for `SINGLE_PLAYER` and `ALL_PLAYERS` phases.
- Return `validationSuccess()` for valid actions.
- Return `validationError(code, message)` for invalid actions.
- Keep error codes stable and kebab-case, for example `must-play-valid-combination`.

## UI Args Contract

- Define UI arg interfaces in `shared/ui-args.ts`.
- Implement `getUIArgs(ctx, playerId)` for each player-facing phase.
- Send only the data the UI actually needs.
- Prefer computed values over forcing the UI to recompute them.

Example:

- better: `canPlayCard: boolean`
- worse: raw state fragments that force the UI to rebuild game rules

## Safety Habits

- Check array length before indexing.
- Use generated guards from `../generated/guards` for typed ID checks.
- Avoid `any`.
- Log compact payloads with `ctx.logger`, not giant arrays or full state dumps.

## Common Patterns

### Typed KV store

```typescript
import { createTypedKv } from "../sdk/stateApi.js";

interface PhaseKv {
  playersActed: PlayerId[];
  roundNumber: number;
}

const kv = createTypedKv<PhaseKv>(apis.kvApi);
kv.set("playersActed", []);
const acted = kv.get("playersActed"); // PlayerId[] | null
```

### Card `playedBy` tracking

```typescript
apis.cardApi.moveCardsFromHandToDeck(
  playerId,
  "main-hand",
  [cardId],
  "play-area",
);

const whoPlayed = state.card.getPlayedBy(cardId); // PlayerId | null
```

### Turn advancement

```typescript
onAfterAction(ctx, playerId, actionType) {
  ctx.apis.gameApi.advanceTurn();
},
```

### ALL_PLAYERS progress tracking

Use the engine-managed helpers in [all-players-tracking.md](all-players-tracking.md) instead of building your own action-tracking store.
