/**
 * Player hand with adaptive overlap, automatic drawer fallback, and keyboard navigation.
 * For full control, use the `useHandLayout` hook directly.
 */

import { clsx } from "clsx";
import { useCallback, useState } from "react";
import {
  useHandLayout,
  type CardSize,
  type HandLayout,
} from "../hooks/useHandLayout.js";
import type { CardItem } from "./Card.js";
import type { ReactNode } from "react";

export interface HandCardRenderProps {
  card: CardItem;
  index: number;
  isHovered: boolean;
  isSelected: boolean;
  x: number;
  y: number;
  zIndex: number;
  cardDimensions: { width: number; height: number };
}

export interface HandDrawerRenderProps {
  cards: CardItem[];
  selectedIds: string[];
  cardCount: number;
  selectedCount: number;
  disabled: boolean;
  cardDimensions: { width: number; height: number };
}

export interface HandEmptyRenderProps {
  layout: HandLayout;
}

export interface HandContainerRenderProps {
  totalWidth: number;
  totalHeight: number;
  cardDimensions: { width: number; height: number };
  children: ReactNode;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
}

export interface HandProps {
  cards: CardItem[];
  selectedIds?: string[];
  disabled?: boolean;
  cardSize?: CardSize;
  layout?: HandLayout;
  "aria-label"?: string;
  renderCard: (props: HandCardRenderProps) => ReactNode;
  /** Render function for drawer mode (when cards don't fit on small screens) */
  renderDrawer: (props: HandDrawerRenderProps) => ReactNode;
  renderEmpty: (props: HandEmptyRenderProps) => ReactNode;
  renderContainer?: (props: HandContainerRenderProps) => ReactNode;
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
  const [focusedIndex, setFocusedIndex] = useState(-1);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (cardCount === 0) return;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          setFocusedIndex((prev) => (prev <= 0 ? cardCount - 1 : prev - 1));
          break;
        case "ArrowRight":
          e.preventDefault();
          setFocusedIndex((prev) => (prev >= cardCount - 1 ? 0 : prev + 1));
          break;
        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setFocusedIndex(cardCount - 1);
          break;
      }
    },
    [cardCount],
  );

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

  const renderedCards = cards.map((card, index) => {
    const isSelected = selectedIds.includes(card.id);
    const isFocused = focusedIndex === index;
    const isHovered = hoveredIndex === index || isFocused;
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
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onBlur={() => setFocusedIndex(-1)}
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

  return (
    <div
      ref={containerRef}
      className={clsx(
        "relative w-full flex items-end justify-center py-4 sm:py-6 overflow-visible",
        className,
      )}
      role="group"
      aria-label={`${ariaLabel} - ${cardCount} card${cardCount !== 1 ? "s" : ""}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onBlur={() => setFocusedIndex(-1)}
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
