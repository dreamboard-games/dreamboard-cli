import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import type { RefObject } from "react";

// Card dimension constants for overlap calculations
const CARD_DIMENSIONS = {
  sm: { width: 48, height: 68 },
  md: { width: 64, height: 90 },
  lg: { width: 80, height: 112 },
} as const;

const MIN_VISIBLE_PORTION = 16; // minimum visible pixels per card when overlapping
const HOVER_LIFT = 20; // pixels to lift on hover
const SELECTED_LIFT = 8; // pixels to lift when selected
const DRAWER_THRESHOLD_RATIO = 0.3; // if overlap is less than 30% of card width, use drawer

export type CardSize = "sm" | "md" | "lg";
export type HandLayout = "spread" | "stack" | "overlap";

export interface CardPositionProps {
  /** X position (left offset) */
  x: number;
  /** Y position (vertical offset for hover/selected) */
  y: number;
  /** Z-index for layering */
  zIndex: number;
  /** CSS transform origin */
  transformOrigin: string;
}

export interface UseHandLayoutOptions {
  /** Number of cards in the hand */
  cardCount: number;
  /** Card size variant */
  cardSize?: CardSize;
  /** Layout style */
  layout?: HandLayout;
  /** Padding to subtract from container width */
  containerPadding?: number;
}

export interface UseHandLayoutReturn {
  /** Ref to attach to the container element */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Ref to attach to the cards container element (for mouse tracking) */
  cardsContainerRef: RefObject<HTMLDivElement | null>;
  /** Measured container width */
  containerWidth: number;
  /** Calculated offset between cards */
  cardOffset: number;
  /** Total width of all cards */
  totalWidth: number;
  /** Whether drawer mode should be used */
  useDrawerMode: boolean;
  /** Card dimensions for the current size */
  cardDimensions: { width: number; height: number };
  /** Constants for positioning */
  constants: {
    hoverLift: number;
    selectedLift: number;
  };
  /** Currently hovered card index */
  hoveredIndex: number | null;
  /** Mouse move handler for the cards container */
  handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Mouse leave handler for the cards container */
  handleMouseLeave: () => void;
  /** Get position props for a card at the given index */
  getCardPosition: (
    index: number,
    isHovered: boolean,
    isSelected: boolean,
  ) => CardPositionProps;
}

