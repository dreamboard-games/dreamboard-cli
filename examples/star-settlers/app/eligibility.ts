/**
 * Centralised board-eligibility helpers for Star Settlers interactions.
 *
 * Each interaction's `boardInput.vertex/edge/space` collector references one
 * of these helpers as its `eligibleTargets` callback. That keeps the rule
 * (e.g. "outpost vertex must be land, unoccupied, and respect distance")
 * in one place instead of being duplicated between the reducer's
 * `validate()` and the UI's hover layer:
 *
 *   - `validate()` rejects submissions that don't pass the full rule and
 *     stays authoritative.
 *   - The helpers here project the same predicates into a list, which the
 *     host runtime ships on `descriptor.eligibleTargets` so the UI can
 *     paint idle / hover cues without rebuilding a board graph.
 *
 * Helpers take the same `(state, playerId, q)` trio as the input-collector
 * `eligibleTargets` hook so they can be wired in directly.
 */

import type { GameState, SetupPhaseState } from "./game-contract";
import { buildingAt, raiderSpaceId, routeAt, type Q } from "./reducer-support";
import { boardTarget } from "@dreamboard/app-sdk/reducer";
import {
  boardHelpers,
  type EdgeId,
  type PlayerId,
  type SpaceId,
  type VertexId,
} from "../shared/manifest-contract";

/**
 * `GameState.phase` is a union across every phase state schema (typed as
 * `object` at the contract surface). Input-collector eligibility helpers
 * don't get automatic phase narrowing the way phase-bound `defineInteraction`
 * `validate` / `reduce` do, so this helper funnels the `flow.currentPhase`
 * discriminator into a typed cast.
 */
function setupPhase(state: GameState): SetupPhaseState | null {
  return state.flow.currentPhase === "setup"
    ? (state.phase as SetupPhaseState)
    : null;
}

const SECTOR = "sector" as const;
const SPACE_KINDS = boardHelpers.spaceKinds(SECTOR);

function isLandSpaceId(spaceId: SpaceId): boolean {
  return SPACE_KINDS[spaceId] === "land";
}

function isLandVertex(q: Q, vertexId: VertexId): boolean {
  const vertex = q.board.vertex(SECTOR, vertexId);
  return (vertex?.spaceIds ?? []).some(isLandSpaceId);
}

function isLandEdge(q: Q, edgeId: EdgeId): boolean {
  const edge = q.board.edge(SECTOR, edgeId);
  return (edge?.spaceIds ?? []).some(isLandSpaceId);
}

/** Does `vertexId` satisfy Star Settlers "no neighbours" distance rule? */
function distanceRuleOk(state: GameState, q: Q, vertexId: VertexId): boolean {
  for (const edgeId of q.board.incidentEdges(SECTOR, vertexId)) {
    const [v1, v2] = q.board.incidentVertices(SECTOR, edgeId) as [
      VertexId | undefined,
      VertexId | undefined,
    ];
    const adj = v1 === vertexId ? v2 : v2 === vertexId ? v1 : null;
    if (adj && buildingAt(state, q, adj)) return false;
  }
  return true;
}

function isAdjacentToOwnRoute(
  state: GameState,
  q: Q,
  vertexId: VertexId,
  playerId: PlayerId,
): boolean {
  for (const edgeId of q.board.incidentEdges(SECTOR, vertexId)) {
    if (routeAt(state, q, edgeId)?.ownerId === playerId) {
      return true;
    }
  }
  return false;
}

function isAdjacentToOwnBuilding(
  state: GameState,
  q: Q,
  edgeId: EdgeId,
  playerId: PlayerId,
): boolean {
  for (const vertexId of q.board.incidentVertices(SECTOR, edgeId)) {
    if (buildingAt(state, q, vertexId)?.ownerId === playerId) {
      return true;
    }
  }
  return false;
}

/**
 * "Connected network" rule for playerTurn route placement: an edge is
 * eligible if some endpoint vertex either (a) holds the player's own
 * building, or (b) is adjacent via a different edge that already carries
 * the player's route *and* isn't blocked by an opponent's building on the
 * shared vertex (Star Settlers classic break rule).
 */
function isConnectedRouteTarget(
  state: GameState,
  q: Q,
  edgeId: EdgeId,
  playerId: PlayerId,
): boolean {
  for (const vertexId of q.board.incidentVertices(SECTOR, edgeId)) {
    const building = buildingAt(state, q, vertexId);
    if (building?.ownerId === playerId) return true;
    if (building && building.ownerId !== playerId) continue;
    for (const otherEdgeId of q.board.incidentEdges(SECTOR, vertexId)) {
      if (otherEdgeId === edgeId) continue;
      if (routeAt(state, q, otherEdgeId)?.ownerId === playerId) {
        return true;
      }
    }
  }
  return false;
}

// ── Public helpers ──────────────────────────────────────────────────────────

