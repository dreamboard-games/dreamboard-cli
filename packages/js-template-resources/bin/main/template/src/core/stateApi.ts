import type {
  Location,
  GameState,
  Card,
  Player,
  DieData,
  KvApi,
  JsonElement,
  HexTileState,
  HexEdgeState,
  HexVertexState,
  NetworkNodeState,
  NetworkEdgeState,
  NetworkPieceState,
  SquareCellState,
  SquarePieceState,
  TrackSpaceState,
  TrackPieceState,
} from "../types.js";
import type {
  CardId,
  DeckId,
  DieId,
  PlayerId,
  StateName,
  GlobalState,
  PlayerState,
  HandId,
  CardIdsByHandId,
  CardPropertiesById,
  BoardId,
  TileId,
  EdgeId,
  VertexId,
  PieceId,
  SpaceId,
} from "@dreamboard/manifest";
import type {
  StateApi,
  CardStateApi,
  DeckStateApi,
  PlayerStateApi,
  GameStateApi,
  DieStateApi,
  HexBoardStateApi,
  NetworkBoardStateApi,
  SquareBoardStateApi,
  TrackBoardStateApi,
} from "./state.js";

// ============================================================================
// Typed KV Store
// ============================================================================

export interface TypedKv<TStore> {
  get<K extends keyof TStore & string>(key: K): TStore[K] | null;
  set<K extends keyof TStore & string>(key: K, value: TStore[K]): void;
  delete<K extends keyof TStore & string>(key: K): boolean;
  has<K extends keyof TStore & string>(key: K): boolean;
}

export function createTypedKv<TStore>(kvApi: KvApi): TypedKv<TStore> {
  return {
    get<K extends keyof TStore & string>(key: K): TStore[K] | null {
      const result = kvApi.get(key);
      if (!result.success) {
        throw new Error(
          `KV get failed for key '${key}': ${result.errorMessage}`,
        );
      }
      if (result.value === undefined || result.value === null) {
        return null;
      }
      return result.value as TStore[K];
    },

    set<K extends keyof TStore & string>(key: K, value: TStore[K]): void {
      const result = kvApi.set(key, value as JsonElement);
      if (!result.success) {
        throw new Error(
          `KV set failed for key '${key}': ${result.errorMessage}`,
        );
      }
    },

    delete<K extends keyof TStore & string>(key: K): boolean {
      const result = kvApi.delete(key);
      if (!result.success) {
        throw new Error(
          `KV delete failed for key '${key}': ${result.errorMessage}`,
        );
      }
      return result.existed;
    },

    has<K extends keyof TStore & string>(key: K): boolean {
      return kvApi.has(key);
    },
  };
}

// ============================================================================
// Core State API Factories
// ============================================================================

function createCardStateApi(state: GameState): CardStateApi {
  return {
    get(cardId: CardId): Card {
      const card = state.cards[cardId];
      if (!card) {
        throw new Error(`Card not found: ${cardId}`);
      }
      return card;
    },

    getLocation(cardId: CardId): Location {
      const location = state.componentLocations[cardId];
      if (!location) {
        throw new Error(`Location not found for card: ${cardId}`);
      }
      return location;
    },

    getProperties<T extends CardId>(cardId: T): CardPropertiesById[T] {
      return state.cards[cardId]?.properties as CardPropertiesById[T];
    },

    getOwner(cardId: CardId): PlayerId | null {
      return state.ownerOfCard[cardId] ?? null;
    },

    getPlayedBy(cardId: CardId): PlayerId | null {
      const location = state.componentLocations[cardId];
      if (!location) return null;
      if (location.type === "InDeck" || location.type === "InZone") {
        return (location.playedBy as PlayerId) ?? null;
      }
      return null;
    },

    isVisibleTo(cardId: CardId, playerId: PlayerId): boolean {
      const visibility = state.visibility[cardId];
      if (!visibility) return true;
      if (visibility.visibleTo == null) return visibility.faceUp;
      return visibility.visibleTo.includes(playerId) && visibility.faceUp;
    },

    getOwnedBy(playerId: PlayerId): CardId[] {
      const ownedCards: CardId[] = [];
      for (const [cardId, owner] of Object.entries(state.ownerOfCard)) {
        if (owner === playerId) {
          ownedCards.push(cardId as CardId);
        }
      }
      return ownedCards;
    },
  };
}

