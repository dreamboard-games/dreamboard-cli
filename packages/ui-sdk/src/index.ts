/**
 * @dreamboard/ui-sdk
 *
 * UI SDK for building dreamboard game plugins.
 * This package provides types, hooks, utilities, and UI components for
 * LLM-generated UI code running in sandboxed iframes.
 */

// Core types
export type {
  RuntimeAPI,
  PluginSessionState,
  ValidationResult,
} from "./types/runtime-api.js";

export type { PluginContext } from "./types/plugin-context.js";

// Plugin state types (new state-sync architecture)
export type {
  GameState,
  LobbyState,
  Notification,
  NotificationType,
  NotificationPayload,
  YourTurnPayload,
  ActionRejectedPayload,
  TurnChangedPayload,
  GameEndedPayload,
  ErrorPayload,
  PluginStateSnapshot,
  StateSyncMessage,
  StateAckMessage,
} from "./types/plugin-state.js";

// Board state types (for rendering game boards)
export type {
  CardInfo,
  PublicHandsByPlayerId,
  PublicHandsByHandId,
  BoardStates,
  DiceStates,
  HexBoardState,
  HexTileState,
  HexEdgeState,
  HexVertexState,
  NetworkBoardState,
  NetworkNodeState,
  NetworkEdgeState,
  NetworkPieceState,
  SquareBoardState,
  SquareCellState,
  SquarePieceState,
  TrackBoardState,
  TrackSpaceState,
  TrackPieceState,
  DieState,
} from "./types/player-state.js";

// Plugin state context (new state-sync architecture)
export {
  PluginStateProvider,
  usePluginStateSnapshot,
  usePluginState,
  usePluginActions,
} from "./context/PluginStateContext.js";
export type { PluginStateProviderProps } from "./context/PluginStateContext.js";
