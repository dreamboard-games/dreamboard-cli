import { z } from "zod";

export const literals = {
  playerIds: ["player-1", "player-2"] as const,
  cardSetIds: ["standard-deck"] as const,
  cardTypes: ["CARD_A"] as const,
  cardIds: ["CARD_A"] as const,
  deckIds: ["draw-deck"] as const,
  handIds: ["main-hand"] as const,
  resourceIds: ["coins"] as const,
  dieIds: ["d6"] as const,
  boardIds: ["track-board"] as const,
  boardKinds: ["track"] as const,
  tileIds: [] as const,
  tileTypeIds: [] as const,
  edgeIds: [] as const,
  edgeTypeIds: [] as const,
  vertexIds: [] as const,
  vertexTypeIds: [] as const,
  spaceIds: ["space-a"] as const,
  spaceTypeIds: ["worker-space"] as const,
  pieceIds: [] as const,
  pieceTypeIds: [] as const,
  handVisibilityById: { "main-hand": "ownerOnly" } as const,
  boardKindById: { "track-board": "track" } as const,
  cardSetIdByCardId: { CARD_A: "standard-deck" } as const,
  cardTypeByCardId: { CARD_A: "CARD_A" } as const,
} as const;

type LiteralUnionOrFallback<
  Values extends readonly string[],
  Fallback,
> = Values[number] extends never ? Fallback : Values[number];

const createStringLiteralSchema = <Values extends readonly string[]>(
  values: Values,
): z.ZodType<LiteralUnionOrFallback<Values, string>> =>
  values.length === 0
    ? (z.string() as z.ZodType<LiteralUnionOrFallback<Values, string>>)
    : (z.enum(toNonEmptyStringTuple(values)) as z.ZodType<
        LiteralUnionOrFallback<Values, string>
      >);

const createTupleLiteralSchema = <Values extends readonly string[], Fallback>(
  values: Values,
  fallback: z.ZodType<Fallback>,
): z.ZodType<LiteralUnionOrFallback<Values, Fallback>> =>
  values.length === 0
    ? (fallback as z.ZodType<LiteralUnionOrFallback<Values, Fallback>>)
    : (z.enum(toNonEmptyStringTuple(values)) as z.ZodType<
        LiteralUnionOrFallback<Values, Fallback>
      >);

function toNonEmptyStringTuple<Values extends readonly string[]>(
  values: Values,
): [Values[number], ...Values[number][]] {
  const [first, ...rest] = Array.from(values);
  if (typeof first === "undefined") {
    throw new Error("Expected a non-empty literal tuple");
  }
  return [first as Values[number], ...(rest as Values[number][])];
}

const playerIdSchema = createStringLiteralSchema(literals.playerIds);
const cardSetIdSchema = createStringLiteralSchema(literals.cardSetIds);
const cardTypeSchema = createStringLiteralSchema(literals.cardTypes);
const cardIdSchema = createStringLiteralSchema(literals.cardIds);
const deckIdSchema = createStringLiteralSchema(literals.deckIds);
const handIdSchema = createStringLiteralSchema(literals.handIds);
const resourceIdSchema = createStringLiteralSchema(literals.resourceIds);
const dieIdSchema = createStringLiteralSchema(literals.dieIds);
const boardIdSchema = createStringLiteralSchema(literals.boardIds);
const boardKindSchema = createStringLiteralSchema(literals.boardKinds);
const tileIdSchema = createStringLiteralSchema(literals.tileIds);
const tileTypeIdSchema = createStringLiteralSchema(literals.tileTypeIds);
const edgeTypeIdSchema = createStringLiteralSchema(literals.edgeTypeIds);
const vertexTypeIdSchema = createStringLiteralSchema(literals.vertexTypeIds);
const spaceIdSchema = createStringLiteralSchema(literals.spaceIds);
const spaceTypeIdSchema = createStringLiteralSchema(literals.spaceTypeIds);
const pieceIdSchema = createStringLiteralSchema(literals.pieceIds);
const pieceTypeIdSchema = createStringLiteralSchema(literals.pieceTypeIds);
const edgeIdSchema = createTupleLiteralSchema(
  literals.edgeIds,
  z.tuple([tileIdSchema, tileIdSchema]),
);
const vertexIdSchema = createTupleLiteralSchema(
  literals.vertexIds,
  z.tuple([tileIdSchema, tileIdSchema, tileIdSchema]),
);
const handVisibilitySchema = z.enum(["ownerOnly", "public", "hidden"]);

