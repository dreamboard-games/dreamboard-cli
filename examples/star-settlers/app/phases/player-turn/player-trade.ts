import { z } from "zod";
import {
  choiceTarget,
  defineInteraction,
  formInput,
  promptInput,
  pipe,
} from "@dreamboard/app-sdk/reducer";
import {
  countsByIdSchema,
  playerTurnPhaseStateSchema,
  type GameContract,
  type GameState,
  type PlayerTurnPhaseState,
} from "../../game-contract";
import { ids, type PlayerId } from "../../../shared/manifest-contract";
import {
  openResourceMapDomain,
  otherPlayerChoices,
  ownedResourceMapDomain,
  pendingTradeDialog,
} from "./inputs";
import type { Q } from "../../reducer-support";

const offerTradeParamsBaseSchema = z.object({
  give: countsByIdSchema,
  want: countsByIdSchema,
  targetPlayerIds: z.array(ids.playerId).min(1),
});

export const offerTradeParamsSchema = offerTradeParamsBaseSchema.superRefine(
  (params, ctx) => {
    const totalGive = Object.values(params.give).reduce<number>(
      (sum, value) => sum + (value ?? 0),
      0,
    );
    const totalWant = Object.values(params.want).reduce<number>(
      (sum, value) => sum + (value ?? 0),
      0,
    );
    if (totalGive === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["give"],
        message: "Offer at least one resource.",
      });
    }
    if (totalWant === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["want"],
        message: "Ask for at least one resource.",
      });
    }
  },
);

// ── Player-to-Player Trade ───────────────────────────────────────────────────
//
// Flow: the current player opens a pending trade targeted at selected
// captains via `offerTrade`. The `respondToTrade` inbox prompt is
// auto-surfaced to every targeted captain that has not yet responded —
// `to(state)` filters out players already in `acceptedBy`/`rejectedBy`,
// so the prompt disappears for a player as soon as they respond and for
// everyone once the offerer confirms or cancels (clearing `pendingTrade`).

const RESPOND_TO_TRADE_OPTIONS = [
  { id: "accept", label: "Accept" },
  { id: "reject", label: "Reject" },
] as const;

const respondToTradeTarget = choiceTarget
  .options<GameState, "accept" | "reject">(RESPOND_TO_TRADE_OPTIONS)
  .build();

export const respondToTrade = defineInteraction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  surface: "inbox",
  label: "Respond to trade",
  title: "Incoming trade offer",
  presentation: pendingTradeDialog(
    "Incoming trade offer",
    "Review the offer and accept or reject it before continuing.",
  ),
  inputs: {
    response: promptInput({
      schema: z.enum(["accept", "reject"]),
      target: respondToTradeTarget,
    }),
  },
  to: ({ state }) => {
    const trade = state.phase.pendingTrade;
    if (!trade) return null;
    return trade.targetPlayerIds.filter(
      (pid) =>
        !trade.acceptedBy.includes(pid) && !trade.rejectedBy.includes(pid),
    );
  },
  validate({ state, input, q }) {
    const trade = state.phase.pendingTrade;
    if (!trade) {
      return {
        errorCode: "NO_PENDING_TRADE",
        message: "No trade to respond to.",
      };
    }
    if (
      input.params.response === "accept" &&
      !q.player.canAfford(input.playerId, trade.want)
    ) {
      return {
        errorCode: "INSUFFICIENT_RESOURCES",
        message: "You don't have the requested resources.",
      };
    }
    return null;
  },
  reduce({ state, input, accept, ops }) {
    const trade = state.phase.pendingTrade!;
    const pendingTrade =
      input.params.response === "accept"
        ? { ...trade, acceptedBy: [...trade.acceptedBy, input.playerId] }
        : { ...trade, rejectedBy: [...trade.rejectedBy, input.playerId] };
    return accept(pipe(state, ops.patchPhaseState({ pendingTrade })));
  },
});

