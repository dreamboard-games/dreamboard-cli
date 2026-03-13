# Manifest Authoring Guide

`manifest.json` is the source of truth for your game's structure — components, actions, state machine, and variables. After editing, run `dreamboard update` to regenerate scaffolded files (`app/phases/`, `shared/manifest.d.ts`, etc.).

## Top-Level Structure

```json
{
  "version": "1.0.0",
  "playerConfig": { ... },
  "deckDefinitions": [ ... ],
  "playerHandDefinitions": [ ... ],
  "components": [ ... ],
  "resources": [ ... ],
  "boardDefinitions": [ ... ],
  "availableActions": [ ... ],
  "stateMachine": { ... },
  "variableSchema": { ... }
}
```

| Field                   | Required | Description                                        |
| ----------------------- | -------- | -------------------------------------------------- |
| `version`               | ✅       | Manifest version - increment manually when updated |
| `playerConfig`          | ✅       | Min/max/optimal player counts                      |
| `deckDefinitions`       | ✅       | Card deck blueprints (preset or manual)            |
| `playerHandDefinitions` | ✅       | Per-player card containers                         |
| `components`            | ✅       | Shared game components (decks, dice)               |
| `resources`             | ❌       | Typed resource economy (gold, wood)                |
| `boardDefinitions`      | ❌       | Spatial boards (hex, network, square, track)       |
| `availableActions`      | ✅       | Player submission buttons                          |
| `stateMachine`          | ✅       | Game phases and transitions                        |
| `variableSchema`        | ✅       | Minimal state for game logic                       |

---

## Authoring Sequence

Work through sections in this order. Skip any step that doesn't apply to your game.

### 1. `playerConfig`

```json
{
  "playerConfig": {
    "minPlayers": 2,
    "maxPlayers": 4,
    "optimalPlayers": 4
  }
}
```

| Field            | Type    | Range | Description                          |
| ---------------- | ------- | ----- | ------------------------------------ |
| `minPlayers`     | integer | 1–10  | Minimum players required             |
| `maxPlayers`     | integer | 1–10  | Maximum players supported            |
| `optimalPlayers` | integer | 1–10  | Best player count for the experience |

### 2. `deckDefinitions`

Deck definitions are blueprints for card types. There are two kinds:

#### Preset decks

Use `"standard_52_deck"` for standard playing cards. **Do NOT define 52 cards manually.**

```json
{
  "deckDefinitions": [
    {
      "type": "preset",
      "id": "standard_52_deck",
      "name": "Standard 52-Card Deck"
    }
  ]
}
```

#### Manual (custom) decks

Define your own cards with a `cardSchema` and a `cards` list.

```json
{
  "type": "manual",
  "id": "resource-deck",
  "name": "Resource Cards",
  "cardSchema": {
    "properties": {
      "value": { "type": "integer", "description": "Point value of the card" },
      "category": { "type": "string", "description": "Resource category" }
    }
  },
  "cards": [
    {
      "type": "lumber",
      "name": "Lumber",
      "count": 4,
      "properties": { "value": "1", "category": "wood" }
    },
    {
      "type": "brick",
      "name": "Brick",
      "count": 3,
      "properties": { "value": "2", "category": "stone" }
    }
  ]
}
```

**Card fields:**

| Field        | Required | Description                                                                              |
| ------------ | -------- | ---------------------------------------------------------------------------------------- |
| `type`       | ✅       | Card type ID. Runtime IDs are generated as `{type}-1`, `{type}-2`, etc. when `count > 1` |
| `name`       | ✅       | Display name                                                                             |
| `count`      | ✅       | Number of copies (≥ 1)                                                                   |
| `properties` | ✅       | Values matching `cardSchema` (all values are strings)                                    |
| `imageUrl`   | ❌       | Card image URL                                                                           |
| `text`       | ❌       | Text content on the card                                                                 |
| `cardType`   | ❌       | Optional category within the deck                                                        |

**Property schema types:** `string`, `integer`, `number`, `boolean`, `array`, `object`, `enum`, `deckId`, `cardId`, `playerId`

