# @dreamboard/ui-sdk

Reducer-native UI SDK for Dreamboard game workspaces.

## Authored API

Game UIs should import authored hooks from `@dreamboard/ui-sdk`. The default
UI component files now scaffold into local game workspaces under
`ui/components/dreamboard`.

Supported authored hooks:

- `useGameView()`
- `useGameSelector(selector)`
- `useActions()`
- `usePrompt(promptId)`
- `useChoicePrompt(promptId)`
- `useGameplayPrompts()`
- `useGameplayWindows()`
- `usePluginSession()`
- `useLobby()`
- `useMe()`
- `usePlayerInfo()`

Scaffolded local components include:

- `PluginRuntime`
- `ErrorBoundary`
- `ToastProvider`
- `GameSkeleton`
- `Card`
- `Hand`
- `PlayArea`
- `PlayerInfo`
- `HexGrid`
- `TrackBoard`
- `NetworkGraph`
- `SquareGrid`
- `ZoneMap`
- `SlotSystem`
- top-level board helper exports such as `DefaultNetworkNode`,
  `DefaultNetworkEdge`, `DefaultZone`, `DefaultTrackSpace`, and
  `DefaultSlotItem`
- action/status primitives such as `ActionButton`, `ActionPanel`,
  `PhaseIndicator`, `ResourceCounter`, and `CostDisplay`

`ActionButton` accepts normal React `children` as its primary label surface and
keeps `label` as an accessibility fallback.

Raw gameplay state hooks, raw board hooks, and runtime bootstrap internals are
not part of the authored surface anymore.

## Data Model

Reducer-native plugins receive:

- player-facing reducer view data
- current phase
- available actions
- prompts
- windows
- lobby/session metadata

For simple reducer-owned prompt flows, prefer `usePrompt()` or
`useChoicePrompt()` over manual `useGameplayPrompts(...)[0]` handling.

They do not receive raw table-state snapshots.

Preferred authored reducer-native types:

- `ViewCard`
- `CardCollection`
- `HexTileState`
- `HexEdgeState`
- `HexVertexState`
- `ViewSlotOccupant`

Use `typeId` for reducer-native tile, edge, vertex, and piece rendering
discrimination.

## Reducer-Native Patterns

### Cards

Project card collections directly from reducer queries:

```ts
const q = createTableQueries(state.table);

return {
  hand: q.zone.playerCardCollection(playerId, "captain-hand"),
};
```

Read them in UI without remapping:

```tsx
const view = useGameView();
const handCards = useCards(view.hand);
```

### Tiled Boards

Project reducer board state directly into the view and pass it through to the
board hook or component unchanged:

```tsx
const view = useGameView();
const board = useHexBoard(view.board);

return (
  <HexGrid
    {...view.board}
    renderTile={(tile) => (
      <DefaultHexTile size={48} fill={palette[tile.typeId ?? "plain"]} />
    )}
    renderEdge={(edge, position) => (
      <DefaultHexEdge
        position={position}
        color={edge.owner ? "#2563eb" : "#94a3b8"}
      />
    )}
    renderVertex={(vertex, position) => (
      <DefaultHexVertex
        position={position}
        color={vertex.owner ? "#16a34a" : "#94a3b8"}
      />
    )}
  />
);
```

Interactive edge and vertex callbacks preserve the board's reducer-derived ID
types instead of widening to `string`.

`HexGrid` uses one coordinate model for edges and vertices:

- `renderTile` still renders with the tile centered at `(0, 0)`.
- `renderEdge`, `renderInteractiveEdge`, `renderVertex`, and
  `renderInteractiveVertex` all receive absolute SVG coordinates.
- For edges, `position.edgeAngle` follows the visible edge line and
  `position.centerAngle` follows the hex-center-to-hex-center line.

```tsx
<HexGrid
  {...view.board}
  interactiveEdges={true}
  renderInteractiveEdge={(edge, position, isHovered) => (
    <rect
      x={position.midX - 18}
      y={position.midY - 4}
      width={36}
      height={8}
      rx={4}
      fill={isHovered ? "#f97316" : "#cbd5e1"}
      transform={`rotate(${position.edgeAngle} ${position.midX} ${position.midY})`}
    />
  )}
/>
```

### Slots

Reducer views should expose slot occupants directly as `ViewSlotOccupant[]`:

```ts
return {
  occupants: [{ pieceId: "worker-1", playerId: null, slotId: "market" }],
};
```

```tsx
<SlotSystem
  slots={view.slots}
  occupants={view.occupants}
  renderSlot={(slot, occupants) => <MySlot slot={slot} occupants={occupants} />}
/>
```

### Track Boards

`TrackBoard` remains the explicit presentation adapter exception. Convert a
reducer-projected generic board with `toTrackBoardData(...)`:

```tsx
const track = toTrackBoardData(view.board, {
  layout: { type: "linear" },
  pieces: view.pieces,
});
```

## Example

```tsx
import { useActions, useGameView, usePluginSession } from "@dreamboard/ui-sdk";
import { createRoot } from "react-dom/client";
import {
  ErrorBoundary,
  GameSkeleton,
  PluginRuntime,
  ToastProvider,
} from "./components/dreamboard";

function AppLoader() {
  const { status } = usePluginSession();

  if (status === "loading") {
    return <GameSkeleton variant="default" message="Loading game..." />;
  }

  return <App />;
}

function App() {
  const phase = useActions();
  const view = useGameView();

  return (
    <main>
      <h1>Phase: {phase.phase}</h1>
      <pre>{JSON.stringify(view, null, 2)}</pre>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <PluginRuntime>
      <ToastProvider>
        <AppLoader />
      </ToastProvider>
    </PluginRuntime>
  </ErrorBoundary>,
);
```

## Authoring Rules

1. Put durable game logic in reducers under `app/`.
2. Put player-facing derived data in reducer views.
3. Read that data in React with `useGameView()` or `useGameSelector(...)`.
4. Submit gameplay through `useActions()`.
5. Feed board/card/resource components from reducer view data, not from raw
   engine state.
6. For one-prompt flows, prefer the additive prompt-flow helpers in
   `@dreamboard/app-sdk/reducer` plus `usePrompt()` / `useChoicePrompt()`.

## References

- Workspace reference:
  `/Users/kevintang/code/exp/examples/things-in-rings`
- Use `examples/things-in-rings` and scaffolded workspace UI files as the
  canonical reducer-native reference implementation.
