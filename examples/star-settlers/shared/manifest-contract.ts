/**
 * Generated file.
 * Do not edit directly.
 */

import { z } from "zod";
import {
  buildTypedRecord,
  expectTypedId,
  isTypedId,
} from "@dreamboard/sdk-types";
import {
  asPlayerId,
  assumeManifestSchema,
  boardRef,
  boardRefKey,
  boardRefSchema,
  cloneManifestDefault,
  createManifestGameStateSchema,
  createManifestRuntimeSchema,
  createManifestStringLiteralSchema,
  dealToPlayerBoardContainer as createDealToPlayerBoardContainerStep,
  dealToPlayerZone as createDealToPlayerZoneStep,
  perPlayer,
  perPlayerEntries,
  perPlayerGet,
  perPlayerHas,
  perPlayerKeys,
  perPlayerSchema,
  resolveManifestPlayerIds,
  seedSharedBoardContainer as createSeedSharedBoardContainerStep,
  seedSharedBoardSpace as createSeedSharedBoardSpaceStep,
  shuffle as createShuffleStep,
  type CardIdOfManifest,
  type DieIdOfManifest,
  type PieceIdOfManifest,
  type BoardRef,
  type PerPlayer,
  type PerPlayerBoardRef,
  type PlayerId,
  type ReducerManifestContract,
  type RuntimeCardData,
  type RuntimeCardVisibility,
  type RuntimeComponentLocation,
  type RuntimeDieData,
  type RuntimeHandVisibilityMode,
  type RuntimePieceData,
  type RuntimeRecord,
  type RuntimeTableRecord,
  type SetupBootstrapContainerRef,
  type SetupBootstrapDestinationRef,
  type SetupBootstrapPerPlayerContainerTemplateRef,
  type SetupBootstrapStep,
  type SetupProfileDefinition,
  type SharedBoardRef,
  type StaticBoards,
} from "@dreamboard/app-sdk/reducer";

const unknownRecordSchema = assumeManifestSchema<RuntimeRecord>(
  z.record(z.string(), z.unknown()),
);

function resolveDefaultPlayerIds(
  playerIds: readonly string[] | undefined,
): readonly PlayerId[] {
  return resolveManifestPlayerIds(
    literals.playerIds as unknown as readonly PlayerId[],
    playerIds,
  );
}

export const literals = {
  // literals satisfy `ManifestLiterals<PlayerId, ...>`. The cast is safe
  // because the runtime values are the exact player-id strings the manifest
  // authored; branding is purely a type-level discipline.
  playerIds: ["player-1", "player-2", "player-3", "player-4"] as const as unknown as readonly PlayerId[],
  phaseNames: [] as readonly string[],
  boardLayouts: ["generic", "hex", "square"] as const,
  setupOptionIds: [] as const,
  setupProfileIds: ["standard"] as const,
  cardSetIds: ["tech-cards"] as const,
  cardTypes: ["bountySurvey", "jumpGate", "patrol", "relicCache", "signalLock"] as const,
  cardIds: ["bountySurvey-1", "bountySurvey-2", "jumpGate-1", "jumpGate-2", "patrol-1", "patrol-10", "patrol-11", "patrol-12", "patrol-13", "patrol-14", "patrol-2", "patrol-3", "patrol-4", "patrol-5", "patrol-6", "patrol-7", "patrol-8", "patrol-9", "relicCache-1", "relicCache-2", "relicCache-3", "relicCache-4", "relicCache-5", "signalLock-1", "signalLock-2"] as const,
  deckIds: ["tech-deck", "tech-played"] as const,
  handIds: ["tech-hand"] as const,
  sharedZoneIds: ["tech-deck", "tech-played"] as const,
  playerZoneIds: ["tech-hand"] as const,
  zoneIds: ["tech-deck", "tech-hand", "tech-played"] as const,
  resourceIds: ["alloy", "carbon", "crystal", "fiber", "water"] as const,
  resourcePresentationById: {
  "alloy": {
    "label": "Alloy Plating",
    "icon": "🛰️"
  },
  "carbon": {
    "label": "Carbon Cells",
    "icon": "⚫"
  },
  "crystal": {
    "label": "Quantum Crystal",
    "icon": "🔷"
  },
  "fiber": {
    "label": "Biofiber",
    "icon": "🧬"
  },
  "water": {
    "label": "Hydrogen Ice",
    "icon": "🧊"
  }
} as const,
  pieceTypeIds: ["hub", "outpost", "raider", "route"] as const,
  pieceIds: ["hub-p1-1", "hub-p1-2", "hub-p1-3", "hub-p1-4", "hub-p2-1", "hub-p2-2", "hub-p2-3", "hub-p2-4", "hub-p3-1", "hub-p3-2", "hub-p3-3", "hub-p3-4", "hub-p4-1", "hub-p4-2", "hub-p4-3", "hub-p4-4", "outpost-p1-1", "outpost-p1-2", "outpost-p1-3", "outpost-p1-4", "outpost-p1-5", "outpost-p2-1", "outpost-p2-2", "outpost-p2-3", "outpost-p2-4", "outpost-p2-5", "outpost-p3-1", "outpost-p3-2", "outpost-p3-3", "outpost-p3-4", "outpost-p3-5", "outpost-p4-1", "outpost-p4-2", "outpost-p4-3", "outpost-p4-4", "outpost-p4-5", "raider", "route-p1-1", "route-p1-10", "route-p1-11", "route-p1-12", "route-p1-13", "route-p1-14", "route-p1-15", "route-p1-2", "route-p1-3", "route-p1-4", "route-p1-5", "route-p1-6", "route-p1-7", "route-p1-8", "route-p1-9", "route-p2-1", "route-p2-10", "route-p2-11", "route-p2-12", "route-p2-13", "route-p2-14", "route-p2-15", "route-p2-2", "route-p2-3", "route-p2-4", "route-p2-5", "route-p2-6", "route-p2-7", "route-p2-8", "route-p2-9", "route-p3-1", "route-p3-10", "route-p3-11", "route-p3-12", "route-p3-13", "route-p3-14", "route-p3-15", "route-p3-2", "route-p3-3", "route-p3-4", "route-p3-5", "route-p3-6", "route-p3-7", "route-p3-8", "route-p3-9", "route-p4-1", "route-p4-10", "route-p4-11", "route-p4-12", "route-p4-13", "route-p4-14", "route-p4-15", "route-p4-2", "route-p4-3", "route-p4-4", "route-p4-5", "route-p4-6", "route-p4-7", "route-p4-8", "route-p4-9"] as const,
  dieTypeIds: ["d6"] as const,
  dieIds: ["die-1", "die-2"] as const,
  boardTemplateIds: ["star-sector"] as const,
  boardTypeIds: [] as const,
  boardBaseIds: ["sector"] as const,
  boardIds: ["sector"] as const,
  boardContainerIds: [] as const,
  relationTypeIds: ["adjacent"] as const,
  edgeIds: ["hex-edge:-1,-1,2::-2,-2,4", "hex-edge:-1,-1,2::-2,1,1", "hex-edge:-1,-1,2::1,-2,1", "hex-edge:-1,-10,11::-2,-8,10", "hex-edge:-1,-10,11::1,-11,10", "hex-edge:-1,-4,5::-2,-2,4", "hex-edge:-1,-4,5::-2,-5,7", "hex-edge:-1,-4,5::1,-5,4", "hex-edge:-1,-7,8::-2,-5,7", "hex-edge:-1,-7,8::-2,-8,10", "hex-edge:-1,-7,8::1,-8,7", "hex-edge:-1,11,-10::-2,10,-8", "hex-edge:-1,11,-10::1,10,-11", "hex-edge:-1,2,-1::-2,1,1", "hex-edge:-1,2,-1::-2,4,-2", "hex-edge:-1,2,-1::1,1,-2", "hex-edge:-1,5,-4::-2,4,-2", "hex-edge:-1,5,-4::-2,7,-5", "hex-edge:-1,5,-4::1,4,-5", "hex-edge:-1,8,-7::-2,10,-8", "hex-edge:-1,8,-7::-2,7,-5", "hex-edge:-1,8,-7::1,7,-8", "hex-edge:-10,-1,11::-11,1,10", "hex-edge:-10,-1,11::-8,-2,10", "hex-edge:-10,11,-1::-11,10,1", "hex-edge:-10,11,-1::-8,10,-2", "hex-edge:-10,2,8::-11,1,10", "hex-edge:-10,2,8::-11,4,7", "hex-edge:-10,2,8::-8,1,7", "hex-edge:-10,5,5::-11,4,7", "hex-edge:-10,5,5::-11,7,4", "hex-edge:-10,5,5::-8,4,4", "hex-edge:-10,8,2::-11,10,1", "hex-edge:-10,8,2::-11,7,4", "hex-edge:-10,8,2::-8,7,1", "hex-edge:-2,-2,4::-4,-1,5", "hex-edge:-2,-5,7::-4,-4,8", "hex-edge:-2,-8,10::-4,-7,11", "hex-edge:-2,1,1::-4,2,2", "hex-edge:-2,10,-8::-4,11,-7", "hex-edge:-2,4,-2::-4,5,-1", "hex-edge:-2,7,-5::-4,8,-4", "hex-edge:-4,-1,5::-5,-2,7", "hex-edge:-4,-1,5::-5,1,4", "hex-edge:-4,-4,8::-5,-2,7", "hex-edge:-4,-4,8::-5,-5,10", "hex-edge:-4,-7,11::-5,-5,10", "hex-edge:-4,11,-7::-5,10,-5", "hex-edge:-4,2,2::-5,1,4", "hex-edge:-4,2,2::-5,4,1", "hex-edge:-4,5,-1::-5,4,1", "hex-edge:-4,5,-1::-5,7,-2", "hex-edge:-4,8,-4::-5,10,-5", "hex-edge:-4,8,-4::-5,7,-2", "hex-edge:-5,-2,7::-7,-1,8", "hex-edge:-5,-5,10::-7,-4,11", "hex-edge:-5,1,4::-7,2,5", "hex-edge:-5,10,-5::-7,11,-4", "hex-edge:-5,4,1::-7,5,2", "hex-edge:-5,7,-2::-7,8,-1", "hex-edge:-7,-1,8::-8,-2,10", "hex-edge:-7,-1,8::-8,1,7", "hex-edge:-7,-4,11::-8,-2,10", "hex-edge:-7,11,-4::-8,10,-2", "hex-edge:-7,2,5::-8,1,7", "hex-edge:-7,2,5::-8,4,4", "hex-edge:-7,5,2::-8,4,4", "hex-edge:-7,5,2::-8,7,1", "hex-edge:-7,8,-1::-8,10,-2", "hex-edge:-7,8,-1::-8,7,1", "hex-edge:1,-11,10::2,-10,8", "hex-edge:1,-2,1::2,-1,-1", "hex-edge:1,-2,1::2,-4,2", "hex-edge:1,-5,4::2,-4,2", "hex-edge:1,-5,4::2,-7,5", "hex-edge:1,-8,7::2,-10,8", "hex-edge:1,-8,7::2,-7,5", "hex-edge:1,1,-2::2,-1,-1", "hex-edge:1,1,-2::2,2,-4", "hex-edge:1,10,-11::2,8,-10", "hex-edge:1,4,-5::2,2,-4", "hex-edge:1,4,-5::2,5,-7", "hex-edge:1,7,-8::2,5,-7", "hex-edge:1,7,-8::2,8,-10", "hex-edge:10,-11,1::11,-10,-1", "hex-edge:10,-11,1::8,-10,2", "hex-edge:10,-2,-8::11,-1,-10", "hex-edge:10,-2,-8::11,-4,-7", "hex-edge:10,-2,-8::8,-1,-7", "hex-edge:10,-5,-5::11,-4,-7", "hex-edge:10,-5,-5::11,-7,-4", "hex-edge:10,-5,-5::8,-4,-4", "hex-edge:10,-8,-2::11,-10,-1", "hex-edge:10,-8,-2::11,-7,-4", "hex-edge:10,-8,-2::8,-7,-1", "hex-edge:10,1,-11::11,-1,-10", "hex-edge:10,1,-11::8,2,-10", "hex-edge:2,-1,-1::4,-2,-2", "hex-edge:2,-10,8::4,-11,7", "hex-edge:2,-4,2::4,-5,1", "hex-edge:2,-7,5::4,-8,4", "hex-edge:2,2,-4::4,1,-5", "hex-edge:2,5,-7::4,4,-8", "hex-edge:2,8,-10::4,7,-11", "hex-edge:4,-11,7::5,-10,5", "hex-edge:4,-2,-2::5,-1,-4", "hex-edge:4,-2,-2::5,-4,-1", "hex-edge:4,-5,1::5,-4,-1", "hex-edge:4,-5,1::5,-7,2", "hex-edge:4,-8,4::5,-10,5", "hex-edge:4,-8,4::5,-7,2", "hex-edge:4,1,-5::5,-1,-4", "hex-edge:4,1,-5::5,2,-7", "hex-edge:4,4,-8::5,2,-7", "hex-edge:4,4,-8::5,5,-10", "hex-edge:4,7,-11::5,5,-10", "hex-edge:5,-1,-4::7,-2,-5", "hex-edge:5,-10,5::7,-11,4", "hex-edge:5,-4,-1::7,-5,-2", "hex-edge:5,-7,2::7,-8,1", "hex-edge:5,2,-7::7,1,-8", "hex-edge:5,5,-10::7,4,-11", "hex-edge:7,-11,4::8,-10,2", "hex-edge:7,-2,-5::8,-1,-7", "hex-edge:7,-2,-5::8,-4,-4", "hex-edge:7,-5,-2::8,-4,-4", "hex-edge:7,-5,-2::8,-7,-1", "hex-edge:7,-8,1::8,-10,2", "hex-edge:7,-8,1::8,-7,-1", "hex-edge:7,1,-8::8,-1,-7", "hex-edge:7,1,-8::8,2,-10", "hex-edge:7,4,-11::8,2,-10"] as const,
  edgeTypeIds: ["relay"] as const,
  vertexIds: ["hex-vertex:-1,-1,2", "hex-vertex:-1,-10,11", "hex-vertex:-1,-4,5", "hex-vertex:-1,-7,8", "hex-vertex:-1,11,-10", "hex-vertex:-1,2,-1", "hex-vertex:-1,5,-4", "hex-vertex:-1,8,-7", "hex-vertex:-10,-1,11", "hex-vertex:-10,11,-1", "hex-vertex:-10,2,8", "hex-vertex:-10,5,5", "hex-vertex:-10,8,2", "hex-vertex:-11,1,10", "hex-vertex:-11,10,1", "hex-vertex:-11,4,7", "hex-vertex:-11,7,4", "hex-vertex:-2,-2,4", "hex-vertex:-2,-5,7", "hex-vertex:-2,-8,10", "hex-vertex:-2,1,1", "hex-vertex:-2,10,-8", "hex-vertex:-2,4,-2", "hex-vertex:-2,7,-5", "hex-vertex:-4,-1,5", "hex-vertex:-4,-4,8", "hex-vertex:-4,-7,11", "hex-vertex:-4,11,-7", "hex-vertex:-4,2,2", "hex-vertex:-4,5,-1", "hex-vertex:-4,8,-4", "hex-vertex:-5,-2,7", "hex-vertex:-5,-5,10", "hex-vertex:-5,1,4", "hex-vertex:-5,10,-5", "hex-vertex:-5,4,1", "hex-vertex:-5,7,-2", "hex-vertex:-7,-1,8", "hex-vertex:-7,-4,11", "hex-vertex:-7,11,-4", "hex-vertex:-7,2,5", "hex-vertex:-7,5,2", "hex-vertex:-7,8,-1", "hex-vertex:-8,-2,10", "hex-vertex:-8,1,7", "hex-vertex:-8,10,-2", "hex-vertex:-8,4,4", "hex-vertex:-8,7,1", "hex-vertex:1,-11,10", "hex-vertex:1,-2,1", "hex-vertex:1,-5,4", "hex-vertex:1,-8,7", "hex-vertex:1,1,-2", "hex-vertex:1,10,-11", "hex-vertex:1,4,-5", "hex-vertex:1,7,-8", "hex-vertex:10,-11,1", "hex-vertex:10,-2,-8", "hex-vertex:10,-5,-5", "hex-vertex:10,-8,-2", "hex-vertex:10,1,-11", "hex-vertex:11,-1,-10", "hex-vertex:11,-10,-1", "hex-vertex:11,-4,-7", "hex-vertex:11,-7,-4", "hex-vertex:2,-1,-1", "hex-vertex:2,-10,8", "hex-vertex:2,-4,2", "hex-vertex:2,-7,5", "hex-vertex:2,2,-4", "hex-vertex:2,5,-7", "hex-vertex:2,8,-10", "hex-vertex:4,-11,7", "hex-vertex:4,-2,-2", "hex-vertex:4,-5,1", "hex-vertex:4,-8,4", "hex-vertex:4,1,-5", "hex-vertex:4,4,-8", "hex-vertex:4,7,-11", "hex-vertex:5,-1,-4", "hex-vertex:5,-10,5", "hex-vertex:5,-4,-1", "hex-vertex:5,-7,2", "hex-vertex:5,2,-7", "hex-vertex:5,5,-10", "hex-vertex:7,-11,4", "hex-vertex:7,-2,-5", "hex-vertex:7,-5,-2", "hex-vertex:7,-8,1", "hex-vertex:7,1,-8", "hex-vertex:7,4,-11", "hex-vertex:8,-1,-7", "hex-vertex:8,-10,2", "hex-vertex:8,-4,-4", "hex-vertex:8,-7,-1", "hex-vertex:8,2,-10"] as const,
  vertexTypeIds: [] as const,
  spaceIds: ["h-0-0", "h-1-0", "h-1-1", "h-1-2", "h-1-3", "h-1-4", "h-1-5", "h-2-0", "h-2-1", "h-2-10", "h-2-11", "h-2-2", "h-2-3", "h-2-4", "h-2-5", "h-2-6", "h-2-7", "h-2-8", "h-2-9", "o-0", "o-1", "o-10", "o-11", "o-12", "o-13", "o-14", "o-15", "o-16", "o-17", "o-2", "o-3", "o-4", "o-5", "o-6", "o-7", "o-8", "o-9"] as const,
  spaceTypeIds: ["deepSpace", "land"] as const,
  handVisibilityById: {
  "tech-hand": "ownerOnly",
} as const,
  zoneVisibilityById: {
  "tech-deck": "hidden",
  "tech-hand": "ownerOnly",
  "tech-played": "public",
} as const,
  cardSetIdByCardId: {
  "bountySurvey-1": "tech-cards",
  "bountySurvey-2": "tech-cards",
  "jumpGate-1": "tech-cards",
  "jumpGate-2": "tech-cards",
  "patrol-1": "tech-cards",
  "patrol-10": "tech-cards",
  "patrol-11": "tech-cards",
  "patrol-12": "tech-cards",
  "patrol-13": "tech-cards",
  "patrol-14": "tech-cards",
  "patrol-2": "tech-cards",
  "patrol-3": "tech-cards",
  "patrol-4": "tech-cards",
  "patrol-5": "tech-cards",
  "patrol-6": "tech-cards",
  "patrol-7": "tech-cards",
  "patrol-8": "tech-cards",
  "patrol-9": "tech-cards",
  "relicCache-1": "tech-cards",
  "relicCache-2": "tech-cards",
  "relicCache-3": "tech-cards",
  "relicCache-4": "tech-cards",
  "relicCache-5": "tech-cards",
  "signalLock-1": "tech-cards",
  "signalLock-2": "tech-cards",
} as const,
  cardTypeByCardId: {
  "bountySurvey-1": "bountySurvey",
  "bountySurvey-2": "bountySurvey",
  "jumpGate-1": "jumpGate",
  "jumpGate-2": "jumpGate",
  "patrol-1": "patrol",
  "patrol-10": "patrol",
  "patrol-11": "patrol",
  "patrol-12": "patrol",
  "patrol-13": "patrol",
  "patrol-14": "patrol",
  "patrol-2": "patrol",
  "patrol-3": "patrol",
  "patrol-4": "patrol",
  "patrol-5": "patrol",
  "patrol-6": "patrol",
  "patrol-7": "patrol",
  "patrol-8": "patrol",
  "patrol-9": "patrol",
  "relicCache-1": "relicCache",
  "relicCache-2": "relicCache",
  "relicCache-3": "relicCache",
  "relicCache-4": "relicCache",
  "relicCache-5": "relicCache",
  "signalLock-1": "signalLock",
  "signalLock-2": "signalLock",
} as const,
  setupChoiceIdsByOptionId: {

} as const,
  cardSetIdsBySharedZoneId: {
  "tech-deck": ["tech-cards"] as const,
  "tech-played": ["tech-cards"] as const,
} as const,
  cardSetIdsByPlayerZoneId: {
  "tech-hand": ["tech-cards"] as const,
} as const,
} as const;

// PlayerId is an opaque brand imported from @dreamboard/app-sdk/reducer.
// We intentionally do NOT enumerate the manifest's max-players roster here:
// the runtime session may have fewer active seats than the manifest declares,
// and requiring ingress to pick a literal from the max-players set reintroduces
// the "total-record" assumption the refactor is meant to eliminate. Runtime
// roster validation is done through perPlayerSchema(runtimePlayerIds, ...)
// instead, which can be bound to the actual active roster.
const playerIdSchema = z
  .string()
  .min(1)
  .transform((value) => asPlayerId(value));
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

export type { PlayerId };
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

export const cardTypes = {
  "bountySurvey": "bountySurvey",
  "jumpGate": "jumpGate",
  "patrol": "patrol",
  "relicCache": "relicCache",
  "signalLock": "signalLock",
} as const satisfies Record<string, CardType>;

export const zones = {
  "techDeck": "tech-deck",
  "techHand": "tech-hand",
  "techPlayed": "tech-played",
} as const satisfies Record<string, ZoneId>;

export const records = {
  boardLayouts<Value>(
    initial: Value | ((boardLayout: BoardLayout) => Value),
  ): Record<BoardLayout, Value> {
    return buildTypedRecord(literals.boardLayouts, initial);
  },
  setupOptionIds<Value>(
    initial: Value | ((setupOptionId: SetupOptionId) => Value),
  ): Record<SetupOptionId, Value> {
    return buildTypedRecord(literals.setupOptionIds, initial);
  },
  setupProfileIds<Value>(
    initial: Value | ((setupProfileId: SetupProfileId) => Value),
  ): Record<SetupProfileId, Value> {
    return buildTypedRecord(literals.setupProfileIds, initial);
  },
  cardSetIds<Value>(
    initial: Value | ((cardSetId: CardSetId) => Value),
  ): Record<CardSetId, Value> {
    return buildTypedRecord(literals.cardSetIds, initial);
  },
  cardTypes<Value>(
    initial: Value | ((cardType: CardType) => Value),
  ): Record<CardType, Value> {
    return buildTypedRecord(literals.cardTypes, initial);
  },
  cardIds<Value>(
    initial: Value | ((cardId: CardId) => Value),
  ): Record<CardId, Value> {
    return buildTypedRecord(literals.cardIds, initial);
  },
  deckIds<Value>(
    initial: Value | ((deckId: DeckId) => Value),
  ): Record<DeckId, Value> {
    return buildTypedRecord(literals.deckIds, initial);
  },
  handIds<Value>(
    initial: Value | ((handId: HandId) => Value),
  ): Record<HandId, Value> {
    return buildTypedRecord(literals.handIds, initial);
  },
  sharedZoneIds<Value>(
    initial: Value | ((sharedZoneId: SharedZoneId) => Value),
  ): Record<SharedZoneId, Value> {
    return buildTypedRecord(literals.sharedZoneIds, initial);
  },
  playerZoneIds<Value>(
    initial: Value | ((playerZoneId: PlayerZoneId) => Value),
  ): Record<PlayerZoneId, Value> {
    return buildTypedRecord(literals.playerZoneIds, initial);
  },
  zoneIds<Value>(
    initial: Value | ((zoneId: ZoneId) => Value),
  ): Record<ZoneId, Value> {
    return buildTypedRecord(literals.zoneIds, initial);
  },
  resourceIds<Value>(
    initial: Value | ((resourceId: ResourceId) => Value),
  ): Record<ResourceId, Value> {
    return buildTypedRecord(literals.resourceIds, initial);
  },
  pieceTypeIds<Value>(
    initial: Value | ((pieceTypeId: PieceTypeId) => Value),
  ): Record<PieceTypeId, Value> {
    return buildTypedRecord(literals.pieceTypeIds, initial);
  },
  pieceIds<Value>(
    initial: Value | ((pieceId: PieceId) => Value),
  ): Record<PieceId, Value> {
    return buildTypedRecord(literals.pieceIds, initial);
  },
  dieTypeIds<Value>(
    initial: Value | ((dieTypeId: DieTypeId) => Value),
  ): Record<DieTypeId, Value> {
    return buildTypedRecord(literals.dieTypeIds, initial);
  },
  dieIds<Value>(
    initial: Value | ((dieId: DieId) => Value),
  ): Record<DieId, Value> {
    return buildTypedRecord(literals.dieIds, initial);
  },
  boardTypeIds<Value>(
    initial: Value | ((boardTypeId: BoardTypeId) => Value),
  ): Record<BoardTypeId, Value> {
    return buildTypedRecord(literals.boardTypeIds, initial);
  },
  boardBaseIds<Value>(
    initial: Value | ((boardBaseId: BoardBaseId) => Value),
  ): Record<BoardBaseId, Value> {
    return buildTypedRecord(literals.boardBaseIds, initial);
  },
  boardIds<Value>(
    initial: Value | ((boardId: BoardId) => Value),
  ): Record<BoardId, Value> {
    return buildTypedRecord(literals.boardIds, initial);
  },
  boardContainerIds<Value>(
    initial: Value | ((boardContainerId: BoardContainerId) => Value),
  ): Record<BoardContainerId, Value> {
    return buildTypedRecord(literals.boardContainerIds, initial);
  },
  relationTypeIds<Value>(
    initial: Value | ((relationTypeId: RelationTypeId) => Value),
  ): Record<RelationTypeId, Value> {
    return buildTypedRecord(literals.relationTypeIds, initial);
  },
  edgeIds<Value>(
    initial: Value | ((edgeId: EdgeId) => Value),
  ): Record<EdgeId, Value> {
    return buildTypedRecord(literals.edgeIds, initial);
  },
  edgeTypeIds<Value>(
    initial: Value | ((edgeTypeId: EdgeTypeId) => Value),
  ): Record<EdgeTypeId, Value> {
    return buildTypedRecord(literals.edgeTypeIds, initial);
  },
  vertexIds<Value>(
    initial: Value | ((vertexId: VertexId) => Value),
  ): Record<VertexId, Value> {
    return buildTypedRecord(literals.vertexIds, initial);
  },
  vertexTypeIds<Value>(
    initial: Value | ((vertexTypeId: VertexTypeId) => Value),
  ): Record<VertexTypeId, Value> {
    return buildTypedRecord(literals.vertexTypeIds, initial);
  },
  spaceIds<Value>(
    initial: Value | ((spaceId: SpaceId) => Value),
  ): Record<SpaceId, Value> {
    return buildTypedRecord(literals.spaceIds, initial);
  },
  spaceTypeIds<Value>(
    initial: Value | ((spaceTypeId: SpaceTypeId) => Value),
  ): Record<SpaceTypeId, Value> {
    return buildTypedRecord(literals.spaceTypeIds, initial);
  },
} as const;

export const idGuards = {
  isBoardLayout(value: string): value is BoardLayout {
    return isTypedId(literals.boardLayouts, value);
  },
  expectBoardLayout(value: string): BoardLayout {
    return expectTypedId(literals.boardLayouts, value, "board layout");
  },
  isSetupOptionId(value: string): value is SetupOptionId {
    return isTypedId(literals.setupOptionIds, value);
  },
  expectSetupOptionId(value: string): SetupOptionId {
    return expectTypedId(literals.setupOptionIds, value, "setup option id");
  },
  isSetupProfileId(value: string): value is SetupProfileId {
    return isTypedId(literals.setupProfileIds, value);
  },
  expectSetupProfileId(value: string): SetupProfileId {
    return expectTypedId(literals.setupProfileIds, value, "setup profile id");
  },
  isCardSetId(value: string): value is CardSetId {
    return isTypedId(literals.cardSetIds, value);
  },
  expectCardSetId(value: string): CardSetId {
    return expectTypedId(literals.cardSetIds, value, "card set id");
  },
  isCardType(value: string): value is CardType {
    return isTypedId(literals.cardTypes, value);
  },
  expectCardType(value: string): CardType {
    return expectTypedId(literals.cardTypes, value, "card type");
  },
  isCardId(value: string): value is CardId {
    return isTypedId(literals.cardIds, value);
  },
  expectCardId(value: string): CardId {
    return expectTypedId(literals.cardIds, value, "card id");
  },
  isDeckId(value: string): value is DeckId {
    return isTypedId(literals.deckIds, value);
  },
  expectDeckId(value: string): DeckId {
    return expectTypedId(literals.deckIds, value, "deck id");
  },
  isHandId(value: string): value is HandId {
    return isTypedId(literals.handIds, value);
  },
  expectHandId(value: string): HandId {
    return expectTypedId(literals.handIds, value, "hand id");
  },
  isSharedZoneId(value: string): value is SharedZoneId {
    return isTypedId(literals.sharedZoneIds, value);
  },
  expectSharedZoneId(value: string): SharedZoneId {
    return expectTypedId(literals.sharedZoneIds, value, "shared zone id");
  },
  isPlayerZoneId(value: string): value is PlayerZoneId {
    return isTypedId(literals.playerZoneIds, value);
  },
  expectPlayerZoneId(value: string): PlayerZoneId {
    return expectTypedId(literals.playerZoneIds, value, "player zone id");
  },
  isZoneId(value: string): value is ZoneId {
    return isTypedId(literals.zoneIds, value);
  },
  expectZoneId(value: string): ZoneId {
    return expectTypedId(literals.zoneIds, value, "zone id");
  },
  isResourceId(value: string): value is ResourceId {
    return isTypedId(literals.resourceIds, value);
  },
  expectResourceId(value: string): ResourceId {
    return expectTypedId(literals.resourceIds, value, "resource id");
  },
  isPieceTypeId(value: string): value is PieceTypeId {
    return isTypedId(literals.pieceTypeIds, value);
  },
  expectPieceTypeId(value: string): PieceTypeId {
    return expectTypedId(literals.pieceTypeIds, value, "piece type id");
  },
  isPieceId(value: string): value is PieceId {
    return isTypedId(literals.pieceIds, value);
  },
  expectPieceId(value: string): PieceId {
    return expectTypedId(literals.pieceIds, value, "piece id");
  },
  isDieTypeId(value: string): value is DieTypeId {
    return isTypedId(literals.dieTypeIds, value);
  },
  expectDieTypeId(value: string): DieTypeId {
    return expectTypedId(literals.dieTypeIds, value, "die type id");
  },
  isDieId(value: string): value is DieId {
    return isTypedId(literals.dieIds, value);
  },
  expectDieId(value: string): DieId {
    return expectTypedId(literals.dieIds, value, "die id");
  },
  isBoardTypeId(value: string): value is BoardTypeId {
    return isTypedId(literals.boardTypeIds, value);
  },
  expectBoardTypeId(value: string): BoardTypeId {
    return expectTypedId(literals.boardTypeIds, value, "board type id");
  },
  isBoardBaseId(value: string): value is BoardBaseId {
    return isTypedId(literals.boardBaseIds, value);
  },
  expectBoardBaseId(value: string): BoardBaseId {
    return expectTypedId(literals.boardBaseIds, value, "board base id");
  },
  isBoardId(value: string): value is BoardId {
    return isTypedId(literals.boardIds, value);
  },
  expectBoardId(value: string): BoardId {
    return expectTypedId(literals.boardIds, value, "board id");
  },
  isBoardContainerId(value: string): value is BoardContainerId {
    return isTypedId(literals.boardContainerIds, value);
  },
  expectBoardContainerId(value: string): BoardContainerId {
    return expectTypedId(literals.boardContainerIds, value, "board container id");
  },
  isRelationTypeId(value: string): value is RelationTypeId {
    return isTypedId(literals.relationTypeIds, value);
  },
  expectRelationTypeId(value: string): RelationTypeId {
    return expectTypedId(literals.relationTypeIds, value, "relation type id");
  },
  isEdgeId(value: string): value is EdgeId {
    return isTypedId(literals.edgeIds, value);
  },
  expectEdgeId(value: string): EdgeId {
    return expectTypedId(literals.edgeIds, value, "edge id");
  },
  isEdgeTypeId(value: string): value is EdgeTypeId {
    return isTypedId(literals.edgeTypeIds, value);
  },
  expectEdgeTypeId(value: string): EdgeTypeId {
    return expectTypedId(literals.edgeTypeIds, value, "edge type id");
  },
  isVertexId(value: string): value is VertexId {
    return isTypedId(literals.vertexIds, value);
  },
  expectVertexId(value: string): VertexId {
    return expectTypedId(literals.vertexIds, value, "vertex id");
  },
  isVertexTypeId(value: string): value is VertexTypeId {
    return isTypedId(literals.vertexTypeIds, value);
  },
  expectVertexTypeId(value: string): VertexTypeId {
    return expectTypedId(literals.vertexTypeIds, value, "vertex type id");
  },
  isSpaceId(value: string): value is SpaceId {
    return isTypedId(literals.spaceIds, value);
  },
  expectSpaceId(value: string): SpaceId {
    return expectTypedId(literals.spaceIds, value, "space id");
  },
  isSpaceTypeId(value: string): value is SpaceTypeId {
    return isTypedId(literals.spaceTypeIds, value);
  },
  expectSpaceTypeId(value: string): SpaceTypeId {
    return expectTypedId(literals.spaceTypeIds, value, "space type id");
  },
} as const;