export const setupOutpostTarget = boardTarget
  .vertex<GameState, VertexId>(SECTOR)
  .where({
    id: "setupStep",
    errorCode: "SETUP_SETTLEMENT_NOT_PENDING",
    message: "Place your setup outpost first.",
    test: ({ state }) => {
      const phase = setupPhase(state);
      return !!phase && !phase.placedOutpost;
    },
  })
  .where({
    id: "land",
    errorCode: "OCEAN_VERTEX",
    message: "Cannot place an outpost on the deep space.",
    test: ({ q, targetId }) => isLandVertex(q, targetId),
  })
  .where({
    id: "empty",
    errorCode: "VERTEX_OCCUPIED",
    message: "That vertex is already occupied.",
    test: ({ state, q, targetId }) => !buildingAt(state, q, targetId),
  })
  .where({
    id: "distance",
    errorCode: "DISTANCE_RULE",
    message: "Too close to another outpost.",
    test: ({ state, q, targetId }) => distanceRuleOk(state, q, targetId),
  })
  .build();

export const setupRouteTarget = boardTarget
  .edge<GameState, EdgeId>(SECTOR)
  .where({
    id: "setupStep",
    errorCode: "SETUP_ROAD_NOT_PENDING",
    message: "Place your setup outpost before the route.",
    test: ({ state }) => {
      const phase = setupPhase(state);
      return !!phase && phase.placedOutpost;
    },
  })
  .where({
    id: "touchesLand",
    errorCode: "OCEAN_EDGE",
    message: "Cannot build a route on deep space.",
    test: ({ q, targetId }) => isLandEdge(q, targetId),
  })
  .where({
    id: "empty",
    errorCode: "EDGE_OCCUPIED",
    message: "That edge already has a route.",
    test: ({ state, q, targetId }) => !routeAt(state, q, targetId),
  })
  .where({
    id: "adjacentOutpost",
    errorCode: "NOT_CONNECTED",
    message: "Route must connect to your outpost.",
    test: ({ state, q, targetId, playerId }) =>
      isAdjacentToOwnBuilding(state, q, targetId, playerId),
  })
  .build();

export const buildOutpostTarget = boardTarget
  .vertex<GameState, VertexId>(SECTOR)
  .where({
    id: "land",
    errorCode: "OCEAN_VERTEX",
    message: "Cannot place an outpost on the deep space.",
    test: ({ q, targetId }) => isLandVertex(q, targetId),
  })
  .where({
    id: "empty",
    errorCode: "VERTEX_OCCUPIED",
    message: "That vertex is occupied.",
    test: ({ state, q, targetId }) => !buildingAt(state, q, targetId),
  })
  .where({
    id: "distance",
    errorCode: "DISTANCE_RULE",
    message: "Too close to another outpost.",
    test: ({ state, q, targetId }) => distanceRuleOk(state, q, targetId),
  })
  .where({
    id: "adjacentRoute",
    errorCode: "NOT_CONNECTED_TO_ROAD",
    message: "Must be adjacent to your route.",
    test: ({ state, q, targetId, playerId }) =>
      isAdjacentToOwnRoute(state, q, targetId, playerId),
  })
  .build();

export const upgradeToHubTarget = boardTarget
  .vertex<GameState, VertexId>(SECTOR)
  .where({
    id: "ownOutpost",
    errorCode: "NO_SETTLEMENT",
    message: "No outpost to upgrade.",
    test: ({ state, q, targetId, playerId }) => {
      const building = buildingAt(state, q, targetId);
      return building?.ownerId === playerId && building.kind === "outpost";
    },
  })
  .build();

export const buildRouteTarget = boardTarget
  .edge<GameState, EdgeId>(SECTOR)
  .where({
    id: "touchesLand",
    errorCode: "OCEAN_EDGE",
    message: "Cannot build a route on deep space.",
    test: ({ q, targetId }) => isLandEdge(q, targetId),
  })
  .where({
    id: "empty",
    errorCode: "EDGE_OCCUPIED",
    message: "That edge already has a route.",
    test: ({ state, q, targetId }) => !routeAt(state, q, targetId),
  })
  .where({
    id: "connected",
    errorCode: "NOT_CONNECTED",
    message: "Route must connect to your network.",
    test: ({ state, q, targetId, playerId }) =>
      isConnectedRouteTarget(state, q, targetId, playerId),
  })
  .build();

export const raiderSpaceTarget = boardTarget
  .space<GameState, SpaceId>(SECTOR)
  .where({
    id: "land",
    errorCode: "OCEAN_SPACE",
    message: "Move the raider to a land hex.",
    test: ({ targetId }) => isLandSpaceId(targetId),
  })
  .where({
    id: "different",
    errorCode: "SAME_SPACE",
    message: "Must move raider to a different hex.",
    test: ({ q, targetId }) => targetId !== raiderSpaceId(q),
  })
  .build();
