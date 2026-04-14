# Manifest Authoring Guide

Use this guide when editing `manifest.json`.

`manifest.json` describes the runtime shape of the game:

- who can play
- what cards, resources, dice, and boards exist
- what actions players can submit
- what phases and stored state the engine needs

Keep the full game explanation in `rule.md`. Use the manifest to turn that explanation into typed runtime data.

After editing the manifest, run `dreamboard update` to regenerate scaffolded files such as `shared/manifest.ts` and `app/phases/`.

If you are still deciding whether something is a hand, a deck, or a card set, read [hands-vs-decks.md](hands-vs-decks.md) alongside this guide.

## Supported Top-Level Shape

```json
{
  "playerConfig": { ... },
  "cardSets": [ ... ],
  "playerHandDefinitions": [ ... ],
  "decks": [ ... ],
  "dice": [ ... ],
  "resources": [ ... ],
  "boardDefinitions": [ ... ],
  "availableActions": [ ... ],
  "stateMachine": { ... },
  "variableSchema": { ... }
}
```

| Field                   | Required | Purpose                                      |
| ----------------------- | -------- | -------------------------------------------- |
| `playerConfig`          | ✅       | Supported player counts                      |
| `cardSets`              | ✅       | Card blueprints and card property schemas    |
| `playerHandDefinitions` | ✅       | Per-player card containers                   |
| `decks`                 | ❌       | Shared card containers                       |
| `dice`                  | ❌       | Shared dice                                  |
| `resources`             | ❌       | Typed resource economy                       |
| `boardDefinitions`      | ❌       | Structured boards such as hex, square, track |
| `availableActions`      | ✅       | Player-submittable actions                   |
| `stateMachine`          | ✅       | Game phases and transitions                  |
| `variableSchema`        | ✅       | Global and per-player stored state           |

## Authoring Rules

- Only use documented schema fields. If a key is not described in this guide, do not invent it in `manifest.json`.
- Optional list fields should be omitted or set to `[]`. Do not use `null`.
- Keep the manifest about runtime structure. Put presentation choices in UI code or `shared/ui-args.ts`.
- There is no top-level `version` field in the manifest schema.
- A deck entry is structural data only. Use `id`, `name`, and `cardSetId`.

## Recommended Authoring Order

1. Start from `rule.md`.
2. Define the game's containers and content: players, card sets, hands, decks, resources, dice, and boards.
3. Define the actions players can submit.
4. Define the phase flow in `stateMachine`.
5. Add only the stored state that cannot be derived from the rest of the game state.

## 1. `playerConfig`

Use `playerConfig` to declare the supported player counts.

```json
{
  "playerConfig": {
    "minPlayers": 2,
    "maxPlayers": 4,
    "optimalPlayers": 4
  }
}
```

## 2. `cardSets`

`cardSets` define the cards that exist in the game. They do not describe where those cards live during play.

There are two card set styles:

- `preset` for built-in sets such as a standard 52-card deck
- `manual` for authored card content and custom card schemas

### Preset card set

```json
{
  "cardSets": [
    {
      "type": "preset",
      "id": "standard_52_deck",
      "name": "Standard 52-Card Deck"
    }
  ]
}
```

### Manual card set

```json
{
  "type": "manual",
  "id": "resource-cards",
  "name": "Resource Cards",
  "cardSchema": {
    "properties": {
      "value": { "type": "integer", "description": "Point value" },
      "category": { "type": "string", "description": "Resource category" }
    }
  },
  "cards": [
    {
      "type": "lumber",
      "name": "Lumber",
      "count": 4,
      "properties": { "value": "1", "category": "wood" }
    }
  ]
}
```

Card authoring reminders:

- `type` is the manifest-level card type.
- `count` is the number of copies to create.
- runtime card IDs are derived from `type` and `count` (`lumber`, `lumber-2`, `lumber-3`, ...)
- `properties` must match `cardSchema`
- `name` and `text` are worth keeping because they help scaffolding, debugging, and agent reasoning

## 3. `playerHandDefinitions`

Each `playerHandDefinition` creates one container per player.

Use a hand for anything each player owns separately, even if the tabletop rules call it a "deck", "reserve", or "scored pile".

```json
{
  "playerHandDefinitions": [
    {
      "id": "main-hand",
      "displayName": "Hand",
      "visibility": "ownerOnly",
      "maxCards": 7,
      "cardSetIds": ["standard_52_deck"]
    }
  ]
}
```

