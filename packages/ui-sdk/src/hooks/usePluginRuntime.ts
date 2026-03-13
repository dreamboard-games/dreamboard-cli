import { useState, useEffect } from "react";
import {
  createPluginRuntimeAPI,
  type PluginRuntimeAPI,
} from "../runtime/createPluginRuntimeAPI.js";

export interface UsePluginRuntimeOptions {
  /**
   * Timeout in milliseconds to wait for state-sync.
   * @default 10000 (10 seconds)
   */
  timeout?: number;
}

export interface UsePluginRuntimeResult {
  /** The RuntimeAPI instance */
  runtime: PluginRuntimeAPI;
  /** Whether the game state is available and ready to render */
  isReady: boolean;
  /** Error message if initialization failed */
  error: string | null;
}

/**
 * Hook that creates and manages a PluginRuntimeAPI instance.
 *
 * This hook handles:
 * 1. Creating the RuntimeAPI
 * 2. Waiting for state-sync message before setting isReady
 *
 * In the new architecture, the host only renders the plugin when game state
 * is available, so isReady should become true quickly after init.
 *
 * @example
 * ```tsx
 * function PluginRuntime({ children }: { children: React.ReactNode }) {
 *   const { runtime, isReady, error } = usePluginRuntime();
 *
 *   if (error) {
 *     return <div>Error: {error}</div>;
 *   }
 *
 *   if (!isReady) {
 *     return <GameSkeleton message="Waiting for game state..." />;
 *   }
 *
 *   return <RuntimeProvider runtime={runtime}>{children}</RuntimeProvider>;
 * }
 * ```
 */
export function usePluginRuntime(
  options: UsePluginRuntimeOptions = {},
): UsePluginRuntimeResult {
  const { timeout = 10000 } = options;

  // Create runtime once and keep stable reference
  const [runtime] = useState<PluginRuntimeAPI>(() => createPluginRuntimeAPI());
  const [isReady, setIsReady] = useState(() => {
    // Check if we already have state (host may have sent state-sync before mount)
    const snapshot = runtime.getSnapshot?.();
    return snapshot?.game !== null && snapshot?.game !== undefined;
  });
  const [error, setError] = useState<string | null>(null);

  // Subscribe to state-sync and set isReady when game state arrives
  useEffect(() => {
    // Check if already ready
    const snapshot = runtime.getSnapshot?.();
    if (snapshot?.game) {
      setIsReady(true);
      return;
    }

    // Set up timeout
    const timeoutId = setTimeout(() => {
      const currentSnapshot = runtime.getSnapshot?.();
      if (!currentSnapshot?.game) {
        setError(
          `Timed out waiting for game state after ${timeout}ms. ` +
            "Ensure the host sends state-sync message.",
        );
      }
    }, timeout);

    // Subscribe to state changes
    const unsubscribe = runtime.subscribeToState?.((state) => {
      if (state.game) {
        clearTimeout(timeoutId);
        setIsReady(true);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe?.();
    };
  }, [runtime, timeout]);

  return { runtime, isReady, error };
}
