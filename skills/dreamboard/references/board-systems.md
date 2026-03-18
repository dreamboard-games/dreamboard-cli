# Board Systems

Use this guide when your game has a board-like play surface.

This page connects the full flow:

1. define the board in `manifest.json`
2. mutate and read it in `app/phases/*.ts`
3. send only UI-specific extras through `getUIArgs()`
4. render it in `ui/App.tsx` with the right board hook/component pair

## Choose The Right Primitive

| Pattern        | Engine-backed | Manifest `boardDefinitions` | App API                                             | UI hook                           | UI component   |
| -------------- | ------------- | --------------------------- | --------------------------------------------------- | --------------------------------- | -------------- |
| `HexBoard`     | yes           | `boardType: "hex"`          | `ctx.state.hexBoard`, `ctx.apis.hexApi`             | `useHexBoard(boardId)`            | `HexGrid`      |
| `SquareGrid`   | yes           | `boardType: "square"`       | `ctx.state.squareBoard`, `ctx.apis.squareApi`       | `useSquareBoard(boardId)`         | `SquareGrid`   |
| `TrackBoard`   | yes           | `boardType: "track"`        | `ctx.state.trackBoard`, `ctx.apis.trackApi`         | `useTrackBoard(boardId)`          | `TrackBoard`   |
| `NetworkGraph` | yes           | `boardType: "network"`      | `ctx.state.networkBoard`, `ctx.apis.networkApi`     | `useNetworkBoard(boardId)`        | `NetworkGraph` |
| `ZoneMap`      | no            | none                        | model in global/player state or derive in app logic | `useZoneMap(zones, pieces)`       | `ZoneMap`      |
| `SlotSystem`   | no            | none                        | model in global/player state or derive in app logic | `useSlotSystem(slots, occupants)` | `SlotSystem`   |

Important:

- Dreamboard's engine-backed board APIs are `hex`, `square`, `track`, and `network`.
- `ZoneMap` and `SlotSystem` are UI patterns, not extra engine board types.
- Do not duplicate engine board state into `getUIArgs()` just so React can read it. Use `useHexBoard`, `useSquareBoard`, `useTrackBoard`, or `useNetworkBoard` for the authoritative board snapshot.

## HexBoard End To End

### 1. Define the board in `manifest.json`

```json
{
  "boardDefinitions": [
    {
      "id": "main-map",
      "boardType": "hex",
      "layout": "ring",
      "rings": 3,
      "tileTypes": ["plains", "forest", "mountain", "water"],
      "edgeTypes": ["road"],
      "vertexTypes": ["settlement", "city"],
      "tiles": [
        { "id": "tile-0", "type": "plains" },
        { "id": "tile-1", "type": "forest" },
        { "id": "tile-2", "type": "mountain" }
      ]
    }
  ]
}
```

Use `manifest-authoring.md` for the full manifest schema. The key point here is that the board exists in `boardDefinitions`, not as ad hoc UI data.

### 2. Read and mutate the board in app logic

The generated phase context exposes board mutations as flattened APIs on `ctx.apis`:

- `ctx.apis.hexApi`
- `ctx.apis.squareApi`
- `ctx.apis.trackApi`
- `ctx.apis.networkApi`

Those are the runtime equivalents of the nested `BoardApi` types (`BoardApi.hex`, `BoardApi.square`, and so on).

For a hex board:

```ts
const BOARD_ID = "main-map" as const;

export const buildPhase = {
  onEnter(ctx) {
    const tiles = ctx.state.hexBoard.getAllTiles(BOARD_ID);

    for (const tile of tiles) {
      if (tile.typeId == null) {
        ctx.apis.hexApi.updateTile(
          BOARD_ID,
          tile.id,
          undefined,
          "plains",
          undefined,
          { resource: "grain" },
        );
      }
    }
  },

  onPlayerAction(ctx, playerId, action) {
    if (action.type === "buildRoad") {
      const [hex1, hex2] = action.parameters.edgeHexes;
      ctx.apis.hexApi.placeEdge(BOARD_ID, hex1, hex2);
      ctx.apis.hexApi.updateEdge(BOARD_ID, [hex1, hex2], playerId, "road", {
        strength: 1,
      });
    }

    if (action.type === "buildSettlement") {
      const [hex1, hex2, hex3] = action.parameters.vertexHexes;
      ctx.apis.hexApi.placeVertex(BOARD_ID, hex1, hex2, hex3);
      ctx.apis.hexApi.updateVertex(
        BOARD_ID,
        [hex1, hex2, hex3],
        playerId,
        "settlement",
        { level: 1 },
      );
    }
  },

  getUIArgs(ctx, playerId) {
    return {
      placementMode: ctx.state.player.isActive(playerId) ? "settlement" : null,
      selectableTileIds: ctx.state.hexBoard
        .getTilesByOwner(BOARD_ID, playerId)
        .map((tile) => tile.id),
    };
  },
};
```

