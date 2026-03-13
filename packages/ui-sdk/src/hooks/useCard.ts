import { useMemo } from "react";
import { useGameState } from "./useGameState.js";
import { CardId } from "@dreamboard/manifest";
import { CardInfo, CardItem } from "../types/player-state.js";

/**
 * Convert CardInfo (from store) to CardItem (for frontend use).
 * Properties are already parsed by the store's transformCards().
 */
function cardInfoToItem(cardInfo: CardInfo): CardItem {
  return {
    id: cardInfo.id,
    type: cardInfo.cardType,
    cardName: cardInfo.cardName,
    description: cardInfo.description,
    properties: cardInfo.properties,
  };
}

export function useCard(cardId: CardId | null): CardItem | undefined {
  const gameState = useGameState();

  return useMemo(() => {
    if (!cardId) return undefined;
    const cardInfo = gameState.cards[cardId];
    if (!cardInfo) return undefined;

    return cardInfoToItem(cardInfo);
  }, [gameState.cards, cardId]);
}

export function useCards(cardIds: CardId[]): Array<CardItem | undefined> {
  const gameState = useGameState();

  return useMemo(() => {
    return cardIds.map((cardId) => {
      const cardInfo = gameState.cards[cardId];
      if (!cardInfo) return undefined;

      return cardInfoToItem(cardInfo);
    });
  }, [gameState.cards, cardIds]);
}
