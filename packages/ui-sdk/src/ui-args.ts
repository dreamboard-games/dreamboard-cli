import { StateName } from "@dreamboard/manifest";

/** Map of phase name to its UIArgs type (placeholder, replaced by generated types) */
export type UIArgsByPhase = Record<StateName, unknown>;

/** Get UIArgs type for a specific phase */
export type UIArgsFor<P extends StateName> = UIArgsByPhase[P];

/** Union of all UIArgs types across all phases */
export type AnyUIArgs = UIArgsByPhase[StateName];

/**
 * Return type for useUIArgs hook.
 * Each phase name maps to its UIArgs type or null (if not the current phase).
 *
 * Usage:
 * ```typescript
 * const { playerActions, setupPhase } = useUIArgs();
 * // playerActions is PlayerActionsUIArgs | null
 * // setupPhase is SetupPhaseUIArgs | null
 * ```
 */
export type UIArgsResult = {
  [P in keyof UIArgsByPhase]: UIArgsByPhase[P] | null;
};