### 3. `playerHandDefinitions`

Per-player card containers. Each player gets their own instance automatically.

```json
{
  "playerHandDefinitions": [
    {
      "id": "main-hand",
      "displayName": "Hand",
      "visibility": "ownerOnly",
      "maxCards": 7,
      "deckDefinitionIds": ["standard_52_deck"]
    },
    {
      "id": "score-pile",
      "displayName": "Scored Cards",
      "visibility": "public"
    }
  ]
}
```

| Field               | Required | Default       | Description                                                 |
| ------------------- | -------- | ------------- | ----------------------------------------------------------- |
| `id`                | ✅       | —             | Unique hand ID (becomes `HandId` type)                      |
| `displayName`       | ✅       | —             | UI label                                                    |
| `visibility`        | ❌       | `"ownerOnly"` | `"ownerOnly"`, `"public"`, or `"hidden"`                    |
| `maxCards`          | ❌       | —             | Maximum cards allowed                                       |
| `minCards`          | ❌       | —             | Minimum cards required                                      |
| `deckDefinitionIds` | ❌       | —             | Restrict to cards from these deck definitions (empty = any) |
| `description`       | ❌       | —             | Purpose description                                         |

> **DECK vs HAND:** `DeckComponent` (in `components`) is **shared** — one instance per game (draw piles, discard piles, trick zones). `PlayerHandDefinition` is **per-player** — private hands, tableaus, collected cards.

### 4. `components` — Shared Decks

Deck components are shared game zones that reference a deck definition.

```json
{
  "components": [
    {
      "type": "deck",
      "id": "draw-pile",
      "name": "Draw Pile",
      "deckDefinitionId": "standard_52_deck",
      "layout": "stack"
    },
    {
      "type": "deck",
      "id": "discard-pile",
      "name": "Discard Pile",
      "deckDefinitionId": "standard_52_deck",
      "layout": "spread"
    }
  ]
}
```

| Field              | Required | Default   | Description                             |
| ------------------ | -------- | --------- | --------------------------------------- |
| `type`             | ✅       | —         | `"deck"`                                |
| `id`               | ✅       | —         | Unique component ID                     |
| `name`             | ✅       | —         | Display name                            |
| `deckDefinitionId` | ✅       | —         | Which deck definition this sources from |
| `layout`           | ❌       | `"stack"` | `"stack"`, `"spread"`, or `"fan"`       |

### 5. `components` — Dice

Add dice as components with `type: "die"`.

```json
{
  "type": "die",
  "id": "d6-die",
  "name": "Six-Sided Die",
  "sides": 6
}
```

| Field   | Required | Description                                   |
| ------- | -------- | --------------------------------------------- |
| `type`  | ✅       | `"die"`                                       |
| `id`    | ✅       | Unique die ID (e.g., `"d6-die"`, `"d20-die"`) |
| `name`  | ✅       | Display name                                  |
| `sides` | ✅       | Number of sides (≥ 2)                         |

### 6. `resources` (Optional)

Typed resource economy for games with currencies or materials. Resources have a dedicated API (`canAfford`, `deduct`, `add`, `transfer`).

```json
{
  "resources": [
    { "id": "gold", "name": "Gold" },
    { "id": "wood", "name": "Wood" },
    { "id": "victoryPoints", "name": "Victory Points" }
  ]
}
```

| Field  | Required | Description                                                        |
| ------ | -------- | ------------------------------------------------------------------ |
| `id`   | ✅       | Unique resource ID (alphanumeric + underscore, starts with letter) |
| `name` | ✅       | Display name                                                       |

> **Don't duplicate resources in `playerVariableSchema`.** Use the resource system instead.

### 7. `boardDefinitions` (Optional)

For games with spatial structure. Each board type has its own shape:

