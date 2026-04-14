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
  /** Whether the initial reducer-native snapshot is available and ready */
  isReady: boolean;
  /** Error message if initialization failed */
  error: string | null;
}

function hasProjectedView(
  snapshot: ReturnType<PluginRuntimeAPI["getSnapshot"]> | null | undefined,
): boolean {
  return snapshot !== null && snapshot !== undefined && snapshot.view != null;
}

/**
 * Hook that creates and manages a PluginRuntimeAPI instance.
 *
 * This hook handles:
 * 1. Creating the RuntimeAPI
 * 2. Waiting for the first state-sync snapshot before setting isReady
 *
 * In the new architecture, the host only renders the plugin when a reducer-native
 * snapshot is available, so isReady should become true quickly after init.
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
    const snapshot = runtime.getSnapshot?.();
    return hasProjectedView(snapshot);
  });
  const [error, setError] = useState<string | null>(null);

  // Subscribe to state-sync and set isReady when the first snapshot arrives.
  useEffect(() => {
    const snapshot = runtime.getSnapshot?.();
    if (hasProjectedView(snapshot)) {
      setError(null);
      setIsReady(true);
      return;
    }

    // Set up timeout
    const timeoutId = setTimeout(() => {
      const currentSnapshot = runtime.getSnapshot?.();
      if (!hasProjectedView(currentSnapshot)) {
        setError(
          `Timed out waiting for the initial projected view after ${timeout}ms. ` +
            "Ensure the host sends a reducer-native state-sync with a seat view.",
        );
      }
    }, timeout);

    // Subscribe to state changes
    const unsubscribe = runtime.subscribeToState?.((state) => {
      if (!hasProjectedView(state)) {
        setIsReady(false);
        return;
      }
      clearTimeout(timeoutId);
      setError(null);
      setIsReady(true);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe?.();
    };
  }, [runtime, timeout]);

  return { runtime, isReady, error };
}
