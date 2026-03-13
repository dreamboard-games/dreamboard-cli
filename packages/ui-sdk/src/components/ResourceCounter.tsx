/**
 * ResourceCounter component - Displays resource counts with icons
 *
 * Design Philosophy: "At-a-glance Resource Tracking"
 * - Clear visual hierarchy with icons and counts
 * - Flexible layouts for different UI contexts
 * - Smooth animations for count changes
 * - Touch-optimized interactions
 *
 * @example Basic usage
 * ```tsx
 * <ResourceCounter
 *   resources={[
 *     { type: 'gold', label: 'Gold', icon: Coins, color: 'text-yellow-400' },
 *     { type: 'wood', label: 'Wood', icon: TreePine, color: 'text-amber-700' },
 *   ]}
 *   counts={{ gold: 5, wood: 3 }}
 * />
 * ```
 */

import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import type { ComponentType } from "react";
import { ResourceId } from "@dreamboard/manifest";

export interface ResourceDisplayConfig {
  /** Unique resource type identifier */
  type: ResourceId;
  /** Human-readable label */
  label: string;
  /** Icon component to display */
  icon: ComponentType<{
    className?: string;
    strokeWidth?: number;
    "aria-hidden"?: string;
  }>;
  /** Icon color class (e.g., 'text-primary'). Defaults to 'text-foreground' */
  iconColor?: string;
  /** Background color class (e.g., 'bg-[#fff9c4]'). Defaults to 'bg-white' */
  bgColor?: string;
  /** Count text color class (e.g., 'text-primary'). Defaults to 'text-foreground' */
  textColor?: string;
}

export interface ResourceCounterProps {
  /** Resource display configs with icons and styling */
  resources: ResourceDisplayConfig[];
  /** Current counts keyed by resource type */
  counts: Record<ResourceId, number>;
  /** Layout style */
  layout?: "row" | "grid" | "compact";
  /** Number of columns for grid layout */
  columns?: number;
  /** Show zero values */
  showZero?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Click handler for individual resources */
  onResourceClick?: (resourceType: ResourceId) => void;
  /** Additional class names */
  className?: string;
}

/**
 * ResourceCounter component for displaying resource amounts
 *
 * Features:
 * - Multiple layout options (row, grid, compact)
 * - Animated count changes
 * - Interactive click handling
 * - Configurable icons and colors
 */
export function ResourceCounter({
  resources,
  counts,
  layout = "row",
  columns = 5,
  showZero = true,
  size = "md",
  onResourceClick,
  className,
}: ResourceCounterProps) {
  const sizeClasses = {
    sm: {
      icon: "w-4 h-4",
      text: "text-sm",
      padding: "px-2 py-1",
      gap: "gap-1",
    },
    md: {
      icon: "w-5 h-5",
      text: "text-base sm:text-lg",
      padding: "px-3 py-1.5",
      gap: "gap-1.5",
    },
    lg: {
      icon: "w-6 h-6",
      text: "text-lg sm:text-xl",
      padding: "px-4 py-2",
      gap: "gap-2",
    },
  };

  const styles = sizeClasses[size];

  const filteredResources = showZero
    ? resources
    : resources.filter((r) => (counts[r.type] ?? 0) > 0);

  return (
    <div
      className={clsx(
        layout === "grid" && "grid",
        layout === "row" && "flex flex-wrap",
        layout === "compact" && "flex flex-wrap",
        layout === "row" && "gap-3 sm:gap-4",
        layout === "compact" && "gap-2",
        layout === "grid" && "gap-3 sm:gap-4",
        "font-sans",
        className,
      )}
      style={
        layout === "grid"
          ? { gridTemplateColumns: `repeat(${columns}, 1fr)` }
          : undefined
      }
      role="list"
      aria-label="Resource counts"
    >
      <AnimatePresence mode="popLayout">
        {filteredResources.map(
          ({ type, label, icon: Icon, iconColor, bgColor, textColor }, i) => {
            const count = counts[type] ?? 0;

            return (
              <motion.div
                key={type}
                layout
                initial={{
                  opacity: 0,
                  scale: 0.8,
                  rotate: i % 2 === 0 ? -2 : 2,
                }}
                animate={{ opacity: 1, scale: 1, rotate: i % 2 === 0 ? 1 : -1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={
                  onResourceClick ? { scale: 1.05, rotate: 0 } : undefined
                }
                whileTap={onResourceClick ? { scale: 0.95 } : undefined}
                onClick={() => onResourceClick?.(type)}
                className={clsx(
                  "flex items-center border-[3px] border-border wobbly-border-md hard-shadow-sm",
                  styles.padding,
                  styles.gap,
                  bgColor || "bg-white",
                  onResourceClick &&
                    "cursor-pointer hover:hard-shadow transition-shadow",
                )}
                title={`${label}: ${count}`}
                role="listitem"
                aria-label={`${label}: ${count}`}
              >
                <Icon
                  className={clsx(styles.icon, iconColor || "text-foreground")}
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
                <motion.span
                  key={count}
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  className={clsx(
                    styles.text,
                    "font-bold",
                    textColor || "text-foreground",
                  )}
                >
                  {count}
                </motion.span>
              </motion.div>
            );
          },
        )}
      </AnimatePresence>
    </div>
  );
}