| Board Type | Use Case                              | Key Concepts                                                                                      |
| ---------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `hex`      | Hexagonal grids (Catan)               | Tiles (pre-defined with IDs/types), Edges `[TileId, TileId]`, Vertices `[TileId, TileId, TileId]` |
| `network`  | Graph maps (Ticket to Ride, Pandemic) | Nodes (locations using TileId), Edges `[TileId, TileId]`                                          |
| `square`   | Grid boards (Chess, Checkers)         | Cells derived from row/col (e.g., `"a1"` to `"h8"`), Pieces placed on cells                       |
| `track`    | Path boards (Monopoly, VP track)      | Sequential spaces with IDs, pieces on spaces                                                      |

### 8. `availableActions`

Actions are **submissions** (buttons), **NOT selections**. Card/tile selection happens via UI clicks — the action definition declares the parameters that carry the selected items in the POST request.

```json
{
  "availableActions": [
    {
      "actionType": "playCard",
      "displayName": "Play Card",
      "description": "Play the selected card from your hand",
      "parameters": [
        {
          "name": "cardId",
          "type": "cardId",
          "required": true,
          "array": false,
          "deckDefinitionId": "standard_52_deck"
        }
      ],
      "errorCodes": ["NOT_YOUR_TURN", "INVALID_CARD", "MUST_FOLLOW_SUIT"]
    },
    {
      "actionType": "pass",
      "displayName": "Pass",
      "parameters": [],
      "errorCodes": ["CANNOT_PASS"]
    },
    {
      "actionType": "discardCards",
      "displayName": "Discard",
      "parameters": [
        {
          "name": "cardIds",
          "type": "cardId",
          "required": true,
          "array": true,
          "minLength": 1,
          "maxLength": 3,
          "deckDefinitionId": "standard_52_deck"
        }
      ],
      "errorCodes": ["WRONG_COUNT", "CARD_NOT_IN_HAND"]
    }
  ]
}
```

**ActionDefinition fields:**

| Field         | Required | Description                                                               |
| ------------- | -------- | ------------------------------------------------------------------------- |
| `actionType`  | ✅       | Unique ID in camelCase (e.g., `"playCard"`, `"rollDice"`)                 |
| `displayName` | ✅       | Button label                                                              |
| `description` | ❌       | Help text                                                                 |
| `parameters`  | ✅       | List of parameters (can be empty for parameterless actions like `"pass"`) |
| `errorCodes`  | ❌       | Possible validation error codes                                           |

**ActionParameterDefinition fields:**

| Field              | Required | Default | Description                                           |
| ------------------ | -------- | ------- | ----------------------------------------------------- |
| `name`             | ✅       | —       | Parameter name                                        |
| `type`             | ✅       | —       | See parameter types below                             |
| `required`         | ❌       | `true`  | Whether required                                      |
| `array`            | ❌       | `false` | Set `true` when multiple values can be sent           |
| `minLength`        | ❌       | —       | Min items (only when `array: true`)                   |
| `maxLength`        | ❌       | —       | Max items (only when `array: true`)                   |
| `deckDefinitionId` | ❌       | —       | Links `"cardId"` params to a specific deck definition |
| `description`      | ❌       | —       | Help text                                             |

**Parameter types:**

| Type           | Description                                                 |
| -------------- | ----------------------------------------------------------- |
| `"cardId"`     | Runtime card instance ID (e.g., `"lumber-1"`, `"lumber-2"`) |
| `"cardType"`   | Manifest-level card type identifier (e.g., `"lumber"`)      |
| `"deckId"`     | Deck component ID                                           |
| `"playerId"`   | Player ID                                                   |
| `"string"`     | Free-form string                                            |
| `"number"`     | Numeric value                                               |
| `"boolean"`    | Boolean value                                               |
| `"tileId"`     | Hex tile or network node ID                                 |
| `"edgeId"`     | Edge between tiles/nodes                                    |
| `"vertexId"`   | Vertex between tiles                                        |
| `"spaceId"`    | Track board space ID                                        |
| `"pieceId"`    | Board piece ID                                              |
| `"zoneId"`     | Zone ID                                                     |
| `"tokenId"`    | Token ID                                                    |
| `"resourceId"` | Resource ID                                                 |

**Key rules:**

