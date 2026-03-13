import type {
  Location,
  Card,
  Player,
  DieData,
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
} from "../types";
import type {
  CardId,
  DeckId,
  DieId,
  PlayerId,
  StateName,
  GlobalState,
  PlayerState,
  CardIdsByHandId,
  HandId,
  CardPropertiesById,
  BoardId,
  TileId,
  EdgeId,
  VertexId,
  PieceId,
  SpaceId,
} from "@dreamboard/manifest";

// ============================================================================
// Card, Deck, Player, Game, Die APIs
// ============================================================================

/** API for querying card state */
export interface CardStateApi {
  /** Get a card by ID. Throws if card not found. */
  get(cardId: CardId): Card;

  /** Get the location of a card. Throws if card not found. */
  getLocation(cardId: CardId): Location;

  /** Get the properties of a specific card */
  getProperties<T extends CardId>(cardId: T): CardPropertiesById[T];

  /** Get the owner of a card */
  getOwner(cardId: CardId): PlayerId | null;

  /** Get who played a card (for cards in deck/zone) */
  getPlayedBy(cardId: CardId): PlayerId | null;

  /** Check if a card is visible to a specific player */
  isVisibleTo(cardId: CardId, playerId: PlayerId): boolean;

  /** Get all cards owned by a specific player */
  getOwnedBy(playerId: PlayerId): CardId[];
}

/** API for querying deck state */
export interface DeckStateApi {
  /** Get all cards in a deck, sorted by position */
  getCards(deckId: DeckId): CardId[];

  /** Get the top card of a deck */
  getTopCard(deckId: DeckId): CardId | null;
}

/** API for querying player state */
export interface PlayerStateApi {
  /** Get a player by ID. Throws if player not found. */
  get(playerId: PlayerId): Player;

  /** Get a specific player's variable state */
  getState(playerId: PlayerId): PlayerState;

  /** Get cards in a specific player's hand */
  getHand<H extends HandId>(playerId: PlayerId, handId: H): CardIdsByHandId[H];

  /** Get all cards in any of a player's hands */
  getAllHands(playerId: PlayerId): CardId[];

  /** Check if a card is in a specific player's hand */
  isInHand(playerId: PlayerId, cardId: CardId, handId?: string): boolean;

  /** Get the player order */
  getOrder(): PlayerId[];

  /** Get the current active player IDs */
  getCurrentIds(): PlayerId[];

  /** Check if a player is currently active */
  isActive(playerId: PlayerId): boolean;
}

/** API for querying game state */
export interface GameStateApi {
  /** Get the global game state */
  getGlobalState(): GlobalState;

  /** Get the current game state name */
  getCurrentState(): StateName;
}

/** API for querying die state */
export interface DieStateApi {
  /** Get a die by ID. Throws if die not found. */
  get(dieId: DieId): DieData;
}

// ============================================================================
// Board-Specific Query APIs
// ============================================================================

/** API for querying hex board state */
export interface HexBoardStateApi {
  /** Get a specific tile by ID. Throws if not found. */
  getTile(boardId: BoardId, tileId: TileId): HexTileState;

  /** Get all tiles on a board */
  getAllTiles(boardId: BoardId): HexTileState[];

  /** Get a specific edge by ID. Returns null if not found. */
  getEdge(boardId: BoardId, edgeId: EdgeId): HexEdgeState | null;

  /** Get all edges on a board */
  getAllEdges(boardId: BoardId): HexEdgeState[];

  /** Get a specific vertex by ID. Returns null if not found. */
  getVertex(boardId: BoardId, vertexId: VertexId): HexVertexState | null;

  /** Get all vertices on a board */
  getAllVertices(boardId: BoardId): HexVertexState[];

  /** Get all tiles adjacent to a tile (using axial coordinates) */
  getAdjacentTiles(boardId: BoardId, tileId: TileId): HexTileState[];

  /** Get all tiles owned by a specific player */
  getTilesByOwner(boardId: BoardId, owner: PlayerId): HexTileState[];

  /** Get all edges owned by a specific player */
  getEdgesByOwner(boardId: BoardId, owner: PlayerId): HexEdgeState[];

  /** Get all vertices owned by a specific player */
  getVerticesByOwner(boardId: BoardId, owner: PlayerId): HexVertexState[];

  /** Get all vertices adjacent to a tile (up to 6 vertices per distance level) */
  getVerticesAdjacentToTile(
    boardId: BoardId,
    tileId: TileId,
    distance?: number,
  ): HexVertexState[];

  /** Get all edges adjacent to a tile (up to 6 edges) */
  getEdgesAdjacentToTile(boardId: BoardId, tileId: TileId): HexEdgeState[];