function createDeckStateApi(state: GameState): DeckStateApi {
  return {
    getCards(deckId: DeckId): CardId[] {
      return Object.entries(state.componentLocations)
        .filter(
          ([_cardId, location]) =>
            location.type === "InDeck" && location.deckId === deckId,
        )
        .sort(([, locationA], [, locationB]) => {
          const posA =
            locationA.type === "InDeck"
              ? (locationA.position ?? Number.MAX_SAFE_INTEGER)
              : Number.MAX_SAFE_INTEGER;
          const posB =
            locationB.type === "InDeck"
              ? (locationB.position ?? Number.MAX_SAFE_INTEGER)
              : Number.MAX_SAFE_INTEGER;
          return posA - posB;
        })
        .map(([cardId]) => cardId as CardId);
    },

    getTopCard(deckId: DeckId): CardId | null {
      const cards = this.getCards(deckId);
      return cards.length > 0 ? cards[0] : null;
    },
  };
}

function createPlayerStateApi(state: GameState): PlayerStateApi {
  return {
    get(playerId: PlayerId): Player {
      const player = state.players[playerId];
      if (!player) {
        throw new Error(`Player not found: ${playerId}`);
      }
      return player;
    },

    getState(playerId: PlayerId): PlayerState {
      return state.playerVariables[playerId];
    },

    getHand<H extends HandId>(
      playerId: PlayerId,
      handId: H,
    ): CardIdsByHandId[H] {
      return Object.entries(state.componentLocations)
        .filter(
          ([_cardId, location]) =>
            location.type === "InHand" &&
            location.playerId === playerId &&
            location.handId === handId,
        )
        .sort(([, locationA], [, locationB]) => {
          const posA =
            locationA.type === "InHand"
              ? (locationA.position ?? Number.MAX_SAFE_INTEGER)
              : Number.MAX_SAFE_INTEGER;
          const posB =
            locationB.type === "InHand"
              ? (locationB.position ?? Number.MAX_SAFE_INTEGER)
              : Number.MAX_SAFE_INTEGER;
          return posA - posB;
        })
        .map(([cardId]) => cardId) as unknown as CardIdsByHandId[H];
    },

    getAllHands(playerId: PlayerId): CardId[] {
      return Object.entries(state.componentLocations)
        .filter(
          ([_cardId, location]) =>
            location.type === "InHand" && location.playerId === playerId,
        )
        .sort(([, locationA], [, locationB]) => {
          const posA =
            locationA.type === "InHand"
              ? (locationA.position ?? Number.MAX_SAFE_INTEGER)
              : Number.MAX_SAFE_INTEGER;
          const posB =
            locationB.type === "InHand"
              ? (locationB.position ?? Number.MAX_SAFE_INTEGER)
              : Number.MAX_SAFE_INTEGER;
          return posA - posB;
        })
        .map(([cardId]) => cardId as CardId);
    },

    isInHand(playerId: PlayerId, cardId: CardId, handId?: string): boolean {
      const location = state.componentLocations[cardId];
      return (
        location?.type === "InHand" &&
        location.playerId === playerId &&
        (handId === undefined || location.handId === handId)
      );
    },

    getOrder(): PlayerId[] {
      return state.playerOrder;
    },

    getCurrentIds(): PlayerId[] {
      return state.currentPlayerIds;
    },

    isActive(playerId: PlayerId): boolean {
      return state.currentPlayerIds.includes(playerId);
    },
  };
}

function createGameStateApi(state: GameState): GameStateApi {
  return {
    getGlobalState(): GlobalState {
      return state.globalVariables;
    },

    getCurrentState(): StateName {
      return state.currentState;
    },
  };
}

function createDieStateApi(state: GameState): DieStateApi {
  return {
    get(dieId: DieId): DieData {
      const die = state.dice[dieId];
      if (!die) {
        throw new Error(`Die not found: ${dieId}`);
      }
      return die;
    },
  };
}

