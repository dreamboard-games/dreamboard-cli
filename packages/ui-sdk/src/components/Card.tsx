/**
 * Presentational card component. Feed from reducer views, not runtime state.
 */

import { motion, type HTMLMotionProps } from "framer-motion";
import { clsx } from "clsx";
import type { CardItem } from "../types/player-state.js";

export interface CardProps extends Omit<HTMLMotionProps<"button">, "children"> {
  card: CardItem;
  selected?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  faceDown?: boolean;
  renderContent?: (card: CardItem) => React.ReactNode;
  onCardClick?: (cardId: string) => void;
  "aria-label"?: string;
}

/** Default card content renderer */
function DefaultCardContent({ card }: { card: CardItem }) {
  const props = card.properties;
  const entries = Object.entries(props || {});

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-2">
      {card.cardName ? (
        <div className="text-xs sm:text-sm font-semibold text-slate-800 truncate max-w-full px-1">
          {card.cardName}
        </div>
      ) : entries.length > 0 ? (
        entries.slice(0, 3).map(([key, value]) => (
          <div key={key} className="text-xs sm:text-sm font-medium">
            <span className="opacity-60">{key}:</span>{" "}
            <span className="font-semibold">{String(value)}</span>
          </div>
        ))
      ) : (
        <div className="text-xs sm:text-sm opacity-40">
          {card.id.slice(0, 8)}
        </div>
      )}
    </div>
  );
}

/**
 * @example
 * ```tsx
 * <Card card={cardItem} onCardClick={(id) => console.log(id)} />
 * ```
 */
export function Card({
  card,
  selected = false,
  disabled = false,
  size = "md",
  faceDown = false,
  renderContent,
  onCardClick,
  className,
  "aria-label": ariaLabel,
  ...motionProps
}: CardProps) {
  const sizeClasses = {
    sm: "w-16 h-24 sm:w-20 sm:h-28",
    md: "w-20 h-32 sm:w-24 sm:h-36",
    lg: "w-24 h-36 sm:w-32 sm:h-48",
  };

  const handleClick = () => {
    if (!disabled && onCardClick) {
      onCardClick(card.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!disabled && onCardClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onCardClick(card.id);
    }
  };

  // Generate accessible label
  const label = ariaLabel || card.cardName || `Card ${card.id}`;
  const props = card.properties || {};
  const metadataStr = Object.entries(props)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  return (
    <motion.button
      type="button"
      className={clsx(
        "relative transition-transform duration-200",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2d5da1]/20",
        sizeClasses[size],
        {
          // Interactive states (hover/active handled by Framer Motion whileHover/whileTap)
          "cursor-pointer": !disabled && onCardClick,
          "cursor-not-allowed opacity-50": disabled,
          "cursor-default": !onCardClick,

          // Selection state
          "ring-4 ring-[#ff4d4d]": selected,
        },
        className,
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={`${label}${metadataStr ? `. ${metadataStr}` : ""}`}
      aria-pressed={selected}
      aria-disabled={disabled}
      role="button"
      tabIndex={disabled ? -1 : 0}
      {...motionProps}
      // Default animations
      initial={motionProps.initial ?? { opacity: 0, y: 20 }}
      animate={motionProps.animate ?? { opacity: 1, y: 0 }}
      whileHover={
        // If whileHover is explicitly provided (even as undefined), use it
        // Otherwise, apply default hover effect when interactive
        "whileHover" in motionProps
          ? motionProps.whileHover
          : !disabled && onCardClick
            ? { y: -4, scale: 1.05 }
            : undefined
      }
      whileTap={
        // If whileTap is explicitly provided (even as undefined), use it
        // Otherwise, apply default tap effect when interactive
        "whileTap" in motionProps
          ? motionProps.whileTap
          : !disabled && onCardClick
            ? { scale: 0.95 }
            : undefined
      }
      transition={
        motionProps.transition ?? {
          type: "spring",
          stiffness: 300,
          damping: 20,
        }
      }
    >
      {/* Card back (face-down state) */}
      {faceDown ? (
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none bg-[#2d5da1] border-[3px] border-[#2d2d2d]"
          style={{
            borderRadius: "25px 8px 25px 8px / 8px 25px 8px 25px",
            boxShadow: "4px 4px 0px 0px #2d2d2d",
          }}
        >
          <div
            className="absolute inset-2 border-2 border-white/40"
            style={{
              borderRadius: "15px 5px 15px 5px / 5px 15px 5px 15px",
              background:
                "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 20px)",
            }}
          />
        </div>
      ) : (
        /* Card front */
        <div
          className="absolute inset-0 overflow-hidden bg-[#fdfbf7] pointer-events-none border-[3px] border-[#2d2d2d]"
          style={{
            borderRadius: "25px 8px 25px 8px / 8px 25px 8px 25px",
            boxShadow: selected
              ? "6px 6px 0px 0px #ff4d4d"
              : "4px 4px 0px 0px #2d2d2d",
          }}
        >
          {renderContent ? (
            renderContent(card)
          ) : (
            <DefaultCardContent card={card} />
          )}
        </div>
      )}

      {/* Shine effect on hover (only when interactive) */}
      {!disabled && onCardClick && (
        <motion.div
          className="absolute inset-0 rounded-lg sm:rounded-xl pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)",
            opacity: 0,
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
}

// Re-export CardItem type for convenience
export type { CardItem };
