import { AlertTriangle, Clock3, X } from "lucide-react";
import { Button } from "@dreamboard/ui/components/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@dreamboard/ui/components/alert";
import { cn } from "@dreamboard/ui/lib/utils";
import type { HostFeedback } from "../unified-session-store.js";

export interface HostFeedbackStackProps {
  feedback: HostFeedback[];
  onDismiss?: (feedbackId: string) => void;
  className?: string;
}

function getFeedbackBody(item: HostFeedback): string {
  switch (item.type) {
    case "YOUR_TURN": {
      const payload = item.payload;
      return payload.type === "YOUR_TURN" && payload.activePlayers.length > 1
        ? "You can act with one of your controlled players."
        : "You can act now.";
    }
    case "ACTION_REJECTED": {
      const payload = item.payload;
      if (payload.type !== "ACTION_REJECTED") {
        return "Action rejected.";
      }
      return payload.targetPlayer
        ? `${payload.reason} (${payload.targetPlayer})`
        : payload.reason;
    }
  }
}

function getFeedbackTitle(item: HostFeedback): string {
  switch (item.type) {
    case "YOUR_TURN":
      return "Your turn";
    case "ACTION_REJECTED":
      return "Action rejected";
  }
}

export function HostFeedbackStack({
  feedback,
  onDismiss,
  className,
}: HostFeedbackStackProps) {
  if (feedback.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {[...feedback].reverse().map((item) => (
        <Alert
          key={item.id}
          variant={item.type === "ACTION_REJECTED" ? "destructive" : "default"}
          className={cn(
            "shadow-sm",
            item.type === "ACTION_REJECTED"
              ? "border-destructive/30 bg-background/95"
              : "border-emerald-500/30 bg-emerald-500/10 text-foreground",
          )}
        >
          {item.type === "ACTION_REJECTED" ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Clock3 className="h-4 w-4 text-emerald-700" />
          )}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <AlertTitle>{getFeedbackTitle(item)}</AlertTitle>
              <AlertDescription>{getFeedbackBody(item)}</AlertDescription>
            </div>
            {onDismiss ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onDismiss(item.id)}
                aria-label="Dismiss feedback"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </Alert>
      ))}
    </div>
  );
}
