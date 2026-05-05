/**
 * App-owned reducer helpers for Star Settlers.
 *
 * This file deliberately does NOT expose resource helpers (`canAfford`,
 * `spendResources`, …). Those live in the SDK:
 *
 *   - Queries: `q.player.canAfford(playerId, amounts)`,
 *              `q.player.resources(playerId)`, `q.player.resource(...)`,
 *              `q.player.missingResources(...)`
 *   - Writers: `ops.spendResources(...)`, `ops.addResources(...)`,
 *              `ops.transferResources(...)`, `ops.setResource(...)`
 *
 * Authoring a reducer should *never* need to mutate `table.resources`
 * directly or spread it by hand.
 */

import type {
  ReducerOps,
  TableQueriesOfState,
} from "@dreamboard/app-sdk/reducer";
import type {
  CountsById,
  EdgeBuilding,
  GameState,
  PortType,
  PublicState,
  Terrain,
  VertexBuilding,
} from "./game-contract";
import {
  idGuards,
  ids,
  literals,
  type EdgeId,
  type PieceId,
  type PieceStateById,
  type PlayerId,
  type ResourceId,
  type SpaceId,
  type VertexId,
} from "../shared/manifest-contract";

/** A map of resource ids → counts. Used for build/trade costs. */
export type ResourceDelta = CountsById;

/**
 * Handy type aliases for authors of this game. The framework injects `ops`
 * and `q` into every reducer callback, so author-written helpers should
 * accept these injected values as arguments instead of re-constructing
 * them from `state`.
 */
export type Ops = ReducerOps<GameState>;
export type Q = TableQueriesOfState<GameState>;

const SECTOR = "sector" as const;
type StarSettlersPieceType = "route" | "outpost" | "hub" | "raider";

function sectorPiece(q: Q, componentId: string): PieceStateById[PieceId] | null {
  if (!idGuards.isPieceId(componentId)) return null;
  return q.component.data(componentId) ?? null;
}

function isDetached(q: Q, componentId: PieceId): boolean {
  return q.component.location(componentId)?.type === "Detached";
}

function ownerIdOf(piece: PieceStateById[PieceId]): PlayerId | null {
  const parsed = ids.playerId.nullable().optional().safeParse(piece.ownerId);
  return parsed.success ? (parsed.data ?? null) : null;
}

export function findDetachedPieces(
  q: Q,
  playerId: PlayerId,
  pieceTypeId: Exclude<StarSettlersPieceType, "raider">,
  count: number,
): PieceId[] {
  const found: PieceId[] = [];
  for (const pieceId of literals.pieceIds) {
    const piece = sectorPiece(q, pieceId);
    if (
      piece?.pieceTypeId === pieceTypeId &&
      piece.ownerId === playerId &&
      isDetached(q, pieceId)
    ) {
      found.push(pieceId);
      if (found.length === count) return found;
    }
  }
  throw new Error(
    `No detached ${pieceTypeId} piece available for player '${playerId}'.`,
  );
}

export function buildingAt(
  _state: GameState,
  q: Q,
  vertexId: VertexId,
): VertexBuilding | null {
  for (const componentId of q.board.vertexOccupants(SECTOR, vertexId)) {
    const piece = sectorPiece(q, componentId);
    if (piece?.pieceTypeId !== "outpost" && piece?.pieceTypeId !== "hub") {
      continue;
    }
    const ownerId = ownerIdOf(piece);
    if (!ownerId) continue;
    return {
      ownerId,
      kind: piece.pieceTypeId,
    };
  }
  return null;
}

export function routeAt(
  _state: GameState,
  q: Q,
  edgeId: EdgeId,
): EdgeBuilding | null {
  for (const componentId of q.board.edgeOccupants(SECTOR, edgeId)) {
    const piece = sectorPiece(q, componentId);
    if (piece?.pieceTypeId !== "route") continue;
    const ownerId = ownerIdOf(piece);
    if (!ownerId) continue;
    return { ownerId };
  }
  return null;
}

export function outpostPieceAt(
  _state: GameState,
  q: Q,
  vertexId: VertexId,
  playerId: PlayerId,
): PieceId | null {
  for (const componentId of q.board.vertexOccupants(SECTOR, vertexId)) {
    const piece = sectorPiece(q, componentId);
    if (piece?.pieceTypeId === "outpost" && piece.ownerId === playerId) {
      return piece.id;
    }
  }
  return null;
}

export function coloniesByVertexId(
  state: GameState,
  q: Q,
): Record<string, VertexBuilding> {
  const out: Record<string, VertexBuilding> = {};
  for (const vertexId of literals.vertexIds) {
    const building = buildingAt(state, q, vertexId);
    if (building) out[vertexId] = building;
  }
  return out;
}

export function routesByEdgeId(
  state: GameState,
  q: Q,
): Record<string, EdgeBuilding> {
  const out: Record<string, EdgeBuilding> = {};
  for (const edgeId of literals.edgeIds) {
    const route = routeAt(state, q, edgeId);
    if (route) out[edgeId] = route;
  }
  return out;
}

export function raiderSpaceId(q: Q): SpaceId {
  const location = q.component.space("raider");
  if (!location) {
    throw new Error("Raider piece is not on a board space.");
  }
  return location.spaceId;
}

/**
 * Keys of `PublicState` whose value is a per-player integer counter
 * (`Record<PlayerId, number>`). Used by `incrementPlayerScalar` to narrow
 * the allowed field argument and defend against accidental typos.
 */
