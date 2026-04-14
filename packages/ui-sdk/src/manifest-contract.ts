/**
 * manifest-contract.ts - Dynamically generated types
 *
 * This file will be generated based on the game's topology manifest.
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

export interface BoardState<BoardIdValue extends BoardId = BoardId> {
  id: BoardIdValue;
  fields: Record<string, unknown>;
  spaces: Record<string, BoardSpaceState<BoardIdValue>>;
  relations: Array<BoardRelationState<BoardIdValue>>;
  containers: Record<string, BoardContainerState<BoardIdValue>>;
}
export type BoardFields<BoardIdValue extends BoardId = BoardId> =
  BoardState<BoardIdValue>["fields"];
export type BoardSpaceStateByBoardId = Record<BoardId, Record<string, unknown>>;
export interface BoardSpaceState<BoardIdValue extends BoardId = BoardId> {
  id: SpaceId;
  typeId?: SpaceTypeId | null;
  fields: BoardSpaceFields<BoardIdValue>;
}
export type BoardSpaceFields<BoardIdValue extends BoardId = BoardId> =
  BoardSpaceStateByBoardId[BoardIdValue];
export type BoardRelationStateByBoardId = Record<
  BoardId,
  Record<string, unknown>
>;
export interface BoardRelationState<BoardIdValue extends BoardId = BoardId> {
  typeId: string;
  fields: BoardRelationFields<BoardIdValue>;
}
export type BoardRelationFields<BoardIdValue extends BoardId = BoardId> =
  BoardRelationStateByBoardId[BoardIdValue];
export type BoardContainerStateByBoardId = Record<
  BoardId,
  Record<string, unknown>
>;
export interface BoardContainerState<BoardIdValue extends BoardId = BoardId> {
  id: string;
  fields: BoardContainerFields<BoardIdValue>;
}
export type BoardContainerFields<BoardIdValue extends BoardId = BoardId> =
  BoardContainerStateByBoardId[BoardIdValue];

export type HexEdgeState<BoardIdValue extends BoardId = BoardId> = Record<
  string,
  unknown
> & { fields: HexEdgeFields<BoardIdValue> };
export type HexEdgeFields<BoardIdValue extends BoardId = BoardId> = Record<
  string,
  unknown
> &
  (BoardIdValue extends BoardId ? {} : never);
export type HexVertexState<BoardIdValue extends BoardId = BoardId> = Record<
  string,
  unknown
> & { fields: HexVertexFields<BoardIdValue> };
export type HexVertexFields<BoardIdValue extends BoardId = BoardId> = Record<
  string,
  unknown
> &
  (BoardIdValue extends BoardId ? {} : never);
export type SquareEdgeState<BoardIdValue extends BoardId = BoardId> = Record<
  string,
  unknown
> & { fields: SquareEdgeFields<BoardIdValue> };
export type SquareEdgeFields<BoardIdValue extends BoardId = BoardId> = Record<
  string,
  unknown
> &
  (BoardIdValue extends BoardId ? {} : never);
export type SquareVertexState<BoardIdValue extends BoardId = BoardId> = Record<
  string,
  unknown
> & { fields: SquareVertexFields<BoardIdValue> };
export type SquareVertexFields<BoardIdValue extends BoardId = BoardId> = Record<
  string,
  unknown
> &
  (BoardIdValue extends BoardId ? {} : never);
export type TiledBoardId = BoardId;
export type TiledEdgeState<BoardIdValue extends TiledBoardId = TiledBoardId> =
  Record<string, unknown> & { fields: TiledEdgeFields<BoardIdValue> };
export type TiledEdgeFields<BoardIdValue extends TiledBoardId = TiledBoardId> =
  Record<string, unknown> & (BoardIdValue extends TiledBoardId ? {} : never);
export type TiledVertexState<BoardIdValue extends TiledBoardId = TiledBoardId> =
  Record<string, unknown> & { fields: TiledVertexFields<BoardIdValue> };
export type TiledVertexFields<
  BoardIdValue extends TiledBoardId = TiledBoardId,
> = Record<string, unknown> & (BoardIdValue extends TiledBoardId ? {} : never);

export const boardHelpers = {
  boardIdsByBaseId: {} as const,
  boardLayoutById: {} as const,
  boardIdsByTypeId: {} as const,
  spaceIdsByBoardId: {} as const,
  spaceTypeIdByBoardId: {} as const,
  spaceIdsByTypeId: {} as const,
  containerIdsByBoardId: {} as const,
  containerHostByBoardId: {} as const,
  relationTypeIdsByBoardId: {} as const,
  edgeIdsByTypeId: {} as const,
  vertexIdsByTypeId: {} as const,
} as const;
