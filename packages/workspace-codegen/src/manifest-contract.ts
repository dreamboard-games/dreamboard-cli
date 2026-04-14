import type {
  BoardEdgeRef,
  BoardContainerSpec,
  BoardCard,
  BoardRelationSpec,
  BoardSpec,
  BoardSpaceSpec,
  BoardTemplateSpec,
  BoardVertexRef,
  GameTopologyManifest,
  GenericBoardSpec,
  GenericBoardTemplateSpec,
  HexBoardSpec,
  HexBoardTemplateSpec,
  HexEdgeRef,
  HexEdgeSpec,
  HexSpaceSpec,
  HexVertexRef,
  HexVertexSpec,
  ManualCardSetDefinition,
  ObjectSchema,
  PieceSeedSpec,
  PropertySchema,
  SquareBoardSpec,
  SquareBoardTemplateSpec,
  SquareEdgeSpec,
  SquareSpaceSpec,
  SquareVertexSpec,
  ZoneSpec,
} from "@dreamboard/sdk-types";
import { resolveHexVertexGeometryKey } from "./hex-geometry.js";
import {
  addStandardDecksIfNeeded,
  materializeCardSet,
} from "./preset-card-sets.js";

interface AnalyzedGenericBoard {
  layout: "generic";
  board: GenericBoardSpec;
  template?: GenericBoardTemplateSpec;
  boardTypeId?: string | null;
  runtimeBoardIds: string[];
  boardFieldsSchema?: ObjectSchema | null;
  spaceFieldsSchema?: ObjectSchema | null;
  relationFieldsSchema?: ObjectSchema | null;
  containerFieldsSchema?: ObjectSchema | null;
  spaces: BoardSpaceSpec[];
  relations: BoardRelationSpec[];
  containers: BoardContainerSpec[];
}

interface AnalyzedHexBoard {
  layout: "hex";
  board: HexBoardSpec;
  template?: HexBoardTemplateSpec;
  boardTypeId?: string | null;
  runtimeBoardIds: string[];
  boardFieldsSchema?: ObjectSchema | null;
  spaceFieldsSchema?: ObjectSchema | null;
  edgeFieldsSchema?: ObjectSchema | null;
  vertexFieldsSchema?: ObjectSchema | null;
  spaces: HexSpaceSpec[];
  edges: Array<{
    id: string;
    spaceIds: string[];
    typeId?: string | null;
    label?: string | null;
    fields?: Record<string, unknown> | null;
  }>;
  vertices: Array<{
    id: string;
    spaceIds: string[];
    typeId?: string | null;
    label?: string | null;
    fields?: Record<string, unknown> | null;
  }>;
}

interface AnalyzedSquareBoard {
  layout: "square";
  board: SquareBoardSpec;
  template?: SquareBoardTemplateSpec;
  boardTypeId?: string | null;
  runtimeBoardIds: string[];
  boardFieldsSchema?: ObjectSchema | null;
  spaceFieldsSchema?: ObjectSchema | null;
  relationFieldsSchema?: ObjectSchema | null;
  containerFieldsSchema?: ObjectSchema | null;
  edgeFieldsSchema?: ObjectSchema | null;
  vertexFieldsSchema?: ObjectSchema | null;
  spaces: SquareSpaceSpec[];
  relations: BoardRelationSpec[];
  containers: BoardContainerSpec[];
  edges: Array<{
    id: string;
    spaceIds: string[];
    typeId?: string | null;
    label?: string | null;
    fields?: Record<string, unknown> | null;
  }>;
  vertices: Array<{
    id: string;
    spaceIds: string[];
    typeId?: string | null;
    label?: string | null;
    fields?: Record<string, unknown> | null;
  }>;
}

type AnalyzedBoard =
  | AnalyzedGenericBoard
  | AnalyzedHexBoard
  | AnalyzedSquareBoard;

interface ManifestAnalysis {
  manifest: GameTopologyManifest;
  playerIds: string[];
  sharedZones: ZoneSpec[];
  playerZones: ZoneSpec[];
  zoneIds: string[];
  cardSets: ManualCardSetDefinition[];
  cardSetIds: string[];
  cardTypes: string[];
  cardIds: string[];
  cardSetIdByCardId: Map<string, string>;
  cardTypeByCardId: Map<string, string>;
  sharedZoneCardSetIds: Map<string, string[]>;
  playerZoneCardSetIds: Map<string, string[]>;
  zoneCardSetIdsById: Map<string, string[]>;
  zoneVisibilityById: Map<string, string>;
  resourceIds: string[];
  setupOptionIds: string[];
  setupProfileIds: string[];
  setupChoiceIdsByOptionId: Map<string, string[]>;
  setupOptionsById: Record<
    string,
    {
      id: string;
      name: string;
      description?: string | null;
      choices: ReadonlyArray<{
        id: string;
        label: string;
        description?: string | null;
      }>;
    }
  >;
  setupProfilesById: Record<
    string,
    {
      id: string;
      name: string;
      description?: string | null;
      optionValues?: Record<string, string> | null;
    }
  >;
  pieceTypeIds: string[];
  pieceIds: string[];
  pieceTypeIdByPieceId: Map<string, string>;
  dieTypeIds: string[];
  dieIds: string[];
  dieTypeIdByDieId: Map<string, string>;
  boardBaseIds: string[];
  boardIds: string[];
  boardContainerIds: string[];
  boardTypeIds: string[];
  boardLayoutById: Map<string, string>;
  boardIdsByBaseId: Map<string, string[]>;
  boardIdsByTypeId: Map<string, string[]>;
  spaceIdsByBoardId: Map<string, string[]>;
  spaceIdsByTypeId: Map<string, string[]>;
  containerIdsByBoardId: Map<string, string[]>;
  relationTypeIds: string[];
  relationTypeIdsByBoardId: Map<string, string[]>;
  edgeIds: string[];
  edgeTypeIds: string[];
  edgeIdsByTypeId: Map<string, string[]>;
  vertexIds: string[];
  vertexTypeIds: string[];
  vertexIdsByTypeId: Map<string, string[]>;
  spaceIds: string[];
  spaceTypeIds: string[];
  analyzedBoards: AnalyzedBoard[];
  pieceTypeSchemasById: Map<string, ObjectSchema | null | undefined>;
  dieTypeSchemasById: Map<string, ObjectSchema | null | undefined>;
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function toPascalCase(input: string): string {
  return input
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function renderBlocks(blocks: Array<string | null | undefined>): string {
  return blocks.filter((block): block is string => Boolean(block)).join("\n\n");
}

function dedupeSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(values)).sort();
}

function renderConstArray(values: readonly string[]): string {
  return `[${values.map((value) => quote(value)).join(", ")}] as const`;
}

function renderStringUnion(
  values: readonly string[],
  fallback = "never",
): string {
  return values.length > 0
    ? values.map((value) => quote(value)).join(" | ")
    : fallback;
}

function renderStringRecord(
  entries: Iterable<readonly [string, string]>,
): string {
  const lines = Array.from(entries)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `  ${quote(key)}: ${quote(value)},`);
  return `{\n${lines.join("\n")}\n} as const`;
}

function renderReadonlyArrayRecord(
  entries: Iterable<readonly [string, readonly string[]]>,
): string {
  const lines = Array.from(entries)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([key, values]) =>
        `  ${quote(key)}: [${values.map((value) => quote(value)).join(", ")}] as const,`,
    );
  return `{\n${lines.join("\n")}\n} as const`;
}

function renderJsonConst(value: unknown): string {
  return `${JSON.stringify(value, null, 2)} as const`;
}

function renderCardInstanceIds(card: BoardCard): string[] {
  if (card.count > 1) {
    return Array.from(
      { length: card.count },
      (_, index) => `${card.type}-${index + 1}`,
    );
  }
  return [card.type];
}

function expandSeedIds(
  seeds: ReadonlyArray<
    | PieceSeedSpec
    | { id?: string | null; typeId: string; count?: number | null }
  >,
): string[] {
  const expanded: string[] = [];
  for (const seed of seeds) {
    const count = seed.count ?? 1;
    const baseId = seed.id ?? seed.typeId;
    if (count <= 1) {
      expanded.push(baseId);
      continue;
    }
    for (let index = 1; index <= count; index += 1) {
      expanded.push(`${baseId}-${index}`);
    }
  }
  return expanded;
}

function isHexBoardTemplateSpec(
  boardTemplate: BoardTemplateSpec,
): boardTemplate is HexBoardTemplateSpec {
  return boardTemplate.layout === "hex";
}

function isSquareBoardTemplateSpec(
  boardTemplate: BoardTemplateSpec,
): boardTemplate is SquareBoardTemplateSpec {
  return boardTemplate.layout === "square";
}

function isGenericBoardTemplateSpec(
  boardTemplate: BoardTemplateSpec,
): boardTemplate is GenericBoardTemplateSpec {
  return boardTemplate.layout === "generic";
}

function isHexBoardSpec(board: BoardSpec): board is HexBoardSpec {
  return board.layout === "hex";
}

function isSquareBoardSpec(board: BoardSpec): board is SquareBoardSpec {
  return board.layout === "square";
}

const HEX_SIDES = ["e", "ne", "nw", "w", "sw", "se"] as const;
const HEX_CORNERS = ["ne-e", "e-se", "se-sw", "sw-w", "w-nw", "nw-ne"] as const;

type HexSide = (typeof HEX_SIDES)[number];
type HexCorner = (typeof HEX_CORNERS)[number];

const HEX_SIDE_OFFSETS: Record<HexSide, readonly [number, number]> = {
  e: [1, 0],
  ne: [1, -1],
  nw: [0, -1],
  w: [-1, 0],
  sw: [-1, 1],
  se: [0, 1],
};

const HEX_CORNER_OFFSETS: Record<HexCorner, readonly [number, number, number]> =
  {
    "ne-e": [2, -1, -1],
    "e-se": [1, -2, 1],
    "se-sw": [-1, -1, 2],
    "sw-w": [-2, 1, 1],
    "w-nw": [-1, 2, -1],
    "nw-ne": [1, 1, -2],
  };

const HEX_SIDE_CORNERS: Record<HexSide, readonly [HexCorner, HexCorner]> = {
  e: ["ne-e", "e-se"],
  ne: ["nw-ne", "ne-e"],
  nw: ["w-nw", "nw-ne"],
  w: ["sw-w", "w-nw"],
  sw: ["se-sw", "sw-w"],
  se: ["e-se", "se-sw"],
};

const HEX_CORNER_SIDES: Record<HexCorner, readonly [HexSide, HexSide]> = {
  "ne-e": ["ne", "e"],
  "e-se": ["e", "se"],
  "se-sw": ["se", "sw"],
  "sw-w": ["sw", "w"],
  "w-nw": ["w", "nw"],
  "nw-ne": ["nw", "ne"],
};

interface ResolvedHexEdge {
  id: string;
  geometryKey: string;
  spaceIds: string[];
  typeId?: string | null;
  label?: string | null;
  fields?: Record<string, unknown> | null;
}

interface ResolvedHexVertex {
  id: string;
  geometryKey: string;
  spaceIds: string[];
  typeId?: string | null;
  label?: string | null;
  fields?: Record<string, unknown> | null;
}

function cubeFromAxial(
  space: Pick<HexSpaceSpec, "q" | "r">,
): readonly [number, number, number] {
  const x = space.q;
  const z = space.r;
  return [x, -x - z, z] as const;
}

function cornerGeometryKey(
  space: Pick<HexSpaceSpec, "q" | "r">,
  corner: HexCorner,
) {
  const [x, y, z] = cubeFromAxial(space);
  const [dx, dy, dz] = HEX_CORNER_OFFSETS[corner];
  return `${3 * x + dx},${3 * y + dy},${3 * z + dz}`;
}

function edgeGeometryKey(space: Pick<HexSpaceSpec, "q" | "r">, side: HexSide) {
  const [leftCorner, rightCorner] = HEX_SIDE_CORNERS[side];
  return [
    cornerGeometryKey(space, leftCorner),
    cornerGeometryKey(space, rightCorner),
  ]
    .sort((left, right) => left.localeCompare(right))
    .join("::");
}

function edgeIdFromGeometryKey(key: string): string {
  return `hex-edge:${key}`;
}

function vertexIdFromGeometryKey(key: string): string {
  return `hex-vertex:${key}`;
}

const SQUARE_SIDES = ["north", "east", "south", "west"] as const;
const SQUARE_CORNERS = ["nw", "ne", "se", "sw"] as const;

type SquareSide = (typeof SQUARE_SIDES)[number];
type SquareCorner = (typeof SQUARE_CORNERS)[number];

function squareEdgeIdFromGeometryKey(key: string): string {
  return `square-edge:${key}`;
}

function squareVertexIdFromGeometryKey(key: string): string {
  return `square-vertex:${key}`;
}

function squareCornerGeometryKey(
  space: Pick<SquareSpaceSpec, "row" | "col">,
  corner: SquareCorner,
): string {
  switch (corner) {
    case "nw":
      return `${space.col},${space.row}`;
    case "ne":
      return `${space.col + 1},${space.row}`;
    case "se":
      return `${space.col + 1},${space.row + 1}`;
    case "sw":
      return `${space.col},${space.row + 1}`;
  }
}

function squareEdgeGeometryKey(
  space: Pick<SquareSpaceSpec, "row" | "col">,
  side: SquareSide,
): string {
  const endpoints =
    side === "north"
      ? [`${space.col},${space.row}`, `${space.col + 1},${space.row}`]
      : side === "east"
        ? [`${space.col + 1},${space.row}`, `${space.col + 1},${space.row + 1}`]
        : side === "south"
          ? [
              `${space.col},${space.row + 1}`,
              `${space.col + 1},${space.row + 1}`,
            ]
          : [`${space.col},${space.row}`, `${space.col},${space.row + 1}`];
  return endpoints.sort((left, right) => left.localeCompare(right)).join("::");
}

function geometryKeyFromSquareEdgeRef(
  ref: BoardEdgeRef,
  spacesById: ReadonlyMap<string, SquareSpaceSpec>,
): string {
  const resolvedSpaces = [...ref.spaces]
    .sort((a, b) => a.localeCompare(b))
    .map((spaceId) => {
      const space = spacesById.get(spaceId);
      if (!space) {
        throw new Error(
          `Square edge ref references unknown space '${spaceId}'.`,
        );
      }
      return space;
    });
  const keyCounts = new Map<string, number>();
  for (const space of resolvedSpaces) {
    for (const side of SQUARE_SIDES) {
      const key = squareEdgeGeometryKey(space, side);
      keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
    }
  }
  const candidates = [...keyCounts.entries()]
    .filter(([, count]) => count === resolvedSpaces.length)
    .map(([key]) => key)
    .sort((left, right) => left.localeCompare(right));
  if (candidates.length !== 1) {
    throw new Error(
      `Square edge ref spaces '${ref.spaces.join(", ")}' do not resolve to exactly one shared edge.`,
    );
  }
  return candidates[0]!;
}

