import { z } from "zod";
import {
  type InteractionDialogStatusSection,
  type InteractionPresentationSpec,
} from "@dreamboard/app-sdk/reducer";
import {
  playerTurnPhaseStateSchema,
  type GameContract,
  type GameState,
  type PlayerTurnPhaseState,
} from "../../game-contract";

export type PlayerTurnState = Omit<GameState, "phase"> & {
  phase: PlayerTurnPhaseState;
};

export type PlayerTurnStatusSection = InteractionDialogStatusSection<
  PlayerTurnState,
  GameContract["manifest"]
>;

export type PlayerTurnPresentation = InteractionPresentationSpec<
  PlayerTurnState,
  GameContract["manifest"]
>;

// Fresh phase state for a new turn. Used to reset `state.phase` via
// `ops.patchPhaseState` at the end of each turn — cheaper than re-
// entering the phase via `fx.transition`, which would also fire the
// `enter` hook.
export const FRESH_TURN: z.infer<typeof playerTurnPhaseStateSchema> = {
  step: "roll",
  diceRolled: false,
  diceValues: null,
  techCardBoughtThisTurn: false,
  techCardPlayedThisTurn: false,
  raiderPending: false,
  discardPending: [],
  pendingTrade: null,
};