- **NO `"selectCard"` actions.** UI clicks are not actions.
- If an action involves cards, **always include a `cardId` parameter** with the correct `deckDefinitionId`. Use `array: true` when multiple cards can be sent.
- Never use placeholder string params or empty parameter lists when the action consumes card data.
- Use `"cardId"` for specific card instances, `"cardType"` for card categories.
- Use camelCase for `actionType` names.
- Always use the specific type (e.g. deckId, cardId, playerId, etc) to narrow the parameter type instead of string where appropriate.

### 9. `stateMachine`

Define game phases and transitions.

```json
{
  "stateMachine": {
    "initialState": "dealCards",
    "states": [
      {
        "name": "dealCards",
        "type": "AUTO",
        "description": "Shuffle the deck and deal 7 cards to each player.",
        "transitions": [{ "targetState": "playCard" }],
        "autoAdvance": true
      },
      {
        "name": "playCard",
        "type": "SINGLE_PLAYER",
        "description": "Active player must play a valid card or draw from the pile.",
        "availableActions": ["playCard", "drawCard"],
        "transitions": [
          { "targetState": "playCard", "description": "Next player's turn" },
          {
            "targetState": "gameOver",
            "description": "Player has no cards left"
          }
        ],
        "autoAdvance": true
      },
      {
        "name": "gameOver",
        "type": "AUTO",
        "description": "Calculate final scores and determine the winner.",
        "transitions": []
      }
    ]
  }
}
```

**State types:**

| Type            | Description                                                 | Example                                     |
| --------------- | ----------------------------------------------------------- | ------------------------------------------- |
| `SINGLE_PLAYER` | Engine waits for **one** player to act, then auto-advances  | Chess turns, Poker betting                  |
| `ALL_PLAYERS`   | Engine waits for **all** players to submit before advancing | Rock-Paper-Scissors, 7 Wonders card passing |
| `AUTO`          | No player interaction — executes immediately                | Dealing, scoring, state checks              |

**StateDefinition fields:**

| Field              | Required | Default | Description                                                                     |
| ------------------ | -------- | ------- | ------------------------------------------------------------------------------- |
| `name`             | ✅       | —       | Unique state name in camelCase (use verbNoun format: `dealCards`, `playTurn`)   |
| `type`             | ✅       | —       | `AUTO`, `SINGLE_PLAYER`, or `ALL_PLAYERS`                                       |
| `description`      | ✅       | —       | Full logic description — what happens, what players can do                      |
| `availableActions` | ❌       | —       | Action types available in this state (only for `SINGLE_PLAYER` / `ALL_PLAYERS`) |
| `transitions`      | ✅       | —       | List of possible next states                                                    |
| `autoAdvance`      | ❌       | `true`  | Whether to auto-advance when complete                                           |

**StateTransition fields:**

| Field         | Required | Description                     |
| ------------- | -------- | ------------------------------- |
| `targetState` | ✅       | Name of the next state          |
| `description` | ❌       | When/why this transition occurs |

### 10. `variableSchema`

Minimal state for game logic. Split into global (shared) and per-player variables.

```json
{
  "variableSchema": {
    "globalVariableSchema": {
      "properties": {
        "currentRound": {
          "type": "integer",
          "description": "Current round number"
        },
        "trumpSuit": { "type": "string", "description": "Current trump suit" }
      }
    },
    "playerVariableSchema": {
      "properties": {
        "score": { "type": "integer", "description": "Player's current score" },
        "hasPassed": {
          "type": "boolean",
          "description": "Whether player has passed this round"
        }
      }
    }
  }
}
```

**Rules for variables:**

- **MINIMIZE state.** Only include what's needed for rules and logic.
- ✅ **Include:** scores, flags (`hasPassed`), logic blockers (`lastPlayedCards`), trump suit, round counters
- ❌ **Exclude:** derivable data (hand sizes, deck sizes, current player — the engine tracks these)
- ❌ **Don't duplicate resources** — use the `resources` section instead of player variables for economies
- Use `globalVariableSchema` for shared/global state (turn counter, current round)
- Use `playerVariableSchema` for per-player state (scores, flags)

