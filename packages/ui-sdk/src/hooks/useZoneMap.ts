/**
 * useZoneMap hook - Generic utilities for zone/area-based boards
 *
 * Provides basic zone lookup and adjacency utilities.
 * Game-specific logic (control calculations, attack/reinforce rules, scoring)
 * should be implemented in game logic, not in this hook.
 *
 * @example
 * ```tsx
 * const zoneApi = useZoneMap(zones, pieces);
 *
 * // Lookup utilities
 * const zone = zoneApi.getZone('europe');
 * const piecesInZone = zoneApi.getPiecesInZone('europe');
 *
 * // Navigation utilities
 * const adjacent = zoneApi.getAdjacentZones('europe');
 * const isAdj = zoneApi.isAdjacent('europe', 'asia');
 *
 * // Filtering
 * const landZones = zoneApi.getZonesByType('land');
 * ```
 */

import { useMemo } from "react";
import type { ZoneDefinition, ZonePiece } from "../components/board/ZoneMap.js";

export interface UseZoneMapReturn {
  /** Get a zone by ID */
  getZone(zoneId: string): ZoneDefinition | undefined;

  /** Get IDs of adjacent zones */
  getAdjacentZones(zoneId: string): string[];

  /** Check if two zones are adjacent */
  isAdjacent(zone1: string, zone2: string): boolean;

  /** Get all pieces in a zone */
  getPiecesInZone(zoneId: string): ZonePiece[];

  /** Get a piece by ID */
  getPiece(pieceId: string): ZonePiece | undefined;

  /** Get all pieces owned by a player */
  getPiecesByOwner(playerId: string): ZonePiece[];

  /** Get all zones that have at least one piece */
  getOccupiedZones(): string[];

  /** Get all zones with no pieces */
  getEmptyZones(): string[];

  /** Get zones of a specific type */
  getZonesByType(type: string): ZoneDefinition[];

  /** Get all zone IDs */
  getAllZoneIds(): string[];

  /** Get zones that contain pieces of a specific owner */
  getZonesWithOwner(playerId: string): string[];

  /** Get total zone count */
  getZoneCount(): number;
}

/**
 * Hook providing generic zone utilities for area-based boards
 *
 * This hook provides basic lookup and navigation utilities.
 * Game-specific logic should be implemented separately.
 */
export function useZoneMap(
  zones: ZoneDefinition[],
  pieces: ZonePiece[],
): UseZoneMapReturn {
  return useMemo(() => {
    // Build zone lookup
    const zoneMap = new Map(zones.map((z) => [z.id, z]));

    // Build piece lookup
    const pieceMap = new Map(pieces.map((p) => [p.id, p]));

    // Build pieces by zone
    const piecesByZone: Record<string, ZonePiece[]> = {};
    pieces.forEach((p) => {
      const existing = piecesByZone[p.zoneId];
      if (existing) {
        existing.push(p);
      } else {
        piecesByZone[p.zoneId] = [p];
      }
    });

    return {
      getZone: (zoneId) => zoneMap.get(zoneId),

      getAdjacentZones: (zoneId) => {
        const zone = zoneMap.get(zoneId);
        return zone?.adjacentTo || [];
      },

      isAdjacent: (zone1, zone2) => {
        const z1 = zoneMap.get(zone1);
        return z1?.adjacentTo.includes(zone2) || false;
      },

      getPiecesInZone: (zoneId) => piecesByZone[zoneId] || [],

      getPiece: (pieceId) => pieceMap.get(pieceId),

      getPiecesByOwner: (playerId) => {
        return pieces.filter((p) => p.owner === playerId);
      },

      getOccupiedZones: () => {
        return Object.keys(piecesByZone);
      },

      getEmptyZones: () => {
        return zones
          .filter((z) => {
            const zonePieces = piecesByZone[z.id];
            return !zonePieces || zonePieces.length === 0;
          })
          .map((z) => z.id);
      },

      getZonesByType: (type) => {
        return zones.filter((z) => z.type === type);
      },

      getAllZoneIds: () => zones.map((z) => z.id),

      getZonesWithOwner: (playerId) => {
        const result: string[] = [];
        zones.forEach((zone) => {
          const zonePieces = piecesByZone[zone.id] || [];
          if (zonePieces.some((p) => p.owner === playerId)) {
            result.push(zone.id);
          }
        });
        return result;
      },

      getZoneCount: () => zones.length,
    };
  }, [zones, pieces]);
}
