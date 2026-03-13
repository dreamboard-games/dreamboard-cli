/**
 * useHexBoard hook - Access hex board state from game state
 *
 * Provides hex board data (tiles, edges, vertices) for rendering hex-based games
 * like Catan, Hive, Twilight Imperium, etc.
 *
 * @example Basic usage
 * ```tsx
 * const { tiles, edges, vertices, getTile, getNeighbors } = useHexBoard('catan-board');
 *
 * return (
 *   <HexGrid
 *     tiles={tiles}
 *     edges={edges}
 *     vertices={vertices}
 *     renderTile={(tile) => <MyTileComponent tile={tile} />}
 *     renderEdge={(edge, pos) => <MyEdgeComponent edge={edge} position={pos} />}
 *     renderVertex={(vertex, pos) => <MyVertexComponent vertex={vertex} position={pos} />}
 *   />
 * );
 * ```
 *
 * @example With filtering
 * ```tsx
 * const { tiles, getEdgesByOwner, getVerticesByOwner } = useHexBoard('board-1');
 *
 * // Get all roads owned by current player
 * const myRoads = getEdgesByOwner(currentPlayerId);
 *
 * // Get all settlements owned by current player
 * const mySettlements = getVerticesByOwner(currentPlayerId);
 * ```
 */

import { useMemo, useCallback } from "react";
import { useGameState } from "./useGameState.js";
import type {
  HexBoardState,
  HexTileState,
  HexEdgeState,
  HexVertexState,
} from "../types/player-state.js";
import {
  BoardId,
  EdgeId,
  PlayerId,
  EdgeTypeId,
  TileId,
  TileTypeId,
  VertexId,
  VertexTypeId,
} from "@dreamboard/manifest";

// ============================================================================
// Types
// ============================================================================

export interface UseHexBoardReturn {
  /** The raw board state */
  board: HexBoardState;
  /** All tiles on the board */
  tiles: HexTileState[];
  /** All edges on the board */
  edges: HexEdgeState[];
  /** All vertices on the board */
  vertices: HexVertexState[];

  // Tile queries
  /** Get a tile by ID */
  getTile: (tileId: TileId) => HexTileState | undefined;
  /** Get a tile by axial coordinates */
  getTileAt: (q: number, r: number) => HexTileState | undefined;
  /** Get all tiles owned by a player */
  getTilesByOwner: (ownerId: PlayerId) => HexTileState[];
  /** Get all tiles of a specific type */
  getTilesByType: (typeId: TileTypeId) => HexTileState[];
  /** Get neighboring tiles */
  getNeighbors: (tileId: TileId) => HexTileState[];

  // Edge queries
  /** Get an edge by ID */
  getEdge: (edgeId: EdgeId) => HexEdgeState | undefined;
  /** Get all edges owned by a player */
  getEdgesByOwner: (ownerId: PlayerId) => HexEdgeState[];
  /** Get all edges of a specific type */
  getEdgesByType: (typeId: EdgeTypeId) => HexEdgeState[];
  /** Get edges adjacent to a tile */
  getEdgesForTile: (tileId: TileId) => HexEdgeState[];

  // Vertex queries
  /** Get a vertex by ID */
  getVertex: (vertexId: VertexId) => HexVertexState | undefined;
  /** Get all vertices owned by a player */
  getVerticesByOwner: (ownerId: PlayerId) => HexVertexState[];
  /** Get all vertices of a specific type */
  getVerticesByType: (typeId: VertexTypeId) => HexVertexState[];
  /** Get vertices adjacent to a tile */
  getVerticesForTile: (tileId: TileId) => HexVertexState[];

  // Utilities
  /** Calculate distance between two tiles */
  getDistance: (tileId1: TileId, tileId2: TileId) => number;
}

// Axial direction vectors for hex neighbors
const AXIAL_DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

/**
 * Normalize an EdgeId tuple to a string ID.
 * Matches backend logic: sort tile IDs and join with `$$`.
 *
 * @example
 * ```ts
 * const stringId = normalizeEdgeId(['tile-a', 'tile-b']);
 * // Returns: "tile-a$$tile-b"
 * ```
 */
export function normalizeEdgeId(edgeId: EdgeId): string {
  const sorted = [...edgeId].sort();
  return `${sorted[0]}$$${sorted[1]}`;
}

/**
 * Normalize a VertexId tuple to a string ID.
 * Matches backend logic: sort tile IDs and join with `$$`.
 *
 * @example
 * ```ts
 * const stringId = normalizeVertexId(['tile-a', 'tile-b', 'tile-c']);
 * // Returns: "tile-a$$tile-b$$tile-c"
 * ```
 */