// Historically this emitted PlayerRecord<T> = Record<PlayerId, T>, but that
// type reified the "total roster" assumption (one entry per max-player). It has
// been replaced throughout the generated contract with PerPlayer<T> from
// @dreamboard/app-sdk/reducer, whose entries array matches the
// actual runtime seat list.
export type SharedZoneRecord<T> = Record<SharedZoneId, T>;
export type PlayerZoneRecord<T> = Record<PlayerZoneId, PerPlayer<T>>;
export type ComponentId = CardId | PieceId | DieId;
export type ComponentIdsBySharedZoneId = {
  "tech-deck": ComponentId[];
  "tech-played": ComponentId[];
};
export type ComponentIdsByPlayerZoneId = {
  "tech-hand": PerPlayer<ComponentId[]>;
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
export const setupOptionsById = {} as const;
export const setupChoiceIdsByOptionId = {

} as const;
export const setupProfilesById = {
  "standard": {
    "id": "standard",
    "name": "Standard",
    "description": "Standard Star Settlers setup",
    "optionValues": null
  }
} as const;

export type TechCardsCardProperties = {
  "cardType": "patrol" | "jumpGate" | "bountySurvey" | "signalLock" | "relicCache";
};

export const TechCardsCardPropertiesSchema = z.object({
  "cardType": z.enum(["patrol", "jumpGate", "bountySurvey", "signalLock", "relicCache"]),
});

export type TechCardsCardId = "patrol-1" | "patrol-2" | "patrol-3" | "patrol-4" | "patrol-5" | "patrol-6" | "patrol-7" | "patrol-8" | "patrol-9" | "patrol-10" | "patrol-11" | "patrol-12" | "patrol-13" | "patrol-14" | "jumpGate-1" | "jumpGate-2" | "bountySurvey-1" | "bountySurvey-2" | "signalLock-1" | "signalLock-2" | "relicCache-1" | "relicCache-2" | "relicCache-3" | "relicCache-4" | "relicCache-5";

export type SectorBoardFields = RuntimeRecord;

export const SectorBoardFieldsSchema = z.record(z.string(), z.unknown());

export type SectorSpaceFields = RuntimeRecord;

export const SectorSpaceFieldsSchema = z.record(z.string(), z.unknown());

export type SectorEdgeFields = {
  "relayIndex"?: number;
};

export const SectorEdgeFieldsSchema = z.object({
  "relayIndex": z.number().int().optional(),
});

export type SectorVertexFields = RuntimeRecord;

export const SectorVertexFieldsSchema = z.record(z.string(), z.unknown());

export type HubPieceFields = RuntimeRecord;

export const HubPieceFieldsSchema = z.record(z.string(), z.unknown());

export type OutpostPieceFields = RuntimeRecord;

export const OutpostPieceFieldsSchema = z.record(z.string(), z.unknown());

export type RaiderPieceFields = RuntimeRecord;

export const RaiderPieceFieldsSchema = z.record(z.string(), z.unknown());

export type RoutePieceFields = RuntimeRecord;

export const RoutePieceFieldsSchema = z.record(z.string(), z.unknown());

export type D6DieFields = RuntimeRecord;

export const D6DieFieldsSchema = z.record(z.string(), z.unknown());

export type BoardFieldsByBoardId = {
  "sector": SectorBoardFields;
};

export type BoardSpaceFieldsByBoardId = {
  "sector": SectorSpaceFields;
};

export type BoardRelationFieldsByBoardId = {
  "sector": RuntimeRecord;
};

export type BoardContainerFieldsByBoardId = {
  "sector": RuntimeRecord;
};

export type HexEdgeFieldsByBoardId = {
  "sector": SectorEdgeFields;
};

export type HexVertexFieldsByBoardId = {
  "sector": SectorVertexFields;
};

export type SquareEdgeFieldsByBoardId = Record<string, never>;

export type SquareVertexFieldsByBoardId = Record<string, never>;

export type TiledEdgeFieldsByBoardId = {
  "sector": SectorEdgeFields;
};

export type TiledVertexFieldsByBoardId = {
  "sector": SectorVertexFields;
};

export type PieceFieldsByTypeId = {
  "hub": HubPieceFields;
  "outpost": OutpostPieceFields;
  "raider": RaiderPieceFields;
  "route": RoutePieceFields;
};

export type DieFieldsByTypeId = {
  "d6": D6DieFields;
};

export type CardProperties = TechCardsCardProperties;

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

export type CardStateById = {
  "bountySurvey-1": CardStateRecord<"bountySurvey-1", "tech-cards", "bountySurvey", TechCardsCardProperties>;
  "bountySurvey-2": CardStateRecord<"bountySurvey-2", "tech-cards", "bountySurvey", TechCardsCardProperties>;
  "jumpGate-1": CardStateRecord<"jumpGate-1", "tech-cards", "jumpGate", TechCardsCardProperties>;
  "jumpGate-2": CardStateRecord<"jumpGate-2", "tech-cards", "jumpGate", TechCardsCardProperties>;
  "patrol-1": CardStateRecord<"patrol-1", "tech-cards", "patrol", TechCardsCardProperties>;
  "patrol-10": CardStateRecord<"patrol-10", "tech-cards", "patrol", TechCardsCardProperties>;
  "patrol-11": CardStateRecord<"patrol-11", "tech-cards", "patrol", TechCardsCardProperties>;
  "patrol-12": CardStateRecord<"patrol-12", "tech-cards", "patrol", TechCardsCardProperties>;
  "patrol-13": CardStateRecord<"patrol-13", "tech-cards", "patrol", TechCardsCardProperties>;
  "patrol-14": CardStateRecord<"patrol-14", "tech-cards", "patrol", TechCardsCardProperties>;
  "patrol-2": CardStateRecord<"patrol-2", "tech-cards", "patrol", TechCardsCardProperties>;
  "patrol-3": CardStateRecord<"patrol-3", "tech-cards", "patrol", TechCardsCardProperties>;
  "patrol-4": CardStateRecord<"patrol-4", "tech-cards", "patrol", TechCardsCardProperties>;
  "patrol-5": CardStateRecord<"patrol-5", "tech-cards", "patrol", TechCardsCardProperties>;
  "patrol-6": CardStateRecord<"patrol-6", "tech-cards", "patrol", TechCardsCardProperties>;
  "patrol-7": CardStateRecord<"patrol-7", "tech-cards", "patrol", TechCardsCardProperties>;
  "patrol-8": CardStateRecord<"patrol-8", "tech-cards", "patrol", TechCardsCardProperties>;
  "patrol-9": CardStateRecord<"patrol-9", "tech-cards", "patrol", TechCardsCardProperties>;
  "relicCache-1": CardStateRecord<"relicCache-1", "tech-cards", "relicCache", TechCardsCardProperties>;
  "relicCache-2": CardStateRecord<"relicCache-2", "tech-cards", "relicCache", TechCardsCardProperties>;
  "relicCache-3": CardStateRecord<"relicCache-3", "tech-cards", "relicCache", TechCardsCardProperties>;
  "relicCache-4": CardStateRecord<"relicCache-4", "tech-cards", "relicCache", TechCardsCardProperties>;
  "relicCache-5": CardStateRecord<"relicCache-5", "tech-cards", "relicCache", TechCardsCardProperties>;
  "signalLock-1": CardStateRecord<"signalLock-1", "tech-cards", "signalLock", TechCardsCardProperties>;
  "signalLock-2": CardStateRecord<"signalLock-2", "tech-cards", "signalLock", TechCardsCardProperties>;
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

export type PieceStateById = {
  "hub-p1-1": PieceStateRecord<"hub-p1-1", "hub", HubPieceFields>;
  "hub-p1-2": PieceStateRecord<"hub-p1-2", "hub", HubPieceFields>;
  "hub-p1-3": PieceStateRecord<"hub-p1-3", "hub", HubPieceFields>;
  "hub-p1-4": PieceStateRecord<"hub-p1-4", "hub", HubPieceFields>;
  "hub-p2-1": PieceStateRecord<"hub-p2-1", "hub", HubPieceFields>;
  "hub-p2-2": PieceStateRecord<"hub-p2-2", "hub", HubPieceFields>;
  "hub-p2-3": PieceStateRecord<"hub-p2-3", "hub", HubPieceFields>;
  "hub-p2-4": PieceStateRecord<"hub-p2-4", "hub", HubPieceFields>;
  "hub-p3-1": PieceStateRecord<"hub-p3-1", "hub", HubPieceFields>;
  "hub-p3-2": PieceStateRecord<"hub-p3-2", "hub", HubPieceFields>;
  "hub-p3-3": PieceStateRecord<"hub-p3-3", "hub", HubPieceFields>;
  "hub-p3-4": PieceStateRecord<"hub-p3-4", "hub", HubPieceFields>;
  "hub-p4-1": PieceStateRecord<"hub-p4-1", "hub", HubPieceFields>;
  "hub-p4-2": PieceStateRecord<"hub-p4-2", "hub", HubPieceFields>;
  "hub-p4-3": PieceStateRecord<"hub-p4-3", "hub", HubPieceFields>;
  "hub-p4-4": PieceStateRecord<"hub-p4-4", "hub", HubPieceFields>;
  "outpost-p1-1": PieceStateRecord<"outpost-p1-1", "outpost", OutpostPieceFields>;
  "outpost-p1-2": PieceStateRecord<"outpost-p1-2", "outpost", OutpostPieceFields>;
  "outpost-p1-3": PieceStateRecord<"outpost-p1-3", "outpost", OutpostPieceFields>;
  "outpost-p1-4": PieceStateRecord<"outpost-p1-4", "outpost", OutpostPieceFields>;
  "outpost-p1-5": PieceStateRecord<"outpost-p1-5", "outpost", OutpostPieceFields>;
  "outpost-p2-1": PieceStateRecord<"outpost-p2-1", "outpost", OutpostPieceFields>;
  "outpost-p2-2": PieceStateRecord<"outpost-p2-2", "outpost", OutpostPieceFields>;
  "outpost-p2-3": PieceStateRecord<"outpost-p2-3", "outpost", OutpostPieceFields>;
  "outpost-p2-4": PieceStateRecord<"outpost-p2-4", "outpost", OutpostPieceFields>;
  "outpost-p2-5": PieceStateRecord<"outpost-p2-5", "outpost", OutpostPieceFields>;
  "outpost-p3-1": PieceStateRecord<"outpost-p3-1", "outpost", OutpostPieceFields>;
  "outpost-p3-2": PieceStateRecord<"outpost-p3-2", "outpost", OutpostPieceFields>;
  "outpost-p3-3": PieceStateRecord<"outpost-p3-3", "outpost", OutpostPieceFields>;
  "outpost-p3-4": PieceStateRecord<"outpost-p3-4", "outpost", OutpostPieceFields>;
  "outpost-p3-5": PieceStateRecord<"outpost-p3-5", "outpost", OutpostPieceFields>;
  "outpost-p4-1": PieceStateRecord<"outpost-p4-1", "outpost", OutpostPieceFields>;
  "outpost-p4-2": PieceStateRecord<"outpost-p4-2", "outpost", OutpostPieceFields>;
  "outpost-p4-3": PieceStateRecord<"outpost-p4-3", "outpost", OutpostPieceFields>;
  "outpost-p4-4": PieceStateRecord<"outpost-p4-4", "outpost", OutpostPieceFields>;
  "outpost-p4-5": PieceStateRecord<"outpost-p4-5", "outpost", OutpostPieceFields>;
  "raider": PieceStateRecord<"raider", "raider", RaiderPieceFields>;
  "route-p1-1": PieceStateRecord<"route-p1-1", "route", RoutePieceFields>;
  "route-p1-10": PieceStateRecord<"route-p1-10", "route", RoutePieceFields>;
  "route-p1-11": PieceStateRecord<"route-p1-11", "route", RoutePieceFields>;
  "route-p1-12": PieceStateRecord<"route-p1-12", "route", RoutePieceFields>;
  "route-p1-13": PieceStateRecord<"route-p1-13", "route", RoutePieceFields>;
  "route-p1-14": PieceStateRecord<"route-p1-14", "route", RoutePieceFields>;
  "route-p1-15": PieceStateRecord<"route-p1-15", "route", RoutePieceFields>;
  "route-p1-2": PieceStateRecord<"route-p1-2", "route", RoutePieceFields>;
  "route-p1-3": PieceStateRecord<"route-p1-3", "route", RoutePieceFields>;
  "route-p1-4": PieceStateRecord<"route-p1-4", "route", RoutePieceFields>;
  "route-p1-5": PieceStateRecord<"route-p1-5", "route", RoutePieceFields>;
  "route-p1-6": PieceStateRecord<"route-p1-6", "route", RoutePieceFields>;
  "route-p1-7": PieceStateRecord<"route-p1-7", "route", RoutePieceFields>;
  "route-p1-8": PieceStateRecord<"route-p1-8", "route", RoutePieceFields>;
  "route-p1-9": PieceStateRecord<"route-p1-9", "route", RoutePieceFields>;
  "route-p2-1": PieceStateRecord<"route-p2-1", "route", RoutePieceFields>;
  "route-p2-10": PieceStateRecord<"route-p2-10", "route", RoutePieceFields>;
  "route-p2-11": PieceStateRecord<"route-p2-11", "route", RoutePieceFields>;
  "route-p2-12": PieceStateRecord<"route-p2-12", "route", RoutePieceFields>;
  "route-p2-13": PieceStateRecord<"route-p2-13", "route", RoutePieceFields>;
  "route-p2-14": PieceStateRecord<"route-p2-14", "route", RoutePieceFields>;
  "route-p2-15": PieceStateRecord<"route-p2-15", "route", RoutePieceFields>;
  "route-p2-2": PieceStateRecord<"route-p2-2", "route", RoutePieceFields>;
  "route-p2-3": PieceStateRecord<"route-p2-3", "route", RoutePieceFields>;
  "route-p2-4": PieceStateRecord<"route-p2-4", "route", RoutePieceFields>;
  "route-p2-5": PieceStateRecord<"route-p2-5", "route", RoutePieceFields>;
  "route-p2-6": PieceStateRecord<"route-p2-6", "route", RoutePieceFields>;
  "route-p2-7": PieceStateRecord<"route-p2-7", "route", RoutePieceFields>;
  "route-p2-8": PieceStateRecord<"route-p2-8", "route", RoutePieceFields>;
  "route-p2-9": PieceStateRecord<"route-p2-9", "route", RoutePieceFields>;
  "route-p3-1": PieceStateRecord<"route-p3-1", "route", RoutePieceFields>;
  "route-p3-10": PieceStateRecord<"route-p3-10", "route", RoutePieceFields>;
  "route-p3-11": PieceStateRecord<"route-p3-11", "route", RoutePieceFields>;
  "route-p3-12": PieceStateRecord<"route-p3-12", "route", RoutePieceFields>;
  "route-p3-13": PieceStateRecord<"route-p3-13", "route", RoutePieceFields>;
  "route-p3-14": PieceStateRecord<"route-p3-14", "route", RoutePieceFields>;
  "route-p3-15": PieceStateRecord<"route-p3-15", "route", RoutePieceFields>;
  "route-p3-2": PieceStateRecord<"route-p3-2", "route", RoutePieceFields>;
  "route-p3-3": PieceStateRecord<"route-p3-3", "route", RoutePieceFields>;
  "route-p3-4": PieceStateRecord<"route-p3-4", "route", RoutePieceFields>;
  "route-p3-5": PieceStateRecord<"route-p3-5", "route", RoutePieceFields>;
  "route-p3-6": PieceStateRecord<"route-p3-6", "route", RoutePieceFields>;
  "route-p3-7": PieceStateRecord<"route-p3-7", "route", RoutePieceFields>;
  "route-p3-8": PieceStateRecord<"route-p3-8", "route", RoutePieceFields>;
  "route-p3-9": PieceStateRecord<"route-p3-9", "route", RoutePieceFields>;
  "route-p4-1": PieceStateRecord<"route-p4-1", "route", RoutePieceFields>;
  "route-p4-10": PieceStateRecord<"route-p4-10", "route", RoutePieceFields>;
  "route-p4-11": PieceStateRecord<"route-p4-11", "route", RoutePieceFields>;
  "route-p4-12": PieceStateRecord<"route-p4-12", "route", RoutePieceFields>;
  "route-p4-13": PieceStateRecord<"route-p4-13", "route", RoutePieceFields>;
  "route-p4-14": PieceStateRecord<"route-p4-14", "route", RoutePieceFields>;
  "route-p4-15": PieceStateRecord<"route-p4-15", "route", RoutePieceFields>;
  "route-p4-2": PieceStateRecord<"route-p4-2", "route", RoutePieceFields>;
  "route-p4-3": PieceStateRecord<"route-p4-3", "route", RoutePieceFields>;
  "route-p4-4": PieceStateRecord<"route-p4-4", "route", RoutePieceFields>;
  "route-p4-5": PieceStateRecord<"route-p4-5", "route", RoutePieceFields>;
  "route-p4-6": PieceStateRecord<"route-p4-6", "route", RoutePieceFields>;
  "route-p4-7": PieceStateRecord<"route-p4-7", "route", RoutePieceFields>;
  "route-p4-8": PieceStateRecord<"route-p4-8", "route", RoutePieceFields>;
  "route-p4-9": PieceStateRecord<"route-p4-9", "route", RoutePieceFields>;
};

export type DieStateById = {
  "die-1": DieStateRecord<"die-1", "d6", D6DieFields>;
  "die-2": DieStateRecord<"die-2", "d6", D6DieFields>;
};
export type CardIdsBySharedZoneId = {
  "tech-deck": Array<"bountySurvey-1" | "bountySurvey-2" | "jumpGate-1" | "jumpGate-2" | "patrol-1" | "patrol-10" | "patrol-11" | "patrol-12" | "patrol-13" | "patrol-14" | "patrol-2" | "patrol-3" | "patrol-4" | "patrol-5" | "patrol-6" | "patrol-7" | "patrol-8" | "patrol-9" | "relicCache-1" | "relicCache-2" | "relicCache-3" | "relicCache-4" | "relicCache-5" | "signalLock-1" | "signalLock-2">;
  "tech-played": Array<"bountySurvey-1" | "bountySurvey-2" | "jumpGate-1" | "jumpGate-2" | "patrol-1" | "patrol-10" | "patrol-11" | "patrol-12" | "patrol-13" | "patrol-14" | "patrol-2" | "patrol-3" | "patrol-4" | "patrol-5" | "patrol-6" | "patrol-7" | "patrol-8" | "patrol-9" | "relicCache-1" | "relicCache-2" | "relicCache-3" | "relicCache-4" | "relicCache-5" | "signalLock-1" | "signalLock-2">;
};
export type CardIdsByPlayerZoneId = {
  "tech-hand": PerPlayer<Array<"bountySurvey-1" | "bountySurvey-2" | "jumpGate-1" | "jumpGate-2" | "patrol-1" | "patrol-10" | "patrol-11" | "patrol-12" | "patrol-13" | "patrol-14" | "patrol-2" | "patrol-3" | "patrol-4" | "patrol-5" | "patrol-6" | "patrol-7" | "patrol-8" | "patrol-9" | "relicCache-1" | "relicCache-2" | "relicCache-3" | "relicCache-4" | "relicCache-5" | "signalLock-1" | "signalLock-2">>;
};
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
  EdgeIdValue extends EdgeId = EdgeId,
  Fields = RuntimeRecord,
> {
  id: EdgeIdValue;
  spaceIds: readonly SpaceIdValue[];
  typeId?: EdgeTypeId | null;
  label?: string | null;
  ownerId?: PlayerId | null;
  fields: Fields;
}

export interface TiledVertexStateRecord<
  SpaceIdValue extends SpaceId = SpaceId,
  VertexIdValue extends VertexId = VertexId,
  Fields = RuntimeRecord,
> {
  id: VertexIdValue;
  spaceIds: readonly SpaceIdValue[];
  typeId?: VertexTypeId | null;
  label?: string | null;
  ownerId?: PlayerId | null;
  fields: Fields;
}

export type HexEdgeStateRecord<
  SpaceIdValue extends SpaceId = SpaceId,
  EdgeIdValue extends EdgeId = EdgeId,
  Fields = RuntimeRecord,
> = TiledEdgeStateRecord<SpaceIdValue, EdgeIdValue, Fields>;

export type HexVertexStateRecord<
  SpaceIdValue extends SpaceId = SpaceId,
  VertexIdValue extends VertexId = VertexId,
  Fields = RuntimeRecord,
> = TiledVertexStateRecord<SpaceIdValue, VertexIdValue, Fields>;

export interface HexBoardStateRecord<
  BoardIdValue extends BoardId = BoardId,
  SpaceIdValue extends SpaceId = SpaceId,
  EdgeIdValue extends EdgeId = EdgeId,
  VertexIdValue extends VertexId = VertexId,
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
  edges: Array<HexEdgeStateRecord<SpaceIdValue, EdgeIdValue, EdgeFields>>;
  vertices: Array<
    HexVertexStateRecord<SpaceIdValue, VertexIdValue, VertexFields>
  >;
}

export interface SquareBoardStateRecord<
  BoardIdValue extends BoardId = BoardId,
  SpaceIdValue extends SpaceId = SpaceId,
  ContainerIdValue extends BoardContainerId = BoardContainerId,
  EdgeIdValue extends EdgeId = EdgeId,
  VertexIdValue extends VertexId = VertexId,
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
  edges: Array<TiledEdgeStateRecord<SpaceIdValue, EdgeIdValue, EdgeFields>>;
  vertices: Array<
    TiledVertexStateRecord<SpaceIdValue, VertexIdValue, VertexFields>
  >;
}

export type TiledBoardStateRecord =
  | HexBoardStateRecord
  | SquareBoardStateRecord;

export type BoardStateById = {
  "sector": HexBoardStateRecord<"sector", "h-0-0" | "h-1-0" | "h-1-1" | "h-1-2" | "h-1-3" | "h-1-4" | "h-1-5" | "h-2-0" | "h-2-1" | "h-2-10" | "h-2-11" | "h-2-2" | "h-2-3" | "h-2-4" | "h-2-5" | "h-2-6" | "h-2-7" | "h-2-8" | "h-2-9" | "o-0" | "o-1" | "o-10" | "o-11" | "o-12" | "o-13" | "o-14" | "o-15" | "o-16" | "o-17" | "o-2" | "o-3" | "o-4" | "o-5" | "o-6" | "o-7" | "o-8" | "o-9", "hex-edge:-1,-1,2::-2,-2,4" | "hex-edge:-1,-1,2::-2,1,1" | "hex-edge:-1,-1,2::1,-2,1" | "hex-edge:-1,-10,11::-2,-8,10" | "hex-edge:-1,-10,11::1,-11,10" | "hex-edge:-1,-4,5::-2,-2,4" | "hex-edge:-1,-4,5::-2,-5,7" | "hex-edge:-1,-4,5::1,-5,4" | "hex-edge:-1,-7,8::-2,-5,7" | "hex-edge:-1,-7,8::-2,-8,10" | "hex-edge:-1,-7,8::1,-8,7" | "hex-edge:-1,11,-10::-2,10,-8" | "hex-edge:-1,11,-10::1,10,-11" | "hex-edge:-1,2,-1::-2,1,1" | "hex-edge:-1,2,-1::-2,4,-2" | "hex-edge:-1,2,-1::1,1,-2" | "hex-edge:-1,5,-4::-2,4,-2" | "hex-edge:-1,5,-4::-2,7,-5" | "hex-edge:-1,5,-4::1,4,-5" | "hex-edge:-1,8,-7::-2,10,-8" | "hex-edge:-1,8,-7::-2,7,-5" | "hex-edge:-1,8,-7::1,7,-8" | "hex-edge:-10,-1,11::-11,1,10" | "hex-edge:-10,-1,11::-8,-2,10" | "hex-edge:-10,11,-1::-11,10,1" | "hex-edge:-10,11,-1::-8,10,-2" | "hex-edge:-10,2,8::-11,1,10" | "hex-edge:-10,2,8::-11,4,7" | "hex-edge:-10,2,8::-8,1,7" | "hex-edge:-10,5,5::-11,4,7" | "hex-edge:-10,5,5::-11,7,4" | "hex-edge:-10,5,5::-8,4,4" | "hex-edge:-10,8,2::-11,10,1" | "hex-edge:-10,8,2::-11,7,4" | "hex-edge:-10,8,2::-8,7,1" | "hex-edge:-2,-2,4::-4,-1,5" | "hex-edge:-2,-5,7::-4,-4,8" | "hex-edge:-2,-8,10::-4,-7,11" | "hex-edge:-2,1,1::-4,2,2" | "hex-edge:-2,10,-8::-4,11,-7" | "hex-edge:-2,4,-2::-4,5,-1" | "hex-edge:-2,7,-5::-4,8,-4" | "hex-edge:-4,-1,5::-5,-2,7" | "hex-edge:-4,-1,5::-5,1,4" | "hex-edge:-4,-4,8::-5,-2,7" | "hex-edge:-4,-4,8::-5,-5,10" | "hex-edge:-4,-7,11::-5,-5,10" | "hex-edge:-4,11,-7::-5,10,-5" | "hex-edge:-4,2,2::-5,1,4" | "hex-edge:-4,2,2::-5,4,1" | "hex-edge:-4,5,-1::-5,4,1" | "hex-edge:-4,5,-1::-5,7,-2" | "hex-edge:-4,8,-4::-5,10,-5" | "hex-edge:-4,8,-4::-5,7,-2" | "hex-edge:-5,-2,7::-7,-1,8" | "hex-edge:-5,-5,10::-7,-4,11" | "hex-edge:-5,1,4::-7,2,5" | "hex-edge:-5,10,-5::-7,11,-4" | "hex-edge:-5,4,1::-7,5,2" | "hex-edge:-5,7,-2::-7,8,-1" | "hex-edge:-7,-1,8::-8,-2,10" | "hex-edge:-7,-1,8::-8,1,7" | "hex-edge:-7,-4,11::-8,-2,10" | "hex-edge:-7,11,-4::-8,10,-2" | "hex-edge:-7,2,5::-8,1,7" | "hex-edge:-7,2,5::-8,4,4" | "hex-edge:-7,5,2::-8,4,4" | "hex-edge:-7,5,2::-8,7,1" | "hex-edge:-7,8,-1::-8,10,-2" | "hex-edge:-7,8,-1::-8,7,1" | "hex-edge:1,-11,10::2,-10,8" | "hex-edge:1,-2,1::2,-1,-1" | "hex-edge:1,-2,1::2,-4,2" | "hex-edge:1,-5,4::2,-4,2" | "hex-edge:1,-5,4::2,-7,5" | "hex-edge:1,-8,7::2,-10,8" | "hex-edge:1,-8,7::2,-7,5" | "hex-edge:1,1,-2::2,-1,-1" | "hex-edge:1,1,-2::2,2,-4" | "hex-edge:1,10,-11::2,8,-10" | "hex-edge:1,4,-5::2,2,-4" | "hex-edge:1,4,-5::2,5,-7" | "hex-edge:1,7,-8::2,5,-7" | "hex-edge:1,7,-8::2,8,-10" | "hex-edge:10,-11,1::11,-10,-1" | "hex-edge:10,-11,1::8,-10,2" | "hex-edge:10,-2,-8::11,-1,-10" | "hex-edge:10,-2,-8::11,-4,-7" | "hex-edge:10,-2,-8::8,-1,-7" | "hex-edge:10,-5,-5::11,-4,-7" | "hex-edge:10,-5,-5::11,-7,-4" | "hex-edge:10,-5,-5::8,-4,-4" | "hex-edge:10,-8,-2::11,-10,-1" | "hex-edge:10,-8,-2::11,-7,-4" | "hex-edge:10,-8,-2::8,-7,-1" | "hex-edge:10,1,-11::11,-1,-10" | "hex-edge:10,1,-11::8,2,-10" | "hex-edge:2,-1,-1::4,-2,-2" | "hex-edge:2,-10,8::4,-11,7" | "hex-edge:2,-4,2::4,-5,1" | "hex-edge:2,-7,5::4,-8,4" | "hex-edge:2,2,-4::4,1,-5" | "hex-edge:2,5,-7::4,4,-8" | "hex-edge:2,8,-10::4,7,-11" | "hex-edge:4,-11,7::5,-10,5" | "hex-edge:4,-2,-2::5,-1,-4" | "hex-edge:4,-2,-2::5,-4,-1" | "hex-edge:4,-5,1::5,-4,-1" | "hex-edge:4,-5,1::5,-7,2" | "hex-edge:4,-8,4::5,-10,5" | "hex-edge:4,-8,4::5,-7,2" | "hex-edge:4,1,-5::5,-1,-4" | "hex-edge:4,1,-5::5,2,-7" | "hex-edge:4,4,-8::5,2,-7" | "hex-edge:4,4,-8::5,5,-10" | "hex-edge:4,7,-11::5,5,-10" | "hex-edge:5,-1,-4::7,-2,-5" | "hex-edge:5,-10,5::7,-11,4" | "hex-edge:5,-4,-1::7,-5,-2" | "hex-edge:5,-7,2::7,-8,1" | "hex-edge:5,2,-7::7,1,-8" | "hex-edge:5,5,-10::7,4,-11" | "hex-edge:7,-11,4::8,-10,2" | "hex-edge:7,-2,-5::8,-1,-7" | "hex-edge:7,-2,-5::8,-4,-4" | "hex-edge:7,-5,-2::8,-4,-4" | "hex-edge:7,-5,-2::8,-7,-1" | "hex-edge:7,-8,1::8,-10,2" | "hex-edge:7,-8,1::8,-7,-1" | "hex-edge:7,1,-8::8,-1,-7" | "hex-edge:7,1,-8::8,2,-10" | "hex-edge:7,4,-11::8,2,-10", "hex-vertex:-1,-1,2" | "hex-vertex:-1,-10,11" | "hex-vertex:-1,-4,5" | "hex-vertex:-1,-7,8" | "hex-vertex:-1,11,-10" | "hex-vertex:-1,2,-1" | "hex-vertex:-1,5,-4" | "hex-vertex:-1,8,-7" | "hex-vertex:-10,-1,11" | "hex-vertex:-10,11,-1" | "hex-vertex:-10,2,8" | "hex-vertex:-10,5,5" | "hex-vertex:-10,8,2" | "hex-vertex:-11,1,10" | "hex-vertex:-11,10,1" | "hex-vertex:-11,4,7" | "hex-vertex:-11,7,4" | "hex-vertex:-2,-2,4" | "hex-vertex:-2,-5,7" | "hex-vertex:-2,-8,10" | "hex-vertex:-2,1,1" | "hex-vertex:-2,10,-8" | "hex-vertex:-2,4,-2" | "hex-vertex:-2,7,-5" | "hex-vertex:-4,-1,5" | "hex-vertex:-4,-4,8" | "hex-vertex:-4,-7,11" | "hex-vertex:-4,11,-7" | "hex-vertex:-4,2,2" | "hex-vertex:-4,5,-1" | "hex-vertex:-4,8,-4" | "hex-vertex:-5,-2,7" | "hex-vertex:-5,-5,10" | "hex-vertex:-5,1,4" | "hex-vertex:-5,10,-5" | "hex-vertex:-5,4,1" | "hex-vertex:-5,7,-2" | "hex-vertex:-7,-1,8" | "hex-vertex:-7,-4,11" | "hex-vertex:-7,11,-4" | "hex-vertex:-7,2,5" | "hex-vertex:-7,5,2" | "hex-vertex:-7,8,-1" | "hex-vertex:-8,-2,10" | "hex-vertex:-8,1,7" | "hex-vertex:-8,10,-2" | "hex-vertex:-8,4,4" | "hex-vertex:-8,7,1" | "hex-vertex:1,-11,10" | "hex-vertex:1,-2,1" | "hex-vertex:1,-5,4" | "hex-vertex:1,-8,7" | "hex-vertex:1,1,-2" | "hex-vertex:1,10,-11" | "hex-vertex:1,4,-5" | "hex-vertex:1,7,-8" | "hex-vertex:10,-11,1" | "hex-vertex:10,-2,-8" | "hex-vertex:10,-5,-5" | "hex-vertex:10,-8,-2" | "hex-vertex:10,1,-11" | "hex-vertex:11,-1,-10" | "hex-vertex:11,-10,-1" | "hex-vertex:11,-4,-7" | "hex-vertex:11,-7,-4" | "hex-vertex:2,-1,-1" | "hex-vertex:2,-10,8" | "hex-vertex:2,-4,2" | "hex-vertex:2,-7,5" | "hex-vertex:2,2,-4" | "hex-vertex:2,5,-7" | "hex-vertex:2,8,-10" | "hex-vertex:4,-11,7" | "hex-vertex:4,-2,-2" | "hex-vertex:4,-5,1" | "hex-vertex:4,-8,4" | "hex-vertex:4,1,-5" | "hex-vertex:4,4,-8" | "hex-vertex:4,7,-11" | "hex-vertex:5,-1,-4" | "hex-vertex:5,-10,5" | "hex-vertex:5,-4,-1" | "hex-vertex:5,-7,2" | "hex-vertex:5,2,-7" | "hex-vertex:5,5,-10" | "hex-vertex:7,-11,4" | "hex-vertex:7,-2,-5" | "hex-vertex:7,-5,-2" | "hex-vertex:7,-8,1" | "hex-vertex:7,1,-8" | "hex-vertex:7,4,-11" | "hex-vertex:8,-1,-7" | "hex-vertex:8,-10,2" | "hex-vertex:8,-4,-4" | "hex-vertex:8,-7,-1" | "hex-vertex:8,2,-10", SectorBoardFields, SectorSpaceFields, SectorEdgeFields, SectorVertexFields>;
};

