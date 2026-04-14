/**
 * Plugin State Types
 *
 * These types define the state structure that the host app sends to the plugin
 * via state-sync messages. The plugin uses these types to access pre-computed
 * game state without needing to parse raw SSE messages.
 */

import type { PlayerId } from "../manifest-contract.js";

type ActionName = string;

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
  activePlayers: string[];
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

export interface GameplayPromptOption {
  id: string;
  label: string;
}

export interface GameplayPromptInstance<
  PromptType extends string = string,
  PromptInstance extends string = string,
> {
  id: PromptInstance;
  promptId: PromptType;
  to: string;
  title?: string;
  payload?: string;
  options: GameplayPromptOption[];
}

export type GameplayWindowClosePolicy =
  | "allPassInSequence"
  | "allResponded"
  | "firstValidAction"
  | "manual";

export interface GameplayWindowInstance<
  WindowType extends string = string,
  WindowInstance extends string = string,
> {
  id: WindowInstance;
  windowId: WindowType;
  closePolicy: GameplayWindowClosePolicy;
  addressedTo: string[];
  payload?: string;
}

export interface ActionParameterDefinition {
  name: string;
  type: string;
  required?: boolean;
  array?: boolean;
  description?: string;
  [key: string]: unknown;
}

export interface ActionDefinition<ActionType extends string = string> {
  actionType: ActionType;
  displayName: string;
  description?: string;
  parameters: ActionParameterDefinition[];
  errorCodes?: string[];
}

export interface GameplaySnapshot<
  PhaseType extends string = string,
  ActionType extends string = string,
  PromptType extends string = string,
  WindowType extends string = string,
  PromptInstance extends string = string,
  WindowInstance extends string = string,
> {
  currentPhase: PhaseType | null;
  availableActions: ReadonlyArray<ActionDefinition<ActionType>>;
  prompts: ReadonlyArray<GameplayPromptInstance<PromptType, PromptInstance>>;
  windows: ReadonlyArray<GameplayWindowInstance<WindowType, WindowInstance>>;
}

/**
 * The complete state snapshot sent to the plugin via state-sync.
 * This is the single source of truth for all reducer-native plugin state.
 */
export interface PluginStateSnapshot<
  View = unknown,
  PhaseType extends string = string,
  ActionType extends string = string,
  PromptType extends string = string,
  WindowType extends string = string,
  PromptInstance extends string = string,
  WindowInstance extends string = string,
> {
  /** Projected seat-specific reducer-native view for the controlling player */
  view: View | null;
  /** Gameplay transport state that sits alongside the projected reducer view */
  gameplay: GameplaySnapshot<
    PhaseType,
    ActionType,
    PromptType,
    WindowType,
    PromptInstance,
    WindowInstance
  >;
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
