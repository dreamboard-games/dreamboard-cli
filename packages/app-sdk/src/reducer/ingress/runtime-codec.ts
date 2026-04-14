/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { z } from "zod";
import { safeParseOrThrow } from "../parse-utils";
import type {
  BaseGameStateOfContract,
  BaseGameSessionOfContract,
  CardIdOfState,
  DeckIdOfState,
  GameStateOf,
  HandIdOfState,
  HiddenSchemaOfContract,
  ManifestContract,
  ManifestContractOf,
  ManifestOf,
  PhaseDefinition,
  PhaseMapOf,
  PhaseNameOfContract,
  PlayerIdOfState,
  PrivateSchemaOfContract,
  PublicSchemaOfContract,
  ReducerGameContractLike,
  ReducerGameDefinition,
  ReducerSessionForConfig,
  ReducerStateForConfig,
  RuntimeBoardBaseState,
  RuntimeBoardCollections,
  RuntimeBoardCompatibilityState,
  RuntimeBoardState,
  RuntimeCardData,
  RuntimeCardVisibility,
  RuntimeComponentLocation,
  RuntimeComponentLocationMap,
  RuntimeDieData,
  RuntimeGenericBoardState,
  RuntimeHandVisibilityMode,
  RuntimeHexBoardState,
  RuntimeHexEdgeState,
  RuntimeHexOrientation,
  RuntimeHexSpaceState,
  RuntimeHexVertexState,
  RuntimePayload,
  RuntimePieceData,
  RuntimeZoneMap,
  RuntimePromptInstance,
  RuntimeRecord,
  RuntimeResourceMap,
  RuntimeRngState,
  RuntimeSquareBoardState,
  RuntimeSquareSpaceState,
  RuntimeSetupSelection,
  RuntimeState,
  RuntimeTableRecord,
  RuntimeWindowInstance,
  ScheduledSystemInput,
  SchemaLike,
  TableOfManifest,
  ViewMapOf,
} from "../model";

export type RawRuntimeCardData = Partial<RuntimeCardData> & {
  componentType?: string;
  properties?: RuntimeRecord;
};
export type RawRuntimePieceData = Partial<RuntimePieceData> & {
  componentType?: string;
  properties?: RuntimeRecord;
};
export type RawRuntimeDieData = Partial<RuntimeDieData> & {
  componentType?: string;
  properties?: RuntimeRecord;
};
export type RawRuntimeHexSpaceState = Partial<RuntimeHexSpaceState> & {
  fields?: RuntimeRecord;
};
export type RawRuntimeHexEdgeState = Partial<RuntimeHexEdgeState> & {
  fields?: RuntimeRecord;
};
export type RawRuntimeHexVertexState = Partial<RuntimeHexVertexState> & {
  spaceIds?: readonly string[] | [string, string, string];
  fields?: RuntimeRecord;
};
export type RawRuntimeSquareSpaceState = Partial<RuntimeSquareSpaceState> & {
  fields?: RuntimeRecord;
};
export type RawRuntimeSquareEdgeState = Partial<RuntimeHexEdgeState> & {
  fields?: RuntimeRecord;
};
export type RawRuntimeSquareVertexState = Partial<RuntimeHexVertexState> & {
  fields?: RuntimeRecord;
};
export type RawRuntimeBoardState = Partial<RuntimeBoardBaseState> & {
  layout?: string;
  fields?: RuntimeRecord;
  spaces?: Record<string, unknown>;
  relations?: unknown[];
  containers?: Record<string, unknown>;
  orientation?: RuntimeHexOrientation | string | null;
  edges?:
    | Record<string, RawRuntimeHexEdgeState | RawRuntimeSquareEdgeState>
    | Array<RawRuntimeHexEdgeState | RawRuntimeSquareEdgeState>;
  vertices?:
    | Record<string, RawRuntimeHexVertexState | RawRuntimeSquareVertexState>
    | Array<RawRuntimeHexVertexState | RawRuntimeSquareVertexState>;
};

export type RawRuntimeLocation = Partial<
  Extract<
    RuntimeComponentLocation,
    | { type: "InDeck" | "InHand" | "InZone" }
    | {
        type: "OnSpace" | "InContainer" | "OnEdge" | "OnVertex" | "InSlot";
      }
  >
> & {
  type?: RuntimeComponentLocation["type"];
};

type RawRuntimeTopologyPayload = Partial<{
  pieces: Record<string, RawRuntimePieceData>;
  dice: Record<string, RawRuntimeDieData>;
  boards: Partial<RuntimeBoardCollections> & {
    byId?: Record<string, RawRuntimeBoardState>;
  };
}>;

export type RawRuntimeTable = Partial<{
  playerOrder: readonly string[] | Set<string>;
  zones: RuntimeZoneMap | Record<string, unknown>;
  decks: Record<string, string[]>;
  hands: Record<string, Record<string, string[]>>;
  publicHands: readonly string[] | Set<string>;
  handVisibility: Record<string, RuntimeHandVisibilityMode>;
  cards: Record<string, RawRuntimeCardData>;
  pieces: Record<string, RawRuntimePieceData>;
  componentLocations: Record<
    string,
    RawRuntimeLocation | RuntimeComponentLocation
  >;
  ownerOfCard: Record<string, string | null>;
  visibility: Record<string, Partial<RuntimeCardVisibility>>;
  resources: RuntimeResourceMap;
  boards: Partial<RuntimeBoardCollections> & {
    byId?: Record<string, RawRuntimeBoardState>;
  };
  dice: Record<string, RawRuntimeDieData>;
  kvStore: Record<string, unknown>;
}>;

export type RawReducerFlowState = {
  currentPhase: string;
  turn?: number;
  round?: number;
  activePlayers?: string[];
};

export type RawScheduledSystemInput = ScheduledSystemInput;

export type RawReducerRuntimeState = {
  prompts?: RuntimePromptInstance<string>[];
  windows?: RuntimeWindowInstance<string>[];
  effectQueue?: RuntimeState<
    string,
    string,
    string,
    string,
    string
  >["effectQueue"];
  rng?: Partial<RuntimeRngState>;
  setup?: RuntimeSetupSelection | null;
  lastTransition?: { from: string; to: string };
  pendingSystemInputs?: RawScheduledSystemInput[];
  nextInstanceId?: number;
};

type RawReducerSessionState = {
  domain: {
    table: RawRuntimeTable | RuntimeTableRecord;
    publicState?: object;
    privateState?: Record<string, object>;
    hiddenState?: object;
    flow: RawReducerFlowState;
    phase?: object;
    phases?: Partial<Record<string, object>>;
  };
  runtime?: RawReducerRuntimeState;
};

type ParsedRuntimeInput<PlayerId extends string> =
  | {
      kind: "action";
      playerId: PlayerId;
      actionType: string;
      params: RuntimePayload;
    }
  | {
      kind: "promptResponse";
      playerId: PlayerId;
      promptId: string;
      response: RuntimePayload;
    }
  | {
      kind: "windowAction";
      playerId: PlayerId;
      windowId: string;
      actionType: string;
      params: RuntimePayload;
    }
  | {
      kind: "system";
      event: string;
      payload: RuntimePayload;
    };

