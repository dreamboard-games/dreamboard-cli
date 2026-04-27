import { z } from "zod";
import {
  createReducerOps,
  createStateQueries,
  defineAction,
  defineGame,
  definePhase,
  defineView,
  pipe,
} from "@dreamboard/app-sdk/reducer";
import { gameContract, type GameState } from "./game-contract";
import { ids } from "../shared/manifest-contract";

const ops = createReducerOps<GameState>();

const playerView = defineView<typeof gameContract>()({
  project({ state }) {
    const q = createStateQueries(state);
    return {
      hexBoard: q.board.tiled("frontier-map"),
      squareBoard: q.board.tiled("arena-grid"),
    };
  },
});

const claimHexEdge = defineAction<typeof gameContract>()({
  params: z.object({
    edgeId: ids.edgeId,
  }),
  reduce({ state, accept }) {
    return accept(state);
  },
});

const claimHexVertex = defineAction<typeof gameContract>()({
  params: z.object({
    vertexId: ids.vertexId,
  }),
  reduce({ state, accept }) {
    return accept(state);
  },
});

const claimSquareEdge = defineAction<typeof gameContract>()({
  params: z.object({
    edgeId: ids.edgeId,
  }),
  reduce({ state, accept }) {
    return accept(state);
  },
});

const claimSquareVertex = defineAction<typeof gameContract>()({
  params: z.object({
    vertexId: ids.vertexId,
  }),
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
      state: z.object({}),
      initialState: () => ({}),
      enter({ state, playerOrder, accept }) {
        return accept(pipe(state, ops.setActivePlayers(playerOrder)));
      },
      actions: {
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
