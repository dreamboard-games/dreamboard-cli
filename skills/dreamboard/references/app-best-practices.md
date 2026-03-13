# App Best Practices

Best practices for working on `app/phases/*.ts` — the server-side game logic.

## Before writing any code

1. **Read the manifest** — understand all decks, hands, zones, resources, state machine states, and card types from `shared/manifest.d.ts`.
2. **Read all existing phases** — read every file in `app/phases/` to understand the current flow.
3. **Read the types** — review `app/sdk/types.d.ts`, `app/sdk/phaseHandlers.ts`, and `app/sdk/state.d.ts` for the full API surface.

## Core principles

1. **Authoritative script** — the app script is the source of truth for a multiplayer game. All mutations must go through APIs; never assume the UI tracks state.
2. **Optimistic results** — use the data returned by mutation APIs within the same transaction. `state.*` reads may be stale until the next call.
3. **Active vs next players** — use `setActivePlayers()` for simultaneous phases (ALL_PLAYERS); use `setNextPlayer()` for turn-based phases (SINGLE_PLAYER).
4. **Card movement guardrail** — every card location change must use a move API. Never assume the UI or staging moved cards.
5. **Manifest alignment** — use deck/hand/zone IDs exactly as defined in `shared/manifest.d.ts`. Do not invent new identifiers.
6. **KV is internal** — `kvApi` is invisible to the UI. Pass data to UI via `getUIArgs()`, `globalStateApi`, or `playerStateApi`.
7. **Preserve player-visible outcomes** — if an AUTO phase resolves a round or a reveal, keep the round-result information in state long enough for the next player-visible phase to render it.

## Validation

- Always implement `validateAction` for SINGLE_PLAYER and ALL_PLAYERS phases.
- Return `validationSuccess()` for valid actions.
- Return `validationError(code, message)` for invalid actions. Codes should be kebab-case (e.g., `'must-play-valid-combination'`).

## UIArgs contract

- Define UIArgs interfaces in `shared/ui-args.ts` to specify what data flows from app to UI.
- Implement `getUIArgs(ctx, playerId)` in each player-facing phase to return the data the UI needs.
- UIArgs should be minimal — only pass what the UI actually uses.
- Avoid passing raw card IDs when you can pass computed values (e.g., `canPlayCard: boolean` instead of making the UI recompute).

## Array and type safety

- Check array length before indexing. Never assume arrays are non-empty.
- Use guards from `app/generated/guards.ts` via `../generated/guards` for ID type assertions.
- Never cast to `any` — always work with the generated types.

## Logging

- Log key actions with concise payloads (IDs and counts), not full arrays.
- Use `ctx.logger` for structured logging.

## Common patterns

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

### Card playedBy tracking

```typescript
// Cards moved via moveCardsFromHandToDeck automatically track playedBy
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
// In onAfterAction for SINGLE_PLAYER phases
onAfterAction(ctx, playerId, actionType) {
  ctx.apis.gameApi.advanceTurn();
},
```

### ALL_PLAYERS tracking

See [all-players-tracking.md](all-players-tracking.md) for the recommended `ctx.phase` tracking pattern.
