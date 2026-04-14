import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";
import type { StoreApi } from "zustand/vanilla";
import type {
  SeatAssignment,
  ActionDefinition,
  GameMessage,
  HistoryEntrySummary,
  PlayerAvailableActions,
  GameplayPromptInstance,
  GameplayWindowInstance,
} from "@dreamboard/api-client";
import type { PluginStateSnapshot as UiSdkPluginStateSnapshot } from "@dreamboard/ui-sdk/reducer";
import type { LoggerLike } from "./logger.js";
import { consoleLogger } from "./logger.js";
import type { SSEManager } from "./sse-manager.js";

type LayoutConfig = unknown;
type CardDisplayConfig = unknown;

export type SessionPhase =
  | "idle"
  | "loading"
  | "lobby"
  | "gameplay"
  | "ended"
  | "error";

export interface SessionIdentity {
  sessionId: string;
  shortCode: string;
  gameId: string;
}

export interface LobbyState {
  seats: SeatAssignment[];
  canStart: boolean;
  hostUserId: string;
}

export interface GameplayState {
  version: number;
  activePlayers: string[];
  controllablePlayerIds: string[];
  controllingPlayerId: string;
  currentPhase: string | null;
  seatViewsByPlayerId: Record<string, PluginStateSnapshot["view"]>;
  availableActions: PlayerAvailableActions[];
  prompts: GameplayPromptInstance[];
  windows: GameplayWindowInstance[];
  layout?: LayoutConfig | null;
  cardDisplayConfigs?: CardDisplayConfig[] | null;
}

export interface HistoryState {
  entries: HistoryEntrySummary[];
  currentIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
}

export type NotificationType =
  | "YOUR_TURN"
  | "ACTION_EXECUTED"
  | "ACTION_REJECTED"
  | "TURN_CHANGED"
  | "STATE_CHANGED"
  | "GAME_ENDED"
  | "ERROR";

export type NotificationPayload =
  | { type: "YOUR_TURN"; activePlayers: string[] }
  | { type: "ACTION_EXECUTED"; playerId: string; actionType: string }
  | { type: "ACTION_REJECTED"; reason: string; targetPlayer?: string }
  | {
      type: "TURN_CHANGED";
      previousPlayers: string[];
      currentPlayers: string[];
    }
  | { type: "STATE_CHANGED"; newState: string }
  | {
      type: "GAME_ENDED";
      winner?: string;
      finalScores: Record<string, number>;
      reason: string;
    }
  | { type: "ERROR"; message: string; code?: string };

export interface Notification {
  id: string;
  type: NotificationType;
  payload: NotificationPayload;
  timestamp: number;
  read: boolean;
}

export type HostFeedbackType = "ACTION_REJECTED" | "YOUR_TURN";

export type HostFeedbackPayload =
  | {
      type: "ACTION_REJECTED";
      reason: string;
      targetPlayer?: string;
    }
  | {
      type: "YOUR_TURN";
      activePlayers: string[];
    };

export interface HostFeedback {
  id: string;
  type: HostFeedbackType;
  payload: HostFeedbackPayload;
  timestamp: number;
}

export interface SSEEventEntry {
  id: number;
  eventType: string;
  data: GameMessage;
  timestamp: string;
}

export type PluginStateSnapshot = UiSdkPluginStateSnapshot;

const DEFAULT_LOBBY: LobbyState = {
  seats: [],
  canStart: false,
  hostUserId: "",
};

const DEFAULT_GAMEPLAY: GameplayState = {
  version: 0,
  activePlayers: [],
  controllablePlayerIds: [],
  controllingPlayerId: "",
  currentPhase: null,
  seatViewsByPlayerId: {},
  availableActions: [],
  prompts: [],
  windows: [],
  layout: null,
  cardDisplayConfigs: null,
};

export interface UnifiedSessionState {
  connectionError: string | null;
  phase: SessionPhase;
  error: string | null;
  identity: SessionIdentity | null;
  lobby: LobbyState;
  gameplay: GameplayState;
  history: HistoryState | null;
  notifications: Notification[];
  hostFeedback: HostFeedback[];
  sseEvents: SSEEventEntry[];
  maxEvents: number;
  syncId: number;
  lastSyncTimestamp: number | null;
  lastAckTimestamp: number | null;
  isConnected: boolean;
  userId: string | null;
  _sseManager: SSEManagerLike | null;
  _unsubscribeSSE: (() => void) | null;
}

