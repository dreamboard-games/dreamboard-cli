import { definePhase, pipe } from "@dreamboard/app-sdk/reducer";
import {
  playerTurnPhaseStateSchema,
  type GameContract,
} from "../../game-contract";
import { zones } from "../../../shared/manifest-contract";
import { FRESH_TURN } from "./turn-state";
import { rollDice, discardCards, moveRaider } from "./dice-and-raider";
import { buildRoute, buildOutpost, upgradeToHub } from "./build";
import {
  buyTechCard,
  playPatrol,
  playSignalLock,
  playJumpGate,
  playRelicCache,
  playBountySurvey,
} from "./tech-cards";
import { tradeWithBank } from "./bank-trade";
import {
  cancelTrade,
  confirmTrade,
  offerTrade,
  respondToTrade,
} from "./player-trade";
import { endTurn } from "./end-turn";

export { discardCardsParamsSchema } from "./dice-and-raider";
export { offerTradeParamsSchema } from "./player-trade";

export const playerTurn = definePhase<GameContract>()({
  kind: "player",
  state: playerTurnPhaseStateSchema,
  initialState: () => ({ ...FRESH_TURN }),
  enter({ state, accept, ops, q }) {
    // Entering `playerTurn` from `setup` — seed the first player's turn.
    // Re-entering on a subsequent turn is a no-op because
    // `endTurn` already set active players.
    const activePlayer = state.flow.activePlayers[0] ?? q.player.order()[0]!;
    return accept(pipe(state, ops.setActivePlayers([activePlayer])));
  },
  actor: ({ state }) => state.flow.activePlayers,
  zones: [zones.techHand],
  cardActions: {
    playRelicCache,
    playPatrol,
    playBountySurvey,
    playSignalLock,
    playJumpGate,
  },
  interactions: {
    rollDice,
    discardCards,
    moveRaider,
    buildRoute,
    buildOutpost,
    upgradeToHub,
    buyTechCard,
    tradeWithBank,
    offerTrade,
    respondToTrade,
    confirmTrade,
    cancelTrade,
    endTurn,
  },
});