export const ids = {
  playerId: playerIdSchema,
  cardSetId: cardSetIdSchema,
  cardType: cardTypeSchema,
  cardId: cardIdSchema,
  deckId: deckIdSchema,
  handId: handIdSchema,
  resourceId: resourceIdSchema,
  dieId: dieIdSchema,
  boardId: boardIdSchema,
  tileId: tileIdSchema,
  tileTypeId: tileTypeIdSchema,
  edgeId: edgeIdSchema,
  edgeTypeId: edgeTypeIdSchema,
  vertexId: vertexIdSchema,
  vertexTypeId: vertexTypeIdSchema,
  spaceId: spaceIdSchema,
  spaceTypeId: spaceTypeIdSchema,
  pieceId: pieceIdSchema,
  pieceTypeId: pieceTypeIdSchema,
} as const;

export type PlayerId = z.infer<typeof playerIdSchema>;
export type CardSetId = z.infer<typeof cardSetIdSchema>;
export type CardType = z.infer<typeof cardTypeSchema>;
export type CardId = z.infer<typeof cardIdSchema>;
export type DeckId = z.infer<typeof deckIdSchema>;
export type HandId = z.infer<typeof handIdSchema>;
export type ResourceId = z.infer<typeof resourceIdSchema>;
export type DieId = z.infer<typeof dieIdSchema>;
export type BoardId = z.infer<typeof boardIdSchema>;
export type BoardKind = z.infer<typeof boardKindSchema>;
export type TileId = z.infer<typeof tileIdSchema>;
export type TileTypeId = z.infer<typeof tileTypeIdSchema>;
export type EdgeId = z.infer<typeof edgeIdSchema>;
export type EdgeTypeId = z.infer<typeof edgeTypeIdSchema>;
export type VertexId = z.infer<typeof vertexIdSchema>;
export type VertexTypeId = z.infer<typeof vertexTypeIdSchema>;
export type SpaceId = z.infer<typeof spaceIdSchema>;
export type SpaceTypeId = z.infer<typeof spaceTypeIdSchema>;
export type PieceId = z.infer<typeof pieceIdSchema>;
export type PieceTypeId = z.infer<typeof pieceTypeIdSchema>;
export type HandVisibility = z.infer<typeof handVisibilitySchema>;

const cardPropertiesSchema = z.object({
  value: z.number(),
});

const cardVisibilitySchema = z.object({
  faceUp: z.boolean(),
  visibleTo: z.array(ids.playerId).optional(),
});

const cardLocationSchema = z.union([
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
]);

const cardStateSchema = z.object({
  id: ids.cardId,
  cardSetId: ids.cardSetId,
  cardType: ids.cardType,
  name: z.string().optional(),
  text: z.string().optional(),
  properties: cardPropertiesSchema,
});

