# Reducer

Reference for authoring Dreamboard reducer-native games with @dreamboard/app-sdk/reducer.

`@dreamboard/app-sdk/reducer` is Dreamboard's reducer-native authoring surface that enforces game logic.
Use it to define state schemas, phases, actions, prompts, views and setup profiles.

## Package boundary

Use the reducer framework for:

- manifest-backed reducer state schemas
- phase flow and player action handling
- prompts, continuations, and reducer-owned windows
- player-facing view projection
- setup bootstrap steps

## Purity

Reducer is pure-function that takes game state as input and produces a deterministic output.

`enter(...)`, `validate(...)`, `reduce(...)`, prompt continuations, and system
handlers should derive results only from input plus reducer state.
Do not call ambient sources of nondeterminism such as:

- `Math.random()`
- `Date.now()`
- network I/O
- filesystem I/O
- mutable process-global state

When gameplay needs side effects, queue them through the `fx` helper and let
the runtime execute them. This keeps reducer behavior replayable, testable,
and compatible with seeded runtime state.

`fx.*` calls return runtime effect descriptors, not direct imperative APIs.
Reducer callbacks emit them, and the reducer bundle/runtime interprets them
after the pure reducer step completes.

## Import surface

Import reducer helpers from `@dreamboard/app-sdk/reducer`.

```ts
import {
  createReducerBundle,
  createReducerOps,
  createStateQueries,
  createTableQueries,
  defineAction,
  defineChoiceFlow,
  defineChoicePrompt,
  defineContinuation,
  defineGame,
  defineGameContract,
  definePhase,
  definePrompt,
  definePromptFlow,
  definePromptContinuation,
  defineView,
  defineWindowContinuation,
  pipe,
} from "@dreamboard/app-sdk/reducer";
```

Reducer state is always written through the curried `ops.*` namespace returned
by `createReducerOps<GameState>()` and composed with `pipe(state, ...ops)`.
State is read through `createStateQueries(state)` (or `createTableQueries(state.table)`).
The older flat writer helpers (for example `setActivePlayers(state, ...)` or
`moveCardFromPlayerZoneToSharedZone({ ... })`) have been removed from the
public surface; use `ops.*` in their place.

`@dreamboard/app-sdk` currently re-exports the same surface, but
`@dreamboard/app-sdk/reducer` is the explicit reducer import path.

## `defineGameContract(...)`

`defineGameContract(...)` binds the generated manifest contract to the reducer's
shared, per-player, and hidden state schemas.

| Field           | Required | Notes                                                       |
| --------------- | -------- | ----------------------------------------------------------- |
| `manifest`      | Yes      | Generated manifest contract from `shared/manifest-contract` |
| `state.public`  | Yes      | Shared state visible to every player                        |
| `state.private` | Yes      | Per-player server-only state                                |
| `state.hidden`  | Yes      | Reducer-only state that never reaches clients               |

```ts
import { z } from "zod";
import { defineGameContract } from "@dreamboard/app-sdk/reducer";
import { manifestContract, ids } from "../shared/manifest-contract";

export const gameContract = defineGameContract({
  manifest: manifestContract,
  state: {
    public: z.object({
      currentJudgeId: ids.playerId,
      winnerPlayerId: ids.playerId.nullable(),
    }),
    private: z.object({
      secretNotes: z.array(z.string()),
    }),
    hidden: z.object({
      seededRoundId: z.string(),
    }),
  },
});
```

## Generated `shared/manifest-contract`

The generated `shared/manifest-contract` module exports more than the
`manifestContract` object you pass into `defineGameContract(...)`.

| Export                       | Use                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `manifestContract`           | Reducer-facing manifest contract passed into `defineGameContract(...)`            |
| `ids`                        | Zod literal schemas such as `ids.playerId`, `ids.boardId`, and `ids.spaceId`      |
| `literals`                   | Const arrays and lookup records for authored IDs and categories                   |
| `records`                    | Typed record builders for manifest-backed ID families                             |
| `idGuards`                   | Manifest-wide `is*` / `expect*` helpers for generated IDs                         |
| `defaults`                   | Lazy helpers for manifest-backed empty table state                                |
| `createInitialTable(...)`    | Full manifest-backed startup table for authored players and shuffled shared decks |
| `schemas`                    | Generated `table` and `runtime` Zod schemas                                       |
| `createGameStateSchema(...)` | Builds a full reducer runtime schema around your phase and state schemas          |
| `setupProfiles(...)`         | Manifest-bound builder for `app/setup-profiles.ts`                                |
| `boardHelpers`               | Callable helpers for board IDs, layouts, spaces, containers, edges, and vertices  |

### `defaults`

Use `createInitialTable(...)` when you need a full startup table that matches
the generated runtime contract. Use `defaults` when you only need one empty
manifest-shaped slice outside the reducer bundle.

| Helper                           | Returns                                                                     |
| -------------------------------- | --------------------------------------------------------------------------- |
| `defaults.zones(playerIds?)`     | Empty shared/per-player zone state, visibility, and allowed card-set lookup |
| `defaults.decks()`               | Empty shared deck contents                                                  |
| `defaults.hands(playerIds?)`     | Empty per-player hand contents                                              |
| `defaults.handVisibility()`      | Zone visibility map for player hands                                        |
| `defaults.ownerOfCard()`         | Default card ownership map                                                  |
| `defaults.visibility()`          | Default card visibility map                                                 |
| `defaults.resources(playerIds?)` | Zeroed per-player resource balances                                         |

Pass `playerIds` when you want to seed only a subset of manifest players.
Omit it to use all authored player IDs.

```ts
import {
  boardHelpers,
  createInitialTable,
  defaults,
  idGuards,
  records,
  type BoardFields,
  type BoardSpaceFields,
  type BoardState,
  type DieFieldsByTypeId,
  type PieceFieldsByTypeId,
} from "../shared/manifest-contract";

const initialTable = createInitialTable({
  playerIds: ["player-1", "player-2"],
});
const initialZones = defaults.zones(["player-1", "player-2"]);
const initialHands = defaults.hands(["player-1", "player-2"]);
const initialResources = defaults.resources(["player-1", "player-2"]);
const initialScores = records.playerIds(0);

type MainBoardState = BoardState<"main-board">;
type MainBoardFields = BoardFields<"main-board">;
type MainBoardSpaceFields = BoardSpaceFields<"main-board">;
type WorkerFields = PieceFieldsByTypeId["worker"];
type D6Fields = DieFieldsByTypeId["d6"];

const harborEdgeIds = boardHelpers.edgeIds("main-board", "harbor");
const spaceKinds = boardHelpers.spaceKinds("main-board");
const edgeOwnerById = records.edgeIds<string | null>(null);
const checkpointStateById = boardHelpers.vertexRecord("main-board", false);
const maybeSpaceId = "dock-1";

if (boardHelpers.isSpaceId("main-board", maybeSpaceId)) {
  void maybeSpaceId;
}

const ensuredHarborEdgeId = boardHelpers.expectEdgeId(
  "main-board",
  harborEdgeIds[0]!,
);
const widenedEdgeId: string = ensuredHarborEdgeId;

if (idGuards.isEdgeId(widenedEdgeId)) {
  void widenedEdgeId;
}
```

