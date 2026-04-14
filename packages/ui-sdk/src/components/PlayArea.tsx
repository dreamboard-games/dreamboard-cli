/**
 * Central game board area for active game components (tricks, played cards, zones, etc.).
 */

import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { Card, type CardProps, type CardItem } from "./Card.js";

export interface PlayAreaProps {
  cards: CardItem[];
  filter?: (card: CardItem) => boolean;
  cardSize?: CardProps["size"];
  renderCard?: CardProps["renderContent"];
  layout?: "grid" | "row";
  interactive?: boolean;
  onCardClick?: (cardId: string) => void;
  "aria-label"?: string;
  className?: string;
}

/**
 * @example
 * ```tsx
 * <PlayArea cards={trickCards} layout="row" renderCard={(card) => <PlayingCard card={card} />} />
 * ```
 */
export function PlayArea({
  cards,
  filter,
  cardSize = "md",
  renderCard,
  layout = "row",
  interactive = false,
  onCardClick,
  "aria-label": ariaLabel = "Play area",
  className,
}: PlayAreaProps) {
  // Filter cards based on filter function
  const visibleCards = filter ? cards.filter(filter) : cards;

  // Layout-specific container classes
  const layoutClasses = {
    grid: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6",
    row: "flex flex-wrap items-center justify-center gap-3 sm:gap-6",
  };

  return (
    <div
      className={clsx(
        "relative w-full min-h-[200px] sm:min-h-[300px] p-6 sm:p-8",
        "border-[4px] border-dashed border-border wobbly-border-lg",
        "bg-white/40",
        "font-sans",
        className,
      )}
      role="region"
      aria-label={`${ariaLabel} - ${visibleCards.length} item${visibleCards.length !== 1 ? "s" : ""}`}
    >
      <AnimatePresence mode="popLayout">
        {visibleCards.length === 0 ? (
          <motion.div
            className="flex items-center justify-center h-full text-muted-foreground font-bold text-lg sm:text-xl absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
          >
            <div className="bg-[#fff9c4] px-4 py-2 border-2 border-border wobbly-border rotate-2 inline-block">
              No cards in play
            </div>
          </motion.div>
        ) : (
          <div className={layoutClasses[layout]}>
            {visibleCards.map((card, index) => (
              <motion.div
                key={card.id}
                layout
                initial={{
                  opacity: 0,
                  scale: 0.8,
                  rotate: index % 2 === 0 ? -4 : 4,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: index % 2 === 0 ? 2 : -2,
                }}
                exit={{ opacity: 0, scale: 0.8, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: index * 0.05,
                }}
              >
                <Card
                  card={card}
                  size={cardSize}
                  renderContent={renderCard}
                  disabled={!interactive}
                  onCardClick={interactive ? onCardClick : undefined}
                />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