export interface UnifiedSessionActions {
  connect: (
    sessionId: string,
    userId?: string | null,
    options?: { source?: string },
  ) => void;
  clearConnectionError: () => void;
  enqueueActionRejected: (reason: string, targetPlayer?: string) => void;
  disconnect: () => void;
  setLoading: () => void;
  setLobby: (identity: SessionIdentity, lobby: LobbyState) => void;
  setGameplay: (
    identity: SessionIdentity,
    gameplay: GameplayState,
    preservedLobby?: LobbyState,
  ) => void;
  setEnded: (identity: SessionIdentity) => void;
  setError: (error: string) => void;
  updateLobbyState: (
    seats: SeatAssignment[],
    canStart: boolean,
    hostUserId: string,
  ) => void;
  switchPlayer: (playerId: string) => void;
  startGame: (gameplay: GameplayState) => void;
  getPluginSnapshot: () => PluginStateSnapshot;
  onStateAck: (syncId: number) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  dismissHostFeedback: (id: string) => void;
  clearHostFeedback: () => void;
  clearSSEEvents: () => void;
  reset: () => void;
}

export type UnifiedSessionStore = UnifiedSessionState & UnifiedSessionActions;

export interface SSEManagerLike {
  connect: (
    sessionId: string,
    options?: { source?: string },
  ) => Promise<void> | void;
  disconnect: () => void;
  on: SSEManager["on"];
  onAnyMessage: SSEManager["onAnyMessage"];
}

export interface CreateUnifiedSessionStoreOptions {
  createSseManager: () => SSEManagerLike;
  logger?: LoggerLike;
  fallbackToAllSeatsWhenUserIdMissing?: boolean;
}

let sseEventIdCounter = 0;
let notificationIdCounter = 0;

function deriveControlledPlayerIdsFromSeats(
  seats: SeatAssignment[],
  userId: string | null,
  fallbackToAllSeatsWhenUserIdMissing = false,
): string[] {
  if (!userId) {
    return fallbackToAllSeatsWhenUserIdMissing
      ? seats.map((seat) => seat.playerId)
      : [];
  }

  return seats
    .filter((seat) => seat.controllerUserId === userId)
    .map((seat) => seat.playerId);
}

function resolveControllablePlayerIds(
  preferredPlayerIds: string[] | null | undefined,
  seats: SeatAssignment[],
  userId: string | null,
  fallbackToAllSeatsWhenUserIdMissing = false,
): string[] {
  if (preferredPlayerIds && preferredPlayerIds.length > 0) {
    return preferredPlayerIds;
  }

  return deriveControlledPlayerIdsFromSeats(
    seats,
    userId,
    fallbackToAllSeatsWhenUserIdMissing,
  );
}

function generateNotificationId(): string {
  return `notif-${++notificationIdCounter}-${Date.now()}`;
}

