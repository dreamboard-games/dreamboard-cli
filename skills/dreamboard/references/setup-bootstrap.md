# Setup bootstrap

Seed initial table state from setup profiles with typed shuffle, deal, and move steps.

Setup bootstrap steps move components into their starting runtime locations before normal phases run. Use them for deterministic setup work that belongs to a setup profile rather than to turn logic.

Setup profiles are usually authored through the generated `setupProfiles` helper:

```ts
import {
  dealToPlayerZone,
  setupProfiles,
  shuffle,
} from "../shared/manifest-contract";

export default setupProfiles({
  "default-setup": {
    initialPhase: "playerTurn",
    bootstrap: [
      shuffle({ type: "sharedZone", zoneId: "draw" }),
      dealToPlayerZone({
        from: { type: "sharedZone", zoneId: "draw" },
        zoneId: "hand",
        count: 5,
      }),
    ],
  },
});
```

## Step types

| Step | Use for |
| --- | --- |
| `shuffle` | Shuffle a shared zone or board container during setup. |
| `deal` | Deal from a shared zone/container to a per-player zone/container. |
| `move` | Move specific or counted components into zones, board spaces, or board containers. |

Generated helpers include:

- `shuffle`
- `dealToPlayerZone`
- `dealToPlayerBoardContainer`
- `seedSharedBoardContainer`
- `seedSharedBoardSpace`

These helpers are typed against the manifest, so invalid zone, board, space, container, card, piece, or die ids fail at author time.

## Bootstrap vs phase enter

Use bootstrap for static setup:

- shuffle starting decks
- deal opening hands
- place fixed pieces
- seed shared board spaces or containers

Use phase `enter` for dynamic setup:

- choose first player from runtime state
- branch by setup selection
- compute state fields from player count
- run setup that depends on reducer logic

It is normal to combine both: bootstrap seeds the table, then the first phase initializes active players or public state.

## Initial phase

A setup profile may override the game definition's `initialPhase`:

```ts
"short-game": {
  initialPhase: "playerTurn",
  bootstrap: [...],
}
```

Keep `initialPhase` values aligned with `gameContract.phaseNames`.
