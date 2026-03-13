/**
 * ConnectedCard - A Card component that automatically fetches card data via hooks.
 *
 * Use this when you have RuntimeContext set up and want automatic data fetching.
 * For fixtures/testing or manual data management, use the base Card component directly.
 */

import { Card, type CardProps } from "./Card.js";
import { useCard } from "../hooks/useCard.js";
import type { CardId } from "@dreamboard/manifest";

export interface ConnectedCardProps extends Omit<CardProps, "card"> {
  /** Card ID to fetch and display */
  cardId: CardId;
}

/**
 * ConnectedCard fetches card data from context and renders a Card.
 *
 * @example
 * ```tsx
 * // Requires RuntimeContext to be set up
 * <ConnectedCard cardId="card-spade-A" onCardClick={handleClick} />
 * ```
 */
export function ConnectedCard({ cardId, ...props }: ConnectedCardProps) {
  const card = useCard(cardId);

  // Don't render if card not found
  if (!card) {
    return null;
  }

  return <Card card={card} {...props} />;
}
