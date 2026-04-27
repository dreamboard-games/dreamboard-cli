import { z } from "zod";
import {
  createReducerOps,
  createStateQueries,
  pipe,
  type TableQueriesOfState,
} from "@dreamboard/app-sdk/reducer";
import { ids } from "../shared/manifest-contract";
import type { GameState } from "./game-contract";

const ops = createReducerOps<GameState>();

const reducerOverlaySchema = z.object({
  currentPlayerId: ids.playerId.nullable(),
  notesByPlayerId: z.partialRecord(ids.playerId, z.string()).default({}),
});

function summarizeTrackBoard(q: TableQueriesOfState<GameState>) {
  const board = q.board.get("track-board");
  const origin = q.board.space("track-board", "space-a");

  return {
    boardId: board.id,
    originId: origin.id,
    adjacentSpaceIds: q.board.adjacentSpaces("track-board", "space-a"),
  };
}

export function reducerQueryTypingSmoke(state: GameState) {
  const q = createStateQueries(state);
  const summary = summarizeTrackBoard(q);
  const [firstPlayerId] = q.player.order();

  if (firstPlayerId) {
    const nextState = pipe(state, ops.setActivePlayers([firstPlayerId]));
    const [cardId] = q.zone.playerCards(firstPlayerId, "main-hand");

    if (cardId) {
      const card = q.card.get(cardId);
      const movedState = pipe(
        nextState,
        ops.moveCardFromPlayerZoneToSharedZone({
          playerId: firstPlayerId,
          fromZoneId: "main-hand",
          toZoneId: "draw-deck",
          cardId,
          playedBy: firstPlayerId,
        }),
      );

      void card.cardType;
      void movedState;
    }

    void nextState;
  }

  return {
    summary,
    reducerOverlaySchema,
  };
}
