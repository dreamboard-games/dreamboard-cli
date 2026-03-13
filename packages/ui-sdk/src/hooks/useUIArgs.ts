import { useMemo } from "react";
import type { PlayerId } from "@dreamboard/manifest";
import { AllActivePlayerStateNames } from "@dreamboard/manifest";
import { useGameState } from "./useGameState.js";
import { usePluginSession } from "../context/PluginSessionContext.js";
import type { UIArgsResult } from "@dreamboard/ui-args";

/**
 * Hook to access phase-specific UI arguments from getUIArgs handler
 * for the current controlling player.
 *
 * Returns an object keyed by phase name. Only the current phase has UIArgs data;
 * all other phases return null. This enables type-safe destructuring:
 *
 * @example
 * ```typescript
 * const { playerActions, setupPhase } = useUIArgs();
 *
 * // playerActions is PlayerActionsUIArgs | null
 * // - Has data if currentState === 'playerActions'
 * // - null otherwise
 *
 * if (playerActions) {
 *   // Type-safe access to playerActions UIArgs
 *   console.log(playerActions.actionCosts);
 * }
 * ```
 *
 * UIArgs contain dynamic, phase-specific data computed by the server, such as:
 * - Action costs with discounts applied
 * - Pre-computed affordability checks
 * - Missing resources for each action
 * - Phase-specific hints for the UI
 */
export function useUIArgs(): UIArgsResult {
  const { controllingPlayerId } = usePluginSession();
  const gameState = useGameState();

  return useMemo(() => {
    const currentPhase = gameState.currentState;
    const uiArgs =
      controllingPlayerId && gameState.uiArgs
        ? gameState.uiArgs[controllingPlayerId as PlayerId]
        : null;

    // Build result object dynamically with all phases as keys
    // Only the current phase gets the actual UIArgs, others get null
    const result = {} as UIArgsResult;
    for (const phase of AllActivePlayerStateNames) {
      (result as Record<string, unknown>)[phase] =
        currentPhase === phase ? uiArgs : null;
    }
    return result;
  }, [controllingPlayerId, gameState.uiArgs, gameState.currentState]);
}
