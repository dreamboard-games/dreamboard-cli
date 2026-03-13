/**
 * useSquareBoard hook - Access square grid board state from game state
 *
 * Provides square board data (cells, pieces) for rendering grid-based games
 * like Chess, Checkers, Go, Tic-Tac-Toe, etc.
 *
 * @example Basic usage
 * ```tsx
 * const { cells, pieces, rows, cols, getCell, getPieceAt } = useSquareBoard('chess-board');
 *
 * return (
 *   <SquareGrid
 *     rows={rows}
 *     cols={cols}
 *     renderCell={(row, col) => {
 *       const cell = getCell(row, col);
 *       const piece = getPieceAt(row, col);
 *       return <ChessCell cell={cell} piece={piece} />;
 *     }}
 *   />
 * );
 * ```
 *
 * @example With piece movement validation
 * ```tsx
 * const { getPieceAt, getPiecesByOwner } = useSquareBoard('board');
 *
 * // Get all pieces for current player
 * const myPieces = getPiecesByOwner(currentPlayerId);
 *
 * // Check if destination is occupied
 * const targetPiece = getPieceAt(targetRow, targetCol);
 * if (!targetPiece || targetPiece.owner !== currentPlayerId) {
 *   // Valid move target
 * }
 * ```
 */

import { useMemo, useCallback } from "react";
import { useGameState } from "./useGameState.js";
import type {
  SquareBoardState,
  SquareCellState,
  SquarePieceState,
} from "../types/player-state.js";
import {
  PieceId,
  PlayerId,
  PieceTypeId,
  TileTypeId,
  BoardId,
} from "@dreamboard/manifest";

// ============================================================================
// Types
// ============================================================================

export interface UseSquareBoardReturn {
  /** The raw board state */
  board: SquareBoardState;
  /** Number of rows in the grid */
  rows: number;
  /** Number of columns in the grid */
  cols: number;
  /** All cells with non-default state */
  cells: SquareCellState[];
  /** All pieces on the board */
  pieces: SquarePieceState[];

  // Cell queries
  /** Get cell state at a position (returns undefined for cells with default state) */
  getCell: (row: number, col: number) => SquareCellState | undefined;
  /** Get all cells owned by a player */
  getCellsByOwner: (ownerId: PlayerId) => SquareCellState[];
  /** Get all cells of a specific type */
  getCellsByType: (typeId: TileTypeId) => SquareCellState[];

  // Piece queries
  /** Get a piece by ID */
  getPiece: (pieceId: PieceId) => SquarePieceState | undefined;
  /** Get piece at a specific position (if any) */
  getPieceAt: (row: number, col: number) => SquarePieceState | undefined;
  /** Get all pieces owned by a player */
  getPiecesByOwner: (ownerId: PlayerId) => SquarePieceState[];
  /** Get all pieces of a specific type */
  getPiecesByType: (typeId: PieceTypeId) => SquarePieceState[];

  // Utilities
  /** Check if a cell position is valid */
  isValidPosition: (row: number, col: number) => boolean;
  /** Check if a cell is occupied by a piece */
  isOccupied: (row: number, col: number) => boolean;
  /** Get all adjacent positions (including diagonals) */
  getAdjacentPositions: (
    row: number,
    col: number,
  ) => Array<{ row: number; col: number }>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to access square grid board state from the game state.
 *
 * @param boardId - The ID of the square board to access
 * @returns Square board state and query utilities
 * @throws Error if the board is not found in game state
 */
export function useSquareBoard(boardId: BoardId): UseSquareBoardReturn {
  const gameState = useGameState();

  const board = gameState.boards.square[boardId];
  if (!board) {
    throw new Error(
      `useSquareBoard: Square board "${boardId}" not found in game state. ` +
        `Available boards: ${Object.keys(gameState.boards.square).join(", ") || "none"}`,
    );
  }

  // Create lookup maps
  const cellByPos = useMemo((): Map<string, SquareCellState> => {
    return new Map(board.cells.map((c) => [`${c.row},${c.col}`, c]));
  }, [board.cells]);

  const pieceById = useMemo((): Map<PieceId, SquarePieceState> => {
    return new Map(board.pieces.map((p) => [p.id, p]));
  }, [board.pieces]);

  const pieceByPos = useMemo((): Map<string, SquarePieceState> => {
    return new Map(board.pieces.map((p) => [`${p.row},${p.col}`, p]));
  }, [board.pieces]);

  // Cell queries
  const getCell = useCallback(
    (row: number, col: number) => cellByPos.get(`${row},${col}`),
    [cellByPos],
  );

  const getCellsByOwner = useCallback(
    (ownerId: PlayerId) => board.cells.filter((c) => c.owner === ownerId),
    [board.cells],
  );

  const getCellsByType = useCallback(
    (typeId: TileTypeId) => board.cells.filter((c) => c.typeId === typeId),
    [board.cells],
  );

  // Piece queries
  const getPiece = useCallback(
    (pieceId: PieceId) => pieceById.get(pieceId),
    [pieceById],
  );

  const getPieceAt = useCallback(
    (row: number, col: number) => pieceByPos.get(`${row},${col}`),
    [pieceByPos],
  );

  const getPiecesByOwner = useCallback(
    (ownerId: PlayerId) => board.pieces.filter((p) => p.owner === ownerId),
    [board.pieces],
  );

  const getPiecesByType = useCallback(
    (typeId: PieceTypeId) => board.pieces.filter((p) => p.typeId === typeId),
    [board.pieces],
  );

  // Utilities
  const isValidPosition = useCallback(
    (row: number, col: number) =>
      row >= 0 && row < board.rows && col >= 0 && col < board.cols,
    [board.rows, board.cols],
  );

  const isOccupied = useCallback(
    (row: number, col: number) => pieceByPos.has(`${row},${col}`),
    [pieceByPos],
  );

  const getAdjacentPositions = useCallback(
    (row: number, col: number) => {
      const positions: Array<{ row: number; col: number }> = [];
      const offsets: Array<[number, number]> = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ];

      for (const [dr, dc] of offsets) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (isValidPosition(newRow, newCol)) {
          positions.push({ row: newRow, col: newCol });
        }
      }

      return positions;
    },
    [isValidPosition],
  );

  return {
    board,
    rows: board.rows,
    cols: board.cols,
    cells: board.cells,
    pieces: board.pieces,
    getCell,
    getCellsByOwner,
    getCellsByType,
    getPiece,
    getPieceAt,
    getPiecesByOwner,
    getPiecesByType,
    isValidPosition,
    isOccupied,
    getAdjacentPositions,
  };
}

/**
 * Hook to safely check if a square board exists in game state.
 *
 * @param boardId - The ID of the square board to check
 * @returns The board if it exists, undefined otherwise
 */
export function useSquareBoardOptional(
  boardId: BoardId,
): SquareBoardState | undefined {
  const gameState = useGameState();
  return gameState.boards.square[boardId];
}

/**
 * Hook to get all available square board IDs.
 *
 * @returns Array of square board IDs
 */
export function useSquareBoardIds(): BoardId[] {
  const gameState = useGameState();
  return Object.keys(gameState.boards.square) as BoardId[];
}