### Recommended board aliases

Generated manifest contracts expose singular aliases that let reducer code jump
straight to the board-scoped state or field shape it needs.

| Type                                                               | Resolves to                                |
| ------------------------------------------------------------------ | ------------------------------------------ |
| `BoardState<"board-id">`                                           | Concrete runtime board state record        |
| `BoardFields<"board-id">`                                          | That board's `fields` shape                |
| `BoardSpaceState<"board-id">`                                      | Union of space state records on that board |
| `BoardSpaceFields<"board-id">`                                     | Space `fields` shape for that board        |
| `BoardRelationState<"board-id">`                                   | Relation state record for that board       |
| `BoardRelationFields<"board-id">`                                  | Relation `fields` shape for that board     |
| `BoardContainerState<"board-id">`                                  | Container state record for that board      |
| `BoardContainerFields<"board-id">`                                 | Container `fields` shape for that board    |
| `HexEdgeState<"board-id">` / `HexEdgeFields<"board-id">`           | Hex edge record or fields shape            |
| `HexVertexState<"board-id">` / `HexVertexFields<"board-id">`       | Hex vertex record or fields shape          |
| `SquareEdgeState<"board-id">` / `SquareEdgeFields<"board-id">`     | Square edge record or fields shape         |
| `SquareVertexState<"board-id">` / `SquareVertexFields<"board-id">` | Square vertex record or fields shape       |
| `TiledEdgeState<"board-id">` / `TiledEdgeFields<"board-id">`       | Tiled edge record or fields shape          |
| `TiledVertexState<"board-id">` / `TiledVertexFields<"board-id">`   | Tiled vertex record or fields shape        |

Use these aliases first when reducer code already knows the runtime `boardId`.

### Low-level field maps

Generated manifest contracts also export the underlying board-ID keyed maps.
These are mostly useful when you are building higher-order helpers.

| Type                            | Maps                                                          |
| ------------------------------- | ------------------------------------------------------------- |
| `BoardFieldsByBoardId`          | Runtime board ID -> board `fields` shape                      |
| `BoardSpaceFieldsByBoardId`     | Runtime board ID -> board-scoped space `fields` shape         |
| `BoardRelationFieldsByBoardId`  | Runtime board ID -> board-scoped relation `fields` shape      |
| `BoardContainerFieldsByBoardId` | Runtime board ID -> board-scoped container `fields` shape     |
| `HexEdgeFieldsByBoardId`        | Runtime hex board ID -> board-scoped edge `fields` shape      |
| `HexVertexFieldsByBoardId`      | Runtime hex board ID -> board-scoped vertex `fields` shape    |
| `SquareEdgeFieldsByBoardId`     | Runtime square board ID -> board-scoped edge `fields` shape   |
| `SquareVertexFieldsByBoardId`   | Runtime square board ID -> board-scoped vertex `fields` shape |
| `TiledEdgeFieldsByBoardId`      | Runtime tiled board ID -> board-scoped edge `fields` shape    |
| `TiledVertexFieldsByBoardId`    | Runtime tiled board ID -> board-scoped vertex `fields` shape  |
| `PieceFieldsByTypeId`           | Piece type ID -> piece `properties` shape                     |
| `DieFieldsByTypeId`             | Die type ID -> die `properties` shape                         |

There is intentionally no global `SpaceFieldsBySpaceId` helper. Runtime
`spaceId`s are not globally unique for per-player boards, so field helpers stay
scoped by runtime `boardId`.

### `boardHelpers`

`boardHelpers` exposes callable helpers instead of raw lookup tables.

| Helper                                    | Notes                                                             |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `boardIdsForLayout(layout)`               | Layout -> runtime board IDs                                       |
| `boardBaseIdsForLayout(layout)`           | Layout -> authored base board IDs                                 |
| `boardIdsForBase(boardBaseId)`            | Expands one authored base board ID into runtime board IDs         |
| `boardBaseIdsForTemplate(templateId)`     | Template ID -> authored base board IDs                            |
| `boardIdsForType(typeId)`                 | Reducer-facing board `typeId` -> runtime board IDs                |
| `boardLayout(boardId)`                    | Runtime board ID -> `generic`, `hex`, or `square`                 |
| `boardTemplateLayout(templateId)`         | Template ID -> layout                                             |
| `spaceIds(boardId)`                       | Runtime board ID -> all space IDs on that board                   |
| `spaceRecord(boardId, initial)`           | Runtime board ID -> exact `Record<SpaceId, Value>`                |
| `isSpaceId(boardId, value)`               | Narrows a widened string to that board's exact space IDs          |
| `expectSpaceId(boardId, value)`           | Returns the exact board-scoped space ID or throws                 |
| `spaceKinds(boardId)`                     | Runtime board ID -> space ID -> authored `spaceTypeId` or `null`  |
| `spaceIdsForType(typeId)`                 | Space `typeId` -> matching space IDs                              |
| `containerIds(boardId)`                   | Runtime board ID -> board container IDs                           |
| `containerRecord(boardId, initial)`       | Runtime board ID -> exact `Record<ContainerId, Value>`            |
| `isContainerId(boardId, value)`           | Narrows a widened string to that board's container IDs            |
| `expectContainerId(boardId, value)`       | Returns the exact board-scoped container ID or throws             |
| `containerHost(boardId, containerId)`     | Runtime board/container -> authored board or space host literal   |
| `relationTypeIds(boardId)`                | Runtime board ID -> relation `typeId`s                            |
| `relationTypeRecord(boardId, initial)`    | Runtime board ID -> exact `Record<RelationTypeId, Value>`         |
| `isRelationTypeId(boardId, value)`        | Narrows a widened string to that board's relation type IDs        |
| `expectRelationTypeId(boardId, value)`    | Returns the exact board-scoped relation type ID or throws         |
| `edgeIdsForType(typeId)`                  | Tiled edge `typeId` -> edge IDs across boards                     |
| `edgeRecord(boardId, initial)`            | Runtime board ID -> exact `Record<EdgeId, Value>`                 |
| `isEdgeId(boardId, value)`                | Narrows a widened string to that board's exact edge IDs           |
| `expectEdgeId(boardId, value)`            | Returns the exact board-scoped edge ID or throws                  |
| `edgeIds(boardId, typeId)`                | Runtime board + edge `typeId` -> matching edge IDs                |
| `vertexIdsForType(typeId)`                | Tiled vertex `typeId` -> vertex IDs across boards                 |
| `vertexRecord(boardId, initial)`          | Runtime board ID -> exact `Record<VertexId, Value>`               |
| `isVertexId(boardId, value)`              | Narrows a widened string to that board's exact vertex IDs         |
| `expectVertexId(boardId, value)`          | Returns the exact board-scoped vertex ID or throws                |
| `vertexIds(boardId, typeId)`              | Runtime board + vertex `typeId` -> matching vertex IDs            |
| `boardIdForPlayer(boardBaseId, playerId)` | Per-player authored board base ID + player ID -> runtime board ID |

