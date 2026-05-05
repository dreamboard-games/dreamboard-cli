import {
  boardInput,
  defineCardAction,
  defineInteraction,
  formInput,
  pipe,
} from "@dreamboard/app-sdk/reducer";
import {
  playerTurnPhaseStateSchema,
  type GameContract,
  type GameState,
} from "../../game-contract";
import {
  COST_TECH_CARD,
  findDetachedPieces,
  incrementPlayerScalar,
  type Ops,
} from "../../reducer-support";
import { buildRouteTarget, raiderSpaceTarget } from "../../eligibility";
import {
  cardTypes,
  ids,
  zones,
  type CardId,
  type EdgeId,
  type PlayerId,
  type ResourceId,
  type SpaceId,
} from "../../../shared/manifest-contract";
import { raiderSeizeTargetInput, toRaiderSeizePlayerId } from "./inputs";
import { stealOneCardOp } from "./dice-and-raider";
import type { PlayerTurnState } from "./turn-state";

// ── Buy Tech Card ────────────────────────────────────────────────────────────

export const buyTechCard = defineInteraction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  surface: "panel",
  label: "Buy tech card",
  step: "main",
  // Niche action — most Star Settlers turns are build / trade / end. Demoting
  // it to `tertiary` collapses it under the panel's "More actions"
  // disclosure (Hick's Law) so the always-visible secondary row stays
  // dedicated to the high-frequency moves.
  salience: "tertiary",
  icon: "🎴",
  inputs: {},
  validate({ state, input, q }) {
    if (!state.phase.diceRolled) {
      return { errorCode: "MUST_ROLL_FIRST", message: "Roll dice first." };
    }
    if (!q.player.canAfford(input.playerId, COST_TECH_CARD)) {
      return {
        errorCode: "INSUFFICIENT_RESOURCES",
        message: "Need 1 water + 1 fiber + 1 crystal.",
      };
    }
    if (q.zone.sharedCards("tech-deck").length === 0) {
      return {
        errorCode: "DECK_EMPTY",
        message: "Tech card deck is empty.",
      };
    }
    return null;
  },
  reduce({ state, input, accept, ops }) {
    return accept(
      pipe(
        state,
        ops.spendResources({
          playerId: input.playerId,
          amounts: COST_TECH_CARD,
        }),
        ops.patchPhaseState({ techCardBoughtThisTurn: true }),
        ops.dealCardsToPlayerZone({
          fromZoneId: "tech-deck",
          playerId: input.playerId,
          toZoneId: zones.techHand,
          count: 1,
        }),
      ),
    );
  },
});

// ── Play Tech Card ───────────────────────────────────────────────────────────
//
// Tech cards are one card action per card type. Each action owns its params
// schema, while shared validation (`NOT_YOUR_TURN`, dice rolled, no
// double-play, no card bought this turn) stays in `validatePlay`.
// `defineCardAction({ cardType })` owns the right-card-type invariant.
// The common "move-to-played + mark-played" write is shared via
// `playCommonOps`.

function validatePlay(
  state: PlayerTurnState,
): { errorCode: string; message: string } | null {
  if (!state.phase.diceRolled) {
    return { errorCode: "MUST_ROLL_FIRST", message: "Roll dice first." };
  }
  if (state.phase.techCardPlayedThisTurn) {
    return {
      errorCode: "ALREADY_PLAYED_TECH_CARD",
      message: "Already played a tech card this turn.",
    };
  }
  if (state.phase.techCardBoughtThisTurn) {
    return {
      errorCode: "BOUGHT_THIS_TURN",
      message: "Cannot play a card bought this turn.",
    };
  }
  return null;
}

function playCommonOps(ops: Ops, playerId: PlayerId, cardId: CardId) {
  return [
    ops.moveCardFromPlayerZoneToSharedZone({
      playerId,
      fromZoneId: zones.techHand,
      toZoneId: zones.techPlayed,
      cardId,
      playedBy: playerId,
    }),
    ops.patchPhaseState({ techCardPlayedThisTurn: true }),
  ] as const;
}

export const playRelicCache = defineCardAction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  cardType: cardTypes.relicCache,
  playFrom: zones.techHand,
  label: "Play relic cache",
  step: "main",
  validate: ({ state }) => validatePlay(state),
  reduce({ state, input, accept, ops }) {
    return accept(
      pipe(
        state,
        ...playCommonOps(ops, input.playerId, input.params.cardId),
        ops.patchPublicState(
          incrementPlayerScalar("relicCacheCards", input.playerId),
        ),
      ),
    );
  },
});

