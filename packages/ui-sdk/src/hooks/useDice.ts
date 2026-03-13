/**
 * useDice hook - Access dice state from game state
 *
 * Provides dice data for games with dice rolling mechanics
 * like Catan, Monopoly, Risk, etc.
 *
 * @example Basic usage with single die
 * ```tsx
 * const { die, currentValue, hasRolled } = useDie('red-die');
 *
 * return (
 *   <div>
 *     {hasRolled ? `Rolled: ${currentValue}` : 'Not rolled yet'}
 *   </div>
 * );
 * ```
 *
 * @example Multiple dice (e.g., Catan 2d6)
 * ```tsx
 * const { values, sum, allRolled } = useDice(['die-1', 'die-2']);
 *
 * return (
 *   <DiceRoller
 *     values={values}
 *     render={({ sum }) => <span className="text-4xl">{sum ?? '?'}</span>}
 *   />
 * );
 * ```
 *
 * @example Get all dice
 * ```tsx
 * const { dice, diceIds } = useAllDice();
 *
 * return (
 *   <div>
 *     {diceIds.map(id => (
 *       <DieDisplay key={id} die={dice[id]} />
 *     ))}
 *   </div>
 * );
 * ```
 */

import { useMemo } from "react";
import { useGameState } from "./useGameState.js";
import type { DieState } from "../types/player-state.js";
import { DieId } from "@dreamboard/manifest";

// ============================================================================
// Types
// ============================================================================

export interface UseDieReturn {
  die: DieState;
  id: DieId;
  sides: number;
  currentValue: number | undefined;
  hasRolled: boolean;
  color: string | undefined;
}

export interface UseDiceReturn {
  dice: Record<DieId, DieState>;
  diceArray: DieState[];
  count: number;
  values: Array<number | undefined>;
  sum: number | undefined;
  allRolled: boolean;
  getDie: (dieId: DieId) => DieState | undefined;
}

export interface UseAllDiceReturn {
  dice: Record<DieId, DieState>;
  diceIds: DieId[];
  count: number;
  hasDice: boolean;
}
/**
 * Hook to access a single die's state from game state.
 *
 * @param dieId - The ID of the die to access
 * @returns Die state and utilities
 * @throws Error if the die is not found in game state
 */
export function useDie(dieId: DieId): UseDieReturn {
  const gameState = useGameState();

  const die = gameState.dice[dieId];
  if (!die) {
    throw new Error(
      `useDie: Die "${dieId}" not found in game state. ` +
        `Available dice: ${Object.keys(gameState.dice).join(", ") || "none"}`,
    );
  }

  return {
    die,
    id: die.id,
    sides: die.sides,
    currentValue: die.currentValue ?? undefined,
    hasRolled: die.currentValue !== null && die.currentValue !== undefined,
    color: die.color ?? undefined,
  };
}

/**
 * Hook to access multiple dice states from game state.
 *
 * @param dieIds - Array of die IDs to access
 * @returns Dice states and utilities
 * @throws Error if any die is not found in game state
 */
export function useDice(dieIds: DieId[]): UseDiceReturn {
  const gameState = useGameState();

  const diceMap = useMemo(() => {
    const result = {} as Record<DieId, DieState>;
    for (const dieId of dieIds) {
      const die = gameState.dice[dieId];
      if (!die) {
        throw new Error(
          `useDice: Die "${dieId}" not found in game state. ` +
            `Available dice: ${Object.keys(gameState.dice).join(", ") || "none"}`,
        );
      }
      result[dieId] = die;
    }
    return result;
  }, [gameState.dice, dieIds]);

  const diceArray = useMemo((): DieState[] => {
    // diceMap is guaranteed to have all dieIds from the validation above
    return dieIds.map((id) => diceMap[id] as DieState);
  }, [dieIds, diceMap]);

  const values = useMemo(
    () => diceArray.map((die) => die.currentValue ?? undefined),
    [diceArray],
  );

  const allRolled = useMemo(
    () =>
      diceArray.every(
        (die) => die.currentValue !== null && die.currentValue !== undefined,
      ),
    [diceArray],
  );

  const sum = useMemo(() => {
    if (!allRolled) return undefined;
    return diceArray.reduce((acc, die) => acc + (die.currentValue ?? 0), 0);
  }, [diceArray, allRolled]);

  const getDie = (dieId: DieId) => diceMap[dieId];

  return {
    dice: diceMap,
    diceArray,
    count: diceArray.length,
    values,
    sum,
    allRolled,
    getDie,
  };
}

/**
 * Hook to get all available dice in the game.
 *
 * @returns All dice states and utilities
 */
export function useAllDice(): UseAllDiceReturn {
  const gameState = useGameState();

  const dice = gameState.dice;
  const diceIds = Object.keys(dice) as DieId[];

  return {
    dice,
    diceIds,
    count: diceIds.length,
    hasDice: diceIds.length > 0,
  };
}

/**
 * Hook to get all available dice IDs.
 *
 * @returns Array of dice IDs
 */
export function useDiceIds(): DieId[] {
  const gameState = useGameState();
  return Object.keys(gameState.dice) as DieId[];
}
