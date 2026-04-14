import { z } from "zod";

export const PlayerId = z.string();
export type PlayerId = z.infer<typeof PlayerId>;

export const CardId = z.string();
export type CardId = z.infer<typeof CardId>;

export const HandId = z.string();
export type HandId = z.infer<typeof HandId>;

export const ResourceId = z.string();
export type ResourceId = z.infer<typeof ResourceId>;

export const BoardId = z.string();
export type BoardId = z.infer<typeof BoardId>;

export const SpaceId = z.string();
export type SpaceId = z.infer<typeof SpaceId>;

export const SpaceTypeId = z.string();
export type SpaceTypeId = z.infer<typeof SpaceTypeId>;

export const PieceId = z.string();
export type PieceId = z.infer<typeof PieceId>;

export const PieceTypeId = z.string();
export type PieceTypeId = z.infer<typeof PieceTypeId>;

export const DieId = z.string();
export type DieId = z.infer<typeof DieId>;

export const TileId = z.string();
export type TileId = z.infer<typeof TileId>;

export const TileTypeId = z.string();
export type TileTypeId = z.infer<typeof TileTypeId>;

export const EdgeId = z.string();
export type EdgeId = z.infer<typeof EdgeId>;

export const EdgeTypeId = z.string();
export type EdgeTypeId = z.infer<typeof EdgeTypeId>;

export const VertexId = z.string();
export type VertexId = z.infer<typeof VertexId>;

export const VertexTypeId = z.string();
export type VertexTypeId = z.infer<typeof VertexTypeId>;

export const ActionName = z.string();
export type ActionName = z.infer<typeof ActionName>;

export const StateName = z.string();
export type StateName = z.infer<typeof StateName>;

export const ActivePlayerStateName = z.string();
export type ActivePlayerStateName = z.infer<typeof ActivePlayerStateName>;

export const AllActivePlayerStateNames: ActivePlayerStateName[] = [
  "setup",
  "play",
];

export type ActionsForPhase = Record<ActivePlayerStateName, ActionName[]>;
export const ActionsByPhase: {
  [K in ActivePlayerStateName]: ActionsForPhase[K];
} = {
  setup: [],
  play: [],
} as { [K in ActivePlayerStateName]: ActionsForPhase[K] };

export type ActionParametersFor<_Action extends ActionName> = Record<
  string,
  unknown
>;

export type CardIdsByDeckId = Record<string, CardId[]>;
export type CardIdsByHandId = Record<string, CardId[]>;
export type CardProperties = Record<string, unknown>;
export type GlobalState = Record<string, unknown>;
export type PlayerState = Record<string, unknown>;
export type EdgePropertiesByBoardId = Record<string, Record<string, unknown>>;
export type TilePropertiesByBoardId = Record<string, Record<string, unknown>>;
export type VertexPropertiesByBoardId = Record<string, Record<string, unknown>>;