export const playPatrol = defineCardAction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  cardType: cardTypes.patrol,
  playFrom: zones.techHand,
  label: "Play patrol",
  step: "main",
  inputs: {
    raiderSpaceId: boardInput.space<GameState, SpaceId>({
      target: raiderSpaceTarget,
    }),
    stealFromPlayerId: raiderSeizeTargetInput(),
  },
  validate({ state }) {
    const base = validatePlay(state);
    if (base) return base;
    return null;
  },
  reduce({ state, input, accept, ops, q }) {
    return accept(
      pipe(
        state,
        ...playCommonOps(ops, input.playerId, input.params.cardId),
        ops.patchPublicState(
          incrementPlayerScalar("patrolsDeployed", input.playerId),
        ),
        ops.moveComponentToSpace({
          componentId: "raider",
          boardId: "sector",
          spaceId: input.params.raiderSpaceId,
        }),
        ...stealOneCardOp(
          ops,
          q,
          toRaiderSeizePlayerId(input.params.stealFromPlayerId),
          input.playerId,
        ),
      ),
    );
  },
});

export const playBountySurvey = defineCardAction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  cardType: cardTypes.bountySurvey,
  playFrom: zones.techHand,
  label: "Play bounty survey",
  step: "main",
  inputs: {
    resource1: formInput.choice<ResourceId>({ choices: "resourceMap" }),
    resource2: formInput.choice<ResourceId>({ choices: "resourceMap" }),
  },
  validate: ({ state }) => validatePlay(state),
  reduce({ state, input, accept, ops }) {
    const amounts: Partial<Record<ResourceId, number>> = {};
    amounts[input.params.resource1] =
      (amounts[input.params.resource1] ?? 0) + 1;
    amounts[input.params.resource2] =
      (amounts[input.params.resource2] ?? 0) + 1;
    return accept(
      pipe(
        state,
        ...playCommonOps(ops, input.playerId, input.params.cardId),
        ops.addResources({ playerId: input.playerId, amounts }),
      ),
    );
  },
});

export const playSignalLock = defineCardAction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  cardType: cardTypes.signalLock,
  playFrom: zones.techHand,
  label: "Play signalLock",
  step: "main",
  inputs: {
    resource: formInput.choice<ResourceId>({ choices: "resourceMap" }),
  },
  validate: ({ state }) => validatePlay(state),
  reduce({ state, input, accept, ops, q }) {
    const target = input.params.resource;
    const collectOps = q.player
      .order()
      .filter((pid) => pid !== input.playerId)
      .flatMap((pid) => {
        const amount = q.player.resource(pid, target);
        return amount > 0
          ? [
              ops.transferResources({
                fromPlayerId: pid,
                toPlayerId: input.playerId,
                amounts: { [target]: amount },
              }),
            ]
          : [];
      });
    return accept(
      pipe(
        state,
        ...playCommonOps(ops, input.playerId, input.params.cardId),
        ...collectOps,
      ),
    );
  },
});

export const playJumpGate = defineCardAction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  cardType: cardTypes.jumpGate,
  playFrom: zones.techHand,
  label: "Play jump gate",
  step: "main",
  inputs: {
    edgeId1: boardInput.edge<GameState, EdgeId>({
      target: buildRouteTarget,
    }),
    edgeId2: formInput(ids.edgeId.optional()),
  },
  validate({ state, input, q }) {
    const base = validatePlay(state);
    if (base) return base;
    if (input.params.edgeId2) {
      return buildRouteTarget.validate(
        { state, playerId: input.playerId, q },
        input.params.edgeId2,
      );
    }
    return null;
  },
  reduce({ state, input, accept, ops, q }) {
    const edgeIds = input.params.edgeId2
      ? ([input.params.edgeId1, input.params.edgeId2] as const)
      : ([input.params.edgeId1] as const);
    const routeIds = findDetachedPieces(
      q,
      input.playerId,
      "route",
      edgeIds.length,
    );
    return accept(
      pipe(
        state,
        ...playCommonOps(ops, input.playerId, input.params.cardId),
        ...edgeIds.map((edgeId, index) =>
          ops.moveComponentToEdge({
            componentId: routeIds[index]!,
            boardId: "sector",
            edgeId,
          }),
        ),
      ),
    );
  },
});