type RawRuntimeInput =
  | {
      kind: "action";
      playerId: string;
      actionType: string;
      params?: RuntimePayload;
    }
  | {
      kind: "promptResponse";
      playerId: string;
      promptId: string;
      response?: RuntimePayload;
    }
  | {
      kind: "windowAction";
      playerId: string;
      windowId: string;
      actionType: string;
      params?: RuntimePayload;
    }
  | {
      kind: "system";
      event: string;
      payload?: RuntimePayload;
    };

export type IngressRuntimeCodec<
  Table extends RuntimeTableRecord,
  _Manifest extends ManifestContract<Table>,
  PublicSchema extends SchemaLike<object>,
  PrivateSchema extends SchemaLike<object>,
  HiddenSchema extends SchemaLike<object>,
  PhaseName extends string,
> = {
  defaultRuntimeState: (
    seed?: number | null,
    setup?: RuntimeSetupSelection<_Manifest> | null,
  ) => ReducerSessionForConfig<
    Table,
    PublicSchema,
    PrivateSchema,
    HiddenSchema,
    PhaseName,
    RuntimeSetupSelection<_Manifest>
  >["runtime"];
  parseInitialTable: (
    rawTable:
      | RawRuntimeTable
      | ReducerStateForConfig<
          Table,
          PublicSchema,
          PrivateSchema,
          HiddenSchema,
          PhaseName
        >["table"],
    playerIds?: readonly string[],
  ) => {
    rawTableTemplate: RawRuntimeTable | undefined;
    playerIds: PlayerIdOfState<
      ReducerStateForConfig<
        Table,
        PublicSchema,
        PrivateSchema,
        HiddenSchema,
        PhaseName
      >
    >[];
    table: ReducerStateForConfig<
      Table,
      PublicSchema,
      PrivateSchema,
      HiddenSchema,
      PhaseName
    >["table"];
  };
  parseState: (
    rawState: RawReducerSessionState,
  ) => ReducerSessionForConfig<
    Table,
    PublicSchema,
    PrivateSchema,
    HiddenSchema,
    PhaseName
  >;
  serializeState: (
    state: ReducerSessionForConfig<
      Table,
      PublicSchema,
      PrivateSchema,
      HiddenSchema,
      PhaseName
    >,
    rawTableTemplate: RawRuntimeTable | undefined,
  ) => RawReducerSessionState;
  parsePlayerId: (
    rawPlayerId: string,
  ) => PlayerIdOfState<
    ReducerStateForConfig<
      Table,
      PublicSchema,
      PrivateSchema,
      HiddenSchema,
      PhaseName
    >
  >;
  parseInput: (
    rawInput: RawRuntimeInput,
  ) => ParsedRuntimeInput<
    PlayerIdOfState<
      ReducerStateForConfig<
        Table,
        PublicSchema,
        PrivateSchema,
        HiddenSchema,
        PhaseName
      >
    >
  >;
};

const runtimePayloadSchema: z.ZodType<RuntimePayload> = z.lazy(() =>
  z.union([
    z.boolean(),
    z.number(),
    z.string(),
    z.null(),
    z.array(runtimePayloadSchema),
    z.record(z.string(), z.union([runtimePayloadSchema, z.undefined()])),
  ]),
);

function asJsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function toStringArray(
  value: readonly string[] | Set<string> | undefined,
): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  if (value instanceof Set) {
    return Array.from(value).filter(
      (entry): entry is string => typeof entry === "string",
    );
  }
  return [];
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === "string");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

function asRuntimeRecord(value: unknown): RuntimeRecord {
  return isRecord(value) ? (value as RuntimeRecord) : {};
}

function readTopologyPayload(
  table: RawRuntimeTable,
): RawRuntimeTopologyPayload {
  const kvStore = isRecord(table.kvStore) ? table.kvStore : {};
  const payload = kvStore.__reducerTopology;
  return isRecord(payload) ? (payload as RawRuntimeTopologyPayload) : {};
}

function buildBoardZoneLookups(boards: RuntimeBoardCollections): {
  spacesByZoneId: Map<string, { boardId: string; spaceId: string }>;
  containersByZoneId: Map<string, { boardId: string; containerId: string }>;
  edgesByZoneId: Map<string, { boardId: string; edgeId: string }>;
  verticesByZoneId: Map<string, { boardId: string; vertexId: string }>;
} {
  const spacesByZoneId = new Map<
    string,
    { boardId: string; spaceId: string }
  >();
  const containersByZoneId = new Map<
    string,
    { boardId: string; containerId: string }
  >();
  const edgesByZoneId = new Map<string, { boardId: string; edgeId: string }>();
  const verticesByZoneId = new Map<
    string,
    { boardId: string; vertexId: string }
  >();

  for (const [boardId, board] of Object.entries(boards.byId)) {
    for (const [spaceId, space] of Object.entries(board.spaces)) {
      if (typeof space.zoneId === "string" && space.zoneId.length > 0) {
        spacesByZoneId.set(space.zoneId, { boardId, spaceId });
      }
    }
    for (const [containerId, container] of Object.entries(board.containers)) {
      if (typeof container.zoneId === "string" && container.zoneId.length > 0) {
        containersByZoneId.set(container.zoneId, { boardId, containerId });
      }
    }
    if (board.layout !== "generic") {
      for (const edge of board.edges) {
        edgesByZoneId.set(`${boardId}::edge::${edge.id}`, {
          boardId,
          edgeId: edge.id,
        });
      }
      for (const vertex of board.vertices) {
        verticesByZoneId.set(`${boardId}::vertex::${vertex.id}`, {
          boardId,
          vertexId: vertex.id,
        });
      }
    }
  }

  return {
    spacesByZoneId,
    containersByZoneId,
    edgesByZoneId,
    verticesByZoneId,
  };
}

function normalizeLocation(
  location: RawRuntimeLocation | RuntimeComponentLocation | undefined,
  boardZoneLookups?: ReturnType<typeof buildBoardZoneLookups>,
): RuntimeComponentLocation {
  if (!location) {
    return { type: "Detached" };
  }
  if (location.type === "InDeck") {
    return {
      type: "InDeck",
      deckId: location.deckId ?? "",
      playedBy: location.playedBy ?? null,
      position: location.position ?? null,
    };
  }
  if (location.type === "InHand") {
    return {
      type: "InHand",
      handId: location.handId ?? "",
      playerId: location.playerId ?? "",
      position: location.position ?? null,
    };
  }
  if (location.type === "InZone") {
    const zoneId = location.zoneId ?? "";
    const boardSpace = boardZoneLookups?.spacesByZoneId.get(zoneId);
    if (boardSpace) {
      return {
        type: "OnSpace",
        boardId: boardSpace.boardId,
        spaceId: boardSpace.spaceId,
        position: location.position ?? null,
      };
    }
    const boardContainer = boardZoneLookups?.containersByZoneId.get(zoneId);
    if (boardContainer) {
      return {
        type: "InContainer",
        boardId: boardContainer.boardId,
        containerId: boardContainer.containerId,
        position: location.position ?? null,
      };
    }
    const edge = boardZoneLookups?.edgesByZoneId.get(zoneId);
    if (edge) {
      return {
        type: "OnEdge",
        boardId: edge.boardId,
        edgeId: edge.edgeId,
        position: location.position ?? null,
      };
    }
    const vertex = boardZoneLookups?.verticesByZoneId.get(zoneId);
    if (vertex) {
      return {
        type: "OnVertex",
        boardId: vertex.boardId,
        vertexId: vertex.vertexId,
        position: location.position ?? null,
      };
    }
    return {
      type: "InZone",
      zoneId,
      playedBy: location.playedBy ?? null,
      position: location.position ?? null,
    };
  }
  if (location.type === "OnSpace") {
    return {
      type: "OnSpace",
      boardId: location.boardId ?? "",
      spaceId: location.spaceId ?? "",
      position: location.position ?? null,
    };
  }
  if (location.type === "InContainer") {
    return {
      type: "InContainer",
      boardId: location.boardId ?? "",
      containerId: location.containerId ?? "",
      position: location.position ?? null,
    };
  }
  if (location.type === "OnEdge") {
    return {
      type: "OnEdge",
      boardId: location.boardId ?? "",
      edgeId: location.edgeId ?? "",
      position: location.position ?? null,
    };
  }
  if (location.type === "OnVertex") {
    return {
      type: "OnVertex",
      boardId: location.boardId ?? "",
      vertexId: location.vertexId ?? "",
      position: location.position ?? null,
    };
  }
  if (location.type === "InSlot") {
    return {
      type: "InSlot",
      host: {
        kind:
          location.host?.kind === "die" || location.host?.kind === "piece"
            ? location.host.kind
            : "piece",
        id: location.host?.id ?? "",
      },
      slotId: location.slotId ?? "",
      position: location.position ?? null,
    };
  }
  return { type: "Detached" };
}

