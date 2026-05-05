import {
  boardInput,
  definePhase,
  defineInteraction,
  pipe,
} from "@dreamboard/app-sdk/reducer";
import {
  setupPhaseStateSchema,
  type GameContract,
  type GameState,
} from "../game-contract";
import { findDetachedPieces, TERRAIN_RESOURCE } from "../reducer-support";
import { setupRouteTarget, setupOutpostTarget } from "../eligibility";
import {
  idGuards,
  literals,
  type EdgeId,
  type VertexId,
} from "../../shared/manifest-contract";

// ── Place an outpost during setup ──────────────────────────────────────────
//
// Setup-phase interactions bind `setupPhaseStateSchema` via
// `defineInteraction` so `state.phase` narrows from the contract-wide
// `object` union to the phase-local shape (`round`, `playerIndex`,
// `placedOutpost`, …). `surface: "panel"` surfaces each interaction to the
// inbox.bySurface.panel list, matching the rest of the Star Settlers UI.

const placeSetupOutpost = defineInteraction<
  GameContract,
  typeof setupPhaseStateSchema
>()({
  surface: "board-vertex",
  label: "Place outpost",
  step: "outpost",
  inputs: {
    vertexId: boardInput.vertex<GameState, VertexId>({
      target: setupOutpostTarget,
    }),
  },
  validate: () => null,
  reduce({ state, input, accept, ops, q }) {
    const { vertexId } = input.params;
    const [outpostId] = findDetachedPieces(
      q,
      input.playerId,
      "outpost",
      1,
    );
    return accept(
      pipe(
        state,
        ops.moveComponentToVertex({
          componentId: outpostId,
          boardId: "sector",
          vertexId,
        }),
        ops.patchPhaseState({
          step: "route",
          placedOutpost: true,
          lastOutpostVertexId: vertexId,
        }),
      ),
    );
  },
});

// ── Place the route that follows the setup outpost ─────────────────────────

const placeSetupRoute = defineInteraction<
  GameContract,
  typeof setupPhaseStateSchema
>()({
  surface: "board-edge",
  label: "Place route",
  step: "route",
  inputs: {
    edgeId: boardInput.edge<GameState, EdgeId>({
      target: setupRouteTarget,
    }),
  },
  validate: () => null,
  reduce({ state, input, accept, fx, ops, q }) {
    const { edgeId } = input.params;
    const [routeId] = findDetachedPieces(q, input.playerId, "route", 1);

    // Snake-draft turn progression: round 0 advances forward, round 1
    // runs backward through the seating order. When we exit round 1 the
    // phase transitions to `playerTurn`.
    const turnOrder = q.player.order();
    const numPlayers = turnOrder.length;
    const { round, playerIndex, lastOutpostVertexId } = state.phase;

    let nextRound = round;
    let nextIndex = playerIndex;
    let goToPlayerTurn = false;

    if (round === 0) {
      if (playerIndex < numPlayers - 1) nextIndex = playerIndex + 1;
      else nextRound = 1;
    } else if (playerIndex > 0) {
      nextIndex = playerIndex - 1;
    } else {
      goToPlayerTurn = true;
    }

    const nextPlayerId = goToPlayerTurn ? turnOrder[0]! : turnOrder[nextIndex]!;

    // Second-outpost resource grant: award one of each adjacent
    // terrain's resource for the outpost the player placed this turn.
    // `lastOutpostVertexId` is recorded by `placeSetupOutpost`.
    const roundOneResourceOps: Array<ReturnType<typeof ops.addResources>> = [];
    if (round === 1 && lastOutpostVertexId) {
      const grant: Record<string, number> = {};
      for (const spaceId of literals.spaceIds) {
        const verts = q.board.spaceVertices("sector", spaceId);
        if (!verts.some((v) => v === lastOutpostVertexId)) continue;
        const terrain = state.publicState.terrainBySpaceId[spaceId];
        const resource = terrain ? TERRAIN_RESOURCE[terrain] : null;
        if (resource) grant[resource] = (grant[resource] ?? 0) + 1;
      }
      if (Object.keys(grant).length > 0) {
        roundOneResourceOps.push(
          ops.addResources({ playerId: input.playerId, amounts: grant }),
        );
      }
    }

    if (goToPlayerTurn) {
      return accept(
        pipe(
          state,
          ...roundOneResourceOps,
          ops.moveComponentToEdge({
            componentId: routeId,
            boardId: "sector",
            edgeId,
          }),
        ),
        [fx.transition("playerTurn")],
      );
    }

    return accept(
      pipe(
        state,
        ...roundOneResourceOps,
        ops.moveComponentToEdge({
          componentId: routeId,
          boardId: "sector",
          edgeId,
        }),
        ops.patchPhaseState({
          round: nextRound,
          playerIndex: nextIndex,
          step: "outpost",
          placedOutpost: false,
          lastOutpostVertexId: null,
        }),
        ops.setActivePlayers([nextPlayerId]),
      ),
    );
  },
});

// ── Phase ────────────────────────────────────────────────────────────────────

export const setup = definePhase<GameContract>()({
  kind: "player",
  state: setupPhaseStateSchema,
  initialState: () => ({
    round: 0,
    playerIndex: 0,
    step: "outpost" as const,
    placedOutpost: false,
    lastOutpostVertexId: null,
  }),
  actor: ({ state, q }) => q.player.order()[state.phase.playerIndex] ?? null,
  enter({ state, accept, ops, q }) {
    const deadZoneSpaceId = idGuards.expectSpaceId(
      Object.entries(state.publicState.terrainBySpaceId).find(
        ([, terrain]) => terrain === "deadZone",
      )?.[0] ?? literals.spaceIds[0],
    );
    return accept(
      pipe(
        state,
        ops.moveComponentToSpace({
          componentId: "raider",
          boardId: "sector",
          spaceId: deadZoneSpaceId,
        }),
        ops.setActivePlayers([q.player.order()[0]!]),
      ),
    );
  },
  interactions: {
    placeSetupOutpost,
    placeSetupRoute,
  },
});
