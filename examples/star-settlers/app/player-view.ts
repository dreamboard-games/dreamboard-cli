import { defineView } from "@dreamboard/app-sdk/reducer";
import type {
  GameContract,
  PlayerTurnPhaseState,
  PortType,
  PendingTrade,
  SetupPhaseState,
  Terrain,
  VertexBuilding,
  EdgeBuilding,
} from "./game-contract";
import {
  computeBankTradeRates,
  fleetCommand,
  longestRoute,
  portsByVertex,
  publicInfluenceByPlayer,
  winnerOf,
} from "./derived";
import {
  coloniesByVertexId,
  raiderSpaceId,
  routesByEdgeId,
} from "./reducer-support";
import {
  literals,
  type CardType,
  type EdgeId,
  type PlayerId,
  type ResourceId,
  type SpaceId,
  type VertexId,
} from "../shared/manifest-contract";

// ── Projected view types ────────────────────────────────────────────────────
//
// The view is the sole contract between the reducer and the UI. We
// declare it explicitly so the UI does not depend on inferred shapes
// that could drift silently when `publicState` / phase state / derived
// helpers change.
//
// Values that the SDK already exposes are NOT mirrored into the view:
//   - current player  → `useActivePlayers()` from `@dreamboard/ui-sdk`
//   - player order    → `usePlayerTurnOrder()` / `q.player.order()`
//   - current phase   → `useGameplayPhase()` / `state.flow.currentPhase`

export type PlayerViewSpace = {
  readonly id: SpaceId;
  readonly terrain: Terrain;
  readonly numberToken: number | null;
};

export type PlayerViewBoardSpace = {
  readonly id: SpaceId;
  readonly q: number;
  readonly r: number;
};

export type PlayerViewBoard = {
  readonly spaces: Readonly<Record<SpaceId, PlayerViewBoardSpace>>;
  readonly edges: readonly {
    readonly id: EdgeId;
    readonly spaceIds: readonly SpaceId[];
  }[];
  readonly vertices: readonly {
    readonly id: VertexId;
    readonly spaceIds: readonly SpaceId[];
  }[];
};

export type PlayerView = {
  // Board ----------------------------------------------------------------
  readonly board?: PlayerViewBoard;
  readonly spaces: readonly PlayerViewSpace[];
  readonly coloniesByVertexId: Readonly<Record<string, VertexBuilding>>;
  readonly routesByEdgeId: Readonly<Record<string, EdgeBuilding>>;
  readonly portsByEdgeId: Readonly<Record<string, PortType>>;
  readonly raiderSpaceId: SpaceId;

  // Turn sub-flow — `null` outside `playerTurn`.
  readonly diceRolled: boolean;
  readonly diceValues: readonly [number, number] | null;
  readonly raiderPending: boolean;
  readonly discardPending: readonly PlayerId[];
  readonly pendingTrade: PendingTrade | null;
  readonly techCardBoughtThisTurn: boolean;
  readonly techCardPlayedThisTurn: boolean;

  // Setup sub-flow — `null` outside `setup`.
  readonly setup: SetupPhaseState | null;

  // Viewing player --------------------------------------------------------
  readonly myResources: Readonly<Record<ResourceId, number>>;
  readonly myTechCardIds: readonly string[];
  readonly myTechCardTypesById: Readonly<Record<string, CardType>>;
  readonly myTechCardCount: number;
  readonly myTotalInfluence: number;
  /** Best bank trade rate per resource for the *viewing* player. */
  readonly myBankTradeRates: Readonly<Record<ResourceId, number>>;
  readonly myDiscardRequired: number;
  readonly amITargetedByTrade: boolean;
  readonly myTradeResponse: "accepted" | "rejected" | "none";

  // All-players summaries -------------------------------------------------
  readonly influenceByPlayerId: Partial<Record<PlayerId, number>>;
  readonly patrolsByPlayerId: Partial<Record<PlayerId, number>>;

  // Derived ownership -----------------------------------------------------
  readonly winnerPlayerId: PlayerId | null;
  readonly longestRouteOwner: PlayerId | null;
  readonly longestRouteLength: number;
  readonly fleetCommandOwner: PlayerId | null;
  readonly fleetCommandSize: number;
};

