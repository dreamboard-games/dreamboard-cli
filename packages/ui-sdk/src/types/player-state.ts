import type {
  PlayerId,
  CardId,
  HandId,
  CardIdsByHandId,
  CardIdsByDeckId,
  CardProperties,
  PlayerState,
  GlobalState,
  StateName,
  TileId,
  TileTypeId,
  EdgeTypeId,
  VertexTypeId,
  BoardId,
  PieceId,
  PieceTypeId,
  SpaceId,
  SpaceTypeId,
  DieId,
  TilePropertiesByBoardId,
  EdgePropertiesByBoardId,
  VertexPropertiesByBoardId,
} from "@dreamboard/manifest";
import type { AnyUIArgs } from "@dreamboard/ui-args";

export interface Player {
  /** Player ID */
  playerId: PlayerId;
  /** Player display name */
  name: string;
  /** Whether this player is the host */
  isHost?: boolean;
  /** Player's assigned color */
  color?: string;
}

/**
 * Card item for frontend use.
 * This is the parsed, typed version of CardInfo.
 */
export interface CardItem {
  /** Unique card instance identifier */
  id: CardId;
  /** Card type identifier matching a schema in the manifest */
  type: string;
  /** Display name for the card */
  cardName?: string;
  /** Optional rules text or description */
  description?: string;
  /** Custom properties specific to this game's cards */
  properties: CardProperties;
}

export interface HexTileState<B extends BoardId = BoardId> {
  /** Unique tile identifier */
  id: TileId;
  /** Axial coordinate Q */
  q: number;
  /** Axial coordinate R */
  r: number;
  /** Tile type identifier for rendering */
  typeId?: TileTypeId;
  /** Display label on the tile */
  label?: string;
  /** Player ID who owns this tile */
  owner?: PlayerId;
  /** JSON-serialized custom properties */
  properties?: B extends keyof TilePropertiesByBoardId
    ? TilePropertiesByBoardId[B]
    : undefined;
}

/** State of an edge on a hex board (matches SimpleHexEdgeState) */
export interface HexEdgeState<B extends BoardId = BoardId> {
  /** Unique edge identifier (serialized string, e.g., "tile1-tile2") */
  id: string;
  /** First hex tile ID this edge borders */
  hex1: TileId;
  /** Second hex tile ID this edge borders */
  hex2: TileId;
  /** Edge type identifier for rendering */
  typeId?: EdgeTypeId;
  /** Player ID who owns this edge */
  owner?: PlayerId;
  /** JSON-serialized custom properties */
  properties?: B extends keyof EdgePropertiesByBoardId
    ? EdgePropertiesByBoardId[B]
    : undefined;
}

/** State of a vertex on a hex board (matches SimpleHexVertexState) */
export interface HexVertexState<B extends BoardId = BoardId> {
  /** Unique vertex identifier (serialized string, e.g., "tile1-tile2-tile3") */
  id: string;
  /** The three hex tile IDs this vertex touches */
  hexes: [TileId, TileId, TileId];
  /** Vertex type identifier for rendering */
  typeId?: VertexTypeId;
  /** Player ID who owns this vertex */
  owner?: PlayerId;
  /** JSON-serialized custom properties */
  properties?: B extends keyof VertexPropertiesByBoardId
    ? VertexPropertiesByBoardId[B]
    : undefined;
}

/** Complete state of a hex board (matches SimpleHexBoardState) */
export interface HexBoardState<B extends BoardId = BoardId> {
  /** Unique board identifier */
  id: BoardId;
  /** All tiles on the board */
  tiles: Array<HexTileState<B>>;
  /** All edges on the board */
  edges: Array<HexEdgeState<B>>;
  /** All vertices on the board */
  vertices: Array<HexVertexState<B>>;
}

/** State of a node in a network graph board (matches SimpleNetworkNodeState) */
export interface NetworkNodeState {
  /** Unique node identifier */
  id: TileId;
  /** X coordinate position */
  x: number;
  /** Y coordinate position */
  y: number;
  /** Node type identifier for rendering */
  typeId?: TileTypeId;
  /** Display label on the node */
  label?: string;
  /** Player ID who owns this node */
  owner?: PlayerId;
  /** JSON-serialized custom properties */
  properties?: string;
}

/** State of an edge connecting two nodes in a network graph (matches SimpleNetworkEdgeState) */
export interface NetworkEdgeState {
  /** Unique edge identifier */
  id: string;
  /** Source node ID */
  from: TileId;
  /** Target node ID */
  to: TileId;
  /** Edge type identifier for rendering */
  typeId?: string;
  /** Display label on the edge */
  label?: string;
  /** Player ID who owns this edge */
  owner?: PlayerId;
  /** JSON-serialized custom properties */
  properties?: string;
}

/** State of a piece placed on a network node (matches SimpleNetworkPieceState) */
export interface NetworkPieceState {
  /** Unique piece identifier */
  id: PieceId;
  /** Node ID where this piece is placed */
  nodeId: TileId;
  /** Piece type identifier for rendering */
  typeId?: PieceTypeId;
  /** Player ID who owns this piece */
  owner?: PlayerId;
  /** JSON-serialized custom properties */
  properties?: string;
}

/** Complete state of a network board (matches SimpleNetworkBoardState) */
export interface NetworkBoardState {
  /** Unique board identifier */
  id: BoardId;
  /** All nodes on the board */
  nodes: NetworkNodeState[];
  /** All edges on the board */
  edges: NetworkEdgeState[];
  /** All pieces on the board */
  pieces: NetworkPieceState[];
}

