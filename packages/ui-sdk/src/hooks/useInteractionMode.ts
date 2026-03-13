import { useState, useCallback, useMemo } from "react";

/**
 * Generic hook for managing interaction modes that can be either:
 * 1. Phase-driven (automatic, determined by game state)
 * 2. User-initiated (manual, triggered by user action)
 *
 * This solves the common pattern where board interactions need to handle
 * both mandatory phase actions AND optional user-triggered actions.
 *
 * @template T - The type of interaction mode (e.g., string union of mode names)
 *
 * @example Basic usage with phase-driven modes
 * ```tsx
 * // Game-specific: derive phase mode from game state
 * const phaseDrivenMode = useMemo(() => {
 *   if (currentState === 'placeInitialSettlement') return 'place-settlement';
 *   if (currentState === 'placeInitialRoad') return 'place-road';
 *   return null;
 * }, [currentState]);
 *
 * // SDK hook handles the rest
 * const { mode, setMode, clearMode, isPhaseDriven } = useInteractionMode(phaseDrivenMode);
 *
 * // In click handlers, always use `mode` (the effective mode)
 * const handleBoardClick = async (position) => {
 *   if (mode === 'place-settlement') {
 *     await submitAction('place_settlement', { position });
 *     clearMode(); // Only clears if user-initiated, no-op if phase-driven
 *   }
 * };
 *
 * // UI can show mode status
 * return (
 *   <button onClick={() => setMode('place-settlement')} disabled={isPhaseDriven}>
 *     Build Settlement
 *   </button>
 * );
 * ```
 *
 * @example With toggle behavior
 * ```tsx
 * const { mode, toggleMode } = useInteractionMode<'road' | 'settlement'>(null);
 *
 * <button onClick={() => toggleMode('road')}>
 *   {mode === 'road' ? 'Cancel' : 'Build Road'}
 * </button>
 * ```
 */
export function useInteractionMode<T extends string | number | symbol>(
  /**
   * Phase-driven mode derived from game state.
   * When non-null, this takes precedence over user-selected mode.
   * Pass null when no phase requires a specific interaction mode.
   */
  derivedMode: T | null = null,
) {
  const [userMode, setUserMode] = useState<T | null>(null);

  // Phase-driven mode always takes precedence
  const isPhaseDriven = derivedMode !== null;
  const effectiveMode = derivedMode ?? userMode;

  /**
   * Set the user-selected mode.
   * No-op when a phase-driven mode is active (can't override game phase).
   */
  const setMode = useCallback(
    (mode: T | null) => {
      if (!isPhaseDriven) {
        setUserMode(mode);
      }
    },
    [isPhaseDriven],
  );

  /**
   * Clear the current mode.
   * Only clears user-initiated modes; phase-driven modes are controlled by game state.
   */
  const clearMode = useCallback(() => {
    if (!isPhaseDriven) {
      setUserMode(null);
    }
  }, [isPhaseDriven]);

  /**
   * Toggle a mode on/off.
   * If the mode is already active, clears it; otherwise sets it.
   * No-op when a phase-driven mode is active.
   */
  const toggleMode = useCallback(
    (mode: T) => {
      if (!isPhaseDriven) {
        setUserMode((current) => (current === mode ? null : mode));
      }
    },
    [isPhaseDriven],
  );

  return useMemo(
    () => ({
      /** The effective mode (phase-driven or user-selected) */
      mode: effectiveMode,
      /** Whether any mode is currently active */
      isActive: effectiveMode !== null,
      /** Whether the current mode is phase-driven (mandatory) vs user-initiated */
      isPhaseDriven,
      /** Set a user mode (no-op if phase-driven) */
      setMode,
      /** Clear user mode (no-op if phase-driven) */
      clearMode,
      /** Toggle a user mode on/off (no-op if phase-driven) */
      toggleMode,
      /** The raw user-selected mode (for UI state display) */
      userMode,
    }),
    [effectiveMode, isPhaseDriven, setMode, clearMode, toggleMode, userMode],
  );
}

export type InteractionModeResult<T extends string | number | symbol> =
  ReturnType<typeof useInteractionMode<T>>;