export type HexBoardStateById = {
  "sector": BoardStateById["sector"];
};

export type SquareBoardStateById = Record<string, never>;

type ManifestRecordValue<T> = T[keyof T];
type ManifestArrayElement<T> =
  T extends readonly (infer Item)[]
    ? Item
    : T extends (infer Item)[]
      ? Item
      : never;

export type BoardState<BoardIdValue extends BoardId = BoardId> =
  BoardIdValue extends keyof BoardStateById ? BoardStateById[BoardIdValue] : never;

export type BoardFields<BoardIdValue extends BoardId = BoardId> =
  BoardState<BoardIdValue> extends { fields: infer Fields } ? Fields : never;

export type BoardSpaceStateByBoardId = {
  [BoardIdValue in keyof BoardStateById]: ManifestRecordValue<
    BoardStateById[BoardIdValue]["spaces"]
  >;
};

export type BoardSpaceState<BoardIdValue extends BoardId = BoardId> =
  BoardIdValue extends keyof BoardSpaceStateByBoardId
    ? BoardSpaceStateByBoardId[BoardIdValue]
    : never;

export type BoardSpaceFields<BoardIdValue extends BoardId = BoardId> =
  BoardSpaceState<BoardIdValue> extends { fields: infer Fields }
    ? Fields
    : never;

export type BoardRelationStateByBoardId = {
  [BoardIdValue in keyof BoardStateById]: ManifestArrayElement<
    BoardStateById[BoardIdValue]["relations"]
  >;
};

export type BoardRelationState<BoardIdValue extends BoardId = BoardId> =
  BoardIdValue extends keyof BoardRelationStateByBoardId
    ? BoardRelationStateByBoardId[BoardIdValue]
    : never;

export type BoardRelationFields<BoardIdValue extends BoardId = BoardId> =
  BoardRelationState<BoardIdValue> extends { fields: infer Fields }
    ? Fields
    : never;

export type BoardContainerStateByBoardId = {
  [BoardIdValue in keyof BoardStateById]: ManifestRecordValue<
    BoardStateById[BoardIdValue]["containers"]
  >;
};

export type BoardContainerState<BoardIdValue extends BoardId = BoardId> =
  BoardIdValue extends keyof BoardContainerStateByBoardId
    ? BoardContainerStateByBoardId[BoardIdValue]
    : never;

export type BoardContainerFields<BoardIdValue extends BoardId = BoardId> =
  BoardContainerState<BoardIdValue> extends { fields: infer Fields }
    ? Fields
    : never;

type HexAuthoredEdgesByBoardId = typeof authoredHexEdgesByBoardIdLookup;
type HexAuthoredVerticesByBoardId = typeof authoredHexVerticesByBoardIdLookup;

export type HexAuthoredEdgeState<
  BoardIdValue extends keyof HexAuthoredEdgesByBoardId = keyof HexAuthoredEdgesByBoardId,
> = BoardIdValue extends keyof HexAuthoredEdgesByBoardId
  ? ManifestArrayElement<HexAuthoredEdgesByBoardId[BoardIdValue]>
  : never;

export type HexAuthoredEdgeRef<
  BoardIdValue extends keyof HexAuthoredEdgesByBoardId = keyof HexAuthoredEdgesByBoardId,
> = HexAuthoredEdgeState<BoardIdValue> extends { ref: infer Ref } ? Ref : never;

export type HexAuthoredVertexState<
  BoardIdValue extends keyof HexAuthoredVerticesByBoardId = keyof HexAuthoredVerticesByBoardId,
> = BoardIdValue extends keyof HexAuthoredVerticesByBoardId
  ? ManifestArrayElement<HexAuthoredVerticesByBoardId[BoardIdValue]>
  : never;

export type HexAuthoredVertexRef<
  BoardIdValue extends keyof HexAuthoredVerticesByBoardId = keyof HexAuthoredVerticesByBoardId,
> = HexAuthoredVertexState<BoardIdValue> extends { ref: infer Ref }
  ? Ref
  : never;

export type HexEdgeState<
  BoardIdValue extends keyof HexBoardStateById = keyof HexBoardStateById,
> = BoardIdValue extends keyof HexBoardStateById
  ? ManifestArrayElement<HexBoardStateById[BoardIdValue]["edges"]>
  : never;

export type HexEdgeFields<
  BoardIdValue extends keyof HexBoardStateById = keyof HexBoardStateById,
> = HexEdgeState<BoardIdValue> extends { fields: infer Fields }
  ? Fields
  : never;

export type HexVertexState<
  BoardIdValue extends keyof HexBoardStateById = keyof HexBoardStateById,
> = BoardIdValue extends keyof HexBoardStateById
  ? ManifestArrayElement<HexBoardStateById[BoardIdValue]["vertices"]>
  : never;

export type HexVertexFields<
  BoardIdValue extends keyof HexBoardStateById = keyof HexBoardStateById,
> = HexVertexState<BoardIdValue> extends { fields: infer Fields }
  ? Fields
  : never;

export type SquareEdgeState<
  BoardIdValue extends keyof SquareBoardStateById = keyof SquareBoardStateById,
> = BoardIdValue extends keyof SquareBoardStateById
  ? ManifestArrayElement<SquareBoardStateById[BoardIdValue]["edges"]>
  : never;

export type SquareEdgeFields<
  BoardIdValue extends keyof SquareBoardStateById = keyof SquareBoardStateById,
> = SquareEdgeState<BoardIdValue> extends { fields: infer Fields }
  ? Fields
  : never;

export type SquareVertexState<
  BoardIdValue extends keyof SquareBoardStateById = keyof SquareBoardStateById,
> = BoardIdValue extends keyof SquareBoardStateById
  ? ManifestArrayElement<SquareBoardStateById[BoardIdValue]["vertices"]>
  : never;

export type SquareVertexFields<
  BoardIdValue extends keyof SquareBoardStateById = keyof SquareBoardStateById,
> = SquareVertexState<BoardIdValue> extends { fields: infer Fields }
  ? Fields
  : never;

export type TiledBoardId = keyof HexBoardStateById | keyof SquareBoardStateById;

export type TiledEdgeState<BoardIdValue extends TiledBoardId = TiledBoardId> =
  BoardIdValue extends keyof HexBoardStateById
    ? HexEdgeState<BoardIdValue>
    : BoardIdValue extends keyof SquareBoardStateById
      ? SquareEdgeState<BoardIdValue>
      : never;

export type TiledEdgeFields<BoardIdValue extends TiledBoardId = TiledBoardId> =
  TiledEdgeState<BoardIdValue> extends { fields: infer Fields }
    ? Fields
    : never;

export type TiledVertexState<
  BoardIdValue extends TiledBoardId = TiledBoardId,
> = BoardIdValue extends keyof HexBoardStateById
  ? HexVertexState<BoardIdValue>
  : BoardIdValue extends keyof SquareBoardStateById
    ? SquareVertexState<BoardIdValue>
    : never;

export type TiledVertexFields<
  BoardIdValue extends TiledBoardId = TiledBoardId,
> = TiledVertexState<BoardIdValue> extends { fields: infer Fields }
  ? Fields
  : never;

export type BoardStateRecord = BoardStateById[BoardId];

export interface TableState extends RuntimeTableRecord {
  playerOrder: PlayerId[];
  zones: {
    shared: CardIdsBySharedZoneId;
    perPlayer: CardIdsByPlayerZoneId;
    visibility: Record<ZoneId, RuntimeHandVisibilityMode>;
    cardSetIdsByZoneId?: Record<ZoneId, readonly CardSetId[]>;
  };
  decks: CardIdsBySharedZoneId;
  hands: CardIdsByPlayerZoneId;
  handVisibility: Record<PlayerZoneId, RuntimeHandVisibilityMode>;
  cards: CardStateById;
  pieces: PieceStateById;
  componentLocations: Record<ComponentId, RuntimeComponentLocation>;
  ownerOfCard: Record<CardId, PlayerId | null>;
  visibility: Record<CardId, RuntimeCardVisibility>;
  resources: PerPlayer<Record<ResourceId, number>>;
  boards: {
    byId: BoardStateById;
    hex: HexBoardStateById;
    square: SquareBoardStateById;
    network: RuntimeTableRecord["boards"]["network"];
    track: RuntimeTableRecord["boards"]["track"];
  };
  dice: DieStateById;
}