/** State of a cell on a square grid board (matches SimpleSquareCellState) */
export interface SquareCellState {
  /** Row index (0-based) */
  row: number;
  /** Column index (0-based) */
  col: number;
  /** Cell type identifier for rendering */
  typeId?: TileTypeId;
  /** Player ID who owns this cell */
  owner?: PlayerId;
  /** JSON-serialized custom properties */
  properties?: string;
}

/** State of a piece placed on a square grid cell (matches SimpleSquarePieceState) */
export interface SquarePieceState {
  /** Unique piece identifier */
  id: PieceId;
  /** Row index where piece is located */
  row: number;
  /** Column index where piece is located */
  col: number;
  /** Piece type identifier for rendering */
  typeId: PieceTypeId;
  /** Player ID who owns this piece */
  owner?: PlayerId;
  /** JSON-serialized custom properties */
  properties?: string;
}

/** Complete state of a square grid board (matches SimpleSquareBoardState) */
export interface SquareBoardState {
  /** Unique board identifier */
  id: BoardId;
  /** Number of rows in the grid */
  rows: number;
  /** Number of columns in the grid */
  cols: number;
  /** All cells with non-default state */
  cells: SquareCellState[];
  /** All pieces on the board */
  pieces: SquarePieceState[];
}

/** State of a space on a track board (matches SimpleTrackSpaceState) */
export interface TrackSpaceState {
  /** Unique space identifier */
  id: SpaceId;
  /** Position index in the track sequence */
  index: number;
  /** X coordinate for rendering */
  x: number;
  /** Y coordinate for rendering */
  y: number;
  /** Display name of the space */
  name?: string;
  /** Space type identifier for rendering */
  typeId?: SpaceTypeId;
  /** Player ID who owns this space */
  owner?: PlayerId;
  /** IDs of spaces that can be reached from here (for branching tracks) */
  nextSpaces?: SpaceId[];
  /** JSON-serialized custom properties */
  properties?: string;
}

/** State of a piece on a track board (matches SimpleTrackPieceState) */
export interface TrackPieceState {
  /** Unique piece identifier */
  id: PieceId;
  /** ID of the space this piece occupies */
  spaceId: SpaceId;
  /** Player ID who owns this piece */
  owner: PlayerId;
  /** Piece type identifier for rendering */
  typeId?: PieceTypeId;
  /** JSON-serialized custom properties */
  properties?: string;
}

/** Complete state of a track board (matches SimpleTrackBoardState) */
export interface TrackBoardState {
  /** Unique board identifier */
  id: BoardId;
  /** All spaces on the track */
  spaces: TrackSpaceState[];
  /** All pieces on the track */
  pieces: TrackPieceState[];
}

/** State of a die component (matches SimpleDieState) */
export interface DieState {
  /** Unique die identifier */
  id: DieId;
  /** Number of sides on the die (e.g., 6 for standard die) */
  sides: number;
  /** Current face value (1 to sides, undefined if not rolled) */
  currentValue?: number;
  /** Optional color for visual identification */
  color?: string;
}

/**
 * Container for all board states organized by type.
 * This is the strongly-typed replacement for SimpleBoardStates.
 * Maps board IDs to their board state. Empty object if no boards of that type.
 */
export interface BoardStates {
  /** Map of board IDs to hex board states (e.g., Catan, Hive) */
  hex: Record<BoardId, HexBoardState>;
  /** Map of board IDs to network board states (e.g., Ticket to Ride) */
  network: Record<BoardId, NetworkBoardState>;
  /** Map of board IDs to square grid board states (e.g., Chess, Go) */
  square: Record<BoardId, SquareBoardState>;
  /** Map of board IDs to track board states (e.g., Monopoly) */
  track: Record<BoardId, TrackBoardState>;
}

/**
 * Container for all dice states.
 * Maps die IDs to their die state.
 */
export type DiceStates = Record<DieId, DieState>;

/**
 * CardInfo as received from the store (after transformation).
 * The store parses the JSON-serialized properties string from the backend
 * into a typed CardProperties object.
 */
export interface CardInfo {
  /** Unique card instance identifier */
  id: CardId;
  cardName?: string;
  cardType: string;
  description?: string;
  /** Parsed properties object (store transforms from JSON string) */
  properties: CardProperties;
}

/** Public hand cards grouped by player ID for a single hand ID. */
export type PublicHandsByPlayerId = Record<PlayerId, CardId[]>;

/** Public hand cards grouped by hand ID, then player ID. */
export type PublicHandsByHandId = Record<HandId, PublicHandsByPlayerId>;

export interface GameState {
  /** All currently active players (supports MULTIPLE_ACTIVE_PLAYER states) */
  currentPlayerIds: PlayerId[];
  decks: CardIdsByDeckId;
  hands: CardIdsByHandId;
  /** Public hands grouped by handId -> playerId -> card IDs */
  publicHands: PublicHandsByHandId;
  /** Map of card IDs to their card info including type and properties */
  cards: Record<CardId, CardInfo>;
  globalVariables: GlobalState;
  playerVariables: Record<PlayerId, PlayerState>;
  /** Map of player IDs to their resource amounts (resourceId -> amount) */
  playerResources: Record<PlayerId, Record<string, number>>;
  currentState: StateName;
  isMyTurn: boolean;
  uiArgs?: Record<PlayerId, AnyUIArgs>;
  boards: BoardStates;
  dice: DiceStates;
}
