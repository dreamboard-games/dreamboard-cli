import { useCallback, useMemo } from "react";
import type {
  SquareBoardState,
  SquareCellState,
} from "../types/player-state.js";
import { useBoardTopology } from "./useBoardTopology.js";

type NeighborMode = "orthogonal" | "diagonal" | "all";
type DistanceMetric = "manhattan" | "chebyshev";

export function useSquareBoard(
  board: Pick<
    SquareBoardState,
    "id" | "cells" | "edges" | "vertices" | "rows" | "cols"
  >,
) {
  const topology = useBoardTopology(board);

  const cellByCoordinate = useMemo(
    () =>
      new Map(
        board.cells.map((cell) => [`${cell.row},${cell.col}`, cell] as const),
      ),
    [board.cells],
  );

  const getCell = useCallback(
    (cellId: string) => {
      return topology.getSpace(cellId) as SquareCellState | undefined;
    },
    [topology],
  );

  const getCellAt = useCallback(
    (row: number, col: number) => {
      return cellByCoordinate.get(`${row},${col}`);
    },
    [cellByCoordinate],
  );

  const getNeighbors = useCallback(
    (cellId: string, mode: NeighborMode = "orthogonal") => {
      const cell = getCell(cellId);
      if (!cell) {
        return [];
      }

      const offsets: ReadonlyArray<readonly [number, number]> =
        mode === "diagonal"
          ? [
              [-1, -1],
              [-1, 1],
              [1, -1],
              [1, 1],
            ]
          : mode === "all"
            ? [
                [-1, 0],
                [0, 1],
                [1, 0],
                [0, -1],
                [-1, -1],
                [-1, 1],
                [1, -1],
                [1, 1],
              ]
            : [
                [-1, 0],
                [0, 1],
                [1, 0],
                [0, -1],
              ];

      return offsets
        .map(([rowOffset, colOffset]) =>
          getCellAt(cell.row + rowOffset, cell.col + colOffset),
        )
        .filter((candidate): candidate is SquareCellState => candidate != null);
    },
    [getCell, getCellAt],
  );

  const getDistance = useCallback(
    (
      fromCellId: string,
      toCellId: string,
      metric: DistanceMetric = "manhattan",
    ) => {
      const fromCell = getCell(fromCellId);
      const toCell = getCell(toCellId);
      if (!fromCell || !toCell) {
        return Number.POSITIVE_INFINITY;
      }
      const rowDistance = Math.abs(fromCell.row - toCell.row);
      const colDistance = Math.abs(fromCell.col - toCell.col);
      return metric === "chebyshev"
        ? Math.max(rowDistance, colDistance)
        : rowDistance + colDistance;
    },
    [getCell],
  );

  return {
    ...topology,
    getCell,
    getCellAt,
    getNeighbors,
    getDistance,
  };
}