function safeJsonParseValue(jsonString: string): unknown {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

function transformSeatViews(
  rawSeatViewsByPlayerId: Record<string, string> | null | undefined,
): Record<string, PluginStateSnapshot["view"]> {
  if (!rawSeatViewsByPlayerId) return {};
  const result: Record<string, PluginStateSnapshot["view"]> = {};
  for (const [playerId, serializedView] of Object.entries(
    rawSeatViewsByPlayerId,
  )) {
    result[playerId] = serializedView
      ? (safeJsonParseValue(serializedView) as PluginStateSnapshot["view"])
      : null;
  }
  return result;
}

function normalizeGameplayState(
  gameplay: Partial<GameplayState>,
): GameplayState {
  return {
    ...DEFAULT_GAMEPLAY,
    ...gameplay,
    seatViewsByPlayerId: gameplay.seatViewsByPlayerId ?? {},
    availableActions: gameplay.availableActions ?? [],
    prompts: gameplay.prompts ?? [],
    windows: gameplay.windows ?? [],
  };
}

function createActionRejectedArtifacts(
  reason: string,
  targetPlayer?: string,
): {
  notification: Notification;
  hostFeedback: HostFeedback;
} {
  return {
    notification: {
      id: generateNotificationId(),
      type: "ACTION_REJECTED",
      payload: {
        type: "ACTION_REJECTED",
        reason,
        targetPlayer,
      },
      timestamp: Date.now(),
      read: false,
    },
    hostFeedback: {
      id: generateNotificationId(),
      type: "ACTION_REJECTED",
      payload: {
        type: "ACTION_REJECTED",
        reason,
        targetPlayer,
      },
      timestamp: Date.now(),
    },
  };
}

function resolveSessionControl(
  state: UnifiedSessionState,
  fallbackToAllSeatsWhenUserIdMissing: boolean,
): {
  controllablePlayerIds: string[];
  controllingPlayerId: string | null;
} {
  const controllablePlayerIds = resolveControllablePlayerIds(
    state.gameplay.controllablePlayerIds,
    state.lobby.seats,
    state.userId,
    fallbackToAllSeatsWhenUserIdMissing,
  );

  const controllingPlayerId =
    state.gameplay.controllingPlayerId &&
    controllablePlayerIds.includes(state.gameplay.controllingPlayerId)
      ? state.gameplay.controllingPlayerId
      : (controllablePlayerIds[0] ?? null);

  return {
    controllablePlayerIds,
    controllingPlayerId,
  };
}

function resolveControllingPlayerId(
  previousControllingPlayerId: string,
  controllablePlayerIds: string[],
): string {
  if (
    previousControllingPlayerId &&
    controllablePlayerIds.includes(previousControllingPlayerId)
  ) {
    return previousControllingPlayerId;
  }

  return controllablePlayerIds[0] ?? "";
}

function describeSseError(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.message.includes("429") ||
      error.message.includes("400 Bad Request")
    ) {
      return "Too many live connections are already open for this session. Close other tabs or devices, then refresh.";
    }

    return "Live session updates disconnected. Check your network and refresh to reconnect.";
  }

  return "Live session updates disconnected. Refresh to reconnect.";
}

const initialState: UnifiedSessionState = {
  connectionError: null,
  phase: "idle",
  error: null,
  identity: null,
  lobby: DEFAULT_LOBBY,
  gameplay: DEFAULT_GAMEPLAY,
  history: null,
  notifications: [],
  hostFeedback: [],
  sseEvents: [],
  maxEvents: 500,
  syncId: 0,
  lastSyncTimestamp: null,
  lastAckTimestamp: null,
  isConnected: false,
  userId: null,
  _sseManager: null,
  _unsubscribeSSE: null,
};