Guidelines:

- Use `ctx.state.hexBoard.*` for rule checks and neighborhood queries.
- Use `ctx.apis.hexApi.*` for all authoritative mutations.
- Put only UI-only state in `getUIArgs()`: selection mode, highlighted IDs, legal placements, temporary overlays, and similar view concerns.

### 3. Render the board in the frontend with `useHexBoard`

```tsx
import {
  DefaultHexEdge,
  DefaultHexTile,
  DefaultHexVertex,
  HexGrid,
} from "./sdk/components";
import { useAction, useHexBoard, useUIArgs } from "./sdk/hooks";

const BOARD_ID = "main-map" as const;

export function BoardView() {
  const { boardPhase } = useUIArgs();
  const actions = useAction();
  const { tiles, edges, vertices } = useHexBoard(BOARD_ID);

  return (
    <HexGrid
      tiles={tiles}
      edges={edges}
      vertices={vertices}
      hexSize={52}
      renderTile={(tile) => (
        <DefaultHexTile
          size={52}
          fill={tileFillByType[tile.typeId ?? "plains"]}
          label={tile.label}
          isHighlighted={boardPhase.selectableTileIds.includes(tile.id)}
        />
      )}
      renderEdge={(edge, position) => (
        <DefaultHexEdge position={position} color={playerColor(edge.owner)} />
      )}
      renderVertex={(vertex, position) => (
        <DefaultHexVertex
          position={position}
          color={playerColor(vertex.owner)}
        />
      )}
      interactiveVertices={boardPhase.placementMode === "settlement"}
      onInteractiveVertexClick={(vertex) =>
        actions.boardActions.buildSettlement({
          vertexHexes: vertex.adjacentTileIds,
        })
      }
    />
  );
}
```

The key pattern is:

- board structure and ownership live in engine state
- `useHexBoard(boardId)` reads that authoritative state
- `getUIArgs()` carries temporary UX concerns such as placement mode and valid targets

## SquareGrid

Use a square board when the engine needs to own cell state or piece positions.

### App logic

- Read with `ctx.state.squareBoard`
- Mutate with `ctx.apis.squareApi`
- Most common writes:
  - `updateCell(boardId, row, col, owner?, typeId?, properties?)`
  - `placePiece(boardId, pieceId, row, col, typeId, owner?)`
  - `movePiece(boardId, pieceId, toRow, toCol)`
  - `removePiece(boardId, pieceId)`

```ts
ctx.apis.squareApi.placePiece(
  "battle-grid",
  "knight-1",
  0,
  1,
  "knight",
  playerId,
);
ctx.apis.squareApi.updateCell("battle-grid", 0, 1, playerId, "claimed", {
  danger: true,
});
```

### Frontend

- Read authoritative board data with `useSquareBoard(boardId)`
- Render with `SquareGrid`
- Use `useSquareGrid(...)` only for extra view-side helpers like algebraic notation, neighbor lookup, or blocked-cell math

```tsx
const { rows, cols, pieces, getCell, getPieceAt } =
  useSquareBoard("battle-grid");

<SquareGrid
  rows={rows}
  cols={cols}
  pieces={pieces}
  renderCell={(row, col) => (
    <CellView cell={getCell(row, col)} piece={getPieceAt(row, col)} />
  )}
  renderPiece={(piece) => <PieceView piece={piece} />}
/>;
```

Send highlights, selected cells, legal moves, and drag state through `getUIArgs()`, not by re-encoding the whole board.

## TrackBoard

Use a track board for race tracks, score tracks, circular progressions, or branching paths.

### App logic

- Read with `ctx.state.trackBoard`
- Mutate with `ctx.apis.trackApi`
- Most common writes:
  - `placePiece(boardId, pieceId, spaceId, typeId?, owner?)`
  - `movePiece(boardId, pieceId, toSpaceId)`
  - `setSpacePosition(boardId, spaceId, index, x, y, nextSpaces?)`
  - `updateSpace(boardId, spaceId, owner?, typeId?, name?, properties?)`

```ts
ctx.apis.trackApi.placePiece("race-track", "car-1", "start", "pawn", playerId);
ctx.apis.trackApi.movePiece("race-track", "car-1", "space-7");
```

### Frontend

- Read with `useTrackBoard(boardId)`
- Render with `TrackBoard`

```tsx
const { spaces, pieces, getPiecesOnSpace } = useTrackBoard("race-track");

<TrackBoard
  spaces={spaces}
  pieces={pieces}
  type="circular"
  renderSpace={(space) => (
    <TrackSpaceView space={space} pieces={getPiecesOnSpace(space.id)} />
  )}
/>;
```

Keep turn affordances in `getUIArgs()`, for example:

- which spaces are legal destinations
- whether a jump/branch choice is available
- preview distance or movement budget

