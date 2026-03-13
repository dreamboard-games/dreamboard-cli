import type { RuntimeAPI } from "./runtime-api.js";

/**
 * PluginContext provides the runtime environment for plugin components.
 * This is made available via React Context to all components in the plugin.
 */
export interface PluginContext {
  /**
   * RuntimeAPI instance for interacting with the game runtime
   */
  runtime: RuntimeAPI;

  /**
   * Session ID for the current game session
   */
  sessionId: string;

  /**
   * Current player ID (the player this UI instance is for)
   */
  playerId: string | null;
}
