import type { CardId, CardProperties } from "../manifest.js";
import type { CardInfo, CardItem } from "../types/player-state.js";

export interface ReducerCardLike {
  id?: CardId;
  cardType: string;
  name?: string;
  text?: string;
  properties?: CardProperties;
}

export type CardItemSource = CardItem | CardInfo | ReducerCardLike;

export function toCardItems<CardValue extends CardItemSource>(
  cardIds: readonly CardId[],
  cardsById: Readonly<Record<string, CardValue | undefined>>,
): CardItem[] {
  const items: CardItem[] = [];

  for (const cardId of cardIds) {
    const card = cardsById[cardId];
    if (!card) {
      continue;
    }

    if ("type" in card) {
      items.push(card);
      continue;
    }

    items.push({
      id: card.id ?? cardId,
      type: card.cardType,
      name: card.name,
      text: card.text,
      properties: card.properties ?? {},
    });
  }

  return items;
}