// ============================================================================
// Board State API Factories
// ============================================================================

/**
 * Normalize a compound ID by sorting its components alphabetically.
 * Handles both string IDs (e.g., "hexB-hexA" becomes "hexA-hexB")
 * and array IDs (e.g., ["hexB", "hexA"] becomes ["hexA", "hexB"])
 */
function normalizeId<T>(id: T): T {
  if (Array.isArray(id)) {
    return [...id].sort().join("$$") as T;
  }
  return (id as string).split("$$").sort().join("$$") as T;
}

function getHexBoard(state: GameState, boardId: BoardId) {
  const board = state.hexBoards[boardId];
  if (!board) {
    throw new Error(`Hex board not found: ${boardId}`);
  }
  return board;
}

/**
 * Parse hexes from a vertex ID (either array or string "hex1$$hex2$$hex3")
 */
function parseVertexHexes(vertexId: VertexId): TileId[] {
  if (Array.isArray(vertexId)) {
    return vertexId as TileId[];
  }
  return (vertexId as unknown as string).split("$$") as TileId[];
}

/**
 * Parse hexes from an edge ID (either array or string "hex1$$hex2")
 */
function parseEdgeHexes(edgeId: EdgeId): [TileId, TileId] {
  if (Array.isArray(edgeId)) {
    return edgeId as [TileId, TileId];
  }
  const parts = (edgeId as unknown as string).split("$$") as TileId[];
  return [parts[0], parts[1]];
}