function normalizePieceMap(
  candidate: RawRuntimeTable,
  topologyPayload: RawRuntimeTopologyPayload,
): Record<string, RuntimePieceData> {
  const rawPieces = isRecord(candidate.pieces)
    ? candidate.pieces
    : isRecord(topologyPayload.pieces)
      ? topologyPayload.pieces
      : {};

  return Object.fromEntries(
    Object.entries(rawPieces).map(([pieceId, rawPiece]) => {
      const piece = (rawPiece ?? {}) as RawRuntimePieceData;
      return [
        pieceId,
        {
          componentType: piece.componentType,
          id: piece.id ?? pieceId,
          pieceTypeId: piece.pieceTypeId ?? pieceId,
          pieceName: piece.pieceName ?? null,
          ownerId: piece.ownerId ?? null,
          properties: asRuntimeRecord(piece.properties),
        },
      ];
    }),
  );
}

function normalizeDiceMap(
  candidate: RawRuntimeTable,
  topologyPayload: RawRuntimeTopologyPayload,
): Record<string, RuntimeDieData> {
  const rawDice = isRecord(topologyPayload.dice)
    ? topologyPayload.dice
    : isRecord(candidate.dice)
      ? candidate.dice
      : {};

  return Object.fromEntries(
    Object.entries(rawDice).map(([dieId, rawDie]) => {
      const die = (rawDie ?? {}) as RawRuntimeDieData;
      return [
        dieId,
        {
          componentType: die.componentType,
          id: die.id ?? dieId,
          dieTypeId: die.dieTypeId ?? dieId,
          dieName: die.dieName ?? null,
          ownerId: die.ownerId ?? null,
          sides:
            typeof die.sides === "number" && Number.isFinite(die.sides)
              ? die.sides
              : 6,
          value: typeof die.value === "number" ? die.value : null,
          properties: asRuntimeRecord(die.properties),
        },
      ];
    }),
  );
}

function dedupeSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(values)).sort((left, right) =>
    left.localeCompare(right),
  );
}

function normalizeBoardBaseState(
  boardId: string,
  board: RawRuntimeBoardState,
): RuntimeBoardBaseState {
  return {
    id: board.id ?? boardId,
    baseId: board.baseId ?? boardId,
    layout:
      board.layout === "hex"
        ? "hex"
        : board.layout === "square"
          ? "square"
          : "generic",
    typeId: typeof board.typeId === "string" ? board.typeId : null,
    scope:
      board.scope === "perPlayer" || board.scope === "shared"
        ? board.scope
        : "shared",
    playerId: board.playerId ?? null,
    templateId: board.templateId ?? null,
    fields: asRuntimeRecord(board.fields),
  };
}

function normalizeBoardCompatibilityState(
  board: RawRuntimeBoardState,
): RuntimeBoardCompatibilityState {
  const rawSpaces = isRecord(board.spaces) ? board.spaces : {};
  const rawContainers = isRecord(board.containers) ? board.containers : {};
  const rawRelations = Array.isArray(board.relations) ? board.relations : [];

  return {
    spaces: Object.fromEntries(
      Object.entries(rawSpaces).map(([spaceId, rawSpace]) => {
        const space = isRecord(rawSpace) ? rawSpace : {};
        return [
          spaceId,
          {
            id: typeof space.id === "string" ? space.id : spaceId,
            name: typeof space.name === "string" ? space.name : null,
            typeId: typeof space.typeId === "string" ? space.typeId : null,
            fields: asRuntimeRecord(space.fields),
            zoneId: typeof space.zoneId === "string" ? space.zoneId : null,
          },
        ];
      }),
    ),
    relations: rawRelations
      .map((rawRelation) => (isRecord(rawRelation) ? rawRelation : null))
      .filter(
        (relation): relation is Record<string, unknown> => relation != null,
      )
      .map((relation) => ({
        id: typeof relation.id === "string" ? relation.id : null,
        typeId: typeof relation.typeId === "string" ? relation.typeId : "",
        fromSpaceId:
          typeof relation.fromSpaceId === "string" ? relation.fromSpaceId : "",
        toSpaceId:
          typeof relation.toSpaceId === "string" ? relation.toSpaceId : "",
        directed: relation.directed === true,
        fields: asRuntimeRecord(relation.fields),
      })),
    containers: Object.fromEntries(
      Object.entries(rawContainers).map(([containerId, rawContainer]) => {
        const container = isRecord(rawContainer) ? rawContainer : {};
        const host = isRecord(container.host) ? container.host : {};
        return [
          containerId,
          {
            id: typeof container.id === "string" ? container.id : containerId,
            name:
              typeof container.name === "string" ? container.name : containerId,
            host:
              host.type === "space" && typeof host.spaceId === "string"
                ? { type: "space" as const, spaceId: host.spaceId }
                : { type: "board" as const },
            allowedCardSetIds: Array.isArray(container.allowedCardSetIds)
              ? toStringList(container.allowedCardSetIds)
              : undefined,
            zoneId:
              typeof container.zoneId === "string"
                ? container.zoneId
                : containerId,
            fields: asRuntimeRecord(container.fields),
          },
        ];
      }),
    ),
  };
}

function normalizeHexSpaceMap(
  rawSpaces: RawRuntimeBoardState["spaces"],
): Record<string, RuntimeHexSpaceState> {
  const entries: [string, unknown][] = isRecord(rawSpaces)
    ? Object.entries(rawSpaces)
    : Array.isArray(rawSpaces)
      ? (rawSpaces as any[]).map((rawSpace, index) => [
          typeof rawSpace?.id === "string" ? rawSpace.id : `space-${index + 1}`,
          rawSpace,
        ])
      : [];

  return Object.fromEntries(
    entries.map(([spaceId, rawSpace]: [string, unknown]) => {
      const space = isRecord(rawSpace) ? rawSpace : {};
      return [
        spaceId,
        {
          id: typeof space.id === "string" ? space.id : spaceId,
          name: typeof space.name === "string" ? space.name : null,
          q:
            typeof space.q === "number" && Number.isFinite(space.q)
              ? space.q
              : 0,
          r:
            typeof space.r === "number" && Number.isFinite(space.r)
              ? space.r
              : 0,
          typeId: typeof space.typeId === "string" ? space.typeId : null,
          fields: asRuntimeRecord(space.fields),
          zoneId: typeof space.zoneId === "string" ? space.zoneId : null,
        },
      ];
    }),
  );
}