Use `records` and `boardHelpers.*Record(...)` instead of hand-written
`Object.fromEntries(...)` when you need exact literal-keyed reducer maps:

```ts
import { boardHelpers, records } from "../shared/manifest-contract";

const scoreByPlayerId = records.playerIds(0);
const edgeOwnerById = boardHelpers.edgeRecord(
  "frontier-map",
  null as string | null,
);
const vertexBlockedById = boardHelpers.vertexRecord("frontier-map", false);
```

Use `idGuards` or board-scoped `boardHelpers.is*` / `expect*` helpers when a
string widened before you index a reducer-native lookup or dispatch an action:

```ts
import { boardHelpers, idGuards } from "../shared/manifest-contract";

const maybeSpaceId = input.spaceId;

if (boardHelpers.isSpaceId("market-board", maybeSpaceId)) {
  const exactSpaceId = maybeSpaceId;
  void exactSpaceId;
}

const exactEdgeId = boardHelpers.expectEdgeId("frontier-map", input.edgeId);
const maybeGlobalEdgeId: string = exactEdgeId;

if (idGuards.isEdgeId(maybeGlobalEdgeId)) {
  void maybeGlobalEdgeId;
}
```

### Keep manifest IDs typed

When a value comes from your manifest, keep it typed as that manifest ID family
in reducer schemas. Use generated `ids.*` schemas for player, board, space,
edge, vertex, card, deck, hand, and other manifest-backed IDs.

Do not default to `z.string()` for manifest-owned IDs in public state, action
params, prompt data, or continuation data. Widening those values to `string`
forces reducer code into `as any`, breaks `createTableQueries(...)` inference,
and makes `ops.*` writers such as `ops.setActivePlayers(...)` or
`ops.moveCardFromPlayerZoneToSharedZone(...)` reject otherwise valid inputs.

```ts
import { z } from "zod";
import { ids } from "../shared/manifest-contract";

const publicState = z.object({
  currentPlayerId: ids.playerId,
  legalEdgeIds: z.array(ids.edgeId).default([]),
  ownershipBySpaceId: z.partialRecord(ids.spaceId, ids.playerId).default({}),
});

const placeRoad = defineAction<GameContract>()({
  params: z.object({
    edgeId: ids.edgeId,
  }),
  reduce({ state, input, accept }) {
    return accept(state);
  },
});
```

If a runtime value already widened before it reaches reducer code, recover the
exact ID with `boardHelpers.expect*` or `idGuards.is*` before you query or
dispatch with it.

### Preferred table reads

Bind one query object per reducer read and use its namespaces for board, zone,
card, player, and component lookups.

```ts
import { createStateQueries } from "@dreamboard/app-sdk/reducer";

function projectBoard(state: GameState) {
  const q = createStateQueries(state);
  const board = q.board.tiled("arena");

  return {
    boardId: board.id,
    layout: board.layout,
    spaces: Object.values(board.spaces).map((space) => ({
      ...space,
      ownerId: state.publicState.ownershipBySpaceId[space.id] ?? null,
      edgeIds: q.board.spaceEdges(board.id, space.id),
      vertexIds: q.board.spaceVertices(board.id, space.id),
    })),
  };
}
```

When the UI uses `HexGrid` or `SquareGrid`, prefer projecting the generated
board record whole instead of remapping it into a custom `tiles` or `cells`
shape:

```ts
function projectBoardView(state: GameState) {
  const q = createStateQueries(state);

  return {
    board: q.board.tiled("arena"),
    legalEdgeIds: state.publicState.legalEdgeIds,
    legalVertexIds: state.publicState.legalVertexIds,
  };
}
```

That keeps the reducer view compatible with `board={view.board}` and preserves
the exact `edgeId` and `vertexId` runtime types in UI callbacks.

Keep manifest IDs typed all the way into reducer code so the query surface can
accept them directly. If you feel tempted to write `(q.board as any)` or parse
data out of an ID string, the ID usually widened earlier in your schema.

Use `createStateQueries(state)` when your helper already receives `GameState`.
It keeps query typing bound to the reducer state, which avoids the inference
loss you can hit when you extract helpers around `createTableQueries(...)`.

```ts
import {
  createStateQueries,
  type TableQueriesOfState,
} from "@dreamboard/app-sdk/reducer";

function summarizeTrack(q: TableQueriesOfState<GameState>) {
  return q.board.adjacentSpaces("track-board", "space-a");
}

function reducerHelper(state: GameState) {
  const q = createStateQueries(state);
  return summarizeTrack(q);
}
```

### Board shape and topology semantics

- `board.spaces` is an ID-keyed record.
- `board.edges` is an array of edge records.
- `board.vertices` is an array of vertex records.

Do not use `Object.keys(board.edges)` or `Object.keys(board.vertices)` expecting
runtime IDs. That returns array indexes such as `"0"` and `"1"`, not edge or
vertex IDs.

Use query helpers as the canonical reducer-native traversal path:

- `q.board.spaceEdges(boardId, spaceId)`
- `q.board.spaceVertices(boardId, spaceId)`
- `q.board.incidentEdges(boardId, vertexId)`
- `q.board.incidentVertices(boardId, edgeId)`
- `q.board.adjacentSpaces(boardId, spaceId)`
- `q.board.relatedSpaces(boardId, spaceId, relationTypeId)`

