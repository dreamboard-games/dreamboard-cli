import { useState, useEffect } from "react";
import { useRuntimeContext } from "../context/RuntimeContext.js";
import type { GameState } from "../types/player-state.js";
import type { PluginRuntimeAPI } from "../runtime/createPluginRuntimeAPI.js";

/**
 * Hook to access the current game state.
 *
 * State is provided by PluginStateProvider from host's state-sync messages.
 * The host transforms raw SSE messages into clean GameState objects.
 *
 * Note: GameState uses type-safe manifest types (PlayerId, CardId, StateName, etc.)
 * which are generated per-game and provide compile-time type safety.
 */
export function useGameState(): GameState {
  const runtime = useRuntimeContext() as PluginRuntimeAPI;

  // Get state from state-sync snapshot
  const getStateFromSnapshot = (): GameState | null => {
    if (!runtime.getSnapshot) return null;
    const snapshot = runtime.getSnapshot();
    if (!snapshot?.game) return null;
    return snapshot.game;
  };

  const [gameState, setGameState] = useState<GameState | null>(
    getStateFromSnapshot,
  );

  useEffect(() => {
    if (!runtime.subscribeToState) {
      return;
    }

    // Get initial state
    const initialState = runtime.getSnapshot?.();
    if (initialState?.game) {
      setGameState(initialState.game);
    }

    // Subscribe to state-sync updates
    return runtime.subscribeToState((snapshot) => {
      if (snapshot.game) {
        setGameState(snapshot.game);
      }
    });
  }, [runtime]);

  if (gameState === null) {
    throw new Error(
      "useGameState: Game state not available. " +
        "The host should only render the plugin when game state is ready.",
    );
  }

  return gameState;
}
