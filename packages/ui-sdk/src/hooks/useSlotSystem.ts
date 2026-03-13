/**
 * useSlotSystem hook - Utilities for worker placement games
 *
 * Provides basic slot lookup and occupant utilities.
 * Game-specific logic (costs, rewards, availability rules) should be implemented by the parent.
 *
 * @example
 * ```tsx
 * const slotApi = useSlotSystem(slots, occupants);
 *
 * // Get slot and its occupants
 * const slot = slotApi.getSlot('plow-field');
 * const occupants = slotApi.getOccupantsOfSlot('plow-field');
 *
 * // Check capacity
 * const remaining = slotApi.getRemainingCapacity('plow-field');
 *
 * // Get occupants by player
 * const myWorkers = slotApi.getOccupantsByPlayer('player-1');
 * ```
 */

import { useMemo } from "react";
import type {
  SlotDefinition,
  SlotOccupant,
} from "../components/board/SlotSystem.js";

export interface SlotSystemApi {
  /** Get a slot by ID */
  getSlot: (slotId: string) => SlotDefinition | undefined;

  /** Get all occupants of a slot */
  getOccupantsOfSlot: (slotId: string) => SlotOccupant[];

  /** Get all occupants placed by a player */
  getOccupantsByPlayer: (playerId: string) => SlotOccupant[];

  /** Check if a slot is full */
  isFull: (slotId: string) => boolean;

  /** Check if a slot has any occupants */
  isOccupied: (slotId: string) => boolean;

  /** Get remaining capacity of a slot */
  getRemainingCapacity: (slotId: string) => number;

  /** Get the slot a specific piece is in */
  getSlotOfPiece: (pieceId: string) => string | undefined;

  /** Get slots by group */
  getSlotsByGroup: (group: string) => SlotDefinition[];

  /** Get slots by type */
  getSlotsByType: (type: string) => SlotDefinition[];
}

/**
 * Hook providing slot utilities for worker placement games
 */
export function useSlotSystem(
  slots: SlotDefinition[],
  occupants: SlotOccupant[],
): SlotSystemApi {
  return useMemo(() => {
    // Build lookups
    const slotMap = new Map(slots.map((s) => [s.id, s]));

    // Group occupants by slot
    const occupantsBySlot: Record<string, SlotOccupant[]> = {};
    occupants.forEach((o) => {
      const slotId = o.slotId;
      const existing = occupantsBySlot[slotId];
      if (existing) {
        existing.push(o);
      } else {
        occupantsBySlot[slotId] = [o];
      }
    });

    // Group occupants by player
    const occupantsByPlayer: Record<string, SlotOccupant[]> = {};
    occupants.forEach((o) => {
      const playerId = o.playerId;
      const existing = occupantsByPlayer[playerId];
      if (existing) {
        existing.push(o);
      } else {
        occupantsByPlayer[playerId] = [o];
      }
    });

    // Piece to slot mapping
    const pieceToSlot: Record<string, string> = {};
    occupants.forEach((o) => {
      pieceToSlot[o.pieceId] = o.slotId;
    });

    return {
      getSlot: (slotId) => slotMap.get(slotId),

      getOccupantsOfSlot: (slotId) => occupantsBySlot[slotId] ?? [],

      getOccupantsByPlayer: (playerId) => occupantsByPlayer[playerId] ?? [],

      isFull: (slotId) => {
        const slot = slotMap.get(slotId);
        if (!slot) return true;
        const slotOccupants = occupantsBySlot[slotId] ?? [];
        return slotOccupants.length >= slot.capacity;
      },

      isOccupied: (slotId) => {
        const slotOccupants = occupantsBySlot[slotId] ?? [];
        return slotOccupants.length > 0;
      },

      getRemainingCapacity: (slotId) => {
        const slot = slotMap.get(slotId);
        if (!slot) return 0;
        const slotOccupants = occupantsBySlot[slotId] ?? [];
        return Math.max(0, slot.capacity - slotOccupants.length);
      },

      getSlotOfPiece: (pieceId) => pieceToSlot[pieceId],

      getSlotsByGroup: (group) => {
        return slots.filter((s) => s.group === group);
      },

      getSlotsByType: (type) => {
        return slots.filter((s) => s.type === type);
      },
    };
  }, [slots, occupants]);
}
