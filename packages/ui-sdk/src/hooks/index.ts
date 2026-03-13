/**
 * React hooks for plugin development.
 * These hooks provide access to game state and runtime functionality.
 */

export { useGameState } from "./useGameState.js";
export { useGameSelector } from "./useGameSelector.js";
export { useUIArgs } from "./useUIArgs.js";
export { useCard, useCards } from "./useCard.js";
export { useMyHand } from "./useMyHand.js";
export { usePublicHands } from "./usePublicHands.js";
export { useLobby } from "./useLobby.js";
export { useAction, ValidationError } from "./useAction.js";
export {
  useGameNotifications,
  useNotifications,
  type GameNotificationHandlers,
} from "./useGameNotifications.js";
export { useMe } from "./useMe.js";
export { usePlayerInfo } from "./usePlayerInfo.js";
export {
  useMyResources,
  usePlayerResources,
  useAllPlayerResources,
  type PlayerResources,
} from "./useMyResources.js";
export {
  usePluginRuntime,
  type UsePluginRuntimeOptions,
  type UsePluginRuntimeResult,
} from "./usePluginRuntime.js";
export { useHistory, useIsHost } from "./useHistory.js";
export { useHandLayout } from "./useHandLayout.js";
export { useIsMobile } from "./useIsMobile.js";
export {
  useInteractionMode,
  type InteractionModeResult,
} from "./useInteractionMode.js";

export type { LobbyState } from "./useLobby.js";
export type { Player } from "./useMe.js";
export type { HistoryState, HistoryEntrySummary } from "./useHistory.js";
export type {
  UseHandLayoutOptions,
  UseHandLayoutReturn,
  CardPositionProps,
  CardSize,
  HandLayout,
} from "./useHandLayout.js";
// Board primitive hooks (SDK v0.2.0+)
// These utility hooks work with any data you provide
export { useNetworkGraph, type NetworkGraphApi } from "./useNetworkGraph.js";
export {
  useHexGrid,
  type HexTileData,
  type UseHexGridReturn,
} from "./useHexGrid.js";
export {
  useSquareGrid,
  type GridPieceData,
  type CellData,
  type DistanceType,
  type NeighborType,
  type UseSquareGridOptions,
  type UseSquareGridReturn,
} from "./useSquareGrid.js";
export { useZoneMap, type UseZoneMapReturn } from "./useZoneMap.js";
export { useSlotSystem, type SlotSystemApi } from "./useSlotSystem.js";

// Board state hooks (SDK v0.3.0+)
// These hooks fetch board data from game state and provide query utilities
export {
  useHexBoard,
  useHexBoardOptional,
  useHexBoardIds,
  normalizeEdgeId,
  normalizeVertexId,
  type UseHexBoardReturn,
} from "./useHexBoard.js";
export {
  useNetworkBoard,
  useNetworkBoardOptional,
  useNetworkBoardIds,
  normalizeNetworkEdgeId,
  type UseNetworkBoardReturn,
} from "./useNetworkBoard.js";
export {
  useSquareBoard,
  useSquareBoardOptional,
  useSquareBoardIds,
  type UseSquareBoardReturn,
} from "./useSquareBoard.js";
export {
  useTrackBoard,
  useTrackBoardIds,
  type UseTrackBoardReturn,
} from "./useTrackBoard.js";

// Dice hooks (SDK v0.4.0+)
export {
  useDie,
  useDice,
  useAllDice,
  useDiceIds,
  type UseDieReturn,
  type UseDiceReturn,
  type UseAllDiceReturn,
} from "./useDice.js";
