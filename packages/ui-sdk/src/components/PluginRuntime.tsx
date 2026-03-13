import React from "react";
import { RuntimeProvider } from "../context/RuntimeContext.js";
import { usePluginRuntime } from "../hooks/usePluginRuntime.js";
import { GameSkeleton } from "./GameSkeleton.js";

export interface PluginRuntimeProps {
  /** Child components to render after game has started */
  children: React.ReactNode;
  /**
   * Timeout in milliseconds to wait for GAME_STARTED message.
   * @default 10000 (10 seconds)
   */
  timeout?: number;
  /** Custom loading component to show while waiting for game to start */
  loadingComponent?: React.ReactNode;
  /** Custom error component to show when initialization fails */
  errorComponent?: (error: string) => React.ReactNode;
}

/**
 * PluginRuntime provides the RuntimeContext for plugin components.
 *
 * This component:
 * - Creates a RuntimeAPI instance using the SDK-provided implementation
 * - Waits for GAME_STARTED before rendering children
 * - Buffers game messages until handlers are set up
 * - Provides RuntimeAPI and session state to all child components
 *
 * @example
 * ```tsx
 * // In your plugin's index.tsx
 * import { PluginRuntime } from '@dreamboard/ui-sdk';
 * import App from './App';
 *
 * ReactDOM.createRoot(document.getElementById('root')!).render(
 *   <PluginRuntime>
 *     <App />
 *   </PluginRuntime>
 * );
 * ```
 */
export function PluginRuntime({
  children,
  timeout = 10000,
  loadingComponent,
  errorComponent,
}: PluginRuntimeProps) {
  const { runtime, isReady, error } = usePluginRuntime({ timeout });

  if (error) {
    if (errorComponent) {
      return <>{errorComponent(error)}</>;
    }
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <p className="text-red-600 font-medium mb-2">Failed to load game</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return <GameSkeleton message="Waiting for game to start..." />;
  }

  return <RuntimeProvider runtime={runtime}>{children}</RuntimeProvider>;
}
