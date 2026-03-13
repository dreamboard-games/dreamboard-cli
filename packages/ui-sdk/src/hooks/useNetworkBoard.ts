/**
 * useNetworkBoard hook - Access network/graph board state from game state
 *
 * Provides network board data (nodes, edges, pieces) for rendering graph-based games
 * like Ticket to Ride, pandemic routes, power grid networks, etc.
 *
 * @example Basic usage
 * ```tsx
 * const { nodes, edges, pieces, getNode, getConnectedNodes } = useNetworkBoard('route-map');
 *
 * return (
 *   <NetworkGraph
 *     nodes={nodes}
 *     edges={edges}
 *     renderNode={(node) => <CityNode node={node} />}
 *     renderEdge={(edge) => <RouteEdge edge={edge} />}
 *   />
 * );
 * ```
 *
 * @example With pathfinding
 * ```tsx
 * const { getConnectedNodes, getEdgeBetween } = useNetworkBoard('map');
 *
 * // Check if two cities are directly connected
 * const edge = getEdgeBetween('seattle', 'portland');
 * if (edge) {
 *   console.log('Direct route exists!');
 * }
 * ```
 */

import { useMemo, useCallback } from "react";
import { useGameState } from "./useGameState.js";
import type {
  NetworkBoardState,
  NetworkNodeState,
  NetworkEdgeState,
  NetworkPieceState,
} from "../types/player-state.js";
import {
  BoardId,
  EdgeId,
  EdgeTypeId,
  PieceId,
  PieceTypeId,
  PlayerId,
  TileId,
  TileTypeId,
} from "@dreamboard/manifest";

// ============================================================================
// Utilities
// ============================================================================

/**
 * Normalize an EdgeId tuple to a string ID.
 * Matches backend logic: sort tile IDs and join with `$$`.
 *
 * @example
 * ```ts
 * const stringId = normalizeNetworkEdgeId(['node-a', 'node-b']);
 * // Returns: "node-a$$node-b"
 * ```
 */
export function normalizeNetworkEdgeId(edgeId: EdgeId): string {
  const sorted = [...edgeId].sort();
  return `${sorted[0]}$$${sorted[1]}`;
}

// ============================================================================
// Types
// ============================================================================

export interface UseNetworkBoardReturn {
  /** The raw board state */
  board: NetworkBoardState;
  /** All nodes on the board */
  nodes: NetworkNodeState[];
  /** All edges on the board */
  edges: NetworkEdgeState[];
  /** All pieces on the board */
  pieces: NetworkPieceState[];

  // Node queries
  /** Get a node by ID */
  getNode: (nodeId: TileId) => NetworkNodeState | undefined;
  /** Get all nodes owned by a player */
  getNodesByOwner: (ownerId: PlayerId) => NetworkNodeState[];
  /** Get all nodes of a specific type */
  getNodesByType: (typeId: TileTypeId) => NetworkNodeState[];
  /** Get nodes directly connected to a given node */
  getConnectedNodes: (nodeId: TileId) => NetworkNodeState[];

  // Edge queries
  /** Get an edge by ID */
  getEdge: (edgeId: EdgeId) => NetworkEdgeState | undefined;
  /** Get all edges owned by a player */
  getEdgesByOwner: (ownerId: PlayerId) => NetworkEdgeState[];
  /** Get all edges of a specific type */
  getEdgesByType: (typeId: EdgeTypeId) => NetworkEdgeState[];
  /** Get edges connected to a node */
  getEdgesForNode: (nodeId: TileId) => NetworkEdgeState[];
  /** Get edge between two specific nodes (if exists) */
  getEdgeBetween: (
    nodeId1: TileId,
    nodeId2: TileId,
  ) => NetworkEdgeState | undefined;

  // Piece queries
  /** Get a piece by ID */
  getPiece: (pieceId: PieceId) => NetworkPieceState | undefined;
  /** Get all pieces owned by a player */
  getPiecesByOwner: (ownerId: PlayerId) => NetworkPieceState[];
  /** Get all pieces of a specific type */
  getPiecesByType: (typeId: PieceTypeId) => NetworkPieceState[];
  /** Get pieces on a specific node */
  getPiecesOnNode: (nodeId: TileId) => NetworkPieceState[];