function normalizeSquareSpaceMap(
  rawSpaces: RawRuntimeBoardState["spaces"],
): Record<string, RuntimeSquareSpaceState> {
  const entries: [string, unknown][] = isRecord(rawSpaces)
    ? Object.entries(rawSpaces)
    : Array.isArray(rawSpaces)
      ? (rawSpaces as any[]).map((rawSpace, index) => [
          typeof rawSpace?.id === "string" ? rawSpace.id : `space-${index + 1}`,
          rawSpace,
        ])
      : [];

  return Object.fromEntries(
    entries.map(([spaceId, rawSpace]: [string, unknown]) => {
      const space = isRecord(rawSpace) ? rawSpace : {};
      return [
        spaceId,
        {
          id: typeof space.id === "string" ? space.id : spaceId,
          name: typeof space.name === "string" ? space.name : null,
          row:
            typeof space.row === "number" && Number.isFinite(space.row)
              ? space.row
              : 0,
          col:
            typeof space.col === "number" && Number.isFinite(space.col)
              ? space.col
              : 0,
          typeId: typeof space.typeId === "string" ? space.typeId : null,
          fields: asRuntimeRecord(space.fields),
          zoneId: typeof space.zoneId === "string" ? space.zoneId : null,
        },
      ];
    }),
  );
}

function parseTiledEdgeState(
  rawKey: string,
  rawEdge: unknown,
): RuntimeHexEdgeState | null {
  const edge = isRecord(rawEdge) ? rawEdge : {};
  const edgeId =
    typeof edge.id === "string"
      ? edge.id
      : /^\d+$/.test(rawKey)
        ? null
        : rawKey;
  if (!edgeId) {
    return null;
  }
  const rawSpaceIds = Array.isArray(edge.spaceIds)
    ? edge.spaceIds.filter(
        (candidate): candidate is string => typeof candidate === "string",
      )
    : edgeId.split("$$").filter(Boolean);
  const spaceIds =
    rawSpaceIds.length === 1
      ? rawSpaceIds
      : rawSpaceIds.length === 2
        ? [...rawSpaceIds].sort((a, b) => a.localeCompare(b))
        : [];
  if (spaceIds.length === 0 || spaceIds.length > 2) {
    return null;
  }
  return {
    id: edgeId,
    spaceIds,
    typeId: typeof edge.typeId === "string" ? edge.typeId : null,
    label: typeof edge.label === "string" ? edge.label : null,
    ownerId: typeof edge.ownerId === "string" ? edge.ownerId : null,
    fields: asRuntimeRecord(edge.fields),
  };
}

function parseTiledVertexState(
  rawKey: string,
  rawVertex: unknown,
  maxSpaces: number,
): RuntimeHexVertexState | null {
  const vertex = isRecord(rawVertex) ? rawVertex : {};
  const vertexId =
    typeof vertex.id === "string"
      ? vertex.id
      : /^\d+$/.test(rawKey)
        ? null
        : rawKey;
  if (!vertexId) {
    return null;
  }
  const rawSpaceIds = Array.isArray(vertex.spaceIds)
    ? vertex.spaceIds.filter(
        (candidate): candidate is string => typeof candidate === "string",
      )
    : vertexId.split("$$");
  if (rawSpaceIds.length < 1 || rawSpaceIds.length > maxSpaces) {
    return null;
  }
  const spaceIds = dedupeSorted(rawSpaceIds);
  return {
    id: vertexId,
    spaceIds,
    typeId: typeof vertex.typeId === "string" ? vertex.typeId : null,
    label: typeof vertex.label === "string" ? vertex.label : null,
    ownerId: typeof vertex.ownerId === "string" ? vertex.ownerId : null,
    fields: asRuntimeRecord(vertex.fields),
  };
}

function normalizeHexBoardState(
  boardId: string,
  rawBoard: RawRuntimeBoardState | undefined,
): RuntimeHexBoardState {
  const board = rawBoard ?? {};
  if (!isRecord(board.spaces)) {
    throw new Error(
      `Board '${boardId}' with layout 'hex' requires explicit spaces in the runtime table.`,
    );
  }
  if (!Array.isArray(board.relations)) {
    throw new Error(
      `Board '${boardId}' with layout 'hex' requires explicit relations in the runtime table.`,
    );
  }
  if (!Array.isArray(board.edges) && !isRecord(board.edges)) {
    throw new Error(
      `Board '${boardId}' with layout 'hex' requires explicit edges in the runtime table.`,
    );
  }
  if (!Array.isArray(board.vertices) && !isRecord(board.vertices)) {
    throw new Error(
      `Board '${boardId}' with layout 'hex' requires explicit vertices in the runtime table.`,
    );
  }
  const base = normalizeBoardBaseState(boardId, board);
  const spaces = normalizeHexSpaceMap(board.spaces);
  const compatibility = normalizeBoardCompatibilityState({
    ...board,
    spaces: undefined,
  });
  const rawEdges = Array.isArray(board.edges)
    ? board.edges.map((edge, index) => [String(index), edge] as const)
    : Object.entries(board.edges);
  const edgeMap = new Map<string, RuntimeHexEdgeState>();
  for (const [edgeKey, rawEdge] of rawEdges) {
    const parsedEdge = parseTiledEdgeState(edgeKey, rawEdge);
    if (parsedEdge) {
      edgeMap.set(parsedEdge.id, parsedEdge);
    }
  }
  const edges = Array.from(edgeMap.values()).sort((left, right) =>
    left.id.localeCompare(right.id),
  );

  const rawVertices = Array.isArray(board.vertices)
    ? board.vertices.map((vertex, index) => [String(index), vertex] as const)
    : Object.entries(board.vertices);
  const vertexMap = new Map<string, RuntimeHexVertexState>();
  for (const [vertexKey, rawVertex] of rawVertices) {
    const parsedVertex = parseTiledVertexState(vertexKey, rawVertex, 3);
    if (parsedVertex) {
      vertexMap.set(parsedVertex.id, parsedVertex);
    }
  }
  const vertices = Array.from(vertexMap.values()).sort((left, right) =>
    left.id.localeCompare(right.id),
  );

  return {
    ...base,
    layout: "hex",
    orientation: board.orientation === "flat-top" ? "flat-top" : "pointy-top",
    spaces,
    relations: compatibility.relations,
    containers: compatibility.containers,
    edges,
    vertices,
  };
}

