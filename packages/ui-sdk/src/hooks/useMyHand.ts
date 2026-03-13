import { useMemo } from "react";
import { useGameState } from "./useGameState.js";
import type { CardId, HandId } from "@dreamboard/manifest";

export function useMyHand(handId: HandId): CardId[] {
  const gameState = useGameState();

  // Get card IDs from the hand
  return useMemo(() => {
    return (gameState.hands[handId] ?? []) as unknown as CardId[];
  }, [gameState.hands, handId]);
}