function createHexBoardStateApi(state: GameState): HexBoardStateApi {
  return {
    getTile(boardId: BoardId, tileId: TileId): HexTileState {
      const board = getHexBoard(state, boardId);
      const tile = board.tiles[tileId];
      if (!tile) {
        throw new Error(`Hex tile not found: ${tileId} on board ${boardId}`);
      }
      return tile;
    },

    getAllTiles(boardId: BoardId): HexTileState[] {
      const board = getHexBoard(state, boardId);
      return Object.values(board.tiles);
    },

    getEdge(boardId: BoardId, edgeId: EdgeId): HexEdgeState | null {
      const board = getHexBoard(state, boardId);
      const normalizedId = normalizeId(edgeId);
      const edge = board.edges.find((e) => normalizeId(e.id) === normalizedId);
      return edge ?? null;
    },

    getAllEdges(boardId: BoardId): HexEdgeState[] {
      const board = getHexBoard(state, boardId);
      return board.edges;
    },

    getVertex(boardId: BoardId, vertexId: VertexId): HexVertexState | null {
      const board = getHexBoard(state, boardId);
      const normalizedId = normalizeId(vertexId);
      const vertex = board.vertices.find(
        (v) => normalizeId(v.id) === normalizedId,
      );
      return vertex ?? null;
    },

    getAllVertices(boardId: BoardId): HexVertexState[] {
      const board = getHexBoard(state, boardId);
      return board.vertices;
    },

    getAdjacentTiles(boardId: BoardId, tileId: TileId): HexTileState[] {
      const board = getHexBoard(state, boardId);
      const tile = board.tiles[tileId];
      if (!tile) return [];

      const offsets = [
        [1, 0],
        [1, -1],
        [0, -1],
        [-1, 0],
        [-1, 1],
        [0, 1],
      ];

      return offsets
        .map(([dq, dr]) =>
          Object.values(board.tiles).find(
            (t) => t.q === tile.q + dq && t.r === tile.r + dr,
          ),
        )
        .filter((t): t is HexTileState => t !== undefined);
    },

    getTilesByOwner(boardId: BoardId, owner: PlayerId): HexTileState[] {
      const board = getHexBoard(state, boardId);
      return Object.values(board.tiles).filter((t) => t.owner === owner);
    },

    getEdgesByOwner(boardId: BoardId, owner: PlayerId): HexEdgeState[] {
      const board = getHexBoard(state, boardId);
      return board.edges.filter((e) => e.owner === owner);
    },

    getVerticesByOwner(boardId: BoardId, owner: PlayerId): HexVertexState[] {
      const board = getHexBoard(state, boardId);
      return board.vertices.filter((v) => v.owner === owner);
    },

    getVerticesAdjacentToTile(
      boardId: BoardId,
      tileId: TileId,
      distance: number = 1,
    ): HexVertexState[] {
      const board = getHexBoard(state, boardId);
      const result = new Set<VertexId>();
      let currentTiles = new Set<TileId>([tileId]);

      for (let d = 0; d < distance; d++) {
        const nextTiles = new Set<TileId>();
        for (const tid of currentTiles) {
          for (const vertex of board.vertices) {
            if (vertex.hexes.includes(tid)) {
              result.add(vertex.id);
              // Add adjacent tiles for next iteration
              vertex.hexes.forEach((h) => nextTiles.add(h));
            }
          }
        }
        currentTiles = nextTiles;
      }

      return board.vertices.filter((v) => result.has(v.id));
    },

    getEdgesAdjacentToTile(boardId: BoardId, tileId: TileId): HexEdgeState[] {
      const board = getHexBoard(state, boardId);
      return board.edges.filter((e) => e.hex1 === tileId || e.hex2 === tileId);
    },

    getTilesAdjacentToVertex(
      boardId: BoardId,
      vertexId: VertexId,
      distance: number = 1,
    ): HexTileState[] {
      const board = getHexBoard(state, boardId);
      const normalizedId = normalizeId(vertexId);
      const vertex = board.vertices.find(
        (v) => normalizeId(v.id) === normalizedId,
      );
      if (!vertex) return [];

      const result = new Set<TileId>();
      let currentVertices = new Set<VertexId>([vertex.id]);

      for (let d = 0; d < distance; d++) {
        const nextVertices = new Set<VertexId>();
        for (const vid of currentVertices) {
          const v = board.vertices.find((vtx) => vtx.id === vid);
          if (!v) continue;
          v.hexes.forEach((tileId) => {
            result.add(tileId);
            // Find vertices adjacent to this tile for next iteration
            board.vertices
              .filter((vtx) => vtx.hexes.includes(tileId))
              .forEach((vtx) => nextVertices.add(vtx.id));
          });
        }
        currentVertices = nextVertices;
      }

      return Array.from(result)
        .map((tileId) => board.tiles[tileId])
        .filter((t): t is HexTileState => t !== undefined);
    },

    getEdgesAdjacentToVertex(
      boardId: BoardId,
      vertexId: VertexId,
      options?: { includeNotPlaced?: boolean; distance?: number },
    ): HexEdgeState[] {
      const { includeNotPlaced = false, distance = 1 } = options ?? {};
      const board = getHexBoard(state, boardId);

      // Get hexes from vertex - either from placed vertex or parse from ID
      const getVertexHexes = (vid: VertexId): TileId[] | null => {
        const normalizedVid = String(normalizeId(vid));
        const placed = board.vertices.find(
          (v) => String(normalizeId(v.id)) === normalizedVid,
        );
        if (placed) return placed.hexes;

        // Parse hexes from ID
        const hexes = parseVertexHexes(vid);
        if (hexes.length !== 3) return null;

        // Verify all hexes exist on the board
        if (!hexes.every((h) => board.tiles[h])) return null;

        return hexes.sort() as TileId[];
      };

      const startHexes = getVertexHexes(vertexId);
      if (!startHexes) return [];

      const resultEdgeIds = new Set<string>();
      const results: HexEdgeState[] = [];
      const visitedVertices = new Set<string>([String(normalizeId(vertexId))]);
      let currentVertexHexes: TileId[][] = [startHexes];

      for (let d = 0; d < distance; d++) {
        const nextVertexHexes: TileId[][] = [];

        for (const hexes of currentVertexHexes) {
          // For each pair of hexes, there's an edge
          for (let i = 0; i < hexes.length; i++) {
            for (let j = i + 1; j < hexes.length; j++) {
              const hex1 = hexes[i];
              const hex2 = hexes[j];
              const [sortedHex1, sortedHex2] =
                hex1 < hex2 ? [hex1, hex2] : [hex2, hex1];
              const edgeId = `${sortedHex1}$$${sortedHex2}`;

              if (!resultEdgeIds.has(edgeId)) {
                resultEdgeIds.add(edgeId);

                // Check if edge is placed
                const placedEdge = board.edges.find(
                  (e) => String(normalizeId(e.id)) === edgeId,
                );

                if (placedEdge) {
                  results.push(placedEdge);
                } else if (includeNotPlaced) {
                  results.push({
                    id: edgeId as unknown as EdgeId,
                    hex1: sortedHex1,
                    hex2: sortedHex2,
                  });
                }

                // Find adjacent vertices for next iteration (vertices that share this edge)
                // These are vertices that contain both hex1 and hex2
                const adjacentToHex1 = this.getAdjacentTiles(boardId, hex1);
                const adjacentToHex2 = this.getAdjacentTiles(boardId, hex2);

                for (const tile of adjacentToHex1) {
                  if (adjacentToHex2.some((t) => t.id === tile.id)) {
                    const adjVertexHexes = [
                      hex1,
                      hex2,
                      tile.id,
                    ].sort() as TileId[];
                    const adjVertexId = adjVertexHexes.join("$$");

                    if (!visitedVertices.has(adjVertexId)) {
                      visitedVertices.add(adjVertexId);
                      nextVertexHexes.push(adjVertexHexes);
                    }
                  }
                }
              }
            }
          }
        }
        currentVertexHexes = nextVertexHexes;
      }

      return results;
    },

    getTilesAdjacentToEdge(
      boardId: BoardId,
      edgeId: EdgeId,
      options?: { includeNotPlaced?: boolean; distance?: number },
    ): HexTileState[] {
      const { distance = 1 } = options ?? {};
      const board = getHexBoard(state, boardId);

      // Get hexes from edge - either from placed edge or parse from ID
      const getEdgeHexes = (eid: EdgeId): [TileId, TileId] | null => {
        const normalizedEid = String(normalizeId(eid));
        const placed = board.edges.find(
          (e) => String(normalizeId(e.id)) === normalizedEid,
        );
        if (placed) return [placed.hex1, placed.hex2];

        // Parse hexes from ID
        const hexes = parseEdgeHexes(eid);
        if (hexes.length !== 2) return null;

        // Verify both hexes exist on the board
        if (!hexes.every((h) => board.tiles[h])) return null;

        return hexes;
      };

      const startHexes = getEdgeHexes(edgeId);
      if (!startHexes) return [];

      const resultTileIds = new Set<TileId>();
      const visitedEdges = new Set<string>([String(normalizeId(edgeId))]);
      let currentEdgeHexes: [TileId, TileId][] = [startHexes];

      for (let d = 0; d < distance; d++) {
        const nextEdgeHexes: [TileId, TileId][] = [];

        for (const [hex1, hex2] of currentEdgeHexes) {
          // Add tiles adjacent to this edge
          if (board.tiles[hex1]) resultTileIds.add(hex1);
          if (board.tiles[hex2]) resultTileIds.add(hex2);

          // Find edges adjacent to these tiles for next iteration
          for (const tileId of [hex1, hex2]) {
            const adjacentTiles = this.getAdjacentTiles(boardId, tileId);
            for (const adjTile of adjacentTiles) {
              const [sorted1, sorted2] =
                tileId < adjTile.id
                  ? [tileId, adjTile.id]
                  : [adjTile.id, tileId];
              const adjEdgeId = `${sorted1}$$${sorted2}`;

              if (!visitedEdges.has(adjEdgeId)) {
                visitedEdges.add(adjEdgeId);
                nextEdgeHexes.push([sorted1, sorted2]);
              }
            }
          }
        }
        currentEdgeHexes = nextEdgeHexes;
      }

      return Array.from(resultTileIds)
        .map((tileId) => board.tiles[tileId])
        .filter((t): t is HexTileState => t !== undefined);
    },

    getVerticesAdjacentToEdge(
      boardId: BoardId,
      edgeId: EdgeId,
      options?: { includeNotPlaced?: boolean; distance?: number },
    ): HexVertexState[] {
      const { includeNotPlaced = false, distance = 1 } = options ?? {};
      const board = getHexBoard(state, boardId);

      // Get hexes from edge - either from placed edge or parse from ID
      const getEdgeHexes = (eid: EdgeId): [TileId, TileId] | null => {
        const normalizedEid = String(normalizeId(eid));
        const placed = board.edges.find(
          (e) => String(normalizeId(e.id)) === normalizedEid,
        );
        if (placed) return [placed.hex1, placed.hex2];

        // Parse hexes from ID
        const hexes = parseEdgeHexes(eid);
        if (hexes.length !== 2) return null;

        // Verify both hexes exist on the board
        if (!hexes.every((h) => board.tiles[h])) return null;

        return hexes;
      };

      const startHexes = getEdgeHexes(edgeId);
      if (!startHexes) return [];

      const visitedVertices = new Set<string>();
      const visitedEdges = new Set<string>([String(normalizeId(edgeId))]);
      const results: HexVertexState[] = [];
      let currentEdgeHexes: [TileId, TileId][] = [startHexes];

      for (let d = 0; d < distance; d++) {
        const nextEdgeHexes: [TileId, TileId][] = [];

        for (const [hex1, hex2] of currentEdgeHexes) {
          // Find tiles adjacent to both hex1 and hex2 - each forms a vertex with hex1, hex2
          const adjacentToHex1 = this.getAdjacentTiles(boardId, hex1);
          const adjacentToHex2 = this.getAdjacentTiles(boardId, hex2);

          for (const tile of adjacentToHex1) {
            if (adjacentToHex2.some((t) => t.id === tile.id)) {
              const hexes = [hex1, hex2, tile.id].sort() as TileId[];
              const vertexId = hexes.join("$$");

              if (!visitedVertices.has(vertexId)) {
                visitedVertices.add(vertexId);

                // Check if vertex is placed
                const placedVertex = board.vertices.find(
                  (v) => String(normalizeId(v.id)) === vertexId,
                );

                if (placedVertex) {
                  results.push(placedVertex);
                } else if (includeNotPlaced) {
                  results.push({
                    id: vertexId as unknown as VertexId,
                    hexes,
                  });
                }

                // Find edges adjacent to this vertex for next iteration
                for (let i = 0; i < hexes.length; i++) {
                  for (let j = i + 1; j < hexes.length; j++) {
                    const eHex1 = hexes[i];
                    const eHex2 = hexes[j];
                    const [sorted1, sorted2] =
                      eHex1 < eHex2 ? [eHex1, eHex2] : [eHex2, eHex1];
                    const adjEdgeId = `${sorted1}$$${sorted2}`;

                    if (!visitedEdges.has(adjEdgeId)) {
                      visitedEdges.add(adjEdgeId);
                      nextEdgeHexes.push([sorted1, sorted2]);
                    }
                  }
                }
              }
            }
          }
        }
        currentEdgeHexes = nextEdgeHexes;
      }

      return results;
    },

    getVerticesAdjacentToVertex(
      boardId: BoardId,
      vertexId: VertexId,
      options?: { includeNotPlaced?: boolean; distance?: number },
    ): HexVertexState[] {
      const { includeNotPlaced = false, distance = 1 } = options ?? {};
      const board = getHexBoard(state, boardId);

      // Get hexes from vertex - either from placed vertex or parse from ID
      const getVertexWithHexes = (vid: VertexId): HexVertexState | null => {
        const normalizedVid = String(normalizeId(vid));
        const placed = board.vertices.find(
          (v) => String(normalizeId(v.id)) === normalizedVid,
        );
        if (placed) return placed;

        // Parse hexes from ID
        const hexes = parseVertexHexes(vid);
        if (hexes.length !== 3) return null;

        // Verify all hexes exist on the board
        if (!hexes.every((h) => board.tiles[h])) return null;

        return {
          id: vid,
          hexes: hexes.sort() as TileId[],
        };
      };

      const startVertex = getVertexWithHexes(vertexId);
      if (!startVertex) return [];

      const normalizedStartId = String(normalizeId(vertexId));
      const visitedVertices = new Set<string>([normalizedStartId]);
      const results: HexVertexState[] = [];
      let currentVertices: HexVertexState[] = [startVertex];

      for (let d = 0; d < distance; d++) {
        const nextVertices: HexVertexState[] = [];

        for (const v of currentVertices) {
          // For each pair of hexes in this vertex, find the third hex that would form an adjacent vertex
          for (let i = 0; i < v.hexes.length; i++) {
            for (let j = i + 1; j < v.hexes.length; j++) {
              const hex1 = v.hexes[i];
              const hex2 = v.hexes[j];

              // Find tiles adjacent to both hex1 and hex2
              const adjacentToHex1 = this.getAdjacentTiles(boardId, hex1);
              const adjacentToHex2 = this.getAdjacentTiles(boardId, hex2);

              for (const tile of adjacentToHex1) {
                if (
                  adjacentToHex2.some((t) => t.id === tile.id) &&
                  !v.hexes.includes(tile.id)
                ) {
                  const hexes = [hex1, hex2, tile.id].sort() as TileId[];
                  const adjVertexId = hexes.join("$$") as unknown as VertexId;
                  const normalizedAdjId = String(normalizeId(adjVertexId));

                  if (!visitedVertices.has(normalizedAdjId)) {
                    visitedVertices.add(normalizedAdjId);

                    // Check if this vertex is placed
                    const placedVertex = board.vertices.find(
                      (vtx) => String(normalizeId(vtx.id)) === normalizedAdjId,
                    );

                    if (placedVertex) {
                      results.push(placedVertex);
                      nextVertices.push(placedVertex);
                    } else if (includeNotPlaced) {
                      const virtualVertex: HexVertexState = {
                        id: adjVertexId,
                        hexes,
                      };
                      results.push(virtualVertex);
                      nextVertices.push(virtualVertex);
                    }
                  }
                }
              }
            }
          }
        }
        currentVertices = nextVertices;
      }

      return results;
    },
  };
}