function normalizeSquareBoardState(
  boardId: string,
  rawBoard: RawRuntimeBoardState | undefined,
): RuntimeSquareBoardState {
  const board = rawBoard ?? {};
  if (!isRecord(board.spaces)) {
    throw new Error(
      `Board '${boardId}' with layout 'square' requires explicit spaces in the runtime table.`,
    );
  }
  if (!Array.isArray(board.relations)) {
    throw new Error(
      `Board '${boardId}' with layout 'square' requires explicit relations in the runtime table.`,
    );
  }
  if (!Array.isArray(board.edges) && !isRecord(board.edges)) {
    throw new Error(
      `Board '${boardId}' with layout 'square' requires explicit edges in the runtime table.`,
    );
  }
  if (!Array.isArray(board.vertices) && !isRecord(board.vertices)) {
    throw new Error(
      `Board '${boardId}' with layout 'square' requires explicit vertices in the runtime table.`,
    );
  }
  const base = normalizeBoardBaseState(boardId, board);
  const spaces = normalizeSquareSpaceMap(board.spaces);
  const compatibility = normalizeBoardCompatibilityState({
    ...board,
    spaces: undefined,
  });
  const rawEdges = Array.isArray(board.edges)
    ? board.edges.map((edge, index) => [String(index), edge] as const)
    : Object.entries(board.edges);
  const edgeMap = new Map<string, RuntimeHexEdgeState>();
  for (const [edgeKey, rawEdge] of rawEdges) {
    const parsedEdge = parseTiledEdgeState(edgeKey, rawEdge);
    if (parsedEdge) {
      edgeMap.set(parsedEdge.id, parsedEdge);
    }
  }
  const edges = Array.from(edgeMap.values()).sort((left, right) =>
    left.id.localeCompare(right.id),
  );

  const rawVertices = Array.isArray(board.vertices)
    ? board.vertices.map((vertex, index) => [String(index), vertex] as const)
    : Object.entries(board.vertices);
  const vertexMap = new Map<string, RuntimeHexVertexState>();
  for (const [vertexKey, rawVertex] of rawVertices) {
    const parsedVertex = parseTiledVertexState(vertexKey, rawVertex, 4);
    if (parsedVertex) {
      vertexMap.set(parsedVertex.id, parsedVertex);
    }
  }
  const vertices = Array.from(vertexMap.values()).sort((left, right) =>
    left.id.localeCompare(right.id),
  );

  return {
    ...base,
    layout: "square",
    spaces,
    relations: compatibility.relations,
    containers: compatibility.containers,
    edges,
    vertices,
  };
}

function normalizeBoardState(
  boardId: string,
  rawBoard: RawRuntimeBoardState | undefined,
): RuntimeBoardState {
  const board = rawBoard ?? {};
  if (board.layout === "hex") {
    return normalizeHexBoardState(boardId, board);
  }
  if (board.layout === "square") {
    return normalizeSquareBoardState(boardId, board);
  }

  return {
    ...normalizeBoardBaseState(boardId, board),
    ...normalizeBoardCompatibilityState(board),
    layout: "generic" as const,
  } satisfies RuntimeGenericBoardState;
}

function normalizeBoards(
  candidate: RawRuntimeTable,
  topologyPayload: RawRuntimeTopologyPayload,
): RuntimeBoardCollections {
  const rawBoards = isRecord(candidate.boards) ? candidate.boards : {};
  const rawById = isRecord(rawBoards.byId)
    ? rawBoards.byId
    : isRecord(topologyPayload.boards?.byId)
      ? topologyPayload.boards?.byId
      : {};
  const byId = Object.fromEntries(
    Object.entries(rawById).map(([boardId, rawBoard]) => [
      boardId,
      normalizeBoardState(boardId, rawBoard as RawRuntimeBoardState),
    ]),
  ) as Record<string, RuntimeBoardState>;

  const rawHexBoards =
    (isRecord(rawBoards.hex) ? rawBoards.hex : undefined) ??
    (isRecord(topologyPayload.boards?.hex)
      ? topologyPayload.boards?.hex
      : undefined) ??
    {};
  const hex = {
    ...Object.fromEntries(
      Object.entries(byId)
        .filter(([, board]) => board.layout === "hex")
        .map(([boardId, board]) => [boardId, board as RuntimeHexBoardState]),
    ),
    ...Object.fromEntries(
      Object.entries(isRecord(rawHexBoards) ? rawHexBoards : {}).map(
        ([boardId, rawBoard]) => [
          boardId,
          normalizeHexBoardState(boardId, rawBoard as RawRuntimeBoardState),
        ],
      ),
    ),
  };
  const rawSquareBoards =
    (isRecord(rawBoards.square) ? rawBoards.square : undefined) ??
    (isRecord(topologyPayload.boards?.square)
      ? topologyPayload.boards?.square
      : undefined) ??
    {};
  const square = {
    ...Object.fromEntries(
      Object.entries(byId)
        .filter(([, board]) => board.layout === "square")
        .map(([boardId, board]) => [boardId, board as RuntimeSquareBoardState]),
    ),
    ...Object.fromEntries(
      Object.entries(isRecord(rawSquareBoards) ? rawSquareBoards : {}).map(
        ([boardId, rawBoard]) => [
          boardId,
          normalizeSquareBoardState(boardId, rawBoard as RawRuntimeBoardState),
        ],
      ),
    ),
  };

  const pickNamedBoardMap = (
    primary: unknown,
    fallback: unknown,
  ): Record<string, RuntimeRecord> => {
    const raw = isRecord(primary)
      ? primary
      : isRecord(fallback)
        ? fallback
        : {};
    return Object.fromEntries(
      Object.entries(raw).map(([boardId, value]) => [
        boardId,
        asRuntimeRecord(value),
      ]),
    );
  };

  return {
    byId: {
      ...byId,
      ...hex,
      ...square,
    },
    hex,
    square,
    network: pickNamedBoardMap(
      rawBoards.network,
      topologyPayload.boards?.network,
    ),
    track: pickNamedBoardMap(rawBoards.track, topologyPayload.boards?.track),
  };
}

function normalizeTableShape<
  Table extends RuntimeTableRecord | RawRuntimeTable,