export function normalizeVertexId(vertexId: VertexId): string {
  const sorted = [...vertexId].sort();
  return `${sorted[0]}$$${sorted[1]}$$${sorted[2]}`;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to access hex board state from the game state.
 *
 * @param boardId - The ID of the hex board to access
 * @returns Hex board state and query utilities
 * @throws Error if the board is not found in game state
 */
export function useHexBoard(boardId: BoardId): UseHexBoardReturn {
  const gameState = useGameState();

  const board = gameState.boards.hex[boardId];
  if (!board) {
    throw new Error(
      `useHexBoard: Hex board "${boardId}" not found in game state. ` +
        `Available boards: ${Object.keys(gameState.boards.hex).join(", ") || "none"}`,
    );
  }

  // Create lookup maps for efficient queries
  const tileById = useMemo((): Map<TileId, HexTileState> => {
    return new Map(board.tiles.map((t) => [t.id, t]));
  }, [board.tiles]);

  const tileByCoord = useMemo((): Map<`${number},${number}`, HexTileState> => {
    return new Map(board.tiles.map((t) => [`${t.q},${t.r}`, t]));
  }, [board.tiles]);

  const edgeById = useMemo((): Map<string, HexEdgeState> => {
    return new Map(board.edges.map((e) => [e.id, e]));
  }, [board.edges]);

  const vertexById = useMemo((): Map<string, HexVertexState> => {
    return new Map(board.vertices.map((v) => [v.id, v]));
  }, [board.vertices]);

  // Tile queries
  const getTile = useCallback(
    (tileId: TileId) => tileById.get(tileId),
    [tileById],
  );

  const getTileAt = useCallback(
    (q: number, r: number) => tileByCoord.get(`${q},${r}`),
    [tileByCoord],
  );

  const getTilesByOwner = useCallback(
    (ownerId: PlayerId) => board.tiles.filter((t) => t.owner === ownerId),
    [board.tiles],
  );

  const getTilesByType = useCallback(
    (typeId: TileTypeId) => board.tiles.filter((t) => t.typeId === typeId),
    [board.tiles],
  );

  const getNeighbors = useCallback(
    (tileId: TileId): HexTileState[] => {
      const tile = tileById.get(tileId);
      if (!tile) return [];

      return AXIAL_DIRECTIONS.map((dir) =>
        tileByCoord.get(`${tile.q + dir.q},${tile.r + dir.r}`),
      ).filter((t): t is HexTileState => t !== undefined);
    },
    [tileById, tileByCoord],
  );

  // Edge queries
  const getEdge = useCallback(
    (edgeId: EdgeId) => edgeById.get(normalizeEdgeId(edgeId)),
    [edgeById],
  );

  const getEdgesByOwner = useCallback(
    (ownerId: PlayerId) => board.edges.filter((e) => e.owner === ownerId),
    [board.edges],
  );

  const getEdgesByType = useCallback(
    (typeId: EdgeTypeId) => board.edges.filter((e) => e.typeId === typeId),
    [board.edges],
  );

  const getEdgesForTile = useCallback(
    (tileId: TileId) =>
      board.edges.filter((e) => e.hex1 === tileId || e.hex2 === tileId),
    [board.edges],
  );

  // Vertex queries
  const getVertex = useCallback(
    (vertexId: VertexId) => vertexById.get(normalizeVertexId(vertexId)),
    [vertexById],
  );

  const getVerticesByOwner = useCallback(
    (ownerId: PlayerId) => board.vertices.filter((v) => v.owner === ownerId),
    [board.vertices],
  );

  const getVerticesByType = useCallback(
    (typeId: VertexTypeId) => board.vertices.filter((v) => v.typeId === typeId),
    [board.vertices],
  );

  const getVerticesForTile = useCallback(
    (tileId: TileId) => board.vertices.filter((v) => v.hexes.includes(tileId)),
    [board.vertices],
  );

  // Utilities
  const getDistance = useCallback(
    (tileId1: TileId, tileId2: TileId): number => {
      const tile1 = tileById.get(tileId1);
      const tile2 = tileById.get(tileId2);
      if (!tile1 || !tile2) return Infinity;

      // Hex distance formula using axial coordinates
      return (
        (Math.abs(tile1.q - tile2.q) +
          Math.abs(tile1.q + tile1.r - tile2.q - tile2.r) +
          Math.abs(tile1.r - tile2.r)) /
        2
      );
    },
    [tileById],
  );

  return {
    board,
    tiles: board.tiles,
    edges: board.edges,
    vertices: board.vertices,
    getTile,
    getTileAt,
    getTilesByOwner,
    getTilesByType,
    getNeighbors,
    getEdge,
    getEdgesByOwner,
    getEdgesByType,
    getEdgesForTile,
    getVertex,
    getVerticesByOwner,
    getVerticesByType,
    getVerticesForTile,
    getDistance,
  };
}

/**
 * Hook to safely check if a hex board exists in game state.
 *
 * @param boardId - The ID of the hex board to check
 * @returns The board if it exists, undefined otherwise
 */
export function useHexBoardOptional(
  boardId: BoardId,
): HexBoardState | undefined {
  const gameState = useGameState();
  return gameState.boards.hex[boardId];
}

/**
 * Hook to get all available hex board IDs.
 *
 * @returns Array of hex board IDs
 */
export function useHexBoardIds(): BoardId[] {
  const gameState = useGameState();
  return Object.keys(gameState.boards.hex) as BoardId[];
}
