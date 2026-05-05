import { z } from "zod";
import { ids, manifestContract } from "../shared/manifest-contract";
import {
  defineGameContract,
  sparseCounts,
  type GameStateOf,
} from "@dreamboard/app-sdk/reducer";

// Sparse counts map keyed by resource id. Used for trade offers and
// build/trade costs.
export const countsByIdSchema = sparseCounts(ids.resourceId);

// What is built on a vertex
const vertexBuildingSchema = z.object({
  ownerId: ids.playerId,
  kind: z.enum(["outpost", "hub"]),
});

// What is built on an edge
const edgeBuildingSchema = z.object({
  ownerId: ids.playerId,
});

// Per-player scalar counter, keyed by manifest-typed player id so that a
// missing player id is a type error at call sites.
const perPlayerCountSchema = z.record(ids.playerId, z.number().int().min(0));

export const portTypeSchema = z.enum([
  "3:1",
  "crystal",
  "water",
  "fiber",
  "carbon",
  "alloy",
]);
export const terrainIds = [
  "carbonCloud",
  "alloyField",
  "waterWorld",
  "crystalBelt",
  "fiberGrove",
  "deadZone",
  "deepSpace",
] as const;
export const terrainSchema = z.enum(terrainIds);

// ── Public game state ─────────────────────────────────────────────────────────
//
// This shape is deliberately *minimal*. We store only state that is:
//
//   1. Game-specific (no SDK-native home), AND
//   2. Persistent across phase boundaries and across turns.
//
// Every other slice of state lives where it belongs:
//
//   - Current player / turn order → `state.flow.activePlayers` and
//     `q.player.order()` (seeded from the manifest).
//   - Current phase            → `state.flow.currentPhase`.
//   - Per-player resources     → `table.resources`, read via
//                                 `q.player.resources(pid)` /
//                                 `q.player.canAfford(...)`, mutated via
//                                 `ops.addResources` / `ops.spendResources` /
//                                 `ops.transferResources`.
//   - Relay slots              → manifest authored edge metadata. Shuffled
//                                 port assignments live in `portsByEdgeId`.
//   - Winner / derivations     → `app/derived.ts` (winnerOf, portsByVertex,
//                                 longestRoute, fleetCommand, …).
//   - Setup sub-flow counters  → `setup` phase's `state` (auto-discarded
//                                 on transition to `playerTurn`).
//   - Turn-scoped flags        → `playerTurn` phase's `state` (dice roll,
//                                 tech-card flags, raider sequence, pending
//                                 trade).
export const publicStateSchema = z.object({
  // Board terrain (shuffled per game; not available from the manifest).
  terrainBySpaceId: z.record(ids.spaceId, terrainSchema),
  numberTokenBySpaceId: z.record(ids.spaceId, z.number().nullable()),

  // Port type per relay edge. Relay edge locations are static topology;
  // the assigned port types are shuffled per game and are public information.
  portsByEdgeId: z.record(z.string(), portTypeSchema).default({}),

  // Per-player patrol counts — input to the `fleetCommand` derived value
  // (see app/derived.ts). Persists across turns.
  patrolsDeployed: perPlayerCountSchema,

  // Per-player INF tech cards (hidden until claimed). Persists across turns.
  relicCacheCards: perPlayerCountSchema,
});

// Trade offer held in `playerTurn` phase state while responses stream in.
// `targetPlayerIds` is the set of captains the offer was actually made to;
// only those players receive a `trade-offer` prompt and can respond.
export const pendingTradeSchema = z.object({
  offeredBy: ids.playerId,
  give: countsByIdSchema,
  want: countsByIdSchema,
  targetPlayerIds: z.array(ids.playerId),
  acceptedBy: z.array(ids.playerId),
  rejectedBy: z.array(ids.playerId),
});

// ── Phase state schemas ─────────────────────────────────────────────────────
//
// These are the phase-local state shapes. The SDK resets phase state to
// `initialState()` on every `fx.transition`, so:
//
//   - All setup bookkeeping dies when we transition `setup → playerTurn`.
//   - Turn-scoped flags (dice, tech-card, raider, pending trade) live only
//     inside `playerTurn` and don't pollute the global public state.
//
// Within a single phase, phase state persists across actions until the
// author explicitly resets it (e.g. `endTurn` zeroes the turn-scoped
// flags). Reentering the same phase via `fx.transition` *does* reset it.
export const setupPhaseStateSchema = z.object({
  // Snake-draft counters. Setup rotates forwards through round 0, then
  // backwards through round 1. Exiting round 1 transitions to `playerTurn`.
  round: z.number().int().min(0).max(1),
  playerIndex: z.number().int().min(0),
  step: z.enum(["outpost", "route"]),
  placedOutpost: z.boolean(),
  // Vertex of the outpost placed this turn; read by `placeSetupRoute`
  // in round 1 to grant the adjacent-terrain resources, then cleared
  // when the turn advances. Null between turns.
  lastOutpostVertexId: ids.vertexId.nullable(),
});

export const playerTurnPhaseStateSchema = z.object({
  step: z.enum(["roll", "discard", "raider", "main"]),
  // Dice
  diceRolled: z.boolean(),
  diceValues: z
    .tuple([z.number().int().min(1).max(6), z.number().int().min(1).max(6)])
    .nullable(),
  // Tech-card flags (one buy and one play per turn)
  techCardBoughtThisTurn: z.boolean(),
  techCardPlayedThisTurn: z.boolean(),
  // Raider sequence: a 7-roll puts `raiderPending = true` until the
  // current player calls `moveRaider`; `discardPending` holds the list of
  // players who still owe a discard before the raider can be moved.
  raiderPending: z.boolean(),
  discardPending: z.array(ids.playerId),
  // In-flight player-to-player trade (null when no offer is pending).
  pendingTrade: pendingTradeSchema.nullable(),
});

export const privateStateSchema = z.object({});

export const hiddenStateSchema = z.object({});

export const gameContract = defineGameContract({
  manifest: manifestContract,
  state: {
    public: publicStateSchema,
    private: privateStateSchema,
    hidden: hiddenStateSchema,
  },
  phaseNames: ["setup", "playerTurn"] as const,
});

export type GameContract = typeof gameContract;
export type GameState = GameStateOf<GameContract>;
export type PublicState = z.infer<typeof publicStateSchema>;
export type PrivateState = z.infer<typeof privateStateSchema>;
export type HiddenState = z.infer<typeof hiddenStateSchema>;
export type VertexBuilding = z.infer<typeof vertexBuildingSchema>;
export type EdgeBuilding = z.infer<typeof edgeBuildingSchema>;
export type PortType = z.infer<typeof portTypeSchema>;
export type Terrain = z.infer<typeof terrainSchema>;
export type CountsById = z.infer<typeof countsByIdSchema>;
export type PendingTrade = z.infer<typeof pendingTradeSchema>;
export type SetupPhaseState = z.infer<typeof setupPhaseStateSchema>;
export type PlayerTurnPhaseState = z.infer<typeof playerTurnPhaseStateSchema>;
