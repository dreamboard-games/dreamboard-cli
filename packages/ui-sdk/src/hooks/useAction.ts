import { useMemo } from "react";
import { useRuntimeContext } from "../context/RuntimeContext";
import {
  ActionName,
  ActionParametersFor,
  ActionsByPhase,
  ActionsForPhase,
  ActivePlayerStateName,
  AllActivePlayerStateNames,
} from "@dreamboard/manifest";
import { useMe } from "./useMe";
import { useGameState } from "./useGameState";

/**
 * Error thrown when action validation fails.
 * Contains the error code and optional message from the validation result.
 */
export class ValidationError extends Error {
  constructor(
    public readonly errorCode?: string,
    message?: string,
  ) {
    super(message || errorCode || "Validation failed");
    this.name = "ValidationError";
  }
}

/**
 * Hook to get phase-specific action submitters for the current player.
 * Returns an object keyed by phase name with "Actions" suffix. Only the current
 * phase has action submitters; all other phases return null.
 *
 * This enables type-safe destructuring and action submission:
 *
 * @returns Object with phase-specific action submitters
 * @throws ValidationError if action validation fails
 *
 * @example
 * ```typescript
 * const { playCardActions, selectCardsToPassActions } = useAction();
 *
 * // playCardActions is { 'play-card': (params) => Promise<void> } | null
 * // - Has action submitters if currentState === 'playCard'
 * // - null otherwise
 *
 * if (playCardActions) {
 *   try {
 *     // Type-safe: params are checked against ActionDefinitions
 *     await playCardActions['play-card']({ cardId: 'CLUBS_10' });
 *   } catch (error) {
 *     if (error instanceof ValidationError) {
 *       console.log('Validation failed:', error.errorCode, error.message);
 *     }
 *   }
 * }
 *
 * if (selectCardsToPassActions) {
 *   // Type-safe: cardIds must be Standard52DeckCardId[]
 *   await selectCardsToPassActions['select-cards-to-pass']({
 *     cardIds: ['CLUBS_10', 'CLUBS_2', 'HEARTS_A']
 *   });
 * }
 * ```
 */
export function useAction(): UseActionResult {
  const runtime = useRuntimeContext();
  const me = useMe();
  const gameState = useGameState();

  return useMemo(() => {
    const currentPhase = gameState.currentState;

    // Helper to create a type-safe action submitter for a given action type
    const createSubmitter = <T extends ActionName>(actionType: T) => {
      return async (params: ActionParametersFor<T>) => {
        // Always validate first
        const validation = await runtime.validateAction(
          me.playerId,
          actionType,
          params as Record<string, unknown>,
        );

        if (!validation.valid) {
          throw new ValidationError(validation.errorCode, validation.message);
        }

        // Submit the action if validation passed
        return runtime.submitAction(me.playerId, actionType, params);
      };
    };

    // Build result dynamically from manifest values
    const result = {} as UseActionResult;

    for (const stateName of AllActivePlayerStateNames) {
      const key = `${stateName}Actions` as `${typeof stateName}Actions`;

      if (currentPhase === stateName) {
        // Current phase - create action submitters
        const actions = ActionsByPhase[stateName] ?? [];
        const submitters: Record<string, ActionSubmitter<ActionName>> = {};

        for (const actionName of actions) {
          submitters[actionName] = createSubmitter(actionName);
        }

        (result as Record<string, unknown>)[key] = submitters;
      } else {
        // Not current phase - return null
        (result as Record<string, unknown>)[key] = null;
      }
    }

    return result;
  }, [runtime, me.playerId, gameState.currentState]);
}

// Type for an action submitter function
export type ActionSubmitter<A extends ActionName> = (
  params: ActionParametersFor<A>,
) => Promise<void>;

// Type for all action submitters available in a specific phase
export type PhaseActionSubmitters<P extends ActivePlayerStateName> = {
  [K in ActionsForPhase[P][number]]: ActionSubmitter<K>;
};

// Result type for useAction hook
// Values are null when not in that phase, or the action submitters when in that phase
export type UseActionResult = {
  [P in ActivePlayerStateName as `${P}Actions`]: PhaseActionSubmitters<P> | null;
};
