import { useCallback, useMemo } from "react";
import type { HexBoardState, HexTileState } from "../types/player-state.js";
import { useBoardTopology } from "./useBoardTopology.js";

export function useHexBoard(
  board: Pick<HexBoardState, "id" | "tiles" | "edges" | "vertices">,
) {
  const topology = useBoardTopology(board);

  const tileByCoordinate = useMemo(
    () =>
      new Map(
        board.tiles.map((tile) => [`${tile.q},${tile.r}`, tile] as const),
      ),
    [board.tiles],
  );

  const getTile = useCallback(
    (tileId: string) => {
      return topology.getSpace(tileId) as HexTileState | undefined;
    },
    [topology],
  );

  const getTileAt = useCallback(
    (q: number, r: number) => {
      return tileByCoordinate.get(`${q},${r}`);
    },
    [tileByCoordinate],
  );

  const getNeighbors = useCallback(
    (tileId: string) => {
      return topology.getAdjacentSpaces(tileId) as HexTileState[];
    },
    [topology],
  );

  const getTilesInRange = useCallback(
    (centerTileId: string, range: number) => {
      return board.tiles.filter(
        (tile) => topology.getDistance(centerTileId, tile.id) <= range,
      );
    },
    [board.tiles, topology],
  );

  return {
    ...topology,
    getTile,
    getTileAt,
    getNeighbors,
    getTilesInRange,
  };
}
