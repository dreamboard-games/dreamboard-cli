/**
 * manifest.ts - Dynamically generated types
 *
 * This file will be generated based on the game's BoardManifest.
 * The ui-sdk references these types but does not bundle them.
 *
 * Note: CardItem and CardInfo are concrete SDK types defined in player-state.ts,
 * not game-specific placeholders.
 */

// Placeholder types - will be replaced by generated manifest
export type PlayerId = string;
export type ResourceId = string;
export type CardId = string;
export type DeckId = string;
export type HandId = string;
export type CardProperties = Record<string, unknown>;
export type CardPropertiesByType = Record<string, CardProperties>;

export type CardIdsByDeckId = Record<DeckId, CardId[]>;
export type CardIdsByHandId = Record<HandId, CardId[]>;
export type StateName = string;
export type ActivePlayerStateName = string;
export const AllActivePlayerStateNames: ActivePlayerStateName[] = [];
export type GlobalState = Record<string, unknown>;
export type PlayerState = Record<string, unknown>;
export type ActionName = string;
export type ActionParametersFor<_ extends ActionName> = Record<string, unknown>;

export type ActionsForPhase = Record<ActivePlayerStateName, ActionName[]>;
export const ActionsByPhase: {
  [K in ActivePlayerStateName]: ActionsForPhase[K];
} = {} as { [K in ActivePlayerStateName]: ActionsForPhase[K] };

// ============================================================================
// Board-related placeholder types - will be replaced by generated manifest
// ============================================================================

// Board identifiers
export type BoardId = string;
export type DieId = string;

// Hex board types - used for action parameters
export type TileId = string;
export type TileTypeId = string;
export type EdgeId = [TileId, TileId];
export type EdgeTypeId = string;
export type VertexId = [TileId, TileId, TileId];
export type VertexTypeId = string;

// Track board types
export type SpaceId = string;
export type SpaceTypeId = string;

// Piece types (used by network, square, track boards)
export type PieceId = string;
export type PieceTypeId = string;

export type TilePropertiesByBoardId = Record<BoardId, Record<string, string>>;
export type EdgePropertiesByBoardId = Record<BoardId, Record<string, string>>;
export type VertexPropertiesByBoardId = Record<BoardId, Record<string, string>>;
export type SpacePropertiesByBoardId = Record<BoardId, Record<string, string>>;
export type PiecePropertiesByBoardId = Record<BoardId, Record<string, string>>;
