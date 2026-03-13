import type {
  CardId,
  DeckId,
  HandId,
  PlayerId,
  ResourceId,
} from "../../shared/manifest.ts";

export function assertCardId(value: string): CardId {
  return value;
}

export function assertCardIds(values: string[]): CardId[] {
  return values;
}

export function assertDeckId(value: string): DeckId {
  return value;
}

export function assertPlayerId(value: string): PlayerId {
  return value;
}

export function assertHandId(value: string): HandId {
  return value;
}

export function assertResourceId(value: string): ResourceId {
  return value;
}
