import { useMemo } from "react";
import { useGameState } from "./useGameState.js";
import { GameState } from "../types/player-state.js";

/**
 * Hook to select and memoize a derived value from game state.
 * Uses a selector function to extract specific data from SimpleGameState.
 *
 * @param selector - Function to extract data from game state
 * @returns Selected value, or null if game state not available
 */
export function useGameSelector<T>(selector: (state: GameState) => T): T {
  const gameState = useGameState();

  return useMemo(() => {
    return selector(gameState);
  }, [gameState, selector]);
}