export function createUnifiedSessionStore(
  options: CreateUnifiedSessionStoreOptions,
): StoreApi<UnifiedSessionStore> {
  const logger = options.logger ?? consoleLogger;

  return createStore<UnifiedSessionStore>()(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      connect: (sessionId, userId = null, connectOptions = {}) => {
        const state = get();

        if (state._unsubscribeSSE) {
          state._unsubscribeSSE();
        }
        if (state._sseManager) {
          state._sseManager.disconnect();
        }

        logger.log(`[UnifiedSession] Connecting to session: ${sessionId}`);

        const manager = options.createSseManager();

        manager.on("connected", () => {
          set({ isConnected: true, connectionError: null });
        });

        manager.on("disconnected", () => {
          set({ isConnected: false });
        });

        manager.on("error", (error) => {
          logger.error("[UnifiedSession] SSE connection error:", error);
          set({
            connectionError: describeSseError(error),
            isConnected: false,
          });
        });

        const unsubscribe = manager.onAnyMessage((message: GameMessage) => {
          const currentState = get();
          const controllingPlayerId = currentState.gameplay.controllingPlayerId;

          const newEvent: SSEEventEntry = {
            id: ++sseEventIdCounter,
            eventType: message.type,
            data: message,
            timestamp: new Date().toISOString(),
          };

          switch (message.type) {
            case "SESSION_BOOTSTRAP": {
              const snapshotControllablePlayerIds =
                resolveControllablePlayerIds(
                  message.gameplay?.controllablePlayerIds,
                  message.lobby.seats,
                  currentState.userId,
                  options.fallbackToAllSeatsWhenUserIdMissing ?? false,
                );
              const effectiveControllingPlayerId = resolveControllingPlayerId(
                controllingPlayerId,
                snapshotControllablePlayerIds,
              );

              set((s) => ({
                phase: message.phase,
                lobby: {
                  seats: message.lobby.seats,
                  canStart: message.lobby.canStart,
                  hostUserId: message.lobby.hostUserId,
                },
                gameplay: {
                  ...s.gameplay,
                  version: message.gameplay?.version ?? s.gameplay.version,
                  activePlayers:
                    message.gameplay?.activePlayers ?? s.gameplay.activePlayers,
                  controllablePlayerIds: snapshotControllablePlayerIds,
                  controllingPlayerId: effectiveControllingPlayerId,
                  currentPhase:
                    message.gameplay?.currentPhase ?? s.gameplay.currentPhase,
                  seatViewsByPlayerId: transformSeatViews(
                    message.gameplay?.seatViewsByPlayerId,
                  ),
                  availableActions: message.gameplay?.availableActions ?? [],
                  prompts: message.gameplay?.prompts ?? [],
                  windows: message.gameplay?.windows ?? [],
                },
                history: message.history
                  ? {
                      entries: message.history.entries,
                      currentIndex: message.history.currentIndex,
                      canGoBack: message.history.canGoBack,
                      canGoForward: message.history.canGoForward,
                    }
                  : null,
                sseEvents: [...s.sseEvents, newEvent].slice(-s.maxEvents),
                syncId: s.syncId + 1,
                lastSyncTimestamp: Date.now(),
              }));
              break;
            }

            case "GAMEPLAY_UPDATE": {
              const controllablePlayerIds = resolveControllablePlayerIds(
                message.gameplay.controllablePlayerIds,
                currentState.lobby.seats,
                currentState.userId,
                options.fallbackToAllSeatsWhenUserIdMissing ?? false,
              );
              const effectiveControllingPlayerId = resolveControllingPlayerId(
                controllingPlayerId,
                controllablePlayerIds,
              );

              set((s) => ({
                phase: "gameplay",
                gameplay: {
                  ...s.gameplay,
                  version: message.gameplay.version,
                  activePlayers: message.gameplay.activePlayers,
                  controllablePlayerIds,
                  controllingPlayerId: effectiveControllingPlayerId,
                  currentPhase: message.gameplay.currentPhase,
                  seatViewsByPlayerId: transformSeatViews(
                    message.gameplay.seatViewsByPlayerId,
                  ),
                  availableActions: message.gameplay.availableActions,
                  prompts: message.gameplay.prompts,
                  windows: message.gameplay.windows,
                },
                sseEvents: [...s.sseEvents, newEvent].slice(-s.maxEvents),
                syncId: s.syncId + 1,
                lastSyncTimestamp: Date.now(),
              }));
              break;
            }

            case "LOBBY_UPDATE": {
              set((s) => ({
                lobby: {
                  seats: message.seats,
                  canStart: message.canStart,
                  hostUserId: message.hostUserId,
                },
                sseEvents: [...s.sseEvents, newEvent].slice(-s.maxEvents),
                syncId: s.syncId + 1,
                lastSyncTimestamp: Date.now(),
              }));
              break;
            }

            case "GAME_STARTED": {
              const msgControllablePlayerIds = resolveControllablePlayerIds(
                message.controllablePlayerIds,
                currentState.lobby.seats,
                currentState.userId,
                options.fallbackToAllSeatsWhenUserIdMissing ?? false,
              );
              const effectiveControllingPlayerId =
                controllingPlayerId || msgControllablePlayerIds[0] || "";
              set((s) => ({
                phase: "gameplay",
                gameplay: {
                  ...s.gameplay,
                  controllablePlayerIds: msgControllablePlayerIds,
                  controllingPlayerId: effectiveControllingPlayerId,
                },
                sseEvents: [...s.sseEvents, newEvent].slice(-s.maxEvents),
                syncId: s.syncId + 1,
                lastSyncTimestamp: Date.now(),
              }));
              break;
            }

            case "STATE_UPDATE": {
              set((s) => ({
                sseEvents: [...s.sseEvents, newEvent].slice(-s.maxEvents),
                syncId: s.syncId + 1,
                lastSyncTimestamp: Date.now(),
              }));
              break;
            }

            case "YOUR_TURN": {
              const notification: Notification = {
                id: generateNotificationId(),
                type: "YOUR_TURN",
                payload: {
                  type: "YOUR_TURN",
                  activePlayers: message.activePlayers,
                },
                timestamp: Date.now(),
                read: false,
              };
              const hostFeedback: HostFeedback = {
                id: generateNotificationId(),
                type: "YOUR_TURN",
                payload: {
                  type: "YOUR_TURN",
                  activePlayers: message.activePlayers,
                },
                timestamp: Date.now(),
              };
              set((s) => ({
                notifications: [...s.notifications, notification],
                hostFeedback: [...s.hostFeedback, hostFeedback],
                sseEvents: [...s.sseEvents, newEvent].slice(-s.maxEvents),
                syncId: s.syncId + 1,
                lastSyncTimestamp: Date.now(),
              }));
              break;
            }

            case "ACTION_EXECUTED": {
              const notification: Notification = {
                id: generateNotificationId(),
                type: "ACTION_EXECUTED",
                payload: {
                  type: "ACTION_EXECUTED",
                  playerId: message.playerId,
                  actionType: message.action.actionType,
                },
                timestamp: Date.now(),
                read: false,
              };
              set((s) => ({
                notifications: [...s.notifications, notification],
                sseEvents: [...s.sseEvents, newEvent].slice(-s.maxEvents),
                syncId: s.syncId + 1,
                lastSyncTimestamp: Date.now(),
              }));
              break;
            }

            case "ACTION_REJECTED": {
              const { notification, hostFeedback } =
                createActionRejectedArtifacts(
                  message.reason,
                  message.targetPlayer,
                );
              set((s) => ({
                notifications: [...s.notifications, notification],
                hostFeedback: [...s.hostFeedback, hostFeedback],
                sseEvents: [...s.sseEvents, newEvent].slice(-s.maxEvents),
                syncId: s.syncId + 1,
                lastSyncTimestamp: Date.now(),
              }));
              break;
            }

            case "TURN_CHANGED": {
              const notification: Notification = {
                id: generateNotificationId(),
                type: "TURN_CHANGED",
                payload: {
                  type: "TURN_CHANGED",
                  previousPlayers: message.previousPlayers,
                  currentPlayers: message.currentPlayers,
                },
                timestamp: Date.now(),
                read: false,
              };
              set((s) => ({
                notifications: [...s.notifications, notification],
                sseEvents: [...s.sseEvents, newEvent].slice(-s.maxEvents),
                syncId: s.syncId + 1,
                lastSyncTimestamp: Date.now(),
              }));
              break;
            }

            case "GAME_ENDED": {
              const notification: Notification = {
                id: generateNotificationId(),
                type: "GAME_ENDED",
                payload: {
                  type: "GAME_ENDED",
                  winner: message.winner,
                  finalScores: message.finalScores,
                  reason: message.reason,
                },
                timestamp: Date.now(),
                read: false,
              };
              set((s) => ({
                phase: "ended",
                notifications: [...s.notifications, notification],
                sseEvents: [...s.sseEvents, newEvent].slice(-s.maxEvents),
                syncId: s.syncId + 1,
                lastSyncTimestamp: Date.now(),
              }));
              break;
            }

            case "STATE_CHANGED": {
              const notification: Notification = {
                id: generateNotificationId(),
                type: "STATE_CHANGED",
                payload: {
                  type: "STATE_CHANGED",
                  newState: message.newState,
                },
                timestamp: Date.now(),
                read: false,
              };
              set((s) => ({
                gameplay: {
                  ...s.gameplay,
                  currentPhase: message.newState,
                },
                notifications: [...s.notifications, notification],
                sseEvents: [...s.sseEvents, newEvent].slice(-s.maxEvents),
                syncId: s.syncId + 1,
                lastSyncTimestamp: Date.now(),
              }));
              break;
            }

            case "ERROR": {
              const notification: Notification = {
                id: generateNotificationId(),
                type: "ERROR",
                payload: {
                  type: "ERROR",
                  message: message.message,
                  code: message.code,
                },
                timestamp: Date.now(),
                read: false,
              };
              set((s) => ({
                notifications: [...s.notifications, notification],
                sseEvents: [...s.sseEvents, newEvent].slice(-s.maxEvents),
                syncId: s.syncId + 1,
                lastSyncTimestamp: Date.now(),
              }));
              break;
            }

            case "HISTORY_UPDATED": {
              set((s) => ({
                history: {
                  entries: message.entries,
                  currentIndex: message.currentIndex,
                  canGoBack: message.canGoBack,
                  canGoForward: message.canGoForward,
                },
                sseEvents: [...s.sseEvents, newEvent].slice(-s.maxEvents),
                syncId: s.syncId + 1,
                lastSyncTimestamp: Date.now(),
              }));
              break;
            }

            case "HISTORY_RESTORED": {
              set((s) => ({
                sseEvents: [...s.sseEvents, newEvent].slice(-s.maxEvents),
                syncId: s.syncId + 1,
                lastSyncTimestamp: Date.now(),
              }));
              break;
            }

            case "AVAILABLE_ACTIONS": {
              set((s) => ({
                sseEvents: [...s.sseEvents, newEvent].slice(-s.maxEvents),
              }));
              break;
            }

            default: {
              set((s) => ({
                sseEvents: [...s.sseEvents, newEvent].slice(-s.maxEvents),
              }));
            }
          }
        });

        void manager.connect(sessionId, connectOptions);

        set({
          connectionError: null,
          userId,
          _sseManager: manager,
          _unsubscribeSSE: unsubscribe,
        });
      },

      clearConnectionError: () => {
        set({ connectionError: null });
      },

      enqueueActionRejected: (reason, targetPlayer) =>
        set((state) => {
          const { notification, hostFeedback } = createActionRejectedArtifacts(
            reason,
            targetPlayer,
          );
          return {
            notifications: [...state.notifications, notification],
            hostFeedback: [...state.hostFeedback, hostFeedback],
          };
        }),

      disconnect: () => {
        const state = get();
        if (state._unsubscribeSSE) {
          state._unsubscribeSSE();
        }
        if (state._sseManager) {
          state._sseManager.disconnect();
        }
        set({
          ...initialState,
        });
      },

      setLoading: () => set({ phase: "loading", error: null }),

      setLobby: (identity, lobby) =>
        set({
          phase: "lobby",
          error: null,
          identity,
          lobby,
        }),

      setGameplay: (identity, gameplay, preservedLobby) =>
        set((state) => ({
          phase: "gameplay",
          error: null,
          identity,
          gameplay: normalizeGameplayState(gameplay),
          lobby: preservedLobby ?? state.lobby,
        })),

      setEnded: (identity) =>
        set({
          phase: "ended",
          identity,
        }),

      setError: (error) =>
        set({
          phase: "error",
          error,
        }),

      updateLobbyState: (seats, canStart, hostUserId) =>
        set((state) => {
          if (state.phase !== "lobby" && state.phase !== "gameplay")
            return state;
          return {
            lobby: { seats, canStart, hostUserId },
            syncId: state.syncId + 1,
            lastSyncTimestamp: Date.now(),
          };
        }),

      switchPlayer: (playerId) => {
        const state = get();
        if (!state.gameplay) return;
        if (!state.gameplay.controllablePlayerIds.includes(playerId)) {
          logger.warn(
            `[UnifiedSession] Cannot switch to ${playerId} - not controllable`,
          );
          return;
        }

        set({
          gameplay: {
            ...state.gameplay,
            controllingPlayerId: playerId,
          },
          syncId: state.syncId + 1,
          lastSyncTimestamp: Date.now(),
        });
      },

      startGame: (gameplay) => {
        const state = get();
        set({
          phase: "gameplay",
          gameplay: normalizeGameplayState(gameplay),
          syncId: state.syncId + 1,
          lastSyncTimestamp: Date.now(),
        });
      },

      getPluginSnapshot: () => {
        const state = get();
        const sessionControl = resolveSessionControl(
          state,
          options.fallbackToAllSeatsWhenUserIdMissing ?? false,
        );
        const controllingPlayerId = sessionControl.controllingPlayerId;
        const availableActionEntries = state.gameplay.availableActions ?? [];
        const prompts = state.gameplay.prompts ?? [];
        const windows = state.gameplay.windows ?? [];
        const availableActions: ActionDefinition[] = controllingPlayerId
          ? (availableActionEntries.find(
              (entry) => entry.playerId === controllingPlayerId,
            )?.actions ?? [])
          : [];
        const visiblePrompts = controllingPlayerId
          ? prompts.filter((prompt) => prompt.to === controllingPlayerId)
          : [];
        const visibleWindows = controllingPlayerId
          ? windows.filter(
              (window) =>
                (window.addressedTo?.length ?? 0) === 0 ||
                window.addressedTo?.includes(controllingPlayerId),
            )
          : [];
        const seatViewsByPlayerId = state.gameplay.seatViewsByPlayerId ?? {};
        const view = controllingPlayerId
          ? (seatViewsByPlayerId[controllingPlayerId] ?? null)
          : null;

        return {
          view,
          gameplay: {
            currentPhase: state.gameplay.currentPhase,
            availableActions,
            prompts: visiblePrompts,
            windows: visibleWindows,
          },
          // Keep lobby metadata available during gameplay so authored hooks like
          // useLobby/usePlayerInfo can still resolve seat names and colors.
          lobby: state.lobby,
          notifications: state.notifications,
          session: {
            sessionId: state.identity?.sessionId ?? null,
            controllablePlayerIds: sessionControl.controllablePlayerIds,
            controllingPlayerId: sessionControl.controllingPlayerId,
            userId: state.userId,
          },
          history: state.history,
          syncId: state.syncId,
        };
      },

      onStateAck: (_syncId) => {
        set({ lastAckTimestamp: Date.now() });
      },

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),

      clearNotifications: () => set({ notifications: [] }),

      dismissHostFeedback: (id) =>
        set((state) => ({
          hostFeedback: state.hostFeedback.filter((item) => item.id !== id),
        })),

      clearHostFeedback: () => set({ hostFeedback: [] }),

      clearSSEEvents: () => set({ sseEvents: [] }),

      reset: () => {
        const state = get();
        if (state._unsubscribeSSE) state._unsubscribeSSE();
        if (state._sseManager) state._sseManager.disconnect();
        set({ ...initialState });
      },
    })),
  );
}

