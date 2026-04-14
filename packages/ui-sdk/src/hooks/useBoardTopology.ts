import { useCallback, useMemo } from "react";
import type {
  HexBoardState,
  HexEdgeState,
  HexTileState,
  HexVertexState,
  SquareBoardState,
  SquareCellState,
  SquareEdgeState,
  SquareVertexState,
} from "../types/player-state.js";

type HexBoardTopologyData = Pick<
  HexBoardState,
  "id" | "tiles" | "edges" | "vertices"
> & {
  layout?: "hex";
};

type SquareBoardTopologyData = Pick<
  SquareBoardState,
  "id" | "cells" | "edges" | "vertices"
> & {
  layout?: "square";
};

type SpaceLike = HexTileState | SquareCellState;
type EdgeLike = HexEdgeState | SquareEdgeState;
type VertexLike = HexVertexState | SquareVertexState;

export type BoardTopologyData = HexBoardTopologyData | SquareBoardTopologyData;

export interface UseBoardTopologyReturn {
  layout: "hex" | "square";
  getSpace: (spaceId: string) => SpaceLike | undefined;
  getEdge: (edgeId: string) => EdgeLike | undefined;
  getVertex: (vertexId: string) => VertexLike | undefined;
  getAdjacentSpaces: (spaceId: string) => SpaceLike[];
  getDistance: (fromSpaceId: string, toSpaceId: string) => number;
  getSpaceEdges: (spaceId: string) => EdgeLike[];
  getSpaceVertices: (spaceId: string) => VertexLike[];
  getIncidentEdges: (vertexId: string) => EdgeLike[];
  getIncidentVertices: (edgeId: string) => VertexLike[];
}

function toSpaceIds(edge: EdgeLike): string[] {
  return "spaceIds" in edge
    ? [...edge.spaceIds]
    : [edge.hex1, edge.hex2].filter(Boolean);
}

function toVertexSpaceIds(vertex: VertexLike): string[] {
  return "spaceIds" in vertex ? [...vertex.spaceIds] : [...vertex.hexes];
}

export function useBoardTopology(
  board: BoardTopologyData,
): UseBoardTopologyReturn {
  const layout = "tiles" in board ? "hex" : "square";
  const spaces = useMemo(
    () => ("tiles" in board ? board.tiles : board.cells) as SpaceLike[],
    [board],
  );
  const edges = useMemo(() => board.edges as EdgeLike[], [board.edges]);
  const vertices = useMemo(
    () => board.vertices as VertexLike[],
    [board.vertices],
  );

  const spaceById = useMemo(
    () => new Map<string, SpaceLike>(spaces.map((space) => [space.id, space])),
    [spaces],
  );
  const edgeById = useMemo(
    () => new Map<string, EdgeLike>(edges.map((edge) => [edge.id, edge])),
    [edges],
  );
  const vertexById = useMemo(
    () =>
      new Map<string, VertexLike>(
        vertices.map((vertex) => [vertex.id, vertex]),
      ),
    [vertices],
  );

  const adjacentSpaceIdsById = useMemo(() => {
    const adjacency = new Map<string, string[]>();
    for (const space of spaces) {
      adjacency.set(space.id, []);
    }
    for (const edge of edges) {
      const spaceIds = toSpaceIds(edge);
      if (spaceIds.length !== 2) {
        continue;
      }
      const [leftId, rightId] = spaceIds;
      if (!leftId || !rightId) {
        continue;
      }
      adjacency.set(leftId, [...(adjacency.get(leftId) ?? []), rightId]);
      adjacency.set(rightId, [...(adjacency.get(rightId) ?? []), leftId]);
    }
    return adjacency;
  }, [edges, spaces]);

  const getSpace = useCallback(
    (spaceId: string) => {
      return spaceById.get(spaceId);
    },
    [spaceById],
  );

  const getEdge = useCallback(
    (edgeId: string) => {
      return edgeById.get(edgeId);
    },
    [edgeById],
  );

  const getVertex = useCallback(
    (vertexId: string) => {
      return vertexById.get(vertexId);
    },
    [vertexById],
  );

  const getAdjacentSpaces = useCallback(
    (spaceId: string) => {
      return (adjacentSpaceIdsById.get(spaceId) ?? [])
        .map((adjacentSpaceId) => spaceById.get(adjacentSpaceId))
        .filter((space): space is SpaceLike => space != null);
    },
    [adjacentSpaceIdsById, spaceById],
  );

  const getDistance = useCallback(
    (fromSpaceId: string, toSpaceId: string) => {
      if (fromSpaceId === toSpaceId) {
        return 0;
      }

      const visited = new Set<string>([fromSpaceId]);
      let frontier = [fromSpaceId];
      let distance = 0;

      while (frontier.length > 0) {
        distance += 1;
        const nextFrontier: string[] = [];
        for (const currentSpaceId of frontier) {
          for (const adjacentSpaceId of adjacentSpaceIdsById.get(
            currentSpaceId,
          ) ?? []) {
            if (adjacentSpaceId === toSpaceId) {
              return distance;
            }
            if (!visited.has(adjacentSpaceId)) {
              visited.add(adjacentSpaceId);
              nextFrontier.push(adjacentSpaceId);
            }
          }
        }
        frontier = nextFrontier;
      }

      return Number.POSITIVE_INFINITY;
    },
    [adjacentSpaceIdsById],
  );

  const getSpaceEdges = useCallback(
    (spaceId: string) => {
      return edges.filter((edge) => toSpaceIds(edge).includes(spaceId));
    },
    [edges],
  );

  const getSpaceVertices = useCallback(
    (spaceId: string) => {
      return vertices.filter((vertex) =>
        toVertexSpaceIds(vertex).includes(spaceId),
      );
    },
    [vertices],
  );

  const getIncidentEdges = useCallback(
    (vertexId: string) => {
      const vertex = vertexById.get(vertexId);
      if (!vertex) {
        return [];
      }
      const vertexSpaceIds = new Set(toVertexSpaceIds(vertex));
      return edges.filter((edge) =>
        toSpaceIds(edge).every((spaceId) => vertexSpaceIds.has(spaceId)),
      );
    },
    [edgeById, edges, vertexById],
  );

  const getIncidentVertices = useCallback(
    (edgeId: string) => {
      const edge = edgeById.get(edgeId);
      if (!edge) {
        return [];
      }
      const edgeSpaceIds = new Set(toSpaceIds(edge));
      return vertices.filter((vertex) =>
        Array.from(edgeSpaceIds).every((spaceId) =>
          toVertexSpaceIds(vertex).includes(spaceId),
        ),
      );
    },
    [edgeById, vertices],
  );

  return {
    layout,
    getSpace,
    getEdge,
    getVertex,
    getAdjacentSpaces,
    getDistance,
    getSpaceEdges,
    getSpaceVertices,
    getIncidentEdges,
    getIncidentVertices,
  };
}