function getNetworkBoard(state: GameState, boardId: BoardId) {
  const board = state.networkBoards[boardId];
  if (!board) {
    throw new Error(`Network board not found: ${boardId}`);
  }
  return board;
}

function createNetworkBoardStateApi(state: GameState): NetworkBoardStateApi {
  return {
    getNode(boardId: BoardId, nodeId: TileId): NetworkNodeState | null {
      const board = getNetworkBoard(state, boardId);
      const node = board.nodes[nodeId];
      return node ?? null;
    },

    getAllNodes(boardId: BoardId): NetworkNodeState[] {
      const board = getNetworkBoard(state, boardId);
      return Object.values(board.nodes);
    },

    getEdge(boardId: BoardId, edgeId: EdgeId): NetworkEdgeState | null {
      const board = getNetworkBoard(state, boardId);
      const normalizedId = normalizeId(edgeId);
      const edge = board.edges.find((e) => normalizeId(e.id) === normalizedId);
      return edge ?? null;
    },

    getAllEdges(boardId: BoardId): NetworkEdgeState[] {
      const board = getNetworkBoard(state, boardId);
      return board.edges;
    },

    getPiece(boardId: BoardId, pieceId: PieceId): NetworkPieceState {
      const board = getNetworkBoard(state, boardId);
      const piece = board.pieces[pieceId];
      if (!piece) {
        throw new Error(
          `Network piece not found: ${pieceId} on board ${boardId}`,
        );
      }
      return piece;
    },

    getAllPieces(boardId: BoardId): NetworkPieceState[] {
      const board = getNetworkBoard(state, boardId);
      return Object.values(board.pieces);
    },

    getConnectedNodes(boardId: BoardId, nodeId: TileId): NetworkNodeState[] {
      const board = getNetworkBoard(state, boardId);
      const connectedNodeIds = board.edges
        .filter((e) => e.from === nodeId || e.to === nodeId)
        .map((e) => (e.from === nodeId ? e.to : e.from));
      const uniqueIds = [...new Set(connectedNodeIds)];
      return uniqueIds
        .map((id) => board.nodes[id])
        .filter((n): n is NetworkNodeState => n !== undefined);
    },
  };
}