## NetworkGraph

Use a network board for cities/routes, connected maps, or node-based movement.

### App logic

- Read with `ctx.state.networkBoard`
- Mutate with `ctx.apis.networkApi`
- Most common writes:
  - `updateNode(boardId, nodeId, owner?, typeId?, label?, properties?)`
  - `placeEdge(boardId, from, to)`
  - `updateEdge(boardId, edgeId, owner?, typeId?, label?, properties?)`
  - `movePiece(boardId, pieceId, toNodeId)`
  - `removePiece(boardId, pieceId)`

```ts
ctx.apis.networkApi.placeEdge("route-map", "paris", "berlin");
ctx.apis.networkApi.updateEdge(
  "route-map",
  ["paris", "berlin"],
  playerId,
  "claimed-route",
  "3",
  { cost: 3 },
);
```

### Frontend

- Read authoritative board state with `useNetworkBoard(boardId)`
- Render with `NetworkGraph`
- Use `useNetworkGraph(nodes, edges, pieces)` for extra adjacency helpers in the UI

```tsx
const { nodes, edges, pieces } = useNetworkBoard("route-map");

<NetworkGraph
  nodes={nodes}
  edges={edges}
  pieces={pieces}
  renderNode={(node, nodePieces) => (
    <CityNode node={node} pieces={nodePieces} />
  )}
  renderEdge={(edge, fromNode, toNode) => (
    <RouteEdge edge={edge} from={fromNode} to={toNode} />
  )}
  renderPiece={(piece, position) => (
    <Traveler piece={piece} position={position} />
  )}
/>;
```

## ZoneMap

`ZoneMap` is not backed by `boardDefinitions` or `BoardApi`.

Use it when your game is better expressed as named areas with adjacency and piece stacks, but you do not need one of Dreamboard's engine-native board models.

### App logic

Keep canonical data in normal game state, for example:

- global state for zone control, region status, or invasion state
- player state for per-player claims or influence
- cards/decks/hands if the zone state is derived from another engine primitive

Then build UI-friendly arrays in `getUIArgs()`:

```ts
getUIArgs(ctx) {
  return {
    zones: [
      {
        id: "north",
        name: "North",
        adjacentTo: ["center"],
        type: "land",
        shape: {
          type: "polygon",
          points: [
            { x: 0, y: 0 },
            { x: 120, y: 0 },
            { x: 80, y: 80 },
          ],
          center: { x: 60, y: 30 },
        },
      },
    ],
    pieces: [
      { id: "army-a", zoneId: "north", type: "army", owner: "player-1", count: 3 },
    ],
  };
}
```

### Frontend

```tsx
const { warPhase } = useUIArgs();
const zoneApi = useZoneMap(warPhase.zones, warPhase.pieces);

<ZoneMap
  zones={warPhase.zones}
  pieces={warPhase.pieces}
  renderZone={(zone, pieces) => (
    <ZoneView
      zone={zone}
      pieces={pieces}
      adjacent={zoneApi.getAdjacentZones(zone.id)}
    />
  )}
/>;
```

Treat the arrays passed to `ZoneMap` as a projection of app state, not as the authoritative source themselves.

## SlotSystem

`SlotSystem` is also UI-only. Use it for worker placement and action-slot layouts when the engine does not need a formal board type.

### App logic

Keep authoritative slot occupancy in state you control, then return:

- `slots`: definitions, capacity, grouping, cost, reward, labels
- `occupants`: current worker placements

```ts
getUIArgs(ctx) {
  return {
    slots: [
      {
        id: "gather-wood",
        name: "Gather Wood",
        capacity: 1,
        exclusive: true,
        group: "resources",
        reward: { wood: 2 },
      },
    ],
    occupants: [
      {
        pieceId: "worker-1",
        playerId: "player-1",
        slotId: "gather-wood",
      },
    ],
  };
}
```

### Frontend

```tsx
const { placementPhase } = useUIArgs();
const slotApi = useSlotSystem(placementPhase.slots, placementPhase.occupants);

<SlotSystem
  slots={placementPhase.slots}
  occupants={placementPhase.occupants}
  layout="grouped"
  renderSlot={(slot, occupants) => (
    <SlotView
      slot={slot}
      occupants={occupants}
      remainingCapacity={slotApi.getRemainingCapacity(slot.id)}
    />
  )}
/>;
```

## Recommended Data Split

Use this rule of thumb:

- authoritative rule state: `ctx.state.*` plus engine mutations through `ctx.apis.*`
- board geometry and ownership for native boards: read directly in React with `use*Board(boardId)`
- temporary view state: `getUIArgs()`
- UI-only board patterns such as zones and slots: build arrays in `getUIArgs()` from authoritative app state

If the UI can recompute something cheaply from a board hook, do not also pass it through `getUIArgs()`.
