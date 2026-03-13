import { useState, useEffect } from "react";
import { useRuntimeContext } from "../context/RuntimeContext.js";
import type { HistoryState } from "../types/plugin-state.js";
import type { PluginRuntimeAPI } from "../runtime/createPluginRuntimeAPI.js";

// Re-export types for convenience
export type {
  HistoryState,
  HistoryEntrySummary,
} from "../types/plugin-state.js";

/**
 * Hook to access game state history for navigation.
 * Only returns data if the current user is the host.
 *
 * The history feature allows the host to navigate back and forward through
 * the game state timeline, useful for:
 * - Undoing mistakes during testing
 * - Demonstrating different game paths
 * - Debugging game logic
 *
 * @returns HistoryState if the user is host, null otherwise
 *
 * @example
 * ```typescript
 * function HistoryControls() {
 *   const history = useHistory();
 *
 *   if (!history) {
 *     // User is not the host
 *     return null;
 *   }
 *
 *   return (
 *     <div>
 *       <p>{history.entries.length} history states</p>
 *       <button disabled={!history.canGoBack}>Undo</button>
 *       <button disabled={!history.canGoForward}>Redo</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useHistory(): HistoryState | null {
  const runtime = useRuntimeContext() as PluginRuntimeAPI;

  // Get initial state from snapshot
  const getHistoryFromSnapshot = (): HistoryState | null => {
    if (!runtime.getSnapshot) return null;
    const snapshot = runtime.getSnapshot();
    return snapshot?.history ?? null;
  };

  const [historyState, setHistoryState] = useState<HistoryState | null>(
    getHistoryFromSnapshot,
  );

  useEffect(() => {
    if (!runtime.subscribeToState) {
      return;
    }

    // Get initial state
    const initialState = runtime.getSnapshot?.();
    if (initialState?.history) {
      setHistoryState(initialState.history);
    }

    // Subscribe to state-sync updates
    return runtime.subscribeToState((snapshot) => {
      setHistoryState(snapshot.history ?? null);
    });
  }, [runtime]);

  return historyState;
}

/**
 * Hook to check if the current user is the host.
 * This is a convenience hook for components that need to conditionally
 * render based on host status.
 *
 * @returns true if the current user is the host
 *
 * @example
 * ```typescript
 * function HostOnlyFeature() {
 *   const isHost = useIsHost();
 *
 *   if (!isHost) {
 *     return null;
 *   }
 *
 *   return <HostControls />;
 * }
 * ```
 */
export function useIsHost(): boolean {
  const runtime = useRuntimeContext() as PluginRuntimeAPI;

  const [isHost, setIsHost] = useState<boolean>(() => {
    const snapshot = runtime.getSnapshot?.();
    if (!snapshot?.lobby || !snapshot?.session?.userId) return false;
    return snapshot.lobby.hostUserId === snapshot.session.userId;
  });

  useEffect(() => {
    if (!runtime.subscribeToState) {
      return;
    }

    // Subscribe to state-sync updates
    return runtime.subscribeToState((snapshot) => {
      if (!snapshot.lobby || !snapshot.session?.userId) {
        setIsHost(false);
        return;
      }
      setIsHost(snapshot.lobby.hostUserId === snapshot.session.userId);
    });
  }, [runtime]);

  return isHost;
}