export const unifiedSessionSelectors = {
  isConnected: (s: UnifiedSessionStore) => s.isConnected,
  connectionError: (s: UnifiedSessionStore) => s.connectionError,
  isLoading: (s: UnifiedSessionStore) => s.phase === "loading",
  isLobby: (s: UnifiedSessionStore) => s.phase === "lobby",
  isGameplay: (s: UnifiedSessionStore) => s.phase === "gameplay",
  isEnded: (s: UnifiedSessionStore) => s.phase === "ended",
  hasError: (s: UnifiedSessionStore) => s.phase === "error",
  hasGameplayPayload: (s: UnifiedSessionStore) =>
    s.gameplay.currentPhase !== null,
  sessionId: (s: UnifiedSessionStore) => s.identity?.sessionId ?? null,
  shortCode: (s: UnifiedSessionStore) => s.identity?.shortCode ?? "",
  gameId: (s: UnifiedSessionStore) => s.identity?.gameId ?? null,
  seats: (s: UnifiedSessionStore) => s.lobby.seats,
  canStart: (s: UnifiedSessionStore) => s.lobby.canStart,
  hostUserId: (s: UnifiedSessionStore) => s.lobby.hostUserId,
  controllablePlayerIds: (s: UnifiedSessionStore) =>
    s.gameplay.controllablePlayerIds,
  controllingPlayerId: (s: UnifiedSessionStore) =>
    s.gameplay.controllingPlayerId,
  hostFeedback: (s: UnifiedSessionStore) => s.hostFeedback,
  sseManager: (s: UnifiedSessionStore) => s._sseManager,
};
