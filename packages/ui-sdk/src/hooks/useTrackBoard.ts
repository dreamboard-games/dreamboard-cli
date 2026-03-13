/**
 * useTrackBoard hook - Access track/path board state from game state
 *
 * Provides track board data (spaces, pieces) for rendering path-based games
 * like Monopoly, racing games, Candyland, etc.
 *
 * @example Basic usage
 * ```tsx
 * const { spaces, pieces, getSpace, getNextSpaces } = useTrackBoard('monopoly-board');
 *
 * return (
 *   <TrackBoard
 *     spaces={spaces}
 *     renderSpace={(space) => {
 *       const piecesOnSpace = getPiecesOnSpace(space.id);
 *       return <BoardSpace space={space} pieces={piecesOnSpace} />;
 *     }}
 *   />
 * );
 * ```
 *
 * @example With movement calculation
 * ```tsx
 * const { getSpace, getNextSpaces, getSpaceByIndex } = useTrackBoard('race-track');
 *
 * // Calculate destination after rolling dice
 * const currentSpace = getSpace(currentSpaceId);
 * const targetIndex = (currentSpace.index + diceRoll) % totalSpaces;
 * const targetSpace = getSpaceByIndex(targetIndex);
 * ```
 */

import { useMemo, useCallback } from "react";
import { useGameState } from "./useGameState.js";
import type {
  TrackSpaceState,
  TrackPieceState,
  TrackBoardState,
} from "../types/player-state.js";
import {
  BoardId,
  PieceId,
  PieceTypeId,
  PlayerId,
  SpaceId,
  SpaceTypeId,
} from "@dreamboard/manifest";

// ============================================================================
// Types
// ============================================================================

export interface UseTrackBoardReturn {
  /** The raw board state */
  board: TrackBoardState;
  /** All spaces on the track */
  spaces: TrackSpaceState[];
  /** All pieces on the board */
  pieces: TrackPieceState[];

  // Space queries
  /** Get a space by ID */
  getSpace: (spaceId: SpaceId) => TrackSpaceState | undefined;
  /** Get a space by its index in the track */
  getSpaceByIndex: (index: number) => TrackSpaceState | undefined;
  /** Get all spaces owned by a player */
  getSpacesByOwner: (ownerId: PlayerId) => TrackSpaceState[];
  /** Get all spaces of a specific type */
  getSpacesByType: (typeId: SpaceTypeId) => TrackSpaceState[];
  /** Get the next possible spaces from a given space (for branching tracks) */
  getNextSpaces: (spaceId: SpaceId) => TrackSpaceState[];
  /** Get spaces sorted by index */
  getSpacesInOrder: () => TrackSpaceState[];

  // Piece queries
  /** Get a piece by ID */
  getPiece: (pieceId: PieceId) => TrackPieceState | undefined;
  /** Get all pieces owned by a player */
  getPiecesByOwner: (ownerId: PlayerId) => TrackPieceState[];
  /** Get all pieces of a specific type */
  getPiecesByType: (typeId: PieceTypeId) => TrackPieceState[];
  /** Get all pieces on a specific space */
  getPiecesOnSpace: (spaceId: SpaceId) => TrackPieceState[];