These traversal helpers return typed runtime IDs, not full board records. Use
`q.board.space(...)`, `q.board.edge(...)`, or `q.board.vertex(...)` when you
need the underlying reducer-native record.

`incidentEdges(...)` and `incidentVertices(...)` are geometry helpers over the
tiled topology. They return all tiled edges or vertices that share the same
incident spaces as the input location. They do not apply gameplay-specific
filters such as "only roads in the current player's network".

`createStateQueries(...)` is also the reducer-native happy path for cards and
slots:

```ts
const q = createStateQueries(state);

const hand = q.zone.playerCardCollection(playerId, "captain-hand");
const discard = q.zone.sharedCardCollection("discard");
const playedCard = q.card.get("captain-card-1");

const cardsById = q.card.byIds(hand.cardIds);
const playedCardType = playedCard.cardType;
const workerSlots = q.slot.pieceOccupantsByHost("mat-alpha");
const sharedDieSlots = q.slot.dieOccupantsByHost("supply-die");
```

Use `q.card.get(cardId)` when you need reducer-native card metadata for one
runtime card ID. Do not parse card IDs manually just to recover card type or
properties.

The slot query surface is:

- `q.slot.occupants(host, slotId)`
- `q.slot.occupantsByHost(host)`
- `q.slot.pieceOccupants(hostId, slotId)`
- `q.slot.pieceOccupantsByHost(hostId)`
- `q.slot.dieOccupants(hostId, slotId)`
- `q.slot.dieOccupantsByHost(hostId)`

Those helpers return reducer-native `ViewSlotOccupant[]` values or slot-ID keyed
records of those same values, so reducer views can pass them straight through
to `SlotSystem` without a helper adapter.

Use `q.component.*(...)` for resolved placement reads when you need to know
where a component currently lives.

```ts
const q = createTableQueries(state.table);
const placedCard = q.component.space("a-dog");
const cardInHand = q.component.hand("a-dog");
const cardInContainer = q.component.container("sealed-ledger");
```

### Runtime location reference

Resolved component queries can return these board-aware runtime locations:

| `type`        | Extra fields                                          |
| ------------- | ----------------------------------------------------- |
| `OnSpace`     | `boardId`, `spaceId`, optional `position`             |
| `InContainer` | `boardId`, `containerId`, optional `position`         |
| `OnEdge`      | `boardId`, `edgeId`, optional `position`              |
| `OnVertex`    | `boardId`, `vertexId`, optional `position`            |
| `InSlot`      | `host.kind`, `host.id`, `slotId`, optional `position` |

Movement helpers in this package update those runtime locations for you:
`moveComponentToSpace(...)`, `moveComponentToContainer(...)`,
`moveComponentToEdge(...)`, and `moveComponentToVertex(...)`.

### Tiled state pattern

For hex and square boards, keep immutable topology in the manifest-backed table
and keep mutable gameplay facts in reducer state keyed by runtime IDs.

```ts
import type {
  TiledEdgeMap,
  TiledSpaceMap,
  TiledVertexMap,
} from "@dreamboard/app-sdk/reducer";

type Table = GameState["table"];

type OwnershipBySpaceId = TiledSpaceMap<Table, "mars-board", string>;
type EffectsByEdgeId = TiledEdgeMap<Table, "arena-board", string>;
type MarkersByVertexId = TiledVertexMap<
  Table,
  "arena-board",
  { ownerId: string; kind: string }
>;
```

That pattern works for:

- Terraforming Mars tile ownership and adjacency bonuses
- Gloomhaven movement, blockers, and range checks
- Cascadia adjacency-driven scoring
- Chess-, Checkers-, or Onitama-style square-cell overlays

## `defineGame(...)`

`defineGame(...)` assembles the reducer definition that `createReducerBundle(...)`
executes.

| Field             | Required | Notes                                                      |
| ----------------- | -------- | ---------------------------------------------------------- |
| `contract`        | Yes      | Output from `defineGameContract(...)`                      |
| `initial.public`  | No       | Lazy initializer for `publicState`                         |
| `initial.private` | No       | Lazy initializer for one player's private state            |
| `initial.hidden`  | No       | Lazy initializer for `hiddenState`                         |
| `phases`          | Yes      | Phase registry; object keys are the phase names            |
| `initialPhase`    | No       | Default starting phase unless a setup profile overrides it |
| `setupProfiles`   | No       | Typed setup-profile overrides and bootstrap steps          |
| `views`           | No       | Named player-facing view projections                       |
| `root.system`     | No       | Root-level system handlers                                 |
| `root.selectors`  | No       | Root-level derived selectors                               |

If you omit `initialPhase`, the first registered phase is used.

Initializers receive:

- `manifest`
- `table`
- `playerIds`
- `playerId` for `initial.private`
- `rngSeed`
- `setup`

```ts
import { defineGame } from "@dreamboard/app-sdk/reducer";
import { gameContract } from "./game-contract";
import { phases } from "./phases";
import { playerView } from "./player-view";
import { setupProfiles } from "./setup-profiles";

export default defineGame({
  contract: gameContract,
  initial: {
    public: ({ playerIds }) => ({
      currentJudgeId: playerIds[0],
      winnerPlayerId: null,
    }),
    private: () => ({
      secretNotes: [],
    }),
    hidden: ({ rngSeed }) => ({
      seededRoundId: `round-${rngSeed ?? 0}`,
    }),
  },
  initialPhase: "dealCards",
  setupProfiles,
  phases,
  views: {
    player: playerView,
  },
});
```

## Generated `setupProfiles(...)`

Use setup profiles when the selected setup should change the initial phase,
bootstrap authored inventory, or both.

Author them from the generated manifest contract in `app/setup-profiles.ts`:

```ts
import { setupProfiles } from "../shared/manifest-contract";

export default setupProfiles({
  "standard-expedition": {
    initialPhase: "dealCards",
    bootstrap: [
      shuffle({
        type: "sharedZone",
        zoneId: "contracts-deck",
      }),
    ],
  },
});
```

That generated builder keeps the profile IDs and bootstrap helpers tied to the
current manifest contract automatically.

### `SetupProfileDefinition`

| Field          | Required | Notes                                                    |
| -------------- | -------- | -------------------------------------------------------- |
| `initialPhase` | No       | Overrides `defineGame(...).initialPhase` for that setup  |
| `bootstrap`    | No       | Ordered setup bootstrap steps applied before play starts |

### `SetupBootstrapStep`