const trackSpaceStateSchema = z.object({
  id: ids.spaceId,
  index: z.number().int(),
  x: z.number(),
  y: z.number(),
  name: z.string().optional(),
  typeId: ids.spaceTypeId.optional(),
  owner: ids.playerId.optional(),
  nextSpaces: z.array(ids.spaceId).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

const trackPieceStateSchema = z.object({
  id: z.string(),
  spaceId: ids.spaceId,
  owner: ids.playerId,
  typeId: ids.pieceTypeId.optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

const trackBoardStateSchema = z.object({
  id: ids.boardId,
  spaces: z.record(ids.spaceId, trackSpaceStateSchema),
  pieces: z.record(z.string(), trackPieceStateSchema),
});

const dieStateSchema = z.object({
  id: ids.dieId,
  sides: z.number().int().positive(),
  currentValue: z.number().int().optional(),
  color: z.string().optional(),
});

const continuationTokenSchema = z.object({
  id: z.string(),
  data: z.unknown(),
});

const promptOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

const promptInstanceSchema = z.object({
  id: z.string(),
  promptId: z.string(),
  to: ids.playerId,
  options: z.array(promptOptionSchema).optional(),
  payload: z.unknown().optional(),
  resume: continuationTokenSchema,
});

const windowClosePolicySchema = z.union([
  z.object({ type: z.literal("allPassInSequence") }),
  z.object({ type: z.literal("allResponded") }),
  z.object({ type: z.literal("firstValidAction") }),
  z.object({ type: z.literal("manual") }),
]);

const windowInstanceSchema = z.object({
  id: z.string(),
  windowId: z.string(),
  closePolicy: windowClosePolicySchema,
  addressedTo: z.array(ids.playerId).optional(),
  payload: z.unknown().optional(),
  resume: continuationTokenSchema.optional(),
});

const effectInstanceSchema = z.object({
  type: z.string(),
});

const rngStateSchema = z.object({
  seed: z.number().int().nullable().optional(),
  cursor: z.number().int().nonnegative(),
  trace: z.array(z.string()),
});

export const tableSchema = z.object({
  playerOrder: z.array(ids.playerId),
  decks: z.record(ids.deckId, z.array(ids.cardId)),
  hands: z.record(ids.handId, z.record(ids.playerId, z.array(ids.cardId))),
  handVisibility: z.record(ids.handId, handVisibilitySchema),
  cards: z.record(ids.cardId, cardStateSchema),
  componentLocations: z.record(ids.cardId, cardLocationSchema),
  ownerOfCard: z.record(ids.cardId, ids.playerId.nullable()),
  visibility: z.record(ids.cardId, cardVisibilitySchema),
  resources: z.record(ids.playerId, z.record(ids.resourceId, z.number())),
  boards: z.object({
    hex: z.record(ids.boardId, z.object({ id: ids.boardId })),
  }),
  dice: z.record(ids.dieId, dieStateSchema),
});

export function createRuntimeSchema<PhaseNameSchema extends z.ZodTypeAny>(
  phaseNameSchema: PhaseNameSchema,
) {
  return z.object({
    prompts: z.array(promptInstanceSchema),
    windows: z.array(windowInstanceSchema),
    effectQueue: z.array(effectInstanceSchema),
    rng: rngStateSchema,
    lastTransition: z
      .object({
        from: phaseNameSchema,
        to: phaseNameSchema,
      })
      .optional(),
  });
}

export const runtimeSchema = createRuntimeSchema(z.string());

export const schemas = {
  handVisibility: handVisibilitySchema,
  boardKind: boardKindSchema,
  cardProperties: cardPropertiesSchema,
  cardPropertiesByType: {
    "standard-deck": cardPropertiesSchema,
  },
  cardPropertiesById: {
    CARD_A: cardPropertiesSchema,
  },
  cardVisibility: cardVisibilitySchema,
  cardLocation: cardLocationSchema,
  cardState: cardStateSchema,
  trackBoardState: trackBoardStateSchema,
  dieState: dieStateSchema,
  continuationToken: continuationTokenSchema,
  promptOption: promptOptionSchema,
  promptInstance: promptInstanceSchema,
  windowClosePolicy: windowClosePolicySchema,
  windowInstance: windowInstanceSchema,
  effectInstance: effectInstanceSchema,
  rngState: rngStateSchema,
} as const;

export type PromptInstance = z.infer<typeof promptInstanceSchema>;
export type WindowClosePolicy = z.infer<typeof windowClosePolicySchema>;
export type WindowInstance = z.infer<typeof windowInstanceSchema>;
export type EffectInstance = z.infer<typeof effectInstanceSchema>;
export type RngState = z.infer<typeof rngStateSchema>;
export type TableState = z.infer<typeof tableSchema>;
export type RuntimeState<PhaseName extends string = string> = Omit<
  z.infer<typeof runtimeSchema>,
  "lastTransition"
> & {
  lastTransition?: { from: PhaseName; to: PhaseName };
};

export type FlowState<PhaseName extends string> = {
  currentPhase: PhaseName;
  turn: number;
  round: number;
};

export type GameState<
  PhaseName extends string,
  PublicState,
  PrivateState,
  HiddenState,
  PhaseStates,
> = {
  table: TableState;
  public: PublicState;
  private: Record<PlayerId, PrivateState>;
  hidden: HiddenState;
  flow: FlowState<PhaseName>;
  phases: PhaseStates;
  runtime: RuntimeState<PhaseName>;
};

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
  return z.object({
    table: tableSchema,
    public: publicSchema,
    private: z.record(ids.playerId, privateSchema),
    hidden: hiddenSchema,
    flow: z.object({
      currentPhase: phaseNameSchema,
      turn: z.number().int(),
      round: z.number().int(),
    }),
    phases: phasesSchema,
    runtime: createRuntimeSchema(phaseNameSchema),
  });
}

export const manifestContract = {
  literals,
  ids,
  schemas,
  tableSchema,
  runtimeSchema,
  createGameStateSchema,
} as const;
