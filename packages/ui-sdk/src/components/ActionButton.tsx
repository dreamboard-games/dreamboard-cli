/**
 * ActionButton component - Action buttons with cost display and disabled states
 *
 * Design Philosophy: "Clear Action Communication"
 * - Visual cost display with affordability check
 * - Loading states for async actions
 * - Disabled state with reason tooltip
 * - Multiple style variants
 *
 * @example Basic usage
 * ```tsx
 * <ActionButton
 *   label="Build House"
 *   cost={{ wood: 3, stone: 2 }}
 *   currentResources={{ wood: 5, stone: 1 }}
 *   resourceDefs={resourceDefinitions}
 *   onClick={() => buildHouse()}
 * />
 * ```
 */

import { motion } from "framer-motion";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";
import { CostDisplay, type ResourceDefinition } from "./CostDisplay.js";
import type { ComponentType } from "react";

export interface ActionButtonProps {
  /** Action label */
  label: string;
  /** Action description */
  description?: string;
  /** Resource cost (optional) */
  cost?: Record<string, number>;
  /** Current resources for affordability check */
  currentResources?: Record<string, number>;
  /** Resource definitions for cost display */
  resourceDefs?: ResourceDefinition[];
  /** Whether action is available */
  available?: boolean;
  /** Reason why disabled (shown as tooltip) */
  disabledReason?: string;
  /** Whether action is loading */
  loading?: boolean;
  /** Icon component */
  icon?: ComponentType<{
    className?: string;
    strokeWidth?: number;
    "aria-hidden"?: string;
  }>;
  /** Color variant */
  variant?: "primary" | "secondary" | "danger" | "success";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Click handler */
  onClick: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * ActionButton component for game actions
 *
 * Features:
 * - Integrated cost display
 * - Automatic affordability checking
 * - Loading spinner
 * - Multiple variants and sizes
 * - Accessible with proper ARIA attributes
 */
export function ActionButton({
  label,
  description,
  cost,
  currentResources,
  resourceDefs,
  available = true,
  disabledReason,
  loading = false,
  icon: Icon,
  variant = "primary",
  size = "md",
  onClick,
  className,
}: ActionButtonProps) {
  // Check if player can afford the cost
  const canAfford =
    !cost ||
    !currentResources ||
    Object.entries(cost).every(
      ([key, value]) => (currentResources[key] ?? 0) >= value,
    );

  const isDisabled = !available || !canAfford || loading;

  const variantClasses = {
    primary:
      "bg-[#fdfbf7] border-[3px] border-border text-foreground hover:bg-primary hover:text-white hard-shadow hover:hard-shadow-sm active:shadow-none wobbly-border",
    secondary:
      "bg-[#e5e0d8] border-[3px] border-border text-foreground hover:bg-[#2d5da1] hover:text-white hard-shadow hover:hard-shadow-sm active:shadow-none wobbly-border",
    danger:
      "bg-[#ff4d4d] border-[3px] border-border text-white hover:brightness-90 hard-shadow hover:hard-shadow-sm active:shadow-none wobbly-border",
    success:
      "bg-[#fff9c4] border-[3px] border-border text-foreground hover:bg-green-500 hover:text-white hard-shadow hover:hard-shadow-sm active:shadow-none wobbly-border",
  };

  const sizeClasses = {
    sm: {
      button: "px-3 py-2 text-sm",
      icon: "w-4 h-4",
      description: "text-xs",
    },
    md: {
      button: "px-4 py-3 text-base sm:text-lg",
      icon: "w-5 h-5",
      description: "text-sm",
    },
    lg: {
      button: "px-5 py-4 text-lg sm:text-xl",
      icon: "w-6 h-6",
      description: "text-base",
    },
  };

  const styles = sizeClasses[size];

  // Determine disabled reason for aria
  const computedDisabledReason = !available
    ? disabledReason || "Action not available"
    : !canAfford
      ? "Not enough resources"
      : undefined;

  return (
    <motion.button
      type="button"
      whileHover={!isDisabled ? { rotate: 1 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98, x: 2, y: 2 } : undefined}
      onClick={onClick}
      disabled={isDisabled}
      title={isDisabled ? computedDisabledReason : undefined}
      className={clsx(
        "w-full font-bold font-sans transition-transform",
        "flex items-center justify-between gap-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        styles.button,
        isDisabled
          ? "bg-[#e5e0d8] text-muted-foreground border-[3px] border-border border-dashed cursor-not-allowed opacity-60 wobbly-border"
          : variantClasses[variant],
        className,
      )}
      aria-label={`${label}${description ? `: ${description}` : ""}${isDisabled ? ` (${computedDisabledReason})` : ""}`}
      aria-disabled={isDisabled}
    >
      {/* Left side: Icon and labels */}
      <div className="flex items-center gap-2 min-w-0">
        {Icon && !loading && (
          <Icon
            className={clsx(styles.icon, "flex-shrink-0")}
            aria-hidden="true"
            strokeWidth={3}
          />
        )}
        {loading && (
          <Loader2
            className={clsx(styles.icon, "animate-spin flex-shrink-0")}
            aria-hidden="true"
            strokeWidth={3}
          />
        )}
        <div className="text-left min-w-0">
          <div className="truncate">{label}</div>
          {description && (
            <div
              className={clsx(
                styles.description,
                "opacity-80 truncate font-medium",
              )}
            >
              {description}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Cost display */}
      {cost && resourceDefs && Object.keys(cost).length > 0 && (
        <CostDisplay
          cost={cost}
          currentResources={currentResources}
          resourceDefs={resourceDefs}
          size={size === "lg" ? "md" : "sm"}
        />
      )}
    </motion.button>
  );
}