| Variant           | Required fields       | Notes                                                                        |
| ----------------- | --------------------- | ---------------------------------------------------------------------------- |
| `type: "shuffle"` | `container`           | Shuffles a shared zone, player zone, or board container                      |
| `type: "move"`    | `from`, `to`          | Moves explicit or counted components between containers or onto board spaces |
| `type: "deal"`    | `from`, `to`, `count` | Deals from a shared source into a per-player destination template            |

For `move` steps:

- `from` must be a container reference
- `to` may be a container reference or a board-space reference
- use `count` for top-of-container movement
- use `componentIds` for exact authored components

For `deal` steps:

- `from` must be a shared zone or shared board container
- `to` must be a player zone or player board container template
- `playerIds` is optional; omit it to target every player

The benchmark workspace uses the higher-level bootstrap helpers instead of raw
step objects:

{/* Generated from examples/board-contract-lab/app/setup-profiles.ts (reducer-setup-bootstrap) */}

```ts
bootstrap: [
  shuffle({
    type: "sharedZone",
    zoneId: "contracts-deck",
  }),
  seedSharedBoardContainer({
    from: {
      type: "sharedZone",
      zoneId: "contracts-deck",
    },
    boardId: "market-board",
    containerId: "dock-cache",
    componentIds: ["sealed-ledger"],
  }),
  dealToPlayerBoardContainer({
    from: {
      type: "sharedZone",
      zoneId: "contracts-deck",
    },
    boardId: "player-mat",
    containerId: "reserve",
    count: 1,
  }),
  seedSharedBoardContainer({
    from: {
      type: "sharedZone",
      zoneId: "contracts-deck",
    },
    boardId: "market-board",
    containerId: "offer-row",
    count: 3,
  }),
],
//
```

## `definePhase(...)`

`definePhase(...)` declares one reducer phase.

| Field           | Required | Notes                                                           |
| --------------- | -------- | --------------------------------------------------------------- |
| `kind`          | No       | `auto` or `player`                                              |
| `state`         | Yes      | Zod schema for phase-local state                                |
| `initialState`  | No       | Initializes `state.phase` when the phase becomes current        |
| `enter`         | No       | Runs on initialization and on transitions into the phase        |
| `actions`       | No       | Player actions available in this phase                          |
| `promptFlows`   | No       | Additive prompt-flow registry for one-prompt resume flows       |
| `prompts`       | No       | Prompt registry for this phase                                  |
| `continuations` | No       | Continuation registry for prompt or window resumes              |
| `windows`       | No       | Window registry; `id` defaults to the object key                |
| `system`        | No       | Handlers for `fx.dispatchSystem(...)` and scheduled inputs      |
| `selectors`     | No       | Named derived selectors                                         |

`initialState(...)` receives `manifest`, `state`, `playerIds`, and `setup`.

`enter(...)` receives the same reducer callback helpers as actions, plus
`event`, which is either `initialize` or `transition`.

<Warning>
  `enter(...)` only runs when Dreamboard initializes a phase or enters a new
  phase through `fx.transition(...)`. It does not run again just because
  your reducer changed `publicState`, `hiddenState`, or who should act next
  inside the same phase.
</Warning>

Inside a phase callback, `state.phase` is strongly typed from that phase's
`state` schema. Dreamboard no longer stores a `state.phases` map or exposes
`getPhaseState(...)`.

Use `kind: "auto"` for phases that should resolve immediately from reducer
logic without waiting for a player action. Use `kind: "player"` for phases that
wait for one or more active players to submit actions.

If you want to hand off control to another player without leaving the current
phase, update `flow.activePlayers` in the same reducer result that changes the
turn. Do not rely on `enter(...)` to resync active players after a same-phase
turn change.

```ts
import { z } from "zod";
import { definePhase } from "@dreamboard/app-sdk/reducer";
import type { GameContract } from "../game-contract";
import { ops, pipe } from "../reducer-support";

export const placeThing = definePhase<GameContract>()({
  kind: "player",
  state: z.object({}),
  initialState: () => ({}),
  enter({ state, accept }) {
    return accept(
      pipe(state, ops.setActivePlayers([state.publicState.currentJudgeId])),
    );
  },
});
```

`ops` is the curried writer namespace from
`createReducerOps<GameState>()` (see `app/reducer-support.ts` in a scaffolded
project), and `pipe(state, ...ops)` threads each `State -> State` transformer
in order.

Continuation IDs and window IDs default to their registry keys when you omit
`id`.

Prompt-flow continuations default to the prompt ID they wrap, so a single
prompt-response flow can register through `promptFlows` without also wiring a
separate `continuations` entry.

## `defineAction(...)`

`defineAction(...)` declares one typed player action.

| Field         | Required | Notes                                                                  |
| ------------- | -------- | ---------------------------------------------------------------------- |
| `params`      | Yes      | Zod schema for `input.params`                                          |
| `displayName` | No       | Metadata label                                                         |
| `description` | No       | Metadata description                                                   |
| `errorCodes`  | No       | Declared rejection codes                                               |
| `available`   | No       | UI/runtime availability filter for `getAvailableActions(...)`          |
| `validate`    | No       | Returns `null` or `{ errorCode, message }`                             |
| `reduce`      | Yes      | Returns `accept(...)`, `reject(...)`, or a `{ state, effects }` object (queued runtime effects) |

Keep hard legality checks in `validate(...)` or `reduce(...)`. `available(...)`
only filters the surfaced available-action list.

```ts
import { z } from "zod";
import { defineAction } from "@dreamboard/app-sdk/reducer";
import type { GameContract } from "../game-contract";
import { ids } from "../shared/manifest-contract";

const placeThing = defineAction<GameContract>()({
  params: z.object({
    cardId: ids.cardId,
    spaceId: ids.spaceId,
  }),
  validate({ state, input }) {
    if (!state.flow.activePlayers.includes(input.playerId)) {
      return {
        errorCode: "NOT_YOUR_TURN",
        message: "It is not your turn.",
      };
    }
    return null;
  },
  reduce({ state, input, accept, fx }) {
    return accept(state, [fx.transition("judgeRings")]);
  },
});
```

## `definePrompt(...)` and `defineChoicePrompt(...)`

Use prompts when reducer flow must pause and resume later with a typed response.

### Prompt vs window

Use a prompt when you want one player to answer a reducer-owned request with a
typed response payload.

Use a window when you want the runtime to open a richer interactive session
that can target one or more players, accept multiple action types, and close
under a runtime close policy.

Prompts are narrower and response-focused. Windows are broader and
session-focused.

### `definePrompt(...)`

