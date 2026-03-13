export type ActionName = "play" | "pass";

export type StateName = "setup" | "play" | "gameOver";

export type ActivePlayerStateName = "play";

export const AllActivePlayerStateNames: ActivePlayerStateName[] = ["play"];

export type GameEvent = string;

export type PlayerEvent = string;

export type PlayerId = string;

export type ResourceId = string;

export type CardId = string;

export type DeckId = string;

export type HandId = string;

export type DieId = string;

export type BoardId = string;

export type TileId = string;

export type EdgeId = string | [TileId, TileId];

export type VertexId = string | [TileId, TileId, TileId];

export type SpaceId = string;

export type PieceId = string;

export type TileTypeId = string;

export type EdgeTypeId = string;

export type VertexTypeId = string;

export type SpaceTypeId = string;

export type PieceTypeId = string;

export type CardProperties = Record<string, unknown>;

export type CardPropertiesByType = Record<string, CardProperties>;

export type CardPropertiesById = Record<CardId, CardProperties>;

export type CardIdsByDeckId = Record<DeckId, CardId[]>;

export type CardIdsByHandId = Record<HandId, CardId[]>;

export type GlobalState = Record<string, unknown>;

export type PlayerState = Record<string, unknown>;

export type ActionErrorCodes = string;

export type NextStateFor<_S extends StateName> = StateName;

export type ActionParametersFor<_A extends ActionName> = Record<
  string,
  unknown
>;

export type ActionsForPhase = {
  play: ActionName[];
};

export const ActionsByPhase: {
  [K in ActivePlayerStateName]: ActionsForPhase[K];
} = {
  play: ["play", "pass"],
};

export type CardTypeByDeckId = Record<string, string[]>;

export type CardTypeByHandId = Record<string, string[]>;

export type TileProperties = Record<string, unknown>;

export type EdgeProperties = Record<string, unknown>;

export type VertexProperties = Record<string, unknown>;

export type SpaceProperties = Record<string, unknown>;

export type PieceProperties = Record<string, unknown>;

export type TilePropertiesByBoardId = Record<BoardId, TileProperties>;

export type EdgePropertiesByBoardId = Record<BoardId, EdgeProperties>;

export type VertexPropertiesByBoardId = Record<BoardId, VertexProperties>;

export type SpacePropertiesByBoardId = Record<BoardId, SpaceProperties>;

export type PiecePropertiesByBoardId = Record<BoardId, PieceProperties>;

export interface Player {
  id: PlayerId;
  name: string;
  score?: number;
}