export const offerTrade = defineInteraction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  surface: "panel",
  label: "Offer trade",
  step: "main",
  group: "trade",
  inputs: {
    give: ownedResourceMapDomain(),
    want: openResourceMapDomain(),
    targetPlayerIds: formInput.choiceList<PlayerId, GameState>({
      choices: ({ q, playerId }) =>
        otherPlayerChoices(q as Q, playerId as PlayerId),
      min: 1,
      defaultValue: "all",
    }),
  },
  paramsSchema: offerTradeParamsSchema,
  validate({ state, input, q }) {
    if (!state.phase.diceRolled) {
      return { errorCode: "MUST_ROLL_FIRST", message: "Roll dice first." };
    }
    if (state.phase.raiderPending) {
      return {
        errorCode: "ROBBER_PENDING",
        message: "Resolve the raider first.",
      };
    }
    if (state.phase.pendingTrade) {
      return {
        errorCode: "TRADE_ALREADY_PENDING",
        message: "A trade is already pending.",
      };
    }
    const totalGive = Object.values(input.params.give).reduce<number>(
      (a, b) => a + (b ?? 0),
      0,
    );
    const totalWant = Object.values(input.params.want).reduce<number>(
      (a, b) => a + (b ?? 0),
      0,
    );
    if (totalGive === 0 || totalWant === 0) {
      return {
        errorCode: "EMPTY_TRADE",
        message: "Must give and want at least one resource.",
      };
    }
    if (!q.player.canAfford(input.playerId, input.params.give)) {
      return {
        errorCode: "INSUFFICIENT_RESOURCES",
        message: "You don't have the resources to offer.",
      };
    }
    if (input.params.targetPlayerIds.includes(input.playerId)) {
      return {
        errorCode: "CANNOT_TARGET_SELF",
        message: "You cannot offer a trade to yourself.",
      };
    }
    const turnOrder = q.player.order();
    for (const pid of input.params.targetPlayerIds) {
      if (!turnOrder.includes(pid)) {
        return {
          errorCode: "UNKNOWN_TARGET",
          message: `Unknown target captain: ${pid}.`,
        };
      }
    }
    if (
      new Set(input.params.targetPlayerIds).size !==
      input.params.targetPlayerIds.length
    ) {
      return {
        errorCode: "DUPLICATE_TARGETS",
        message: "Target captains must be unique.",
      };
    }
    return null;
  },
  reduce({ state, input, accept, ops }) {
    const targetPlayerIds = [...input.params.targetPlayerIds];
    return accept(
      pipe(
        state,
        ops.patchPhaseState({
          pendingTrade: {
            offeredBy: input.playerId,
            give: input.params.give,
            want: input.params.want,
            targetPlayerIds,
            acceptedBy: [],
            rejectedBy: [],
          },
        }),
      ),
    );
  },
});

export const confirmTrade = defineInteraction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  surface: "panel",
  label: "Confirm trade",
  step: "main",
  group: "trade",
  presentation: pendingTradeDialog(
    "Trade offer pending",
    "Choose an accepting player to confirm the trade, or cancel the offer.",
  ),
  inputs: {
    partnerId: formInput.choice<PlayerId, GameState>({
      choices: (context) => {
        const trade = (
          (context.state as GameState).phase as PlayerTurnPhaseState
        ).pendingTrade;
        return (trade?.acceptedBy ?? []).map((pid) => ({
          value: pid,
          label: pid,
        }));
      },
    }),
  },
  available({ state }) {
    const trade = state.phase.pendingTrade;
    return trade != null && trade.acceptedBy.length > 0;
  },
  validate({ state, input, q }) {
    const trade = state.phase.pendingTrade;
    if (!trade)
      return { errorCode: "NO_PENDING_TRADE", message: "No trade to confirm." };
    if (!trade.acceptedBy.includes(input.params.partnerId)) {
      return {
        errorCode: "PARTNER_NOT_ACCEPTED",
        message: "That player has not accepted the trade.",
      };
    }
    if (!q.player.canAfford(input.playerId, trade.give)) {
      return {
        errorCode: "INSUFFICIENT_RESOURCES",
        message: "You no longer have the offered resources.",
      };
    }
    if (!q.player.canAfford(input.params.partnerId, trade.want)) {
      return {
        errorCode: "PARTNER_INSUFFICIENT",
        message: "Partner no longer has the requested resources.",
      };
    }
    return null;
  },
  reduce({ state, input, accept, ops }) {
    const trade = state.phase.pendingTrade!;
    return accept(
      pipe(
        state,
        ops.transferResources({
          fromPlayerId: input.playerId,
          toPlayerId: input.params.partnerId,
          amounts: trade.give,
        }),
        ops.transferResources({
          fromPlayerId: input.params.partnerId,
          toPlayerId: input.playerId,
          amounts: trade.want,
        }),
        ops.patchPhaseState({ pendingTrade: null }),
      ),
    );
  },
});

export const cancelTrade = defineInteraction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  surface: "panel",
  label: "Cancel trade",
  step: "main",
  emphasis: "destructive",
  group: "trade",
  presentation: pendingTradeDialog(
    "Trade offer pending",
    "Choose an accepting player to confirm the trade, or cancel the offer.",
  ),
  inputs: {},
  available({ state }) {
    return state.phase.pendingTrade != null;
  },
  validate({ state }) {
    if (!state.phase.pendingTrade) {
      return { errorCode: "NO_PENDING_TRADE", message: "No trade to cancel." };
    }
    return null;
  },
  reduce({ state, accept, ops }) {
    return accept(pipe(state, ops.patchPhaseState({ pendingTrade: null })));
  },
});
