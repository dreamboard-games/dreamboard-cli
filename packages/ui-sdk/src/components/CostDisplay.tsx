/**
 * CostDisplay component - Shows resource costs with affordability indication
 *
 * Design Philosophy: "Clear Cost Communication"
 * - Visual affordability feedback (green/red)
 * - Compact inline display for action buttons
 * - Flexible stacked layout for detailed views
 * - Accessible with proper labels
 *
 * @example Basic usage
 * ```tsx
 * <CostDisplay
 *   cost={{ gold: 3, wood: 2 }}
 *   currentResources={{ gold: 5, wood: 1 }}
 *   resourceDefs={resourceDefinitions}
 * />
 * ```
 */

import { clsx } from "clsx";
import type { ComponentType } from "react";

export interface ResourceDefinition {
  /** Unique resource type identifier */
  type: string;
  /** Human-readable label */
  label: string;
  /** Icon component */
  icon?: ComponentType<{ className?: string }>;
  /** Text color class */
  color?: string;
}

export interface CostDisplayProps {
  /** Cost requirements keyed by resource type */
  cost: Record<string, number>;
  /** Current resources to check affordability (optional) */
  currentResources?: Record<string, number>;
  /** Resource definitions for icons/colors */
  resourceDefs: ResourceDefinition[];
  /** Size variant */
  size?: "sm" | "md";
  /** Layout orientation */
  layout?: "inline" | "stacked";
  /** Additional class names */
  className?: string;
}

/**
 * CostDisplay component for showing resource costs
 *
 * Features:
 * - Visual affordability indication
 * - Inline or stacked layouts
 * - Icon support with fallback to text
 * - Accessible cost information
 */
export function CostDisplay({
  cost,
  currentResources,
  resourceDefs,
  size = "sm",
  layout = "inline",
  className,
}: CostDisplayProps) {
  const resourceMap = Object.fromEntries(resourceDefs.map((r) => [r.type, r]));

  const sizeClasses = {
    sm: { icon: "w-3 h-3", text: "text-xs", gap: "gap-0.5" },
    md: { icon: "w-4 h-4", text: "text-sm", gap: "gap-1" },
  };

  const styles = sizeClasses[size];

  // Calculate total affordability for aria label
  const canAffordAll =
    !currentResources ||
    Object.entries(cost).every(
      ([type, amount]) => (currentResources[type] ?? 0) >= amount,
    );

  const costEntries = Object.entries(cost).filter(
    ([, amount]) => amount !== undefined && amount > 0,
  );

  if (costEntries.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx(
        "flex",
        styles.gap,
        layout === "stacked" && "flex-col",
        layout === "inline" && "flex-row flex-wrap items-center",
        className,
      )}
      role="list"
      aria-label={`Cost: ${costEntries.map(([type, amount]) => `${amount} ${resourceMap[type]?.label || type}`).join(", ")}${currentResources ? (canAffordAll ? " (affordable)" : " (cannot afford)") : ""}`}
    >
      {costEntries.map(([type, amount]) => {
        const def = resourceMap[type];
        const have = currentResources?.[type] ?? Infinity;
        const canAfford = have >= amount;
        const Icon = def?.icon;

        return (
          <div
            key={type}
            className={clsx(
              "flex items-center",
              styles.gap,
              styles.text,
              currentResources && !canAfford && "text-red-400",
              currentResources && canAfford && "text-green-400",
              !currentResources && "text-slate-300",
            )}
            title={`${amount} ${def?.label || type}${currentResources ? ` (have ${have})` : ""}`}
            role="listitem"
          >
            {Icon && <Icon className={styles.icon} aria-hidden="true" />}
            <span className="font-semibold">{amount}</span>
            {!Icon && (
              <span className="text-[10px] opacity-70">
                {def?.label?.slice(0, 3) || type.slice(0, 3)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
