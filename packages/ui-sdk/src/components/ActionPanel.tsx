/**
 * ActionPanel and ActionGroup components - Composable action UI with grouping
 *
 * Design Philosophy: "Organized Action Space"
 * - Collapsible panel for action sections
 * - Grouped actions with visual hierarchy
 * - State-based visibility and highlighting
 * - Mobile-friendly with smooth animations
 *
 * @example Basic usage
 * ```tsx
 * <ActionPanel title="Your Turn" state="buildPhase">
 *   <ActionGroup title="Build" visible={phase === 'build'}>
 *     <ActionButton label="Build Road" onClick={() => {}} />
 *     <ActionButton label="Build Settlement" onClick={() => {}} />
 *   </ActionGroup>
 *   <ActionGroup title="End Turn">
 *     <ActionButton label="End Turn" variant="success" onClick={() => {}} />
 *   </ActionGroup>
 * </ActionPanel>
 * ```
 */

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { ChevronUp } from "lucide-react";

export interface ActionPanelProps {
  /** Panel title */
  title?: string;
  /** Current game state/phase for context display */
  state?: string;
  /** Human-readable state labels */
  stateLabels?: Record<string, string>;
  /** Whether panel is collapsible */
  collapsible?: boolean;
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Children (ActionGroups or ActionButtons) */
  children: ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * ActionPanel component - Container for action groups
 *
 * Features:
 * - Collapsible header
 * - State/phase display
 * - Smooth expand/collapse animation
 * - Backdrop blur effect
 */
export function ActionPanel({
  title = "Actions",
  state,
  stateLabels,
  collapsible = true,
  defaultExpanded = true,
  children,
  className,
}: ActionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const stateLabel = state
    ? stateLabels?.[state] || state.replace(/([A-Z])/g, " $1").trim()
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "bg-[#fdfbf7] border-[4px] border-border wobbly-border-lg hard-shadow-lg rotate-1",
        className,
      )}
      role="region"
      aria-label={title}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
        className={clsx(
          "w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b-[3px] border-dashed border-border bg-[#fff9c4]",
          collapsible && "hover:bg-[#e5e0d8] cursor-pointer",
          "transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
        )}
        disabled={!collapsible}
        aria-expanded={isExpanded}
        aria-controls="action-panel-content"
        style={{ borderRadius: "inherit" }} // Match parent wobbly border roughly
      >
        <div className="text-left font-sans">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {title}
          </h2>
          {stateLabel && (
            <p className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary inline-block border border-border" />
              Phase: {stateLabel}
            </p>
          )}
        </div>
        {collapsible && (
          <motion.div
            animate={{ rotate: isExpanded ? 0 : 180 }}
            transition={{ duration: 0.2 }}
            className="border-2 border-border bg-white wobbly-border p-1"
          >
            <ChevronUp
              className="w-5 h-5 sm:w-6 sm:h-6 text-foreground"
              strokeWidth={3}
            />
          </motion.div>
        )}
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id="action-panel-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden bg-[radial-gradient(#e5e0d8_1px,transparent_1px)] [background-size:16px_16px]"
          >
            <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-white/80">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export interface ActionGroupProps {
  /** Group title */
  title: string;
  /** Group description */
  description?: string;
  /** Whether this group is visible */
  visible?: boolean;
  /** Highlight style for special phases */
  variant?: "default" | "warning" | "danger" | "success";
  /** Children (ActionButtons) */
  children: ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * ActionGroup component - Groups related actions together
 *
 * Features:
 * - Conditional visibility
 * - Variant-based styling
 * - Title and description
 * - Semantic grouping
 */
export function ActionGroup({
  title,
  description,
  visible = true,
  variant = "default",
  children,
  className,
}: ActionGroupProps) {
  if (!visible) return null;

  const variantClasses = {
    default:
      "border-[3px] border-border bg-white wobbly-border-md shadow-[4px_4px_0px_0px_#e5e0d8]",
    warning:
      "border-[3px] border-border bg-[#fff9c4] wobbly-border-md hard-shadow",
    danger: "border-[3px] border-border bg-[#ff4d4d]/10 wobbly-border-md",
    success: "border-[3px] border-border bg-green-100 wobbly-border-md",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={clsx(
        "p-4 sm:p-5 relative font-sans -rotate-1",
        variantClasses[variant],
        className,
      )}
      role="group"
      aria-labelledby={`action-group-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="absolute -top-3 left-4 bg-white border-2 border-border wobbly-border px-2 text-xs font-bold text-muted-foreground rotate-2">
        Group
      </div>
      <h3
        id={`action-group-${title.toLowerCase().replace(/\s+/g, "-")}`}
        className="text-lg sm:text-xl font-bold text-foreground mb-2"
      >
        {title}
      </h3>
      {description && (
        <p className="text-sm sm:text-base font-medium text-foreground opacity-80 mb-4">
          {description}
        </p>
      )}
      <div className="space-y-3">{children}</div>
    </motion.div>
  );
}