const sharedZoneSchema = z.record(sharedZoneIdSchema, z.array(z.string()));
// PerPlayer<Array<string>> wire shape only: { __perPlayer: true, entries: [[playerId, value], ...] }.
const playerZoneSchema = z.record(
  playerZoneIdSchema,
  perPlayerSchema(z.array(z.string())),
);
const cardStateSchema = z.object({
  componentType: z.string().optional(),
  id: ids.cardId,
  cardSetId: ids.cardSetId,
  cardType: ids.cardType,
  name: z.string().optional(),
  text: z.string().optional(),
  properties: unknownRecordSchema,
});
const cardPropertiesSchemaByCardSetId: Record<string, z.ZodTypeAny> = {
  "tech-cards": TechCardsCardPropertiesSchema,
};
function createCardStateSchema<CardIdValue extends CardId>(
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
}
const cardStateByIdSchema = z.object(
  Object.fromEntries(
    literals.cardIds.map((cardId) => [cardId, createCardStateSchema(cardId)]),
  ) as Record<CardId, z.ZodTypeAny>,
);
const pieceStateByIdSchema = z.object({
  "hub-p1-1": z.object({
    componentType: z.string().optional(),
    id: z.literal("hub-p1-1"),
    pieceTypeId: z.literal("hub"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: HubPieceFieldsSchema,
  }),
  "hub-p1-2": z.object({
    componentType: z.string().optional(),
    id: z.literal("hub-p1-2"),
    pieceTypeId: z.literal("hub"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: HubPieceFieldsSchema,
  }),
  "hub-p1-3": z.object({
    componentType: z.string().optional(),
    id: z.literal("hub-p1-3"),
    pieceTypeId: z.literal("hub"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: HubPieceFieldsSchema,
  }),
  "hub-p1-4": z.object({
    componentType: z.string().optional(),
    id: z.literal("hub-p1-4"),
    pieceTypeId: z.literal("hub"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: HubPieceFieldsSchema,
  }),
  "hub-p2-1": z.object({
    componentType: z.string().optional(),
    id: z.literal("hub-p2-1"),
    pieceTypeId: z.literal("hub"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: HubPieceFieldsSchema,
  }),
  "hub-p2-2": z.object({
    componentType: z.string().optional(),
    id: z.literal("hub-p2-2"),
    pieceTypeId: z.literal("hub"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: HubPieceFieldsSchema,
  }),
  "hub-p2-3": z.object({
    componentType: z.string().optional(),
    id: z.literal("hub-p2-3"),
    pieceTypeId: z.literal("hub"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: HubPieceFieldsSchema,
  }),
  "hub-p2-4": z.object({
    componentType: z.string().optional(),
    id: z.literal("hub-p2-4"),
    pieceTypeId: z.literal("hub"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: HubPieceFieldsSchema,
  }),
  "hub-p3-1": z.object({
    componentType: z.string().optional(),
    id: z.literal("hub-p3-1"),
    pieceTypeId: z.literal("hub"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: HubPieceFieldsSchema,
  }),
  "hub-p3-2": z.object({
    componentType: z.string().optional(),
    id: z.literal("hub-p3-2"),
    pieceTypeId: z.literal("hub"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: HubPieceFieldsSchema,
  }),
  "hub-p3-3": z.object({
    componentType: z.string().optional(),
    id: z.literal("hub-p3-3"),
    pieceTypeId: z.literal("hub"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: HubPieceFieldsSchema,
  }),
  "hub-p3-4": z.object({
    componentType: z.string().optional(),
    id: z.literal("hub-p3-4"),
    pieceTypeId: z.literal("hub"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: HubPieceFieldsSchema,
  }),
  "hub-p4-1": z.object({
    componentType: z.string().optional(),
    id: z.literal("hub-p4-1"),
    pieceTypeId: z.literal("hub"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: HubPieceFieldsSchema,
  }),
  "hub-p4-2": z.object({
    componentType: z.string().optional(),
    id: z.literal("hub-p4-2"),
    pieceTypeId: z.literal("hub"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: HubPieceFieldsSchema,
  }),
  "hub-p4-3": z.object({
    componentType: z.string().optional(),
    id: z.literal("hub-p4-3"),
    pieceTypeId: z.literal("hub"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: HubPieceFieldsSchema,
  }),
  "hub-p4-4": z.object({
    componentType: z.string().optional(),
    id: z.literal("hub-p4-4"),
    pieceTypeId: z.literal("hub"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: HubPieceFieldsSchema,
  }),
  "outpost-p1-1": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p1-1"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p1-2": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p1-2"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p1-3": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p1-3"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p1-4": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p1-4"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p1-5": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p1-5"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p2-1": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p2-1"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p2-2": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p2-2"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p2-3": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p2-3"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p2-4": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p2-4"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p2-5": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p2-5"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p3-1": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p3-1"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p3-2": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p3-2"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p3-3": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p3-3"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p3-4": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p3-4"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p3-5": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p3-5"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p4-1": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p4-1"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p4-2": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p4-2"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p4-3": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p4-3"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p4-4": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p4-4"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "outpost-p4-5": z.object({
    componentType: z.string().optional(),
    id: z.literal("outpost-p4-5"),
    pieceTypeId: z.literal("outpost"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: OutpostPieceFieldsSchema,
  }),
  "raider": z.object({
    componentType: z.string().optional(),
    id: z.literal("raider"),
    pieceTypeId: z.literal("raider"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RaiderPieceFieldsSchema,
  }),
  "route-p1-1": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p1-1"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p1-10": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p1-10"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p1-11": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p1-11"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p1-12": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p1-12"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p1-13": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p1-13"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p1-14": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p1-14"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p1-15": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p1-15"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p1-2": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p1-2"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p1-3": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p1-3"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p1-4": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p1-4"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p1-5": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p1-5"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p1-6": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p1-6"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p1-7": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p1-7"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p1-8": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p1-8"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p1-9": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p1-9"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p2-1": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p2-1"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p2-10": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p2-10"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p2-11": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p2-11"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p2-12": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p2-12"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p2-13": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p2-13"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p2-14": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p2-14"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p2-15": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p2-15"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p2-2": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p2-2"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p2-3": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p2-3"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p2-4": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p2-4"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p2-5": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p2-5"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p2-6": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p2-6"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p2-7": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p2-7"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p2-8": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p2-8"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p2-9": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p2-9"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p3-1": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p3-1"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p3-10": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p3-10"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p3-11": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p3-11"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p3-12": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p3-12"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p3-13": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p3-13"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p3-14": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p3-14"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p3-15": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p3-15"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p3-2": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p3-2"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p3-3": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p3-3"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p3-4": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p3-4"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p3-5": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p3-5"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p3-6": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p3-6"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p3-7": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p3-7"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p3-8": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p3-8"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p3-9": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p3-9"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p4-1": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p4-1"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p4-10": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p4-10"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p4-11": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p4-11"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p4-12": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p4-12"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p4-13": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p4-13"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p4-14": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p4-14"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p4-15": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p4-15"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p4-2": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p4-2"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p4-3": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p4-3"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p4-4": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p4-4"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p4-5": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p4-5"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p4-6": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p4-6"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p4-7": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p4-7"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p4-8": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p4-8"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
  "route-p4-9": z.object({
    componentType: z.string().optional(),
    id: z.literal("route-p4-9"),
    pieceTypeId: z.literal("route"),
    pieceName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    properties: RoutePieceFieldsSchema,
  }),
});
const dieStateByIdSchema = z.object({
  "die-1": z.object({
    componentType: z.string().optional(),
    id: z.literal("die-1"),
    dieTypeId: z.literal("d6"),
    dieName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    sides: z.literal(6),
    value: z.number().int().nullable().optional(),
    properties: D6DieFieldsSchema,
  }),
  "die-2": z.object({
    componentType: z.string().optional(),
    id: z.literal("die-2"),
    dieTypeId: z.literal("d6"),
    dieName: z.string().nullable().optional(),
    ownerId: ids.playerId.nullable().optional(),
    sides: z.literal(6),
    value: z.number().int().nullable().optional(),
    properties: D6DieFieldsSchema,
  }),
});
const boardStateByIdSchema = z.object({
  "sector": z.object({
    id: z.literal("sector"),
    baseId: z.literal("sector"),
    layout: z.literal("hex"),
    typeId: ids.boardTypeId.nullable().optional(),
    scope: z.literal("shared"),
    playerId: ids.playerId.nullable().optional(),
    templateId: z.string().nullable().optional(),
    fields: SectorBoardFieldsSchema,
    spaces: z.record(
      ids.spaceId,
      z.object({
        id: ids.spaceId,
        name: z.string().nullable().optional(),
        typeId: ids.spaceTypeId.nullable().optional(),
        q: z.number().int(),
        r: z.number().int(),
        fields: SectorSpaceFieldsSchema,
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
        fields: SectorEdgeFieldsSchema,
      }),
    ),
    vertices: z.array(
      z.object({
        id: ids.vertexId,
        spaceIds: z.array(ids.spaceId).min(1).max(3),
        typeId: ids.vertexTypeId.nullable().optional(),
        label: z.string().nullable().optional(),
        ownerId: ids.playerId.nullable().optional(),
        fields: SectorVertexFieldsSchema,
      }),
    ),
  }),
});
const hexBoardStateByIdSchema = z.object({
  "sector": z.object({
    id: z.literal("sector"),
    baseId: z.literal("sector"),
    layout: z.literal("hex"),
    typeId: ids.boardTypeId.nullable().optional(),
    scope: z.literal("shared"),
    playerId: ids.playerId.nullable().optional(),
    templateId: z.string().nullable().optional(),
    fields: SectorBoardFieldsSchema,
    spaces: z.record(
      ids.spaceId,
      z.object({
        id: ids.spaceId,
        name: z.string().nullable().optional(),
        typeId: ids.spaceTypeId.nullable().optional(),
        q: z.number().int(),
        r: z.number().int(),
        fields: SectorSpaceFieldsSchema,
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
        fields: SectorEdgeFieldsSchema,
      }),
    ),
    vertices: z.array(
      z.object({
        id: ids.vertexId,
        spaceIds: z.array(ids.spaceId).min(1).max(3),
        typeId: ids.vertexTypeId.nullable().optional(),
        label: z.string().nullable().optional(),
        ownerId: ids.playerId.nullable().optional(),
        fields: SectorVertexFieldsSchema,
      }),
    ),
  }),
});
const squareBoardStateByIdSchema = z.object({});
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
    z.union([
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
      host: z.never(),
      slotId: z.never(),
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
  resources: perPlayerSchema(z.record(ids.resourceId, z.number().int())),
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

// Produces an empty PerPlayer<CardId[]> for every player zone. The entries
// array is seeded from the resolved runtime roster so the generated default
// never creates a record for a player the session does not have.
function buildPerPlayerCardIds(
  playerIds: readonly PlayerId[],
): CardIdsByPlayerZoneId {
  return Object.fromEntries(
    literals.playerZoneIds.map((zoneId) => [
      zoneId,
      perPlayer(playerIds, () => [] as CardId[]),
    ]),
  ) as CardIdsByPlayerZoneId;
}

function buildPlayerResources(
  playerIds: readonly PlayerId[],
): PerPlayer<Record<ResourceId, number>> {
  return perPlayer(playerIds, () =>
    Object.fromEntries(
      literals.resourceIds.map((resourceId) => [resourceId, 0]),
    ) as Record<ResourceId, number>,
  );
}

export const defaults = {
  zones: (playerIds?: readonly string[]) => ({
    shared: cloneManifestDefault({"tech-deck":[],"tech-played":[]}),
    perPlayer: buildPerPlayerCardIds(resolveDefaultPlayerIds(playerIds)),
    visibility: cloneManifestDefault({"tech-deck":"hidden","tech-hand":"ownerOnly","tech-played":"public"}),
    cardSetIdsByZoneId: cloneManifestDefault({"tech-deck":["tech-cards"],"tech-hand":["tech-cards"],"tech-played":["tech-cards"]}),
  }) as TableState["zones"],
  decks: () => cloneManifestDefault({"tech-deck":[],"tech-played":[]}) as TableState["decks"],
  hands: (playerIds?: readonly string[]) =>
    buildPerPlayerCardIds(resolveDefaultPlayerIds(playerIds)) as TableState["hands"],
  handVisibility: () => cloneManifestDefault({"tech-hand":"ownerOnly"}) as TableState["handVisibility"],
  ownerOfCard: () => cloneManifestDefault({"bountySurvey-1":null,"bountySurvey-2":null,"jumpGate-1":null,"jumpGate-2":null,"patrol-1":null,"patrol-10":null,"patrol-11":null,"patrol-12":null,"patrol-13":null,"patrol-14":null,"patrol-2":null,"patrol-3":null,"patrol-4":null,"patrol-5":null,"patrol-6":null,"patrol-7":null,"patrol-8":null,"patrol-9":null,"relicCache-1":null,"relicCache-2":null,"relicCache-3":null,"relicCache-4":null,"relicCache-5":null,"signalLock-1":null,"signalLock-2":null}) as TableState["ownerOfCard"],
  visibility: () => cloneManifestDefault({"bountySurvey-1":{"faceUp":true},"bountySurvey-2":{"faceUp":true},"jumpGate-1":{"faceUp":true},"jumpGate-2":{"faceUp":true},"patrol-1":{"faceUp":true},"patrol-10":{"faceUp":true},"patrol-11":{"faceUp":true},"patrol-12":{"faceUp":true},"patrol-13":{"faceUp":true},"patrol-14":{"faceUp":true},"patrol-2":{"faceUp":true},"patrol-3":{"faceUp":true},"patrol-4":{"faceUp":true},"patrol-5":{"faceUp":true},"patrol-6":{"faceUp":true},"patrol-7":{"faceUp":true},"patrol-8":{"faceUp":true},"patrol-9":{"faceUp":true},"relicCache-1":{"faceUp":true},"relicCache-2":{"faceUp":true},"relicCache-3":{"faceUp":true},"relicCache-4":{"faceUp":true},"relicCache-5":{"faceUp":true},"signalLock-1":{"faceUp":true},"signalLock-2":{"faceUp":true}}) as TableState["visibility"],
  resources: (playerIds?: readonly string[]) =>
    buildPlayerResources(resolveDefaultPlayerIds(playerIds)),
} as const;

export const staticBoards = {
  "byId": {
    "sector": {
      "id": "sector",
      "baseId": "sector",
      "layout": "hex",
      "typeId": null,
      "scope": "shared",
      "templateId": "star-sector",
      "fields": {},
      "playerId": null,
      "spaces": {
        "h-0-0": {
          "id": "h-0-0",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 0,
          "r": 0
        },
        "h-1-0": {
          "id": "h-1-0",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 1,
          "r": -1
        },
        "h-1-1": {
          "id": "h-1-1",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 1,
          "r": 0
        },
        "h-1-2": {
          "id": "h-1-2",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 0,
          "r": 1
        },
        "h-1-3": {
          "id": "h-1-3",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": -1,
          "r": 1
        },
        "h-1-4": {
          "id": "h-1-4",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": -1,
          "r": 0
        },
        "h-1-5": {
          "id": "h-1-5",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 0,
          "r": -1
        },
        "h-2-0": {
          "id": "h-2-0",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 2,
          "r": -2
        },
        "h-2-1": {
          "id": "h-2-1",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 2,
          "r": -1
        },
        "h-2-10": {
          "id": "h-2-10",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 0,
          "r": -2
        },
        "h-2-11": {
          "id": "h-2-11",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 1,
          "r": -2
        },
        "h-2-2": {
          "id": "h-2-2",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 2,
          "r": 0
        },
        "h-2-3": {
          "id": "h-2-3",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 1,
          "r": 1
        },
        "h-2-4": {
          "id": "h-2-4",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 0,
          "r": 2
        },
        "h-2-5": {
          "id": "h-2-5",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": -1,
          "r": 2
        },
        "h-2-6": {
          "id": "h-2-6",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": -2,
          "r": 2
        },
        "h-2-7": {
          "id": "h-2-7",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": -2,
          "r": 1
        },
        "h-2-8": {
          "id": "h-2-8",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": -2,
          "r": 0
        },
        "h-2-9": {
          "id": "h-2-9",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": -1,
          "r": -1
        },
        "o-0": {
          "id": "o-0",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 3,
          "r": -3
        },
        "o-1": {
          "id": "o-1",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 3,
          "r": -2
        },
        "o-10": {
          "id": "o-10",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": -3,
          "r": 2
        },
        "o-11": {
          "id": "o-11",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": -3,
          "r": 1
        },
        "o-12": {
          "id": "o-12",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": -3,
          "r": 0
        },
        "o-13": {
          "id": "o-13",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": -2,
          "r": -1
        },
        "o-14": {
          "id": "o-14",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": -1,
          "r": -2
        },
        "o-15": {
          "id": "o-15",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 0,
          "r": -3
        },
        "o-16": {
          "id": "o-16",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 1,
          "r": -3
        },
        "o-17": {
          "id": "o-17",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 2,
          "r": -3
        },
        "o-2": {
          "id": "o-2",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 3,
          "r": -1
        },
        "o-3": {
          "id": "o-3",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 3,
          "r": 0
        },
        "o-4": {
          "id": "o-4",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 2,
          "r": 1
        },
        "o-5": {
          "id": "o-5",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 1,
          "r": 2
        },
        "o-6": {
          "id": "o-6",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 0,
          "r": 3
        },
        "o-7": {
          "id": "o-7",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": -1,
          "r": 3
        },
        "o-8": {
          "id": "o-8",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": -2,
          "r": 3
        },
        "o-9": {
          "id": "o-9",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": -3,
          "r": 3
        }
      },
      "relations": [],
      "containers": {},
      "orientation": "pointy-top",
      "edges": [
        {
          "id": "hex-edge:-1,-1,2::-2,-2,4",
          "spaceIds": [
            "h-1-2",
            "h-1-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-1,2::-2,1,1",
          "spaceIds": [
            "h-0-0",
            "h-1-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-1,2::1,-2,1",
          "spaceIds": [
            "h-0-0",
            "h-1-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-10,11::-2,-8,10",
          "spaceIds": [
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-10,11::1,-11,10",
          "spaceIds": [
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-4,5::-2,-2,4",
          "spaceIds": [
            "h-1-2",
            "h-2-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-4,5::-2,-5,7",
          "spaceIds": [
            "h-2-4",
            "h-2-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-4,5::1,-5,4",
          "spaceIds": [
            "h-1-2",
            "h-2-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-7,8::-2,-5,7",
          "spaceIds": [
            "h-2-4",
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-7,8::-2,-8,10",
          "spaceIds": [
            "o-6",
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-7,8::1,-8,7",
          "spaceIds": [
            "h-2-4",
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,11,-10::-2,10,-8",
          "spaceIds": [
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,11,-10::1,10,-11",
          "spaceIds": [
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,2,-1::-2,1,1",
          "spaceIds": [
            "h-0-0",
            "h-1-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,2,-1::-2,4,-2",
          "spaceIds": [
            "h-1-4",
            "h-1-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,2,-1::1,1,-2",
          "spaceIds": [
            "h-0-0",
            "h-1-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,5,-4::-2,4,-2",
          "spaceIds": [
            "h-1-5",
            "h-2-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,5,-4::-2,7,-5",
          "spaceIds": [
            "h-2-10",
            "h-2-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,5,-4::1,4,-5",
          "spaceIds": [
            "h-1-5",
            "h-2-10"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,8,-7::-2,10,-8",
          "spaceIds": [
            "o-14",
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,8,-7::-2,7,-5",
          "spaceIds": [
            "h-2-10",
            "o-14"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,8,-7::1,7,-8",
          "spaceIds": [
            "h-2-10",
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,-1,11::-11,1,10",
          "spaceIds": [
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,-1,11::-8,-2,10",
          "spaceIds": [
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,11,-1::-11,10,1",
          "spaceIds": [
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,11,-1::-8,10,-2",
          "spaceIds": [
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,2,8::-11,1,10",
          "spaceIds": [
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,2,8::-11,4,7",
          "spaceIds": [
            "o-10"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,2,8::-8,1,7",
          "spaceIds": [
            "o-10",
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,5,5::-11,4,7",
          "spaceIds": [
            "o-10"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,5,5::-11,7,4",
          "spaceIds": [
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,5,5::-8,4,4",
          "spaceIds": [
            "o-10",
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,8,2::-11,10,1",
          "spaceIds": [
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,8,2::-11,7,4",
          "spaceIds": [
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,8,2::-8,7,1",
          "spaceIds": [
            "o-11",
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-2,-2,4::-4,-1,5",
          "spaceIds": [
            "h-1-3",
            "h-2-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-2,-5,7::-4,-4,8",
          "spaceIds": [
            "h-2-5",
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-2,-8,10::-4,-7,11",
          "spaceIds": [
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-2,1,1::-4,2,2",
          "spaceIds": [
            "h-1-3",
            "h-1-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-2,10,-8::-4,11,-7",
          "spaceIds": [
            "o-14"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-2,4,-2::-4,5,-1",
          "spaceIds": [
            "h-1-4",
            "h-2-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-2,7,-5::-4,8,-4",
          "spaceIds": [
            "h-2-9",
            "o-14"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 8
          }
        },
        {
          "id": "hex-edge:-4,-1,5::-5,-2,7",
          "spaceIds": [
            "h-2-5",
            "h-2-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,-1,5::-5,1,4",
          "spaceIds": [
            "h-1-3",
            "h-2-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,-4,8::-5,-2,7",
          "spaceIds": [
            "h-2-5",
            "o-8"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 5
          }
        },
        {
          "id": "hex-edge:-4,-4,8::-5,-5,10",
          "spaceIds": [
            "o-7",
            "o-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,-7,11::-5,-5,10",
          "spaceIds": [
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,11,-7::-5,10,-5",
          "spaceIds": [
            "o-14"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,2,2::-5,1,4",
          "spaceIds": [
            "h-1-3",
            "h-2-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,2,2::-5,4,1",
          "spaceIds": [
            "h-1-4",
            "h-2-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,5,-1::-5,4,1",
          "spaceIds": [
            "h-1-4",
            "h-2-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,5,-1::-5,7,-2",
          "spaceIds": [
            "h-2-8",
            "h-2-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,8,-4::-5,10,-5",
          "spaceIds": [
            "o-13",
            "o-14"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,8,-4::-5,7,-2",
          "spaceIds": [
            "h-2-9",
            "o-13"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-5,-2,7::-7,-1,8",
          "spaceIds": [
            "h-2-6",
            "o-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-5,-5,10::-7,-4,11",
          "spaceIds": [
            "o-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-5,1,4::-7,2,5",
          "spaceIds": [
            "h-2-6",
            "h-2-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-5,10,-5::-7,11,-4",
          "spaceIds": [
            "o-13"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-5,4,1::-7,5,2",
          "spaceIds": [
            "h-2-7",
            "h-2-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-5,7,-2::-7,8,-1",
          "spaceIds": [
            "h-2-8",
            "o-13"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 7
          }
        },
        {
          "id": "hex-edge:-7,-1,8::-8,-2,10",
          "spaceIds": [
            "o-8",
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-7,-1,8::-8,1,7",
          "spaceIds": [
            "h-2-6",
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-7,-4,11::-8,-2,10",
          "spaceIds": [
            "o-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-7,11,-4::-8,10,-2",
          "spaceIds": [
            "o-13"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-7,2,5::-8,1,7",
          "spaceIds": [
            "h-2-6",
            "o-10"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-7,2,5::-8,4,4",
          "spaceIds": [
            "h-2-7",
            "o-10"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 6
          }
        },
        {
          "id": "hex-edge:-7,5,2::-8,4,4",
          "spaceIds": [
            "h-2-7",
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-7,5,2::-8,7,1",
          "spaceIds": [
            "h-2-8",
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-7,8,-1::-8,10,-2",
          "spaceIds": [
            "o-12",
            "o-13"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-7,8,-1::-8,7,1",
          "spaceIds": [
            "h-2-8",
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,-11,10::2,-10,8",
          "spaceIds": [
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,-2,1::2,-1,-1",
          "spaceIds": [
            "h-0-0",
            "h-1-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,-2,1::2,-4,2",
          "spaceIds": [
            "h-1-1",
            "h-1-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,-5,4::2,-4,2",
          "spaceIds": [
            "h-1-2",
            "h-2-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,-5,4::2,-7,5",
          "spaceIds": [
            "h-2-3",
            "h-2-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,-8,7::2,-10,8",
          "spaceIds": [
            "o-5",
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,-8,7::2,-7,5",
          "spaceIds": [
            "h-2-4",
            "o-5"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 4
          }
        },
        {
          "id": "hex-edge:1,1,-2::2,-1,-1",
          "spaceIds": [
            "h-0-0",
            "h-1-0"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,1,-2::2,2,-4",
          "spaceIds": [
            "h-1-0",
            "h-1-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,10,-11::2,8,-10",
          "spaceIds": [
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,4,-5::2,2,-4",
          "spaceIds": [
            "h-1-5",
            "h-2-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,4,-5::2,5,-7",
          "spaceIds": [
            "h-2-10",
            "h-2-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,7,-8::2,5,-7",
          "spaceIds": [
            "h-2-10",
            "o-16"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,7,-8::2,8,-10",
          "spaceIds": [
            "o-15",
            "o-16"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-11,1::11,-10,-1",
          "spaceIds": [
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-11,1::8,-10,2",
          "spaceIds": [
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-2,-8::11,-1,-10",
          "spaceIds": [
            "o-0"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-2,-8::11,-4,-7",
          "spaceIds": [
            "o-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-2,-8::8,-1,-7",
          "spaceIds": [
            "o-0",
            "o-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-5,-5::11,-4,-7",
          "spaceIds": [
            "o-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-5,-5::11,-7,-4",
          "spaceIds": [
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-5,-5::8,-4,-4",
          "spaceIds": [
            "o-1",
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-8,-2::11,-10,-1",
          "spaceIds": [
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-8,-2::11,-7,-4",
          "spaceIds": [
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-8,-2::8,-7,-1",
          "spaceIds": [
            "o-2",
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,1,-11::11,-1,-10",
          "spaceIds": [
            "o-0"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,1,-11::8,2,-10",
          "spaceIds": [
            "o-0"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:2,-1,-1::4,-2,-2",
          "spaceIds": [
            "h-1-0",
            "h-1-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:2,-10,8::4,-11,7",
          "spaceIds": [
            "o-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:2,-4,2::4,-5,1",
          "spaceIds": [
            "h-1-1",
            "h-2-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:2,-7,5::4,-8,4",
          "spaceIds": [
            "h-2-3",
            "o-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:2,2,-4::4,1,-5",
          "spaceIds": [
            "h-1-0",
            "h-2-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:2,5,-7::4,4,-8",
          "spaceIds": [
            "h-2-11",
            "o-16"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 0
          }
        },
        {
          "id": "hex-edge:2,8,-10::4,7,-11",
          "spaceIds": [
            "o-16"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,-11,7::5,-10,5",
          "spaceIds": [
            "o-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,-2,-2::5,-1,-4",
          "spaceIds": [
            "h-1-0",
            "h-2-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,-2,-2::5,-4,-1",
          "spaceIds": [
            "h-1-1",
            "h-2-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,-5,1::5,-4,-1",
          "spaceIds": [
            "h-1-1",
            "h-2-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,-5,1::5,-7,2",
          "spaceIds": [
            "h-2-2",
            "h-2-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,-8,4::5,-10,5",
          "spaceIds": [
            "o-4",
            "o-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,-8,4::5,-7,2",
          "spaceIds": [
            "h-2-3",
            "o-4"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 3
          }
        },
        {
          "id": "hex-edge:4,1,-5::5,-1,-4",
          "spaceIds": [
            "h-1-0",
            "h-2-0"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,1,-5::5,2,-7",
          "spaceIds": [
            "h-2-0",
            "h-2-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,4,-8::5,2,-7",
          "spaceIds": [
            "h-2-11",
            "o-17"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 1
          }
        },
        {
          "id": "hex-edge:4,4,-8::5,5,-10",
          "spaceIds": [
            "o-16",
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,7,-11::5,5,-10",
          "spaceIds": [
            "o-16"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:5,-1,-4::7,-2,-5",
          "spaceIds": [
            "h-2-0",
            "h-2-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:5,-10,5::7,-11,4",
          "spaceIds": [
            "o-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:5,-4,-1::7,-5,-2",
          "spaceIds": [
            "h-2-1",
            "h-2-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:5,-7,2::7,-8,1",
          "spaceIds": [
            "h-2-2",
            "o-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:5,2,-7::7,1,-8",
          "spaceIds": [
            "h-2-0",
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:5,5,-10::7,4,-11",
          "spaceIds": [
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,-11,4::8,-10,2",
          "spaceIds": [
            "o-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,-2,-5::8,-1,-7",
          "spaceIds": [
            "h-2-0",
            "o-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,-2,-5::8,-4,-4",
          "spaceIds": [
            "h-2-1",
            "o-1"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 2
          }
        },
        {
          "id": "hex-edge:7,-5,-2::8,-4,-4",
          "spaceIds": [
            "h-2-1",
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,-5,-2::8,-7,-1",
          "spaceIds": [
            "h-2-2",
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,-8,1::8,-10,2",
          "spaceIds": [
            "o-3",
            "o-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,-8,1::8,-7,-1",
          "spaceIds": [
            "h-2-2",
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,1,-8::8,-1,-7",
          "spaceIds": [
            "h-2-0",
            "o-0"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,1,-8::8,2,-10",
          "spaceIds": [
            "o-0",
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,4,-11::8,2,-10",
          "spaceIds": [
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        }
      ],
      "vertices": [
        {
          "id": "hex-vertex:-1,-1,2",
          "spaceIds": [
            "h-0-0",
            "h-1-2",
            "h-1-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-1,-10,11",
          "spaceIds": [
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-1,-4,5",
          "spaceIds": [
            "h-1-2",
            "h-2-4",
            "h-2-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-1,-7,8",
          "spaceIds": [
            "h-2-4",
            "o-6",
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-1,11,-10",
          "spaceIds": [
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-1,2,-1",
          "spaceIds": [
            "h-0-0",
            "h-1-4",
            "h-1-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-1,5,-4",
          "spaceIds": [
            "h-1-5",
            "h-2-10",
            "h-2-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-1,8,-7",
          "spaceIds": [
            "h-2-10",
            "o-14",
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-10,-1,11",
          "spaceIds": [
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-10,11,-1",
          "spaceIds": [
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-10,2,8",
          "spaceIds": [
            "o-10",
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-10,5,5",
          "spaceIds": [
            "o-10",
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-10,8,2",
          "spaceIds": [
            "o-11",
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-11,1,10",
          "spaceIds": [
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-11,10,1",
          "spaceIds": [
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-11,4,7",
          "spaceIds": [
            "o-10"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-11,7,4",
          "spaceIds": [
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-2,-2,4",
          "spaceIds": [
            "h-1-2",
            "h-1-3",
            "h-2-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-2,-5,7",
          "spaceIds": [
            "h-2-4",
            "h-2-5",
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-2,-8,10",
          "spaceIds": [
            "o-6",
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-2,1,1",
          "spaceIds": [
            "h-0-0",
            "h-1-3",
            "h-1-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-2,10,-8",
          "spaceIds": [
            "o-14",
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-2,4,-2",
          "spaceIds": [
            "h-1-4",
            "h-1-5",
            "h-2-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-2,7,-5",
          "spaceIds": [
            "h-2-10",
            "h-2-9",
            "o-14"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-4,-1,5",
          "spaceIds": [
            "h-1-3",
            "h-2-5",
            "h-2-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-4,-4,8",
          "spaceIds": [
            "h-2-5",
            "o-7",
            "o-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-4,-7,11",
          "spaceIds": [
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-4,11,-7",
          "spaceIds": [
            "o-14"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-4,2,2",
          "spaceIds": [
            "h-1-3",
            "h-1-4",
            "h-2-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-4,5,-1",
          "spaceIds": [
            "h-1-4",
            "h-2-8",
            "h-2-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-4,8,-4",
          "spaceIds": [
            "h-2-9",
            "o-13",
            "o-14"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-5,-2,7",
          "spaceIds": [
            "h-2-5",
            "h-2-6",
            "o-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-5,-5,10",
          "spaceIds": [
            "o-7",
            "o-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-5,1,4",
          "spaceIds": [
            "h-1-3",
            "h-2-6",
            "h-2-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-5,10,-5",
          "spaceIds": [
            "o-13",
            "o-14"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-5,4,1",
          "spaceIds": [
            "h-1-4",
            "h-2-7",
            "h-2-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-5,7,-2",
          "spaceIds": [
            "h-2-8",
            "h-2-9",
            "o-13"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-7,-1,8",
          "spaceIds": [
            "h-2-6",
            "o-8",
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-7,-4,11",
          "spaceIds": [
            "o-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-7,11,-4",
          "spaceIds": [
            "o-13"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-7,2,5",
          "spaceIds": [
            "h-2-6",
            "h-2-7",
            "o-10"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-7,5,2",
          "spaceIds": [
            "h-2-7",
            "h-2-8",
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-7,8,-1",
          "spaceIds": [
            "h-2-8",
            "o-12",
            "o-13"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-8,-2,10",
          "spaceIds": [
            "o-8",
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-8,1,7",
          "spaceIds": [
            "h-2-6",
            "o-10",
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-8,10,-2",
          "spaceIds": [
            "o-12",
            "o-13"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-8,4,4",
          "spaceIds": [
            "h-2-7",
            "o-10",
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-8,7,1",
          "spaceIds": [
            "h-2-8",
            "o-11",
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:1,-11,10",
          "spaceIds": [
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:1,-2,1",
          "spaceIds": [
            "h-0-0",
            "h-1-1",
            "h-1-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:1,-5,4",
          "spaceIds": [
            "h-1-2",
            "h-2-3",
            "h-2-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:1,-8,7",
          "spaceIds": [
            "h-2-4",
            "o-5",
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:1,1,-2",
          "spaceIds": [
            "h-0-0",
            "h-1-0",
            "h-1-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:1,10,-11",
          "spaceIds": [
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:1,4,-5",
          "spaceIds": [
            "h-1-5",
            "h-2-10",
            "h-2-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:1,7,-8",
          "spaceIds": [
            "h-2-10",
            "o-15",
            "o-16"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:10,-11,1",
          "spaceIds": [
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:10,-2,-8",
          "spaceIds": [
            "o-0",
            "o-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:10,-5,-5",
          "spaceIds": [
            "o-1",
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:10,-8,-2",
          "spaceIds": [
            "o-2",
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:10,1,-11",
          "spaceIds": [
            "o-0"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:11,-1,-10",
          "spaceIds": [
            "o-0"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:11,-10,-1",
          "spaceIds": [
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:11,-4,-7",
          "spaceIds": [
            "o-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:11,-7,-4",
          "spaceIds": [
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:2,-1,-1",
          "spaceIds": [
            "h-0-0",
            "h-1-0",
            "h-1-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:2,-10,8",
          "spaceIds": [
            "o-5",
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:2,-4,2",
          "spaceIds": [
            "h-1-1",
            "h-1-2",
            "h-2-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:2,-7,5",
          "spaceIds": [
            "h-2-3",
            "h-2-4",
            "o-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:2,2,-4",
          "spaceIds": [
            "h-1-0",
            "h-1-5",
            "h-2-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:2,5,-7",
          "spaceIds": [
            "h-2-10",
            "h-2-11",
            "o-16"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:2,8,-10",
          "spaceIds": [
            "o-15",
            "o-16"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:4,-11,7",
          "spaceIds": [
            "o-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:4,-2,-2",
          "spaceIds": [
            "h-1-0",
            "h-1-1",
            "h-2-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:4,-5,1",
          "spaceIds": [
            "h-1-1",
            "h-2-2",
            "h-2-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:4,-8,4",
          "spaceIds": [
            "h-2-3",
            "o-4",
            "o-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:4,1,-5",
          "spaceIds": [
            "h-1-0",
            "h-2-0",
            "h-2-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:4,4,-8",
          "spaceIds": [
            "h-2-11",
            "o-16",
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:4,7,-11",
          "spaceIds": [
            "o-16"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:5,-1,-4",
          "spaceIds": [
            "h-1-0",
            "h-2-0",
            "h-2-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:5,-10,5",
          "spaceIds": [
            "o-4",
            "o-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:5,-4,-1",
          "spaceIds": [
            "h-1-1",
            "h-2-1",
            "h-2-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:5,-7,2",
          "spaceIds": [
            "h-2-2",
            "h-2-3",
            "o-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:5,2,-7",
          "spaceIds": [
            "h-2-0",
            "h-2-11",
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:5,5,-10",
          "spaceIds": [
            "o-16",
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:7,-11,4",
          "spaceIds": [
            "o-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:7,-2,-5",
          "spaceIds": [
            "h-2-0",
            "h-2-1",
            "o-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:7,-5,-2",
          "spaceIds": [
            "h-2-1",
            "h-2-2",
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:7,-8,1",
          "spaceIds": [
            "h-2-2",
            "o-3",
            "o-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:7,1,-8",
          "spaceIds": [
            "h-2-0",
            "o-0",
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:7,4,-11",
          "spaceIds": [
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:8,-1,-7",
          "spaceIds": [
            "h-2-0",
            "o-0",
            "o-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:8,-10,2",
          "spaceIds": [
            "o-3",
            "o-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:8,-4,-4",
          "spaceIds": [
            "h-2-1",
            "o-1",
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:8,-7,-1",
          "spaceIds": [
            "h-2-2",
            "o-2",
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:8,2,-10",
          "spaceIds": [
            "o-0",
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        }
      ]
    }
  },
  "hex": {
    "sector": {
      "id": "sector",
      "baseId": "sector",
      "layout": "hex",
      "typeId": null,
      "scope": "shared",
      "templateId": "star-sector",
      "fields": {},
      "playerId": null,
      "spaces": {
        "h-0-0": {
          "id": "h-0-0",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 0,
          "r": 0
        },
        "h-1-0": {
          "id": "h-1-0",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 1,
          "r": -1
        },
        "h-1-1": {
          "id": "h-1-1",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 1,
          "r": 0
        },
        "h-1-2": {
          "id": "h-1-2",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 0,
          "r": 1
        },
        "h-1-3": {
          "id": "h-1-3",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": -1,
          "r": 1
        },
        "h-1-4": {
          "id": "h-1-4",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": -1,
          "r": 0
        },
        "h-1-5": {
          "id": "h-1-5",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 0,
          "r": -1
        },
        "h-2-0": {
          "id": "h-2-0",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 2,
          "r": -2
        },
        "h-2-1": {
          "id": "h-2-1",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 2,
          "r": -1
        },
        "h-2-10": {
          "id": "h-2-10",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 0,
          "r": -2
        },
        "h-2-11": {
          "id": "h-2-11",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 1,
          "r": -2
        },
        "h-2-2": {
          "id": "h-2-2",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 2,
          "r": 0
        },
        "h-2-3": {
          "id": "h-2-3",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 1,
          "r": 1
        },
        "h-2-4": {
          "id": "h-2-4",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": 0,
          "r": 2
        },
        "h-2-5": {
          "id": "h-2-5",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": -1,
          "r": 2
        },
        "h-2-6": {
          "id": "h-2-6",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": -2,
          "r": 2
        },
        "h-2-7": {
          "id": "h-2-7",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": -2,
          "r": 1
        },
        "h-2-8": {
          "id": "h-2-8",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": -2,
          "r": 0
        },
        "h-2-9": {
          "id": "h-2-9",
          "name": null,
          "typeId": "land",
          "fields": {},
          "zoneId": null,
          "q": -1,
          "r": -1
        },
        "o-0": {
          "id": "o-0",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 3,
          "r": -3
        },
        "o-1": {
          "id": "o-1",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 3,
          "r": -2
        },
        "o-10": {
          "id": "o-10",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": -3,
          "r": 2
        },
        "o-11": {
          "id": "o-11",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": -3,
          "r": 1
        },
        "o-12": {
          "id": "o-12",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": -3,
          "r": 0
        },
        "o-13": {
          "id": "o-13",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": -2,
          "r": -1
        },
        "o-14": {
          "id": "o-14",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": -1,
          "r": -2
        },
        "o-15": {
          "id": "o-15",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 0,
          "r": -3
        },
        "o-16": {
          "id": "o-16",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 1,
          "r": -3
        },
        "o-17": {
          "id": "o-17",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 2,
          "r": -3
        },
        "o-2": {
          "id": "o-2",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 3,
          "r": -1
        },
        "o-3": {
          "id": "o-3",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 3,
          "r": 0
        },
        "o-4": {
          "id": "o-4",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 2,
          "r": 1
        },
        "o-5": {
          "id": "o-5",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 1,
          "r": 2
        },
        "o-6": {
          "id": "o-6",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": 0,
          "r": 3
        },
        "o-7": {
          "id": "o-7",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": -1,
          "r": 3
        },
        "o-8": {
          "id": "o-8",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": -2,
          "r": 3
        },
        "o-9": {
          "id": "o-9",
          "name": null,
          "typeId": "deepSpace",
          "fields": {},
          "zoneId": null,
          "q": -3,
          "r": 3
        }
      },
      "relations": [],
      "containers": {},
      "orientation": "pointy-top",
      "edges": [
        {
          "id": "hex-edge:-1,-1,2::-2,-2,4",
          "spaceIds": [
            "h-1-2",
            "h-1-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-1,2::-2,1,1",
          "spaceIds": [
            "h-0-0",
            "h-1-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-1,2::1,-2,1",
          "spaceIds": [
            "h-0-0",
            "h-1-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-10,11::-2,-8,10",
          "spaceIds": [
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-10,11::1,-11,10",
          "spaceIds": [
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-4,5::-2,-2,4",
          "spaceIds": [
            "h-1-2",
            "h-2-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-4,5::-2,-5,7",
          "spaceIds": [
            "h-2-4",
            "h-2-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-4,5::1,-5,4",
          "spaceIds": [
            "h-1-2",
            "h-2-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-7,8::-2,-5,7",
          "spaceIds": [
            "h-2-4",
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-7,8::-2,-8,10",
          "spaceIds": [
            "o-6",
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,-7,8::1,-8,7",
          "spaceIds": [
            "h-2-4",
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,11,-10::-2,10,-8",
          "spaceIds": [
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,11,-10::1,10,-11",
          "spaceIds": [
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,2,-1::-2,1,1",
          "spaceIds": [
            "h-0-0",
            "h-1-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,2,-1::-2,4,-2",
          "spaceIds": [
            "h-1-4",
            "h-1-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,2,-1::1,1,-2",
          "spaceIds": [
            "h-0-0",
            "h-1-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,5,-4::-2,4,-2",
          "spaceIds": [
            "h-1-5",
            "h-2-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,5,-4::-2,7,-5",
          "spaceIds": [
            "h-2-10",
            "h-2-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,5,-4::1,4,-5",
          "spaceIds": [
            "h-1-5",
            "h-2-10"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,8,-7::-2,10,-8",
          "spaceIds": [
            "o-14",
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,8,-7::-2,7,-5",
          "spaceIds": [
            "h-2-10",
            "o-14"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-1,8,-7::1,7,-8",
          "spaceIds": [
            "h-2-10",
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,-1,11::-11,1,10",
          "spaceIds": [
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,-1,11::-8,-2,10",
          "spaceIds": [
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,11,-1::-11,10,1",
          "spaceIds": [
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,11,-1::-8,10,-2",
          "spaceIds": [
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,2,8::-11,1,10",
          "spaceIds": [
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,2,8::-11,4,7",
          "spaceIds": [
            "o-10"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,2,8::-8,1,7",
          "spaceIds": [
            "o-10",
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,5,5::-11,4,7",
          "spaceIds": [
            "o-10"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,5,5::-11,7,4",
          "spaceIds": [
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,5,5::-8,4,4",
          "spaceIds": [
            "o-10",
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,8,2::-11,10,1",
          "spaceIds": [
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,8,2::-11,7,4",
          "spaceIds": [
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-10,8,2::-8,7,1",
          "spaceIds": [
            "o-11",
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-2,-2,4::-4,-1,5",
          "spaceIds": [
            "h-1-3",
            "h-2-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-2,-5,7::-4,-4,8",
          "spaceIds": [
            "h-2-5",
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-2,-8,10::-4,-7,11",
          "spaceIds": [
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-2,1,1::-4,2,2",
          "spaceIds": [
            "h-1-3",
            "h-1-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-2,10,-8::-4,11,-7",
          "spaceIds": [
            "o-14"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-2,4,-2::-4,5,-1",
          "spaceIds": [
            "h-1-4",
            "h-2-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-2,7,-5::-4,8,-4",
          "spaceIds": [
            "h-2-9",
            "o-14"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 8
          }
        },
        {
          "id": "hex-edge:-4,-1,5::-5,-2,7",
          "spaceIds": [
            "h-2-5",
            "h-2-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,-1,5::-5,1,4",
          "spaceIds": [
            "h-1-3",
            "h-2-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,-4,8::-5,-2,7",
          "spaceIds": [
            "h-2-5",
            "o-8"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 5
          }
        },
        {
          "id": "hex-edge:-4,-4,8::-5,-5,10",
          "spaceIds": [
            "o-7",
            "o-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,-7,11::-5,-5,10",
          "spaceIds": [
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,11,-7::-5,10,-5",
          "spaceIds": [
            "o-14"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,2,2::-5,1,4",
          "spaceIds": [
            "h-1-3",
            "h-2-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,2,2::-5,4,1",
          "spaceIds": [
            "h-1-4",
            "h-2-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,5,-1::-5,4,1",
          "spaceIds": [
            "h-1-4",
            "h-2-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,5,-1::-5,7,-2",
          "spaceIds": [
            "h-2-8",
            "h-2-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,8,-4::-5,10,-5",
          "spaceIds": [
            "o-13",
            "o-14"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-4,8,-4::-5,7,-2",
          "spaceIds": [
            "h-2-9",
            "o-13"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-5,-2,7::-7,-1,8",
          "spaceIds": [
            "h-2-6",
            "o-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-5,-5,10::-7,-4,11",
          "spaceIds": [
            "o-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-5,1,4::-7,2,5",
          "spaceIds": [
            "h-2-6",
            "h-2-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-5,10,-5::-7,11,-4",
          "spaceIds": [
            "o-13"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-5,4,1::-7,5,2",
          "spaceIds": [
            "h-2-7",
            "h-2-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-5,7,-2::-7,8,-1",
          "spaceIds": [
            "h-2-8",
            "o-13"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 7
          }
        },
        {
          "id": "hex-edge:-7,-1,8::-8,-2,10",
          "spaceIds": [
            "o-8",
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-7,-1,8::-8,1,7",
          "spaceIds": [
            "h-2-6",
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-7,-4,11::-8,-2,10",
          "spaceIds": [
            "o-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-7,11,-4::-8,10,-2",
          "spaceIds": [
            "o-13"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-7,2,5::-8,1,7",
          "spaceIds": [
            "h-2-6",
            "o-10"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-7,2,5::-8,4,4",
          "spaceIds": [
            "h-2-7",
            "o-10"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 6
          }
        },
        {
          "id": "hex-edge:-7,5,2::-8,4,4",
          "spaceIds": [
            "h-2-7",
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-7,5,2::-8,7,1",
          "spaceIds": [
            "h-2-8",
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-7,8,-1::-8,10,-2",
          "spaceIds": [
            "o-12",
            "o-13"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:-7,8,-1::-8,7,1",
          "spaceIds": [
            "h-2-8",
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,-11,10::2,-10,8",
          "spaceIds": [
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,-2,1::2,-1,-1",
          "spaceIds": [
            "h-0-0",
            "h-1-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,-2,1::2,-4,2",
          "spaceIds": [
            "h-1-1",
            "h-1-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,-5,4::2,-4,2",
          "spaceIds": [
            "h-1-2",
            "h-2-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,-5,4::2,-7,5",
          "spaceIds": [
            "h-2-3",
            "h-2-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,-8,7::2,-10,8",
          "spaceIds": [
            "o-5",
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,-8,7::2,-7,5",
          "spaceIds": [
            "h-2-4",
            "o-5"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 4
          }
        },
        {
          "id": "hex-edge:1,1,-2::2,-1,-1",
          "spaceIds": [
            "h-0-0",
            "h-1-0"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,1,-2::2,2,-4",
          "spaceIds": [
            "h-1-0",
            "h-1-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,10,-11::2,8,-10",
          "spaceIds": [
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,4,-5::2,2,-4",
          "spaceIds": [
            "h-1-5",
            "h-2-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,4,-5::2,5,-7",
          "spaceIds": [
            "h-2-10",
            "h-2-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,7,-8::2,5,-7",
          "spaceIds": [
            "h-2-10",
            "o-16"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:1,7,-8::2,8,-10",
          "spaceIds": [
            "o-15",
            "o-16"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-11,1::11,-10,-1",
          "spaceIds": [
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-11,1::8,-10,2",
          "spaceIds": [
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-2,-8::11,-1,-10",
          "spaceIds": [
            "o-0"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-2,-8::11,-4,-7",
          "spaceIds": [
            "o-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-2,-8::8,-1,-7",
          "spaceIds": [
            "o-0",
            "o-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-5,-5::11,-4,-7",
          "spaceIds": [
            "o-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-5,-5::11,-7,-4",
          "spaceIds": [
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-5,-5::8,-4,-4",
          "spaceIds": [
            "o-1",
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-8,-2::11,-10,-1",
          "spaceIds": [
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-8,-2::11,-7,-4",
          "spaceIds": [
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,-8,-2::8,-7,-1",
          "spaceIds": [
            "o-2",
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,1,-11::11,-1,-10",
          "spaceIds": [
            "o-0"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:10,1,-11::8,2,-10",
          "spaceIds": [
            "o-0"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:2,-1,-1::4,-2,-2",
          "spaceIds": [
            "h-1-0",
            "h-1-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:2,-10,8::4,-11,7",
          "spaceIds": [
            "o-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:2,-4,2::4,-5,1",
          "spaceIds": [
            "h-1-1",
            "h-2-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:2,-7,5::4,-8,4",
          "spaceIds": [
            "h-2-3",
            "o-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:2,2,-4::4,1,-5",
          "spaceIds": [
            "h-1-0",
            "h-2-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:2,5,-7::4,4,-8",
          "spaceIds": [
            "h-2-11",
            "o-16"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 0
          }
        },
        {
          "id": "hex-edge:2,8,-10::4,7,-11",
          "spaceIds": [
            "o-16"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,-11,7::5,-10,5",
          "spaceIds": [
            "o-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,-2,-2::5,-1,-4",
          "spaceIds": [
            "h-1-0",
            "h-2-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,-2,-2::5,-4,-1",
          "spaceIds": [
            "h-1-1",
            "h-2-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,-5,1::5,-4,-1",
          "spaceIds": [
            "h-1-1",
            "h-2-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,-5,1::5,-7,2",
          "spaceIds": [
            "h-2-2",
            "h-2-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,-8,4::5,-10,5",
          "spaceIds": [
            "o-4",
            "o-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,-8,4::5,-7,2",
          "spaceIds": [
            "h-2-3",
            "o-4"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 3
          }
        },
        {
          "id": "hex-edge:4,1,-5::5,-1,-4",
          "spaceIds": [
            "h-1-0",
            "h-2-0"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,1,-5::5,2,-7",
          "spaceIds": [
            "h-2-0",
            "h-2-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,4,-8::5,2,-7",
          "spaceIds": [
            "h-2-11",
            "o-17"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 1
          }
        },
        {
          "id": "hex-edge:4,4,-8::5,5,-10",
          "spaceIds": [
            "o-16",
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:4,7,-11::5,5,-10",
          "spaceIds": [
            "o-16"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:5,-1,-4::7,-2,-5",
          "spaceIds": [
            "h-2-0",
            "h-2-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:5,-10,5::7,-11,4",
          "spaceIds": [
            "o-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:5,-4,-1::7,-5,-2",
          "spaceIds": [
            "h-2-1",
            "h-2-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:5,-7,2::7,-8,1",
          "spaceIds": [
            "h-2-2",
            "o-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:5,2,-7::7,1,-8",
          "spaceIds": [
            "h-2-0",
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:5,5,-10::7,4,-11",
          "spaceIds": [
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,-11,4::8,-10,2",
          "spaceIds": [
            "o-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,-2,-5::8,-1,-7",
          "spaceIds": [
            "h-2-0",
            "o-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,-2,-5::8,-4,-4",
          "spaceIds": [
            "h-2-1",
            "o-1"
          ],
          "typeId": "relay",
          "label": null,
          "ownerId": null,
          "fields": {
            "relayIndex": 2
          }
        },
        {
          "id": "hex-edge:7,-5,-2::8,-4,-4",
          "spaceIds": [
            "h-2-1",
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,-5,-2::8,-7,-1",
          "spaceIds": [
            "h-2-2",
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,-8,1::8,-10,2",
          "spaceIds": [
            "o-3",
            "o-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,-8,1::8,-7,-1",
          "spaceIds": [
            "h-2-2",
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,1,-8::8,-1,-7",
          "spaceIds": [
            "h-2-0",
            "o-0"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,1,-8::8,2,-10",
          "spaceIds": [
            "o-0",
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-edge:7,4,-11::8,2,-10",
          "spaceIds": [
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        }
      ],
      "vertices": [
        {
          "id": "hex-vertex:-1,-1,2",
          "spaceIds": [
            "h-0-0",
            "h-1-2",
            "h-1-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-1,-10,11",
          "spaceIds": [
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-1,-4,5",
          "spaceIds": [
            "h-1-2",
            "h-2-4",
            "h-2-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-1,-7,8",
          "spaceIds": [
            "h-2-4",
            "o-6",
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-1,11,-10",
          "spaceIds": [
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-1,2,-1",
          "spaceIds": [
            "h-0-0",
            "h-1-4",
            "h-1-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-1,5,-4",
          "spaceIds": [
            "h-1-5",
            "h-2-10",
            "h-2-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-1,8,-7",
          "spaceIds": [
            "h-2-10",
            "o-14",
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-10,-1,11",
          "spaceIds": [
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-10,11,-1",
          "spaceIds": [
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-10,2,8",
          "spaceIds": [
            "o-10",
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-10,5,5",
          "spaceIds": [
            "o-10",
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-10,8,2",
          "spaceIds": [
            "o-11",
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-11,1,10",
          "spaceIds": [
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-11,10,1",
          "spaceIds": [
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-11,4,7",
          "spaceIds": [
            "o-10"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-11,7,4",
          "spaceIds": [
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-2,-2,4",
          "spaceIds": [
            "h-1-2",
            "h-1-3",
            "h-2-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-2,-5,7",
          "spaceIds": [
            "h-2-4",
            "h-2-5",
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-2,-8,10",
          "spaceIds": [
            "o-6",
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-2,1,1",
          "spaceIds": [
            "h-0-0",
            "h-1-3",
            "h-1-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-2,10,-8",
          "spaceIds": [
            "o-14",
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-2,4,-2",
          "spaceIds": [
            "h-1-4",
            "h-1-5",
            "h-2-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-2,7,-5",
          "spaceIds": [
            "h-2-10",
            "h-2-9",
            "o-14"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-4,-1,5",
          "spaceIds": [
            "h-1-3",
            "h-2-5",
            "h-2-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-4,-4,8",
          "spaceIds": [
            "h-2-5",
            "o-7",
            "o-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-4,-7,11",
          "spaceIds": [
            "o-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-4,11,-7",
          "spaceIds": [
            "o-14"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-4,2,2",
          "spaceIds": [
            "h-1-3",
            "h-1-4",
            "h-2-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-4,5,-1",
          "spaceIds": [
            "h-1-4",
            "h-2-8",
            "h-2-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-4,8,-4",
          "spaceIds": [
            "h-2-9",
            "o-13",
            "o-14"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-5,-2,7",
          "spaceIds": [
            "h-2-5",
            "h-2-6",
            "o-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-5,-5,10",
          "spaceIds": [
            "o-7",
            "o-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-5,1,4",
          "spaceIds": [
            "h-1-3",
            "h-2-6",
            "h-2-7"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-5,10,-5",
          "spaceIds": [
            "o-13",
            "o-14"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-5,4,1",
          "spaceIds": [
            "h-1-4",
            "h-2-7",
            "h-2-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-5,7,-2",
          "spaceIds": [
            "h-2-8",
            "h-2-9",
            "o-13"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-7,-1,8",
          "spaceIds": [
            "h-2-6",
            "o-8",
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-7,-4,11",
          "spaceIds": [
            "o-8"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-7,11,-4",
          "spaceIds": [
            "o-13"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-7,2,5",
          "spaceIds": [
            "h-2-6",
            "h-2-7",
            "o-10"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-7,5,2",
          "spaceIds": [
            "h-2-7",
            "h-2-8",
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-7,8,-1",
          "spaceIds": [
            "h-2-8",
            "o-12",
            "o-13"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-8,-2,10",
          "spaceIds": [
            "o-8",
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-8,1,7",
          "spaceIds": [
            "h-2-6",
            "o-10",
            "o-9"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-8,10,-2",
          "spaceIds": [
            "o-12",
            "o-13"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-8,4,4",
          "spaceIds": [
            "h-2-7",
            "o-10",
            "o-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:-8,7,1",
          "spaceIds": [
            "h-2-8",
            "o-11",
            "o-12"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:1,-11,10",
          "spaceIds": [
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:1,-2,1",
          "spaceIds": [
            "h-0-0",
            "h-1-1",
            "h-1-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:1,-5,4",
          "spaceIds": [
            "h-1-2",
            "h-2-3",
            "h-2-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:1,-8,7",
          "spaceIds": [
            "h-2-4",
            "o-5",
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:1,1,-2",
          "spaceIds": [
            "h-0-0",
            "h-1-0",
            "h-1-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:1,10,-11",
          "spaceIds": [
            "o-15"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:1,4,-5",
          "spaceIds": [
            "h-1-5",
            "h-2-10",
            "h-2-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:1,7,-8",
          "spaceIds": [
            "h-2-10",
            "o-15",
            "o-16"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:10,-11,1",
          "spaceIds": [
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:10,-2,-8",
          "spaceIds": [
            "o-0",
            "o-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:10,-5,-5",
          "spaceIds": [
            "o-1",
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:10,-8,-2",
          "spaceIds": [
            "o-2",
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:10,1,-11",
          "spaceIds": [
            "o-0"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:11,-1,-10",
          "spaceIds": [
            "o-0"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:11,-10,-1",
          "spaceIds": [
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:11,-4,-7",
          "spaceIds": [
            "o-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:11,-7,-4",
          "spaceIds": [
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:2,-1,-1",
          "spaceIds": [
            "h-0-0",
            "h-1-0",
            "h-1-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:2,-10,8",
          "spaceIds": [
            "o-5",
            "o-6"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:2,-4,2",
          "spaceIds": [
            "h-1-1",
            "h-1-2",
            "h-2-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:2,-7,5",
          "spaceIds": [
            "h-2-3",
            "h-2-4",
            "o-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:2,2,-4",
          "spaceIds": [
            "h-1-0",
            "h-1-5",
            "h-2-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:2,5,-7",
          "spaceIds": [
            "h-2-10",
            "h-2-11",
            "o-16"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:2,8,-10",
          "spaceIds": [
            "o-15",
            "o-16"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:4,-11,7",
          "spaceIds": [
            "o-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:4,-2,-2",
          "spaceIds": [
            "h-1-0",
            "h-1-1",
            "h-2-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:4,-5,1",
          "spaceIds": [
            "h-1-1",
            "h-2-2",
            "h-2-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:4,-8,4",
          "spaceIds": [
            "h-2-3",
            "o-4",
            "o-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:4,1,-5",
          "spaceIds": [
            "h-1-0",
            "h-2-0",
            "h-2-11"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:4,4,-8",
          "spaceIds": [
            "h-2-11",
            "o-16",
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:4,7,-11",
          "spaceIds": [
            "o-16"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:5,-1,-4",
          "spaceIds": [
            "h-1-0",
            "h-2-0",
            "h-2-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:5,-10,5",
          "spaceIds": [
            "o-4",
            "o-5"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:5,-4,-1",
          "spaceIds": [
            "h-1-1",
            "h-2-1",
            "h-2-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:5,-7,2",
          "spaceIds": [
            "h-2-2",
            "h-2-3",
            "o-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:5,2,-7",
          "spaceIds": [
            "h-2-0",
            "h-2-11",
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:5,5,-10",
          "spaceIds": [
            "o-16",
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:7,-11,4",
          "spaceIds": [
            "o-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:7,-2,-5",
          "spaceIds": [
            "h-2-0",
            "h-2-1",
            "o-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:7,-5,-2",
          "spaceIds": [
            "h-2-1",
            "h-2-2",
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:7,-8,1",
          "spaceIds": [
            "h-2-2",
            "o-3",
            "o-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:7,1,-8",
          "spaceIds": [
            "h-2-0",
            "o-0",
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:7,4,-11",
          "spaceIds": [
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:8,-1,-7",
          "spaceIds": [
            "h-2-0",
            "o-0",
            "o-1"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:8,-10,2",
          "spaceIds": [
            "o-3",
            "o-4"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:8,-4,-4",
          "spaceIds": [
            "h-2-1",
            "o-1",
            "o-2"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:8,-7,-1",
          "spaceIds": [
            "h-2-2",
            "o-2",
            "o-3"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        },
        {
          "id": "hex-vertex:8,2,-10",
          "spaceIds": [
            "o-0",
            "o-17"
          ],
          "typeId": null,
          "label": null,
          "ownerId": null,
          "fields": {}
        }
      ]
    }
  },
  "square": {}
} as const;

const baseInitialTable = {
  "playerOrder": [
    "player-1",
    "player-2",
    "player-3",
    "player-4"
  ],
  "zones": {
    "shared": {
      "tech-deck": [
        "patrol-1",
        "patrol-2",
        "patrol-3",
        "patrol-4",
        "patrol-5",
        "patrol-6",
        "patrol-7",
        "patrol-8",
        "patrol-9",
        "patrol-10",
        "patrol-11",
        "patrol-12",
        "patrol-13",
        "patrol-14",
        "jumpGate-1",
        "jumpGate-2",
        "bountySurvey-1",
        "bountySurvey-2",
        "signalLock-1",
        "signalLock-2",
        "relicCache-1",
        "relicCache-2",
        "relicCache-3",
        "relicCache-4",
        "relicCache-5"
      ],
      "tech-played": []
    },
    "perPlayer": {
      "tech-hand": {
        "__perPlayer": true,
        "entries": [
          [
            "player-1",
            []
          ],
          [
            "player-2",
            []
          ],
          [
            "player-3",
            []
          ],
          [
            "player-4",
            []
          ]
        ]
      }
    },
    "visibility": {
      "tech-deck": "hidden",
      "tech-hand": "ownerOnly",
      "tech-played": "public"
    },
    "cardSetIdsByZoneId": {
      "tech-deck": [
        "tech-cards"
      ],
      "tech-hand": [
        "tech-cards"
      ],
      "tech-played": [
        "tech-cards"
      ]
    }
  },
  "decks": {
    "tech-deck": [
      "patrol-1",
      "patrol-2",
      "patrol-3",
      "patrol-4",
      "patrol-5",
      "patrol-6",
      "patrol-7",
      "patrol-8",
      "patrol-9",
      "patrol-10",
      "patrol-11",
      "patrol-12",
      "patrol-13",
      "patrol-14",
      "jumpGate-1",
      "jumpGate-2",
      "bountySurvey-1",
      "bountySurvey-2",
      "signalLock-1",
      "signalLock-2",
      "relicCache-1",
      "relicCache-2",
      "relicCache-3",
      "relicCache-4",
      "relicCache-5"
    ],
    "tech-played": []
  },
  "hands": {
    "tech-hand": {
      "__perPlayer": true,
      "entries": [
        [
          "player-1",
          []
        ],
        [
          "player-2",
          []
        ],
        [
          "player-3",
          []
        ],
        [
          "player-4",
          []
        ]
      ]
    }
  },
  "handVisibility": {
    "tech-hand": "ownerOnly"
  },
  "cards": {
    "patrol-1": {
      "id": "patrol-1",
      "cardSetId": "tech-cards",
      "cardType": "patrol",
      "name": "Patrol",
      "properties": {
        "cardType": "patrol"
      }
    },
    "patrol-2": {
      "id": "patrol-2",
      "cardSetId": "tech-cards",
      "cardType": "patrol",
      "name": "Patrol",
      "properties": {
        "cardType": "patrol"
      }
    },
    "patrol-3": {
      "id": "patrol-3",
      "cardSetId": "tech-cards",
      "cardType": "patrol",
      "name": "Patrol",
      "properties": {
        "cardType": "patrol"
      }
    },
    "patrol-4": {
      "id": "patrol-4",
      "cardSetId": "tech-cards",
      "cardType": "patrol",
      "name": "Patrol",
      "properties": {
        "cardType": "patrol"
      }
    },
    "patrol-5": {
      "id": "patrol-5",
      "cardSetId": "tech-cards",
      "cardType": "patrol",
      "name": "Patrol",
      "properties": {
        "cardType": "patrol"
      }
    },
    "patrol-6": {
      "id": "patrol-6",
      "cardSetId": "tech-cards",
      "cardType": "patrol",
      "name": "Patrol",
      "properties": {
        "cardType": "patrol"
      }
    },
    "patrol-7": {
      "id": "patrol-7",
      "cardSetId": "tech-cards",
      "cardType": "patrol",
      "name": "Patrol",
      "properties": {
        "cardType": "patrol"
      }
    },
    "patrol-8": {
      "id": "patrol-8",
      "cardSetId": "tech-cards",
      "cardType": "patrol",
      "name": "Patrol",
      "properties": {
        "cardType": "patrol"
      }
    },
    "patrol-9": {
      "id": "patrol-9",
      "cardSetId": "tech-cards",
      "cardType": "patrol",
      "name": "Patrol",
      "properties": {
        "cardType": "patrol"
      }
    },
    "patrol-10": {
      "id": "patrol-10",
      "cardSetId": "tech-cards",
      "cardType": "patrol",
      "name": "Patrol",
      "properties": {
        "cardType": "patrol"
      }
    },
    "patrol-11": {
      "id": "patrol-11",
      "cardSetId": "tech-cards",
      "cardType": "patrol",
      "name": "Patrol",
      "properties": {
        "cardType": "patrol"
      }
    },
    "patrol-12": {
      "id": "patrol-12",
      "cardSetId": "tech-cards",
      "cardType": "patrol",
      "name": "Patrol",
      "properties": {
        "cardType": "patrol"
      }
    },
    "patrol-13": {
      "id": "patrol-13",
      "cardSetId": "tech-cards",
      "cardType": "patrol",
      "name": "Patrol",
      "properties": {
        "cardType": "patrol"
      }
    },
    "patrol-14": {
      "id": "patrol-14",
      "cardSetId": "tech-cards",
      "cardType": "patrol",
      "name": "Patrol",
      "properties": {
        "cardType": "patrol"
      }
    },
    "jumpGate-1": {
      "id": "jumpGate-1",
      "cardSetId": "tech-cards",
      "cardType": "jumpGate",
      "name": "Jump Gate",
      "properties": {
        "cardType": "jumpGate"
      }
    },
    "jumpGate-2": {
      "id": "jumpGate-2",
      "cardSetId": "tech-cards",
      "cardType": "jumpGate",
      "name": "Jump Gate",
      "properties": {
        "cardType": "jumpGate"
      }
    },
    "bountySurvey-1": {
      "id": "bountySurvey-1",
      "cardSetId": "tech-cards",
      "cardType": "bountySurvey",
      "name": "Bounty Survey",
      "properties": {
        "cardType": "bountySurvey"
      }
    },
    "bountySurvey-2": {
      "id": "bountySurvey-2",
      "cardSetId": "tech-cards",
      "cardType": "bountySurvey",
      "name": "Bounty Survey",
      "properties": {
        "cardType": "bountySurvey"
      }
    },
    "signalLock-1": {
      "id": "signalLock-1",
      "cardSetId": "tech-cards",
      "cardType": "signalLock",
      "name": "Signal Lock",
      "properties": {
        "cardType": "signalLock"
      }
    },
    "signalLock-2": {
      "id": "signalLock-2",
      "cardSetId": "tech-cards",
      "cardType": "signalLock",
      "name": "Signal Lock",
      "properties": {
        "cardType": "signalLock"
      }
    },
    "relicCache-1": {
      "id": "relicCache-1",
      "cardSetId": "tech-cards",
      "cardType": "relicCache",
      "name": "Relic Cache",
      "properties": {
        "cardType": "relicCache"
      }
    },
    "relicCache-2": {
      "id": "relicCache-2",
      "cardSetId": "tech-cards",
      "cardType": "relicCache",
      "name": "Relic Cache",
      "properties": {
        "cardType": "relicCache"
      }
    },
    "relicCache-3": {
      "id": "relicCache-3",
      "cardSetId": "tech-cards",
      "cardType": "relicCache",
      "name": "Relic Cache",
      "properties": {
        "cardType": "relicCache"
      }
    },
    "relicCache-4": {
      "id": "relicCache-4",
      "cardSetId": "tech-cards",
      "cardType": "relicCache",
      "name": "Relic Cache",
      "properties": {
        "cardType": "relicCache"
      }
    },
    "relicCache-5": {
      "id": "relicCache-5",
      "cardSetId": "tech-cards",
      "cardType": "relicCache",
      "name": "Relic Cache",
      "properties": {
        "cardType": "relicCache"
      }
    }
  },
  "pieces": {
    "raider": {
      "componentType": "piece",
      "id": "raider",
      "pieceTypeId": "raider",
      "pieceName": "Raider",
      "ownerId": null,
      "properties": {}
    },
    "route-p1-1": {
      "componentType": "piece",
      "id": "route-p1-1",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-1",
      "properties": {}
    },
    "route-p1-2": {
      "componentType": "piece",
      "id": "route-p1-2",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-1",
      "properties": {}
    },
    "route-p1-3": {
      "componentType": "piece",
      "id": "route-p1-3",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-1",
      "properties": {}
    },
    "route-p1-4": {
      "componentType": "piece",
      "id": "route-p1-4",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-1",
      "properties": {}
    },
    "route-p1-5": {
      "componentType": "piece",
      "id": "route-p1-5",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-1",
      "properties": {}
    },
    "route-p1-6": {
      "componentType": "piece",
      "id": "route-p1-6",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-1",
      "properties": {}
    },
    "route-p1-7": {
      "componentType": "piece",
      "id": "route-p1-7",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-1",
      "properties": {}
    },
    "route-p1-8": {
      "componentType": "piece",
      "id": "route-p1-8",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-1",
      "properties": {}
    },
    "route-p1-9": {
      "componentType": "piece",
      "id": "route-p1-9",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-1",
      "properties": {}
    },
    "route-p1-10": {
      "componentType": "piece",
      "id": "route-p1-10",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-1",
      "properties": {}
    },
    "route-p1-11": {
      "componentType": "piece",
      "id": "route-p1-11",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-1",
      "properties": {}
    },
    "route-p1-12": {
      "componentType": "piece",
      "id": "route-p1-12",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-1",
      "properties": {}
    },
    "route-p1-13": {
      "componentType": "piece",
      "id": "route-p1-13",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-1",
      "properties": {}
    },
    "route-p1-14": {
      "componentType": "piece",
      "id": "route-p1-14",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-1",
      "properties": {}
    },
    "route-p1-15": {
      "componentType": "piece",
      "id": "route-p1-15",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-1",
      "properties": {}
    },
    "route-p2-1": {
      "componentType": "piece",
      "id": "route-p2-1",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-2",
      "properties": {}
    },
    "route-p2-2": {
      "componentType": "piece",
      "id": "route-p2-2",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-2",
      "properties": {}
    },
    "route-p2-3": {
      "componentType": "piece",
      "id": "route-p2-3",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-2",
      "properties": {}
    },
    "route-p2-4": {
      "componentType": "piece",
      "id": "route-p2-4",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-2",
      "properties": {}
    },
    "route-p2-5": {
      "componentType": "piece",
      "id": "route-p2-5",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-2",
      "properties": {}
    },
    "route-p2-6": {
      "componentType": "piece",
      "id": "route-p2-6",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-2",
      "properties": {}
    },
    "route-p2-7": {
      "componentType": "piece",
      "id": "route-p2-7",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-2",
      "properties": {}
    },
    "route-p2-8": {
      "componentType": "piece",
      "id": "route-p2-8",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-2",
      "properties": {}
    },
    "route-p2-9": {
      "componentType": "piece",
      "id": "route-p2-9",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-2",
      "properties": {}
    },
    "route-p2-10": {
      "componentType": "piece",
      "id": "route-p2-10",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-2",
      "properties": {}
    },
    "route-p2-11": {
      "componentType": "piece",
      "id": "route-p2-11",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-2",
      "properties": {}
    },
    "route-p2-12": {
      "componentType": "piece",
      "id": "route-p2-12",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-2",
      "properties": {}
    },
    "route-p2-13": {
      "componentType": "piece",
      "id": "route-p2-13",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-2",
      "properties": {}
    },
    "route-p2-14": {
      "componentType": "piece",
      "id": "route-p2-14",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-2",
      "properties": {}
    },
    "route-p2-15": {
      "componentType": "piece",
      "id": "route-p2-15",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-2",
      "properties": {}
    },
    "route-p3-1": {
      "componentType": "piece",
      "id": "route-p3-1",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-3",
      "properties": {}
    },
    "route-p3-2": {
      "componentType": "piece",
      "id": "route-p3-2",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-3",
      "properties": {}
    },
    "route-p3-3": {
      "componentType": "piece",
      "id": "route-p3-3",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-3",
      "properties": {}
    },
    "route-p3-4": {
      "componentType": "piece",
      "id": "route-p3-4",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-3",
      "properties": {}
    },
    "route-p3-5": {
      "componentType": "piece",
      "id": "route-p3-5",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-3",
      "properties": {}
    },
    "route-p3-6": {
      "componentType": "piece",
      "id": "route-p3-6",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-3",
      "properties": {}
    },
    "route-p3-7": {
      "componentType": "piece",
      "id": "route-p3-7",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-3",
      "properties": {}
    },
    "route-p3-8": {
      "componentType": "piece",
      "id": "route-p3-8",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-3",
      "properties": {}
    },
    "route-p3-9": {
      "componentType": "piece",
      "id": "route-p3-9",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-3",
      "properties": {}
    },
    "route-p3-10": {
      "componentType": "piece",
      "id": "route-p3-10",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-3",
      "properties": {}
    },
    "route-p3-11": {
      "componentType": "piece",
      "id": "route-p3-11",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-3",
      "properties": {}
    },
    "route-p3-12": {
      "componentType": "piece",
      "id": "route-p3-12",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-3",
      "properties": {}
    },
    "route-p3-13": {
      "componentType": "piece",
      "id": "route-p3-13",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-3",
      "properties": {}
    },
    "route-p3-14": {
      "componentType": "piece",
      "id": "route-p3-14",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-3",
      "properties": {}
    },
    "route-p3-15": {
      "componentType": "piece",
      "id": "route-p3-15",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-3",
      "properties": {}
    },
    "route-p4-1": {
      "componentType": "piece",
      "id": "route-p4-1",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-4",
      "properties": {}
    },
    "route-p4-2": {
      "componentType": "piece",
      "id": "route-p4-2",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-4",
      "properties": {}
    },
    "route-p4-3": {
      "componentType": "piece",
      "id": "route-p4-3",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-4",
      "properties": {}
    },
    "route-p4-4": {
      "componentType": "piece",
      "id": "route-p4-4",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-4",
      "properties": {}
    },
    "route-p4-5": {
      "componentType": "piece",
      "id": "route-p4-5",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-4",
      "properties": {}
    },
    "route-p4-6": {
      "componentType": "piece",
      "id": "route-p4-6",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-4",
      "properties": {}
    },
    "route-p4-7": {
      "componentType": "piece",
      "id": "route-p4-7",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-4",
      "properties": {}
    },
    "route-p4-8": {
      "componentType": "piece",
      "id": "route-p4-8",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-4",
      "properties": {}
    },
    "route-p4-9": {
      "componentType": "piece",
      "id": "route-p4-9",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-4",
      "properties": {}
    },
    "route-p4-10": {
      "componentType": "piece",
      "id": "route-p4-10",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-4",
      "properties": {}
    },
    "route-p4-11": {
      "componentType": "piece",
      "id": "route-p4-11",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-4",
      "properties": {}
    },
    "route-p4-12": {
      "componentType": "piece",
      "id": "route-p4-12",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-4",
      "properties": {}
    },
    "route-p4-13": {
      "componentType": "piece",
      "id": "route-p4-13",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-4",
      "properties": {}
    },
    "route-p4-14": {
      "componentType": "piece",
      "id": "route-p4-14",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-4",
      "properties": {}
    },
    "route-p4-15": {
      "componentType": "piece",
      "id": "route-p4-15",
      "pieceTypeId": "route",
      "pieceName": "Route",
      "ownerId": "player-4",
      "properties": {}
    },
    "outpost-p1-1": {
      "componentType": "piece",
      "id": "outpost-p1-1",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-1",
      "properties": {}
    },
    "outpost-p1-2": {
      "componentType": "piece",
      "id": "outpost-p1-2",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-1",
      "properties": {}
    },
    "outpost-p1-3": {
      "componentType": "piece",
      "id": "outpost-p1-3",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-1",
      "properties": {}
    },
    "outpost-p1-4": {
      "componentType": "piece",
      "id": "outpost-p1-4",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-1",
      "properties": {}
    },
    "outpost-p1-5": {
      "componentType": "piece",
      "id": "outpost-p1-5",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-1",
      "properties": {}
    },
    "outpost-p2-1": {
      "componentType": "piece",
      "id": "outpost-p2-1",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-2",
      "properties": {}
    },
    "outpost-p2-2": {
      "componentType": "piece",
      "id": "outpost-p2-2",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-2",
      "properties": {}
    },
    "outpost-p2-3": {
      "componentType": "piece",
      "id": "outpost-p2-3",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-2",
      "properties": {}
    },
    "outpost-p2-4": {
      "componentType": "piece",
      "id": "outpost-p2-4",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-2",
      "properties": {}
    },
    "outpost-p2-5": {
      "componentType": "piece",
      "id": "outpost-p2-5",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-2",
      "properties": {}
    },
    "outpost-p3-1": {
      "componentType": "piece",
      "id": "outpost-p3-1",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-3",
      "properties": {}
    },
    "outpost-p3-2": {
      "componentType": "piece",
      "id": "outpost-p3-2",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-3",
      "properties": {}
    },
    "outpost-p3-3": {
      "componentType": "piece",
      "id": "outpost-p3-3",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-3",
      "properties": {}
    },
    "outpost-p3-4": {
      "componentType": "piece",
      "id": "outpost-p3-4",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-3",
      "properties": {}
    },
    "outpost-p3-5": {
      "componentType": "piece",
      "id": "outpost-p3-5",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-3",
      "properties": {}
    },
    "outpost-p4-1": {
      "componentType": "piece",
      "id": "outpost-p4-1",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-4",
      "properties": {}
    },
    "outpost-p4-2": {
      "componentType": "piece",
      "id": "outpost-p4-2",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-4",
      "properties": {}
    },
    "outpost-p4-3": {
      "componentType": "piece",
      "id": "outpost-p4-3",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-4",
      "properties": {}
    },
    "outpost-p4-4": {
      "componentType": "piece",
      "id": "outpost-p4-4",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-4",
      "properties": {}
    },
    "outpost-p4-5": {
      "componentType": "piece",
      "id": "outpost-p4-5",
      "pieceTypeId": "outpost",
      "pieceName": "Outpost",
      "ownerId": "player-4",
      "properties": {}
    },
    "hub-p1-1": {
      "componentType": "piece",
      "id": "hub-p1-1",
      "pieceTypeId": "hub",
      "pieceName": "Hub",
      "ownerId": "player-1",
      "properties": {}
    },
    "hub-p1-2": {
      "componentType": "piece",
      "id": "hub-p1-2",
      "pieceTypeId": "hub",
      "pieceName": "Hub",
      "ownerId": "player-1",
      "properties": {}
    },
    "hub-p1-3": {
      "componentType": "piece",
      "id": "hub-p1-3",
      "pieceTypeId": "hub",
      "pieceName": "Hub",
      "ownerId": "player-1",
      "properties": {}
    },
    "hub-p1-4": {
      "componentType": "piece",
      "id": "hub-p1-4",
      "pieceTypeId": "hub",
      "pieceName": "Hub",
      "ownerId": "player-1",
      "properties": {}
    },
    "hub-p2-1": {
      "componentType": "piece",
      "id": "hub-p2-1",
      "pieceTypeId": "hub",
      "pieceName": "Hub",
      "ownerId": "player-2",
      "properties": {}
    },
    "hub-p2-2": {
      "componentType": "piece",
      "id": "hub-p2-2",
      "pieceTypeId": "hub",
      "pieceName": "Hub",
      "ownerId": "player-2",
      "properties": {}
    },
    "hub-p2-3": {
      "componentType": "piece",
      "id": "hub-p2-3",
      "pieceTypeId": "hub",
      "pieceName": "Hub",
      "ownerId": "player-2",
      "properties": {}
    },
    "hub-p2-4": {
      "componentType": "piece",
      "id": "hub-p2-4",
      "pieceTypeId": "hub",
      "pieceName": "Hub",
      "ownerId": "player-2",
      "properties": {}
    },
    "hub-p3-1": {
      "componentType": "piece",
      "id": "hub-p3-1",
      "pieceTypeId": "hub",
      "pieceName": "Hub",
      "ownerId": "player-3",
      "properties": {}
    },
    "hub-p3-2": {
      "componentType": "piece",
      "id": "hub-p3-2",
      "pieceTypeId": "hub",
      "pieceName": "Hub",
      "ownerId": "player-3",
      "properties": {}
    },
    "hub-p3-3": {
      "componentType": "piece",
      "id": "hub-p3-3",
      "pieceTypeId": "hub",
      "pieceName": "Hub",
      "ownerId": "player-3",
      "properties": {}
    },
    "hub-p3-4": {
      "componentType": "piece",
      "id": "hub-p3-4",
      "pieceTypeId": "hub",
      "pieceName": "Hub",
      "ownerId": "player-3",
      "properties": {}
    },
    "hub-p4-1": {
      "componentType": "piece",
      "id": "hub-p4-1",
      "pieceTypeId": "hub",
      "pieceName": "Hub",
      "ownerId": "player-4",
      "properties": {}
    },
    "hub-p4-2": {
      "componentType": "piece",
      "id": "hub-p4-2",
      "pieceTypeId": "hub",
      "pieceName": "Hub",
      "ownerId": "player-4",
      "properties": {}
    },
    "hub-p4-3": {
      "componentType": "piece",
      "id": "hub-p4-3",
      "pieceTypeId": "hub",
      "pieceName": "Hub",
      "ownerId": "player-4",
      "properties": {}
    },
    "hub-p4-4": {
      "componentType": "piece",
      "id": "hub-p4-4",
      "pieceTypeId": "hub",
      "pieceName": "Hub",
      "ownerId": "player-4",
      "properties": {}
    }
  },
  "componentLocations": {
    "patrol-1": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 0
    },
    "patrol-2": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 1
    },
    "patrol-3": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 2
    },
    "patrol-4": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 3
    },
    "patrol-5": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 4
    },
    "patrol-6": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 5
    },
    "patrol-7": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 6
    },
    "patrol-8": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 7
    },
    "patrol-9": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 8
    },
    "patrol-10": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 9
    },
    "patrol-11": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 10
    },
    "patrol-12": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 11
    },
    "patrol-13": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 12
    },
    "patrol-14": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 13
    },
    "jumpGate-1": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 14
    },
    "jumpGate-2": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 15
    },
    "bountySurvey-1": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 16
    },
    "bountySurvey-2": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 17
    },
    "signalLock-1": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 18
    },
    "signalLock-2": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 19
    },
    "relicCache-1": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 20
    },
    "relicCache-2": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 21
    },
    "relicCache-3": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 22
    },
    "relicCache-4": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 23
    },
    "relicCache-5": {
      "type": "InDeck",
      "deckId": "tech-deck",
      "playedBy": null,
      "position": 24
    },
    "raider": {
      "type": "Detached"
    },
    "route-p1-1": {
      "type": "Detached"
    },
    "route-p1-2": {
      "type": "Detached"
    },
    "route-p1-3": {
      "type": "Detached"
    },
    "route-p1-4": {
      "type": "Detached"
    },
    "route-p1-5": {
      "type": "Detached"
    },
    "route-p1-6": {
      "type": "Detached"
    },
    "route-p1-7": {
      "type": "Detached"
    },
    "route-p1-8": {
      "type": "Detached"
    },
    "route-p1-9": {
      "type": "Detached"
    },
    "route-p1-10": {
      "type": "Detached"
    },
    "route-p1-11": {
      "type": "Detached"
    },
    "route-p1-12": {
      "type": "Detached"
    },
    "route-p1-13": {
      "type": "Detached"
    },
    "route-p1-14": {
      "type": "Detached"
    },
    "route-p1-15": {
      "type": "Detached"
    },
    "route-p2-1": {
      "type": "Detached"
    },
    "route-p2-2": {
      "type": "Detached"
    },
    "route-p2-3": {
      "type": "Detached"
    },
    "route-p2-4": {
      "type": "Detached"
    },
    "route-p2-5": {
      "type": "Detached"
    },
    "route-p2-6": {
      "type": "Detached"
    },
    "route-p2-7": {
      "type": "Detached"
    },
    "route-p2-8": {
      "type": "Detached"
    },
    "route-p2-9": {
      "type": "Detached"
    },
    "route-p2-10": {
      "type": "Detached"
    },
    "route-p2-11": {
      "type": "Detached"
    },
    "route-p2-12": {
      "type": "Detached"
    },
    "route-p2-13": {
      "type": "Detached"
    },
    "route-p2-14": {
      "type": "Detached"
    },
    "route-p2-15": {
      "type": "Detached"
    },
    "route-p3-1": {
      "type": "Detached"
    },
    "route-p3-2": {
      "type": "Detached"
    },
    "route-p3-3": {
      "type": "Detached"
    },
    "route-p3-4": {
      "type": "Detached"
    },
    "route-p3-5": {
      "type": "Detached"
    },
    "route-p3-6": {
      "type": "Detached"
    },
    "route-p3-7": {
      "type": "Detached"
    },
    "route-p3-8": {
      "type": "Detached"
    },
    "route-p3-9": {
      "type": "Detached"
    },
    "route-p3-10": {
      "type": "Detached"
    },
    "route-p3-11": {
      "type": "Detached"
    },
    "route-p3-12": {
      "type": "Detached"
    },
    "route-p3-13": {
      "type": "Detached"
    },
    "route-p3-14": {
      "type": "Detached"
    },
    "route-p3-15": {
      "type": "Detached"
    },
    "route-p4-1": {
      "type": "Detached"
    },
    "route-p4-2": {
      "type": "Detached"
    },
    "route-p4-3": {
      "type": "Detached"
    },
    "route-p4-4": {
      "type": "Detached"
    },
    "route-p4-5": {
      "type": "Detached"
    },
    "route-p4-6": {
      "type": "Detached"
    },
    "route-p4-7": {
      "type": "Detached"
    },
    "route-p4-8": {
      "type": "Detached"
    },
    "route-p4-9": {
      "type": "Detached"
    },
    "route-p4-10": {
      "type": "Detached"
    },
    "route-p4-11": {
      "type": "Detached"
    },
    "route-p4-12": {
      "type": "Detached"
    },
    "route-p4-13": {
      "type": "Detached"
    },
    "route-p4-14": {
      "type": "Detached"
    },
    "route-p4-15": {
      "type": "Detached"
    },
    "outpost-p1-1": {
      "type": "Detached"
    },
    "outpost-p1-2": {
      "type": "Detached"
    },
    "outpost-p1-3": {
      "type": "Detached"
    },
    "outpost-p1-4": {
      "type": "Detached"
    },
    "outpost-p1-5": {
      "type": "Detached"
    },
    "outpost-p2-1": {
      "type": "Detached"
    },
    "outpost-p2-2": {
      "type": "Detached"
    },
    "outpost-p2-3": {
      "type": "Detached"
    },
    "outpost-p2-4": {
      "type": "Detached"
    },
    "outpost-p2-5": {
      "type": "Detached"
    },
    "outpost-p3-1": {
      "type": "Detached"
    },
    "outpost-p3-2": {
      "type": "Detached"
    },
    "outpost-p3-3": {
      "type": "Detached"
    },
    "outpost-p3-4": {
      "type": "Detached"
    },
    "outpost-p3-5": {
      "type": "Detached"
    },
    "outpost-p4-1": {
      "type": "Detached"
    },
    "outpost-p4-2": {
      "type": "Detached"
    },
    "outpost-p4-3": {
      "type": "Detached"
    },
    "outpost-p4-4": {
      "type": "Detached"
    },
    "outpost-p4-5": {
      "type": "Detached"
    },
    "hub-p1-1": {
      "type": "Detached"
    },
    "hub-p1-2": {
      "type": "Detached"
    },
    "hub-p1-3": {
      "type": "Detached"
    },
    "hub-p1-4": {
      "type": "Detached"
    },
    "hub-p2-1": {
      "type": "Detached"
    },
    "hub-p2-2": {
      "type": "Detached"
    },
    "hub-p2-3": {
      "type": "Detached"
    },
    "hub-p2-4": {
      "type": "Detached"
    },
    "hub-p3-1": {
      "type": "Detached"
    },
    "hub-p3-2": {
      "type": "Detached"
    },
    "hub-p3-3": {
      "type": "Detached"
    },
    "hub-p3-4": {
      "type": "Detached"
    },
    "hub-p4-1": {
      "type": "Detached"
    },
    "hub-p4-2": {
      "type": "Detached"
    },
    "hub-p4-3": {
      "type": "Detached"
    },
    "hub-p4-4": {
      "type": "Detached"
    },
    "die-1": {
      "type": "Detached"
    },
    "die-2": {
      "type": "Detached"
    }
  },
  "ownerOfCard": {
    "patrol-1": null,
    "patrol-2": null,
    "patrol-3": null,
    "patrol-4": null,
    "patrol-5": null,
    "patrol-6": null,
    "patrol-7": null,
    "patrol-8": null,
    "patrol-9": null,
    "patrol-10": null,
    "patrol-11": null,
    "patrol-12": null,
    "patrol-13": null,
    "patrol-14": null,
    "jumpGate-1": null,
    "jumpGate-2": null,
    "bountySurvey-1": null,
    "bountySurvey-2": null,
    "signalLock-1": null,
    "signalLock-2": null,
    "relicCache-1": null,
    "relicCache-2": null,
    "relicCache-3": null,
    "relicCache-4": null,
    "relicCache-5": null
  },
  "visibility": {
    "patrol-1": {
      "faceUp": true
    },
    "patrol-2": {
      "faceUp": true
    },
    "patrol-3": {
      "faceUp": true
    },
    "patrol-4": {
      "faceUp": true
    },
    "patrol-5": {
      "faceUp": true
    },
    "patrol-6": {
      "faceUp": true
    },
    "patrol-7": {
      "faceUp": true
    },
    "patrol-8": {
      "faceUp": true
    },
    "patrol-9": {
      "faceUp": true
    },
    "patrol-10": {
      "faceUp": true
    },
    "patrol-11": {
      "faceUp": true
    },
    "patrol-12": {
      "faceUp": true
    },
    "patrol-13": {
      "faceUp": true
    },
    "patrol-14": {
      "faceUp": true
    },
    "jumpGate-1": {
      "faceUp": true
    },
    "jumpGate-2": {
      "faceUp": true
    },
    "bountySurvey-1": {
      "faceUp": true
    },
    "bountySurvey-2": {
      "faceUp": true
    },
    "signalLock-1": {
      "faceUp": true
    },
    "signalLock-2": {
      "faceUp": true
    },
    "relicCache-1": {
      "faceUp": true
    },
    "relicCache-2": {
      "faceUp": true
    },
    "relicCache-3": {
      "faceUp": true
    },
    "relicCache-4": {
      "faceUp": true
    },
    "relicCache-5": {
      "faceUp": true
    }
  },
  "resources": {
    "__perPlayer": true,
    "entries": [
      [
        "player-1",
        {
          "alloy": 0,
          "carbon": 0,
          "crystal": 0,
          "fiber": 0,
          "water": 0
        }
      ],
      [
        "player-2",
        {
          "alloy": 0,
          "carbon": 0,
          "crystal": 0,
          "fiber": 0,
          "water": 0
        }
      ],
      [
        "player-3",
        {
          "alloy": 0,
          "carbon": 0,
          "crystal": 0,
          "fiber": 0,
          "water": 0
        }
      ],
      [
        "player-4",
        {
          "alloy": 0,
          "carbon": 0,
          "crystal": 0,
          "fiber": 0,
          "water": 0
        }
      ]
    ]
  },
  "boards": {
    "byId": {
      "sector": {
        "id": "sector",
        "baseId": "sector",
        "layout": "hex",
        "typeId": null,
        "scope": "shared",
        "templateId": "star-sector",
        "fields": {},
        "playerId": null,
        "spaces": {
          "h-0-0": {
            "id": "h-0-0",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 0,
            "r": 0
          },
          "h-1-0": {
            "id": "h-1-0",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 1,
            "r": -1
          },
          "h-1-1": {
            "id": "h-1-1",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 1,
            "r": 0
          },
          "h-1-2": {
            "id": "h-1-2",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 0,
            "r": 1
          },
          "h-1-3": {
            "id": "h-1-3",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": -1,
            "r": 1
          },
          "h-1-4": {
            "id": "h-1-4",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": -1,
            "r": 0
          },
          "h-1-5": {
            "id": "h-1-5",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 0,
            "r": -1
          },
          "h-2-0": {
            "id": "h-2-0",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 2,
            "r": -2
          },
          "h-2-1": {
            "id": "h-2-1",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 2,
            "r": -1
          },
          "h-2-10": {
            "id": "h-2-10",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 0,
            "r": -2
          },
          "h-2-11": {
            "id": "h-2-11",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 1,
            "r": -2
          },
          "h-2-2": {
            "id": "h-2-2",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 2,
            "r": 0
          },
          "h-2-3": {
            "id": "h-2-3",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 1,
            "r": 1
          },
          "h-2-4": {
            "id": "h-2-4",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 0,
            "r": 2
          },
          "h-2-5": {
            "id": "h-2-5",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": -1,
            "r": 2
          },
          "h-2-6": {
            "id": "h-2-6",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": -2,
            "r": 2
          },
          "h-2-7": {
            "id": "h-2-7",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": -2,
            "r": 1
          },
          "h-2-8": {
            "id": "h-2-8",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": -2,
            "r": 0
          },
          "h-2-9": {
            "id": "h-2-9",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": -1,
            "r": -1
          },
          "o-0": {
            "id": "o-0",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 3,
            "r": -3
          },
          "o-1": {
            "id": "o-1",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 3,
            "r": -2
          },
          "o-10": {
            "id": "o-10",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": -3,
            "r": 2
          },
          "o-11": {
            "id": "o-11",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": -3,
            "r": 1
          },
          "o-12": {
            "id": "o-12",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": -3,
            "r": 0
          },
          "o-13": {
            "id": "o-13",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": -2,
            "r": -1
          },
          "o-14": {
            "id": "o-14",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": -1,
            "r": -2
          },
          "o-15": {
            "id": "o-15",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 0,
            "r": -3
          },
          "o-16": {
            "id": "o-16",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 1,
            "r": -3
          },
          "o-17": {
            "id": "o-17",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 2,
            "r": -3
          },
          "o-2": {
            "id": "o-2",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 3,
            "r": -1
          },
          "o-3": {
            "id": "o-3",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 3,
            "r": 0
          },
          "o-4": {
            "id": "o-4",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 2,
            "r": 1
          },
          "o-5": {
            "id": "o-5",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 1,
            "r": 2
          },
          "o-6": {
            "id": "o-6",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 0,
            "r": 3
          },
          "o-7": {
            "id": "o-7",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": -1,
            "r": 3
          },
          "o-8": {
            "id": "o-8",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": -2,
            "r": 3
          },
          "o-9": {
            "id": "o-9",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": -3,
            "r": 3
          }
        },
        "relations": [],
        "containers": {},
        "orientation": "pointy-top",
        "edges": [
          {
            "id": "hex-edge:-1,-1,2::-2,-2,4",
            "spaceIds": [
              "h-1-2",
              "h-1-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-1,2::-2,1,1",
            "spaceIds": [
              "h-0-0",
              "h-1-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-1,2::1,-2,1",
            "spaceIds": [
              "h-0-0",
              "h-1-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-10,11::-2,-8,10",
            "spaceIds": [
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-10,11::1,-11,10",
            "spaceIds": [
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-4,5::-2,-2,4",
            "spaceIds": [
              "h-1-2",
              "h-2-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-4,5::-2,-5,7",
            "spaceIds": [
              "h-2-4",
              "h-2-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-4,5::1,-5,4",
            "spaceIds": [
              "h-1-2",
              "h-2-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-7,8::-2,-5,7",
            "spaceIds": [
              "h-2-4",
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-7,8::-2,-8,10",
            "spaceIds": [
              "o-6",
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-7,8::1,-8,7",
            "spaceIds": [
              "h-2-4",
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,11,-10::-2,10,-8",
            "spaceIds": [
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,11,-10::1,10,-11",
            "spaceIds": [
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,2,-1::-2,1,1",
            "spaceIds": [
              "h-0-0",
              "h-1-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,2,-1::-2,4,-2",
            "spaceIds": [
              "h-1-4",
              "h-1-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,2,-1::1,1,-2",
            "spaceIds": [
              "h-0-0",
              "h-1-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,5,-4::-2,4,-2",
            "spaceIds": [
              "h-1-5",
              "h-2-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,5,-4::-2,7,-5",
            "spaceIds": [
              "h-2-10",
              "h-2-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,5,-4::1,4,-5",
            "spaceIds": [
              "h-1-5",
              "h-2-10"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,8,-7::-2,10,-8",
            "spaceIds": [
              "o-14",
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,8,-7::-2,7,-5",
            "spaceIds": [
              "h-2-10",
              "o-14"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,8,-7::1,7,-8",
            "spaceIds": [
              "h-2-10",
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,-1,11::-11,1,10",
            "spaceIds": [
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,-1,11::-8,-2,10",
            "spaceIds": [
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,11,-1::-11,10,1",
            "spaceIds": [
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,11,-1::-8,10,-2",
            "spaceIds": [
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,2,8::-11,1,10",
            "spaceIds": [
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,2,8::-11,4,7",
            "spaceIds": [
              "o-10"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,2,8::-8,1,7",
            "spaceIds": [
              "o-10",
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,5,5::-11,4,7",
            "spaceIds": [
              "o-10"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,5,5::-11,7,4",
            "spaceIds": [
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,5,5::-8,4,4",
            "spaceIds": [
              "o-10",
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,8,2::-11,10,1",
            "spaceIds": [
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,8,2::-11,7,4",
            "spaceIds": [
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,8,2::-8,7,1",
            "spaceIds": [
              "o-11",
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-2,-2,4::-4,-1,5",
            "spaceIds": [
              "h-1-3",
              "h-2-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-2,-5,7::-4,-4,8",
            "spaceIds": [
              "h-2-5",
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-2,-8,10::-4,-7,11",
            "spaceIds": [
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-2,1,1::-4,2,2",
            "spaceIds": [
              "h-1-3",
              "h-1-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-2,10,-8::-4,11,-7",
            "spaceIds": [
              "o-14"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-2,4,-2::-4,5,-1",
            "spaceIds": [
              "h-1-4",
              "h-2-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-2,7,-5::-4,8,-4",
            "spaceIds": [
              "h-2-9",
              "o-14"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 8
            }
          },
          {
            "id": "hex-edge:-4,-1,5::-5,-2,7",
            "spaceIds": [
              "h-2-5",
              "h-2-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,-1,5::-5,1,4",
            "spaceIds": [
              "h-1-3",
              "h-2-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,-4,8::-5,-2,7",
            "spaceIds": [
              "h-2-5",
              "o-8"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 5
            }
          },
          {
            "id": "hex-edge:-4,-4,8::-5,-5,10",
            "spaceIds": [
              "o-7",
              "o-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,-7,11::-5,-5,10",
            "spaceIds": [
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,11,-7::-5,10,-5",
            "spaceIds": [
              "o-14"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,2,2::-5,1,4",
            "spaceIds": [
              "h-1-3",
              "h-2-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,2,2::-5,4,1",
            "spaceIds": [
              "h-1-4",
              "h-2-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,5,-1::-5,4,1",
            "spaceIds": [
              "h-1-4",
              "h-2-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,5,-1::-5,7,-2",
            "spaceIds": [
              "h-2-8",
              "h-2-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,8,-4::-5,10,-5",
            "spaceIds": [
              "o-13",
              "o-14"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,8,-4::-5,7,-2",
            "spaceIds": [
              "h-2-9",
              "o-13"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-5,-2,7::-7,-1,8",
            "spaceIds": [
              "h-2-6",
              "o-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-5,-5,10::-7,-4,11",
            "spaceIds": [
              "o-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-5,1,4::-7,2,5",
            "spaceIds": [
              "h-2-6",
              "h-2-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-5,10,-5::-7,11,-4",
            "spaceIds": [
              "o-13"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-5,4,1::-7,5,2",
            "spaceIds": [
              "h-2-7",
              "h-2-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-5,7,-2::-7,8,-1",
            "spaceIds": [
              "h-2-8",
              "o-13"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 7
            }
          },
          {
            "id": "hex-edge:-7,-1,8::-8,-2,10",
            "spaceIds": [
              "o-8",
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-7,-1,8::-8,1,7",
            "spaceIds": [
              "h-2-6",
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-7,-4,11::-8,-2,10",
            "spaceIds": [
              "o-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-7,11,-4::-8,10,-2",
            "spaceIds": [
              "o-13"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-7,2,5::-8,1,7",
            "spaceIds": [
              "h-2-6",
              "o-10"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-7,2,5::-8,4,4",
            "spaceIds": [
              "h-2-7",
              "o-10"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 6
            }
          },
          {
            "id": "hex-edge:-7,5,2::-8,4,4",
            "spaceIds": [
              "h-2-7",
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-7,5,2::-8,7,1",
            "spaceIds": [
              "h-2-8",
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-7,8,-1::-8,10,-2",
            "spaceIds": [
              "o-12",
              "o-13"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-7,8,-1::-8,7,1",
            "spaceIds": [
              "h-2-8",
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,-11,10::2,-10,8",
            "spaceIds": [
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,-2,1::2,-1,-1",
            "spaceIds": [
              "h-0-0",
              "h-1-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,-2,1::2,-4,2",
            "spaceIds": [
              "h-1-1",
              "h-1-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,-5,4::2,-4,2",
            "spaceIds": [
              "h-1-2",
              "h-2-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,-5,4::2,-7,5",
            "spaceIds": [
              "h-2-3",
              "h-2-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,-8,7::2,-10,8",
            "spaceIds": [
              "o-5",
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,-8,7::2,-7,5",
            "spaceIds": [
              "h-2-4",
              "o-5"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 4
            }
          },
          {
            "id": "hex-edge:1,1,-2::2,-1,-1",
            "spaceIds": [
              "h-0-0",
              "h-1-0"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,1,-2::2,2,-4",
            "spaceIds": [
              "h-1-0",
              "h-1-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,10,-11::2,8,-10",
            "spaceIds": [
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,4,-5::2,2,-4",
            "spaceIds": [
              "h-1-5",
              "h-2-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,4,-5::2,5,-7",
            "spaceIds": [
              "h-2-10",
              "h-2-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,7,-8::2,5,-7",
            "spaceIds": [
              "h-2-10",
              "o-16"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,7,-8::2,8,-10",
            "spaceIds": [
              "o-15",
              "o-16"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-11,1::11,-10,-1",
            "spaceIds": [
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-11,1::8,-10,2",
            "spaceIds": [
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-2,-8::11,-1,-10",
            "spaceIds": [
              "o-0"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-2,-8::11,-4,-7",
            "spaceIds": [
              "o-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-2,-8::8,-1,-7",
            "spaceIds": [
              "o-0",
              "o-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-5,-5::11,-4,-7",
            "spaceIds": [
              "o-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-5,-5::11,-7,-4",
            "spaceIds": [
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-5,-5::8,-4,-4",
            "spaceIds": [
              "o-1",
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-8,-2::11,-10,-1",
            "spaceIds": [
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-8,-2::11,-7,-4",
            "spaceIds": [
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-8,-2::8,-7,-1",
            "spaceIds": [
              "o-2",
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,1,-11::11,-1,-10",
            "spaceIds": [
              "o-0"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,1,-11::8,2,-10",
            "spaceIds": [
              "o-0"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:2,-1,-1::4,-2,-2",
            "spaceIds": [
              "h-1-0",
              "h-1-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:2,-10,8::4,-11,7",
            "spaceIds": [
              "o-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:2,-4,2::4,-5,1",
            "spaceIds": [
              "h-1-1",
              "h-2-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:2,-7,5::4,-8,4",
            "spaceIds": [
              "h-2-3",
              "o-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:2,2,-4::4,1,-5",
            "spaceIds": [
              "h-1-0",
              "h-2-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:2,5,-7::4,4,-8",
            "spaceIds": [
              "h-2-11",
              "o-16"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 0
            }
          },
          {
            "id": "hex-edge:2,8,-10::4,7,-11",
            "spaceIds": [
              "o-16"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,-11,7::5,-10,5",
            "spaceIds": [
              "o-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,-2,-2::5,-1,-4",
            "spaceIds": [
              "h-1-0",
              "h-2-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,-2,-2::5,-4,-1",
            "spaceIds": [
              "h-1-1",
              "h-2-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,-5,1::5,-4,-1",
            "spaceIds": [
              "h-1-1",
              "h-2-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,-5,1::5,-7,2",
            "spaceIds": [
              "h-2-2",
              "h-2-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,-8,4::5,-10,5",
            "spaceIds": [
              "o-4",
              "o-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,-8,4::5,-7,2",
            "spaceIds": [
              "h-2-3",
              "o-4"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 3
            }
          },
          {
            "id": "hex-edge:4,1,-5::5,-1,-4",
            "spaceIds": [
              "h-1-0",
              "h-2-0"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,1,-5::5,2,-7",
            "spaceIds": [
              "h-2-0",
              "h-2-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,4,-8::5,2,-7",
            "spaceIds": [
              "h-2-11",
              "o-17"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 1
            }
          },
          {
            "id": "hex-edge:4,4,-8::5,5,-10",
            "spaceIds": [
              "o-16",
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,7,-11::5,5,-10",
            "spaceIds": [
              "o-16"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:5,-1,-4::7,-2,-5",
            "spaceIds": [
              "h-2-0",
              "h-2-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:5,-10,5::7,-11,4",
            "spaceIds": [
              "o-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:5,-4,-1::7,-5,-2",
            "spaceIds": [
              "h-2-1",
              "h-2-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:5,-7,2::7,-8,1",
            "spaceIds": [
              "h-2-2",
              "o-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:5,2,-7::7,1,-8",
            "spaceIds": [
              "h-2-0",
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:5,5,-10::7,4,-11",
            "spaceIds": [
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,-11,4::8,-10,2",
            "spaceIds": [
              "o-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,-2,-5::8,-1,-7",
            "spaceIds": [
              "h-2-0",
              "o-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,-2,-5::8,-4,-4",
            "spaceIds": [
              "h-2-1",
              "o-1"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 2
            }
          },
          {
            "id": "hex-edge:7,-5,-2::8,-4,-4",
            "spaceIds": [
              "h-2-1",
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,-5,-2::8,-7,-1",
            "spaceIds": [
              "h-2-2",
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,-8,1::8,-10,2",
            "spaceIds": [
              "o-3",
              "o-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,-8,1::8,-7,-1",
            "spaceIds": [
              "h-2-2",
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,1,-8::8,-1,-7",
            "spaceIds": [
              "h-2-0",
              "o-0"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,1,-8::8,2,-10",
            "spaceIds": [
              "o-0",
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,4,-11::8,2,-10",
            "spaceIds": [
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          }
        ],
        "vertices": [
          {
            "id": "hex-vertex:-1,-1,2",
            "spaceIds": [
              "h-0-0",
              "h-1-2",
              "h-1-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-1,-10,11",
            "spaceIds": [
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-1,-4,5",
            "spaceIds": [
              "h-1-2",
              "h-2-4",
              "h-2-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-1,-7,8",
            "spaceIds": [
              "h-2-4",
              "o-6",
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-1,11,-10",
            "spaceIds": [
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-1,2,-1",
            "spaceIds": [
              "h-0-0",
              "h-1-4",
              "h-1-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-1,5,-4",
            "spaceIds": [
              "h-1-5",
              "h-2-10",
              "h-2-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-1,8,-7",
            "spaceIds": [
              "h-2-10",
              "o-14",
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-10,-1,11",
            "spaceIds": [
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-10,11,-1",
            "spaceIds": [
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-10,2,8",
            "spaceIds": [
              "o-10",
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-10,5,5",
            "spaceIds": [
              "o-10",
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-10,8,2",
            "spaceIds": [
              "o-11",
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-11,1,10",
            "spaceIds": [
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-11,10,1",
            "spaceIds": [
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-11,4,7",
            "spaceIds": [
              "o-10"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-11,7,4",
            "spaceIds": [
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-2,-2,4",
            "spaceIds": [
              "h-1-2",
              "h-1-3",
              "h-2-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-2,-5,7",
            "spaceIds": [
              "h-2-4",
              "h-2-5",
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-2,-8,10",
            "spaceIds": [
              "o-6",
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-2,1,1",
            "spaceIds": [
              "h-0-0",
              "h-1-3",
              "h-1-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-2,10,-8",
            "spaceIds": [
              "o-14",
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-2,4,-2",
            "spaceIds": [
              "h-1-4",
              "h-1-5",
              "h-2-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-2,7,-5",
            "spaceIds": [
              "h-2-10",
              "h-2-9",
              "o-14"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-4,-1,5",
            "spaceIds": [
              "h-1-3",
              "h-2-5",
              "h-2-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-4,-4,8",
            "spaceIds": [
              "h-2-5",
              "o-7",
              "o-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-4,-7,11",
            "spaceIds": [
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-4,11,-7",
            "spaceIds": [
              "o-14"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-4,2,2",
            "spaceIds": [
              "h-1-3",
              "h-1-4",
              "h-2-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-4,5,-1",
            "spaceIds": [
              "h-1-4",
              "h-2-8",
              "h-2-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-4,8,-4",
            "spaceIds": [
              "h-2-9",
              "o-13",
              "o-14"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-5,-2,7",
            "spaceIds": [
              "h-2-5",
              "h-2-6",
              "o-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-5,-5,10",
            "spaceIds": [
              "o-7",
              "o-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-5,1,4",
            "spaceIds": [
              "h-1-3",
              "h-2-6",
              "h-2-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-5,10,-5",
            "spaceIds": [
              "o-13",
              "o-14"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-5,4,1",
            "spaceIds": [
              "h-1-4",
              "h-2-7",
              "h-2-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-5,7,-2",
            "spaceIds": [
              "h-2-8",
              "h-2-9",
              "o-13"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-7,-1,8",
            "spaceIds": [
              "h-2-6",
              "o-8",
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-7,-4,11",
            "spaceIds": [
              "o-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-7,11,-4",
            "spaceIds": [
              "o-13"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-7,2,5",
            "spaceIds": [
              "h-2-6",
              "h-2-7",
              "o-10"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-7,5,2",
            "spaceIds": [
              "h-2-7",
              "h-2-8",
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-7,8,-1",
            "spaceIds": [
              "h-2-8",
              "o-12",
              "o-13"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-8,-2,10",
            "spaceIds": [
              "o-8",
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-8,1,7",
            "spaceIds": [
              "h-2-6",
              "o-10",
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-8,10,-2",
            "spaceIds": [
              "o-12",
              "o-13"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-8,4,4",
            "spaceIds": [
              "h-2-7",
              "o-10",
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-8,7,1",
            "spaceIds": [
              "h-2-8",
              "o-11",
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:1,-11,10",
            "spaceIds": [
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:1,-2,1",
            "spaceIds": [
              "h-0-0",
              "h-1-1",
              "h-1-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:1,-5,4",
            "spaceIds": [
              "h-1-2",
              "h-2-3",
              "h-2-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:1,-8,7",
            "spaceIds": [
              "h-2-4",
              "o-5",
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:1,1,-2",
            "spaceIds": [
              "h-0-0",
              "h-1-0",
              "h-1-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:1,10,-11",
            "spaceIds": [
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:1,4,-5",
            "spaceIds": [
              "h-1-5",
              "h-2-10",
              "h-2-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:1,7,-8",
            "spaceIds": [
              "h-2-10",
              "o-15",
              "o-16"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:10,-11,1",
            "spaceIds": [
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:10,-2,-8",
            "spaceIds": [
              "o-0",
              "o-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:10,-5,-5",
            "spaceIds": [
              "o-1",
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:10,-8,-2",
            "spaceIds": [
              "o-2",
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:10,1,-11",
            "spaceIds": [
              "o-0"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:11,-1,-10",
            "spaceIds": [
              "o-0"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:11,-10,-1",
            "spaceIds": [
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:11,-4,-7",
            "spaceIds": [
              "o-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:11,-7,-4",
            "spaceIds": [
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:2,-1,-1",
            "spaceIds": [
              "h-0-0",
              "h-1-0",
              "h-1-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:2,-10,8",
            "spaceIds": [
              "o-5",
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:2,-4,2",
            "spaceIds": [
              "h-1-1",
              "h-1-2",
              "h-2-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:2,-7,5",
            "spaceIds": [
              "h-2-3",
              "h-2-4",
              "o-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:2,2,-4",
            "spaceIds": [
              "h-1-0",
              "h-1-5",
              "h-2-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:2,5,-7",
            "spaceIds": [
              "h-2-10",
              "h-2-11",
              "o-16"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:2,8,-10",
            "spaceIds": [
              "o-15",
              "o-16"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:4,-11,7",
            "spaceIds": [
              "o-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:4,-2,-2",
            "spaceIds": [
              "h-1-0",
              "h-1-1",
              "h-2-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:4,-5,1",
            "spaceIds": [
              "h-1-1",
              "h-2-2",
              "h-2-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:4,-8,4",
            "spaceIds": [
              "h-2-3",
              "o-4",
              "o-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:4,1,-5",
            "spaceIds": [
              "h-1-0",
              "h-2-0",
              "h-2-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:4,4,-8",
            "spaceIds": [
              "h-2-11",
              "o-16",
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:4,7,-11",
            "spaceIds": [
              "o-16"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:5,-1,-4",
            "spaceIds": [
              "h-1-0",
              "h-2-0",
              "h-2-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:5,-10,5",
            "spaceIds": [
              "o-4",
              "o-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:5,-4,-1",
            "spaceIds": [
              "h-1-1",
              "h-2-1",
              "h-2-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:5,-7,2",
            "spaceIds": [
              "h-2-2",
              "h-2-3",
              "o-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:5,2,-7",
            "spaceIds": [
              "h-2-0",
              "h-2-11",
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:5,5,-10",
            "spaceIds": [
              "o-16",
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:7,-11,4",
            "spaceIds": [
              "o-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:7,-2,-5",
            "spaceIds": [
              "h-2-0",
              "h-2-1",
              "o-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:7,-5,-2",
            "spaceIds": [
              "h-2-1",
              "h-2-2",
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:7,-8,1",
            "spaceIds": [
              "h-2-2",
              "o-3",
              "o-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:7,1,-8",
            "spaceIds": [
              "h-2-0",
              "o-0",
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:7,4,-11",
            "spaceIds": [
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:8,-1,-7",
            "spaceIds": [
              "h-2-0",
              "o-0",
              "o-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:8,-10,2",
            "spaceIds": [
              "o-3",
              "o-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:8,-4,-4",
            "spaceIds": [
              "h-2-1",
              "o-1",
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:8,-7,-1",
            "spaceIds": [
              "h-2-2",
              "o-2",
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:8,2,-10",
            "spaceIds": [
              "o-0",
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          }
        ]
      }
    },
    "hex": {
      "sector": {
        "id": "sector",
        "baseId": "sector",
        "layout": "hex",
        "typeId": null,
        "scope": "shared",
        "templateId": "star-sector",
        "fields": {},
        "playerId": null,
        "spaces": {
          "h-0-0": {
            "id": "h-0-0",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 0,
            "r": 0
          },
          "h-1-0": {
            "id": "h-1-0",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 1,
            "r": -1
          },
          "h-1-1": {
            "id": "h-1-1",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 1,
            "r": 0
          },
          "h-1-2": {
            "id": "h-1-2",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 0,
            "r": 1
          },
          "h-1-3": {
            "id": "h-1-3",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": -1,
            "r": 1
          },
          "h-1-4": {
            "id": "h-1-4",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": -1,
            "r": 0
          },
          "h-1-5": {
            "id": "h-1-5",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 0,
            "r": -1
          },
          "h-2-0": {
            "id": "h-2-0",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 2,
            "r": -2
          },
          "h-2-1": {
            "id": "h-2-1",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 2,
            "r": -1
          },
          "h-2-10": {
            "id": "h-2-10",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 0,
            "r": -2
          },
          "h-2-11": {
            "id": "h-2-11",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 1,
            "r": -2
          },
          "h-2-2": {
            "id": "h-2-2",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 2,
            "r": 0
          },
          "h-2-3": {
            "id": "h-2-3",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 1,
            "r": 1
          },
          "h-2-4": {
            "id": "h-2-4",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": 0,
            "r": 2
          },
          "h-2-5": {
            "id": "h-2-5",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": -1,
            "r": 2
          },
          "h-2-6": {
            "id": "h-2-6",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": -2,
            "r": 2
          },
          "h-2-7": {
            "id": "h-2-7",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": -2,
            "r": 1
          },
          "h-2-8": {
            "id": "h-2-8",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": -2,
            "r": 0
          },
          "h-2-9": {
            "id": "h-2-9",
            "name": null,
            "typeId": "land",
            "fields": {},
            "zoneId": null,
            "q": -1,
            "r": -1
          },
          "o-0": {
            "id": "o-0",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 3,
            "r": -3
          },
          "o-1": {
            "id": "o-1",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 3,
            "r": -2
          },
          "o-10": {
            "id": "o-10",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": -3,
            "r": 2
          },
          "o-11": {
            "id": "o-11",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": -3,
            "r": 1
          },
          "o-12": {
            "id": "o-12",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": -3,
            "r": 0
          },
          "o-13": {
            "id": "o-13",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": -2,
            "r": -1
          },
          "o-14": {
            "id": "o-14",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": -1,
            "r": -2
          },
          "o-15": {
            "id": "o-15",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 0,
            "r": -3
          },
          "o-16": {
            "id": "o-16",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 1,
            "r": -3
          },
          "o-17": {
            "id": "o-17",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 2,
            "r": -3
          },
          "o-2": {
            "id": "o-2",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 3,
            "r": -1
          },
          "o-3": {
            "id": "o-3",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 3,
            "r": 0
          },
          "o-4": {
            "id": "o-4",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 2,
            "r": 1
          },
          "o-5": {
            "id": "o-5",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 1,
            "r": 2
          },
          "o-6": {
            "id": "o-6",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": 0,
            "r": 3
          },
          "o-7": {
            "id": "o-7",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": -1,
            "r": 3
          },
          "o-8": {
            "id": "o-8",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": -2,
            "r": 3
          },
          "o-9": {
            "id": "o-9",
            "name": null,
            "typeId": "deepSpace",
            "fields": {},
            "zoneId": null,
            "q": -3,
            "r": 3
          }
        },
        "relations": [],
        "containers": {},
        "orientation": "pointy-top",
        "edges": [
          {
            "id": "hex-edge:-1,-1,2::-2,-2,4",
            "spaceIds": [
              "h-1-2",
              "h-1-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-1,2::-2,1,1",
            "spaceIds": [
              "h-0-0",
              "h-1-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-1,2::1,-2,1",
            "spaceIds": [
              "h-0-0",
              "h-1-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-10,11::-2,-8,10",
            "spaceIds": [
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-10,11::1,-11,10",
            "spaceIds": [
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-4,5::-2,-2,4",
            "spaceIds": [
              "h-1-2",
              "h-2-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-4,5::-2,-5,7",
            "spaceIds": [
              "h-2-4",
              "h-2-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-4,5::1,-5,4",
            "spaceIds": [
              "h-1-2",
              "h-2-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-7,8::-2,-5,7",
            "spaceIds": [
              "h-2-4",
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-7,8::-2,-8,10",
            "spaceIds": [
              "o-6",
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,-7,8::1,-8,7",
            "spaceIds": [
              "h-2-4",
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,11,-10::-2,10,-8",
            "spaceIds": [
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,11,-10::1,10,-11",
            "spaceIds": [
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,2,-1::-2,1,1",
            "spaceIds": [
              "h-0-0",
              "h-1-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,2,-1::-2,4,-2",
            "spaceIds": [
              "h-1-4",
              "h-1-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,2,-1::1,1,-2",
            "spaceIds": [
              "h-0-0",
              "h-1-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,5,-4::-2,4,-2",
            "spaceIds": [
              "h-1-5",
              "h-2-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,5,-4::-2,7,-5",
            "spaceIds": [
              "h-2-10",
              "h-2-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,5,-4::1,4,-5",
            "spaceIds": [
              "h-1-5",
              "h-2-10"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,8,-7::-2,10,-8",
            "spaceIds": [
              "o-14",
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,8,-7::-2,7,-5",
            "spaceIds": [
              "h-2-10",
              "o-14"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-1,8,-7::1,7,-8",
            "spaceIds": [
              "h-2-10",
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,-1,11::-11,1,10",
            "spaceIds": [
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,-1,11::-8,-2,10",
            "spaceIds": [
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,11,-1::-11,10,1",
            "spaceIds": [
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,11,-1::-8,10,-2",
            "spaceIds": [
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,2,8::-11,1,10",
            "spaceIds": [
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,2,8::-11,4,7",
            "spaceIds": [
              "o-10"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,2,8::-8,1,7",
            "spaceIds": [
              "o-10",
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,5,5::-11,4,7",
            "spaceIds": [
              "o-10"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,5,5::-11,7,4",
            "spaceIds": [
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,5,5::-8,4,4",
            "spaceIds": [
              "o-10",
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,8,2::-11,10,1",
            "spaceIds": [
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,8,2::-11,7,4",
            "spaceIds": [
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-10,8,2::-8,7,1",
            "spaceIds": [
              "o-11",
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-2,-2,4::-4,-1,5",
            "spaceIds": [
              "h-1-3",
              "h-2-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-2,-5,7::-4,-4,8",
            "spaceIds": [
              "h-2-5",
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-2,-8,10::-4,-7,11",
            "spaceIds": [
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-2,1,1::-4,2,2",
            "spaceIds": [
              "h-1-3",
              "h-1-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-2,10,-8::-4,11,-7",
            "spaceIds": [
              "o-14"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-2,4,-2::-4,5,-1",
            "spaceIds": [
              "h-1-4",
              "h-2-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-2,7,-5::-4,8,-4",
            "spaceIds": [
              "h-2-9",
              "o-14"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 8
            }
          },
          {
            "id": "hex-edge:-4,-1,5::-5,-2,7",
            "spaceIds": [
              "h-2-5",
              "h-2-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,-1,5::-5,1,4",
            "spaceIds": [
              "h-1-3",
              "h-2-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,-4,8::-5,-2,7",
            "spaceIds": [
              "h-2-5",
              "o-8"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 5
            }
          },
          {
            "id": "hex-edge:-4,-4,8::-5,-5,10",
            "spaceIds": [
              "o-7",
              "o-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,-7,11::-5,-5,10",
            "spaceIds": [
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,11,-7::-5,10,-5",
            "spaceIds": [
              "o-14"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,2,2::-5,1,4",
            "spaceIds": [
              "h-1-3",
              "h-2-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,2,2::-5,4,1",
            "spaceIds": [
              "h-1-4",
              "h-2-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,5,-1::-5,4,1",
            "spaceIds": [
              "h-1-4",
              "h-2-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,5,-1::-5,7,-2",
            "spaceIds": [
              "h-2-8",
              "h-2-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,8,-4::-5,10,-5",
            "spaceIds": [
              "o-13",
              "o-14"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-4,8,-4::-5,7,-2",
            "spaceIds": [
              "h-2-9",
              "o-13"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-5,-2,7::-7,-1,8",
            "spaceIds": [
              "h-2-6",
              "o-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-5,-5,10::-7,-4,11",
            "spaceIds": [
              "o-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-5,1,4::-7,2,5",
            "spaceIds": [
              "h-2-6",
              "h-2-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-5,10,-5::-7,11,-4",
            "spaceIds": [
              "o-13"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-5,4,1::-7,5,2",
            "spaceIds": [
              "h-2-7",
              "h-2-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-5,7,-2::-7,8,-1",
            "spaceIds": [
              "h-2-8",
              "o-13"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 7
            }
          },
          {
            "id": "hex-edge:-7,-1,8::-8,-2,10",
            "spaceIds": [
              "o-8",
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-7,-1,8::-8,1,7",
            "spaceIds": [
              "h-2-6",
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-7,-4,11::-8,-2,10",
            "spaceIds": [
              "o-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-7,11,-4::-8,10,-2",
            "spaceIds": [
              "o-13"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-7,2,5::-8,1,7",
            "spaceIds": [
              "h-2-6",
              "o-10"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-7,2,5::-8,4,4",
            "spaceIds": [
              "h-2-7",
              "o-10"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 6
            }
          },
          {
            "id": "hex-edge:-7,5,2::-8,4,4",
            "spaceIds": [
              "h-2-7",
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-7,5,2::-8,7,1",
            "spaceIds": [
              "h-2-8",
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-7,8,-1::-8,10,-2",
            "spaceIds": [
              "o-12",
              "o-13"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:-7,8,-1::-8,7,1",
            "spaceIds": [
              "h-2-8",
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,-11,10::2,-10,8",
            "spaceIds": [
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,-2,1::2,-1,-1",
            "spaceIds": [
              "h-0-0",
              "h-1-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,-2,1::2,-4,2",
            "spaceIds": [
              "h-1-1",
              "h-1-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,-5,4::2,-4,2",
            "spaceIds": [
              "h-1-2",
              "h-2-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,-5,4::2,-7,5",
            "spaceIds": [
              "h-2-3",
              "h-2-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,-8,7::2,-10,8",
            "spaceIds": [
              "o-5",
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,-8,7::2,-7,5",
            "spaceIds": [
              "h-2-4",
              "o-5"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 4
            }
          },
          {
            "id": "hex-edge:1,1,-2::2,-1,-1",
            "spaceIds": [
              "h-0-0",
              "h-1-0"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,1,-2::2,2,-4",
            "spaceIds": [
              "h-1-0",
              "h-1-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,10,-11::2,8,-10",
            "spaceIds": [
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,4,-5::2,2,-4",
            "spaceIds": [
              "h-1-5",
              "h-2-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,4,-5::2,5,-7",
            "spaceIds": [
              "h-2-10",
              "h-2-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,7,-8::2,5,-7",
            "spaceIds": [
              "h-2-10",
              "o-16"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:1,7,-8::2,8,-10",
            "spaceIds": [
              "o-15",
              "o-16"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-11,1::11,-10,-1",
            "spaceIds": [
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-11,1::8,-10,2",
            "spaceIds": [
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-2,-8::11,-1,-10",
            "spaceIds": [
              "o-0"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-2,-8::11,-4,-7",
            "spaceIds": [
              "o-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-2,-8::8,-1,-7",
            "spaceIds": [
              "o-0",
              "o-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-5,-5::11,-4,-7",
            "spaceIds": [
              "o-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-5,-5::11,-7,-4",
            "spaceIds": [
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-5,-5::8,-4,-4",
            "spaceIds": [
              "o-1",
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-8,-2::11,-10,-1",
            "spaceIds": [
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-8,-2::11,-7,-4",
            "spaceIds": [
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,-8,-2::8,-7,-1",
            "spaceIds": [
              "o-2",
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,1,-11::11,-1,-10",
            "spaceIds": [
              "o-0"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:10,1,-11::8,2,-10",
            "spaceIds": [
              "o-0"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:2,-1,-1::4,-2,-2",
            "spaceIds": [
              "h-1-0",
              "h-1-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:2,-10,8::4,-11,7",
            "spaceIds": [
              "o-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:2,-4,2::4,-5,1",
            "spaceIds": [
              "h-1-1",
              "h-2-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:2,-7,5::4,-8,4",
            "spaceIds": [
              "h-2-3",
              "o-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:2,2,-4::4,1,-5",
            "spaceIds": [
              "h-1-0",
              "h-2-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:2,5,-7::4,4,-8",
            "spaceIds": [
              "h-2-11",
              "o-16"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 0
            }
          },
          {
            "id": "hex-edge:2,8,-10::4,7,-11",
            "spaceIds": [
              "o-16"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,-11,7::5,-10,5",
            "spaceIds": [
              "o-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,-2,-2::5,-1,-4",
            "spaceIds": [
              "h-1-0",
              "h-2-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,-2,-2::5,-4,-1",
            "spaceIds": [
              "h-1-1",
              "h-2-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,-5,1::5,-4,-1",
            "spaceIds": [
              "h-1-1",
              "h-2-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,-5,1::5,-7,2",
            "spaceIds": [
              "h-2-2",
              "h-2-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,-8,4::5,-10,5",
            "spaceIds": [
              "o-4",
              "o-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,-8,4::5,-7,2",
            "spaceIds": [
              "h-2-3",
              "o-4"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 3
            }
          },
          {
            "id": "hex-edge:4,1,-5::5,-1,-4",
            "spaceIds": [
              "h-1-0",
              "h-2-0"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,1,-5::5,2,-7",
            "spaceIds": [
              "h-2-0",
              "h-2-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,4,-8::5,2,-7",
            "spaceIds": [
              "h-2-11",
              "o-17"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 1
            }
          },
          {
            "id": "hex-edge:4,4,-8::5,5,-10",
            "spaceIds": [
              "o-16",
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:4,7,-11::5,5,-10",
            "spaceIds": [
              "o-16"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:5,-1,-4::7,-2,-5",
            "spaceIds": [
              "h-2-0",
              "h-2-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:5,-10,5::7,-11,4",
            "spaceIds": [
              "o-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:5,-4,-1::7,-5,-2",
            "spaceIds": [
              "h-2-1",
              "h-2-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:5,-7,2::7,-8,1",
            "spaceIds": [
              "h-2-2",
              "o-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:5,2,-7::7,1,-8",
            "spaceIds": [
              "h-2-0",
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:5,5,-10::7,4,-11",
            "spaceIds": [
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,-11,4::8,-10,2",
            "spaceIds": [
              "o-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,-2,-5::8,-1,-7",
            "spaceIds": [
              "h-2-0",
              "o-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,-2,-5::8,-4,-4",
            "spaceIds": [
              "h-2-1",
              "o-1"
            ],
            "typeId": "relay",
            "label": null,
            "ownerId": null,
            "fields": {
              "relayIndex": 2
            }
          },
          {
            "id": "hex-edge:7,-5,-2::8,-4,-4",
            "spaceIds": [
              "h-2-1",
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,-5,-2::8,-7,-1",
            "spaceIds": [
              "h-2-2",
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,-8,1::8,-10,2",
            "spaceIds": [
              "o-3",
              "o-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,-8,1::8,-7,-1",
            "spaceIds": [
              "h-2-2",
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,1,-8::8,-1,-7",
            "spaceIds": [
              "h-2-0",
              "o-0"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,1,-8::8,2,-10",
            "spaceIds": [
              "o-0",
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-edge:7,4,-11::8,2,-10",
            "spaceIds": [
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          }
        ],
        "vertices": [
          {
            "id": "hex-vertex:-1,-1,2",
            "spaceIds": [
              "h-0-0",
              "h-1-2",
              "h-1-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-1,-10,11",
            "spaceIds": [
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-1,-4,5",
            "spaceIds": [
              "h-1-2",
              "h-2-4",
              "h-2-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-1,-7,8",
            "spaceIds": [
              "h-2-4",
              "o-6",
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-1,11,-10",
            "spaceIds": [
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-1,2,-1",
            "spaceIds": [
              "h-0-0",
              "h-1-4",
              "h-1-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-1,5,-4",
            "spaceIds": [
              "h-1-5",
              "h-2-10",
              "h-2-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-1,8,-7",
            "spaceIds": [
              "h-2-10",
              "o-14",
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-10,-1,11",
            "spaceIds": [
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-10,11,-1",
            "spaceIds": [
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-10,2,8",
            "spaceIds": [
              "o-10",
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-10,5,5",
            "spaceIds": [
              "o-10",
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-10,8,2",
            "spaceIds": [
              "o-11",
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-11,1,10",
            "spaceIds": [
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-11,10,1",
            "spaceIds": [
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-11,4,7",
            "spaceIds": [
              "o-10"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-11,7,4",
            "spaceIds": [
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-2,-2,4",
            "spaceIds": [
              "h-1-2",
              "h-1-3",
              "h-2-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-2,-5,7",
            "spaceIds": [
              "h-2-4",
              "h-2-5",
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-2,-8,10",
            "spaceIds": [
              "o-6",
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-2,1,1",
            "spaceIds": [
              "h-0-0",
              "h-1-3",
              "h-1-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-2,10,-8",
            "spaceIds": [
              "o-14",
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-2,4,-2",
            "spaceIds": [
              "h-1-4",
              "h-1-5",
              "h-2-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-2,7,-5",
            "spaceIds": [
              "h-2-10",
              "h-2-9",
              "o-14"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-4,-1,5",
            "spaceIds": [
              "h-1-3",
              "h-2-5",
              "h-2-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-4,-4,8",
            "spaceIds": [
              "h-2-5",
              "o-7",
              "o-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-4,-7,11",
            "spaceIds": [
              "o-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-4,11,-7",
            "spaceIds": [
              "o-14"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-4,2,2",
            "spaceIds": [
              "h-1-3",
              "h-1-4",
              "h-2-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-4,5,-1",
            "spaceIds": [
              "h-1-4",
              "h-2-8",
              "h-2-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-4,8,-4",
            "spaceIds": [
              "h-2-9",
              "o-13",
              "o-14"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-5,-2,7",
            "spaceIds": [
              "h-2-5",
              "h-2-6",
              "o-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-5,-5,10",
            "spaceIds": [
              "o-7",
              "o-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-5,1,4",
            "spaceIds": [
              "h-1-3",
              "h-2-6",
              "h-2-7"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-5,10,-5",
            "spaceIds": [
              "o-13",
              "o-14"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-5,4,1",
            "spaceIds": [
              "h-1-4",
              "h-2-7",
              "h-2-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-5,7,-2",
            "spaceIds": [
              "h-2-8",
              "h-2-9",
              "o-13"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-7,-1,8",
            "spaceIds": [
              "h-2-6",
              "o-8",
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-7,-4,11",
            "spaceIds": [
              "o-8"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-7,11,-4",
            "spaceIds": [
              "o-13"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-7,2,5",
            "spaceIds": [
              "h-2-6",
              "h-2-7",
              "o-10"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-7,5,2",
            "spaceIds": [
              "h-2-7",
              "h-2-8",
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-7,8,-1",
            "spaceIds": [
              "h-2-8",
              "o-12",
              "o-13"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-8,-2,10",
            "spaceIds": [
              "o-8",
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-8,1,7",
            "spaceIds": [
              "h-2-6",
              "o-10",
              "o-9"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-8,10,-2",
            "spaceIds": [
              "o-12",
              "o-13"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-8,4,4",
            "spaceIds": [
              "h-2-7",
              "o-10",
              "o-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:-8,7,1",
            "spaceIds": [
              "h-2-8",
              "o-11",
              "o-12"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:1,-11,10",
            "spaceIds": [
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:1,-2,1",
            "spaceIds": [
              "h-0-0",
              "h-1-1",
              "h-1-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:1,-5,4",
            "spaceIds": [
              "h-1-2",
              "h-2-3",
              "h-2-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:1,-8,7",
            "spaceIds": [
              "h-2-4",
              "o-5",
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:1,1,-2",
            "spaceIds": [
              "h-0-0",
              "h-1-0",
              "h-1-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:1,10,-11",
            "spaceIds": [
              "o-15"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:1,4,-5",
            "spaceIds": [
              "h-1-5",
              "h-2-10",
              "h-2-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:1,7,-8",
            "spaceIds": [
              "h-2-10",
              "o-15",
              "o-16"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:10,-11,1",
            "spaceIds": [
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:10,-2,-8",
            "spaceIds": [
              "o-0",
              "o-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:10,-5,-5",
            "spaceIds": [
              "o-1",
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:10,-8,-2",
            "spaceIds": [
              "o-2",
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:10,1,-11",
            "spaceIds": [
              "o-0"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:11,-1,-10",
            "spaceIds": [
              "o-0"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:11,-10,-1",
            "spaceIds": [
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:11,-4,-7",
            "spaceIds": [
              "o-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:11,-7,-4",
            "spaceIds": [
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:2,-1,-1",
            "spaceIds": [
              "h-0-0",
              "h-1-0",
              "h-1-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:2,-10,8",
            "spaceIds": [
              "o-5",
              "o-6"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:2,-4,2",
            "spaceIds": [
              "h-1-1",
              "h-1-2",
              "h-2-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:2,-7,5",
            "spaceIds": [
              "h-2-3",
              "h-2-4",
              "o-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:2,2,-4",
            "spaceIds": [
              "h-1-0",
              "h-1-5",
              "h-2-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:2,5,-7",
            "spaceIds": [
              "h-2-10",
              "h-2-11",
              "o-16"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:2,8,-10",
            "spaceIds": [
              "o-15",
              "o-16"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:4,-11,7",
            "spaceIds": [
              "o-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:4,-2,-2",
            "spaceIds": [
              "h-1-0",
              "h-1-1",
              "h-2-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:4,-5,1",
            "spaceIds": [
              "h-1-1",
              "h-2-2",
              "h-2-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:4,-8,4",
            "spaceIds": [
              "h-2-3",
              "o-4",
              "o-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:4,1,-5",
            "spaceIds": [
              "h-1-0",
              "h-2-0",
              "h-2-11"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:4,4,-8",
            "spaceIds": [
              "h-2-11",
              "o-16",
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:4,7,-11",
            "spaceIds": [
              "o-16"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:5,-1,-4",
            "spaceIds": [
              "h-1-0",
              "h-2-0",
              "h-2-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:5,-10,5",
            "spaceIds": [
              "o-4",
              "o-5"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:5,-4,-1",
            "spaceIds": [
              "h-1-1",
              "h-2-1",
              "h-2-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:5,-7,2",
            "spaceIds": [
              "h-2-2",
              "h-2-3",
              "o-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:5,2,-7",
            "spaceIds": [
              "h-2-0",
              "h-2-11",
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:5,5,-10",
            "spaceIds": [
              "o-16",
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:7,-11,4",
            "spaceIds": [
              "o-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:7,-2,-5",
            "spaceIds": [
              "h-2-0",
              "h-2-1",
              "o-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:7,-5,-2",
            "spaceIds": [
              "h-2-1",
              "h-2-2",
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:7,-8,1",
            "spaceIds": [
              "h-2-2",
              "o-3",
              "o-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:7,1,-8",
            "spaceIds": [
              "h-2-0",
              "o-0",
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:7,4,-11",
            "spaceIds": [
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:8,-1,-7",
            "spaceIds": [
              "h-2-0",
              "o-0",
              "o-1"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:8,-10,2",
            "spaceIds": [
              "o-3",
              "o-4"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:8,-4,-4",
            "spaceIds": [
              "h-2-1",
              "o-1",
              "o-2"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:8,-7,-1",
            "spaceIds": [
              "h-2-2",
              "o-2",
              "o-3"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          },
          {
            "id": "hex-vertex:8,2,-10",
            "spaceIds": [
              "o-0",
              "o-17"
            ],
            "typeId": null,
            "label": null,
            "ownerId": null,
            "fields": {}
          }
        ]
      }
    },
    "square": {},
    "network": {},
    "track": {}
  },
  "dice": {
    "die-1": {
      "componentType": "die",
      "id": "die-1",
      "dieTypeId": "d6",
      "dieName": "Six-sided die",
      "ownerId": null,
      "sides": 6,
      "value": null,
      "properties": {}
    },
    "die-2": {
      "componentType": "die",
      "id": "die-2",
      "dieTypeId": "d6",
      "dieName": "Six-sided die",
      "ownerId": null,
      "sides": 6,
      "value": null,
      "properties": {}
    }
  }
} as const as unknown as TableState;
const baseDeckCardsByZoneId: Record<SharedZoneId, readonly CardId[]> = {
  "tech-deck": [
    "patrol-1",
    "patrol-2",
    "patrol-3",
    "patrol-4",
    "patrol-5",
    "patrol-6",
    "patrol-7",
    "patrol-8",
    "patrol-9",
    "patrol-10",
    "patrol-11",
    "patrol-12",
    "patrol-13",
    "patrol-14",
    "jumpGate-1",
    "jumpGate-2",
    "bountySurvey-1",
    "bountySurvey-2",
    "signalLock-1",
    "signalLock-2",
    "relicCache-1",
    "relicCache-2",
    "relicCache-3",
    "relicCache-4",
    "relicCache-5"
  ],
  "tech-played": []
} as const;

export function createInitialTable(options: {
  playerIds?: readonly string[];
  shuffleItems?: <Value>(values: readonly Value[]) => Value[];
} = {}): TableState {
  const resolvedPlayerIds = resolveDefaultPlayerIds(options.playerIds);
  const shuffleItems =
    options.shuffleItems ?? (<Value>(values: readonly Value[]) => [...values]);
  const table = cloneManifestDefault(baseInitialTable) as TableState;
  table.playerOrder = [...resolvedPlayerIds];
  table.zones = defaults.zones(resolvedPlayerIds);
  table.decks = defaults.decks();
  table.hands = defaults.hands(resolvedPlayerIds);
  table.resources = defaults.resources(resolvedPlayerIds);
  const componentLocations = cloneManifestDefault(
    baseInitialTable.componentLocations,
  ) as TableState["componentLocations"];

  for (const [zoneId, baseDeckCardIds] of Object.entries(
    baseDeckCardsByZoneId,
  ) as Array<[SharedZoneId, readonly CardId[]]>) {
    const shuffled = shuffleItems(baseDeckCardIds);
    (table.decks as Record<string, CardId[]>)[zoneId] = [...shuffled];
    (table.zones.shared as Record<string, CardId[]>)[zoneId] = [...shuffled];
    shuffled.forEach((componentId, position) => {
      const location = componentLocations[componentId];
      if (!location || location.type !== "InDeck") {
        return;
      }
      componentLocations[componentId] = {
        ...location,
        position,
      };
    });
  }

  table.componentLocations = componentLocations;
  return tableSchema.parse(table);
}

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
  staticBoards: staticBoards as unknown as StaticBoards<TableState>,
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

const boardIdsByLayoutLookup = {
  "hex": ["sector"] as const,
} as const;
const boardBaseIdsByLayoutLookup = {
  "hex": ["sector"] as const,
} as const;
const boardIdsByBaseIdLookup = {
  "sector": ["sector"] as const,
} as const;
const boardBaseIdsByTemplateIdLookup = {
  "star-sector": ["sector"] as const,
} as const;
const boardLayoutByIdLookup = {
  "sector": "hex",
} as const;
const boardTemplateLayoutByIdLookup = {
  "star-sector": "hex",
} as const;
const boardIdsByTypeIdLookup = {

} as const;
const spaceIdsByBoardIdLookup = {
  "sector": ["h-0-0", "h-1-0", "h-1-1", "h-1-2", "h-1-3", "h-1-4", "h-1-5", "h-2-0", "h-2-1", "h-2-10", "h-2-11", "h-2-2", "h-2-3", "h-2-4", "h-2-5", "h-2-6", "h-2-7", "h-2-8", "h-2-9", "o-0", "o-1", "o-10", "o-11", "o-12", "o-13", "o-14", "o-15", "o-16", "o-17", "o-2", "o-3", "o-4", "o-5", "o-6", "o-7", "o-8", "o-9"] as const,
} as const;
const spaceTypeIdByBoardIdLookup = {
  "sector": {
    "h-0-0": "land",
    "h-1-0": "land",
    "h-1-1": "land",
    "h-1-2": "land",
    "h-1-3": "land",
    "h-1-4": "land",
    "h-1-5": "land",
    "h-2-0": "land",
    "h-2-1": "land",
    "h-2-10": "land",
    "h-2-11": "land",
    "h-2-2": "land",
    "h-2-3": "land",
    "h-2-4": "land",
    "h-2-5": "land",
    "h-2-6": "land",
    "h-2-7": "land",
    "h-2-8": "land",
    "h-2-9": "land",
    "o-0": "deepSpace",
    "o-1": "deepSpace",
    "o-10": "deepSpace",
    "o-11": "deepSpace",
    "o-12": "deepSpace",
    "o-13": "deepSpace",
    "o-14": "deepSpace",
    "o-15": "deepSpace",
    "o-16": "deepSpace",
    "o-17": "deepSpace",
    "o-2": "deepSpace",
    "o-3": "deepSpace",
    "o-4": "deepSpace",
    "o-5": "deepSpace",
    "o-6": "deepSpace",
    "o-7": "deepSpace",
    "o-8": "deepSpace",
    "o-9": "deepSpace"
  }
} as const;
const spaceIdsByTypeIdLookup = {
  "deepSpace": ["o-0", "o-1", "o-10", "o-11", "o-12", "o-13", "o-14", "o-15", "o-16", "o-17", "o-2", "o-3", "o-4", "o-5", "o-6", "o-7", "o-8", "o-9"] as const,
  "land": ["h-0-0", "h-1-0", "h-1-1", "h-1-2", "h-1-3", "h-1-4", "h-1-5", "h-2-0", "h-2-1", "h-2-10", "h-2-11", "h-2-2", "h-2-3", "h-2-4", "h-2-5", "h-2-6", "h-2-7", "h-2-8", "h-2-9"] as const,
} as const;
const containerIdsByBoardIdLookup = {
  "sector": [] as const,
} as const;
const containerHostByBoardIdLookup = {
  "sector": {}
} as const;
const relationTypeIdsByBoardIdLookup = {
  "sector": ["adjacent"] as const,
} as const;
const edgeIdsByTypeIdLookup = {
  "relay": ["hex-edge:-2,7,-5::-4,8,-4", "hex-edge:-4,-4,8::-5,-2,7", "hex-edge:-5,7,-2::-7,8,-1", "hex-edge:-7,2,5::-8,4,4", "hex-edge:1,-8,7::2,-7,5", "hex-edge:2,5,-7::4,4,-8", "hex-edge:4,-8,4::5,-7,2", "hex-edge:4,4,-8::5,2,-7", "hex-edge:7,-2,-5::8,-4,-4"] as const,
} as const;
const edgeIdsByBoardIdAndTypeIdLookup = {
  "sector": {
    "relay": [
      "hex-edge:-2,7,-5::-4,8,-4",
      "hex-edge:-4,-4,8::-5,-2,7",
      "hex-edge:-5,7,-2::-7,8,-1",
      "hex-edge:-7,2,5::-8,4,4",
      "hex-edge:1,-8,7::2,-7,5",
      "hex-edge:2,5,-7::4,4,-8",
      "hex-edge:4,-8,4::5,-7,2",
      "hex-edge:4,4,-8::5,2,-7",
      "hex-edge:7,-2,-5::8,-4,-4"
    ]
  }
} as const;
const vertexIdsByTypeIdLookup = {

} as const;
const vertexIdsByBoardIdAndTypeIdLookup = {
  "sector": {}
} as const;
const authoredHexEdgesByBoardIdLookup = {
  "sector": [
    {
      "ref": {
        "spaces": [
          "h-2-11",
          "o-16"
        ]
      },
      "fields": {
        "relayIndex": 0
      },
      "typeId": "relay"
    },
    {
      "ref": {
        "spaces": [
          "h-2-11",
          "o-17"
        ]
      },
      "fields": {
        "relayIndex": 1
      },
      "typeId": "relay"
    },
    {
      "ref": {
        "spaces": [
          "h-2-1",
          "o-1"
        ]
      },
      "fields": {
        "relayIndex": 2
      },
      "typeId": "relay"
    },
    {
      "ref": {
        "spaces": [
          "h-2-3",
          "o-4"
        ]
      },
      "fields": {
        "relayIndex": 3
      },
      "typeId": "relay"
    },
    {
      "ref": {
        "spaces": [
          "h-2-4",
          "o-5"
        ]
      },
      "fields": {
        "relayIndex": 4
      },
      "typeId": "relay"
    },
    {
      "ref": {
        "spaces": [
          "h-2-5",
          "o-8"
        ]
      },
      "fields": {
        "relayIndex": 5
      },
      "typeId": "relay"
    },
    {
      "ref": {
        "spaces": [
          "h-2-7",
          "o-10"
        ]
      },
      "fields": {
        "relayIndex": 6
      },
      "typeId": "relay"
    },
    {
      "ref": {
        "spaces": [
          "h-2-8",
          "o-13"
        ]
      },
      "fields": {
        "relayIndex": 7
      },
      "typeId": "relay"
    },
    {
      "ref": {
        "spaces": [
          "h-2-9",
          "o-14"
        ]
      },
      "fields": {
        "relayIndex": 8
      },
      "typeId": "relay"
    }
  ]
} as const;
const authoredHexVerticesByBoardIdLookup = {
  "sector": []
} as const;
const authoredHexEdgeIdsByBoardIdAndRefLookup = {
  "sector": {
    "h-2-1$$o-1": "hex-edge:7,-2,-5::8,-4,-4",
    "h-2-11$$o-16": "hex-edge:2,5,-7::4,4,-8",
    "h-2-11$$o-17": "hex-edge:4,4,-8::5,2,-7",
    "h-2-3$$o-4": "hex-edge:4,-8,4::5,-7,2",
    "h-2-4$$o-5": "hex-edge:1,-8,7::2,-7,5",
    "h-2-5$$o-8": "hex-edge:-4,-4,8::-5,-2,7",
    "h-2-7$$o-10": "hex-edge:-7,2,5::-8,4,4",
    "h-2-8$$o-13": "hex-edge:-5,7,-2::-7,8,-1",
    "h-2-9$$o-14": "hex-edge:-2,7,-5::-4,8,-4"
  }
} as const;
const authoredHexVertexIdsByBoardIdAndRefLookup = {
  "sector": {}
} as const;

function authoredHexRefKey(spaceIds: readonly string[]): string {
  return [...spaceIds]
    .sort((left, right) => left.localeCompare(right))
    .join("$$");
}

type BoardLookupIdValue<
  Lookup extends Record<string, Record<string, readonly string[]>>,
  Key extends keyof Lookup,
> = Extract<Lookup[Key][keyof Lookup[Key]], readonly string[]>[number];

function flattenBoardScopedIds<
  Lookup extends Record<string, Record<string, readonly string[]>>,
  Key extends keyof Lookup,
>(lookup: Lookup, key: Key): ReadonlyArray<BoardLookupIdValue<Lookup, Key>> {
  return Object.values(lookup[key] ?? {}).flat() as ReadonlyArray<
    BoardLookupIdValue<Lookup, Key>
  >;
}

export const boardHelpers = {
  boardIdsForLayout<
    LayoutValue extends keyof typeof boardIdsByLayoutLookup,
  >(layout: LayoutValue): (typeof boardIdsByLayoutLookup)[LayoutValue] {
    return boardIdsByLayoutLookup[layout];
  },
  boardBaseIdsForLayout<
    LayoutValue extends keyof typeof boardBaseIdsByLayoutLookup,
  >(layout: LayoutValue): (typeof boardBaseIdsByLayoutLookup)[LayoutValue] {
    return boardBaseIdsByLayoutLookup[layout];
  },
  boardIdsForBase<
    BoardBaseIdValue extends keyof typeof boardIdsByBaseIdLookup,
  >(
    boardBaseId: BoardBaseIdValue,
  ): (typeof boardIdsByBaseIdLookup)[BoardBaseIdValue] {
    return boardIdsByBaseIdLookup[boardBaseId];
  },
  boardBaseIdsForTemplate<
    TemplateIdValue extends keyof typeof boardBaseIdsByTemplateIdLookup,
  >(
    templateId: TemplateIdValue,
  ): (typeof boardBaseIdsByTemplateIdLookup)[TemplateIdValue] {
    return boardBaseIdsByTemplateIdLookup[templateId];
  },
  boardIdsForType<TypeIdValue extends keyof typeof boardIdsByTypeIdLookup>(
    typeId: TypeIdValue,
  ): (typeof boardIdsByTypeIdLookup)[TypeIdValue] {
    return boardIdsByTypeIdLookup[typeId];
  },
  boardLayout<BoardIdValue extends keyof typeof boardLayoutByIdLookup>(
    boardId: BoardIdValue,
  ): (typeof boardLayoutByIdLookup)[BoardIdValue] {
    return boardLayoutByIdLookup[boardId];
  },
  boardTemplateLayout<
    TemplateIdValue extends keyof typeof boardTemplateLayoutByIdLookup,
  >(
    templateId: TemplateIdValue,
  ): (typeof boardTemplateLayoutByIdLookup)[TemplateIdValue] {
    return boardTemplateLayoutByIdLookup[templateId];
  },
  spaceIds<BoardIdValue extends keyof typeof spaceIdsByBoardIdLookup>(
    boardId: BoardIdValue,
  ): (typeof spaceIdsByBoardIdLookup)[BoardIdValue] {
    return spaceIdsByBoardIdLookup[boardId];
  },
  spaceRecord<
    BoardIdValue extends keyof typeof spaceIdsByBoardIdLookup,
    Value,
  >(
    boardId: BoardIdValue,
    initial:
      | Value
      | ((
          spaceId: (typeof spaceIdsByBoardIdLookup)[BoardIdValue][number],
        ) => Value),
  ): Record<(typeof spaceIdsByBoardIdLookup)[BoardIdValue][number], Value> {
    const spaceIds = spaceIdsByBoardIdLookup[boardId];
    if (!spaceIds) {
      throw new Error(`Unknown board '${String(boardId)}'.`);
    }
    return buildTypedRecord(spaceIds, initial) as Record<
      (typeof spaceIdsByBoardIdLookup)[BoardIdValue][number],
      Value
    >;
  },
  isSpaceId<BoardIdValue extends keyof typeof spaceIdsByBoardIdLookup>(
    boardId: BoardIdValue,
    value: string,
  ): value is (typeof spaceIdsByBoardIdLookup)[BoardIdValue][number] {
    const spaceIds = spaceIdsByBoardIdLookup[boardId];
    return spaceIds ? isTypedId(spaceIds, value) : false;
  },
  expectSpaceId<BoardIdValue extends keyof typeof spaceIdsByBoardIdLookup>(
    boardId: BoardIdValue,
    value: string,
  ): (typeof spaceIdsByBoardIdLookup)[BoardIdValue][number] {
    const spaceIds = spaceIdsByBoardIdLookup[boardId];
    if (!spaceIds || !isTypedId(spaceIds, value)) {
      throw new Error(
        `Unknown space id '${value}' on board '${String(boardId)}'.`,
      );
    }
    return value as (typeof spaceIdsByBoardIdLookup)[BoardIdValue][number];
  },
  spaceKinds<BoardIdValue extends keyof typeof spaceTypeIdByBoardIdLookup>(
    boardId: BoardIdValue,
  ): (typeof spaceTypeIdByBoardIdLookup)[BoardIdValue] {
    return spaceTypeIdByBoardIdLookup[boardId];
  },
  spaceIdsForType<TypeIdValue extends keyof typeof spaceIdsByTypeIdLookup>(
    typeId: TypeIdValue,
  ): (typeof spaceIdsByTypeIdLookup)[TypeIdValue] {
    return spaceIdsByTypeIdLookup[typeId];
  },
  containerIds<BoardIdValue extends keyof typeof containerIdsByBoardIdLookup>(
    boardId: BoardIdValue,
  ): (typeof containerIdsByBoardIdLookup)[BoardIdValue] {
    return containerIdsByBoardIdLookup[boardId];
  },
  containerRecord<
    BoardIdValue extends keyof typeof containerIdsByBoardIdLookup,
    Value,
  >(
    boardId: BoardIdValue,
    initial:
      | Value
      | ((
          containerId: (typeof containerIdsByBoardIdLookup)[BoardIdValue][number],
        ) => Value),
  ): Record<
    (typeof containerIdsByBoardIdLookup)[BoardIdValue][number],
    Value
  > {
    const containerIds = containerIdsByBoardIdLookup[boardId];
    if (!containerIds) {
      throw new Error(`Unknown board '${String(boardId)}'.`);
    }
    return buildTypedRecord(containerIds, initial) as Record<
      (typeof containerIdsByBoardIdLookup)[BoardIdValue][number],
      Value
    >;
  },
  isContainerId<
    BoardIdValue extends keyof typeof containerIdsByBoardIdLookup,
  >(
    boardId: BoardIdValue,
    value: string,
  ): value is (typeof containerIdsByBoardIdLookup)[BoardIdValue][number] {
    const containerIds = containerIdsByBoardIdLookup[boardId];
    return containerIds ? isTypedId(containerIds, value) : false;
  },
  expectContainerId<
    BoardIdValue extends keyof typeof containerIdsByBoardIdLookup,
  >(
    boardId: BoardIdValue,
    value: string,
  ): (typeof containerIdsByBoardIdLookup)[BoardIdValue][number] {
    const containerIds = containerIdsByBoardIdLookup[boardId];
    if (!containerIds || !isTypedId(containerIds, value)) {
      throw new Error(
        `Unknown container id '${value}' on board '${String(boardId)}'.`,
      );
    }
    return value as (typeof containerIdsByBoardIdLookup)[BoardIdValue][number];
  },
  containerHost<
    BoardIdValue extends keyof typeof containerHostByBoardIdLookup,
    ContainerIdValue extends keyof (typeof containerHostByBoardIdLookup)[BoardIdValue],
  >(
    boardId: BoardIdValue,
    containerId: ContainerIdValue,
  ): (typeof containerHostByBoardIdLookup)[BoardIdValue][ContainerIdValue] {
    const containers = containerHostByBoardIdLookup[boardId];
    const containerHost = containers?.[containerId];
    if (!containerHost) {
      throw new Error(
        `Unknown container '${String(containerId)}' on board '${String(boardId)}'.`,
      );
    }
    return containerHost as (typeof containerHostByBoardIdLookup)[BoardIdValue][ContainerIdValue];
  },
  relationTypeIds<
    BoardIdValue extends keyof typeof relationTypeIdsByBoardIdLookup,
  >(
    boardId: BoardIdValue,
  ): (typeof relationTypeIdsByBoardIdLookup)[BoardIdValue] {
    return relationTypeIdsByBoardIdLookup[boardId];
  },
  relationTypeRecord<
    BoardIdValue extends keyof typeof relationTypeIdsByBoardIdLookup,
    Value,
  >(
    boardId: BoardIdValue,
    initial:
      | Value
      | ((
          relationTypeId: (typeof relationTypeIdsByBoardIdLookup)[BoardIdValue][number],
        ) => Value),
  ): Record<
    (typeof relationTypeIdsByBoardIdLookup)[BoardIdValue][number],
    Value
  > {
    const relationTypeIds = relationTypeIdsByBoardIdLookup[boardId];
    if (!relationTypeIds) {
      throw new Error(`Unknown board '${String(boardId)}'.`);
    }
    return buildTypedRecord(relationTypeIds, initial) as Record<
      (typeof relationTypeIdsByBoardIdLookup)[BoardIdValue][number],
      Value
    >;
  },
  isRelationTypeId<
    BoardIdValue extends keyof typeof relationTypeIdsByBoardIdLookup,
  >(
    boardId: BoardIdValue,
    value: string,
  ): value is (typeof relationTypeIdsByBoardIdLookup)[BoardIdValue][number] {
    const relationTypeIds = relationTypeIdsByBoardIdLookup[boardId];
    return relationTypeIds ? isTypedId(relationTypeIds, value) : false;
  },
  expectRelationTypeId<
    BoardIdValue extends keyof typeof relationTypeIdsByBoardIdLookup,
  >(
    boardId: BoardIdValue,
    value: string,
  ): (typeof relationTypeIdsByBoardIdLookup)[BoardIdValue][number] {
    const relationTypeIds = relationTypeIdsByBoardIdLookup[boardId];
    if (!relationTypeIds || !isTypedId(relationTypeIds, value)) {
      throw new Error(
        `Unknown relation type id '${value}' on board '${String(boardId)}'.`,
      );
    }
    return value as (typeof relationTypeIdsByBoardIdLookup)[BoardIdValue][number];
  },
  authoredHexEdges<
    BoardIdValue extends keyof typeof authoredHexEdgesByBoardIdLookup,
  >(
    boardId: BoardIdValue,
  ): (typeof authoredHexEdgesByBoardIdLookup)[BoardIdValue] {
    const authoredHexEdges = authoredHexEdgesByBoardIdLookup[boardId];
    if (!authoredHexEdges) {
      throw new Error(`Unknown hex board '${String(boardId)}'.`);
    }
    return authoredHexEdges;
  },
  authoredHexVertices<
    BoardIdValue extends keyof typeof authoredHexVerticesByBoardIdLookup,
  >(
    boardId: BoardIdValue,
  ): (typeof authoredHexVerticesByBoardIdLookup)[BoardIdValue] {
    const authoredHexVertices = authoredHexVerticesByBoardIdLookup[boardId];
    if (!authoredHexVertices) {
      throw new Error(`Unknown hex board '${String(boardId)}'.`);
    }
    return authoredHexVertices;
  },
  resolveHexEdgeId<
    BoardIdValue extends keyof typeof authoredHexEdgeIdsByBoardIdAndRefLookup,
  >(
    boardId: BoardIdValue,
    ref: HexAuthoredEdgeRef<BoardIdValue>,
  ): HexEdgeState<BoardIdValue>["id"] {
    const boardEdges = authoredHexEdgeIdsByBoardIdAndRefLookup[boardId];
    if (!boardEdges) {
      throw new Error(`Unknown hex board '${String(boardId)}'.`);
    }
    const edgeRef = ref as { spaces: readonly string[] };
    const edgeId = (boardEdges as Record<string, HexEdgeState<BoardIdValue>["id"]>)[
      authoredHexRefKey(edgeRef.spaces)
    ];
    if (!edgeId) {
      throw new Error(
        `Unknown authored hex edge ref '${edgeRef.spaces.join(", ")}' on board '${String(boardId)}'.`,
      );
    }
    return edgeId as HexEdgeState<BoardIdValue>["id"];
  },
  resolveHexVertexId<
    BoardIdValue extends keyof typeof authoredHexVertexIdsByBoardIdAndRefLookup,
  >(
    boardId: BoardIdValue,
    ref: HexAuthoredVertexRef<BoardIdValue>,
  ): HexVertexState<BoardIdValue>["id"] {
    const boardVertices = authoredHexVertexIdsByBoardIdAndRefLookup[boardId];
    if (!boardVertices) {
      throw new Error(`Unknown hex board '${String(boardId)}'.`);
    }
    const vertexRef = ref as { spaces: readonly string[] };
    const vertexId = (
      boardVertices as Record<string, HexVertexState<BoardIdValue>["id"]>
    )[authoredHexRefKey(vertexRef.spaces)];
    if (!vertexId) {
      throw new Error(
        `Unknown authored hex vertex ref '${vertexRef.spaces.join(", ")}' on board '${String(boardId)}'.`,
      );
    }
    return vertexId as HexVertexState<BoardIdValue>["id"];
  },
  edgeIdsForType<TypeIdValue extends keyof typeof edgeIdsByTypeIdLookup>(
    typeId: TypeIdValue,
  ): (typeof edgeIdsByTypeIdLookup)[TypeIdValue] {
    return edgeIdsByTypeIdLookup[typeId];
  },
  edgeRecord<
    BoardIdValue extends keyof typeof edgeIdsByBoardIdAndTypeIdLookup,
    Value,
  >(
    boardId: BoardIdValue,
    initial:
      | Value
      | ((
          edgeId: BoardLookupIdValue<
            typeof edgeIdsByBoardIdAndTypeIdLookup,
            BoardIdValue
          >,
        ) => Value),
  ): Record<
    BoardLookupIdValue<typeof edgeIdsByBoardIdAndTypeIdLookup, BoardIdValue>,
    Value
  > {
    const boardEdges = edgeIdsByBoardIdAndTypeIdLookup[boardId];
    const edgeIds = boardEdges
      ? flattenBoardScopedIds(edgeIdsByBoardIdAndTypeIdLookup, boardId)
      : undefined;
    if (!edgeIds) {
      throw new Error(`Unknown board '${String(boardId)}'.`);
    }
    return buildTypedRecord(edgeIds, initial) as Record<
      BoardLookupIdValue<typeof edgeIdsByBoardIdAndTypeIdLookup, BoardIdValue>,
      Value
    >;
  },
  isEdgeId<BoardIdValue extends keyof typeof edgeIdsByBoardIdAndTypeIdLookup>(
    boardId: BoardIdValue,
    value: string,
  ): value is BoardLookupIdValue<
    typeof edgeIdsByBoardIdAndTypeIdLookup,
    BoardIdValue
  > {
    const boardEdges = edgeIdsByBoardIdAndTypeIdLookup[boardId];
    const edgeIds = boardEdges
      ? flattenBoardScopedIds(edgeIdsByBoardIdAndTypeIdLookup, boardId)
      : undefined;
    return edgeIds ? isTypedId(edgeIds, value) : false;
  },
  expectEdgeId<
    BoardIdValue extends keyof typeof edgeIdsByBoardIdAndTypeIdLookup,
  >(
    boardId: BoardIdValue,
    value: string,
  ): BoardLookupIdValue<
    typeof edgeIdsByBoardIdAndTypeIdLookup,
    BoardIdValue
  > {
    const boardEdges = edgeIdsByBoardIdAndTypeIdLookup[boardId];
    const edgeIds = boardEdges
      ? flattenBoardScopedIds(edgeIdsByBoardIdAndTypeIdLookup, boardId)
      : undefined;
    if (!edgeIds || !isTypedId(edgeIds, value)) {
      throw new Error(
        `Unknown edge id '${value}' on board '${String(boardId)}'.`,
      );
    }
    return value as BoardLookupIdValue<
      typeof edgeIdsByBoardIdAndTypeIdLookup,
      BoardIdValue
    >;
  },
  edgeIds<
    BoardIdValue extends keyof typeof edgeIdsByBoardIdAndTypeIdLookup,
    TypeIdValue extends keyof (typeof edgeIdsByBoardIdAndTypeIdLookup)[BoardIdValue],
  >(
    boardId: BoardIdValue,
    typeId: TypeIdValue,
  ): (typeof edgeIdsByBoardIdAndTypeIdLookup)[BoardIdValue][TypeIdValue] {
    const boardEdges = edgeIdsByBoardIdAndTypeIdLookup[boardId];
    const edgeIds = boardEdges?.[typeId];
    if (!edgeIds) {
      throw new Error(
        `Unknown edge type '${String(typeId)}' on board '${String(boardId)}'.`,
      );
    }
    return edgeIds as (typeof edgeIdsByBoardIdAndTypeIdLookup)[BoardIdValue][TypeIdValue];
  },
  vertexIdsForType<TypeIdValue extends keyof typeof vertexIdsByTypeIdLookup>(
    typeId: TypeIdValue,
  ): (typeof vertexIdsByTypeIdLookup)[TypeIdValue] {
    return vertexIdsByTypeIdLookup[typeId];
  },
  vertexRecord<
    BoardIdValue extends keyof typeof vertexIdsByBoardIdAndTypeIdLookup,
    Value,
  >(
    boardId: BoardIdValue,
    initial:
      | Value
      | ((
          vertexId: BoardLookupIdValue<
            typeof vertexIdsByBoardIdAndTypeIdLookup,
            BoardIdValue
          >,
        ) => Value),
  ): Record<
    BoardLookupIdValue<typeof vertexIdsByBoardIdAndTypeIdLookup, BoardIdValue>,
    Value
  > {
    const boardVertices = vertexIdsByBoardIdAndTypeIdLookup[boardId];
    const vertexIds = boardVertices
      ? flattenBoardScopedIds(vertexIdsByBoardIdAndTypeIdLookup, boardId)
      : undefined;
    if (!vertexIds) {
      throw new Error(`Unknown board '${String(boardId)}'.`);
    }
    return buildTypedRecord(vertexIds, initial) as Record<
      BoardLookupIdValue<typeof vertexIdsByBoardIdAndTypeIdLookup, BoardIdValue>,
      Value
    >;
  },
  isVertexId<
    BoardIdValue extends keyof typeof vertexIdsByBoardIdAndTypeIdLookup,
  >(
    boardId: BoardIdValue,
    value: string,
  ): value is BoardLookupIdValue<
    typeof vertexIdsByBoardIdAndTypeIdLookup,
    BoardIdValue
  > {
    const boardVertices = vertexIdsByBoardIdAndTypeIdLookup[boardId];
    const vertexIds = boardVertices
      ? flattenBoardScopedIds(vertexIdsByBoardIdAndTypeIdLookup, boardId)
      : undefined;
    return vertexIds ? isTypedId(vertexIds, value) : false;
  },
  expectVertexId<
    BoardIdValue extends keyof typeof vertexIdsByBoardIdAndTypeIdLookup,
  >(
    boardId: BoardIdValue,
    value: string,
  ): BoardLookupIdValue<
    typeof vertexIdsByBoardIdAndTypeIdLookup,
    BoardIdValue
  > {
    const boardVertices = vertexIdsByBoardIdAndTypeIdLookup[boardId];
    const vertexIds = boardVertices
      ? flattenBoardScopedIds(vertexIdsByBoardIdAndTypeIdLookup, boardId)
      : undefined;
    if (!vertexIds || !isTypedId(vertexIds, value)) {
      throw new Error(
        `Unknown vertex id '${value}' on board '${String(boardId)}'.`,
      );
    }
    return value as BoardLookupIdValue<
      typeof vertexIdsByBoardIdAndTypeIdLookup,
      BoardIdValue
    >;
  },
  vertexIds<
    BoardIdValue extends keyof typeof vertexIdsByBoardIdAndTypeIdLookup,
    TypeIdValue extends keyof (typeof vertexIdsByBoardIdAndTypeIdLookup)[BoardIdValue],
  >(
    boardId: BoardIdValue,
    typeId: TypeIdValue,
  ): (typeof vertexIdsByBoardIdAndTypeIdLookup)[BoardIdValue][TypeIdValue] {
    const boardVertices = vertexIdsByBoardIdAndTypeIdLookup[boardId];
    const vertexIds = boardVertices?.[typeId];
    if (!vertexIds) {
      throw new Error(
        `Unknown vertex type '${String(typeId)}' on board '${String(boardId)}'.`,
      );
    }
    return vertexIds as (typeof vertexIdsByBoardIdAndTypeIdLookup)[BoardIdValue][TypeIdValue];
  },
  // Returns a `BoardRef` describing a per-player board scoped to the supplied
  // seat. The old `boardIdForPlayer` returned a concrete runtime-board-id
  // string, which encoded the "one board per maxPlayers seat" assumption in
  // static data. Under the PerPlayer model the runtime roster is not known at
  // generate time, so consumers deal with `BoardRef` and let the runtime
  // resolve the actual owner seat.
  boardRefForPlayer(
    boardBaseId: BoardBaseId,
    playerId: PlayerId,
  ): PerPlayerBoardRef<BoardBaseId, PlayerId> {
    return boardRef(boardBaseId, playerId) as PerPlayerBoardRef<
      BoardBaseId,
      PlayerId
    >;
  },
  sharedBoardRef(
    boardBaseId: BoardBaseId,
  ): SharedBoardRef<BoardBaseId> {
    return boardRef(boardBaseId) as SharedBoardRef<BoardBaseId>;
  },
} as const;

export type SetupProfilesDefinition = Record<
  SetupProfileId,
  SetupProfileDefinition<string, typeof manifestContract>
>;

export function setupProfiles<const Profiles extends SetupProfilesDefinition>(
  profiles: Profiles,
): Profiles {
  return profiles;
}

export function shuffle(
  container: SetupBootstrapContainerRef<typeof manifestContract>,
): SetupBootstrapStep<typeof manifestContract> {
  return createShuffleStep<typeof manifestContract>(container);
}

export function dealToPlayerZone(options: {
  from: Extract<
    SetupBootstrapContainerRef<typeof manifestContract>,
    { type: "sharedZone" | "sharedBoardContainer" }
  >;
  zoneId: Extract<
    SetupBootstrapPerPlayerContainerTemplateRef<typeof manifestContract>,
    { type: "playerZone" }
  >["zoneId"];
  count: number;
  playerIds?: readonly PlayerId[];
}): SetupBootstrapStep<typeof manifestContract> {
  return createDealToPlayerZoneStep<typeof manifestContract>(options);
}

export function dealToPlayerBoardContainer(options: {
  from: Extract<
    SetupBootstrapContainerRef<typeof manifestContract>,
    { type: "sharedZone" | "sharedBoardContainer" }
  >;
  boardId: Extract<
    SetupBootstrapPerPlayerContainerTemplateRef<typeof manifestContract>,
    { type: "playerBoardContainer" }
  >["boardId"];
  containerId: Extract<
    SetupBootstrapPerPlayerContainerTemplateRef<typeof manifestContract>,
    { type: "playerBoardContainer" }
  >["containerId"];
  count: number;
  playerIds?: readonly PlayerId[];
}): SetupBootstrapStep<typeof manifestContract> {
  return createDealToPlayerBoardContainerStep<typeof manifestContract>(options);
}

export function seedSharedBoardContainer(options: {
  from: SetupBootstrapContainerRef<typeof manifestContract>;
  boardId: Extract<
    SetupBootstrapDestinationRef<typeof manifestContract>,
    { type: "sharedBoardContainer" }
  >["boardId"];
  containerId: Extract<
    SetupBootstrapDestinationRef<typeof manifestContract>,
    { type: "sharedBoardContainer" }
  >["containerId"];
  count?: number;
  componentIds?: readonly (
    | CardIdOfManifest<typeof manifestContract>
    | PieceIdOfManifest<typeof manifestContract>
    | DieIdOfManifest<typeof manifestContract>
  )[];
}): SetupBootstrapStep<typeof manifestContract> {
  return createSeedSharedBoardContainerStep<typeof manifestContract>(options);
}

export function seedSharedBoardSpace(options: {
  from: SetupBootstrapContainerRef<typeof manifestContract>;
  boardId: Extract<
    SetupBootstrapDestinationRef<typeof manifestContract>,
    { type: "sharedBoardSpace" }
  >["boardId"];
  spaceId: Extract<
    SetupBootstrapDestinationRef<typeof manifestContract>,
    { type: "sharedBoardSpace" }
  >["spaceId"];
  count?: number;
  componentIds?: readonly (
    | CardIdOfManifest<typeof manifestContract>
    | PieceIdOfManifest<typeof manifestContract>
    | DieIdOfManifest<typeof manifestContract>
  )[];
}): SetupBootstrapStep<typeof manifestContract> {
  return createSeedSharedBoardSpaceStep<typeof manifestContract>(options);
}

export default manifestContract;