>(
  table: Table,
  manifestShape: {
    playerIds?: readonly string[];
    deckIds?: readonly string[];
    handIds?: readonly string[];
    cardIds?: readonly string[];
    defaultZones?: RuntimeZoneMap;
    defaultHands?: Record<string, Record<string, string[]>>;
    defaultHandVisibility?: Record<string, RuntimeHandVisibilityMode>;
    defaultOwnerOfCard?: Record<string, string | null>;
    defaultVisibility?: Record<string, RuntimeCardVisibility>;
    defaultResources?: Record<string, RuntimeRecord>;
  } = {},
): RuntimeTableRecord {
  const candidate = table as RawRuntimeTable;
  const hasManifestShapeHints =
    (manifestShape.playerIds?.length ?? 0) > 0 ||
    (manifestShape.deckIds?.length ?? 0) > 0 ||
    (manifestShape.handIds?.length ?? 0) > 0 ||
    (manifestShape.cardIds?.length ?? 0) > 0 ||
    manifestShape.defaultZones != null ||
    manifestShape.defaultHands != null ||
    manifestShape.defaultHandVisibility != null ||
    manifestShape.defaultOwnerOfCard != null ||
    manifestShape.defaultVisibility != null ||
    manifestShape.defaultResources != null;
  if (
    !hasManifestShapeHints &&
    Array.isArray(candidate.playerOrder) &&
    isRecord(candidate.zones) &&
    isRecord(candidate.zones.shared) &&
    isRecord(candidate.zones.perPlayer) &&
    candidate.decks &&
    !Array.isArray(candidate.decks) &&
    candidate.hands &&
    !Array.isArray(candidate.hands) &&
    candidate.handVisibility &&
    candidate.pieces &&
    isRecord(candidate.boards) &&
    isRecord(candidate.boards.byId) &&
    isRecord(candidate.boards.hex) &&
    isRecord(candidate.boards.network) &&
    isRecord(candidate.boards.square) &&
    isRecord(candidate.boards.track)
  ) {
    return candidate as RuntimeTableRecord;
  }

  const topologyPayload = readTopologyPayload(candidate);
  const playerOrder = toStringArray(candidate.playerOrder);
  const resolvedPlayerIds =
    manifestShape.playerIds && manifestShape.playerIds.length > 0
      ? [...manifestShape.playerIds]
      : playerOrder;
  const deckIds =
    manifestShape.deckIds && manifestShape.deckIds.length > 0
      ? [...manifestShape.deckIds]
      : Object.keys(isRecord(candidate.decks) ? candidate.decks : {});
  const handIds =
    manifestShape.handIds && manifestShape.handIds.length > 0
      ? [...manifestShape.handIds]
      : Object.keys(isRecord(candidate.hands) ? candidate.hands : {});
  const cardIds =
    manifestShape.cardIds && manifestShape.cardIds.length > 0
      ? [...manifestShape.cardIds]
      : Object.keys(candidate.cards ?? {});
  const publicHands = new Set(toStringArray(candidate.publicHands));
  const pieces = normalizePieceMap(candidate, topologyPayload);
  const dice = normalizeDiceMap(candidate, topologyPayload);
  const boards = normalizeBoards(candidate, topologyPayload);
  const boardZoneLookups = buildBoardZoneLookups(boards);
  const rawComponentLocations = isRecord(candidate.componentLocations)
    ? (candidate.componentLocations as Record<
        string,
        RawRuntimeLocation | RuntimeComponentLocation
      >)
    : {};
  const componentIds = Array.from(
    new Set([
      ...cardIds,
      ...Object.keys(pieces),
      ...Object.keys(dice),
      ...Object.keys(rawComponentLocations),
    ]),
  );
  const componentLocations = Object.fromEntries(
    componentIds.map((componentId) => [
      componentId,
      normalizeLocation(rawComponentLocations[componentId], boardZoneLookups),
    ]),
  ) as RuntimeComponentLocationMap;
  const cards = Object.fromEntries(
    cardIds.map((cardId) => {
      const cardRecord = candidate.cards?.[cardId] ?? {};
      return [
        cardId,
        {
          componentType: cardRecord.componentType,
          id: cardRecord.id ?? cardId,
          cardSetId: cardRecord.cardSetId ?? "",
          cardType: cardRecord.cardType ?? cardId,
          cardName: cardRecord.cardName ?? undefined,
          description: cardRecord.description ?? undefined,
          properties: cardRecord.properties ?? {},
        },
      ];
    }),
  ) as Record<string, RuntimeCardData>;
  const rawResources = isRecord(candidate.resources) ? candidate.resources : {};
  const zones: RuntimeZoneMap = {
    shared: Object.fromEntries(
      deckIds.map((deckId) => [
        deckId,
        isRecord(candidate.zones) &&
        isRecord(candidate.zones.shared) &&
        Array.isArray(candidate.zones.shared[deckId])
          ? toStringList(candidate.zones.shared[deckId])
          : (manifestShape.defaultZones?.shared?.[deckId] ?? []),
      ]),
    ),
    perPlayer: Object.fromEntries(
      handIds.map((handId) => [
        handId,
        Object.fromEntries(
          resolvedPlayerIds.map((playerId) => [
            playerId,
            isRecord(candidate.zones) &&
            isRecord(candidate.zones.perPlayer) &&
            isRecord(candidate.zones.perPlayer[handId]) &&
            Array.isArray(candidate.zones.perPlayer[handId]?.[playerId])
              ? toStringList(candidate.zones.perPlayer[handId]?.[playerId])
              : (manifestShape.defaultHands?.[handId]?.[playerId] ?? []),
          ]),
        ),
      ]),
    ),
    visibility: {
      ...(manifestShape.defaultZones?.visibility ?? {}),
      ...Object.fromEntries(
        handIds.map((handId) => [
          handId,
          candidate.handVisibility?.[handId] ??
            (publicHands.has(handId)
              ? "public"
              : (manifestShape.defaultHandVisibility?.[handId] ?? "ownerOnly")),
        ]),
      ),
    },
    cardSetIdsByZoneId: {
      ...(manifestShape.defaultZones?.cardSetIdsByZoneId ?? {}),
      ...Object.fromEntries(
        Object.entries(
          isRecord(candidate.zones?.cardSetIdsByZoneId)
            ? candidate.zones.cardSetIdsByZoneId
            : {},
        ).map(([zoneId, cardSetIds]) => [zoneId, toStringList(cardSetIds)]),
      ),
    },
  };

  return {
    ...candidate,
    playerOrder: resolvedPlayerIds,
    zones,
    decks: Object.fromEntries(
      deckIds.map((deckId) => [
        deckId,
        isRecord(candidate.decks) && Array.isArray(candidate.decks[deckId])
          ? toStringList(candidate.decks[deckId])
          : (zones.shared[deckId] ?? []),
      ]),
    ),
    hands: Object.fromEntries(
      handIds.map((handId) => [
        handId,
        Object.fromEntries(
          resolvedPlayerIds.map((playerId) => [
            playerId,
            isRecord(candidate.hands) &&
            isRecord(candidate.hands[handId]) &&
            Array.isArray(candidate.hands[handId]?.[playerId])
              ? toStringList(candidate.hands[handId]?.[playerId])
              : (zones.perPlayer[handId]?.[playerId] ??
                manifestShape.defaultHands?.[handId]?.[playerId] ??
                []),
          ]),
        ),
      ]),
    ),
    handVisibility: Object.fromEntries(
      handIds.map((handId) => [
        handId,
        candidate.handVisibility?.[handId] ??
          (publicHands.has(handId)
            ? "public"
            : (manifestShape.defaultHandVisibility?.[handId] ?? "ownerOnly")),
      ]),
    ),
    cards,
    pieces,
    componentLocations,
    ownerOfCard: Object.fromEntries(
      cardIds.map((cardId) => [
        cardId,
        candidate.ownerOfCard?.[cardId] ??
          manifestShape.defaultOwnerOfCard?.[cardId] ??
          null,
      ]),
    ),
    visibility: Object.fromEntries(
      cardIds.map((cardId) => {
        const rawVisibility = candidate.visibility?.[cardId];
        const visibilityRecord = rawVisibility ?? {};
        return [
          cardId,
          {
            faceUp:
              visibilityRecord.faceUp ??
              manifestShape.defaultVisibility?.[cardId]?.faceUp ??
              true,
            visibleTo: Array.isArray(visibilityRecord.visibleTo)
              ? visibilityRecord.visibleTo
              : (manifestShape.defaultVisibility?.[cardId]?.visibleTo ??
                undefined),
          },
        ];
      }),
    ),
    resources: Object.fromEntries(
      resolvedPlayerIds.map((playerId) => [
        playerId,
        isRecord(rawResources[playerId])
          ? {
              ...(manifestShape.defaultResources?.[playerId] ?? {}),
              ...(rawResources[playerId] as RuntimeRecord),
            }
          : (manifestShape.defaultResources?.[playerId] ?? {}),
      ]),
    ),
    boards,
    dice,
  };
}

