import type { PluginStateSnapshot } from "@dreamboard/ui-sdk/reducer";
import {
  MainToPluginMessageSchema,
  PluginToMainMessageSchema,
  type MainToPluginMessage,
  type PluginToMainMessage,
} from "./plugin-messages.js";
import type { LoggerLike } from "./logger.js";
import { consoleLogger } from "./logger.js";

type MessageHandler<T> = (data: T) => void;

export interface PluginBridgeOptions {
  logger?: LoggerLike;
}

export class PluginBridge {
  private iframe: HTMLIFrameElement;
  private targetOrigin: string;
  private allowedOrigins: Set<string>;
  private handlers: Map<
    PluginToMainMessage["type"],
    Set<MessageHandler<PluginToMainMessage>>
  > = new Map();
  private messageListener: ((event: MessageEvent) => void) | null = null;
  private logger: LoggerLike;

  constructor(
    iframe: HTMLIFrameElement,
    targetOrigin: string,
    options: PluginBridgeOptions = {},
  ) {
    if (!iframe.contentWindow) {
      throw new Error("iframe.contentWindow is not available");
    }

    this.iframe = iframe;
    this.targetOrigin = targetOrigin;
    this.allowedOrigins = resolveAllowedOrigins(iframe);
    this.logger = options.logger ?? consoleLogger;
    this.setupMessageListener();
  }

  private validateOrigin(origin: string): boolean {
    return this.allowedOrigins.has(origin);
  }

  private setupMessageListener(): void {
    this.messageListener = (event: MessageEvent) => {
      if (event.source !== this.iframe.contentWindow) {
        return;
      }
      if (!this.validateOrigin(event.origin)) {
        return;
      }

      const result = PluginToMainMessageSchema.safeParse(event.data);
      if (!result.success) {
        return;
      }

      this.emit(result.data.type, result.data);
    };

    window.addEventListener("message", this.messageListener);
  }

  sendInit(
    sessionId: string,
    controllablePlayerIds: string[],
    controllingPlayerId: string,
    userId: string | null,
  ): void {
    this.sendToPlugin({
      type: "init",
      sessionId,
      controllablePlayerIds,
      controllingPlayerId,
      userId,
    });
  }

  sendPing(): void {
    this.sendToPlugin({
      type: "ping",
    });
  }

  sendStateSync(syncId: number, state: PluginStateSnapshot): void {
    this.sendToPlugin({
      type: "state-sync",
      syncId,
      state,
    });
  }

  sendSubmitResult(result: {
    messageId: string;
    accepted: boolean;
    errorCode?: string;
    message?: string;
  }): void {
    this.sendToPlugin({
      type: "submit-result",
      ...result,
    });
  }

  send(message: Record<string, unknown>): void {
    if (!this.iframe.contentWindow) {
      this.logger.error(
        "[PluginBridge] iframe contentWindow not available for message:",
        message.type,
      );
      return;
    }

    this.iframe.contentWindow.postMessage(message, this.targetOrigin);
  }

  private sendToPlugin(message: MainToPluginMessage): void {
    if (!this.iframe.contentWindow) {
      this.logger.error(
        "[PluginBridge] iframe contentWindow not available for message:",
        message.type,
      );
      return;
    }

    const result = MainToPluginMessageSchema.safeParse(message);
    if (!result.success) {
      this.logger.error(
        "[PluginBridge] Failed to validate outgoing message:",
        message,
      );
      return;
    }

    this.iframe.contentWindow.postMessage(result.data, this.targetOrigin);
  }

  onPluginMessage<T extends PluginToMainMessage["type"]>(
    type: T,
    handler: MessageHandler<Extract<PluginToMainMessage, { type: T }>>,
  ): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    const handlers = this.handlers.get(type);
    if (!handlers) {
      throw new Error(`Handler for type ${type} not found`);
    }

    handlers.add(handler as MessageHandler<PluginToMainMessage>);

    return () => {
      handlers.delete(handler as MessageHandler<PluginToMainMessage>);
    };
  }

  private emit(
    type: PluginToMainMessage["type"],
    data: PluginToMainMessage,
  ): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  disconnect(): void {
    if (this.messageListener) {
      window.removeEventListener("message", this.messageListener);
      this.messageListener = null;
    }

    this.handlers.clear();
  }
}

function resolveAllowedOrigins(iframe: HTMLIFrameElement): Set<string> {
  const allowedOrigins = new Set<string>(["null"]);

  try {
    const iframeUrl = new URL(iframe.src, window.location.href);
    if (iframeUrl.origin && iframeUrl.origin !== "null") {
      allowedOrigins.add(iframeUrl.origin);
    }
  } catch {
    // Ignore invalid or unset iframe URLs and keep the sandboxed null origin.
  }

  return allowedOrigins;
}