function geometryKeyFromSquareVertexRef(
  ref: BoardVertexRef,
  spacesById: ReadonlyMap<string, SquareSpaceSpec>,
): string {
  const resolvedSpaces = [...ref.spaces]
    .sort((a, b) => a.localeCompare(b))
    .map((spaceId) => {
      const space = spacesById.get(spaceId);
      if (!space) {
        throw new Error(
          `Square vertex ref references unknown space '${spaceId}'.`,
        );
      }
      return space;
    });
  const keyCounts = new Map<string, number>();
  for (const space of resolvedSpaces) {
    for (const corner of SQUARE_CORNERS) {
      const key = squareCornerGeometryKey(space, corner);
      keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
    }
  }
  const candidates = [...keyCounts.entries()]
    .filter(([, count]) => count === resolvedSpaces.length)
    .map(([key]) => key)
    .sort((left, right) => left.localeCompare(right));
  if (candidates.length !== 1) {
    throw new Error(
      `Square vertex ref spaces '${ref.spaces.join(", ")}' do not resolve to exactly one shared vertex.`,
    );
  }
  return candidates[0]!;
}

function geometryKeyFromEdgeRef(
  ref: HexEdgeRef,
  spacesById: ReadonlyMap<string, HexSpaceSpec>,
): string {
  const sortedSpaceIds = [...ref.spaces].sort((a, b) => a.localeCompare(b));
  if (sortedSpaceIds.length !== 2) {
    throw new Error(
      `Hex edge ref must reference exactly two spaces. Received: ${ref.spaces.join(", ")}.`,
    );
  }
  const leftId = sortedSpaceIds[0]!;
  const rightId = sortedSpaceIds[1]!;
  const leftSpace = spacesById.get(leftId);
  const rightSpace = spacesById.get(rightId);
  if (!leftSpace || !rightSpace) {
    throw new Error(
      `Hex edge ref references unknown spaces: ${ref.spaces.join(", ")}.`,
    );
  }
  const [dq, dr] = [rightSpace.q - leftSpace.q, rightSpace.r - leftSpace.r];
  const side = (
    Object.entries(HEX_SIDE_OFFSETS) as Array<
      readonly [HexSide, readonly [number, number]]
    >
  ).find(([, [sideQ, sideR]]) => sideQ === dq && sideR === dr)?.[0];
  if (!side) {
    throw new Error(
      `Hex edge ref spaces '${leftId}' and '${rightId}' are not adjacent.`,
    );
  }
  return edgeGeometryKey(leftSpace, side);
}

function geometryKeyFromVertexRef(
  ref: HexVertexRef,
  spacesById: ReadonlyMap<string, HexSpaceSpec>,
): string {
  return resolveHexVertexGeometryKey(ref, spacesById);
}

