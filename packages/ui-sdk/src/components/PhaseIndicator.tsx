/**
 * PhaseIndicator component - Shows current game phase and turn status
 *
 * Design Philosophy: "Contextual Game State"
 * - Clear phase/turn indication
 * - "Your Turn" highlighting
 * - Active player display
 * - Multiple display variants
 *
 * @example Basic usage
 * ```tsx
 * <PhaseIndicator
 *   currentPhase="playerActions"
 *   phaseLabels={{ playerActions: "Your Actions", rollDice: "Roll Dice" }}
 *   isMyTurn={true}
 * />
 * ```
 */

import { motion } from "framer-motion";
import { clsx } from "clsx";
import { Clock, User } from "lucide-react";

export interface PhaseIndicatorProps {
  /** Current phase/state name */
  currentPhase: string;
  /** Human-readable phase display names */
  phaseLabels?: Record<string, string>;
  /** Whether it's the current user's turn */
  isMyTurn?: boolean;
  /** Active player name(s) */
  activePlayerNames?: string[];
  /** Variant style */
  variant?: "badge" | "bar" | "minimal";
  /** Additional class names */
  className?: string;
}

/**
 * PhaseIndicator component for game state display
 *
 * Features:
 * - Phase name with optional labels
 * - Turn indicator with animation
 * - Active player display
 * - Multiple visual variants
 */
export function PhaseIndicator({
  currentPhase,
  phaseLabels,
  isMyTurn,
  activePlayerNames,
  variant = "badge",
  className,
}: PhaseIndicatorProps) {
  // Convert camelCase or snake_case to readable label
  const formatPhase = (phase: string) =>
    phase
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase());

  const label = phaseLabels?.[currentPhase] || formatPhase(currentPhase);

  if (variant === "minimal") {
    return (
      <span
        className={clsx(
          "text-sm sm:text-base font-bold font-sans text-muted-foreground underline decoration-wavy decoration-border underline-offset-4",
          className,
        )}
        role="status"
        aria-label={`Current phase: ${label}`}
      >
        {label}
      </span>
    );
  }

  return (
    <div
      className={clsx(
        "flex items-center gap-2 sm:gap-3 flex-wrap font-sans",
        variant === "bar" &&
          "p-2 sm:p-3 bg-[#e5e0d8] border-[3px] border-border wobbly-border-md shadow-inner",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Turn indicator */}
      {isMyTurn !== undefined && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, rotate: isMyTurn ? -2 : 1 }}
          className={clsx(
            "px-3 sm:px-4 py-1 sm:py-1.5 border-[3px] border-border wobbly-border text-sm sm:text-base font-bold hard-shadow-sm",
            "flex items-center gap-2",
            isMyTurn
              ? "bg-primary text-white"
              : "bg-white text-muted-foreground",
          )}
          aria-label={isMyTurn ? "Your turn" : "Waiting for other players"}
        >
          {isMyTurn ? (
            <>
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-2.5 h-2.5 bg-white rounded-full border border-border inline-block"
              />
              <span>Your Turn!</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
              <span>Waiting...</span>
            </>
          )}
        </motion.div>
      )}

      {/* Phase label */}
      <div
        className={clsx(
          "px-3 sm:px-4 py-1 sm:py-1.5 border-2 border-border font-bold",
          variant === "badge" &&
            "bg-[#fff9c4] text-foreground wobbly-border-md rotate-1 hard-shadow-sm",
          variant === "bar" && "bg-white text-foreground wobbly-border",
        )}
      >
        {label}
      </div>

      {/* Active players */}
      {activePlayerNames && activePlayerNames.length > 0 && !isMyTurn && (
        <div className="flex items-center gap-1.5 text-sm font-bold text-foreground bg-white px-2 py-1 border-2 border-border border-dashed wobbly-border -rotate-1">
          <User className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
          <span>{activePlayerNames.join(", ")}</span>
        </div>
      )}
    </div>
  );
}
