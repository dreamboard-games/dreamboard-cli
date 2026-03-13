import { useMemo } from "react";
import { useGameState } from "./useGameState.js";
import type { HandId } from "@dreamboard/manifest";
import type { PublicHandsByPlayerId } from "../types/player-state.js";

/**
 * Returns all players' cards for a hand marked `visibility: "public"`.
 */
export function usePublicHands(handId: HandId): PublicHandsByPlayerId {
  const gameState = useGameState();

  return useMemo(() => {
    const publicHand = gameState.publicHands[handId] ?? {};
    return publicHand as PublicHandsByPlayerId;
  }, [gameState.publicHands, handId]);
}
