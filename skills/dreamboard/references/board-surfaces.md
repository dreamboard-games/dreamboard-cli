# Board surfaces

Render boards and route board target interactions.

Board surfaces connect authored board inputs to React board geometry. They do
not render a board by themselves. Your UI renders SVG, canvas, or SDK board
primitives, then routes clicks through reducer-projected eligibility.

Board interactions come from `boardInput.*` collectors:

```ts
inputs: {
  vertexId: boardInput.vertex<GameState, VertexId>({
    target: buildSettlementTarget,
  }),
  edgeId: boardInput.edge<GameState, EdgeId>({
    target: buildRoadTarget,
  }),
}
```

Those targets are evaluated by the trusted bundle. React receives eligible
target ids and submits selected ids back through a surface handle.

## Surface tags

Board descriptors use one of four surface tags:

| Tag | Target kind |
| --- | --- |
| `board-vertex` | Vertex ids |
| `board-edge` | Edge ids |
| `board-space` | Space ids |
| `board-tile` | Tile ids |

`WorkspaceGameShell` includes all four tags by default. Restrict `boardSurfaces` only
when a screen should ignore a subset:

```tsx
<WorkspaceGameShell
  boardSurfaces={["board-vertex", "board-edge"]}
  board={({ eligible, select }) => (
    <RoadAndSettlementBoard
      eligibleVertices={eligible.vertex}
      eligibleEdges={eligible.edge}
      onVertexClick={(id) => select.vertex(id)}
      onEdgeClick={(id) => select.edge(id)}
    />
  )}
/>
```

## BoardSurface render prop

The lower-level component is available when you are composing your own shell:

```tsx
import { BoardSurface } from "@dreamboard/ui-sdk/components";

<BoardSurface>
  {({ interactions, armed, eligible, isEligible, arm, select }) => (
    <Board
      activeInteraction={armed?.interactionKey}
      eligibleVertices={eligible.vertex}
      onVertexClick={(id) => select(id)}
      onToolClick={(key) => arm(key)}
      canClick={(id) => isEligible(id, "vertex")}
    />
  )}
</BoardSurface>;
```

The context contains:

| Field | Meaning |
| --- | --- |
| `interactions` | Board-surface descriptors projected for the controlling seat. |
| `armedId` / `armed` | The currently armed board interaction, if any. |
| `eligible` | Merged eligible target sets by target kind. |
| `isEligible(id, kind?)` | Checks whether an id is currently eligible. |
| `arm(key)` | Arms an interaction before target selection. |
| `select(id)` | Selects a target id for the armed or auto-armed interaction. |

`autoArmSingle` is enabled by `WorkspaceGameShell`, so a screen with exactly one board
interaction can usually click targets directly.

## Target-driven dispatch

For richer boards, use the generated `useBoardInteractions` wrapper:

```tsx
import { useBoardInteractions } from "@dreamboard/ui-contract";

const board = useBoardInteractions();

return (
  <HexGrid
    board={view.board}
    interactiveVertices={board.targetLayers.vertex()}
    interactiveEdges={board.targetLayers.edge()}
  />
);
```

Use this when several interactions may accept the same geometry kind. The
hook dispatches to the available descriptor whose target rule accepts the
clicked id. If two unarmed descriptors intentionally accept the same target,
resolve the ambiguity in reducer metadata with `dispatchPriority`; higher
numbers win.

```ts
export const upgradeToCity = defineInteraction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  surface: "board-vertex",
  label: "Upgrade to city",
  group: "build",
  dispatchPriority: 10,
  inputs: {
    vertexId: boardInput.vertex<GameState, VertexId>({
      target: cityTarget,
    }),
  },
  reduce({ state, input, accept, ops }) {
    return accept(
      pipe(
        state,
        ops.moveComponentToVertex({
          componentId: "city",
          boardId: "island",
          vertexId: input.params.vertexId,
        }),
      ),
    );
  },
});
```

This is the Catan-class pattern: setup placement, normal build actions, city
upgrades, roads, robber movement, and card follow-ups can all be live without
React recalculating which vertices, edges, or spaces are legal.

## Extra inputs

Some board actions require one target plus form-like extras. Pass the extras at
selection time:

```tsx
await board.select.space(space.id, {
  stealFromPlayerId: selectedPlayerId ?? null,
});
```

The helper fills the board input that matches the target kind and carries
remaining params through to submission. It does not make illegal targets legal;
the descriptor's eligibility remains authoritative.

## Highlighting

Use projected sets for highlights:

```tsx
const eligibleVertexIds = board.eligible.vertex;

function vertexClass(vertexId: string) {
  return eligibleVertexIds.has(vertexId)
    ? "cursor-pointer stroke-amber-400"
    : "stroke-slate-300";
}
```

If React needs a rule for highlighting, make it a target rule. If React needs
static board data such as coordinates, ports, lanes, or adjacency labels, put
that in manifest topology or derived view data.

## Common traps

- Do not check "empty vertex", "connected road", or "active player" in React.
  Put those checks in target rules or interaction availability.
- Do not submit arbitrary ids from click handlers. Route through
  `select`, `board.select.*`, or a typed `InteractionHandle`.
- Do not use one generic board click handler for every game if the authored
  target kind matters. Prefer `select.vertex`, `select.edge`, `select.space`,
  or `select.tile` when using `useBoardInteractions`.

See [Inputs and targets](./inputs-and-targets.md) for authoring the
target rules that power board surfaces.
