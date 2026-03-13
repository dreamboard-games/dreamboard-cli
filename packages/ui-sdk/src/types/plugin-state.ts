/**
 * Plugin State Types
 *
 * These types define the state structure that the host app sends to the plugin
 * via state-sync messages. The plugin uses these types to access pre-computed
 * game state without needing to parse raw SSE messages.
 */

export interface SeatAssignment {
  playerId: PlayerId;
  controllerUserId?: string;
  displayName: string;
  playerColor?: string;
  isHost?: boolean;
}

export interface HistoryEntrySummary {
  id: string;
  version: number;
  timestamp: string;
  description: string;
  playerId?: PlayerId;
  actionType?: ActionName;
  isCurrent: boolean;
}

// Re-export the type-safe GameState from player-state.ts
// This uses manifest-derived types (PlayerId, CardId, StateName, etc.)
export type { GameState } from "./player-state.js";

// ============================================================================
// Lobby State (from LOBBY_UPDATE messages)
// ============================================================================

/**
 * Lobby state for the pre-game lobby phase
 */
export interface LobbyState {
  /** Current seat assignments in the lobby */
  seats: SeatAssignment[];
  /** Whether the game can be started (all seats filled) */
  canStart: boolean;
  /** User ID of the session host */
  hostUserId: string;
}

// ============================================================================
// Notifications (from YOUR_TURN, ACTION_REJECTED, etc.)
// ============================================================================

/**
 * Notification types that get queued for the plugin
 */
export type NotificationType =
  | "YOUR_TURN"
  | "ACTION_EXECUTED"
  | "ACTION_REJECTED"
  | "TURN_CHANGED"
  | "STATE_CHANGED"
  | "GAME_ENDED"
  | "ERROR";

/**
 * YOUR_TURN notification payload
 */
export interface YourTurnPayload {
  type: "YOUR_TURN";
}

/**
 * ACTION_EXECUTED notification payload
 */
export interface ActionExecutedPayload {
  type: "ACTION_EXECUTED";
  playerId: string;
  actionType: string;
}

/**
 * ACTION_REJECTED notification payload
 */
export interface ActionRejectedPayload {
  type: "ACTION_REJECTED";
  reason: string;
  targetPlayer?: string;
}

/**
 * STATE_CHANGED notification payload
 */
export interface StateChangedPayload {
  type: "STATE_CHANGED";
  newState: string;
}

/**
 * TURN_CHANGED notification payload
 */
export interface TurnChangedPayload {
  type: "TURN_CHANGED";
  previousPlayers: string[];
  currentPlayers: string[];
}

/**
 * GAME_ENDED notification payload
 */
export interface GameEndedPayload {
  type: "GAME_ENDED";
  winner?: string;
  finalScores: Record<string, number>;
  reason: string;
}

/**
 * ERROR notification payload
 */
export interface ErrorPayload {
  type: "ERROR";
  message: string;
  code?: string;
}

/**
 * Union of all notification payloads
 */
export type NotificationPayload =
  | YourTurnPayload
  | ActionExecutedPayload
  | ActionRejectedPayload
  | TurnChangedPayload
  | StateChangedPayload
  | GameEndedPayload
  | ErrorPayload;

/**
 * Notification entry in the queue.
 * Notifications are ephemeral events that the plugin can consume and mark as read.
 */
export interface Notification {
  /** Unique notification ID */
  id: string;
  /** Type of notification */
  type: NotificationType;
  /** Type-specific payload */
  payload: NotificationPayload;
  /** Timestamp when the notification was created */
  timestamp: number;
  /** Whether the plugin has marked this notification as read */
  read: boolean;
}

// ============================================================================
// Session State
// ============================================================================

/**
 * Session state that gets synchronized to the plugin.
 * This includes player switching info that was previously sent via
 * separate player-switched messages.
 */
export interface PluginSessionState {
  /** Current session ID */
  sessionId: string | null;
  /** Player IDs that this user can control (immutable after game starts) */
  controllablePlayerIds: string[];
  /** The currently selected player ID that the user is controlling */
  controllingPlayerId: string | null;
  /** User ID of the controller */
  userId: string | null;
}

// ============================================================================
// History State (host only)
// ============================================================================

// HistoryEntrySummary is re-exported from @dreamboard/api-client (see imports above)

/**
 * History state for the host's history navigator.
 * Only sent to the host user.
 */
export interface HistoryState {
  /** List of history entries (newest first when displayed) */
  entries: HistoryEntrySummary[];
  /** Index of the current state in the history */
  currentIndex: number;
  /** Whether there are earlier states to restore to */
  canGoBack: boolean;
  /** Whether there are later states to restore to */
  canGoForward: boolean;
}

// ============================================================================
// Plugin State Snapshot
// ============================================================================

// Import GameState for use in PluginStateSnapshot
import type { GameState } from "./player-state.js";
import { ActionName, PlayerId } from "@dreamboard/manifest";

/**
 * The complete state snapshot sent to the plugin via state-sync.
 * This is the single source of truth for all plugin state.
 *
 * Note: GameState uses type-safe manifest types (PlayerId, CardId, StateName, etc.)
 * which are generated per-game and provide compile-time type safety.
 */
export interface PluginStateSnapshot {
  /** Game state (from STATE_UPDATE/GAME_STARTED) - null if in lobby phase */
  game: GameState | null;
  /** Lobby state (from LOBBY_UPDATE) - null if game has started */
  lobby: LobbyState | null;
  /** Notification queue (from YOUR_TURN, ACTION_REJECTED, etc.) */
  notifications: Notification[];
  /** Session state (includes controllingPlayerId for player switching) */
  session: PluginSessionState;
  /** History state for host navigation (null if not host or history disabled) */
  history: HistoryState | null;
  /** Monotonic sync ID for acknowledgment tracking */
  syncId: number;
}

// ============================================================================
// State Sync Messages
// ============================================================================

/**
 * Message sent from host to plugin to sync state
 */
export interface StateSyncMessage {
  type: "state-sync";
  /** Sync ID for acknowledgment tracking */
  syncId: number;
  /** Complete state snapshot */
  state: PluginStateSnapshot;
}

/**
 * Message sent from plugin to host to acknowledge state receipt
 */
export interface StateAckMessage {
  type: "state-ack";
  /** Echoes back the syncId that was received */
  syncId: number;
}