type PerPlayerScalarKey = {
  [K in keyof PublicState]: PublicState[K] extends Partial<
    Record<PlayerId, number>
  >
    ? K
    : never;
}[keyof PublicState];

/**
 * Bump a per-player integer counter on `publicState` by `amount` (default
 * `1`). Returns a functional patch suitable for
 * `ops.patchPublicState(...)`. Prefer this over hand-spreading the map so
 * call sites stay a single line and counter names are type-checked.
 *
 * Example:
 *   ops.patchPublicState(incrementPlayerScalar("patrolsDeployed", playerId))
 */
export function incrementPlayerScalar(
  field: PerPlayerScalarKey,
  playerId: PlayerId,
  amount = 1,
): (pub: PublicState) => PublicState {
  return (pub) => {
    const current = pub[field] as Partial<Record<PlayerId, number>>;
    return {
      ...pub,
      [field]: {
        ...current,
        [playerId]: (current[playerId] ?? 0) + amount,
      },
    };
  };
}

export const TERRAIN_RESOURCE: Readonly<Record<Terrain, ResourceId | null>> = {
  carbonCloud: "carbon",
  alloyField: "alloy",
  waterWorld: "water",
  fiberGrove: "fiber",
  crystalBelt: "crystal",
  deadZone: null,
  deepSpace: null,
};

export const INFLUENCE_TARGET = 10;
export const FLEET_COMMAND_MIN = 3;
export const LONGEST_ROUTE_MIN = 5;

export const COST_ROUTE: ResourceDelta = { carbon: 1, alloy: 1 };
export const COST_OUTPOST: ResourceDelta = {
  carbon: 1,
  alloy: 1,
  water: 1,
  fiber: 1,
};
export const COST_HUB: ResourceDelta = { water: 2, crystal: 3 };
export const COST_TECH_CARD: ResourceDelta = { water: 1, fiber: 1, crystal: 1 };

/**
 * Compute the best bank trade rate for a player and resource.
 *
 * Intersects the player's buildings against the pre-derived port-vertex map
 * (see `portsByVertex` in `app/derived.ts`). Outposts/hubs on either
 * endpoint of a relay edge grant the port's rate (2:1 for a matching-resource
 * port, 3:1 for a generic "3:1" port); otherwise the default is 4:1.
 */
export function getBestTradeRate(
  coloniesByVertexId: Record<string, { ownerId: PlayerId } | undefined>,
  portsByVertexId: Readonly<Record<string, PortType>>,
  playerId: PlayerId,
  resource: string,
): number {
  let best = 4;
  for (const [vertexId, building] of Object.entries(coloniesByVertexId)) {
    if (!building || building.ownerId !== playerId) continue;
    const portType = portsByVertexId[vertexId];
    if (!portType) continue;
    if (portType === resource) best = Math.min(best, 2);
    else if (portType === "3:1") best = Math.min(best, 3);
  }
  return best;
}

/**
 * Count building INF for one player. Used as an input for the
 * `publicInfluenceByPlayer` derived value in `app/derived.ts`.
 *
 * For INF totals (colonies + longest route + fleet command + tech cards),
 * use the `publicInfluenceByPlayer` / `winnerOf` derivations in `app/derived.ts`
 * via the `derived` resolver.
 */
export function computeColonyInfluence(
  coloniesByVertexId: Record<
    string,
    { ownerId: PlayerId; kind: string } | undefined
  >,
  playerId: PlayerId,
): number {
  let influence = 0;
  for (const building of Object.values(coloniesByVertexId)) {
    if (!building) continue;
    if (building.ownerId === playerId) {
      influence += building.kind === "hub" ? 2 : 1;
    }
  }
  return influence;
}

/**
 * Compute longest continuous route for a player via DFS over the edge
 * graph. The graph-theoretic part is game-specific and has no SDK
 * equivalent, so it lives here rather than in a `q.*` query.
 */
export function computeLongestRoute(
  playerEdges: Set<string>,
  edgeToVertices: Record<string, [string, string]>,
  vertexToEdges: Record<string, string[]>,
  coloniesByVertex: Record<string, { ownerId: PlayerId } | undefined>,
  ownerId: PlayerId,
): number {
  if (playerEdges.size === 0) return 0;

  let maxLength = 0;

  function dfs(
    currentVertex: string,
    usedEdges: Set<string>,
    length: number,
  ): void {
    maxLength = Math.max(maxLength, length);
    const edges = vertexToEdges[currentVertex] ?? [];
    for (const edge of edges) {
      if (!playerEdges.has(edge) || usedEdges.has(edge)) continue;
      const endpoints = edgeToVertices[edge];
      if (!endpoints) continue;
      const [v1, v2] = endpoints;
      if (!v1 || !v2) continue;
      const nextVertex = v1 === currentVertex ? v2 : v1;
      const building = coloniesByVertex[nextVertex];
      if (building && building.ownerId !== ownerId) continue;
      usedEdges.add(edge);
      dfs(nextVertex, usedEdges, length + 1);
      usedEdges.delete(edge);
    }
  }

  for (const edge of playerEdges) {
    const endpoints = edgeToVertices[edge];
    if (!endpoints) continue;
    const [v1, v2] = endpoints;
    if (v1) dfs(v1, new Set([edge]), 1);
    if (v2) dfs(v2, new Set([edge]), 1);
  }

  return maxLength;
}
