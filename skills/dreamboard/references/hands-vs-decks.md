# Hands vs Decks

Use this guide when you are deciding how to model a card container in `manifest.json`.

Dreamboard separates three ideas that are easy to blur together in tabletop rules:

- `cardSets`: what cards exist
- `decks`: shared card containers
- `playerHandDefinitions`: per-player card containers

For the full manifest schema, see [manifest-authoring.md](manifest-authoring.md).

## Quick Decision Rule

1. If you are defining the cards themselves, use a `cardSet`.
2. If the whole table shares one container, use a `deck`.
3. If each player gets their own copy of the container, use a `playerHandDefinition`.

## Canonical Meanings

| Concept  | Manifest key            | Runtime ID    | Use it for                        |
| -------- | ----------------------- | ------------- | --------------------------------- |
| Card set | `cardSets`              | none directly | Card content and card schema      |
| Hand     | `playerHandDefinitions` | `HandId`      | Cards each player owns separately |
| Deck     | `decks`                 | `DeckId`      | Shared piles or shared card areas |

## Naming Rule

Use the Dreamboard meaning, not the tabletop nickname.

If a real-world game says each player has a "deck", but each player owns a separate pile, model it as a hand.

Examples:

- a player's draw pile in War is a hand
- a player's scored pile is a hand
- the shared draw pile in Poker is a deck
- the shared discard pile is a deck
- a shared trick area is a deck

## Common Mistakes

- Do not use a deck just because cards are face-down.
- Do not use a deck for something every player owns separately.
- Do not use a hand for a communal area just because cards stay there for a while.

Visibility is separate from ownership:

- if each player has their own container, it is still a hand
- set `visibility: "public"` if other players should be able to see that hand

## Example

```json
{
  "cardSets": [
    {
      "type": "preset",
      "id": "standard_52_deck",
      "name": "Standard 52-Card Deck"
    }
  ],
  "decks": [
    {
      "id": "main-deck",
      "name": "Main Deck",
      "cardSetId": "standard_52_deck"
    },
    {
      "id": "battle-zone",
      "name": "Battle Zone",
      "cardSetId": "standard_52_deck"
    }
  ],
  "playerHandDefinitions": [
    {
      "id": "player-deck",
      "displayName": "Your Deck",
      "visibility": "ownerOnly",
      "cardSetIds": ["standard_52_deck"]
    },
    {
      "id": "won-pile",
      "displayName": "Won Cards",
      "visibility": "public",
      "cardSetIds": ["standard_52_deck"]
    }
  ]
}
```

In that example:

- `standard_52_deck` defines the cards
- `main-deck` and `battle-zone` are shared decks
- `player-deck` and `won-pile` are per-player hands

## Related Move APIs

```typescript
// Hand -> Deck
apis.cardApi.moveCardsFromHandToDeck(playerId, handId, cardIds, deckId);

// Deck -> Hand
apis.deckApi.moveCardsFromDeckToPlayer(deckId, playerId, handId, count);

// Hand -> Hand
apis.cardApi.moveCardsFromHandToHand(
  fromPlayer,
  fromHand,
  toPlayer,
  toHand,
  cardIds,
);

// Deck -> Deck
apis.deckApi.moveCardsFromDeckToDeck(fromDeckId, toDeckId);
```

## Rule Of Thumb

- shared container: `deck`
- per-player container: `playerHandDefinition`
- card blueprint: `cardSet`