| Field            | Required | Notes                               |
| ---------------- | -------- | ----------------------------------- |
| `id`             | Yes      | Prompt type ID                      |
| `title`          | No       | Default title                       |
| `responseSchema` | Yes      | Zod schema for the response payload |

```ts
const judgeNotePrompt = definePrompt<GameContract>()({
  id: "judge-note",
  title: "Explain the ruling",
  responseSchema: z.object({
    note: z.string().min(1),
  }),
});
```

### `defineChoicePrompt(...)`

| Field     | Required | Notes                                                            |
| --------- | -------- | ---------------------------------------------------------------- |
| `id`      | Yes      | Prompt type ID                                                   |
| `title`   | No       | Default title                                                    |
| `options` | Yes      | Non-empty option list; response type is inferred from option IDs |

```ts
const judgePlacementPrompt = defineChoicePrompt<GameContract>()({
  id: "judge-placement",
  title: "Where should this thing actually go?",
  options: [
    { id: "ring-1", label: "Ring 1" },
    { id: "ring-2", label: "Ring 2" },
    { id: "discard", label: "Not in any ring" },
  ] as const,
});
```

When you open a choice prompt, any runtime `options` override must still use the
declared option IDs.

## `definePromptFlow(...)` and `defineChoiceFlow(...)`

Use prompt flows for the common "open one prompt and resume one continuation"
pattern.

These helpers are additive ergonomics over the lower-level prompt and
continuation APIs. They do not change runtime prompt shape, transport, or
effect behavior.

| Helper                  | Use when                                                |
| ----------------------- | ------------------------------------------------------- |
| `definePromptFlow(...)` | You already have a typed prompt or need a custom schema |
| `defineChoiceFlow(...)` | One player chooses from a typed option list             |

Each flow returns:

- `prompt`
- `continuation`
- `prompts`
- `continuations`
- `open(fx, { to, data, title?, payload?, options? })`

Register the flow with `phase.promptFlows`, then call `flow.open(...)` instead
of pairing `fx.openPrompt(...)` with `continuation(data)` manually.

```ts
import { ids } from "../shared/manifest-contract";

const chooseBonusFlow = defineChoiceFlow<GameContract>()({
  id: "choose-bonus",
  title: "Choose a bonus",
  options: [
    { id: "energy", label: "Energy" },
    { id: "steel", label: "Steel" },
  ] as const,
  data: z.object({
    spaceId: ids.spaceId,
  }),
  reduce({ state, input, accept, fx }) {
    return accept(
      {
        ...state,
        publicState: {
          ...state.publicState,
          lastBonus: {
            spaceId: input.data.spaceId,
            resource: input.response,
          },
        },
      },
      [fx.closePrompt(input.promptId)],
    );
  },
});

export const takeTurn = definePhase<GameContract>()({
  kind: "player",
  state: z.object({}),
  initialState: () => ({}),
  promptFlows: {
    chooseBonusFlow,
  },
  actions: {
    claimStation: defineAction<GameContract>()({
      params: z.object({
        spaceId: ids.spaceId,
      }),
      reduce({ state, input, accept, fx }) {
        return accept(state, [
          chooseBonusFlow.open(fx, {
            to: input.playerId,
            data: { spaceId: input.params.spaceId },
          }),
        ]);
      },
    }),
  },
});
```

Prefer continuation `data` for transient prompt context. Use hidden state only
when the data must outlive the response path or be reused elsewhere.

## `definePromptContinuation(...)`, `defineWindowContinuation(...)`, and `defineContinuation(...)`

Continuations resume typed reducer logic after a prompt response or window
action.

| Helper                          | Resume source                                 | Typed input                                                      |
| ------------------------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| `definePromptContinuation(...)` | One declared prompt                           | `input.promptId` and prompt-typed `input.response`               |
| `defineWindowContinuation(...)` | Window action                                 | `input.windowId`, `input.actionType`, and typed `input.response` |
| `defineContinuation(...)`       | Shared prompt, window, or runtime-effect flow | Union on `input.source`                                          |

### `definePromptContinuation(...)`

```ts
import { ids } from "../shared/manifest-contract";

const resolvePlacement = definePromptContinuation<GameContract>()({
  prompt: judgePlacementPrompt,
  data: z.object({
    pendingCardId: ids.cardId,
  }),
  reduce({ state, input, accept, fx }) {
    return accept(state, [fx.closePrompt(input.promptId)]);
  },
});
```

### `defineWindowContinuation(...)`

```ts
import { ids } from "../shared/manifest-contract";

const reviewWindow = {
  id: "review-window",
} as const;

const resolveReview = defineWindowContinuation<GameContract>()({
  data: z.object({
    pendingCardId: ids.cardId,
  }),
  response: z.object({
    actionType: z.literal("confirm"),
    params: z.object({
      approved: z.boolean(),
    }),
    windowId: z.literal("review-window"),
  }),
  reduce({ state, input, accept }) {
    return accept(state);
  },
});
```

### `defineContinuation(...)`

Use the shared helper when one continuation should accept prompt resumes,
window resumes, or runtime-effect resumes and branch on `input.source`.

```ts
import { ids } from "../shared/manifest-contract";

const resolveSharedPlacement = defineContinuation<GameContract>()({
  data: z.object({
    pendingCardId: ids.cardId,
  }),
  response: judgePlacementPrompt.responseSchema,
  reduce({ state, input, accept }) {
    if (input.source !== "prompt") {
      return accept(state);
    }
    return accept(state);
  },
});
```

Runtime-owned effects such as `fx.randomInt(...)` resume shared
continuations with `input.source === "shared"`.

For simple one-prompt flows, prefer `definePromptFlow(...)` or
`defineChoiceFlow(...)`. Keep the lower-level continuation helpers for shared
resume paths, multi-step flows, or when one continuation must handle multiple
sources.

## `defineView(...)`

Views are typed, player-facing projections of reducer state.

| Field     | Required | Notes                                   |
| --------- | -------- | --------------------------------------- |
| `project` | Yes      | Maps reducer state to one player's view |

`project(...)` receives `state`, `playerId`, `runtime`, `manifest`, and the
same callback helpers as phases and actions. The projected payload type is
inferred directly from `project`'s return type — no Zod schema is required or
accepted, and the generated UI contract (`shared/generated/ui-contract.ts`)
picks the shape up automatically.

```ts
import { defineView } from "@dreamboard/app-sdk/reducer";
import type { GameContract } from "./game-contract";

export const playerView = defineView<GameContract>()({
  project({ state, playerId }) {
    return {
      turn: state.flow.turn,
      isJudge: playerId === state.publicState.currentJudgeId,
    };
  },
});
```

