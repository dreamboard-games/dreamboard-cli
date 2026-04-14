/**
 * Toast notification component for game events.
 */

import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { RuntimeContext } from "../context/RuntimeContext.js";
import type { PluginRuntimeAPI } from "../runtime/createPluginRuntimeAPI.js";
import type { Notification, SeatAssignment } from "../types/plugin-state.js";

function lookupSeatName(
  playerId: string,
  seats: SeatAssignment[] | null | undefined,
): string {
  return (
    seats?.find((seat) => seat.playerId === playerId)?.displayName || playerId
  );
}

function formatPlayerList(
  playerIds: string[],
  seats: SeatAssignment[] | null | undefined,
): string {
  const names = playerIds.map((playerId) => lookupSeatName(playerId, seats));
  if (names.length <= 1) {
    return names[0] ?? "";
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function postToParent(data: Record<string, unknown>) {
  if (window.parent === window) return;
  window.parent.postMessage(data, document.referrer || "*");
}

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  show: (message: string, type?: ToastType, duration?: number) => void;
  dismiss: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const runtime = useContext(RuntimeContext) as PluginRuntimeAPI | null;
  const processedNotificationsRef = useRef<Set<string>>(new Set());
  const processedValidationResultsRef = useRef<Set<string>>(new Set());

  const show = useCallback(
    (message: string, type: ToastType = "info", duration = 3000) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const toast: Toast = { id, type, message, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (message: string, duration?: number) => show(message, "success", duration),
    [show],
  );
  const error = useCallback(
    (message: string, duration?: number) => show(message, "error", duration),
    [show],
  );
  const info = useCallback(
    (message: string, duration?: number) => show(message, "info", duration),
    [show],
  );
  const warning = useCallback(
    (message: string, duration?: number) => show(message, "warning", duration),
    [show],
  );

  useEffect(() => {
    if (!runtime?.subscribeToState) {
      return;
    }

    const handleNotification = (
      notification: Notification,
      seats: SeatAssignment[] | null | undefined,
    ) => {
      switch (notification.type) {
        case "YOUR_TURN": {
          if (notification.payload.type !== "YOUR_TURN") {
            return;
          }
          const activePlayers = notification.payload.activePlayers;
          const playersLabel = formatPlayerList(activePlayers, seats);
          info(
            playersLabel ? `Your turn: ${playersLabel} can act.` : "Your turn.",
            3500,
          );
          return;
        }

        case "ACTION_REJECTED": {
          if (notification.payload.type !== "ACTION_REJECTED") {
            return;
          }
          const targetPlayer = notification.payload.targetPlayer;
          const targetLabel = targetPlayer
            ? lookupSeatName(targetPlayer, seats)
            : null;
          error(
            targetLabel
              ? `Action rejected for ${targetLabel}: ${notification.payload.reason}`
              : `Action rejected: ${notification.payload.reason}`,
            5000,
          );
          return;
        }

        default:
          return;
      }
    };

    const processSnapshot = (
      notifications: Notification[],
      seats: SeatAssignment[] | null | undefined,
    ) => {
      for (const notification of notifications) {
        if (
          notification.read ||
          processedNotificationsRef.current.has(notification.id)
        ) {
          continue;
        }

        processedNotificationsRef.current.add(notification.id);
        handleNotification(notification, seats);
        postToParent({
          type: "mark-notification-read",
          notificationId: notification.id,
        });
      }
    };

    const initialSnapshot = runtime.getSnapshot?.();
    if (initialSnapshot) {
      processSnapshot(
        initialSnapshot.notifications ?? [],
        initialSnapshot.lobby?.seats,
      );
    }

    return runtime.subscribeToState((snapshot) => {
      processSnapshot(snapshot.notifications ?? [], snapshot.lobby?.seats);
    });
  }, [error, info, runtime]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data?.type !== "validate-action-result") {
        return;
      }

      const messageId =
        typeof data.messageId === "string" ? data.messageId : undefined;
      if (messageId && processedValidationResultsRef.current.has(messageId)) {
        return;
      }

      const result =
        typeof data.result === "object" && data.result !== null
          ? data.result
          : null;
      if (!result || result.valid !== false) {
        return;
      }

      if (messageId) {
        processedValidationResultsRef.current.add(messageId);
      }

      const reason =
        (typeof result.message === "string" && result.message) ||
        (typeof result.errorCode === "string" && result.errorCode) ||
        "Validation failed";
      error(`Action invalid: ${reason}`, 4000);
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [error]);

  return (
    <ToastContext.Provider
      value={{ toasts, show, dismiss, success, error, info, warning }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const styles = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: "text-green-600",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: "text-red-600",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: "text-blue-600",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      icon: "text-yellow-600",
    },
  };

  const Icon = icons[toast.type];
  const style = styles[toast.type];

  return (
    <motion.div
      className={clsx(
        "pointer-events-auto flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg backdrop-blur-sm",
        "min-w-[280px] max-w-[400px]",
        style.bg,
        style.border,
      )}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      role="alert"
      aria-live={toast.type === "error" ? "assertive" : "polite"}
    >
      <Icon
        size={20}
        className={clsx("flex-shrink-0 mt-0.5", style.icon)}
        aria-hidden="true"
      />

      <p
        className={clsx(
          "flex-1 text-sm font-medium leading-relaxed",
          style.text,
        )}
      >
        {toast.message}
      </p>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className={clsx(
          "flex-shrink-0 p-1 rounded transition-colors hover:bg-black/5",
          style.text,
        )}
        aria-label="Close notification"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </motion.div>
  );
}
