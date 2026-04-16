export interface GeneratedTiledEdgeStateLike<
  SpaceIdValue extends string = string,
> {
  id: string;
  spaceIds: readonly SpaceIdValue[];
  typeId?: string | null;
  label?: string | null;
  ownerId?: string | null;
  fields?: Record<string, unknown>;
}

export interface GeneratedTiledVertexStateLike<
  SpaceIdValue extends string = string,
> {
  id: string;
  spaceIds: readonly SpaceIdValue[];
  typeId?: string | null;
  label?: string | null;
  ownerId?: string | null;
  fields?: Record<string, unknown>;
}

export interface GeneratedHexSpaceStateLike<
  SpaceIdValue extends string = string,
> {
  id: SpaceIdValue;
  q: number;
  r: number;
  typeId?: string | null;
  label?: string | null;
  ownerId?: string | null;
  fields?: Record<string, unknown>;
}

export interface GeneratedSquareSpaceStateLike<
  SpaceIdValue extends string = string,
> {
  id: SpaceIdValue;
  row: number;
  col: number;
  typeId?: string | null;
  label?: string | null;
  ownerId?: string | null;
  fields?: Record<string, unknown>;
}

