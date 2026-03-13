import { useEffect, useRef, useState } from "react";
import { useRuntimeContext } from "../context/RuntimeContext.js";
import type { PluginRuntimeAPI } from "../runtime/createPluginRuntimeAPI.js";
import type { Notification } from "../types/plugin-state.js";

/**
 * Notification handlers for game events.
 * All handlers are optional - only provide the ones you need.
 */
export interface GameNotificationHandlers {
  /**
   * Called when it becomes your turn to play.
   * Use this for turn indicators or prompting the player.
   * Access game state via useGameState() if needed.
   *
   * @example
   * ```typescript
   * onYourTurn: () => toast.success("It's your turn!")
   * ```
   */
  onYourTurn?: () => void;

  /**
   * Called when a submitted action was rejected by the server.
   * Use this to display error feedback to the player.
   *
   * @example
   * ```typescript
   * onActionRejected: (msg) => toast.error(msg.reason || 'Action rejected')
   * ```
   */
  onActionRejected?: (message: {
    reason: string;
    targetPlayer?: string;
  }) => void;

  /**
   * Called when the turn changes to a different player.
   * Use this for UI updates when it's no longer your turn.
   *
   * @example
   * ```typescript
   * onTurnChanged: (msg) => console.log('Now playing:', msg.currentPlayers)
   * ```
   */
  onTurnChanged?: (message: {
    previousPlayers: string[];
    currentPlayers: string[];
  }) => void;

  /**
   * Called when the game ends.
   * Use this to display final scores or game-over UI.
   *
   * @example
   * ```typescript
   * onGameEnded: (msg) => {
   *   toast.info(`Game ended: ${msg.reason}`);
   *   console.log('Final scores:', msg.finalScores);
   * }
   * ```
   */
  onGameEnded?: (message: {
    winner?: string;
    finalScores: Record<string, number>;
    reason: string;
  }) => void;

  /**
   * Called when the server sends an error message.
   * Use this for error handling and display.
   *
   * @example
   * ```typescript
   * onError: (msg) => toast.error(msg.message)
   * ```
   */
  onError?: (message: { message: string; code?: string }) => void;
}

/**
 * Hook to subscribe to game notification events.
 * Provides a clean API for responding to game events like turn changes,
 * action rejections, and game endings.
 *
 * Notifications are provided via state-sync as a queue from the host.
 * New notifications trigger handlers when they arrive.
 *
 * @param handlers - Object containing callback functions for each event type
 *
 * @example
 * ```typescript
 * function GameNotifications() {
 *   const { success, error, info } = useToast();
 *
 *   useGameNotifications({
 *     onYourTurn: () => success("It's your turn!"),
 *     onActionRejected: (msg) => error(msg.reason || 'Action rejected'),
 *     onGameEnded: (msg) => info(`Game ended: ${msg.reason}`),
 *   });
 *
 *   return null; // This component just handles notifications
 * }
 * ```
 *
 * @remarks
 * - Handlers are called with simplified message objects (not the full message)
 * - Only subscribe to events you need - unused handlers won't create listeners
 * - The hook automatically cleans up subscriptions on unmount
 */
export function useGameNotifications(handlers: GameNotificationHandlers): void {
  const runtime = useRuntimeContext() as PluginRuntimeAPI;

  // Use refs to keep handlers stable without requiring them in deps
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // Track processed notification IDs to avoid calling handlers twice
  const processedNotificationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!runtime.subscribeToState) {
      return;
    }

    // Subscribe to state-sync notifications queue
    return runtime.subscribeToState((snapshot) => {
      const notifications = snapshot.notifications ?? [];

      // Process only unread, unprocessed notifications
      for (const notif of notifications) {
        if (notif.read || processedNotificationsRef.current.has(notif.id)) {
          continue;
        }

        // Mark as processed
        processedNotificationsRef.current.add(notif.id);

        // Call appropriate handler based on type
        switch (notif.type) {
          case "YOUR_TURN":
            handlersRef.current.onYourTurn?.();
            break;

          case "ACTION_REJECTED":
            if (notif.payload.type === "ACTION_REJECTED") {
              handlersRef.current.onActionRejected?.({
                reason: notif.payload.reason,
                targetPlayer: notif.payload.targetPlayer,
              });
            }
            break;

          case "TURN_CHANGED":
            if (notif.payload.type === "TURN_CHANGED") {
              handlersRef.current.onTurnChanged?.({
                previousPlayers: notif.payload.previousPlayers,
                currentPlayers: notif.payload.currentPlayers,
              });
            }
            break;

          case "GAME_ENDED":
            if (notif.payload.type === "GAME_ENDED") {
              handlersRef.current.onGameEnded?.({
                winner: notif.payload.winner,
                finalScores: notif.payload.finalScores,
                reason: notif.payload.reason,
              });
            }
            break;

          case "ERROR":
            if (notif.payload.type === "ERROR") {
              handlersRef.current.onError?.({
                message: notif.payload.message,
                code: notif.payload.code,
              });
            }
            break;
        }
      }
    });
  }, [runtime]);
}

/**
 * Hook to access the notifications queue directly.
 * Useful for displaying a notifications list/panel.
 *
 * @returns Array of notifications and a function to mark them as read
 *
 * @example
 * ```typescript
 * function NotificationsPanel() {
 *   const { notifications, markAsRead } = useNotifications();
 *
 *   return (
 *     <ul>
 *       {notifications.map(n => (
 *         <li key={n.id} onClick={() => markAsRead(n.id)}>
 *           {n.type}: {n.timestamp}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useNotifications(): {
  notifications: Notification[];
  markAsRead: (notificationId: string) => void;
  unreadCount: number;
} {
  const runtime = useRuntimeContext() as PluginRuntimeAPI;
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!runtime.subscribeToState) {
      return;
    }

    // Get initial state
    const initialState = runtime.getSnapshot?.();
    if (initialState?.notifications) {
      setNotifications(initialState.notifications);
    }

    return runtime.subscribeToState((snapshot) => {
      setNotifications(snapshot.notifications ?? []);
    });
  }, [runtime]);

  const markAsRead = (notificationId: string) => {
    window.parent.postMessage(
      { type: "mark-notification-read", notificationId },
      "*",
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, markAsRead, unreadCount };
}
