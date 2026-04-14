# State & API Reference

Use this page as a lookup while writing `app/phases/*.ts`.

This is a reference-first document, not a modeling guide. For schema design, use [manifest-authoring.md](manifest-authoring.md). For hand-vs-deck decisions, use [hands-vs-decks.md](hands-vs-decks.md).

## Read APIs (`ctx.state.*`)

### `state.player`

| Method                                 | Returns       | Description                           |
| -------------------------------------- | ------------- | ------------------------------------- |
| `.getOrder()`                          | `PlayerId[]`  | All players in turn order             |
| `.getCurrentIds()`                     | `PlayerId[]`  | Currently active player IDs           |
| `.get(playerId)`                       | `Player`      | Player data: `{ id, name, score }`    |
| `.getState(playerId)`                  | `PlayerState` | Player variables from manifest schema |
| `.getHand(playerId, handId)`           | `CardId[]`    | Cards in a specific hand              |
| `.getAllHands(playerId)`               | `CardId[]`    | All cards across all hands            |
| `.isInHand(playerId, cardId, handId?)` | `boolean`     | Check if card is in hand              |
| `.isActive(playerId)`                  | `boolean`     | Is player currently active            |

### `state.deck`

| Method                | Returns          | Description            |
| --------------------- | ---------------- | ---------------------- |
| `.getCards(deckId)`   | `CardId[]`       | Cards in a shared deck |
| `.getTopCard(deckId)` | `CardId \| null` | Top card of deck       |

### `state.card`

| Method                           | Returns            | Description                                          |
| -------------------------------- | ------------------ | ---------------------------------------------------- |
| `.get(cardId)`                   | `Card`             | Full card data                                       |
| `.getProperties(cardId)`         | Typed properties   | Card-specific props (rank, suit, etc.)               |
| `.getLocation(cardId)`           | `Location`         | Where the card is (InHand, InDeck, InZone, Detached) |
| `.getPlayedBy(cardId)`           | `PlayerId \| null` | Who played this card to a deck/zone                  |
| `.getOwner(cardId)`              | `PlayerId \| null` | Card owner                                           |
| `.isVisibleTo(cardId, playerId)` | `boolean`          | Visibility check                                     |
| `.getOwnedBy(playerId)`          | `CardId[]`         | All cards owned by player                            |

### `state.game`

| Method               | Returns       | Description                           |
| -------------------- | ------------- | ------------------------------------- |
| `.getGlobalState()`  | `GlobalState` | Global variables from manifest schema |
| `.getCurrentState()` | `StateName`   | Current state machine state           |

## Mutation APIs (`ctx.apis.*`)

### `apis.cardApi`

| Method                                                                      | Description                    |
| --------------------------------------------------------------------------- | ------------------------------ |
| `.moveCardsFromHandToDeck(playerId, handId, cardIds, deckId)`               | Hand → Deck                    |
| `.moveCardsFromHandToHand(fromPlayer, fromHand, toPlayer, toHand, cardIds)` | Hand → Hand                    |
| `.moveCardsToPlayer(cardIds, toPlayerId, handId)`                           | Any → Hand                     |
| `.flip(deckId, cardId)`                                                     | Flip card face up/down         |
| `.detachCard(cardId)`                                                       | Remove card from all locations |
| `.transferOwnership(cardId, toPlayer)`                                      | Change card owner              |

#### Card movement semantics

- `moveCardsFromHandToHand(fromPlayer, fromHand, toPlayer, toHand, cardIds)` is **additive** at destination.
- Destination cards are preserved; moved cards are added to the destination hand.
- This API does **not** replace/overwrite the destination hand.
- For pass/rotate mechanics where each player should receive exactly one other player's hand, avoid in-place cyclic moves. Snapshot source hands first, then move via a temporary location (or other two-phase transfer pattern).

### `apis.deckApi`