| Field         | Required | Purpose                                         |
| ------------- | -------- | ----------------------------------------------- |
| `id`          | ✅       | Stable hand ID (`HandId`)                       |
| `displayName` | ✅       | Human-readable name                             |
| `visibility`  | ❌       | `ownerOnly`, `public`, or `hidden`              |
| `maxCards`    | ❌       | Maximum allowed card count                      |
| `minCards`    | ❌       | Minimum required card count                     |
| `cardSetIds`  | ❌       | Allowed card sets; omit for any compatible card |
| `description` | ❌       | Explanation for authors and tools               |

## 4. `decks`

`decks` are shared card containers.

Use a deck for any card location the whole table shares: a draw pile, discard pile, market row, trick area, or communal play area.

```json
{
  "decks": [
    {
      "id": "draw-pile",
      "name": "Draw Pile",
      "cardSetId": "standard_52_deck"
    },
    {
      "id": "discard-pile",
      "name": "Discard Pile",
      "cardSetId": "standard_52_deck"
    }
  ]
}
```

| Field       | Required | Purpose                               |
| ----------- | -------- | ------------------------------------- |
| `id`        | ✅       | Stable deck ID (`DeckId`)             |
| `name`      | ✅       | Human-readable name                   |
| `cardSetId` | ✅       | Card set used by this shared container |

## 5. `dice`, `resources`, and `boardDefinitions`

Add these sections only if the game needs them.

- `dice` define shared dice such as `d6` or custom dice.
- `resources` define typed player economies such as coins, food, or energy.
- `boardDefinitions` define structured boards such as hex maps, square grids, tracks, or networks.

Example:

```json
{
  "dice": [{ "id": "d6", "name": "Six-Sided Die", "sides": 6 }],
  "resources": [{ "id": "coins", "displayName": "Coins" }]
}
```

## 6. `availableActions`

Actions describe what players may submit to the engine.

Think of actions as structured intent, not UI clicks. The UI gathers selections, then submits those values through action parameters.

```json
{
  "availableActions": [
    {
      "actionType": "playCard",
      "displayName": "Play Card",
      "description": "Play the selected card",
      "parameters": [
        {
          "name": "cardId",
          "type": "cardId",
          "required": true,
          "cardSetId": "standard_52_deck"
        }
      ],
      "errorCodes": ["NOT_YOUR_TURN", "INVALID_CARD"]
    }
  ]
}
```

Action authoring reminders:

- use stable, readable IDs
- use `cardSetId` when a `cardId` or `cardType` parameter should be limited to one card set
- use `array: true` with `minLength` and `maxLength` when an action takes multiple values

## 7. `stateMachine`

`stateMachine` defines the phase flow of the game.

Use it to name phases, describe who can act, and define how the game moves from one phase to the next.

State types:

- `AUTO`: engine-driven phase
- `SINGLE_PLAYER`: one active player acts
- `ALL_PLAYERS`: multiple players may act in parallel

```json
{
  "stateMachine": {
    "initialState": "dealCards",
    "states": [
      {
        "name": "dealCards",
        "type": "AUTO",
        "description": "Shuffle and deal cards.",
        "transitions": [{ "targetState": "playTurn" }]
      },
      {
        "name": "playTurn",
        "type": "SINGLE_PLAYER",
        "description": "Active player plays a card.",
        "availableActions": ["playCard"],
        "transitions": [{ "targetState": "playTurn" }]
      }
    ]
  }
}
```

## 8. `variableSchema`

`variableSchema` is for state that must be stored explicitly.

Keep it small. If something can be derived from card locations, resources, board state, or the current phase, it usually does not belong here.

Good candidates:

- running scores across rounds
- round number, trump suit, current bid
- flags that affect future legal moves

Avoid storing:

- counts that can be derived from hands or decks
- phase flow already represented by `stateMachine`
- duplicated resource totals

```json
{
  "variableSchema": {
    "globalVariableSchema": {
      "properties": {
        "roundNumber": { "type": "integer", "description": "Current round" }
      }
    },
    "playerVariableSchema": {
      "properties": {
        "score": {
          "type": "integer",
          "description": "Accumulated score"
        }
      }
    }
  }
}
```

## Final Checklist

Before running `dreamboard update`, check that:

- every referenced `cardSetId`, `handId`, `deckId`, resource ID, board ID, and action name exists
- the manifest only uses documented schema fields
- `variableSchema` stores only non-derivable state
- optional list fields are omitted or `[]`, not `null`

Then run:

```bash
dreamboard update
```
