import type {
  PlayerId,
  CardId,
  CardIdsByDeckId,
  CardProperties,
  EdgeTypeId,
  VertexTypeId,
  BoardId,
  PieceId,
  PieceTypeId,
  SpaceId,
  SpaceTypeId,
  DieId,
} from "../manifest-contract.js";

type CardIdsByHandId = Record<string, CardId[]>;
type StateName = string;
type TilePropertiesByBoardId = Record<BoardId, Record<string, unknown>>;
type EdgePropertiesByBoardId = Record<BoardId, Record<string, unknown>>;
type VertexPropertiesByBoardId = Record<BoardId, Record<string, unknown>>;

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
 * Card item for reducer-native frontend use.
 * This is the parsed, typed card payload delivered through reducer views.
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
  id: SpaceId;
  /** Axial coordinate Q */
  q: number;
  /** Axial coordinate R */
  r: number;
  /** Tile type identifier for rendering */
  typeId?: SpaceTypeId;
  /** Display label on the tile */
  label?: string;
  /** Player ID who owns this tile */
  owner?: PlayerId;
  /** JSON-serialized custom properties */
  properties?: B extends keyof TilePropertiesByBoardId
    ? TilePropertiesByBoardId[B]
    : undefined;
}

/** State of an edge on a reducer-projected hex board. */
export interface HexEdgeState<B extends BoardId = BoardId> {
  /** Unique edge identifier (serialized string, e.g., "tile1-tile2") */
  id: string;
  /** First hex tile ID this edge borders */
  hex1: SpaceId;
  /** Second hex tile ID this edge borders */
  hex2: SpaceId;
  /** Edge type identifier for rendering */
  typeId?: EdgeTypeId;
  /** Player ID who owns this edge */
  owner?: PlayerId;
  /** JSON-serialized custom properties */
  properties?: B extends keyof EdgePropertiesByBoardId
    ? EdgePropertiesByBoardId[B]
    : undefined;
}

/** State of a vertex on a reducer-projected hex board. */
export interface HexVertexState<B extends BoardId = BoardId> {
  /** Unique vertex identifier (serialized string, e.g., "tile1-tile2-tile3") */
  id: string;
  /** The three hex tile IDs this vertex touches */
  hexes: [SpaceId, SpaceId, SpaceId];
  /** Vertex type identifier for rendering */
  typeId?: VertexTypeId;
  /** Player ID who owns this vertex */
  owner?: PlayerId;
  /** JSON-serialized custom properties */
  properties?: B extends keyof VertexPropertiesByBoardId
    ? VertexPropertiesByBoardId[B]
    : undefined;
}

/** Complete state of a reducer-projected hex board. */
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

/** State of a node in a reducer-projected network board. */
export interface NetworkNodeState {
  /** Unique node identifier */
  id: SpaceId;
  /** X coordinate position */
  x: number;
  /** Y coordinate position */
  y: number;
  /** Node type identifier for rendering */
  typeId?: SpaceTypeId;
  /** Display label on the node */
  label?: string;
  /** Player ID who owns this node */
  owner?: PlayerId;
  /** JSON-serialized custom properties */
  properties?: string;
}

/** State of an edge connecting two nodes in a reducer-projected network board. */
export interface NetworkEdgeState {
  /** Unique edge identifier */
  id: string;
  /** Source node ID */
  from: SpaceId;
  /** Target node ID */
  to: SpaceId;
  /** Edge type identifier for rendering */
  typeId?: string;
  /** Display label on the edge */
  label?: string;
  /** Player ID who owns this edge */
  owner?: PlayerId;
  /** JSON-serialized custom properties */
  properties?: string;
}

/** State of a piece placed on a reducer-projected network node. */
export interface NetworkPieceState {
  /** Unique piece identifier */
  id: PieceId;
  /** Node ID where this piece is placed */
  nodeId: SpaceId;
  /** Piece type identifier for rendering */
  typeId?: PieceTypeId;
  /** Player ID who owns this piece */
  owner?: PlayerId;
  /** JSON-serialized custom properties */
  properties?: string;
}

/** Complete state of a reducer-projected network board. */
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

/** State of a cell on a reducer-projected square grid board. */
export interface SquareCellState {
  /** Unique cell identifier */
  id: SpaceId;
  /** Row index (0-based) */
  row: number;
  /** Column index (0-based) */
  col: number;
  /** Cell type identifier for rendering */
  typeId?: SpaceTypeId;
  /** Display label on the cell */
  label?: string;
  /** Player ID who owns this cell */
  owner?: PlayerId;
  /** JSON-serialized custom properties */
  properties?: string;
}

/** State of an edge on a reducer-projected square grid board. */
export interface SquareEdgeState {
  /** Unique edge identifier */
  id: string;
  /** The cell IDs this edge borders */
  spaceIds: SpaceId[];
  /** Edge type identifier for rendering */
  typeId?: EdgeTypeId;
  /** Display label for setup or rendering */
  label?: string;
  /** Player ID who owns this edge */
  owner?: PlayerId;
  /** JSON-serialized custom properties */
  properties?: string;
}

/** State of a vertex on a reducer-projected square grid board. */
export interface SquareVertexState {
  /** Unique vertex identifier */
  id: string;
  /** The cell IDs that touch this corner */
  spaceIds: SpaceId[];
  /** Vertex type identifier for rendering */
  typeId?: VertexTypeId;
  /** Display label for setup or rendering */
  label?: string;
  /** Player ID who owns this vertex */
  owner?: PlayerId;
  /** JSON-serialized custom properties */
  properties?: string;
}

/** State of a piece placed on a reducer-projected square grid cell. */
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

/** Complete state of a reducer-projected square grid board. */
export interface SquareBoardState {
  /** Unique board identifier */
  id: BoardId;
  /** Number of rows in the grid */
  rows: number;
  /** Number of columns in the grid */
  cols: number;
  /** All authored cells on the board */
  cells: SquareCellState[];
  /** All edges on the board */
  edges: SquareEdgeState[];
  /** All vertices on the board */
  vertices: SquareVertexState[];
  /** All pieces on the board */
  pieces: SquarePieceState[];
}

/** State of a space on a reducer-projected track board. */
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

/** State of a piece on a reducer-projected track board. */
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

/** Complete state of a reducer-projected track board. */
export interface TrackBoardState {
  /** Unique board identifier */
  id: BoardId;
  /** All spaces on the track */
  spaces: TrackSpaceState[];
  /** All pieces on the track */
  pieces: TrackPieceState[];
}

/** State of a reducer-projected die component. */
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
 * This is the strongly-typed board payload authored UIs consume from reducer views.
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
 * Parsed card payload as received from the reducer-native store.
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

export interface GameState {
  /** All currently active players (supports MULTIPLE_ACTIVE_PLAYER states) */
  currentPlayerIds: PlayerId[];
  decks: CardIdsByDeckId;
  hands: CardIdsByHandId;
  /** Map of card IDs to their card info including type and properties */
  cards: Record<CardId, CardInfo>;
  /** Map of player IDs to their resource amounts (resourceId -> amount) */
  playerResources: Record<PlayerId, Record<string, number>>;
  currentState: StateName;
  isMyTurn: boolean;
  boards: BoardStates;
  dice: DiceStates;
}
