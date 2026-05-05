# Static views

Use defineStaticView for immutable session-scoped projection such as decorated board topology.

Static views project immutable data once per reducer session. They receive only the manifest and static queries, so they cannot accidentally include per-player or per-turn state.

```ts
export const boardStatic = defineStaticView<GameContract>()({
  project: ({ q }) => {
    const board = q.board.hex("island");
    return {
      ...board,
      portsByVertexId: computePorts(board),
    };
  },
});
```

Register it in `defineGame`:

```ts
export default defineGame({
  contract: gameContract,
  phases,
  views: { player: playerView },
  staticView: boardStatic,
});
```

## What belongs in static views

Good static-view data:

- board topology
- precomputed board decoration
- labels and ids derived from manifest literals
- fixed layout data for UI surfaces
- static adjacency lookup tables

Bad static-view data:

- current pieces on spaces
- active player
- card locations
- resource balances
- prompts or available actions
- anything dependent on `state`, `playerId`, or `runtime`

Those belong in [Views](./views.md), interactions, or table queries.

## Static query surface

Static views use manifest-backed static queries:

```ts
const board = q.board.get("map");
const hex = q.board.hex("island");
const square = q.board.square("grid");
```

Use this instead of rebuilding board topology manually in the workspace.

## Why static views matter

Large board topology can dominate runtime update payloads if it is projected on every action. Static views move that data into a once-per-session payload and let dynamic views focus on changing state.

Keep game-specific decoration local. If the access pattern is broadly reusable, it should become an SDK query instead of repeated workspace code.