| Method                                                        | Description               |
| ------------------------------------------------------------- | ------------------------- |
| `.moveCardsFromDeckToPlayer(deckId, playerId, handId, count)` | Deck → Hand (deal)        |
| `.moveCardsFromDeckToDeck(fromDeckId, toDeckId)`              | Deck → Deck               |
| `.shuffle(deckId)`                                            | Shuffle a deck            |
| `.addCards(deckId, cardIds)`                                  | Add cards to a deck       |
| `.removeCard(deckId, cardId)`                                 | Remove a card from a deck |

### `apis.gameApi`

| Method                             | Description                                    |
| ---------------------------------- | ---------------------------------------------- |
| `.setActivePlayers(playerIds)`     | Set who can act (use in ALL_PLAYERS `onEnter`) |
| `.setNextPlayer(playerId)`         | Set single active player                       |
| `.advanceTurn()`                   | Move to next player in order                   |
| `.declareWinner(playerId, reason)` | Declare game winner                            |
| `.endGame()`                       | End the game                                   |

### `apis.globalStateApi`

| Method                                | Description                  |
| ------------------------------------- | ---------------------------- |
| `.setGlobalState(newState)`           | Replace all global variables |
| `.setPlayerState(playerId, newState)` | Replace a player's variables |

### `apis.kvApi`

Internal-only key-value store. **UI cannot access these values.**

| Method             | Returns          | Description                         |
| ------------------ | ---------------- | ----------------------------------- |
| `.set(key, value)` | `KvSetResult`    | Store a JSON value                  |
| `.get(key)`        | `KvGetResult`    | Read a value (`.success`, `.value`) |
| `.delete(key)`     | `KvDeleteResult` | Remove a key                        |
| `.has(key)`        | `boolean`        | Check existence                     |
| `.keys()`          | `string[]`       | List all keys                       |

### `apis.resourceApi`

| Method                    | Description                |
| ------------------------- | -------------------------- |
| `.add(playerId, cost)`    | Give resources to player   |
| `.deduct(playerId, cost)` | Take resources from player |

### `apis.dieApi`

| Method                     | Description               |
| -------------------------- | ------------------------- |
| `.roll(dieId)`             | Roll a die                |
| `.setValue(dieId, value?)` | Set die to specific value |

## Typed KV Store

Use `createTypedKv` from `sdk/stateApi.js` for type-safe KV access:

```typescript
import { createTypedKv } from "../sdk/stateApi.js";

interface MyKv {
  playersActed: PlayerId[];
  roundData: { scores: number[] };
}

const kv = createTypedKv<MyKv>(apis.kvApi);
kv.set("playersActed", ["player-1"]); // Type-checked key and value
const acted = kv.get("playersActed"); // PlayerId[] | null
kv.has("playersActed"); // boolean
kv.delete("playersActed"); // boolean (existed)
```

## Card `playedBy` Tracking

When cards move from a Hand to a Deck via `moveCardsFromHandToDeck()`, the engine automatically records `playedBy` on each card:

```typescript
// Move card from player's hand to a shared deck
apis.cardApi.moveCardsFromHandToDeck(
  playerId,
  "main-hand",
  [cardId],
  "play-area",
);

// Later, check who played a specific card
const whoPlayed = state.card.getPlayedBy(cardId); // PlayerId | null
```

## Location Type

Cards have a location discriminated union:

```typescript
type Location =
  | { type: "Detached" }
  | {
      type: "InDeck";
      deckId: DeckId;
      playedBy: PlayerId | null;
      position: number | null;
    }
  | {
      type: "InHand";
      handId: HandId;
      playerId: PlayerId;
      position: number | null;
    }
  | {
      type: "InZone";
      zoneId: string;
      playedBy: PlayerId | null;
      position: number | null;
    };
```

## Validation Helpers

```typescript
import { validationSuccess, validationError } from "../sdk/validation.js";

// Valid action
return validationSuccess();

// Invalid action — errorCode should be kebab-case
return validationError(
  "must-play-valid-combination",
  "You must play a valid card combination",
);
```
