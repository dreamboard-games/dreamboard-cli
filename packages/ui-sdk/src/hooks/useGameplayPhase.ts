import { usePluginState } from "../context/PluginStateContext.js";

/**
 * Returns the current reducer-native gameplay phase when gameplay is active.
 * Returns null during lobby or before the initial session snapshot provides gameplay.
 */
export function useGameplayPhase(): string | null {
  return usePluginState((state) => state.gameplay.currentPhase);
}