/**
 * Hook for managing hand layout calculations and interactions.
 *
 * Provides container measurement, overlap calculations, drawer mode detection,
 * and hover state management for card hand displays.
 *
 * @example
 * ```tsx
 * function MyHand({ cards, selectedIds }) {
 *   const {
 *     containerRef,
 *     cardsContainerRef,
 *     totalWidth,
 *     useDrawerMode,
 *     cardDimensions,
 *     hoveredIndex,
 *     handleMouseMove,
 *     handleMouseLeave,
 *     getCardPosition,
 *     constants,
 *   } = useHandLayout({
 *     cardCount: cards.length,
 *     cardSize: "md",
 *     layout: "overlap",
 *   });
 *
 *   if (useDrawerMode) {
 *     return <MyDrawerUI cards={cards} />;
 *   }
 *
 *   return (
 *     <div ref={containerRef}>
 *       <div
 *         ref={cardsContainerRef}
 *         style={{ width: totalWidth, height: cardDimensions.height + constants.hoverLift }}
 *         onMouseMove={handleMouseMove}
 *         onMouseLeave={handleMouseLeave}
 *       >
 *         {cards.map((card, index) => {
 *           const isHovered = hoveredIndex === index;
 *           const isSelected = selectedIds.includes(card.id);
 *           const position = getCardPosition(index, isHovered, isSelected);
 *
 *           return (
 *             <div
 *               key={card.id}
 *               style={{
 *                 position: "absolute",
 *                 left: position.x,
 *                 transform: `translateY(${position.y}px)`,
 *                 zIndex: position.zIndex,
 *               }}
 *             >
 *               <MyCard card={card} />
 *             </div>
 *           );
 *         })}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useHandLayout({
  cardCount,
  cardSize = "md",
  layout = "overlap",
  containerPadding = 32,
}: UseHandLayoutOptions): UseHandLayoutReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const cardDimensions = CARD_DIMENSIONS[cardSize];

  // Measure container width with ResizeObserver
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - containerPadding);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [containerPadding]);

  // Calculate adaptive overlap based on container width and card count
  const { cardOffset, totalWidth, useDrawerMode } = useMemo(() => {
    if (layout !== "overlap") {
      return {
        cardOffset: cardDimensions.width,
        totalWidth: 0,
        useDrawerMode: false,
      };
    }

    if (cardCount === 0) {
      return { cardOffset: 0, totalWidth: 0, useDrawerMode: false };
    }
    if (cardCount === 1) {
      return {
        cardOffset: cardDimensions.width,
        totalWidth: cardDimensions.width,
        useDrawerMode: false,
      };
    }

    // Available width for overlap distribution
    const availableWidth = containerWidth;
    if (availableWidth <= 0) {
      return {
        cardOffset: cardDimensions.width,
        totalWidth: cardDimensions.width * cardCount,
        useDrawerMode: false,
      };
    }

    // Calculate the offset needed to fit all cards
    // Total width = cardWidth + (cardCount - 1) * offset
    // So offset = (availableWidth - cardWidth) / (cardCount - 1)
    const idealOffset =
      (availableWidth - cardDimensions.width) / (cardCount - 1);

    // Clamp offset between minimum visible portion and full card width
    const clampedOffset = Math.max(
      MIN_VISIBLE_PORTION,
      Math.min(cardDimensions.width, idealOffset),
    );

    // Calculate total width with this offset
    const width = cardDimensions.width + (cardCount - 1) * clampedOffset;

    // Determine if we should use drawer mode
    // Use drawer if cards are overlapping too much (less than threshold of card visible)
    const visiblePortion = clampedOffset / cardDimensions.width;
    const shouldUseDrawer =
      visiblePortion < DRAWER_THRESHOLD_RATIO && cardCount > 2;

    return {
      cardOffset: clampedOffset,
      totalWidth: width,
      useDrawerMode: shouldUseDrawer,
    };
  }, [cardCount, containerWidth, layout, cardDimensions.width]);

  // Calculate hovered card index based on mouse X position
  // This allows hovering on adjacent cards even when one is popped up
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (
        !cardsContainerRef.current ||
        cardCount === 0 ||
        layout === "spread" ||
        layout === "stack"
      ) {
        return;
      }

      const rect = cardsContainerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;

      let newHoveredIndex: number | null = null;

      // Find which card the mouse is over based on X position
      for (let i = cardCount - 1; i >= 0; i--) {
        const cardLeft = i * cardOffset;
        const cardRight =
          i === cardCount - 1
            ? cardLeft + cardDimensions.width
            : (i + 1) * cardOffset;

        if (mouseX >= cardLeft && mouseX < cardRight) {
          newHoveredIndex = i;
          break;
        }
      }

      // Check if mouse is in the rightmost card's full area
      if (newHoveredIndex === null && mouseX >= 0 && mouseX < totalWidth) {
        const lastCardLeft = (cardCount - 1) * cardOffset;
        if (mouseX >= lastCardLeft) {
          newHoveredIndex = cardCount - 1;
        }
      }

      setHoveredIndex(newHoveredIndex);
    },
    [cardCount, cardOffset, totalWidth, layout, cardDimensions.width],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  // Calculate z-index: hovered > selected > position
  const getZIndex = useCallback(
    (index: number, isHovered: boolean, isSelected: boolean) => {
      if (isHovered) return 200;
      if (isSelected) return 100 + index;
      return index;
    },
    [],
  );

  // Get card position props for different layouts
  const getCardPosition = useCallback(
    (
      index: number,
      isHovered: boolean,
      isSelected: boolean,
    ): CardPositionProps => {
      const zIndex = getZIndex(index, isHovered, isSelected);

      if (layout === "stack") {
        return {
          x: index * 4,
          y: 0,
          zIndex,
          transformOrigin: "bottom center",
        };
      }

      if (layout === "spread") {
        return {
          x: 0,
          y: 0,
          zIndex,
          transformOrigin: "bottom center",
        };
      }

      // Overlap layout (default) - simple horizontal overlap with lift on hover/select
      const yOffset = isHovered ? -HOVER_LIFT : isSelected ? -SELECTED_LIFT : 0;

      return {
        x: index * cardOffset,
        y: yOffset,
        zIndex,
        transformOrigin: "bottom center",
      };
    },
    [layout, cardOffset, getZIndex],
  );

  return {
    containerRef,
    cardsContainerRef,
    containerWidth,
    cardOffset,
    totalWidth,
    useDrawerMode,
    cardDimensions,
    constants: {
      hoverLift: HOVER_LIFT,
      selectedLift: SELECTED_LIFT,
    },
    hoveredIndex,
    handleMouseMove,
    handleMouseLeave,
    getCardPosition,
  };
}
