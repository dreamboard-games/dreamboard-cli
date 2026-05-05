# Game definition

Use defineGame to assemble initial state, setup profiles, phases, views, and static views.

`defineGame` is the assembly point for a reducer-native game. It registers the contract, initial state callbacks, setup profiles, phases, dynamic views, and optional static view.

```ts
import { defineGame } from "@dreamboard/app-sdk/reducer";
import { gameContract } from "./game-contract";
import { phases } from "./phases";
import { playerView } from "./player-view";
import { boardStatic } from "./board-static";
import setupProfiles from "./setup-profiles";

export default defineGame({
  contract: gameContract,
  initial: {
    public: ({ playerIds }) => ({
      scores: Object.fromEntries(playerIds.map((id) => [id, 0])),
      winnerPlayerId: null,
    }),
    private: () => ({}),
    hidden: () => ({}),
  },
  initialPhase: "setup",
  setupProfiles,
  phases,
  views: {
    player: playerView,
  },
  staticView: boardStatic,
});
```

## Fields

| Field | Purpose |
| --- | --- |
| `contract` | The `defineGameContract` result. |
| `initial` | Optional callbacks for initial `public`, `private`, and `hidden` state. |
| `initialPhase` | Phase to enter when setup does not override it. |
| `setupProfiles` | Runtime setup presets, usually generated through `shared/manifest-contract`. |
| `phases` | Phase registry keyed by phase name. |
| `views` | Dynamic projections, commonly `{ player: playerView }`. |
| `staticView` | Optional session-scoped immutable projection. |

## Initial state

Initial callbacks receive runtime context, including player ids and setup selection. Use this when state depends on the actual player count:

```ts
public: ({ playerIds }) => ({
  scores: Object.fromEntries(playerIds.map((playerId) => [playerId, 0])),
  winnerPlayerId: null,
})
```

Do not hard-code the manifest-wide maximum player list when the session may use fewer players.

## Phase registry

Keep phase registry keys aligned with `gameContract.phaseNames`:

```ts
export const phases = {
  setup,
  playerTurn,
  endGame,
} satisfies PhaseMapOf<GameContract>;
```

`defineGame` validates the runtime shape as well, which catches dynamic phase registries that TypeScript cannot fully prove.

## Generated consumers

The generated UI and testing contracts inspect the `defineGame` result. Registered phases, interactions, card actions, stages, zones, and views become:

- `PhaseName`
- `InteractionId`
- phase-qualified `InteractionKey`
- surface-specific interaction unions
- `GameView`
- generated scenario interaction params

If a generated UI or test type is stale, rerun `dreamboard sync` or `dreamboard test generate` before patching authored code.