function denormalizeTableShape<Table extends RuntimeTableRecord>(
  table: Table,
  template: RawRuntimeTable | undefined,
): RawRuntimeTable | Table {
  void template;
  return table;
}

function createPhaseNameSchema<PhaseName extends string>(
  phaseNames: readonly PhaseName[],
): z.ZodType<PhaseName> {
  const allowed = new Set(phaseNames);
  return z.custom<PhaseName>(
    (value: unknown) =>
      typeof value === "string" && allowed.has(value as PhaseName),
    { message: "Invalid phase name" },
  );
}

export type UntrustedRuntimeTable = RawRuntimeTable;
export type UntrustedReducerSessionState = RawReducerSessionState;
export type UntrustedRuntimeInput = RawRuntimeInput;
export type TrustedRuntimeInput<PlayerId extends string> =
  ParsedRuntimeInput<PlayerId>;
export type DecodedReducerSession<State> = {
  state: State;
  template?: UntrustedRuntimeTable;
};
export type DecodedReducerInput<PlayerId extends string> =
  TrustedRuntimeInput<PlayerId>;

export function createIngressRuntimeCodec<
  Contract extends ReducerGameContractLike,
  Definitions extends PhaseMapOf<Contract>,
  Views extends ViewMapOf<Contract>,
>(
  definition: ReducerGameDefinition<Contract, Definitions, Views>,
): IngressRuntimeCodec<
  TableOfManifest<ManifestOf<Contract>>,
  ManifestContractOf<Contract>,
  PublicSchemaOfContract<Contract>,
  PrivateSchemaOfContract<Contract>,
  HiddenSchemaOfContract<Contract>,
  PhaseNameOfContract<Contract>