  /** Get all tiles adjacent to a vertex (exactly 3 tiles per distance level) */
  getTilesAdjacentToVertex(
    boardId: BoardId,
    vertexId: VertexId,
    distance?: number,
  ): HexTileState[];

  /** Get all edges adjacent to a vertex (exactly 3 edges per distance level) */
  getEdgesAdjacentToVertex(
    boardId: BoardId,
    vertexId: VertexId,
    options?: { includeNotPlaced?: boolean; distance?: number },
  ): HexEdgeState[];

  /** Get the two tiles that share an edge */
  getTilesAdjacentToEdge(
    boardId: BoardId,
    edgeId: EdgeId,
    options?: { includeNotPlaced?: boolean; distance?: number },
  ): HexTileState[];

  /** Get the two vertices at the ends of an edge */
  getVerticesAdjacentToEdge(
    boardId: BoardId,
    edgeId: EdgeId,
    options?: { includeNotPlaced?: boolean; distance?: number },
  ): HexVertexState[];

  /** Get all vertices adjacent to a vertex (connected via edges) */
  getVerticesAdjacentToVertex(
    boardId: BoardId,
    vertexId: VertexId,
    options?: { includeNotPlaced?: boolean; distance?: number },
  ): HexVertexState[];
}

/** API for querying network board state */
export interface NetworkBoardStateApi {
  /** Get a specific node by ID. Returns null if not found. */
  getNode(boardId: BoardId, nodeId: TileId): NetworkNodeState | null;

  /** Get all nodes on a board */
  getAllNodes(boardId: BoardId): NetworkNodeState[];

  /** Get a specific edge by ID. Returns null if not found. */
  getEdge(boardId: BoardId, edgeId: EdgeId): NetworkEdgeState | null;

  /** Get all edges on a board */
  getAllEdges(boardId: BoardId): NetworkEdgeState[];

  /** Get a specific piece by ID. Throws if not found. */
  getPiece(boardId: BoardId, pieceId: PieceId): NetworkPieceState;

  /** Get all pieces on a board */
  getAllPieces(boardId: BoardId): NetworkPieceState[];

  /** Get all nodes connected to a specific node */
  getConnectedNodes(boardId: BoardId, nodeId: TileId): NetworkNodeState[];
}

/** API for querying square board state */
export interface SquareBoardStateApi {
  /** Get a specific cell by position. Throws if not found. */
  getCell(boardId: BoardId, row: number, col: number): SquareCellState;

  /** Get the piece at a specific position. Throws if not found. */
  getPieceAt(boardId: BoardId, row: number, col: number): SquarePieceState;

  /** Get a specific piece by ID. Throws if not found. */
  getPiece(boardId: BoardId, pieceId: PieceId): SquarePieceState;

  /** Get all cells on a board */
  getAllCells(boardId: BoardId): SquareCellState[];

  /** Get all pieces on a board */
  getAllPieces(boardId: BoardId): SquarePieceState[];
}

/** API for querying track board state */
export interface TrackBoardStateApi {
  /** Get a specific space by ID. Throws if not found. */
  getSpace(boardId: BoardId, spaceId: SpaceId): TrackSpaceState;

  /** Get all spaces on a board */
  getAllSpaces(boardId: BoardId): TrackSpaceState[];

  /** Get a space by its numeric index */
  getSpaceByIndex(boardId: BoardId, index: number): TrackSpaceState | null;

  /** Get a specific piece by ID. Throws if not found. */
  getPiece(boardId: BoardId, pieceId: PieceId): TrackPieceState;

  /** Get all pieces on a board */
  getAllPieces(boardId: BoardId): TrackPieceState[];

  /** Get the next spaces from a given space (supports branching tracks) */
  getNextSpaces(boardId: BoardId, spaceId: SpaceId): TrackSpaceState[];
}

// ============================================================================
// Main State API
// ============================================================================

export interface StateApi {
  // ==================== Core APIs ====================

  /** Card state queries */
  readonly card: CardStateApi;

  /** Deck state queries */
  readonly deck: DeckStateApi;

  /** Player state queries */
  readonly player: PlayerStateApi;

  /** Game state queries */
  readonly game: GameStateApi;

  /** Die state queries */
  readonly die: DieStateApi;

  // ==================== Board APIs ====================

  /** Hex board state queries */
  readonly hexBoard: HexBoardStateApi;

  /** Network board state queries */
  readonly networkBoard: NetworkBoardStateApi;

  /** Square board state queries */
  readonly squareBoard: SquareBoardStateApi;

  /** Track board state queries */
  readonly trackBoard: TrackBoardStateApi;
}
