/**
 * Hand component - Displays a player's hand of cards with render props
 *
 * Features:
 * - Container-aware adaptive overlap (cards overlap more when there are many)
 * - Automatic drawer fallback when cards can't fit on small screens
 * - Hover-by-position detection (can hover adjacent cards even when one is lifted)
 * - Full customization via render props
 *
 * For complete control, use the useHandLayout hook directly.
 */

import { clsx } from "clsx";
import {
  useHandLayout,
  type CardSize,
  type HandLayout,
} from "../hooks/useHandLayout.js";
import type { CardItem } from "./Card.js";
import type { ReactNode } from "react";

export interface HandCardRenderProps {
  /** The card data */
  card: CardItem;
  /** Index of the card in the hand */
  index: number;
  /** Whether the card is currently hovered */
  isHovered: boolean;
  /** Whether the card is selected */
  isSelected: boolean;
  /** X position (left offset) */
  x: number;
  /** Y position (vertical offset) */
  y: number;
  /** Z-index for layering */
  zIndex: number;
  /** Card dimensions */
  cardDimensions: { width: number; height: number };
}

export interface HandDrawerRenderProps {
  /** Array of cards */
  cards: CardItem[];
  /** Selected card IDs */
  selectedIds: string[];
  /** Card count */
  cardCount: number;
  /** Number of selected cards */
  selectedCount: number;
  /** Whether the hand is disabled */
  disabled: boolean;
  /** Card dimensions */
  cardDimensions: { width: number; height: number };
}

export interface HandEmptyRenderProps {
  /** The layout being used */
  layout: HandLayout;
}

export interface HandContainerRenderProps {
  /** Total width of all cards (for overlap layout) */
  totalWidth: number;
  /** Height needed for cards plus hover lift */
  totalHeight: number;
  /** Card dimensions */
  cardDimensions: { width: number; height: number };
  /** The rendered cards */
  children: ReactNode;
  /** Mouse move handler (attach to cards container) */
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Mouse leave handler (attach to cards container) */
  onMouseLeave: () => void;
}

export interface HandProps {
  /** Array of cards to display */
  cards: CardItem[];
  /** Selected card IDs */
  selectedIds?: string[];
  /** Whether cards can be interacted with */
  disabled?: boolean;
  /** Card size */
  cardSize?: CardSize;
  /** Layout style */
  layout?: HandLayout;
  /** Label for screen readers */
  "aria-label"?: string;
  /** Render function for each card */
  renderCard: (props: HandCardRenderProps) => ReactNode;
  /** Render function for drawer mode (when cards don't fit) */
  renderDrawer: (props: HandDrawerRenderProps) => ReactNode;
  /** Render function for empty hand state */
  renderEmpty: (props: HandEmptyRenderProps) => ReactNode;
  /** Optional render function for the cards container (for custom layout) */
  renderContainer?: (props: HandContainerRenderProps) => ReactNode;
  /** Additional class name for outer wrapper */
  className?: string;
}

/**
 * Hand component with customizable rendering via render props.
 *
 * For complete control over layout and interactions, use the `useHandLayout` hook directly.
 *
 * @example
 * ```tsx
 * <Hand
 *   cards={myCards}
 *   selectedIds={selectedIds}
 *   renderCard={({ card, isHovered, isSelected, x, y, zIndex }) => (
 *     <div
 *       style={{
 *         position: "absolute",
 *         left: x,
 *         transform: `translateY(${y}px)`,
 *         zIndex,
 *       }}
 *       className={clsx(isSelected && "ring-2 ring-blue-500")}
 *     >
 *       <MyCard card={card} />
 *     </div>
 *   )}
 *   renderDrawer={({ cards, selectedCount }) => (
 *     <button>View {cards.length} cards ({selectedCount} selected)</button>
 *   )}
 *   renderEmpty={() => <p>No cards in hand</p>}
 * />
 * ```
 */
