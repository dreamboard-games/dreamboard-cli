import type { SlotOccupant } from "../components/board/SlotSystem.js";

export interface SlotOccupantEntryLike {
  componentId: string;
  playerId: string;
  slotId: string;
  hostId?: string;
  data?: Record<string, unknown>;
}

export interface ToSlotOccupantsOptions<
  Entry extends SlotOccupantEntryLike = SlotOccupantEntryLike,
> {
  formatSlotId?: (entry: Entry) => string;
  getPieceId?: (entry: Entry) => string;
  getPlayerId?: (entry: Entry) => string;
  getSlotId?: (entry: Entry) => string;
  getData?: (entry: Entry) => Record<string, unknown> | undefined;
}

export function toSlotOccupants<Entry extends SlotOccupantEntryLike>(
  entries: readonly Entry[],
  options: ToSlotOccupantsOptions<Entry> = {},
): SlotOccupant[] {
  const {
    formatSlotId,
    getPieceId = (entry) => entry.componentId,
    getPlayerId = (entry) => entry.playerId,
    getSlotId = (entry) => entry.slotId,
    getData = (entry) => entry.data,
  } = options;

  return entries.map((entry) => ({
    pieceId: getPieceId(entry),
    playerId: getPlayerId(entry),
    slotId: formatSlotId?.(entry) ?? getSlotId(entry),
    data: getData(entry),
  }));
}

