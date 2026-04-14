import { useEffect, useRef } from "react";
import { Toaster, toast } from "sonner";
import type { HostFeedback, Notification } from "../unified-session-store.js";

export interface HostFeedbackToasterProps {
  feedback?: HostFeedback[];
  notifications?: Notification[];
  onDismiss?: (feedbackId: string) => void;
  onReadNotification?: (notificationId: string) => void;
}

type ToastableFeedback = HostFeedback | Notification;

function isHostFeedback(item: ToastableFeedback): item is HostFeedback {
  return "payload" in item && !("read" in item);
}

function describeFeedback(item: ToastableFeedback): {
  title: string;
  description: string;
  duration: number;
  variant: "default" | "error";
} {
  switch (item.type) {
    case "YOUR_TURN": {
      const activePlayerCount =
        item.payload.type === "YOUR_TURN"
          ? item.payload.activePlayers.length
          : 0;
      return {
        title: "Your turn",
        description:
          activePlayerCount > 1
            ? "You can act with one of your controlled players."
            : "You can act now.",
        duration: 3500,
        variant: "default",
      };
    }
    case "ACTION_REJECTED": {
      const reason =
        item.payload.type === "ACTION_REJECTED"
          ? item.payload.targetPlayer
            ? `${item.payload.reason} (${item.payload.targetPlayer})`
            : item.payload.reason
          : "Action rejected.";
      return {
        title: "Action rejected",
        description: reason,
        duration: 5000,
        variant: "error",
      };
    }
  }

  throw new Error(`Unsupported host feedback item type: ${String(item.type)}`);
}

export function HostFeedbackToaster({
  feedback = [],
  notifications = [],
  onDismiss,
  onReadNotification,
}: HostFeedbackToasterProps) {
  const processedIdsRef = useRef<Set<string>>(new Set());
  const dismissalTimersRef = useRef<Map<string, number>>(new Map());
  const mountedAtRef = useRef(Date.now());
  const items =
    feedback.length > 0
      ? feedback
      : notifications.filter(
          (item) =>
            item.timestamp >= mountedAtRef.current &&
            (item.type === "ACTION_REJECTED" || item.type === "YOUR_TURN"),
        );

  useEffect(() => {
    for (const item of items) {
      if (processedIdsRef.current.has(item.id)) {
        continue;
      }

      processedIdsRef.current.add(item.id);

      const config = describeFeedback(item);
      const dismiss = () => {
        const existingTimer = dismissalTimersRef.current.get(item.id);
        if (existingTimer !== undefined) {
          window.clearTimeout(existingTimer);
          dismissalTimersRef.current.delete(item.id);
        }
        processedIdsRef.current.delete(item.id);
        if (isHostFeedback(item)) {
          onDismiss?.(item.id);
        } else {
          onReadNotification?.(item.id);
        }
      };

      dismissalTimersRef.current.set(
        item.id,
        window.setTimeout(dismiss, config.duration + 250),
      );

      const options = {
        id: item.id,
        description: config.description,
        duration: config.duration,
        closeButton: true,
      };

      if (config.variant === "error") {
        toast.error(config.title, options);
      } else {
        toast(config.title, options);
      }
    }

    const dismissalTimers = dismissalTimersRef.current;

    return () => {
      for (const timerId of dismissalTimers.values()) {
        window.clearTimeout(timerId);
      }
      dismissalTimers.clear();
    };
  }, [items, onDismiss, onReadNotification]);

  return <Toaster position="top-center" richColors closeButton />;
}