export const playerView = defineView<GameContract>()({
  project({ state, playerId, q, derived }): PlayerView {
    const lr = derived(longestRoute);
    const la = derived(fleetCommand);
    const publicVp = derived(publicInfluenceByPlayer);
    const ports = derived(portsByVertex);
    const winnerPlayerId = derived(winnerOf);
    const colonies = coloniesByVertexId(state, q);
    const routes = routesByEdgeId(state, q);

    const spaces: PlayerViewSpace[] = literals.spaceIds.map((spaceId) => {
      return {
        id: spaceId,
        terrain: state.publicState.terrainBySpaceId[spaceId],
        numberToken: state.publicState.numberTokenBySpaceId[spaceId],
      };
    });
    // Tech-card chrome: UI needs display names for hand pips. Read the
    // card type from the manifest via `q.card.get` — never parse the
    // card id.
    const myTechCardIds = [...q.zone.playerCards(playerId, "tech-hand")];
    const myTechCardTypesById: Record<string, CardType> = {};
    for (const cardId of myTechCardIds) {
      myTechCardTypesById[cardId] = q.card.get(cardId).cardType;
    }

    const myTotalInfluence =
      (publicVp[playerId] ?? 0) + (state.publicState.relicCacheCards[playerId] ?? 0);

    const myBankTradeRates = computeBankTradeRates(colonies, ports, playerId);

    // Narrow `state.phase` by `state.flow.currentPhase` — the top-level
    // state type widens it to a union; explicit casts document the
    // invariant maintained by the engine (phase state matches the
    // named phase).
    const setup: SetupPhaseState | null =
      state.flow.currentPhase === "setup"
        ? (state.phase as SetupPhaseState)
        : null;
    const turn: PlayerTurnPhaseState | null =
      state.flow.currentPhase === "playerTurn"
        ? (state.phase as PlayerTurnPhaseState)
        : null;

    const pendingTrade = turn?.pendingTrade ?? null;
    const amITargetedByTrade =
      pendingTrade != null && pendingTrade.targetPlayerIds.includes(playerId);
    const myTradeResponse: "accepted" | "rejected" | "none" = !pendingTrade
      ? "none"
      : !amITargetedByTrade
        ? "none"
        : pendingTrade.acceptedBy.includes(playerId)
          ? "accepted"
          : pendingTrade.rejectedBy.includes(playerId)
            ? "rejected"
            : "none";

    const myDiscardRequired = turn?.discardPending.includes(playerId)
      ? Math.floor(q.player.resourceTotal(playerId) / 2)
      : 0;

    return {
      spaces,
      coloniesByVertexId: colonies,
      routesByEdgeId: routes,
      portsByEdgeId: state.publicState.portsByEdgeId,
      raiderSpaceId: raiderSpaceId(q),
      diceRolled: turn?.diceRolled ?? false,
      diceValues: turn?.diceValues ?? null,
      raiderPending: turn?.raiderPending ?? false,
      discardPending: turn?.discardPending ?? [],
      pendingTrade,
      techCardBoughtThisTurn: turn?.techCardBoughtThisTurn ?? false,
      techCardPlayedThisTurn: turn?.techCardPlayedThisTurn ?? false,
      setup,
      myResources: q.player.resources(playerId),
      myTechCardIds,
      myTechCardTypesById,
      myTechCardCount: myTechCardIds.length,
      myTotalInfluence,
      myBankTradeRates,
      myDiscardRequired,
      amITargetedByTrade,
      myTradeResponse,
      influenceByPlayerId: publicVp,
      patrolsByPlayerId: state.publicState.patrolsDeployed,
      winnerPlayerId,
      longestRouteOwner: lr.ownerPlayerId,
      longestRouteLength: lr.length,
      fleetCommandOwner: la.ownerPlayerId,
      fleetCommandSize: la.size,
    };
  },
});