function deriveHexEdges(spaces: readonly HexSpaceSpec[]): ResolvedHexEdge[] {
  const spacesByCoordinate = new Map<string, HexSpaceSpec>();
  for (const space of spaces) {
    spacesByCoordinate.set(`${space.q},${space.r}`, space);
  }

  const edgeMap = new Map<string, ResolvedHexEdge>();
  for (const space of spaces) {
    for (const side of HEX_SIDES) {
      const [dq, dr] = HEX_SIDE_OFFSETS[side];
      const neighbor = spacesByCoordinate.get(
        `${space.q + dq},${space.r + dr}`,
      );
      const geometryKey = edgeGeometryKey(space, side);
      const existing = edgeMap.get(geometryKey);
      const nextSpaceIds = dedupeSorted([
        ...(existing?.spaceIds ?? []),
        space.id,
        ...(neighbor ? [neighbor.id] : []),
      ]);
      edgeMap.set(geometryKey, {
        id: edgeIdFromGeometryKey(geometryKey),
        geometryKey,
        spaceIds: nextSpaceIds,
        typeId: existing?.typeId ?? null,
        label: existing?.label ?? null,
        fields: existing?.fields ?? null,
      });
    }
  }

  return [...edgeMap.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
}

function deriveHexVertices(
  spaces: readonly HexSpaceSpec[],
): ResolvedHexVertex[] {
  const spacesByCoordinate = new Map<string, HexSpaceSpec>();
  for (const space of spaces) {
    spacesByCoordinate.set(`${space.q},${space.r}`, space);
  }

  const vertexMap = new Map<string, ResolvedHexVertex>();
  for (const space of spaces) {
    for (const corner of HEX_CORNERS) {
      const [leftSide, rightSide] = HEX_CORNER_SIDES[corner];
      const [leftQ, leftR] = HEX_SIDE_OFFSETS[leftSide];
      const [rightQ, rightR] = HEX_SIDE_OFFSETS[rightSide];
      const leftNeighbor = spacesByCoordinate.get(
        `${space.q + leftQ},${space.r + leftR}`,
      );
      const rightNeighbor = spacesByCoordinate.get(
        `${space.q + rightQ},${space.r + rightR}`,
      );
      const geometryKey = cornerGeometryKey(space, corner);
      const existing = vertexMap.get(geometryKey);
      const nextSpaceIds = dedupeSorted([
        ...(existing?.spaceIds ?? []),
        space.id,
        ...(leftNeighbor ? [leftNeighbor.id] : []),
        ...(rightNeighbor ? [rightNeighbor.id] : []),
      ]);
      vertexMap.set(geometryKey, {
        id: vertexIdFromGeometryKey(geometryKey),
        geometryKey,
        spaceIds: nextSpaceIds,
        typeId: existing?.typeId ?? null,
        label: existing?.label ?? null,
        fields: existing?.fields ?? null,
      });
    }
  }

  return [...vertexMap.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
}

function mergeBoardSpaces(
  templateSpaces: readonly BoardSpaceSpec[],
  boardSpaces: readonly BoardSpaceSpec[],
): BoardSpaceSpec[] {
  return Array.from(
    [...templateSpaces, ...boardSpaces]
      .reduce<Map<string, BoardSpaceSpec>>((accumulator, space) => {
        accumulator.set(space.id, space);
        return accumulator;
      }, new Map<string, BoardSpaceSpec>())
      .values(),
  ).sort((left, right) => left.id.localeCompare(right.id));
}

function mergeBoardContainers(
  templateContainers: readonly BoardContainerSpec[],
  boardContainers: readonly BoardContainerSpec[],
): BoardContainerSpec[] {
  return Array.from(
    [...templateContainers, ...boardContainers]
      .reduce<Map<string, BoardContainerSpec>>((accumulator, container) => {
        accumulator.set(container.id, container);
        return accumulator;
      }, new Map<string, BoardContainerSpec>())
      .values(),
  ).sort((left, right) => left.id.localeCompare(right.id));
}

function resolveHexSpaces(
  board: HexBoardSpec,
  template: HexBoardTemplateSpec | undefined,
): HexSpaceSpec[] {
  if (!template) {
    return [...(board.spaces ?? [])].sort((left, right) =>
      left.id.localeCompare(right.id),
    );
  }

  const templateSpacesById = new Map(
    (template.spaces ?? []).map((space) => [space.id, space] as const),
  );
  const overridesById = new Map(
    (board.spaces ?? []).map((space) => [space.id, space] as const),
  );
  for (const overrideId of overridesById.keys()) {
    if (!templateSpacesById.has(overrideId)) {
      throw new Error(
        `Hex board '${board.id}' overrides unknown space '${overrideId}' from template '${template.id}'.`,
      );
    }
  }

  return (template.spaces ?? [])
    .map((templateSpace) => {
      const override = overridesById.get(templateSpace.id);
      if (!override) {
        return templateSpace;
      }
      const templateMatch = templateSpacesById.get(override.id);
      if (!templateMatch) {
        throw new Error(
          `Hex board '${board.id}' overrides unknown space '${override.id}' from template '${template.id}'.`,
        );
      }
      if (templateMatch.q !== override.q || templateMatch.r !== override.r) {
        throw new Error(
          `Hex board '${board.id}' cannot change coordinates for space '${override.id}' from template '${template.id}'.`,
        );
      }
      return {
        ...templateSpace,
        ...override,
        id: templateSpace.id,
        q: templateSpace.q,
        r: templateSpace.r,
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

function indexHexEdgeMetadata(
  specs: readonly HexEdgeSpec[],
  spacesById: ReadonlyMap<string, HexSpaceSpec>,
  ownerLabel: string,
): Map<string, Omit<ResolvedHexEdge, "id" | "spaceIds">> {
  const metadataByKey = new Map<
    string,
    Omit<ResolvedHexEdge, "id" | "spaceIds">
  >();
  for (const spec of specs) {
    const geometryKey = geometryKeyFromEdgeRef(spec.ref, spacesById);
    if (metadataByKey.has(geometryKey)) {
      throw new Error(`${ownerLabel} contains duplicate hex edge refs.`);
    }
    metadataByKey.set(geometryKey, {
      geometryKey,
      typeId: spec.typeId ?? null,
      label: spec.label ?? null,
      fields:
        (spec.fields as Record<string, unknown> | null | undefined) ?? null,
    });
  }
  return metadataByKey;
}

function indexHexVertexMetadata(
  specs: readonly HexVertexSpec[],
  spacesById: ReadonlyMap<string, HexSpaceSpec>,
  ownerLabel: string,
): Map<string, Omit<ResolvedHexVertex, "id" | "spaceIds">> {
  const metadataByKey = new Map<
    string,
    Omit<ResolvedHexVertex, "id" | "spaceIds">
  >();
  for (const spec of specs) {
    const geometryKey = geometryKeyFromVertexRef(spec.ref, spacesById);
    if (metadataByKey.has(geometryKey)) {
      throw new Error(`${ownerLabel} contains duplicate hex vertex refs.`);
    }
    metadataByKey.set(geometryKey, {
      geometryKey,
      typeId: spec.typeId ?? null,
      label: spec.label ?? null,
      fields:
        (spec.fields as Record<string, unknown> | null | undefined) ?? null,
    });
  }
  return metadataByKey;
}

function resolveHexEdges(
  board: HexBoardSpec,
  template: HexBoardTemplateSpec | undefined,
  spaces: readonly HexSpaceSpec[],
): ResolvedHexEdge[] {
  const spacesById = new Map(spaces.map((space) => [space.id, space] as const));
  const derived = deriveHexEdges(spaces);
  const edgesByGeometryKey = new Map(
    derived.map((edge) => [edge.geometryKey, edge] as const),
  );
  const templateMetadata = template
    ? indexHexEdgeMetadata(
        template.edges ?? [],
        spacesById,
        `Hex board template '${template.id}'`,
      )
    : new Map();
  const overrideMetadata = indexHexEdgeMetadata(
    board.edges ?? [],
    spacesById,
    `Hex board '${board.id}'`,
  );

  if (template) {
    for (const overrideKey of overrideMetadata.keys()) {
      if (!templateMetadata.has(overrideKey)) {
        throw new Error(
          `Hex board '${board.id}' overrides unknown edge ref from template '${template.id}'.`,
        );
      }
    }
  }

  const mergedMetadata = template
    ? new Map(
        [...templateMetadata.entries()].map(([key, metadata]) => [
          key,
          {
            ...metadata,
            ...(overrideMetadata.get(key) ?? {}),
            geometryKey: key,
          },
        ]),
      )
    : overrideMetadata;

  for (const [geometryKey, metadata] of mergedMetadata.entries()) {
    const edge = edgesByGeometryKey.get(geometryKey);
    if (!edge) {
      throw new Error(
        `Hex edge ref on board '${board.id}' does not resolve to a derived edge.`,
      );
    }
    edgesByGeometryKey.set(geometryKey, {
      ...edge,
      typeId: metadata.typeId ?? null,
      label: metadata.label ?? null,
      fields: metadata.fields ?? null,
    });
  }

  return [...edgesByGeometryKey.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
}

function resolveHexVertices(
  board: HexBoardSpec,
  template: HexBoardTemplateSpec | undefined,
  spaces: readonly HexSpaceSpec[],
): ResolvedHexVertex[] {
  const spacesById = new Map(spaces.map((space) => [space.id, space] as const));
  const derived = deriveHexVertices(spaces);
  const verticesByGeometryKey = new Map(
    derived.map((vertex) => [vertex.geometryKey, vertex] as const),
  );
  const templateMetadata = template
    ? indexHexVertexMetadata(
        template.vertices ?? [],
        spacesById,
        `Hex board template '${template.id}'`,
      )
    : new Map();
  const overrideMetadata = indexHexVertexMetadata(
    board.vertices ?? [],
    spacesById,
    `Hex board '${board.id}'`,
  );

  if (template) {
    for (const overrideKey of overrideMetadata.keys()) {
      if (!templateMetadata.has(overrideKey)) {
        throw new Error(
          `Hex board '${board.id}' overrides unknown vertex ref from template '${template.id}'.`,
        );
      }
    }
  }

  const mergedMetadata = template
    ? new Map(
        [...templateMetadata.entries()].map(([key, metadata]) => [
          key,
          {
            ...metadata,
            ...(overrideMetadata.get(key) ?? {}),
            geometryKey: key,
          },
        ]),
      )
    : overrideMetadata;

  for (const [geometryKey, metadata] of mergedMetadata.entries()) {
    const vertex = verticesByGeometryKey.get(geometryKey);
    if (!vertex) {
      throw new Error(
        `Hex vertex ref on board '${board.id}' does not resolve to a derived vertex.`,
      );
    }
    verticesByGeometryKey.set(geometryKey, {
      ...vertex,
      typeId: metadata.typeId ?? null,
      label: metadata.label ?? null,
      fields: metadata.fields ?? null,
    });
  }

  return [...verticesByGeometryKey.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
}

function resolveSquareSpaces(
  board: SquareBoardSpec,
  template: SquareBoardTemplateSpec | undefined,
): SquareSpaceSpec[] {
  if (!template) {
    return [...(board.spaces ?? [])].sort((left, right) =>
      left.id.localeCompare(right.id),
    );
  }

  const templateSpacesById = new Map(
    (template.spaces ?? []).map((space) => [space.id, space] as const),
  );
  const overridesById = new Map(
    (board.spaces ?? []).map((space) => [space.id, space] as const),
  );
  for (const overrideId of overridesById.keys()) {
    if (!templateSpacesById.has(overrideId)) {
      throw new Error(
        `Square board '${board.id}' overrides unknown space '${overrideId}' from template '${template.id}'.`,
      );
    }
  }

  return (template.spaces ?? [])
    .map((templateSpace) => {
      const override = overridesById.get(templateSpace.id);
      if (!override) {
        return templateSpace;
      }
      const templateMatch = templateSpacesById.get(override.id);
      if (!templateMatch) {
        throw new Error(
          `Square board '${board.id}' overrides unknown space '${override.id}' from template '${template.id}'.`,
        );
      }
      if (
        templateMatch.row !== override.row ||
        templateMatch.col !== override.col
      ) {
        throw new Error(
          `Square board '${board.id}' cannot change coordinates for space '${override.id}' from template '${template.id}'.`,
        );
      }
      return {
        ...templateSpace,
        ...override,
        id: templateSpace.id,
        row: templateSpace.row,
        col: templateSpace.col,
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

function deriveSquareEdges(
  spaces: readonly SquareSpaceSpec[],
): ResolvedHexEdge[] {
  const edgeMap = new Map<string, ResolvedHexEdge>();
  for (const space of spaces) {
    for (const side of SQUARE_SIDES) {
      const geometryKey = squareEdgeGeometryKey(space, side);
      const existing = edgeMap.get(geometryKey);
      const nextSpaceIds = dedupeSorted([
        ...(existing?.spaceIds ?? []),
        space.id,
      ]);
      edgeMap.set(geometryKey, {
        id: squareEdgeIdFromGeometryKey(geometryKey),
        geometryKey,
        spaceIds: nextSpaceIds,
        typeId: existing?.typeId ?? null,
        label: existing?.label ?? null,
        fields: existing?.fields ?? null,
      });
    }
  }
  return [...edgeMap.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
}

function deriveSquareVertices(
  spaces: readonly SquareSpaceSpec[],
): ResolvedHexVertex[] {
  const vertexMap = new Map<string, ResolvedHexVertex>();
  for (const space of spaces) {
    for (const corner of SQUARE_CORNERS) {
      const geometryKey = squareCornerGeometryKey(space, corner);
      const existing = vertexMap.get(geometryKey);
      const nextSpaceIds = dedupeSorted([
        ...(existing?.spaceIds ?? []),
        space.id,
      ]);
      vertexMap.set(geometryKey, {
        id: squareVertexIdFromGeometryKey(geometryKey),
        geometryKey,
        spaceIds: nextSpaceIds,
        typeId: existing?.typeId ?? null,
        label: existing?.label ?? null,
        fields: existing?.fields ?? null,
      });
    }
  }
  return [...vertexMap.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
}

function indexSquareEdgeMetadata(
  specs: readonly SquareEdgeSpec[],
  spacesById: ReadonlyMap<string, SquareSpaceSpec>,
  ownerLabel: string,
): Map<string, Omit<ResolvedHexEdge, "id" | "spaceIds">> {
  const metadataByKey = new Map<
    string,
    Omit<ResolvedHexEdge, "id" | "spaceIds">
  >();
  for (const spec of specs) {
    const geometryKey = geometryKeyFromSquareEdgeRef(spec.ref, spacesById);
    if (metadataByKey.has(geometryKey)) {
      throw new Error(`${ownerLabel} contains duplicate square edge refs.`);
    }
    metadataByKey.set(geometryKey, {
      geometryKey,
      typeId: spec.typeId ?? null,
      label: spec.label ?? null,
      fields:
        (spec.fields as Record<string, unknown> | null | undefined) ?? null,
    });
  }
  return metadataByKey;
}

function indexSquareVertexMetadata(
  specs: readonly SquareVertexSpec[],
  spacesById: ReadonlyMap<string, SquareSpaceSpec>,
  ownerLabel: string,
): Map<string, Omit<ResolvedHexVertex, "id" | "spaceIds">> {
  const metadataByKey = new Map<
    string,
    Omit<ResolvedHexVertex, "id" | "spaceIds">
  >();
  for (const spec of specs) {
    const geometryKey = geometryKeyFromSquareVertexRef(spec.ref, spacesById);
    if (metadataByKey.has(geometryKey)) {
      throw new Error(`${ownerLabel} contains duplicate square vertex refs.`);
    }
    metadataByKey.set(geometryKey, {
      geometryKey,
      typeId: spec.typeId ?? null,
      label: spec.label ?? null,
      fields:
        (spec.fields as Record<string, unknown> | null | undefined) ?? null,
    });
  }
  return metadataByKey;
}

function resolveSquareEdges(
  board: SquareBoardSpec,
  template: SquareBoardTemplateSpec | undefined,
  spaces: readonly SquareSpaceSpec[],
): ResolvedHexEdge[] {
  const spacesById = new Map(spaces.map((space) => [space.id, space] as const));
  const derived = deriveSquareEdges(spaces);
  const edgesByGeometryKey = new Map(
    derived.map((edge) => [edge.geometryKey, edge] as const),
  );
  const templateMetadata = template
    ? indexSquareEdgeMetadata(
        template.edges ?? [],
        spacesById,
        `Square board template '${template.id}'`,
      )
    : new Map();
  const overrideMetadata = indexSquareEdgeMetadata(
    board.edges ?? [],
    spacesById,
    `Square board '${board.id}'`,
  );

  if (template) {
    for (const overrideKey of overrideMetadata.keys()) {
      if (!templateMetadata.has(overrideKey)) {
        throw new Error(
          `Square board '${board.id}' overrides unknown edge ref from template '${template.id}'.`,
        );
      }
    }
  }

  const mergedMetadata = template
    ? new Map(
        [...templateMetadata.entries()].map(([key, metadata]) => [
          key,
          {
            ...metadata,
            ...(overrideMetadata.get(key) ?? {}),
            geometryKey: key,
          },
        ]),
      )
    : overrideMetadata;

  for (const [geometryKey, metadata] of mergedMetadata.entries()) {
    const edge = edgesByGeometryKey.get(geometryKey);
    if (!edge) {
      throw new Error(
        `Square edge ref on board '${board.id}' does not resolve to a derived edge.`,
      );
    }
    edgesByGeometryKey.set(geometryKey, {
      ...edge,
      typeId: metadata.typeId ?? null,
      label: metadata.label ?? null,
      fields: metadata.fields ?? null,
    });
  }

  return [...edgesByGeometryKey.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
}

function resolveSquareVertices(
  board: SquareBoardSpec,
  template: SquareBoardTemplateSpec | undefined,
  spaces: readonly SquareSpaceSpec[],
): ResolvedHexVertex[] {
  const spacesById = new Map(spaces.map((space) => [space.id, space] as const));
  const derived = deriveSquareVertices(spaces);
  const verticesByGeometryKey = new Map(
    derived.map((vertex) => [vertex.geometryKey, vertex] as const),
  );
  const templateMetadata = template
    ? indexSquareVertexMetadata(
        template.vertices ?? [],
        spacesById,
        `Square board template '${template.id}'`,
      )
    : new Map();
  const overrideMetadata = indexSquareVertexMetadata(
    board.vertices ?? [],
    spacesById,
    `Square board '${board.id}'`,
  );

  if (template) {
    for (const overrideKey of overrideMetadata.keys()) {
      if (!templateMetadata.has(overrideKey)) {
        throw new Error(
          `Square board '${board.id}' overrides unknown vertex ref from template '${template.id}'.`,
        );
      }
    }
  }

  const mergedMetadata = template
    ? new Map(
        [...templateMetadata.entries()].map(([key, metadata]) => [
          key,
          {
            ...metadata,
            ...(overrideMetadata.get(key) ?? {}),
            geometryKey: key,
          },
        ]),
      )
    : overrideMetadata;

  for (const [geometryKey, metadata] of mergedMetadata.entries()) {
    const vertex = verticesByGeometryKey.get(geometryKey);
    if (!vertex) {
      throw new Error(
        `Square vertex ref on board '${board.id}' does not resolve to a derived vertex.`,
      );
    }
    verticesByGeometryKey.set(geometryKey, {
      ...vertex,
      typeId: metadata.typeId ?? null,
      label: metadata.label ?? null,
      fields: metadata.fields ?? null,
    });
  }

  return [...verticesByGeometryKey.values()].sort((left, right) =>
    left.id.localeCompare(right.id),
  );
}

function analyzeBoards(manifest: GameTopologyManifest, playerIds: string[]) {
  const boardTemplates = manifest.boardTemplates ?? [];
  const genericTemplateById = new Map(
    boardTemplates
      .filter(isGenericBoardTemplateSpec)
      .map((boardTemplate) => [boardTemplate.id, boardTemplate] as const),
  );
  const hexTemplateById = new Map(
    boardTemplates
      .filter(isHexBoardTemplateSpec)
      .map((boardTemplate) => [boardTemplate.id, boardTemplate] as const),
  );
  const squareTemplateById = new Map(
    boardTemplates
      .filter(isSquareBoardTemplateSpec)
      .map((boardTemplate) => [boardTemplate.id, boardTemplate] as const),
  );

  return (manifest.boards ?? []).map((board): AnalyzedBoard => {
    const runtimeBoardIds =
      board.scope === "perPlayer"
        ? playerIds.map((playerId) => `${board.id}:${playerId}`)
        : [board.id];

    if (isHexBoardSpec(board)) {
      const hexBoard = board;
      const template = board.templateId
        ? hexTemplateById.get(board.templateId)
        : undefined;
      const spaces = resolveHexSpaces(hexBoard, template);
      return {
        layout: "hex",
        board: hexBoard,
        template,
        boardTypeId: hexBoard.typeId ?? template?.typeId,
        runtimeBoardIds,
        boardFieldsSchema:
          hexBoard.boardFieldsSchema ?? template?.boardFieldsSchema,
        spaceFieldsSchema:
          hexBoard.spaceFieldsSchema ?? template?.spaceFieldsSchema,
        edgeFieldsSchema:
          hexBoard.edgeFieldsSchema ?? template?.edgeFieldsSchema,
        vertexFieldsSchema:
          hexBoard.vertexFieldsSchema ?? template?.vertexFieldsSchema,
        spaces,
        edges: resolveHexEdges(hexBoard, template, spaces),
        vertices: resolveHexVertices(hexBoard, template, spaces),
      };
    }

    if (isSquareBoardSpec(board)) {
      const squareBoard = board;
      const template = board.templateId
        ? squareTemplateById.get(board.templateId)
        : undefined;
      const spaces = resolveSquareSpaces(squareBoard, template);
      return {
        layout: "square",
        board: squareBoard,
        template,
        boardTypeId: squareBoard.typeId ?? template?.typeId,
        runtimeBoardIds,
        boardFieldsSchema:
          squareBoard.boardFieldsSchema ?? template?.boardFieldsSchema,
        spaceFieldsSchema:
          squareBoard.spaceFieldsSchema ?? template?.spaceFieldsSchema,
        relationFieldsSchema:
          squareBoard.relationFieldsSchema ?? template?.relationFieldsSchema,
        containerFieldsSchema:
          squareBoard.containerFieldsSchema ?? template?.containerFieldsSchema,
        edgeFieldsSchema:
          squareBoard.edgeFieldsSchema ?? template?.edgeFieldsSchema,
        vertexFieldsSchema:
          squareBoard.vertexFieldsSchema ?? template?.vertexFieldsSchema,
        spaces,
        relations: [
          ...(template?.relations ?? []),
          ...(squareBoard.relations ?? []),
        ],
        containers: mergeBoardContainers(
          template?.containers ?? [],
          squareBoard.containers ?? [],
        ),
        edges: resolveSquareEdges(squareBoard, template, spaces),
        vertices: resolveSquareVertices(squareBoard, template, spaces),
      };
    }

    const genericBoard = board;
    const template = board.templateId
      ? genericTemplateById.get(board.templateId)
      : undefined;
    return {
      layout: "generic",
      board: genericBoard,
      template,
      boardTypeId: genericBoard.typeId ?? template?.typeId,
      runtimeBoardIds,
      boardFieldsSchema:
        genericBoard.boardFieldsSchema ?? template?.boardFieldsSchema,
      spaceFieldsSchema:
        genericBoard.spaceFieldsSchema ?? template?.spaceFieldsSchema,
      relationFieldsSchema:
        genericBoard.relationFieldsSchema ?? template?.relationFieldsSchema,
      containerFieldsSchema:
        genericBoard.containerFieldsSchema ?? template?.containerFieldsSchema,
      spaces: mergeBoardSpaces(
        template?.spaces ?? [],
        genericBoard.spaces ?? [],
      ),
      relations: [
        ...(template?.relations ?? []),
        ...(genericBoard.relations ?? []),
      ],
      containers: mergeBoardContainers(
        template?.containers ?? [],
        genericBoard.containers ?? [],
      ),
    };
  });
}

function analyzeManifest(
  inputManifest: GameTopologyManifest,
): ManifestAnalysis {
  const manifest = addStandardDecksIfNeeded(inputManifest);
  const playerIds = Array.from(
    { length: manifest.players.maxPlayers },
    (_, index) => `player-${index + 1}`,
  );
  const sharedZones = (manifest.zones ?? []).filter(
    (zone) => zone.scope === "shared",
  );
  const playerZones = (manifest.zones ?? []).filter(
    (zone) => zone.scope === "perPlayer",
  );
  const zoneIds = dedupeSorted((manifest.zones ?? []).map((zone) => zone.id));
  const cardSets = manifest.cardSets.map(materializeCardSet);
  const cardSetIds = dedupeSorted(cardSets.map((cardSet) => cardSet.id));
  const cardTypes = dedupeSorted(
    cardSets.flatMap((cardSet) => cardSet.cards.map((card) => card.type)),
  );
  const cardIds = dedupeSorted(
    cardSets.flatMap((cardSet) => cardSet.cards.flatMap(renderCardInstanceIds)),
  );
  const cardSetIdByCardId = new Map<string, string>();
  const cardTypeByCardId = new Map<string, string>();
  for (const cardSet of cardSets) {
    for (const card of cardSet.cards) {
      for (const cardId of renderCardInstanceIds(card)) {
        cardSetIdByCardId.set(cardId, cardSet.id);
        cardTypeByCardId.set(cardId, card.cardType ?? card.type);
      }
    }
  }

  const sharedZoneCardSetIds = new Map<string, string[]>();
  for (const zone of sharedZones) {
    sharedZoneCardSetIds.set(
      zone.id,
      dedupeSorted(zone.allowedCardSetIds ?? []),
    );
  }
  const playerZoneCardSetIds = new Map<string, string[]>();
  for (const zone of playerZones) {
    playerZoneCardSetIds.set(
      zone.id,
      dedupeSorted(zone.allowedCardSetIds ?? []),
    );
  }
  const zoneCardSetIdsById = new Map<string, string[]>();
  for (const [zoneId, cardSetIds] of sharedZoneCardSetIds.entries()) {
    zoneCardSetIdsById.set(zoneId, cardSetIds);
  }
  for (const [zoneId, cardSetIds] of playerZoneCardSetIds.entries()) {
    zoneCardSetIdsById.set(zoneId, cardSetIds);
  }

  const zoneVisibilityById = new Map<string, string>(
    (manifest.zones ?? []).map((zone) => [
      zone.id,
      zone.visibility ?? "public",
    ]),
  );
  const resourceIds = dedupeSorted(
    (manifest.resources ?? []).map((resource) => resource.id),
  );
  const setupOptionIds = dedupeSorted(
    (manifest.setupOptions ?? []).map((option) => option.id),
  );
  const setupProfileIds = dedupeSorted(
    (manifest.setupProfiles ?? []).map((profile) => profile.id),
  );
  const setupChoiceIdsByOptionId = new Map(
    (manifest.setupOptions ?? []).map((option) => [
      option.id,
      dedupeSorted((option.choices ?? []).map((choice) => choice.id)),
    ]),
  );
  const setupOptionsById = Object.fromEntries(
    (manifest.setupOptions ?? [])
      .slice()
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((option) => [
        option.id,
        {
          id: option.id,
          name: option.name,
          description: option.description ?? null,
          choices: (option.choices ?? []).map((choice) => ({
            id: choice.id,
            label: choice.label,
            description: choice.description ?? null,
          })),
        },
      ]),
  );
  const setupProfilesById = Object.fromEntries(
    (manifest.setupProfiles ?? [])
      .slice()
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((profile) => [
        profile.id,
        {
          id: profile.id,
          name: profile.name,
          description: profile.description ?? null,
          optionValues: profile.optionValues
            ? Object.fromEntries(
                Object.entries(profile.optionValues).filter(
                  (entry): entry is [string, string] =>
                    typeof entry[1] === "string",
                ),
              )
            : null,
        },
      ]),
  );
  const pieceTypeIds = dedupeSorted(
    (manifest.pieceTypes ?? []).map((pieceType) => pieceType.id),
  );
  const pieceTypeSchemasById = new Map(
    (manifest.pieceTypes ?? []).map((pieceType) => [
      pieceType.id,
      pieceType.fieldsSchema,
    ]),
  );
  const pieceTypeIdByPieceId = new Map<string, string>();
  for (const seed of manifest.pieceSeeds ?? []) {
    for (const pieceId of expandSeedIds([seed])) {
      pieceTypeIdByPieceId.set(pieceId, seed.typeId);
    }
  }
  const pieceIds = dedupeSorted(pieceTypeIdByPieceId.keys());
  const dieTypeIds = dedupeSorted(
    (manifest.dieTypes ?? []).map((dieType) => dieType.id),
  );
  const dieTypeSchemasById = new Map(
    (manifest.dieTypes ?? []).map((dieType) => [
      dieType.id,
      dieType.fieldsSchema,
    ]),
  );
  const dieTypeIdByDieId = new Map<string, string>();
  for (const seed of manifest.dieSeeds ?? []) {
    for (const dieId of expandSeedIds([seed])) {
      dieTypeIdByDieId.set(dieId, seed.typeId);
    }
  }
  const dieIds = dedupeSorted(dieTypeIdByDieId.keys());
  const analyzedBoards = analyzeBoards(manifest, playerIds);
  const boardBaseIds = dedupeSorted(
    analyzedBoards.map(({ board }) => board.id),
  );
  const boardIds = dedupeSorted(
    analyzedBoards.flatMap((entry) => entry.runtimeBoardIds),
  );
  const boardTypeIds = dedupeSorted(
    analyzedBoards
      .map((board) => board.boardTypeId)
      .filter((typeId): typeId is string => typeof typeId === "string"),
  );
  const boardLayoutById = new Map<string, string>();
  const boardIdsByBaseId = new Map<string, string[]>();
  const boardIdsByTypeId = new Map<string, string[]>();
  const spaceIdsByBoardId = new Map<string, string[]>();
  const spaceIdsByTypeId = new Map<string, string[]>();
  const containerIdsByBoardId = new Map<string, string[]>();
  const relationTypeIdsByBoardId = new Map<string, string[]>();
  const edgeIdsByTypeId = new Map<string, string[]>();
  const vertexIdsByTypeId = new Map<string, string[]>();
  for (const analyzedBoard of analyzedBoards) {
    boardIdsByBaseId.set(analyzedBoard.board.id, analyzedBoard.runtimeBoardIds);
    const runtimeSpaceIds = analyzedBoard.spaces.map((space) => space.id);
    const runtimeContainerIds =
      analyzedBoard.layout === "hex"
        ? []
        : analyzedBoard.containers.map((container) => container.id);
    const runtimeRelationTypeIds =
      analyzedBoard.layout === "hex"
        ? ["adjacent"]
        : analyzedBoard.layout === "square"
          ? dedupeSorted([
              "adjacent",
              ...analyzedBoard.relations.map((relation) => relation.typeId),
            ])
          : dedupeSorted(
              analyzedBoard.relations.map((relation) => relation.typeId),
            );
    for (const runtimeBoardId of analyzedBoard.runtimeBoardIds) {
      boardLayoutById.set(runtimeBoardId, analyzedBoard.board.layout);
      spaceIdsByBoardId.set(runtimeBoardId, runtimeSpaceIds);
      containerIdsByBoardId.set(runtimeBoardId, runtimeContainerIds);
      relationTypeIdsByBoardId.set(runtimeBoardId, runtimeRelationTypeIds);
    }
    if (analyzedBoard.boardTypeId) {
      boardIdsByTypeId.set(
        analyzedBoard.boardTypeId,
        dedupeSorted([
          ...(boardIdsByTypeId.get(analyzedBoard.boardTypeId) ?? []),
          ...analyzedBoard.runtimeBoardIds,
        ]),
      );
    }
    for (const space of analyzedBoard.spaces) {
      if (!space.typeId) {
        continue;
      }
      spaceIdsByTypeId.set(
        space.typeId,
        dedupeSorted([...(spaceIdsByTypeId.get(space.typeId) ?? []), space.id]),
      );
    }
    if (analyzedBoard.layout !== "generic") {
      for (const edge of analyzedBoard.edges) {
        if (!edge.typeId) {
          continue;
        }
        edgeIdsByTypeId.set(
          edge.typeId,
          dedupeSorted([...(edgeIdsByTypeId.get(edge.typeId) ?? []), edge.id]),
        );
      }
      for (const vertex of analyzedBoard.vertices) {
        if (!vertex.typeId) {
          continue;
        }
        vertexIdsByTypeId.set(
          vertex.typeId,
          dedupeSorted([
            ...(vertexIdsByTypeId.get(vertex.typeId) ?? []),
            vertex.id,
          ]),
        );
      }
    }
  }
  const relationTypeIds = dedupeSorted(
    Array.from(relationTypeIdsByBoardId.values()).flat(),
  );
  const edgeIds = dedupeSorted(
    analyzedBoards.flatMap((board) =>
      board.layout === "generic" ? [] : board.edges.map((edge) => edge.id),
    ),
  );
  const edgeTypeIds = dedupeSorted(edgeIdsByTypeId.keys());
  const vertexIds = dedupeSorted(
    analyzedBoards.flatMap((board) =>
      board.layout === "generic"
        ? []
        : board.vertices.map((vertex) => vertex.id),
    ),
  );
  const vertexTypeIds = dedupeSorted(vertexIdsByTypeId.keys());
  const boardContainerIds = dedupeSorted(
    analyzedBoards.flatMap((board) =>
      board.layout === "hex"
        ? []
        : board.containers.map((container) => container.id),
    ),
  );
  const spaceIds = dedupeSorted(
    analyzedBoards.flatMap((board) => board.spaces.map((space) => space.id)),
  );
  const spaceTypeIds = dedupeSorted(
    analyzedBoards.flatMap((board) =>
      board.spaces
        .map((space) => space.typeId)
        .filter((typeId): typeId is string => typeof typeId === "string"),
    ),
  );

  return {
    manifest,
    playerIds,
    sharedZones,
    playerZones,
    zoneIds,
    cardSets,
    cardSetIds,
    cardTypes,
    cardIds,
    cardSetIdByCardId,
    cardTypeByCardId,
    sharedZoneCardSetIds,
    playerZoneCardSetIds,
    zoneCardSetIdsById,
    zoneVisibilityById,
    resourceIds,
    setupOptionIds,
    setupProfileIds,
    setupChoiceIdsByOptionId,
    setupOptionsById,
    setupProfilesById,
    pieceTypeIds,
    pieceIds,
    pieceTypeIdByPieceId,
    dieTypeIds,
    dieIds,
    dieTypeIdByDieId,
    boardBaseIds,
    boardIds,
    boardContainerIds,
    boardTypeIds,
    boardLayoutById,
    boardIdsByBaseId,
    boardIdsByTypeId,
    spaceIdsByBoardId,
    spaceIdsByTypeId,
    containerIdsByBoardId,
    relationTypeIds,
    relationTypeIdsByBoardId,
    edgeIds,
    edgeTypeIds,
    edgeIdsByTypeId,
    vertexIds,
    vertexTypeIds,
    vertexIdsByTypeId,
    spaceIds,
    spaceTypeIds,
    analyzedBoards,
    pieceTypeSchemasById,
    dieTypeSchemasById,
  };
}

function renderTypeForPropertySchema(
  schema: PropertySchema | null | undefined,
): string {
  if (!schema) {
    return "RuntimePayload";
  }
  let rendered: string;
  switch (schema.type) {
    case "string":
      rendered = "string";
      break;
    case "integer":
    case "number":
      rendered = "number";
      break;
    case "boolean":
      rendered = "boolean";
      break;
    case "cardId":
      rendered = "CardId";
      break;
    case "playerId":
      rendered = "PlayerId";
      break;
    case "zoneId":
      rendered = "ZoneId";
      break;
    case "boardId":
      rendered = "BoardId";
      break;
    case "edgeId":
      rendered = "EdgeId";
      break;
    case "vertexId":
      rendered = "VertexId";
      break;
    case "spaceId":
      rendered = "SpaceId";
      break;
    case "pieceId":
      rendered = "PieceId";
      break;
    case "dieId":
      rendered = "DieId";
      break;
    case "resourceId":
      rendered = "ResourceId";
      break;
    case "enum":
      rendered =
        schema.enums && schema.enums.length > 0
          ? schema.enums.map((value) => quote(value)).join(" | ")
          : "string";
      break;
    case "array":
      rendered = `${renderTypeForPropertySchema(schema.items)}[]`;
      break;
    case "object":
      rendered = renderTypeForObjectSchema(
        schema.properties
          ? {
              properties: schema.properties,
            }
          : null,
      );
      break;
    case "record":
      rendered = `Record<string, ${renderTypeForPropertySchema(schema.values)}>`;
      break;
    default:
      rendered = "RuntimePayload";
      break;
  }
  return schema.nullable ? `${rendered} | null` : rendered;
}

function renderZodForPropertySchema(
  schema: PropertySchema | null | undefined,
): string {
  if (!schema) {
    return "z.unknown()";
  }
  let rendered: string;
  switch (schema.type) {
    case "string":
      rendered = "z.string()";
      break;
    case "integer":
      rendered = "z.number().int()";
      break;
    case "number":
      rendered = "z.number()";
      break;
    case "boolean":
      rendered = "z.boolean()";
      break;
    case "cardId":
      rendered = "ids.cardId";
      break;
    case "playerId":
      rendered = "ids.playerId";
      break;
    case "zoneId":
      rendered = "ids.zoneId";
      break;
    case "boardId":
      rendered = "ids.boardId";
      break;
    case "edgeId":
      rendered = "ids.edgeId";
      break;
    case "vertexId":
      rendered = "ids.vertexId";
      break;
    case "spaceId":
      rendered = "ids.spaceId";
      break;
    case "pieceId":
      rendered = "ids.pieceId";
      break;
    case "dieId":
      rendered = "ids.dieId";
      break;
    case "resourceId":
      rendered = "ids.resourceId";
      break;
    case "enum":
      rendered =
        schema.enums && schema.enums.length > 0
          ? `z.enum([${schema.enums.map((value) => quote(value)).join(", ")}])`
          : "z.string()";
      break;
    case "array":
      rendered = `z.array(${renderZodForPropertySchema(schema.items)})`;
      break;
    case "object":
      rendered = renderZodForObjectSchema(
        schema.properties
          ? {
              properties: schema.properties,
            }
          : null,
      );
      break;
    case "record":
      rendered = `z.record(z.string(), ${renderZodForPropertySchema(schema.values)})`;
      break;
    default:
      rendered = "z.unknown()";
      break;
  }
  if (schema.nullable) {
    rendered = `${rendered}.nullable()`;
  }
  if (schema.optional) {
    rendered = `${rendered}.optional()`;
  }
  return rendered;
}

function renderTypeForObjectSchema(
  schema: ObjectSchema | null | undefined,
): string {
  if (!schema || Object.keys(schema.properties).length === 0) {
    return "RuntimeRecord";
  }

  return `{\n${Object.entries(schema.properties)
    .map(([key, value]) => {
      const optional = value?.optional ? "?" : "";
      return `  ${quote(key)}${optional}: ${renderTypeForPropertySchema(value)};`;
    })
    .join("\n")}\n}`;
}

function renderZodForObjectSchema(
  schema: ObjectSchema | null | undefined,
): string {
  if (!schema || Object.keys(schema.properties).length === 0) {
    return "z.record(z.string(), z.unknown())";
  }

  return `z.object({\n${Object.entries(schema.properties)
    .map(
      ([key, value]) =>
        `  ${quote(key)}: ${renderZodForPropertySchema(value)},`,
    )
    .join("\n")}\n})`;
}

function renderCardSetPropertySections(
  cardSets: readonly ManualCardSetDefinition[],
): string {
  return cardSets
    .map((cardSet) => {
      const typeName = `${toPascalCase(cardSet.id)}CardProperties`;
      const schemaName = `${typeName}Schema`;

      return renderBlocks([
        `export type ${typeName} = ${renderTypeForObjectSchema(cardSet.cardSchema)};`,
        `export const ${schemaName} = ${renderZodForObjectSchema(cardSet.cardSchema)};`,
        `export type ${toPascalCase(cardSet.id)}CardId = ${
          cardSet.cards
            .flatMap(renderCardInstanceIds)
            .map((cardId) => quote(cardId))
            .join(" | ") || "never"
        };`,
      ]);
    })
    .join("\n\n");
}

function renderCardPropertiesSchemaByCardSetId(
  cardSets: readonly ManualCardSetDefinition[],
): string {
  const entries = cardSets.map(
    (cardSet) =>
      `  ${quote(cardSet.id)}: ${toPascalCase(cardSet.id)}CardPropertiesSchema,`,
  );
  return `const cardPropertiesSchemaByCardSetId: Record<string, z.ZodTypeAny> = {\n${entries.join("\n")}\n};`;
}

function renderObjectSchemaSection(
  typeName: string,
  schemaName: string,
  schema: ObjectSchema | null | undefined,
): string {
  return renderBlocks([
    `export type ${typeName} = ${renderTypeForObjectSchema(schema)};`,
    `export const ${schemaName} = ${renderZodForObjectSchema(schema)};`,
  ]);
}

function boardPrefix(boardId: string): string {
  return toPascalCase(boardId);
}

function boardFieldsTypeName(boardId: string): string {
  return `${boardPrefix(boardId)}BoardFields`;
}

function boardSpaceFieldsTypeName(boardId: string): string {
  return `${boardPrefix(boardId)}SpaceFields`;
}

function boardRelationFieldsTypeName(boardId: string): string {
  return `${boardPrefix(boardId)}RelationFields`;
}

function boardContainerFieldsTypeName(boardId: string): string {
  return `${boardPrefix(boardId)}ContainerFields`;
}

function hexEdgeFieldsTypeName(boardId: string): string {
  return `${boardPrefix(boardId)}EdgeFields`;
}

function hexVertexFieldsTypeName(boardId: string): string {
  return `${boardPrefix(boardId)}VertexFields`;
}

function pieceFieldsTypeName(typeId: string): string {
  return `${toPascalCase(typeId)}PieceFields`;
}

function dieFieldsTypeName(typeId: string): string {
  return `${toPascalCase(typeId)}DieFields`;
}

function renderTopologyFieldSections(analysis: ManifestAnalysis): string {
  const sections: string[] = [];

  for (const board of analysis.analyzedBoards) {
    sections.push(
      renderObjectSchemaSection(
        boardFieldsTypeName(board.board.id),
        `${boardFieldsTypeName(board.board.id)}Schema`,
        board.boardFieldsSchema,
      ),
    );
    sections.push(
      renderObjectSchemaSection(
        boardSpaceFieldsTypeName(board.board.id),
        `${boardSpaceFieldsTypeName(board.board.id)}Schema`,
        board.spaceFieldsSchema,
      ),
    );
    if (board.layout !== "hex") {
      sections.push(
        renderObjectSchemaSection(
          boardRelationFieldsTypeName(board.board.id),
          `${boardRelationFieldsTypeName(board.board.id)}Schema`,
          board.relationFieldsSchema,
        ),
        renderObjectSchemaSection(
          boardContainerFieldsTypeName(board.board.id),
          `${boardContainerFieldsTypeName(board.board.id)}Schema`,
          board.containerFieldsSchema,
        ),
      );
    }
    if (board.layout !== "generic") {
      sections.push(
        renderObjectSchemaSection(
          hexEdgeFieldsTypeName(board.board.id),
          `${hexEdgeFieldsTypeName(board.board.id)}Schema`,
          board.edgeFieldsSchema,
        ),
        renderObjectSchemaSection(
          hexVertexFieldsTypeName(board.board.id),
          `${hexVertexFieldsTypeName(board.board.id)}Schema`,
          board.vertexFieldsSchema,
        ),
      );
    }
  }

  for (const pieceTypeId of analysis.pieceTypeIds) {
    sections.push(
      renderObjectSchemaSection(
        pieceFieldsTypeName(pieceTypeId),
        `${pieceFieldsTypeName(pieceTypeId)}Schema`,
        analysis.pieceTypeSchemasById.get(pieceTypeId),
      ),
    );
  }

  for (const dieTypeId of analysis.dieTypeIds) {
    sections.push(
      renderObjectSchemaSection(
        dieFieldsTypeName(dieTypeId),
        `${dieFieldsTypeName(dieTypeId)}Schema`,
        analysis.dieTypeSchemasById.get(dieTypeId),
      ),
    );
  }

  return sections.join("\n\n");
}

function renderBoardFieldMapTypes(analysis: ManifestAnalysis): string {
  const boardEntries = analysis.analyzedBoards
    .flatMap((board) =>
      board.runtimeBoardIds.map(
        (runtimeBoardId) =>
          `  ${quote(runtimeBoardId)}: ${boardFieldsTypeName(board.board.id)};`,
      ),
    )
    .join("\n");
  const spaceEntries = analysis.analyzedBoards
    .flatMap((board) =>
      board.runtimeBoardIds.map(
        (runtimeBoardId) =>
          `  ${quote(runtimeBoardId)}: ${boardSpaceFieldsTypeName(board.board.id)};`,
      ),
    )
    .join("\n");
  const relationEntries = analysis.analyzedBoards
    .flatMap((board) =>
      board.runtimeBoardIds.map(
        (runtimeBoardId) =>
          `  ${quote(runtimeBoardId)}: ${
            board.layout === "hex"
              ? "RuntimeRecord"
              : boardRelationFieldsTypeName(board.board.id)
          };`,
      ),
    )
    .join("\n");
  const containerEntries = analysis.analyzedBoards
    .flatMap((board) =>
      board.runtimeBoardIds.map(
        (runtimeBoardId) =>
          `  ${quote(runtimeBoardId)}: ${
            board.layout === "hex"
              ? "RuntimeRecord"
              : boardContainerFieldsTypeName(board.board.id)
          };`,
      ),
    )
    .join("\n");
  const edgeEntries = analysis.analyzedBoards
    .filter((board): board is AnalyzedHexBoard => board.layout === "hex")
    .flatMap((board) =>
      board.runtimeBoardIds.map(
        (runtimeBoardId) =>
          `  ${quote(runtimeBoardId)}: ${hexEdgeFieldsTypeName(board.board.id)};`,
      ),
    )
    .join("\n");
  const squareEdgeEntries = analysis.analyzedBoards
    .filter((board): board is AnalyzedSquareBoard => board.layout === "square")
    .flatMap((board) =>
      board.runtimeBoardIds.map(
        (runtimeBoardId) =>
          `  ${quote(runtimeBoardId)}: ${hexEdgeFieldsTypeName(board.board.id)};`,
      ),
    )
    .join("\n");
  const tiledEdgeEntries = analysis.analyzedBoards
    .filter(
      (board): board is AnalyzedHexBoard | AnalyzedSquareBoard =>
        board.layout !== "generic",
    )
    .flatMap((board) =>
      board.runtimeBoardIds.map(
        (runtimeBoardId) =>
          `  ${quote(runtimeBoardId)}: ${hexEdgeFieldsTypeName(board.board.id)};`,
      ),
    )
    .join("\n");
  const vertexEntries = analysis.analyzedBoards
    .filter((board): board is AnalyzedHexBoard => board.layout === "hex")
    .flatMap((board) =>
      board.runtimeBoardIds.map(
        (runtimeBoardId) =>
          `  ${quote(runtimeBoardId)}: ${hexVertexFieldsTypeName(board.board.id)};`,
      ),
    )
    .join("\n");
  const squareVertexEntries = analysis.analyzedBoards
    .filter((board): board is AnalyzedSquareBoard => board.layout === "square")
    .flatMap((board) =>
      board.runtimeBoardIds.map(
        (runtimeBoardId) =>
          `  ${quote(runtimeBoardId)}: ${hexVertexFieldsTypeName(board.board.id)};`,
      ),
    )
    .join("\n");
  const tiledVertexEntries = analysis.analyzedBoards
    .filter(
      (board): board is AnalyzedHexBoard | AnalyzedSquareBoard =>
        board.layout !== "generic",
    )
    .flatMap((board) =>
      board.runtimeBoardIds.map(
        (runtimeBoardId) =>
          `  ${quote(runtimeBoardId)}: ${hexVertexFieldsTypeName(board.board.id)};`,
      ),
    )
    .join("\n");
  const pieceEntries = analysis.pieceTypeIds
    .map((typeId) => `  ${quote(typeId)}: ${pieceFieldsTypeName(typeId)};`)
    .join("\n");
  const dieEntries = analysis.dieTypeIds
    .map((typeId) => `  ${quote(typeId)}: ${dieFieldsTypeName(typeId)};`)
    .join("\n");

  return renderBlocks([
    `export type BoardFieldsByBoardId = {\n${boardEntries}\n};`,
    `export type BoardSpaceFieldsByBoardId = {\n${spaceEntries}\n};`,
    `export type BoardRelationFieldsByBoardId = {\n${relationEntries}\n};`,
    `export type BoardContainerFieldsByBoardId = {\n${containerEntries}\n};`,
    `export type HexEdgeFieldsByBoardId = ${
      edgeEntries.length > 0 ? `{\n${edgeEntries}\n}` : "Record<string, never>"
    };`,
    `export type HexVertexFieldsByBoardId = ${
      vertexEntries.length > 0
        ? `{\n${vertexEntries}\n}`
        : "Record<string, never>"
    };`,
    `export type SquareEdgeFieldsByBoardId = ${
      squareEdgeEntries.length > 0
        ? `{\n${squareEdgeEntries}\n}`
        : "Record<string, never>"
    };`,
    `export type SquareVertexFieldsByBoardId = ${
      squareVertexEntries.length > 0
        ? `{\n${squareVertexEntries}\n}`
        : "Record<string, never>"
    };`,
    `export type TiledEdgeFieldsByBoardId = ${
      tiledEdgeEntries.length > 0
        ? `{\n${tiledEdgeEntries}\n}`
        : "Record<string, never>"
    };`,
    `export type TiledVertexFieldsByBoardId = ${
      tiledVertexEntries.length > 0
        ? `{\n${tiledVertexEntries}\n}`
        : "Record<string, never>"
    };`,
    `export type PieceFieldsByTypeId = ${
      pieceEntries.length > 0
        ? `{\n${pieceEntries}\n}`
        : "Record<string, RuntimeRecord>"
    };`,
    `export type DieFieldsByTypeId = ${
      dieEntries.length > 0
        ? `{\n${dieEntries}\n}`
        : "Record<string, RuntimeRecord>"
    };`,
  ]);
}

function renderCardStateSchemaById(analysis: ManifestAnalysis): string {
  if (analysis.cardIds.length === 0) {
    return "z.object({})";
  }

  return `z.object(
  Object.fromEntries(
    literals.cardIds.map((cardId) => [cardId, createCardStateSchema(cardId)]),
  ) as Record<CardId, z.ZodTypeAny>,
)`;
}

function renderCardStateSchemaFactory(analysis: ManifestAnalysis): string {
  if (analysis.cardIds.length === 0) {
    return "";
  }

  return `function createCardStateSchema<CardIdValue extends CardId>(
  cardId: CardIdValue,
): z.ZodType<CardStateById[CardIdValue]> {
  const cardSetId = literals.cardSetIdByCardId[cardId];
  const cardType = literals.cardTypeByCardId[cardId];
  return assumeManifestSchema<CardStateById[CardIdValue]>(
    cardStateSchema.extend({
      id: z.literal(cardId),
      cardSetId: z.literal(cardSetId),
      cardType: z.literal(cardType),
      properties: cardPropertiesSchemaByCardSetId[cardSetId] ?? unknownRecordSchema,
    }),
  );
}`;
}

function renderPieceStateSchemaById(analysis: ManifestAnalysis): string {
  if (analysis.pieceIds.length === 0) {
    return "z.object({})";
  }

  return `z.object({\n${analysis.pieceIds
    .map((pieceId) => {
      const pieceTypeId = analysis.pieceTypeIdByPieceId.get(pieceId) ?? "";
      return `  ${quote(pieceId)}: z.object({
    componentType: z.string().optional(),
    id: z.literal(${quote(pieceId)}),
    pieceTypeId: z.literal(${quote(pieceTypeId)}),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: ${
      pieceTypeId
        ? `${pieceFieldsTypeName(pieceTypeId)}Schema`
        : "unknownRecordSchema"
    },
  }),`;
    })
    .join("\n")}\n})`;
}

function renderDieStateSchemaById(analysis: ManifestAnalysis): string {
  if (analysis.dieIds.length === 0) {
    return "z.object({})";
  }

  return `z.object({\n${analysis.dieIds
    .map((dieId) => {
      const dieTypeId = analysis.dieTypeIdByDieId.get(dieId) ?? "";
      const dieType = (analysis.manifest.dieTypes ?? []).find(
        (candidate) => candidate.id === dieTypeId,
      );
      return `  ${quote(dieId)}: z.object({
    componentType: z.string().optional(),
    id: z.literal(${quote(dieId)}),
    dieTypeId: z.literal(${quote(dieTypeId)}),
    dieName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    sides: z.literal(${dieType?.sides ?? 6}),
    value: z.number().int().nullable().optional(),
    properties: ${
      dieTypeId
        ? `${dieFieldsTypeName(dieTypeId)}Schema`
        : "unknownRecordSchema"
    },
  }),`;
    })
    .join("\n")}\n})`;
}

function renderGenericBoardStateSchema(
  board: AnalyzedGenericBoard,
  runtimeBoardId: string,
): string {
  const playerId =
    board.board.scope === "perPlayer"
      ? runtimeBoardId.slice(board.board.id.length + 1)
      : null;
  return `z.object({
    id: z.literal(${quote(runtimeBoardId)}),
    baseId: z.literal(${quote(board.board.id)}),
    layout: z.literal("generic"),
    typeId: ${
      board.boardTypeId
        ? `z.literal(${quote(board.boardTypeId)})`
        : "ids.boardTypeId.nullable().optional()"
    },
    scope: z.literal(${quote(board.board.scope)}),
    playerId: ${
      playerId
        ? `z.literal(${quote(playerId)})`
        : "ids.playerId.nullable().optional()"
    },
    templateId: z.string().nullable().optional(),
    fields: ${`${boardFieldsTypeName(board.board.id)}Schema`},
    spaces: z.record(
      ids.spaceId,
      z.object({
        id: ids.spaceId,
        name: z.string().nullable().optional(),
        typeId: ids.spaceTypeId.nullable().optional(),
        fields: ${`${boardSpaceFieldsTypeName(board.board.id)}Schema`},
        zoneId: z.string().nullable().optional(),
      }),
    ),
    relations: z.array(
      z.object({
        id: z.string().nullable().optional(),
        typeId: ids.relationTypeId,
        fromSpaceId: ids.spaceId,
        toSpaceId: ids.spaceId,
        directed: z.boolean(),
        fields: ${`${boardRelationFieldsTypeName(board.board.id)}Schema`},
      }),
    ),
    containers: z.record(
      ids.boardContainerId,
      z.object({
        id: ids.boardContainerId,
        name: z.string(),
        host: z.discriminatedUnion("type", [
          z.object({ type: z.literal("board") }),
          z.object({ type: z.literal("space"), spaceId: ids.spaceId }),
        ]),
        allowedCardSetIds: z.array(ids.cardSetId).optional(),
        zoneId: z.string(),
        fields: ${`${boardContainerFieldsTypeName(board.board.id)}Schema`},
      }),
    ),
  })`;
}

function renderHexBoardStateSchema(
  board: AnalyzedHexBoard,
  runtimeBoardId: string,
): string {
  const playerId =
    board.board.scope === "perPlayer"
      ? runtimeBoardId.slice(board.board.id.length + 1)
      : null;
  return `z.object({
    id: z.literal(${quote(runtimeBoardId)}),
    baseId: z.literal(${quote(board.board.id)}),
    layout: z.literal("hex"),
    typeId: ${
      board.boardTypeId
        ? `z.literal(${quote(board.boardTypeId)})`
        : "ids.boardTypeId.nullable().optional()"
    },
    scope: z.literal(${quote(board.board.scope)}),
    playerId: ${
      playerId
        ? `z.literal(${quote(playerId)})`
        : "ids.playerId.nullable().optional()"
    },
    templateId: z.string().nullable().optional(),
    fields: ${`${boardFieldsTypeName(board.board.id)}Schema`},
    spaces: z.record(
      ids.spaceId,
      z.object({
        id: ids.spaceId,
        name: z.string().nullable().optional(),
        typeId: ids.spaceTypeId.nullable().optional(),
        q: z.number().int(),
        r: z.number().int(),
        fields: ${`${boardSpaceFieldsTypeName(board.board.id)}Schema`},
        zoneId: z.string().nullable().optional(),
      }),
    ),
    relations: z.array(
      z.object({
        id: z.string().nullable().optional(),
        typeId: z.literal("adjacent"),
        fromSpaceId: ids.spaceId,
        toSpaceId: ids.spaceId,
        directed: z.boolean(),
        fields: unknownRecordSchema,
      }),
    ),
    containers: z.object({}),
    orientation: z.enum(["pointy-top", "flat-top"]),
    edges: z.array(
      z.object({
        id: ids.edgeId,
        spaceIds: z.array(ids.spaceId).min(1).max(2),
        typeId: ids.edgeTypeId.nullable().optional(),
        label: z.string().nullable().optional(),
        ownerId: ids.playerId.nullable().optional(),
        fields: ${`${hexEdgeFieldsTypeName(board.board.id)}Schema`},
      }),
    ),
    vertices: z.array(
      z.object({
        id: ids.vertexId,
        spaceIds: z.array(ids.spaceId).min(1).max(3),
        typeId: ids.vertexTypeId.nullable().optional(),
        label: z.string().nullable().optional(),
        ownerId: ids.playerId.nullable().optional(),
        fields: ${`${hexVertexFieldsTypeName(board.board.id)}Schema`},
      }),
    ),
  })`;
}

function renderSquareBoardStateSchema(
  board: AnalyzedSquareBoard,
  runtimeBoardId: string,
): string {
  const playerId =
    board.board.scope === "perPlayer"
      ? runtimeBoardId.slice(board.board.id.length + 1)
      : null;
  return `z.object({
    id: z.literal(${quote(runtimeBoardId)}),
    baseId: z.literal(${quote(board.board.id)}),
    layout: z.literal("square"),
    typeId: ${
      board.boardTypeId
        ? `z.literal(${quote(board.boardTypeId)})`
        : "ids.boardTypeId.nullable().optional()"
    },
    scope: z.literal(${quote(board.board.scope)}),
    playerId: ${
      playerId
        ? `z.literal(${quote(playerId)})`
        : "ids.playerId.nullable().optional()"
    },
    templateId: z.string().nullable().optional(),
    fields: ${`${boardFieldsTypeName(board.board.id)}Schema`},
    spaces: z.record(
      ids.spaceId,
      z.object({
        id: ids.spaceId,
        name: z.string().nullable().optional(),
        typeId: ids.spaceTypeId.nullable().optional(),
        row: z.number().int(),
        col: z.number().int(),
        fields: ${`${boardSpaceFieldsTypeName(board.board.id)}Schema`},
        zoneId: z.string().nullable().optional(),
      }),
    ),
    relations: z.array(
      z.object({
        id: z.string().nullable().optional(),
        typeId: ids.relationTypeId,
        fromSpaceId: ids.spaceId,
        toSpaceId: ids.spaceId,
        directed: z.boolean(),
        fields: ${`${boardRelationFieldsTypeName(board.board.id)}Schema`},
      }),
    ),
    containers: z.record(
      ids.boardContainerId,
      z.object({
        id: ids.boardContainerId,
        name: z.string(),
        host: z.discriminatedUnion("type", [
          z.object({ type: z.literal("board") }),
          z.object({ type: z.literal("space"), spaceId: ids.spaceId }),
        ]),
        allowedCardSetIds: z.array(ids.cardSetId).optional(),
        zoneId: z.string(),
        fields: ${`${boardContainerFieldsTypeName(board.board.id)}Schema`},
      }),
    ),
    edges: z.array(
      z.object({
        id: ids.edgeId,
        spaceIds: z.array(ids.spaceId).min(1).max(2),
        typeId: ids.edgeTypeId.nullable().optional(),
        label: z.string().nullable().optional(),
        ownerId: ids.playerId.nullable().optional(),
        fields: ${`${hexEdgeFieldsTypeName(board.board.id)}Schema`},
      }),
    ),
    vertices: z.array(
      z.object({
        id: ids.vertexId,
        spaceIds: z.array(ids.spaceId).min(1).max(4),
        typeId: ids.vertexTypeId.nullable().optional(),
        label: z.string().nullable().optional(),
        ownerId: ids.playerId.nullable().optional(),
        fields: ${`${hexVertexFieldsTypeName(board.board.id)}Schema`},
      }),
    ),
  })`;
}

function renderBoardStateSchemaById(analysis: ManifestAnalysis): string {
  if (analysis.boardIds.length === 0) {
    return "z.object({})";
  }

  return `z.object({\n${analysis.analyzedBoards
    .flatMap((board) =>
      board.runtimeBoardIds.map((runtimeBoardId) => {
        const schema =
          board.layout === "hex"
            ? renderHexBoardStateSchema(board, runtimeBoardId)
            : board.layout === "square"
              ? renderSquareBoardStateSchema(board, runtimeBoardId)
              : renderGenericBoardStateSchema(board, runtimeBoardId);
        return `  ${quote(runtimeBoardId)}: ${schema},`;
      }),
    )
    .join("\n")}\n})`;
}

function renderHexBoardStateSchemaById(analysis: ManifestAnalysis): string {
  const hexBoards = analysis.analyzedBoards.filter(
    (board): board is AnalyzedHexBoard => board.layout === "hex",
  );
  if (hexBoards.length === 0) {
    return "z.object({})";
  }

  return `z.object({\n${hexBoards
    .flatMap((board) =>
      board.runtimeBoardIds.map(
        (runtimeBoardId) =>
          `  ${quote(runtimeBoardId)}: ${renderHexBoardStateSchema(
            board,
            runtimeBoardId,
          )},`,
      ),
    )
    .join("\n")}\n})`;
}

function renderSquareBoardStateSchemaById(analysis: ManifestAnalysis): string {
  const squareBoards = analysis.analyzedBoards.filter(
    (board): board is AnalyzedSquareBoard => board.layout === "square",
  );
  if (squareBoards.length === 0) {
    return "z.object({})";
  }

  return `z.object({\n${squareBoards
    .flatMap((board) =>
      board.runtimeBoardIds.map(
        (runtimeBoardId) =>
          `  ${quote(runtimeBoardId)}: ${renderSquareBoardStateSchema(
            board,
            runtimeBoardId,
          )},`,
      ),
    )
    .join("\n")}\n})`;
}

function renderBoardLiteralHelpers(analysis: ManifestAnalysis): string {
  const boardIdsByBaseId = renderReadonlyArrayRecord(analysis.boardIdsByBaseId);

  return `export const boardHelpers = {
  boardIdsByBaseId: ${boardIdsByBaseId},
  boardLayoutById: ${renderStringRecord(analysis.boardLayoutById)},
  boardIdsByTypeId: ${renderReadonlyArrayRecord(analysis.boardIdsByTypeId)},
  spaceIdsByBoardId: ${renderReadonlyArrayRecord(analysis.spaceIdsByBoardId)},
  spaceIdsByTypeId: ${renderReadonlyArrayRecord(analysis.spaceIdsByTypeId)},
  containerIdsByBoardId: ${renderReadonlyArrayRecord(
    analysis.containerIdsByBoardId,
  )},
  relationTypeIdsByBoardId: ${renderReadonlyArrayRecord(
    analysis.relationTypeIdsByBoardId,
  )},
  edgeIdsByTypeId: ${renderReadonlyArrayRecord(analysis.edgeIdsByTypeId)},
  vertexIdsByTypeId: ${renderReadonlyArrayRecord(analysis.vertexIdsByTypeId)},
} as const;`;
}

function renderManifestContractSource(manifest: GameTopologyManifest): string {
  const analysis = analyzeManifest(manifest);
  const sharedZoneIds = analysis.sharedZones.map((zone) => zone.id).sort();
  const playerZoneIds = analysis.playerZones.map((zone) => zone.id).sort();
  const zoneVisibilityById = Object.fromEntries(
    Array.from(analysis.zoneVisibilityById.entries()).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );

  const emptySharedZonesTemplate = Object.fromEntries(
    sharedZoneIds.map((zoneId) => [zoneId, []]),
  );
  const defaultVisibilityTemplate = Object.fromEntries(
    analysis.cardIds.map((cardId) => [cardId, { faceUp: true }]),
  );
  const defaultOwnerTemplate = Object.fromEntries(
    analysis.cardIds.map((cardId) => [cardId, null]),
  );

  const perCardStateEntries = analysis.cardIds
    .map((cardId) => {
      const cardSetId = analysis.cardSetIdByCardId.get(cardId) ?? "";
      const cardType = analysis.cardTypeByCardId.get(cardId) ?? cardId;
      const propertiesType = cardSetId
        ? `${toPascalCase(cardSetId)}CardProperties`
        : "RuntimeRecord";
      return `  ${quote(cardId)}: CardStateRecord<${quote(cardId)}, ${quote(
        cardSetId,
      )}, ${quote(cardType)}, ${propertiesType}>;`;
    })
    .join("\n");
  const perPieceStateEntries = analysis.pieceIds
    .map((pieceId) => {
      const pieceTypeId = analysis.pieceTypeIdByPieceId.get(pieceId) ?? "";
      return `  ${quote(pieceId)}: PieceStateRecord<${quote(pieceId)}, ${quote(
        pieceTypeId,
      )}, ${
        pieceTypeId ? pieceFieldsTypeName(pieceTypeId) : "RuntimeRecord"
      }>;`;
    })
    .join("\n");
  const perDieStateEntries = analysis.dieIds
    .map((dieId) => {
      const dieTypeId = analysis.dieTypeIdByDieId.get(dieId) ?? "";
      return `  ${quote(dieId)}: DieStateRecord<${quote(dieId)}, ${quote(
        dieTypeId,
      )}, ${dieTypeId ? dieFieldsTypeName(dieTypeId) : "RuntimeRecord"}>;`;
    })
    .join("\n");
  const perBoardStateEntries = analysis.analyzedBoards
    .flatMap((board) =>
      board.runtimeBoardIds.map((runtimeBoardId) => {
        if (board.layout === "hex") {
          return `  ${quote(runtimeBoardId)}: HexBoardStateRecord<${quote(
            runtimeBoardId,
          )}, ${renderStringUnion(
            board.spaces.map((space) => space.id),
          )}, ${boardFieldsTypeName(board.board.id)}, ${boardSpaceFieldsTypeName(
            board.board.id,
          )}, ${hexEdgeFieldsTypeName(board.board.id)}, ${hexVertexFieldsTypeName(
            board.board.id,
          )}>;`;
        }
        if (board.layout === "square") {
          return `  ${quote(runtimeBoardId)}: SquareBoardStateRecord<${quote(
            runtimeBoardId,
          )}, ${renderStringUnion(
            board.spaces.map((space) => space.id),
          )}, ${renderStringUnion(
            board.containers.map((container) => container.id),
          )}, ${boardFieldsTypeName(board.board.id)}, ${boardSpaceFieldsTypeName(
            board.board.id,
          )}, ${boardRelationFieldsTypeName(
            board.board.id,
          )}, ${boardContainerFieldsTypeName(
            board.board.id,
          )}, ${hexEdgeFieldsTypeName(board.board.id)}, ${hexVertexFieldsTypeName(
            board.board.id,
          )}>;`;
        }

        return `  ${quote(runtimeBoardId)}: GenericBoardStateRecord<${quote(
          runtimeBoardId,
        )}, ${renderStringUnion(
          board.spaces.map((space) => space.id),
        )}, ${renderStringUnion(
          board.containers.map((container) => container.id),
        )}, ${boardFieldsTypeName(board.board.id)}, ${boardSpaceFieldsTypeName(
          board.board.id,
        )}, ${boardRelationFieldsTypeName(
          board.board.id,
        )}, ${boardContainerFieldsTypeName(board.board.id)}>;`;
      }),
    )
    .join("\n");
  const perHexBoardStateEntries = analysis.analyzedBoards
    .filter((board): board is AnalyzedHexBoard => board.layout === "hex")
    .flatMap((board) =>
      board.runtimeBoardIds.map(
        (runtimeBoardId) => `  ${quote(runtimeBoardId)}: Extract<
    BoardStateById[${quote(runtimeBoardId)}],
    HexBoardStateRecord
  >;`,
      ),
    )
    .join("\n");
  const perSquareBoardStateEntries = analysis.analyzedBoards
    .filter((board): board is AnalyzedSquareBoard => board.layout === "square")
    .flatMap((board) =>
      board.runtimeBoardIds.map(
        (runtimeBoardId) => `  ${quote(runtimeBoardId)}: Extract<
    BoardStateById[${quote(runtimeBoardId)}],
    SquareBoardStateRecord
  >;`,
      ),
    )
    .join("\n");

  return `/**
 * Generated file.
 * Do not edit directly.
 */

import { z } from "zod";
import {
  assumeManifestSchema,
  cloneManifestDefault,
  createManifestGameStateSchema,
  createManifestRuntimeSchema,
  createManifestStringLiteralSchema,
  resolveManifestPlayerIds,
} from "@dreamboard/app-sdk/reducer";
import type {
  ReducerManifestContract,
  RuntimeCardData,
  RuntimeCardVisibility,
  RuntimeComponentLocation,
  RuntimeDieData,
  RuntimeHandVisibilityMode,
  RuntimePieceData,
  RuntimeRecord,
  RuntimeTableRecord,
} from "@dreamboard/app-sdk/reducer";

const unknownRecordSchema = assumeManifestSchema<RuntimeRecord>(
  z.record(z.string(), z.unknown()),
);

function resolveDefaultPlayerIds(
  playerIds: readonly string[] | undefined,
): readonly PlayerId[] {
  return resolveManifestPlayerIds(literals.playerIds, playerIds);
}

export const literals = {
  playerIds: ${renderConstArray(analysis.playerIds)},
  phaseNames: [] as readonly string[],
  boardLayouts: ["generic", "hex", "square"] as const,
  setupOptionIds: ${renderConstArray(analysis.setupOptionIds)},
  setupProfileIds: ${renderConstArray(analysis.setupProfileIds)},
  cardSetIds: ${renderConstArray(analysis.cardSetIds)},
  cardTypes: ${renderConstArray(analysis.cardTypes)},
  cardIds: ${renderConstArray(analysis.cardIds)},
  deckIds: ${renderConstArray(sharedZoneIds)},
  handIds: ${renderConstArray(playerZoneIds)},
  sharedZoneIds: ${renderConstArray(sharedZoneIds)},
  playerZoneIds: ${renderConstArray(playerZoneIds)},
  zoneIds: ${renderConstArray(analysis.zoneIds)},
  resourceIds: ${renderConstArray(analysis.resourceIds)},
  pieceTypeIds: ${renderConstArray(analysis.pieceTypeIds)},
  pieceIds: ${renderConstArray(analysis.pieceIds)},
  dieTypeIds: ${renderConstArray(analysis.dieTypeIds)},
  dieIds: ${renderConstArray(analysis.dieIds)},
  boardTypeIds: ${renderConstArray(analysis.boardTypeIds)},
  boardBaseIds: ${renderConstArray(analysis.boardBaseIds)},
  boardIds: ${renderConstArray(analysis.boardIds)},
  boardContainerIds: ${renderConstArray(analysis.boardContainerIds)},
  relationTypeIds: ${renderConstArray(analysis.relationTypeIds)},
  edgeIds: ${renderConstArray(analysis.edgeIds)},
  edgeTypeIds: ${renderConstArray(analysis.edgeTypeIds)},
  vertexIds: ${renderConstArray(analysis.vertexIds)},
  vertexTypeIds: ${renderConstArray(analysis.vertexTypeIds)},
  spaceIds: ${renderConstArray(analysis.spaceIds)},
  spaceTypeIds: ${renderConstArray(analysis.spaceTypeIds)},
  handVisibilityById: ${renderStringRecord(
    playerZoneIds.map(
      (zoneId) => [zoneId, zoneVisibilityById[zoneId] ?? "ownerOnly"] as const,
    ),
  )},
  zoneVisibilityById: ${renderStringRecord(analysis.zoneVisibilityById)},
  cardSetIdByCardId: ${renderStringRecord(analysis.cardSetIdByCardId)},
  cardTypeByCardId: ${renderStringRecord(analysis.cardTypeByCardId)},
  setupChoiceIdsByOptionId: ${renderReadonlyArrayRecord(
    analysis.setupChoiceIdsByOptionId,
  )},
  cardSetIdsBySharedZoneId: ${renderReadonlyArrayRecord(
    analysis.sharedZoneCardSetIds,
  )},
  cardSetIdsByPlayerZoneId: ${renderReadonlyArrayRecord(
    analysis.playerZoneCardSetIds,
  )},
} as const;

const playerIdSchema = createManifestStringLiteralSchema(literals.playerIds);
const phaseNameSchema = z.string();
const boardLayoutSchema = createManifestStringLiteralSchema(literals.boardLayouts);
const setupOptionIdSchema = createManifestStringLiteralSchema(literals.setupOptionIds);
const setupProfileIdSchema = createManifestStringLiteralSchema(
  literals.setupProfileIds,
);
const cardSetIdSchema = createManifestStringLiteralSchema(literals.cardSetIds);
const cardTypeSchema = createManifestStringLiteralSchema(literals.cardTypes);
const cardIdSchema = createManifestStringLiteralSchema(literals.cardIds);
const deckIdSchema = createManifestStringLiteralSchema(literals.deckIds);
const handIdSchema = createManifestStringLiteralSchema(literals.handIds);
const sharedZoneIdSchema = createManifestStringLiteralSchema(literals.sharedZoneIds);
const playerZoneIdSchema = createManifestStringLiteralSchema(literals.playerZoneIds);
const zoneIdSchema = createManifestStringLiteralSchema(literals.zoneIds);
const resourceIdSchema = createManifestStringLiteralSchema(literals.resourceIds);
const pieceTypeIdSchema = createManifestStringLiteralSchema(literals.pieceTypeIds);
const pieceIdSchema = createManifestStringLiteralSchema(literals.pieceIds);
const dieTypeIdSchema = createManifestStringLiteralSchema(literals.dieTypeIds);
const dieIdSchema = createManifestStringLiteralSchema(literals.dieIds);
const boardTypeIdSchema = createManifestStringLiteralSchema(literals.boardTypeIds);
const boardBaseIdSchema = createManifestStringLiteralSchema(literals.boardBaseIds);
const boardIdSchema = createManifestStringLiteralSchema(literals.boardIds);
const boardContainerIdSchema = createManifestStringLiteralSchema(
  literals.boardContainerIds,
);
const relationTypeIdSchema = createManifestStringLiteralSchema(literals.relationTypeIds);
const edgeIdSchema = createManifestStringLiteralSchema(literals.edgeIds);
const edgeTypeIdSchema = createManifestStringLiteralSchema(literals.edgeTypeIds);
const vertexIdSchema = createManifestStringLiteralSchema(literals.vertexIds);
const vertexTypeIdSchema = createManifestStringLiteralSchema(literals.vertexTypeIds);
const spaceIdSchema = createManifestStringLiteralSchema(literals.spaceIds);
const spaceTypeIdSchema = createManifestStringLiteralSchema(literals.spaceTypeIds);

export const ids = {
  playerId: playerIdSchema,
  phaseName: phaseNameSchema,
  boardLayout: boardLayoutSchema,
  setupOptionId: setupOptionIdSchema,
  setupProfileId: setupProfileIdSchema,
  cardSetId: cardSetIdSchema,
  cardType: cardTypeSchema,
  cardId: cardIdSchema,
  deckId: deckIdSchema,
  handId: handIdSchema,
  sharedZoneId: sharedZoneIdSchema,
  playerZoneId: playerZoneIdSchema,
  zoneId: zoneIdSchema,
  resourceId: resourceIdSchema,
  pieceTypeId: pieceTypeIdSchema,
  pieceId: pieceIdSchema,
  dieTypeId: dieTypeIdSchema,
  dieId: dieIdSchema,
  boardTypeId: boardTypeIdSchema,
  boardBaseId: boardBaseIdSchema,
  boardId: boardIdSchema,
  boardContainerId: boardContainerIdSchema,
  relationTypeId: relationTypeIdSchema,
  edgeId: edgeIdSchema,
  edgeTypeId: edgeTypeIdSchema,
  vertexId: vertexIdSchema,
  vertexTypeId: vertexTypeIdSchema,
  spaceId: spaceIdSchema,
  spaceTypeId: spaceTypeIdSchema,
} as const;

export type PlayerId = z.infer<typeof playerIdSchema>;
export type PhaseName = z.infer<typeof phaseNameSchema>;
export type BoardLayout = z.infer<typeof boardLayoutSchema>;
export type SetupOptionId = z.infer<typeof setupOptionIdSchema>;
export type SetupProfileId = z.infer<typeof setupProfileIdSchema>;
export type CardSetId = z.infer<typeof cardSetIdSchema>;
export type CardType = z.infer<typeof cardTypeSchema>;
export type CardId = z.infer<typeof cardIdSchema>;
export type DeckId = z.infer<typeof deckIdSchema>;
export type HandId = z.infer<typeof handIdSchema>;
export type SharedZoneId = z.infer<typeof sharedZoneIdSchema>;
export type PlayerZoneId = z.infer<typeof playerZoneIdSchema>;
export type ZoneId = z.infer<typeof zoneIdSchema>;
export type ResourceId = z.infer<typeof resourceIdSchema>;
export type PieceTypeId = z.infer<typeof pieceTypeIdSchema>;
export type PieceId = z.infer<typeof pieceIdSchema>;
export type DieTypeId = z.infer<typeof dieTypeIdSchema>;
export type DieId = z.infer<typeof dieIdSchema>;
export type BoardTypeId = z.infer<typeof boardTypeIdSchema>;
export type BoardBaseId = z.infer<typeof boardBaseIdSchema>;
export type BoardId = z.infer<typeof boardIdSchema>;
export type BoardContainerId = z.infer<typeof boardContainerIdSchema>;
export type RelationTypeId = z.infer<typeof relationTypeIdSchema>;
export type EdgeId = z.infer<typeof edgeIdSchema>;
export type EdgeTypeId = z.infer<typeof edgeTypeIdSchema>;
export type VertexId = z.infer<typeof vertexIdSchema>;
export type VertexTypeId = z.infer<typeof vertexTypeIdSchema>;
export type SpaceId = z.infer<typeof spaceIdSchema>;
export type SpaceTypeId = z.infer<typeof spaceTypeIdSchema>;

export type PlayerRecord<T> = Record<PlayerId, T>;
export type SharedZoneRecord<T> = Record<SharedZoneId, T>;
export type PlayerZoneRecord<T> = Record<PlayerZoneId, PlayerRecord<T>>;
export type ComponentId = CardId | PieceId | DieId;
export type ComponentIdsBySharedZoneId = {
${sharedZoneIds.map((zoneId) => `  ${quote(zoneId)}: ComponentId[];`).join("\n")}
};
export type ComponentIdsByPlayerZoneId = {
${playerZoneIds.map((zoneId) => `  ${quote(zoneId)}: PlayerRecord<ComponentId[]>;`).join("\n")}
};
export type SetupOptionChoice = {
  id: string;
  label: string;
  description?: string | null;
};
export type SetupOption = {
  id: SetupOptionId;
  name: string;
  description?: string | null;
  choices: readonly SetupOptionChoice[];
};
export type SetupProfile = {
  id: SetupProfileId;
  name: string;
  description?: string | null;
  optionValues?: Partial<Record<SetupOptionId, string>> | null;
};
export const setupOptionsById = ${renderJsonConst(analysis.setupOptionsById)};
export const setupChoiceIdsByOptionId = ${renderReadonlyArrayRecord(
    analysis.setupChoiceIdsByOptionId,
  )};
export const setupProfilesById = ${renderJsonConst(analysis.setupProfilesById)};

${renderCardSetPropertySections(analysis.cardSets)}

${renderTopologyFieldSections(analysis)}

${renderBoardFieldMapTypes(analysis)}

export type CardProperties = ${
    analysis.cardSets.length > 0
      ? analysis.cardSets
          .map((cardSet) => `${toPascalCase(cardSet.id)}CardProperties`)
          .join(" | ")
      : "RuntimeRecord"
  };

export type CardStateRecord<
  CardIdValue extends CardId = CardId,
  CardSetIdValue extends CardSetId = CardSetId,
  CardTypeValue extends CardType = CardType,
  Properties = RuntimeRecord,
> = Omit<RuntimeCardData, "id" | "cardSetId" | "cardType" | "properties"> & {
  id: CardIdValue;
  cardSetId: CardSetIdValue;
  cardType: CardTypeValue;
  properties: Properties;
};

export type CardStateById = ${
    perCardStateEntries.length > 0
      ? `{\n${perCardStateEntries}\n}`
      : "Record<string, never>"
  };

export type PieceStateRecord<
  PieceIdValue extends PieceId = PieceId,
  PieceTypeIdValue extends PieceTypeId = PieceTypeId,
  Fields = RuntimeRecord,
> = Omit<RuntimePieceData, "id" | "pieceTypeId" | "properties"> & {
  id: PieceIdValue;
  pieceTypeId: PieceTypeIdValue;
  properties: Fields;
};

export type DieStateRecord<
  DieIdValue extends DieId = DieId,
  DieTypeIdValue extends DieTypeId = DieTypeId,
  Fields = RuntimeRecord,
> = Omit<RuntimeDieData, "id" | "dieTypeId" | "properties"> & {
  id: DieIdValue;
  dieTypeId: DieTypeIdValue;
  properties: Fields;
};

export type PieceStateById = ${
    perPieceStateEntries.length > 0
      ? `{\n${perPieceStateEntries}\n}`
      : "Record<string, never>"
  };

export type DieStateById = ${
    perDieStateEntries.length > 0
      ? `{\n${perDieStateEntries}\n}`
      : "Record<string, never>"
  };
export type CardIdsBySharedZoneId = ComponentIdsBySharedZoneId;
export type CardIdsByPlayerZoneId = ComponentIdsByPlayerZoneId;
export type CardIdsByDeckId = CardIdsBySharedZoneId;

export interface BoardSpaceStateRecord<
  SpaceIdValue extends SpaceId = SpaceId,
  Fields = RuntimeRecord,
> {
  id: SpaceIdValue;
  name?: string | null;
  typeId?: SpaceTypeId | null;
  fields: Fields;
  zoneId?: string | null;
}

export interface BoardRelationStateRecord<
  SpaceIdValue extends SpaceId = SpaceId,
  Fields = RuntimeRecord,
> {
  id?: string | null;
  typeId: RelationTypeId;
  fromSpaceId: SpaceIdValue;
  toSpaceId: SpaceIdValue;
  directed: boolean;
  fields: Fields;
}

export interface BoardContainerStateRecord<
  SpaceIdValue extends SpaceId = SpaceId,
  ContainerIdValue extends BoardContainerId = BoardContainerId,
  Fields = RuntimeRecord,
> {
  id: ContainerIdValue;
  name: string;
  host:
    | { type: "board" }
    | {
        type: "space";
        spaceId: SpaceIdValue;
      };
  allowedCardSetIds?: readonly CardSetId[];
  zoneId: string;
  fields: Fields;
}

export interface BoardStateRecordBase<
  BoardIdValue extends BoardId = BoardId,
  SpaceIdValue extends SpaceId = SpaceId,
  ContainerIdValue extends BoardContainerId = BoardContainerId,
  BoardFields = RuntimeRecord,
  SpaceFields = RuntimeRecord,
  RelationFields = RuntimeRecord,
  ContainerFields = RuntimeRecord,
> {
  id: BoardIdValue;
  baseId: BoardBaseId;
  typeId?: BoardTypeId | null;
  scope: "shared" | "perPlayer";
  playerId?: PlayerId | null;
  templateId?: string | null;
  fields: BoardFields;
}

export interface GenericBoardStateRecord<
  BoardIdValue extends BoardId = BoardId,
  SpaceIdValue extends SpaceId = SpaceId,
  ContainerIdValue extends BoardContainerId = BoardContainerId,
  BoardFields = RuntimeRecord,
  SpaceFields = RuntimeRecord,
  RelationFields = RuntimeRecord,
  ContainerFields = RuntimeRecord,
> extends BoardStateRecordBase<
    BoardIdValue,
    SpaceIdValue,
    ContainerIdValue,
    BoardFields,
    SpaceFields,
    RelationFields,
    ContainerFields
  > {
  layout: "generic";
  spaces: Record<
    SpaceIdValue,
    BoardSpaceStateRecord<SpaceIdValue, SpaceFields>
  >;
  relations: Array<BoardRelationStateRecord<SpaceIdValue, RelationFields>>;
  containers: Record<
    ContainerIdValue,
    BoardContainerStateRecord<SpaceIdValue, ContainerIdValue, ContainerFields>
  >;
}

export interface HexSpaceStateRecord<
  SpaceIdValue extends SpaceId = SpaceId,
  Fields = RuntimeRecord,
> extends BoardSpaceStateRecord<SpaceIdValue, Fields> {
  q: number;
  r: number;
}

export interface SquareSpaceStateRecord<
  SpaceIdValue extends SpaceId = SpaceId,
  Fields = RuntimeRecord,
> extends BoardSpaceStateRecord<SpaceIdValue, Fields> {
  row: number;
  col: number;
}

export interface TiledEdgeStateRecord<
  SpaceIdValue extends SpaceId = SpaceId,
  Fields = RuntimeRecord,
> {
  id: EdgeId;
  spaceIds: readonly SpaceIdValue[];
  typeId?: EdgeTypeId | null;
  label?: string | null;
  ownerId?: PlayerId | null;
  fields: Fields;
}

export interface TiledVertexStateRecord<
  SpaceIdValue extends SpaceId = SpaceId,
  Fields = RuntimeRecord,
> {
  id: VertexId;
  spaceIds: readonly SpaceIdValue[];
  typeId?: VertexTypeId | null;
  label?: string | null;
  ownerId?: PlayerId | null;
  fields: Fields;
}

export type HexEdgeStateRecord<
  SpaceIdValue extends SpaceId = SpaceId,
  Fields = RuntimeRecord,
> = TiledEdgeStateRecord<SpaceIdValue, Fields>;

export type HexVertexStateRecord<
  SpaceIdValue extends SpaceId = SpaceId,
  Fields = RuntimeRecord,
> = TiledVertexStateRecord<SpaceIdValue, Fields>;

export interface HexBoardStateRecord<
  BoardIdValue extends BoardId = BoardId,
  SpaceIdValue extends SpaceId = SpaceId,
  BoardFields = RuntimeRecord,
  SpaceFields = RuntimeRecord,
  EdgeFields = RuntimeRecord,
  VertexFields = RuntimeRecord,
> extends BoardStateRecordBase<
    BoardIdValue,
    SpaceIdValue,
    never,
    BoardFields,
    SpaceFields,
    RuntimeRecord,
    RuntimeRecord
  > {
  layout: "hex";
  spaces: Record<SpaceIdValue, HexSpaceStateRecord<SpaceIdValue, SpaceFields>>;
  relations: Array<BoardRelationStateRecord<SpaceIdValue, RuntimeRecord>>;
  containers: Record<never, never>;
  orientation: "pointy-top" | "flat-top";
  edges: Array<HexEdgeStateRecord<SpaceIdValue, EdgeFields>>;
  vertices: Array<HexVertexStateRecord<SpaceIdValue, VertexFields>>;
}

export interface SquareBoardStateRecord<
  BoardIdValue extends BoardId = BoardId,
  SpaceIdValue extends SpaceId = SpaceId,
  ContainerIdValue extends BoardContainerId = BoardContainerId,
  BoardFields = RuntimeRecord,
  SpaceFields = RuntimeRecord,
  RelationFields = RuntimeRecord,
  ContainerFields = RuntimeRecord,
  EdgeFields = RuntimeRecord,
  VertexFields = RuntimeRecord,
> extends BoardStateRecordBase<
    BoardIdValue,
    SpaceIdValue,
    ContainerIdValue,
    BoardFields,
    SpaceFields,
    RelationFields,
    ContainerFields
  > {
  layout: "square";
  spaces: Record<
    SpaceIdValue,
    SquareSpaceStateRecord<SpaceIdValue, SpaceFields>
  >;
  relations: Array<BoardRelationStateRecord<SpaceIdValue, RelationFields>>;
  containers: Record<
    ContainerIdValue,
    BoardContainerStateRecord<SpaceIdValue, ContainerIdValue, ContainerFields>
  >;
  edges: Array<TiledEdgeStateRecord<SpaceIdValue, EdgeFields>>;
  vertices: Array<TiledVertexStateRecord<SpaceIdValue, VertexFields>>;
}

export type TiledBoardStateRecord =
  | HexBoardStateRecord
  | SquareBoardStateRecord;

export type BoardStateById = {
${perBoardStateEntries}
};

export type HexBoardStateById = ${
    perHexBoardStateEntries.length > 0
      ? `{\n${perHexBoardStateEntries}\n}`
      : "Record<string, never>"
  };

export type SquareBoardStateById = ${
    perSquareBoardStateEntries.length > 0
      ? `{\n${perSquareBoardStateEntries}\n}`
      : "Record<string, never>"
  };

export type BoardStateRecord = ${
    analysis.boardIds.length > 0 ? "BoardStateById[BoardId]" : "never"
  };

export interface TableState extends RuntimeTableRecord {
  playerOrder: PlayerId[];
  zones: {
    shared: ComponentIdsBySharedZoneId;
    perPlayer: ComponentIdsByPlayerZoneId;
    visibility: Record<ZoneId, RuntimeHandVisibilityMode>;
    cardSetIdsByZoneId?: Record<ZoneId, readonly CardSetId[]>;
  };
  decks: ComponentIdsBySharedZoneId;
  hands: ComponentIdsByPlayerZoneId;
  handVisibility: Record<PlayerZoneId, RuntimeHandVisibilityMode>;
  cards: CardStateById;
  pieces: PieceStateById;
  componentLocations: Record<ComponentId, RuntimeComponentLocation>;
  ownerOfCard: Record<CardId, PlayerId | null>;
  visibility: Record<CardId, RuntimeCardVisibility>;
  resources: PlayerRecord<Record<ResourceId, number>>;
  boards: Omit<RuntimeTableRecord["boards"], "byId" | "hex" | "square"> & {
    byId: BoardStateById;
    hex: HexBoardStateById;
    square: SquareBoardStateById;
  };
  dice: DieStateById;
}

const sharedZoneSchema = z.record(sharedZoneIdSchema, z.array(z.string()));
const playerZoneSchema = z.record(
  playerZoneIdSchema,
  z.record(z.string(), z.array(z.string())),
);
const cardStateSchema = z.object({
  componentType: z.string().optional(),
  id: ids.cardId,
  cardSetId: ids.cardSetId,
  cardType: ids.cardType,
  cardName: z.string().optional(),
  description: z.string().optional(),
  properties: unknownRecordSchema,
});
${renderCardPropertiesSchemaByCardSetId(analysis.cardSets)}
${renderCardStateSchemaFactory(analysis)}
const cardStateByIdSchema = ${renderCardStateSchemaById(analysis)};
const pieceStateByIdSchema = ${renderPieceStateSchemaById(analysis)};
const dieStateByIdSchema = ${renderDieStateSchemaById(analysis)};
const boardStateByIdSchema = ${renderBoardStateSchemaById(analysis)};
const hexBoardStateByIdSchema = ${renderHexBoardStateSchemaById(analysis)};
const squareBoardStateByIdSchema = ${renderSquareBoardStateSchemaById(
    analysis,
  )};
const boardSpaceTypeIdSchema = ids.spaceTypeId.nullable().optional();
const boardSpaceStateSchema = z.object({
  id: ids.spaceId,
  name: z.string().nullable().optional(),
  typeId: boardSpaceTypeIdSchema,
  fields: unknownRecordSchema,
  zoneId: z.string().nullable().optional(),
});
const hexSpaceStateSchema = boardSpaceStateSchema.extend({
  q: z.number().int(),
  r: z.number().int(),
});
const squareSpaceStateSchema = boardSpaceStateSchema.extend({
  row: z.number().int(),
  col: z.number().int(),
});
const boardRelationStateSchema = z.object({
  id: z.string().nullable().optional(),
  typeId: ids.relationTypeId,
  fromSpaceId: ids.spaceId,
  toSpaceId: ids.spaceId,
  directed: z.boolean(),
  fields: unknownRecordSchema,
});
const boardContainerStateSchema = z.object({
  id: ids.boardContainerId,
  name: z.string(),
  host: z.discriminatedUnion("type", [
    z.object({ type: z.literal("board") }),
    z.object({ type: z.literal("space"), spaceId: ids.spaceId }),
  ]),
  allowedCardSetIds: z.array(ids.cardSetId).optional(),
  zoneId: z.string(),
  fields: unknownRecordSchema,
});
const runtimeGenericBoardStateSchema = z.object({
  id: ids.boardId,
  baseId: ids.boardBaseId,
  layout: z.literal("generic"),
  typeId: ids.boardTypeId.nullable().optional(),
  scope: z.enum(["shared", "perPlayer"]),
  playerId: ids.playerId.nullable().optional(),
  templateId: z.string().nullable().optional(),
  fields: unknownRecordSchema,
  spaces: z.record(ids.spaceId, boardSpaceStateSchema),
  relations: z.array(boardRelationStateSchema),
  containers: z.record(ids.boardContainerId, boardContainerStateSchema),
});
const hexEdgeStateSchema = z.object({
  id: ids.edgeId,
  spaceIds: z.array(ids.spaceId).min(1).max(2),
  typeId: ids.edgeTypeId.nullable().optional(),
  label: z.string().nullable().optional(),
  ownerId: ids.playerId.nullable().optional(),
  fields: unknownRecordSchema,
});
const hexVertexStateSchema = z.object({
  id: ids.vertexId,
  spaceIds: z.array(ids.spaceId).min(1).max(3),
  typeId: ids.vertexTypeId.nullable().optional(),
  label: z.string().nullable().optional(),
  ownerId: ids.playerId.nullable().optional(),
  fields: unknownRecordSchema,
});
const squareVertexStateSchema = z.object({
  id: ids.vertexId,
  spaceIds: z.array(ids.spaceId).min(1).max(4),
  typeId: ids.vertexTypeId.nullable().optional(),
  label: z.string().nullable().optional(),
  ownerId: ids.playerId.nullable().optional(),
  fields: unknownRecordSchema,
});
const runtimeHexBoardStateSchema = runtimeGenericBoardStateSchema.extend({
  layout: z.literal("hex"),
  spaces: z.record(ids.spaceId, hexSpaceStateSchema),
  relations: z.array(boardRelationStateSchema),
  containers: z.object({}),
  orientation: z.enum(["pointy-top", "flat-top"]),
  edges: z.array(hexEdgeStateSchema),
  vertices: z.array(hexVertexStateSchema),
});
const runtimeSquareBoardStateSchema = runtimeGenericBoardStateSchema.extend({
  layout: z.literal("square"),
  spaces: z.record(ids.spaceId, squareSpaceStateSchema),
  relations: z.array(boardRelationStateSchema),
  containers: z.record(ids.boardContainerId, boardContainerStateSchema),
  edges: z.array(hexEdgeStateSchema),
  vertices: z.array(squareVertexStateSchema),
});
const runtimeBoardStateSchema = z.union([
  runtimeGenericBoardStateSchema,
  runtimeHexBoardStateSchema,
  runtimeSquareBoardStateSchema,
]);
const rawTableSchema = z.object({
  playerOrder: z.array(ids.playerId),
  zones: z.object({
    shared: sharedZoneSchema,
    perPlayer: playerZoneSchema,
    visibility: z.record(zoneIdSchema, z.enum(["all", "ownerOnly", "public", "hidden"])),
    cardSetIdsByZoneId: z.record(zoneIdSchema, z.array(ids.cardSetId)).optional(),
  }),
  decks: sharedZoneSchema,
  hands: playerZoneSchema,
  handVisibility: z.record(
    playerZoneIdSchema,
    z.enum(["all", "ownerOnly", "public", "hidden"]),
  ),
  cards: cardStateByIdSchema,
  pieces: pieceStateByIdSchema,
  componentLocations: z.record(
    z.string(),
    z.discriminatedUnion("type", [
      z.object({ type: z.literal("Detached") }),
      z.object({
        type: z.literal("InDeck"),
        deckId: ids.deckId,
        playedBy: ids.playerId.nullable(),
        position: z.number().int().nullable().optional(),
      }),
      z.object({
        type: z.literal("InHand"),
        handId: ids.handId,
        playerId: ids.playerId,
        position: z.number().int().nullable().optional(),
      }),
      z.object({
        type: z.literal("InZone"),
        zoneId: z.string(),
        playedBy: ids.playerId.nullable().optional(),
        position: z.number().int().nullable().optional(),
      }),
      z.object({
        type: z.literal("OnSpace"),
        boardId: ids.boardId,
        spaceId: ids.spaceId,
        position: z.number().int().nullable().optional(),
      }),
      z.object({
        type: z.literal("InContainer"),
        boardId: ids.boardId,
        containerId: ids.boardContainerId,
        position: z.number().int().nullable().optional(),
      }),
      z.object({
        type: z.literal("OnEdge"),
        boardId: ids.boardId,
        edgeId: ids.edgeId,
        position: z.number().int().nullable().optional(),
      }),
      z.object({
        type: z.literal("OnVertex"),
        boardId: ids.boardId,
        vertexId: ids.vertexId,
        position: z.number().int().nullable().optional(),
      }),
      z.object({
        type: z.literal("InSlot"),
        hostComponentId: z.string(),
        slotId: z.string(),
        position: z.number().int().nullable().optional(),
      }),
    ]),
  ),
  ownerOfCard: z.record(ids.cardId, ids.playerId.nullable()),
  visibility: z.record(
    ids.cardId,
    z.object({
      faceUp: z.boolean(),
      visibleTo: z.array(ids.playerId).nullable().optional(),
    }),
  ),
  resources: z.record(z.string(), z.record(ids.resourceId, z.number().int())),
  boards: z.object({
    byId: boardStateByIdSchema,
    hex: hexBoardStateByIdSchema,
    square: squareBoardStateByIdSchema,
  }),
  dice: dieStateByIdSchema,
});

export const tableSchema = assumeManifestSchema<TableState>(rawTableSchema);

export const runtimeSchema = createManifestRuntimeSchema({
  phaseNameSchema: z.string(),
  playerIdSchema: ids.playerId,
  setupProfileIdSchema: ids.setupProfileId,
});

function buildPlayerRecord<Value>(
  playerIds: readonly PlayerId[],
  createValue: () => Value,
): PlayerRecord<Value> {
  return Object.fromEntries(
    playerIds.map((playerId) => [playerId, createValue()]),
  ) as PlayerRecord<Value>;
}

function buildPerPlayerComponentIds(
  playerIds: readonly PlayerId[],
): ComponentIdsByPlayerZoneId {
  return Object.fromEntries(
    literals.playerZoneIds.map((zoneId) => [
      zoneId,
      buildPlayerRecord(playerIds, () => [] as ComponentId[]),
    ]),
  ) as ComponentIdsByPlayerZoneId;
}

function buildPlayerResources(
  playerIds: readonly PlayerId[],
): PlayerRecord<Record<ResourceId, number>> {
  return Object.fromEntries(
    playerIds.map((playerId) => [
      playerId,
      Object.fromEntries(
        literals.resourceIds.map((resourceId) => [resourceId, 0]),
      ),
    ]),
  ) as PlayerRecord<Record<ResourceId, number>>;
}

export const defaults = {
  zones: (playerIds?: readonly string[]) => ({
    shared: cloneManifestDefault(${JSON.stringify(emptySharedZonesTemplate)}),
    perPlayer: buildPerPlayerComponentIds(resolveDefaultPlayerIds(playerIds)),
    visibility: cloneManifestDefault(${JSON.stringify(zoneVisibilityById)}),
    cardSetIdsByZoneId: cloneManifestDefault(${JSON.stringify(
      Object.fromEntries(
        Array.from(analysis.zoneCardSetIdsById.entries()).sort(
          ([left], [right]) => left.localeCompare(right),
        ),
      ),
    )}),
  }) as TableState["zones"],
  decks: () => cloneManifestDefault(${JSON.stringify(emptySharedZonesTemplate)}) as TableState["decks"],
  hands: (playerIds?: readonly string[]) =>
    buildPerPlayerComponentIds(resolveDefaultPlayerIds(playerIds)) as TableState["hands"],
  handVisibility: () => cloneManifestDefault(${JSON.stringify(
    Object.fromEntries(
      playerZoneIds.map((zoneId) => [
        zoneId,
        zoneVisibilityById[zoneId] ?? "ownerOnly",
      ]),
    ),
  )}) as TableState["handVisibility"],
  ownerOfCard: () => cloneManifestDefault(${JSON.stringify(defaultOwnerTemplate)}) as TableState["ownerOfCard"],
  visibility: () => cloneManifestDefault(${JSON.stringify(defaultVisibilityTemplate)}) as TableState["visibility"],
  resources: (playerIds?: readonly string[]) =>
    buildPlayerResources(resolveDefaultPlayerIds(playerIds)) as TableState["resources"],
} as const;

export const schemas = {
  table: tableSchema,
  runtime: runtimeSchema,
} as const;

export function createGameStateSchema<
  PhaseNameSchema extends z.ZodTypeAny,
  PublicSchema extends z.ZodTypeAny,
  PrivateSchema extends z.ZodTypeAny,
  HiddenSchema extends z.ZodTypeAny,
  PhasesSchema extends z.ZodTypeAny,
>({
  phaseNameSchema,
  publicSchema,
  privateSchema,
  hiddenSchema,
  phasesSchema,
}: {
  phaseNameSchema: PhaseNameSchema;
  publicSchema: PublicSchema;
  privateSchema: PrivateSchema;
  hiddenSchema: HiddenSchema;
  phasesSchema: PhasesSchema;
}) {
  return createManifestGameStateSchema({
    tableSchema,
    playerIdSchema: ids.playerId,
    setupProfileIdSchema: ids.setupProfileId,
    phaseNameSchema,
    publicSchema,
    privateSchema,
    hiddenSchema,
    phasesSchema,
  });
}

export const manifestContract = {
  literals,
  ids,
  defaults,
  setupOptionsById,
  setupChoiceIdsByOptionId,
  setupProfilesById,
  tableSchema,
  runtimeSchema,
  createGameStateSchema,
} as const satisfies ReducerManifestContract<
  TableState,
  string,
  PlayerId,
  DeckId,
  HandId,
  CardId
>;

${renderBoardLiteralHelpers(analysis)}

export default manifestContract;
`;
}

export function generateManifestContractSource(
  manifest: GameTopologyManifest,
): string {
  return renderManifestContractSource(manifest);
}