function getSquareBoard(state: GameState, boardId: BoardId) {
  const board = state.squareBoards[boardId];
  if (!board) {
    throw new Error(`Square board not found: ${boardId}`);
  }
  return board;
}

function createSquareBoardStateApi(state: GameState): SquareBoardStateApi {
  return {
    getCell(boardId: BoardId, row: number, col: number): SquareCellState {
      const board = getSquareBoard(state, boardId);
      const key = `${row}-${col}`;
      const cell = board.cells[key];
      if (!cell) {
        throw new Error(
          `Square cell not found at (${row}, ${col}) on board ${boardId}`,
        );
      }
      return cell;
    },

    getPieceAt(boardId: BoardId, row: number, col: number): SquarePieceState {
      const board = getSquareBoard(state, boardId);
      const piece = Object.values(board.pieces).find(
        (p) => p.row === row && p.col === col,
      );
      if (!piece) {
        throw new Error(
          `Square piece not found at (${row}, ${col}) on board ${boardId}`,
        );
      }
      return piece;
    },

    getPiece(boardId: BoardId, pieceId: PieceId): SquarePieceState {
      const board = getSquareBoard(state, boardId);
      const piece = board.pieces[pieceId];
      if (!piece) {
        throw new Error(
          `Square piece not found: ${pieceId} on board ${boardId}`,
        );
      }
      return piece;
    },

    getAllCells(boardId: BoardId): SquareCellState[] {
      const board = getSquareBoard(state, boardId);
      return Object.values(board.cells);
    },

    getAllPieces(boardId: BoardId): SquarePieceState[] {
      const board = getSquareBoard(state, boardId);
      return Object.values(board.pieces);
    },
  };
}

