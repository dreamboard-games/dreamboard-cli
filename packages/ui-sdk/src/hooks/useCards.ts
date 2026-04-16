import { useMemo } from "react";
import type { GameView } from "@dreamboard/ui-contract";
import type { CardId } from "../manifest.js";
import {
  toCardItems,
  type CardItemSource,
} from "../helpers/cards.js";
import { useGameSelector } from "./useGameSelector.js";

export function useCards<CardValue extends CardItemSource>(
  cardIds: readonly CardId[],
  selectCards: (view: GameView) => Readonly<Record<string, CardValue | undefined>>,
) {
  const cardsById = useGameSelector(selectCards);
  return useMemo(() => toCardItems(cardIds, cardsById), [cardIds, cardsById]);
}

