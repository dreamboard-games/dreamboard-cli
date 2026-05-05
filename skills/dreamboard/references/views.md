# Views

Use defineView to project dynamic player-facing state for UI and clients.

Views are the dynamic player-facing projection boundary. The UI reads a view; it should not inspect raw reducer state.

```ts
export const playerView = defineView<GameContract>()({
  project({ state, playerId, q }) {
    const scores = state.publicState.scores;
    const handCards = q.zone.playerCards(playerId, "things-hand").map((cardId) => {
      const card = q.card.get(cardId);
      return {
        id: cardId,
        label: card.name ?? cardId,
      };
    });

    return {
      phase: state.flow.currentPhase,
      myScore: scores[playerId] ?? 0,
      scores,
      handCards,
      winnerPlayerId: state.publicState.winnerPlayerId,
    };
  },
});
```

Register views in `defineGame`:

```ts
export default defineGame({
  contract: gameContract,
  phases,
  views: {
    player: playerView,
  },
});
```

The generated UI contract exposes the projected type as `GameView` and `InferView<"player">`.

## What a view can read

`project` receives:

- `state`, including public/private/hidden/phase/table data as appropriate for the runtime projection
- `playerId`
- `q`, the typed table query namespace
- `derived`, for memoized derived values
- runtime context such as current phase, player order, active players, and setup

Use `q` for table facts such as cards in a hand, board occupants, resource balances, and component locations.

## What belongs in a view

Views should shape data for UI consumption:

- labels for cards or pieces
- counts and summaries
- player-specific hand information
- current phase and step display data
- safe public slices of score and winner state

Views should not run rule validation or decide legal moves. The runtime projects interactions and eligible targets from reducer definitions.

## Static vs dynamic

Use `defineView` for data that can change during a session. Use [Static views](./static-views.md) for manifest-derived payloads that do not change after session initialization.

Avoid putting large static topology in every dynamic view update.
