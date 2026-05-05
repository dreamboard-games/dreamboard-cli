import {
  boardInput,
  defineInteraction,
  pipe,
} from "@dreamboard/app-sdk/reducer";
import {
  playerTurnPhaseStateSchema,
  type GameContract,
  type GameState,
} from "../../game-contract";
import {
  COST_HUB,
  COST_ROUTE,
  COST_OUTPOST,
  findDetachedPieces,
  outpostPieceAt,
} from "../../reducer-support";
import {
  buildRouteTarget,
  buildOutpostTarget,
  upgradeToHubTarget,
} from "../../eligibility";
import type { EdgeId, VertexId } from "../../../shared/manifest-contract";

// ── Build Route ───────────────────────────────────────────────────────────────

export const buildRoute = defineInteraction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  surface: "board-edge",
  label: "Build route",
  step: "main",
  group: "build",
  inputs: {
    edgeId: boardInput.edge<GameState, EdgeId>({
      target: buildRouteTarget,
    }),
  },
  validate({ state, input, q }) {
    if (!state.phase.diceRolled) {
      return { errorCode: "MUST_ROLL_FIRST", message: "Roll dice first." };
    }
    if (!q.player.canAfford(input.playerId, COST_ROUTE)) {
      return {
        errorCode: "INSUFFICIENT_RESOURCES",
        message: "Need 1 carbon + 1 alloy.",
      };
    }
    return null;
  },
  reduce({ state, input, accept, ops, q }) {
    const [routeId] = findDetachedPieces(q, input.playerId, "route", 1);
    return accept(
      pipe(
        state,
        ops.spendResources({ playerId: input.playerId, amounts: COST_ROUTE }),
        ops.moveComponentToEdge({
          componentId: routeId,
          boardId: "sector",
          edgeId: input.params.edgeId,
        }),
      ),
    );
  },
});

// ── Build Outpost ─────────────────────────────────────────────────────────

export const buildOutpost = defineInteraction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  surface: "board-vertex",
  label: "Build outpost",
  step: "main",
  group: "build",
  inputs: {
    vertexId: boardInput.vertex<GameState, VertexId>({
      target: buildOutpostTarget,
    }),
  },
  validate({ state, input, q }) {
    if (!state.phase.diceRolled) {
      return { errorCode: "MUST_ROLL_FIRST", message: "Roll dice first." };
    }
    if (!q.player.canAfford(input.playerId, COST_OUTPOST)) {
      return {
        errorCode: "INSUFFICIENT_RESOURCES",
        message: "Need 1 carbon + 1 alloy + 1 water + 1 fiber.",
      };
    }
    return null;
  },
  reduce({ state, input, accept, ops, q }) {
    const [outpostId] = findDetachedPieces(
      q,
      input.playerId,
      "outpost",
      1,
    );
    return accept(
      pipe(
        state,
        ops.spendResources({
          playerId: input.playerId,
          amounts: COST_OUTPOST,
        }),
        ops.moveComponentToVertex({
          componentId: outpostId,
          boardId: "sector",
          vertexId: input.params.vertexId,
        }),
      ),
    );
  },
});

// ── Upgrade to Hub ──────────────────────────────────────────────────────────

export const upgradeToHub = defineInteraction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  surface: "board-vertex",
  label: "Upgrade to hub",
  step: "main",
  group: "build",
  inputs: {
    vertexId: boardInput.vertex<GameState, VertexId>({
      target: upgradeToHubTarget,
    }),
  },
  validate({ state, input, q }) {
    if (!state.phase.diceRolled) {
      return { errorCode: "MUST_ROLL_FIRST", message: "Roll dice first." };
    }
    if (!q.player.canAfford(input.playerId, COST_HUB)) {
      return {
        errorCode: "INSUFFICIENT_RESOURCES",
        message: "Need 2 water + 3 crystal.",
      };
    }
    return null;
  },
  reduce({ state, input, accept, ops, q }) {
    const outpostId = outpostPieceAt(
      state,
      q,
      input.params.vertexId,
      input.playerId,
    );
    if (!outpostId) {
      throw new Error("No outpost piece found to upgrade.");
    }
    const [hubId] = findDetachedPieces(q, input.playerId, "hub", 1);
    return accept(
      pipe(
        state,
        ops.spendResources({ playerId: input.playerId, amounts: COST_HUB }),
        ops.moveComponentToDetached({ componentId: outpostId }),
        ops.moveComponentToVertex({
          componentId: hubId,
          boardId: "sector",
          vertexId: input.params.vertexId,
        }),
      ),
    );
  },
});