**Property types:** `string`, `integer`, `number`, `boolean`, `array` (with `items`), `object` (with `properties`), `enum` (with `enums` list), `deckId`, `cardId`, `playerId`

---

## ID Naming Conventions

- Use **human-readable, kebab-case IDs** for components and hands: `"draw-pile"`, `"main-hand"`, `"d6-die"`
- Use **camelCase** for state names and action types: `"dealCards"`, `"playCard"`, `"rollDice"`
- Use **camelCase** for variable names: `"currentRound"`, `"hasPassed"`, `"trumpSuit"`
- Resource IDs: alphanumeric + underscore, starting with a letter: `"gold"`, `"victoryPoints"`

---

## Minimal Example

A simple draw-and-play card game for 2–4 players:

```json
{
  "version": "1.0.0",
  "playerConfig": {
    "minPlayers": 2,
    "maxPlayers": 4,
    "optimalPlayers": 3
  },
  "deckDefinitions": [
    {
      "type": "preset",
      "id": "standard_52_deck",
      "name": "Standard 52-Card Deck"
    }
  ],
  "playerHandDefinitions": [
    {
      "id": "main-hand",
      "displayName": "Hand",
      "visibility": "ownerOnly",
      "maxCards": 7,
      "deckDefinitionIds": ["standard_52_deck"]
    }
  ],
  "components": [
    {
      "type": "deck",
      "id": "draw-pile",
      "name": "Draw Pile",
      "deckDefinitionId": "standard_52_deck",
      "layout": "stack"
    },
    {
      "type": "deck",
      "id": "discard-pile",
      "name": "Discard Pile",
      "deckDefinitionId": "standard_52_deck",
      "layout": "spread"
    }
  ],
  "availableActions": [
    {
      "actionType": "playCard",
      "displayName": "Play Card",
      "description": "Play a card from your hand to the discard pile",
      "parameters": [
        {
          "name": "cardId",
          "type": "cardId",
          "required": true,
          "deckDefinitionId": "standard_52_deck"
        }
      ],
      "errorCodes": ["NOT_YOUR_TURN", "INVALID_PLAY"]
    },
    {
      "actionType": "drawCard",
      "displayName": "Draw Card",
      "description": "Draw a card from the draw pile",
      "parameters": [],
      "errorCodes": ["HAND_FULL", "DECK_EMPTY"]
    }
  ],
  "stateMachine": {
    "initialState": "dealCards",
    "states": [
      {
        "name": "dealCards",
        "type": "AUTO",
        "description": "Shuffle the deck and deal 5 cards to each player. Place remaining cards face-down as the draw pile. Flip the top card to start the discard pile.",
        "transitions": [{ "targetState": "playTurn" }]
      },
      {
        "name": "playTurn",
        "type": "SINGLE_PLAYER",
        "description": "Active player must play a matching card from their hand or draw from the draw pile. A card matches if it shares the same suit or rank as the top discard.",
        "availableActions": ["playCard", "drawCard"],
        "transitions": [
          { "targetState": "playTurn", "description": "Next player's turn" },
          {
            "targetState": "endRound",
            "description": "Player empties their hand"
          }
        ]
      },
      {
        "name": "endRound",
        "type": "AUTO",
        "description": "The player who emptied their hand wins. Calculate scores based on cards remaining in other players' hands.",
        "transitions": []
      }
    ]
  },
  "variableSchema": {
    "globalVariableSchema": {
      "properties": {}
    },
    "playerVariableSchema": {
      "properties": {
        "score": {
          "type": "integer",
          "description": "Accumulated score across rounds"
        }
      }
    }
  }
}
```

---

## After Editing

Run `dreamboard update` to push the manifest and regenerate scaffolded files:

```bash
dreamboard update
```

This regenerates:

- `app/phases/` — One handler file per state in the state machine
- `shared/manifest.d.ts` — TypeScript type definitions derived from the manifest
- Action handler stubs and variable type definitions