## Reducer callback helpers

Reducer callbacks such as `enter(...)`, `validate(...)`, `reduce(...)`,
continuation reducers, and view projectors receive shared runtime helpers.

| Helper                         | Notes                                              |
| ------------------------------ | -------------------------------------------------- |
| `accept(state, effects?)`      | Successful reducer result                          |
| `reject(errorCode, message?)`  | Immediate rejection                                |
| `manifest`                     | Generated manifest contract                        |
| `setup`                        | Selected setup profile plus resolved option values |
| `currentPhase`                 | Current phase name                                 |
| `playerOrder`                  | Full turn order                                    |
| `activePlayers`                | Current active player IDs                          |
| `promptByInstanceId(promptId)` | Reads one open prompt instance                     |
| `windowByInstanceId(windowId)` | Reads one open window instance                     |

`setup.optionValues` is fully resolved in reducer callbacks and initialization
contexts. Every declared setup option ID is present, with `null` for
unselected choices.

### `fx`

Destructure `fx` from a reducer callback to queue runtime side effects
alongside an accepted state. Each `fx.*` call returns one runtime-effect
descriptor; pass an array of them as the second argument to `accept(...)`.

The `fx` helper groups related capabilities:

**Flow control**

| Helper                                                                        | Notes                                       |
| ----------------------------------------------------------------------------- | ------------------------------------------- |
| `fx.transition(phaseName)`                                                    | Transition into another phase               |
| `fx.openPrompt(prompt, { to, resume, title?, payload?, options? })`           | Open a prompt and bind a continuation token |
| `fx.closePrompt(promptId)`                                                    | Close one open prompt instance              |
| `fx.openWindow(window, { closePolicy?, addressedTo?, payload?, resume? })`    | Open a reducer-owned window                 |
| `fx.closeWindow(windowId)`                                                    | Close one open window instance              |

**Randomness (seeded, replayable RNG)**

| Helper                                                        | Notes                                               |
| ------------------------------------------------------------- | --------------------------------------------------- |
| `fx.rollDie(dieId)`                                           | Roll one authored die with runtime-owned RNG        |
| `fx.shuffleSharedZone(zoneId)`                                | Shuffle a shared zone/deck                          |
| `fx.dealCardsToPlayerZone(fromZoneId, playerId, toZoneId, n)` | Deal cards from a shared zone into a player zone    |
| `fx.sample(from, sampleId, resume, count?)`                   | Sample cards and resume a continuation              |
| `fx.randomInt(min, max, randomIntId, resume)`                 | Sample one integer and resume a shared continuation |

**Scheduling**

| Helper                                          | Notes                         |
| ----------------------------------------------- | ----------------------------- |
| `fx.dispatchSystem(event, payload?)`            | Queue a system event immediately |
| `fx.scheduleTiming(timing, event, payload?)`    | Queue a timed system input    |

Use `fx.transition(phaseName)` when you want Dreamboard to switch runtime
phase routing. A transition changes the current phase, reinitializes the next
phase's `state.phase`, and runs that phase's `enter(...)`.

Prompt and window instance IDs are branded runtime IDs. Use the values returned
by the runtime state instead of raw strings.

Randomness follows the same rule. Runtime-owned effects such as
`fx.rollDie(...)`, `fx.shuffleSharedZone(...)`, `fx.sample(...)`, and
`fx.randomInt(...)` consume seeded interpreter RNG. Authored reducer code
should not call `Math.random()` directly.

Use `fx.rollDie(...)` when the runtime only needs to update an authored die.
Use `fx.randomInt(...)` when reducer logic needs the sampled value back
through a shared continuation.

Prefer `flow.open(fx, ...)` for single prompt-response flows. Reach for
`fx.openPrompt(...)` directly when you need the low-level prompt API.

```ts
const resolveRoll = defineContinuation<GameContract>()({
  data: z.object({}),
  response: z.object({
    randomIntId: z.string(),
    value: z.number().int(),
  }),
  reduce({ state, input, accept }) {
    if (input.source !== "shared") {
      return accept(state);
    }

    return accept({
      ...state,
      publicState: {
        ...state.publicState,
        lastRoll: input.response.value,
      },
    });
  },
});
```

```ts
reduce({ state, accept, fx }) {
  return accept(state, [fx.rollDie("turn-die")]);
}
```

```ts
reduce({ state, accept, fx }) {
  return accept(state, [
    fx.randomInt(1, 6, "turn-roll", resolveRoll({})),
  ]);
}
```

```ts
enter({ state, accept, fx }) {
  return accept(state, [
    fx.openPrompt(judgePlacementPrompt, {
      to: "player-1",
      resume: resolvePlacement({ pendingCardId: "a-dog" }),
      options: [
        { id: "ring-1", label: "Ring 1" },
        { id: "discard", label: "Not in any ring" },
      ],
    }),
    fx.transition("judgeRings"),
  ]);
}
```

## Table helpers

Reducer helpers follow one rule: reads go through queries, writes go through
curried `ops.*`. Every write returns a new state — no helper mutates in place.

### Reads: `createStateQueries` and `createTableQueries`

`createStateQueries(state)` is the preferred read API when you already have the
full reducer state. Use `createTableQueries(table)` when you only have a bare
`table` handle (for example inside low-level adapters).

| Namespace       | Read surface                                                                                |
| --------------- | ------------------------------------------------------------------------------------------- |
| `q.board.*`     | Board, space, container, relation, adjacency, distance, edge, and vertex reads             |
| `q.zone.*`      | Shared-zone and player-zone card reads                                                      |
| `q.card.*`      | Card payload, owner, and visibility reads                                                   |
| `q.player.*`    | Player order and resource reads                                                             |
| `q.component.*` | Raw location plus resolved deck, hand, zone, space, container, edge, vertex, and slot reads |

```ts
const q = createStateQueries(state);

const handCards = q.zone.playerCards(input.playerId, "things-hand");
const board = q.board.tiled("market-board");
const spaceOccupants = q.board.spaceOccupants("market-board", "tavern");
const placedCard = q.component.space(input.params.cardId);
```

### Writes: `createReducerOps` plus `pipe`

Create one `ops` factory per reducer surface (typically in
`app/reducer-support.ts`) and thread writes through `pipe(state, ...ops)`. The
pipe preserves subtype narrowing, so phase-scoped writers such as
`ops.setPhaseState(...)` still see the correct `state.phase` type.

```ts
import { createReducerOps, pipe } from "@dreamboard/app-sdk/reducer";
import type { GameState } from "./game-contract";

export const ops = createReducerOps<GameState>();
export { pipe };
```

