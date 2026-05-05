import { z } from "zod";
import {
  createReducerOps,
  createStateQueries,
  defineGame,
  definePhase,
  defineInteraction,
  defineView,
  formInput,
  pipe,
} from "@dreamboard/app-sdk/reducer";
import { gameContract, type GameState } from "./game-contract";
import { ids } from "../shared/manifest-contract";

const ops = createReducerOps<GameState>();

const setupPhaseStateSchema = z.object({});

const playerView = defineView<typeof gameContract>()({
  project({ state }) {
    const q = createStateQueries(state);
    return {
      hexBoard: q.board.tiled("frontier-map"),
      squareBoard: q.board.tiled("arena-grid"),
    };
  },
});

const claimHexEdge = defineInteraction<
  typeof gameContract,
  typeof setupPhaseStateSchema
>()({
  surface: "panel",
  inputs: {
    edgeId: formInput(ids.edgeId),
  },
  reduce({ state, accept }) {
    return accept(state);
  },
});

const claimHexVertex = defineInteraction<
  typeof gameContract,
  typeof setupPhaseStateSchema
>()({
  surface: "panel",
  inputs: {
    vertexId: formInput(ids.vertexId),
  },
  reduce({ state, accept }) {
    return accept(state);
  },
});

const claimSquareEdge = defineInteraction<
  typeof gameContract,
  typeof setupPhaseStateSchema
>()({
  surface: "panel",
  inputs: {
    edgeId: formInput(ids.edgeId),
  },
  reduce({ state, accept }) {
    return accept(state);
  },
});

const claimSquareVertex = defineInteraction<
  typeof gameContract,
  typeof setupPhaseStateSchema
>()({
  surface: "panel",
  inputs: {
    vertexId: formInput(ids.vertexId),
  },
  reduce({ state, accept }) {
    return accept(state);
  },
});

export default defineGame({
  contract: gameContract,
  initial: {
    public: ({ playerIds }) => ({
      currentPlayerId: playerIds[0] ?? null,
      notesByPlayerId: {},
    }),
    private: () => ({}),
    hidden: () => ({}),
  },
  initialPhase: "setup",
  phases: {
    setup: definePhase<typeof gameContract>()({
      kind: "player",
      state: setupPhaseStateSchema,
      initialState: () => ({}),
      enter({ state, playerOrder, accept }) {
        return accept(pipe(state, ops.setActivePlayers(playerOrder)));
      },
      interactions: {
        claimHexEdge,
        claimHexVertex,
        claimSquareEdge,
        claimSquareVertex,
      },
    }),
  },
  views: {
    player: playerView,
  },
});