  // Utilities
  /** Get distance between two spaces (by index) */
  getDistance: (spaceId1: SpaceId, spaceId2: SpaceId) => number;
  /** Calculate the space after moving a certain number of steps */
  getSpaceAfterSteps: (
    fromSpaceId: SpaceId,
    steps: number,
  ) => TrackSpaceState | undefined;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to access track board state from the game state.
 *
 * @param boardId - The ID of the track board to access
 * @returns Track board state and query utilities
 * @throws Error if the board is not found in game state
 */
export function useTrackBoard(boardId: BoardId): UseTrackBoardReturn {
  const gameState = useGameState();

  const board = gameState.boards.track[boardId];
  if (!board) {
    throw new Error(
      `useTrackBoard: Track board "${boardId}" not found in game state. ` +
        `Available boards: ${Object.keys(gameState.boards.track).join(", ") || "none"}`,
    );
  }

  // Create lookup maps
  const spaceById = useMemo((): Map<SpaceId, TrackSpaceState> => {
    return new Map(board.spaces.map((s) => [s.id, s]));
  }, [board.spaces]);

  const spaceByIndex = useMemo((): Map<number, TrackSpaceState> => {
    return new Map(board.spaces.map((s) => [s.index, s]));
  }, [board.spaces]);

  const pieceById = useMemo((): Map<PieceId, TrackPieceState> => {
    return new Map(board.pieces.map((p) => [p.id, p]));
  }, [board.pieces]);

  const sortedSpaces = useMemo((): TrackSpaceState[] => {
    return [...board.spaces].sort((a, b) => a.index - b.index);
  }, [board.spaces]);

  const maxIndex = useMemo((): number => {
    return Math.max(...board.spaces.map((s) => s.index), 0);
  }, [board.spaces]);

  // Space queries
  const getSpace = useCallback(
    (spaceId: SpaceId) => spaceById.get(spaceId),
    [spaceById],
  );

  const getSpaceByIndex = useCallback(
    (index: number) => spaceByIndex.get(index),
    [spaceByIndex],
  );

  const getSpacesByOwner = useCallback(
    (ownerId: PlayerId) => board.spaces.filter((s) => s.owner === ownerId),
    [board.spaces],
  );

  const getSpacesByType = useCallback(
    (typeId: SpaceTypeId) => board.spaces.filter((s) => s.typeId === typeId),
    [board.spaces],
  );

  const getNextSpaces = useCallback(
    (spaceId: SpaceId): TrackSpaceState[] => {
      const space = spaceById.get(spaceId);
      if (!space) return [];

      // If explicit next spaces defined, use those (for branching paths)
      if (space.nextSpaces && space.nextSpaces.length > 0) {
        return space.nextSpaces
          .map((id: SpaceId) => spaceById.get(id))
          .filter((s): s is TrackSpaceState => s !== undefined);
      }

      // Otherwise, return the next space by index (circular track)
      const nextIndex = (space.index + 1) % (maxIndex + 1);
      const nextSpace = spaceByIndex.get(nextIndex);
      return nextSpace ? [nextSpace] : [];
    },
    [spaceById, spaceByIndex, maxIndex],
  );

  const getSpacesInOrder = useCallback(() => sortedSpaces, [sortedSpaces]);

  // Piece queries
  const getPiece = useCallback(
    (pieceId: PieceId) => pieceById.get(pieceId),
    [pieceById],
  );

  const getPiecesByOwner = useCallback(
    (ownerId: PlayerId) => board.pieces.filter((p) => p.owner === ownerId),
    [board.pieces],
  );

  const getPiecesByType = useCallback(
    (typeId: PieceTypeId) => board.pieces.filter((p) => p.typeId === typeId),
    [board.pieces],
  );

  const getPiecesOnSpace = useCallback(
    (spaceId: SpaceId) => board.pieces.filter((p) => p.spaceId === spaceId),
    [board.pieces],
  );

  // Utilities
  const getDistance = useCallback(
    (spaceId1: SpaceId, spaceId2: SpaceId): number => {
      const space1 = spaceById.get(spaceId1);
      const space2 = spaceById.get(spaceId2);
      if (!space1 || !space2) return Infinity;

      // For circular tracks, calculate forward distance
      const totalSpaces = maxIndex + 1;
      const forwardDistance =
        (space2.index - space1.index + totalSpaces) % totalSpaces;
      return forwardDistance;
    },
    [spaceById, maxIndex],
  );

  const getSpaceAfterSteps = useCallback(
    (fromSpaceId: SpaceId, steps: number): TrackSpaceState | undefined => {
      const fromSpace = spaceById.get(fromSpaceId);
      if (!fromSpace) return undefined;

      // For simple circular tracks
      const totalSpaces = maxIndex + 1;
      const targetIndex = (fromSpace.index + steps) % totalSpaces;
      return spaceByIndex.get(targetIndex);
    },
    [spaceById, spaceByIndex, maxIndex],
  );

  return {
    board,
    spaces: board.spaces,
    pieces: board.pieces,
    getSpace,
    getSpaceByIndex,
    getSpacesByOwner,
    getSpacesByType,
    getNextSpaces,
    getSpacesInOrder,
    getPiece,
    getPiecesByOwner,
    getPiecesByType,
    getPiecesOnSpace,
    getDistance,
    getSpaceAfterSteps,
  };
}

/**
 * Hook to get all available track board IDs.
 *
 * @returns Array of track board IDs
 */
export function useTrackBoardIds(): BoardId[] {
  const gameState = useGameState();
  return Object.keys(gameState.boards.track) as BoardId[];
}
