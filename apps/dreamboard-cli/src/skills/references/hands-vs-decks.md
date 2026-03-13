# Hands vs Decks

The framework distinguishes between **Hands** and **Decks**. Confusing them causes silent bugs.

## Definitions

| Concept  | Manifest key                  | Type ID  | Access API                               | Description                                                  |
| -------- | ----------------------------- | -------- | ---------------------------------------- | ------------------------------------------------------------ |
| **Hand** | `playerHandDefinitions`       | `HandId` | `state.player.getHand(playerId, handId)` | Cards owned by a specific player. Per-player.                |
| **Deck** | `components` (type: `"deck"`) | `DeckId` | `state.deck.getCards(deckId)`            | Shared card piles (draw pile, discard, battle zone). Global. |

## Key rule

A player's collection of cards is always a **Hand** (`HandId`), even if the real-world game calls it a "deck."

For example, in the War card game, each player's face-down pile is called a "deck" in real life, but in the framework it's defined as a **Hand** with id `"player-deck"` under `playerHandDefinitions`.

## Manifest Example (War card game)

```json
{
  "components": [
    { "type": "deck", "id": "main-deck", "name": "Main Deck" },
    { "type": "deck", "id": "battle-zone", "name": "Battle Zone" },
    { "type": "deck", "id": "war-pile", "name": "War Pile" }
  ],
  "playerHandDefinitions": [
    {
      "id": "player-deck",
      "displayName": "Your Deck",
      "visibility": "ownerOnly"
    },
    { "id": "won-pile", "displayName": "Won Cards", "visibility": "ownerOnly" }
  ]
}
```

- `"player-deck"` → **HandId** (per-player) → `state.player.getHand(playerId, "player-deck")`
- `"battle-zone"` → **DeckId** (shared) → `state.deck.getCards("battle-zone")`
- `"war-pile"` → **DeckId** (shared) → `state.deck.getCards("war-pile")`

## Moving Cards

```typescript
// Hand → Deck (player plays card to shared area)
apis.cardApi.moveCardsFromHandToDeck(playerId, handId, cardIds, deckId);

// Deck → Hand (deal from shared pile to player)
apis.deckApi.moveCardsFromDeckToPlayer(deckId, playerId, handId, count);

// Hand → Hand (pass cards between players)
apis.cardApi.moveCardsFromHandToHand(
  fromPlayer,
  fromHand,
  toPlayer,
  toHand,
  cardIds,
);

// Deck → Deck (move all cards between shared piles)
apis.deckApi.moveCardsFromDeckToDeck(fromDeckId, toDeckId);

// Any card → Hand (move specific cards to a player)
apis.cardApi.moveCardsToPlayer(cardIds, toPlayerId, handId);
```

## Hand Passing: Anti-Pattern vs Safe Pattern

`moveCardsFromHandToHand` appends to destination. That makes in-place cyclic passing unsafe.

### Anti-pattern (in-place cyclic pass)

```typescript
for (let i = 0; i < order.length; i++) {
  const fromPlayer = order[i];
  const toPlayer = order[(i + 1) % order.length];
  const cardIds = state.player.getHand(fromPlayer, "hand");
  apis.cardApi.moveCardsFromHandToHand(
    fromPlayer,
    "hand",
    toPlayer,
    "hand",
    cardIds,
  );
}
```
