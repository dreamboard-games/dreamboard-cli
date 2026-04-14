/** Collapsible panel for grouping game actions with state-based visibility. */

import { useId, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { ChevronUp } from "lucide-react";

export interface ActionPanelProps {
  title?: string;
  /** Current game state/phase for context display */
  state?: string;
  /** Human-readable state labels */
  stateLabels?: Record<string, string>;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
}

export function ActionPanel({
  title = "Actions",
  state,
  stateLabels,
  collapsible = true,
  defaultExpanded = true,
  children,
  className,
}: ActionPanelProps) {
  const contentId = useId();
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
        aria-controls={contentId}
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
            id={contentId}
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
  title: string;
  description?: string;
  visible?: boolean;
  /** Highlight style for special phases */
  variant?: "default" | "warning" | "danger" | "success";
  children: ReactNode;
  className?: string;
}
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