  // Utilities
  /** Check if two nodes are directly connected */
  areConnected: (nodeId1: TileId, nodeId2: TileId) => boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to access network board state from the game state.
 *
 * @param boardId - The ID of the network board to access
 * @returns Network board state and query utilities
 * @throws Error if the board is not found in game state
 */
export function useNetworkBoard(boardId: BoardId): UseNetworkBoardReturn {
  const gameState = useGameState();

  const board = gameState.boards.network[boardId];
  if (!board) {
    throw new Error(
      `useNetworkBoard: Network board "${boardId}" not found in game state. ` +
        `Available boards: ${Object.keys(gameState.boards.network).join(", ") || "none"}`,
    );
  }

  // Create lookup maps
  const nodeById = useMemo((): Map<TileId, NetworkNodeState> => {
    return new Map(board.nodes.map((n) => [n.id, n]));
  }, [board.nodes]);

  const edgeById = useMemo((): Map<string, NetworkEdgeState> => {
    return new Map(board.edges.map((e) => [e.id, e]));
  }, [board.edges]);

  const pieceById = useMemo((): Map<PieceId, NetworkPieceState> => {
    return new Map(board.pieces.map((p) => [p.id, p]));
  }, [board.pieces]);

  // Build adjacency for quick connected node lookup
  const adjacency = useMemo((): Map<TileId, Set<TileId>> => {
    const adj = new Map<TileId, Set<TileId>>();
    for (const edge of board.edges) {
      if (!adj.has(edge.from)) adj.set(edge.from, new Set());
      if (!adj.has(edge.to)) adj.set(edge.to, new Set());
      adj.get(edge.from)?.add(edge.to);
      adj.get(edge.to)?.add(edge.from);
    }
    return adj;
  }, [board.edges]);

  // Node queries
  const getNode = useCallback(
    (nodeId: TileId) => nodeById.get(nodeId),
    [nodeById],
  );

  const getNodesByOwner = useCallback(
    (ownerId: PlayerId) => board.nodes.filter((n) => n.owner === ownerId),
    [board.nodes],
  );

  const getNodesByType = useCallback(
    (typeId: TileTypeId) => board.nodes.filter((n) => n.typeId === typeId),
    [board.nodes],
  );

  const getConnectedNodes = useCallback(
    (nodeId: TileId): NetworkNodeState[] => {
      const connectedIds = adjacency.get(nodeId);
      if (!connectedIds) return [];
      return Array.from(connectedIds)
        .map((id) => nodeById.get(id))
        .filter((n): n is NetworkNodeState => n !== undefined);
    },
    [adjacency, nodeById],
  );

  // Edge queries
  const getEdge = useCallback(
    (edgeId: EdgeId) => edgeById.get(normalizeNetworkEdgeId(edgeId)),
    [edgeById],
  );

  const getEdgesByOwner = useCallback(
    (ownerId: PlayerId) => board.edges.filter((e) => e.owner === ownerId),
    [board.edges],
  );

  const getEdgesByType = useCallback(
    (typeId: string) => board.edges.filter((e) => e.typeId === typeId),
    [board.edges],
  );

  const getEdgesForNode = useCallback(
    (nodeId: TileId) =>
      board.edges.filter((e) => e.from === nodeId || e.to === nodeId),
    [board.edges],
  );

  const getEdgeBetween = useCallback(
    (nodeId1: TileId, nodeId2: TileId) =>
      board.edges.find(
        (e) =>
          (e.from === nodeId1 && e.to === nodeId2) ||
          (e.from === nodeId2 && e.to === nodeId1),
      ),
    [board.edges],
  );

  // Piece queries
  const getPiece = useCallback(
    (pieceId: PieceId) => pieceById.get(pieceId),
    [pieceById],
  );

  const getPiecesByOwner = useCallback(
    (ownerId: PlayerId) => board.pieces.filter((p) => p.owner === ownerId),
    [board.pieces],
  );

  const getPiecesByType = useCallback(
    (typeId: PieceTypeId) => board.pieces.filter((p) => p.typeId === typeId),
    [board.pieces],
  );

  const getPiecesOnNode = useCallback(
    (nodeId: TileId) => board.pieces.filter((p) => p.nodeId === nodeId),
    [board.pieces],
  );

  // Utilities
  const areConnected = useCallback(
    (nodeId1: TileId, nodeId2: TileId) => {
      const connected = adjacency.get(nodeId1);
      return connected?.has(nodeId2) ?? false;
    },
    [adjacency],
  );

  return {
    board,
    nodes: board.nodes,
    edges: board.edges,
    pieces: board.pieces,
    getNode,
    getNodesByOwner,
    getNodesByType,
    getConnectedNodes,
    getEdge,
    getEdgesByOwner,
    getEdgesByType,
    getEdgesForNode,
    getEdgeBetween,
    getPiece,
    getPiecesByOwner,
    getPiecesByType,
    getPiecesOnNode,
    areConnected,
  };
}

/**
 * Hook to safely check if a network board exists in game state.
 *
 * @param boardId - The ID of the network board to check
 * @returns The board if it exists, undefined otherwise
 */
export function useNetworkBoardOptional(
  boardId: BoardId,
): NetworkBoardState | undefined {
  const gameState = useGameState();
  return gameState.boards.network[boardId];
}

/**
 * Hook to get all available network board IDs.
 *
 * @returns Array of network board IDs
 */
export function useNetworkBoardIds(): BoardId[] {
  const gameState = useGameState();
  return Object.keys(gameState.boards.network) as BoardId[];
}
