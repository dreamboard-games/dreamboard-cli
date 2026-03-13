/**
 * useNetworkGraph hook - Utilities for network graph operations
 *
 * Provides basic graph traversal and lookup utilities.
 * Game-specific logic (pathfinding, scoring) should be implemented by the parent.
 *
 * @example
 * ```tsx
 * const graphApi = useNetworkGraph(nodes, edges, pieces);
 *
 * // Get connected nodes
 * const neighbors = graphApi.getConnectedNodes('atlanta');
 *
 * // Check if adjacent
 * const isAdjacent = graphApi.areAdjacent('atlanta', 'chicago');
 *
 * // Get pieces on a node
 * const pieces = graphApi.getPiecesOnNode('miami');
 * ```
 */

import { useMemo } from "react";
import type {
  NetworkNode,
  NetworkEdge,
  NetworkPiece,
} from "../components/board/NetworkGraph.js";

export interface NetworkGraphApi {
  /** Get a node by ID */
  getNode: (nodeId: string) => NetworkNode | undefined;

  /** Get an edge by ID */
  getEdge: (edgeId: string) => NetworkEdge | undefined;

  /** Get all nodes connected to a given node */
  getConnectedNodes: (nodeId: string) => string[];

  /** Get all edges connected to a given node */
  getEdgesForNode: (nodeId: string) => NetworkEdge[];

  /** Get edges between two specific nodes */
  getEdgesBetween: (nodeA: string, nodeB: string) => NetworkEdge[];

  /** Check if two nodes are directly connected */
  areAdjacent: (nodeA: string, nodeB: string) => boolean;

  /** Get pieces on a specific node */
  getPiecesOnNode: (nodeId: string) => NetworkPiece[];
}

/**
 * Hook providing graph utilities for network-based games
 */
export function useNetworkGraph(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  pieces: NetworkPiece[] = [],
): NetworkGraphApi {
  return useMemo(() => {
    // Build lookup maps
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const edgeMap = new Map(edges.map((e) => [e.id, e]));

    // Build adjacency list
    const adjacency: Record<
      string,
      Array<{ nodeId: string; edge: NetworkEdge }>
    > = {};
    nodes.forEach((n) => {
      adjacency[n.id] = [];
    });

    edges.forEach((edge) => {
      adjacency[edge.from]?.push({ nodeId: edge.to, edge });
      adjacency[edge.to]?.push({ nodeId: edge.from, edge });
    });

    // Group pieces by node
    const piecesByNode: Record<string, NetworkPiece[]> = {};
    pieces.forEach((p) => {
      const existing = piecesByNode[p.nodeId];
      if (existing) {
        existing.push(p);
      } else {
        piecesByNode[p.nodeId] = [p];
      }
    });

    return {
      getNode: (nodeId) => nodeMap.get(nodeId),

      getEdge: (edgeId) => edgeMap.get(edgeId),

      getConnectedNodes: (nodeId) => {
        return (adjacency[nodeId] ?? []).map((a) => a.nodeId);
      },

      getEdgesForNode: (nodeId) => {
        return (adjacency[nodeId] ?? []).map((a) => a.edge);
      },

      getEdgesBetween: (nodeA, nodeB) => {
        return edges.filter(
          (e) =>
            (e.from === nodeA && e.to === nodeB) ||
            (e.from === nodeB && e.to === nodeA),
        );
      },

      areAdjacent: (nodeA, nodeB) => {
        return (adjacency[nodeA] ?? []).some((a) => a.nodeId === nodeB);
      },

      getPiecesOnNode: (nodeId) => {
        return piecesByNode[nodeId] ?? [];
      },
    };
  }, [nodes, edges, pieces]);
}