export function Hand({
  cards,
  selectedIds = [],
  disabled = false,
  cardSize = "md",
  layout = "overlap",
  "aria-label": ariaLabel = "Your hand",
  renderCard,
  renderDrawer,
  renderEmpty,
  renderContainer,
  className,
}: HandProps) {
  const cardCount = cards.length;

  const {
    containerRef,
    cardsContainerRef,
    totalWidth,
    useDrawerMode,
    cardDimensions,
    constants,
    hoveredIndex,
    handleMouseMove,
    handleMouseLeave,
    getCardPosition,
  } = useHandLayout({
    cardCount,
    cardSize,
    layout,
  });

  const selectedCount = cards.filter((c) => selectedIds.includes(c.id)).length;

  // Drawer mode - delegate to user's render function
  if (useDrawerMode && layout === "overlap" && cardCount > 0) {
    return (
      <div
        ref={containerRef}
        className={clsx(
          "relative w-full flex items-center justify-center py-4",
          className,
        )}
        role="group"
        aria-label={`${ariaLabel} - ${cardCount} card${cardCount !== 1 ? "s" : ""}`}
      >
        {renderDrawer({
          cards,
          selectedIds,
          cardCount,
          selectedCount,
          disabled,
          cardDimensions,
        })}
      </div>
    );
  }

  // Empty hand
  if (cardCount === 0) {
    return (
      <div
        ref={containerRef}
        className={clsx(
          "relative w-full flex items-end justify-center py-4 sm:py-6",
          className,
        )}
        role="group"
        aria-label={`${ariaLabel} - empty`}
      >
        {renderEmpty({ layout })}
      </div>
    );
  }

  // Build the cards
  const renderedCards = cards.map((card, index) => {
    const isSelected = selectedIds.includes(card.id);
    const isHovered = hoveredIndex === index;
    const position = getCardPosition(index, isHovered, isSelected);

    return renderCard({
      card,
      index,
      isHovered,
      isSelected,
      x: position.x,
      y: position.y,
      zIndex: position.zIndex,
      cardDimensions,
    });
  });

  // Spread layout - simple flex row
  if (layout === "spread") {
    return (
      <div
        ref={containerRef}
        className={clsx(
          "relative w-full flex items-end justify-center py-4 sm:py-6",
          className,
        )}
        role="group"
        aria-label={`${ariaLabel} - ${cardCount} card${cardCount !== 1 ? "s" : ""}`}
      >
        <div className="flex gap-1 justify-center flex-wrap">
          {renderedCards}
        </div>
      </div>
    );
  }

  // Overlap/Stack layout
  const totalHeight = cardDimensions.height + constants.hoverLift + 8;

  const containerProps: HandContainerRenderProps = {
    totalWidth,
    totalHeight,
    cardDimensions,
    children: renderedCards,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };

  // Allow custom container rendering
  if (renderContainer) {
    return (
      <div
        ref={containerRef}
        className={clsx(
          "relative w-full flex items-end justify-center py-4 sm:py-6 overflow-visible",
          className,
        )}
        role="group"
        aria-label={`${ariaLabel} - ${cardCount} card${cardCount !== 1 ? "s" : ""}`}
      >
        {renderContainer(containerProps)}
      </div>
    );
  }

  // Default container
  return (
    <div
      ref={containerRef}
      className={clsx(
        "relative w-full flex items-end justify-center py-4 sm:py-6 overflow-visible",
        className,
      )}
      role="group"
      aria-label={`${ariaLabel} - ${cardCount} card${cardCount !== 1 ? "s" : ""}`}
    >
      <div
        ref={cardsContainerRef}
        className="relative"
        style={{
          width: layout === "overlap" ? totalWidth : undefined,
          height: totalHeight,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {renderedCards}
      </div>
    </div>
  );
}

// Re-export types and hook for users who want full control
export { useHandLayout } from "../hooks/useHandLayout.js";
export type {
  UseHandLayoutOptions,
  UseHandLayoutReturn,
  CardPositionProps,
  CardSize,
  HandLayout,
} from "../hooks/useHandLayout.js";
export type { CardItem } from "./Card.js";