> {
  type Definition = ReducerGameDefinition<Contract, Definitions, Views>;
  type DomainState = GameStateOf<Definition>;
  type State = BaseGameSessionOfContract<Contract>;
  type Manifest = ManifestContractOf<Contract>;
  type PhaseName = PhaseNameOfContract<Contract>;
  type ReturnType = IngressRuntimeCodec<
    TableOfManifest<ManifestOf<Contract>>,
    Manifest,
    PublicSchemaOfContract<Contract>,
    PrivateSchemaOfContract<Contract>,
    HiddenSchemaOfContract<Contract>,
    PhaseName
  >;
  type PlayerId = PlayerIdOfState<DomainState>;
  type DeckId = DeckIdOfState<DomainState>;
  type HandId = HandIdOfState<DomainState>;
  type CardId = CardIdOfState<DomainState>;

  const phaseEntries = Object.entries(definition.phases) as Array<
    [
      PhaseName,
      PhaseDefinition<
        SchemaLike<object>,
        BaseGameStateOfContract<Contract>,
        Manifest
      >,
    ]
  >;
  const phaseNames = phaseEntries.map(([phaseName]) => phaseName);
  const phaseNameSchema = createPhaseNameSchema(phaseNames);
  const playerIdSchema = definition.contract.manifest.ids
    .playerId as z.ZodType<PlayerId>;
  const deckIdSchema = definition.contract.manifest.ids
    .deckId as z.ZodType<DeckId>;
  const handIdSchema = definition.contract.manifest.ids
    .handId as z.ZodType<HandId>;
  const cardIdSchema = definition.contract.manifest.ids
    .cardId as z.ZodType<CardId>;
  const manifestPlayerIds = definition.contract.manifest.literals.playerIds;
  const manifestDeckIds = definition.contract.manifest.literals.deckIds;
  const manifestHandIds = definition.contract.manifest.literals.handIds;
  const manifestCardIds = definition.contract.manifest.literals.cardIds;
  const buildManifestDefaults = (playerIds?: readonly string[]) => ({
    defaultZones: definition.contract.manifest.defaults.zones(
      playerIds,
    ) as RuntimeZoneMap,
    defaultHands: definition.contract.manifest.defaults.hands(
      playerIds,
    ) as Record<string, Record<string, string[]>>,
    defaultHandVisibility: definition.contract.manifest.defaults.handVisibility(
      playerIds,
    ) as Record<string, RuntimeHandVisibilityMode>,
    defaultOwnerOfCard: definition.contract.manifest.defaults.ownerOfCard(
      playerIds,
    ) as Record<string, string | null>,
    defaultVisibility: definition.contract.manifest.defaults.visibility(
      playerIds,
    ) as Record<string, RuntimeCardVisibility>,
    defaultResources: definition.contract.manifest.defaults.resources(
      playerIds,
    ) as Record<string, RuntimeRecord>,
  });

  const promptOptionSchema = z.object({
    id: z.string(),
    label: z.string(),
  });
  const continuationTokenSchema = z.object({
    id: z.string(),
    data: runtimePayloadSchema.default({}),
  });
  const promptInstanceSchema = z.object({
    id: z.string(),
    promptId: z.string(),
    to: playerIdSchema,
    title: z.string().optional(),
    payload: runtimePayloadSchema.optional(),
    options: z.array(promptOptionSchema).optional(),
    resume: continuationTokenSchema,
  });
  const windowClosePolicySchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("allPassInSequence") }),
    z.object({ type: z.literal("allResponded") }),
    z.object({ type: z.literal("firstValidAction") }),
    z.object({ type: z.literal("manual") }),
  ]);
  const windowInstanceSchema = z.object({
    id: z.string(),
    windowId: z.string(),
    closePolicy: windowClosePolicySchema,
    addressedTo: z.array(playerIdSchema).optional(),
    payload: runtimePayloadSchema.optional(),
    resume: continuationTokenSchema.optional(),
    respondedPlayerIds: z.array(playerIdSchema).optional(),
    passedPlayerIds: z.array(playerIdSchema).optional(),
  });
  const effectSchema = z.discriminatedUnion("type", [
    z.object({
      type: z.literal("transition"),
      to: phaseNameSchema,
    }),
    z.object({
      type: z.literal("openPrompt"),
      prompt: z.string(),
      to: playerIdSchema,
      title: z.string().optional(),
      payload: runtimePayloadSchema.optional(),
      options: z.array(promptOptionSchema).optional(),
      resume: continuationTokenSchema,
    }),
    z.object({
      type: z.literal("closePrompt"),
      promptId: z.string(),
    }),
    z.object({
      type: z.literal("openWindow"),
      window: z.string(),
      closePolicy: windowClosePolicySchema.optional(),
      addressedTo: z.array(playerIdSchema).optional(),
      payload: runtimePayloadSchema.optional(),
      resume: continuationTokenSchema.optional(),
    }),
    z.object({
      type: z.literal("closeWindow"),
      windowId: z.string(),
    }),
    z.object({
      type: z.literal("rollDie"),
      dieId: z.string(),
    }),
    z.object({
      type: z.literal("shuffleSharedZone"),
      zoneId: deckIdSchema,
    }),
    z.object({
      type: z.literal("dealCardsToPlayerZone"),
      fromZoneId: deckIdSchema,
      playerId: playerIdSchema,
      toZoneId: handIdSchema,
      count: z.number().int(),
    }),
    z.object({
      type: z.literal("sample"),
      from: z.array(cardIdSchema),
      sampleId: z.string(),
      count: z.number().int().optional(),
      resume: continuationTokenSchema,
    }),
    z.object({
      type: z.literal("randomInt"),
      min: z.number().int(),
      max: z.number().int(),
      randomIntId: z.string(),
      resume: continuationTokenSchema,
    }),
    z.object({
      type: z.literal("dispatchSystem"),
      event: z.string(),
      payload: runtimePayloadSchema.optional(),
    }),
    z.object({
      type: z.literal("scheduleTiming"),
      timing: z.string(),
      event: z.string(),
      payload: runtimePayloadSchema.optional(),
    }),
  ]);
  const flowSchema = z.object({
    currentPhase: phaseNameSchema,
    turn: z.number().int(),
    round: z.number().int(),
    activePlayers: z.array(playerIdSchema),
  });
  const runtimeStateSchema = z.object({
    prompts: z.array(promptInstanceSchema).default([]),
    windows: z.array(windowInstanceSchema).default([]),
    effectQueue: z.array(effectSchema).default([]),
    rng: z
      .object({
        seed: z.number().nullable().optional(),
        cursor: z.number().int().default(0),
        trace: z.array(z.string()).default([]),
      })
      .default({
        seed: null,
        cursor: 0,
        trace: [],
      }),
    setup: z
      .object({
        profileId: z.string(),
        optionValues: z.record(z.string(), z.string().nullable()).default({}),
      })
      .nullable()
      .default(null),
    lastTransition: z
      .object({
        from: phaseNameSchema,
        to: phaseNameSchema,
      })
      .optional(),
    pendingSystemInputs: z
      .array(
        z.object({
          timing: z.string(),
          event: z.string(),
          payload: runtimePayloadSchema.optional(),
        }),
      )
      .default([]),
    nextInstanceId: z.number().int().default(1),
  });
  const rawRuntimeInputSchema = z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("action"),
      playerId: playerIdSchema,
      actionType: z.string(),
      params: runtimePayloadSchema.default({}),
    }),
    z.object({
      kind: z.literal("promptResponse"),
      playerId: playerIdSchema,
      promptId: z.string(),
      response: runtimePayloadSchema.default({}),
    }),
    z.object({
      kind: z.literal("windowAction"),
      playerId: playerIdSchema,
      windowId: z.string(),
      actionType: z.string(),
      params: runtimePayloadSchema.default({}),
    }),
    z.object({
      kind: z.literal("system"),
      event: z.string(),
      payload: runtimePayloadSchema.default({}),
    }),
  ]);

  // The return type uses branded/mapped types derived from the contract generic.
  // TypeScript cannot verify that plain objects satisfy these deep mapped types,
  // but the runtime Zod parsing ensures correctness.
  return {
    defaultRuntimeState(
      seed: number | null = null,
      setup: RuntimeSetupSelection<Manifest> | null = null,
    ) {
      const runtimeState: State["runtime"] = {
        prompts: [],
        windows: [],
        effectQueue: [],
        rng: {
          seed,
          cursor: 0,
          trace: [],
        },
        setup,
        pendingSystemInputs: [],
        nextInstanceId: 1,
      };
      return runtimeState;
    },
    parseInitialTable(rawTable: unknown, playerIds: string[] | undefined) {
      const rawTableTemplate = asJsonClone(rawTable);
      const manifestDefaults = buildManifestDefaults(
        playerIds && playerIds.length > 0 ? playerIds : manifestPlayerIds,
      );
      const normalizedTable = normalizeTableShape(
        rawTableTemplate as RawRuntimeTable,
        {
          playerIds:
            playerIds && playerIds.length > 0 ? playerIds : manifestPlayerIds,
          deckIds: manifestDeckIds,
          handIds: manifestHandIds,
          cardIds: manifestCardIds,
          ...manifestDefaults,
        },
      );
      return {
        rawTableTemplate:
          rawTableTemplate && typeof rawTableTemplate === "object"
            ? (rawTableTemplate as RawRuntimeTable)
            : undefined,
        table: safeParseOrThrow(
          definition.contract.manifest.tableSchema,
          normalizedTable,
          "table",
        ),
        playerIds: safeParseOrThrow(
          z.array(playerIdSchema),
          normalizedTable.playerOrder,
          "table.playerOrder",
        ),
      };
    },
    parseState(rawState: RawReducerSessionState) {
      const rawPlayerIds =
        toStringArray((rawState.domain.table as RawRuntimeTable).playerOrder) ??
        manifestPlayerIds;
      const manifestDefaults = buildManifestDefaults(
        rawPlayerIds.length > 0 ? rawPlayerIds : manifestPlayerIds,
      );
      const normalizedTable = normalizeTableShape(rawState.domain.table, {
        playerIds: rawPlayerIds.length > 0 ? rawPlayerIds : manifestPlayerIds,
        deckIds: manifestDeckIds,
        handIds: manifestHandIds,
        cardIds: manifestCardIds,
        ...manifestDefaults,
      });
      const table = safeParseOrThrow(
        definition.contract.manifest.tableSchema,
        normalizedTable,
        "domain.table",
      );
      const playerIds = [...table.playerOrder] as PlayerId[];
      const privateState = Object.fromEntries(
        playerIds.map((playerId) => [
          playerId,
          safeParseOrThrow(
            definition.contract.state.private,
            rawState.domain.privateState?.[playerId] ?? {},
            `privateState:${playerId}`,
          ),
        ]),
      ) as State["domain"]["privateState"];
      const flow = safeParseOrThrow(
        flowSchema,
        {
          currentPhase: rawState.domain.flow.currentPhase,
          turn: rawState.domain.flow.turn ?? 0,
          round: rawState.domain.flow.round ?? 0,
          activePlayers: rawState.domain.flow.activePlayers ?? [],
        },
        "domain.flow",
      );
      const currentPhaseDefinition = definition.phases[flow.currentPhase];
      if (!currentPhaseDefinition) {
        throw new Error(`Unknown reducer phase '${flow.currentPhase}'.`);
      }
      const rawPhaseState =
        rawState.domain.phase ?? rawState.domain.phases?.[flow.currentPhase];
      const phase = safeParseOrThrow(
        currentPhaseDefinition.state,
        rawPhaseState ?? {},
        `phase:${flow.currentPhase}`,
      ) as State["domain"]["phase"];

      const parsedState: State = {
        domain: {
          table,
          publicState: safeParseOrThrow(
            definition.contract.state.public,
            rawState.domain.publicState ?? {},
            "domain.publicState",
          ) as State["domain"]["publicState"],
          privateState,
          hiddenState: safeParseOrThrow(
            definition.contract.state.hidden,
            rawState.domain.hiddenState ?? {},
            "domain.hiddenState",
          ) as State["domain"]["hiddenState"],
          flow,
          phase,
        },
        runtime: safeParseOrThrow(
          runtimeStateSchema,
          rawState.runtime ?? {},
          "runtime",
        ) as unknown as State["runtime"],
      };
      return parsedState;
    },
    serializeState(
      state: State,
      rawTableTemplate: RawRuntimeTable | undefined,
    ) {
      return {
        domain: {
          ...state.domain,
          table: denormalizeTableShape(state.domain.table, rawTableTemplate),
        },
        runtime: state.runtime,
      };
    },
    parsePlayerId(rawPlayerId: string) {
      return safeParseOrThrow(playerIdSchema, rawPlayerId, "playerId");
    },
    parseInput(rawInput: unknown) {
      return safeParseOrThrow(rawRuntimeInputSchema, rawInput, "input");
    },
  } as unknown as ReturnType;
}

export { safeParseOrThrow } from "../parse-utils";
export { runtimePayloadSchema };
