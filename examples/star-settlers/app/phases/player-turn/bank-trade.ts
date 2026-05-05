import {
  defineInteraction,
  formInput,
  pipe,
} from "@dreamboard/app-sdk/reducer";
import {
  playerTurnPhaseStateSchema,
  type GameContract,
  type GameState,
} from "../../game-contract";
import { coloniesByVertexId } from "../../reducer-support";
import { computeBankTradeRates, portsByVertex } from "../../derived";
import type { ResourceId } from "../../../shared/manifest-contract";
import { bankTradeResourceChoices } from "./inputs";

// ── Trade With Bank ──────────────────────────────────────────────────────────

export const tradeWithBank = defineInteraction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  surface: "panel",
  label: "Trade with bank",
  step: "main",
  inputs: {
    giveResource: formInput.choice<ResourceId, GameState>({
      choices: bankTradeResourceChoices(),
      defaultValue: "carbon",
    }),
    receiveResource: formInput.choice<ResourceId>({
      choices: "resourceMap",
      defaultValue: "alloy",
    }),
  },
  validate({ state, input, q, derived }) {
    if (!state.phase.diceRolled) {
      return { errorCode: "MUST_ROLL_FIRST", message: "Roll dice first." };
    }
    if (input.params.giveResource === input.params.receiveResource) {
      return {
        errorCode: "SAME_RESOURCE",
        message: "Cannot trade a resource for itself.",
      };
    }
    const rates = computeBankTradeRates(
      coloniesByVertexId(state, q),
      derived(portsByVertex),
      input.playerId,
    );
    const rate = rates[input.params.giveResource];
    if (q.player.resource(input.playerId, input.params.giveResource) < rate) {
      return {
        errorCode: "INSUFFICIENT_RESOURCES",
        message: `Need ${rate} ${input.params.giveResource}.`,
      };
    }
    return null;
  },
  reduce({ state, input, accept, ops, q, derived }) {
    const { giveResource, receiveResource } = input.params;
    const rate = computeBankTradeRates(
      coloniesByVertexId(state, q),
      derived(portsByVertex),
      input.playerId,
    )[giveResource];
    return accept(
      pipe(
        state,
        ops.spendResources({
          playerId: input.playerId,
          amounts: { [giveResource]: rate },
        }),
        ops.addResources({
          playerId: input.playerId,
          amounts: { [receiveResource]: 1 },
        }),
      ),
    );
  },
});
