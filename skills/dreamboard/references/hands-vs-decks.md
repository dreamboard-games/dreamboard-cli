# Shared vs Per-Player Zones

Use this guide when you are deciding how to model a card container in
`manifest.json`.

Dreamboard now uses one manifest concept for table containers:

- `cardSets`: what cards exist
- `zones`: where components can live at the table

The important choice is the zone `scope`.

For the full manifest schema, see [manifest-authoring.md](manifest-authoring.md).

## Quick Decision Rule

1. If you are defining the cards themselves, use a `cardSet`.
2. If the whole table shares one container, use a zone with
   `scope: "shared"`.
3. If each player gets their own copy of the container, use a zone with
   `scope: "perPlayer"`.

## Canonical Meanings

| Concept | Manifest key | Use it for |
| --- | --- | --- |
| Card set | `cardSets` | Card content and card schema |
| Shared zone | `zones` with `scope: "shared"` | Shared piles or shared card areas |
| Per-player zone | `zones` with `scope: "perPlayer"` | One separate container per player |

## Naming Rule

Use the Dreamboard meaning, not the tabletop nickname.

If a real-world game says each player has a "deck", but each player owns a
separate pile, model it as a per-player zone.

Examples:

- a player's draw pile in War is a per-player zone
- a player's scored pile is a per-player zone
- the shared draw pile in Poker is a shared zone
- the shared discard pile is a shared zone
- a shared trick area is a shared zone

## Common Mistakes

- Do not model separate per-player containers as one shared zone.
- Do not model a communal area as a per-player zone just because cards stay
  there for a while.
- Do not create multiple `cardSets` when the cards are the same and only the
  containers differ.

Visibility is separate from ownership:

- if each player has their own container, it is still a `perPlayer` zone
- set `visibility: "public"` if other players should be able to see that zone

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
  "zones": [
    {
      "id": "main-deck",
      "name": "Main Deck",
      "scope": "shared",
      "allowedCardSetIds": ["standard_52_deck"]
    },
    {
      "id": "battle-zone",
      "name": "Battle Zone",
      "scope": "shared",
      "allowedCardSetIds": ["standard_52_deck"],
      "visibility": "public"
    },
    {
      "id": "player-deck",
      "name": "Your Deck",
      "scope": "perPlayer",
      "allowedCardSetIds": ["standard_52_deck"],
      "visibility": "ownerOnly"
    },
    {
      "id": "won-pile",
      "name": "Won Cards",
      "scope": "perPlayer",
      "allowedCardSetIds": ["standard_52_deck"],
      "visibility": "public"
    }
  ]
}
```

In that example:

- `standard_52_deck` defines the cards
- `main-deck` and `battle-zone` are shared zones
- `player-deck` and `won-pile` are per-player zones

## Related Reducer Helpers

```ts
import {
  getPlayerZoneCards,
  getSharedZoneCards,
  moveCardBetweenPlayerZones,
  moveCardBetweenSharedZones,
  moveCardFromPlayerZoneToSharedZone,
  moveCardFromSharedZoneToPlayerZone,
} from "@dreamboard/app-sdk/reducer";
```

## Rule Of Thumb

- shared container: zone with `scope: "shared"`
- one copy per player: zone with `scope: "perPlayer"`
- card blueprint: `cardSet`
