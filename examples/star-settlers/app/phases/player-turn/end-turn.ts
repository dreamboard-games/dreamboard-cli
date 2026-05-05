import { defineInteraction, pipe } from "@dreamboard/app-sdk/reducer";
import {
  playerTurnPhaseStateSchema,
  type GameContract,
} from "../../game-contract";
import { winnerOf } from "../../derived";
import { FRESH_TURN } from "./turn-state";

// ── End Turn ─────────────────────────────────────────────────────────────────

export const endTurn = defineInteraction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  surface: "panel",
  label: "End turn",
  step: "main",
  emphasis: "primary",
  inputs: {},
  validate({ state, derived }) {
    if (!state.phase.diceRolled) {
      return { errorCode: "MUST_ROLL_FIRST", message: "Must roll dice first." };
    }
    if (state.phase.raiderPending) {
      return {
        errorCode: "ROBBER_PENDING",
        message: "Resolve the raider first.",
      };
    }
    if (state.phase.discardPending.length > 0) {
      return {
        errorCode: "DISCARDS_PENDING",
        message: "Players must discard first.",
      };
    }
    if (derived(winnerOf)) {
      return { errorCode: "GAME_OVER", message: "Game is over." };
    }
    return null;
  },
  reduce({ state, accept, ops }) {
    // Reset the turn-scoped phase state wholesale and hand the seat to
    // the next player in order.
    return accept(
      pipe(state, ops.patchPhaseState(FRESH_TURN), ops.advanceActivePlayer()),
    );
  },
});