function getTrackBoard(state: GameState, boardId: BoardId) {
  const board = state.trackBoards[boardId];
  if (!board) {
    throw new Error(`Track board not found: ${boardId}`);
  }
  return board;
}

function createTrackBoardStateApi(state: GameState): TrackBoardStateApi {
  return {
    getSpace(boardId: BoardId, spaceId: SpaceId): TrackSpaceState {
      const board = getTrackBoard(state, boardId);
      const space = board.spaces[spaceId];
      if (!space) {
        throw new Error(
          `Track space not found: ${spaceId} on board ${boardId}`,
        );
      }
      return space;
    },

    getAllSpaces(boardId: BoardId): TrackSpaceState[] {
      const board = getTrackBoard(state, boardId);
      return Object.values(board.spaces);
    },

    getSpaceByIndex(boardId: BoardId, index: number): TrackSpaceState | null {
      const board = getTrackBoard(state, boardId);
      return Object.values(board.spaces).find((s) => s.index === index) ?? null;
    },

    getPiece(boardId: BoardId, pieceId: PieceId): TrackPieceState {
      const board = getTrackBoard(state, boardId);
      const piece = board.pieces[pieceId];
      if (!piece) {
        throw new Error(
          `Track piece not found: ${pieceId} on board ${boardId}`,
        );
      }
      return piece;
    },

    getAllPieces(boardId: BoardId): TrackPieceState[] {
      const board = getTrackBoard(state, boardId);
      return Object.values(board.pieces);
    },

    getNextSpaces(boardId: BoardId, spaceId: SpaceId): TrackSpaceState[] {
      const board = getTrackBoard(state, boardId);
      const space = board.spaces[spaceId];
      if (!space) return [];

      if (space.nextSpaces != null) {
        return space.nextSpaces
          .map((id) => board.spaces[id])
          .filter((s): s is TrackSpaceState => s !== undefined);
      } else {
        return Object.values(board.spaces).filter(
          (s) => s.index === space.index + 1,
        );
      }
    },
  };
}

// ============================================================================
// Main State API Factory
// ============================================================================

/**
 * Create a StateApi instance for the given game state
 */
export function StateApi(state: GameState): StateApi {
  return {
    // Core APIs
    card: createCardStateApi(state),
    deck: createDeckStateApi(state),
    player: createPlayerStateApi(state),
    game: createGameStateApi(state),
    die: createDieStateApi(state),

    // Board APIs
    hexBoard: createHexBoardStateApi(state),
    networkBoard: createNetworkBoardStateApi(state),
    squareBoard: createSquareBoardStateApi(state),
    trackBoard: createTrackBoardStateApi(state),
  };
}