```ts
import { ops, pipe } from "../reducer-support";

const next = pipe(
  state,
  ops.setActivePlayers([state.publicState.currentPlayerId]),
  ops.moveCardFromPlayerZoneToSharedZone({
    playerId: input.playerId,
    fromZoneId: "things-hand",
    toZoneId: "ring-1",
    cardId: input.params.cardId,
    playedBy: input.playerId,
  }),
);

return accept(next);
```

### `ops.*` reference

Each entry below is a curried `State -> State` transformer. Compose with `pipe`
or invoke directly when you need a one-off copy.

**Flow and zones**

| Op                                                             | Notes                                                                        |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `ops.setActivePlayers(playerIds)`                              | Replaces `flow.activePlayers`                                                |
| `ops.setPhaseState(phaseState)`                                | Replaces `state.phase` for the current phase only; does not transition phases |
| `ops.addCardToSharedZone(zoneId, cardId, playedBy?)`           | Appends a card to a shared zone                                              |
| `ops.removeCardFromSharedZone(zoneId, cardId)`                 | Removes a card from a shared zone                                            |
| `ops.moveCardFromPlayerZoneToSharedZone({ ... })`              | Moves one card from a player zone to a shared zone                           |
| `ops.moveCardBetweenSharedZones({ ... })`                      | Moves one card between shared zones                                          |

<Info>
  `ops.setPhaseState(...)` only replaces the typed payload stored in
  `state.phase` for the current phase. Use `fx.transition("phaseName")` when
  you want Dreamboard to move into another phase.
</Info>

**Boards and containers**

| Op                                                                       | Notes                                                                |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `ops.moveComponentToSpace(componentId, boardId, spaceId)`                | Moves any component onto a board space                               |
| `ops.moveComponentToContainer(componentId, boardId, containerId)`        | Moves any component into a board container                           |
| `ops.moveComponentToEdge(componentId, boardId, edgeId)`                  | Moves a component onto a tiled edge                                  |
| `ops.moveComponentToVertex(componentId, boardId, vertexId)`              | Moves a component onto a tiled vertex                                |

Use the matching `q.board.*` queries for occupancy and traversal:
`q.board.spaceOccupants(...)`, `q.board.containerOccupants(...)`,
`q.board.edgeOccupants(...)`, `q.board.vertexOccupants(...)`,
`q.board.adjacentSpaces(...)`, `q.board.spaceEdges(...)`,
`q.board.spaceVertices(...)`, `q.board.incidentEdges(...)`, and
`q.board.incidentVertices(...)`.

`q.board.adjacentSpaces(...)` follows the board layout:

- `generic` boards read authored `adjacent` relations
- `hex` boards use derived hex adjacency
- `square` boards use derived orthogonal adjacency

For hex-specific or square-specific layout math, reach for
`q.board.hex(...)` / `q.board.square(...)` accessors off the same query
namespace.

## `applySetupBootstrap(...)`

`applySetupBootstrap(state, steps)` applies the same bootstrap language used by
`setupProfiles[*].bootstrap`.

Use it when you need the setup bootstrap logic directly, such as in reducer
runtime tests or custom initialization code.

```ts
import { applySetupBootstrap } from "@dreamboard/app-sdk/reducer";

const nextState = applySetupBootstrap(state, [
  {
    type: "shuffle",
    container: {
      type: "sharedZone",
      zoneId: "draw-deck",
    },
  },
  {
    type: "deal",
    from: {
      type: "sharedZone",
      zoneId: "draw-deck",
    },
    to: {
      type: "playerZone",
      zoneId: "main-hand",
    },
    count: 5,
  },
]);
```

Card-set compatibility is enforced for zones and board containers while bootstrap
steps run.

## `createReducerBundle(...)`

`createReducerBundle(...)` converts a reducer definition into the runtime bundle
consumed by the Dreamboard runtime.

```ts
import game from "./game";
import { createReducerBundle } from "@dreamboard/app-sdk/reducer";

export default createReducerBundle(game);
```

### Returned runtime methods

| Method                                               | Notes                                                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `initialize({ table, playerIds, rngSeed?, setup? })` | Creates the initial reducer state, applies setup overrides, and enters the initial phase |
| `initializePhase({ state, to })`                     | Transitions into one phase and initializes its `state.phase` value                       |
| `validateInput({ state, input })`                    | Validates one runtime input                                                              |
| `reduce({ state, input })`                           | Applies one input without draining follow-up effects                                     |
| `dispatch({ state, input })`                         | Applies one input and drains runtime effects                                             |
| `getAvailableActions({ state, playerId })`           | Returns surfaced action metadata for one player                                          |
| `getView({ state, playerId, viewId? })`              | Projects one named reducer view; defaults to `player`                                    |

The bundle also exposes reducer metadata registries such as `actions`,
`prompts`, `views`, `windows`, `continuations`, and `metadata`.

## High-value type utilities

`@dreamboard/app-sdk/reducer` also exports type helpers for reducer authoring.

| Type                                                               | Use                                                                  |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `GameStateOf<Source>`                                              | Resolved reducer state for a contract or full game definition        |
| `PhaseMapOf<Contract>`                                             | Type-check a `phases` object against the contract's phase-name union |
| `ViewOfDefinition<Definition, ViewName>`                           | Inferred payload for one registered view                             |
| `ActionParamsOfDefinition<Definition, ActionName>`                 | Inferred params for a named action across phases                     |
| `ActionParamsOfDefinitionPhase<Definition, PhaseName, ActionName>` | Inferred params for one phase-local action                           |
| `PromptIdsOfDefinition<Definition>`                                | Prompt ID union for a reducer definition                             |
| `PromptResponseOfDefinition<Definition, PromptId>`                 | Response payload for one prompt                                      |
| `WindowActionNamesOfDefinition<Definition, WindowId>`              | Window action-name union for one registered window                   |
| `WindowActionParamsOfDefinition<Definition, WindowId, ActionName>` | Inferred params payload for one window action                        |

```ts
import type {
  ActionParamsOfDefinitionPhase,
  GameStateOf,
  PhaseMapOf,
  ViewOfDefinition,
} from "@dreamboard/app-sdk/reducer";

type GameState = GameStateOf<typeof game>;
type Phases = PhaseMapOf<typeof gameContract>;
type PlayerView = ViewOfDefinition<typeof game, "player">;
type PlaceThingParams = ActionParamsOfDefinitionPhase<
  typeof game,
  "placeThing",
  "placeThing"
>;
```
