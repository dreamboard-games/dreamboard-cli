import { z } from "zod";
import type { PluginStateSnapshot } from "@dreamboard/ui-sdk/reducer";

export const InitMessageSchema = z.object({
  type: z.literal("init"),
  sessionId: z.string(),
  controllablePlayerIds: z.array(z.string()),
  controllingPlayerId: z.string(),
  userId: z.string().nullable(),
});

export const PingMessageSchema = z.object({
  type: z.literal("ping"),
});

export const StateSyncMessageSchema = z.object({
  type: z.literal("state-sync"),
  syncId: z.number(),
  state: z.custom<PluginStateSnapshot>((data) => {
    return (
      typeof data === "object" &&
      data !== null &&
      "session" in data &&
      "notifications" in data
    );
  }),
});

export const SubmitResultMessageSchema = z.object({
  type: z.literal("submit-result"),
  messageId: z.string(),
  accepted: z.boolean(),
  errorCode: z.string().optional(),
  message: z.string().optional(),
});

export const MainToPluginMessageSchema = z.discriminatedUnion("type", [
  InitMessageSchema,
  PingMessageSchema,
  StateSyncMessageSchema,
  SubmitResultMessageSchema,
]);

export type MainToPluginMessage = z.infer<typeof MainToPluginMessageSchema>;

export const ReadyMessageSchema = z.object({
  type: z.literal("ready"),
});

export const ActionMessageSchema = z.object({
  type: z.literal("action"),
  messageId: z.string(),
  playerId: z.string(),
  actionType: z.string(),
  params: z.record(z.string(), z.unknown()),
});

export const PromptResponseMessageSchema = z.object({
  type: z.literal("prompt-response"),
  messageId: z.string(),
  playerId: z.string(),
  promptId: z.string(),
  response: z.unknown(),
});

export const WindowActionMessageSchema = z.object({
  type: z.literal("window-action"),
  messageId: z.string(),
  playerId: z.string(),
  windowId: z.string(),
  actionType: z.string(),
  params: z.record(z.string(), z.unknown()).optional(),
});

export const ValidateActionMessageSchema = z.object({
  type: z.literal("validate-action"),
  playerId: z.string(),
  actionType: z.string(),
  params: z.record(z.string(), z.unknown()),
  messageId: z.string(),
});

export const ValidateActionResultMessageSchema = z.object({
  type: z.literal("validate-action-result"),
  messageId: z.string(),
  result: z.object({
    valid: z.boolean(),
    errorCode: z.string().optional(),
    message: z.string().optional(),
  }),
});

export const PluginErrorMessageSchema = z.object({
  type: z.literal("error"),
  message: z.string(),
  code: z.string().optional(),
});

export const PongMessageSchema = z.object({
  type: z.literal("pong"),
});

export const SwitchPlayerMessageSchema = z.object({
  type: z.literal("switch-player"),
  playerId: z.string(),
});

export const StateAckMessageSchema = z.object({
  type: z.literal("state-ack"),
  syncId: z.number(),
});

export const MarkNotificationReadMessageSchema = z.object({
  type: z.literal("mark-notification-read"),
  notificationId: z.string(),
});

export const RestoreHistoryMessageSchema = z.object({
  type: z.literal("restore-history"),
  entryId: z.string(),
});

export const PluginToMainMessageSchema = z.discriminatedUnion("type", [
  ReadyMessageSchema,
  ActionMessageSchema,
  PromptResponseMessageSchema,
  WindowActionMessageSchema,
  ValidateActionMessageSchema,
  PluginErrorMessageSchema,
  PongMessageSchema,
  SwitchPlayerMessageSchema,
  StateAckMessageSchema,
  MarkNotificationReadMessageSchema,
  RestoreHistoryMessageSchema,
]);

export type PluginToMainMessage = z.infer<typeof PluginToMainMessageSchema>;
