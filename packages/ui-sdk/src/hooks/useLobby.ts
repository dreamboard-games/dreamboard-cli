import { useState, useEffect } from "react";
import { useRuntimeContext } from "../context/RuntimeContext.js";
import type { LobbyState } from "../types/plugin-state.js";
import type { PluginRuntimeAPI } from "../runtime/createPluginRuntimeAPI.js";

// Re-export LobbyState for convenience
export type { LobbyState };

/**
 * Hook to subscribe to lobby state updates.
 * Returns the latest lobby information from state-sync messages.
 *
 * State is provided by PluginStateProvider from host's state-sync messages.
 * The host transforms raw SSE LOBBY_UPDATE messages into clean LobbyState objects.
 *
 * @returns Current lobby state (never null - throws if not available)
 * @throws Error if lobby state is not available
 *
 * @example
 * ```typescript
 * function LobbyScreen() {
 *   const lobby = useLobby();
 *   // lobby is guaranteed to be non-null
 *   return <div>{lobby.seats.length} seats</div>;
 * }
 * ```
 */
export function useLobby(): LobbyState {
  const runtime = useRuntimeContext() as PluginRuntimeAPI;

  // Get state from state-sync snapshot
  const getStateFromSnapshot = (): LobbyState | null => {
    if (!runtime.getSnapshot) return null;
    const snapshot = runtime.getSnapshot();
    if (!snapshot?.lobby) return null;
    return snapshot.lobby;
  };

  const [lobbyState, setLobbyState] = useState<LobbyState | null>(
    getStateFromSnapshot,
  );

  useEffect(() => {
    if (!runtime.subscribeToState) {
      return;
    }

    // Get initial state
    const initialState = runtime.getSnapshot?.();
    if (initialState?.lobby) {
      setLobbyState(initialState.lobby);
    }

    // Subscribe to state-sync updates
    return runtime.subscribeToState((snapshot) => {
      if (snapshot.lobby) {
        setLobbyState(snapshot.lobby);
      }
    });
  }, [runtime]);

  if (lobbyState === null) {
    throw new Error(
      "useLobby: Lobby state not available. " +
        "The host should only render the plugin when lobby state is ready.",
    );
  }

  return lobbyState;
}
