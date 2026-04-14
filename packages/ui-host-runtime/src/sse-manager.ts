import {
  disconnectSessionEvents,
  subscribeToSessionEvents,
} from "@dreamboard/api-client";
import type { GameMessage, GameMessageType } from "@dreamboard/api-client";
import type { LoggerLike } from "./logger.js";
import { consoleLogger } from "./logger.js";

type ExtractGameMessage<T extends GameMessageType> = Extract<
  GameMessage,
  { type: T }
>;

type GameMessageHandler<T extends GameMessageType = GameMessageType> = (
  data: ExtractGameMessage<T>,
) => void;
type ConnectionEventHandler = () => void;
type ErrorEventHandler = (error: unknown) => void;
type AnyGameMessageHandler = (data: GameMessage) => void;
type EventHandler =
  | AnyGameMessageHandler
  | ConnectionEventHandler
  | ErrorEventHandler;

export interface SSEManagerOptions {
  clientId?: string;
  logger?: LoggerLike;
}

export interface SSEConnectOptions {
  source?: string;
}

interface ActiveConnection {
  connectionAttemptId: string;
  sessionId: string;
  source?: string;
}

const TAB_ID_SESSION_STORAGE_KEY = "dreamboard.sse.tab-id";

function randomId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `sse-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateTabId(): string {
  if (typeof window === "undefined") {
    return randomId();
  }

  try {
    const existing = window.sessionStorage.getItem(TAB_ID_SESSION_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const created = randomId();
    window.sessionStorage.setItem(TAB_ID_SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return randomId();
  }
}

function isAbortLikeError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export class SSEManager {
  private abortController: AbortController | null = null;
  private activeConnection: ActiveConnection | null = null;
  private readonly clientId: string;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private anyMessageHandlers: Set<AnyGameMessageHandler> = new Set();
  private isConnected = false;
  private messageBuffer: GameMessage[] = [];
  private logger: LoggerLike;
  private pageHideHandler: (() => void) | null = null;

  constructor(options: SSEManagerOptions = {}) {
    this.clientId = options.clientId ?? getOrCreateTabId();
    this.logger = options.logger ?? consoleLogger;
  }

  async connect(sessionId: string, options: SSEConnectOptions = {}) {
    if (this.abortController) {
      this.disconnect();
    }

    this.abortController = new AbortController();
    const connection: ActiveConnection = {
      sessionId,
      connectionAttemptId: randomId(),
      source: options.source,
    };
    this.activeConnection = connection;
    this.registerPageHideHandler();

    try {
      let connected = false;
      let streamError: unknown = null;

      const { stream } = await subscribeToSessionEvents({
        path: { sessionId },
        query: {
          clientId: this.clientId,
          connectionAttemptId: connection.connectionAttemptId,
          clientSource: options.source,
        },
        sseMaxRetryAttempts: 0,
        signal: this.abortController.signal,
        onSseError: (error) => {
          if (this.abortController?.signal.aborted || isAbortLikeError(error)) {
            return;
          }
          streamError = error;
        },
      });

      for await (const event of stream) {
        if (!event) continue;
        if (!connected) {
          connected = true;
          this.isConnected = true;
          this.emit("connected", null);
        }

        const eventType = event.type;

        if (eventType) {
          this.emit(eventType, event);
        } else {
          this.logger.error("[SSEManager] Received event without type:", event);
        }
      }

      if (streamError) {
        this.logger.error("[SSEManager] SSE error:", streamError);
        this.emit("error", streamError);
        this.isConnected = false;
        this.emit("disconnected", null);
        return;
      }

      this.isConnected = false;
      this.emit("disconnected", null);
    } catch (error) {
      if (isAbortLikeError(error)) {
        return;
      }

      this.logger.error("[SSEManager] SSE error:", error);
      this.emit("error", error);
      this.isConnected = false;
      this.emit("disconnected", null);
    } finally {
      if (
        this.activeConnection?.connectionAttemptId ===
        connection.connectionAttemptId
      ) {
        this.activeConnection = null;
        this.unregisterPageHideHandler();
      }
    }
  }

  on<T extends GameMessageType>(
    eventType: T,
    handler: GameMessageHandler<T>,
  ): () => void;
  on(
    eventType: "connected" | "disconnected",
    handler: ConnectionEventHandler,
  ): () => void;
  on(eventType: "error", handler: ErrorEventHandler): () => void;
  on(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.add(handler);
    }

    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  onAnyMessage(handler: AnyGameMessageHandler): () => void {
    this.anyMessageHandlers.add(handler);

    if (this.messageBuffer.length > 0) {
      this.messageBuffer.forEach((message) => {
        handler(message);
      });
    }

    return () => {
      this.anyMessageHandlers.delete(handler);
    };
  }

  private emit(eventType: string, data: GameMessage): void;
  private emit(eventType: "connected" | "disconnected", data: null): void;
  private emit(eventType: "error", error: unknown): void;
  private emit(eventType: string, data: GameMessage | null | unknown): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        if (eventType === "connected" || eventType === "disconnected") {
          (handler as ConnectionEventHandler)();
        } else if (eventType === "error") {
          (handler as ErrorEventHandler)(data);
        } else {
          (handler as AnyGameMessageHandler)(data as GameMessage);
        }
      });
    }

    if (
      eventType !== "connected" &&
      eventType !== "disconnected" &&
      eventType !== "error"
    ) {
      this.messageBuffer.push(data as GameMessage);

      this.anyMessageHandlers.forEach((handler) => {
        handler(data as GameMessage);
      });
    }
  }

  disconnect() {
    const activeConnection = this.activeConnection;
    if (activeConnection) {
      this.notifyDisconnect(activeConnection, true);
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.activeConnection = null;
    this.unregisterPageHideHandler();
    this.isConnected = false;
    this.handlers.clear();
    this.anyMessageHandlers.clear();
    this.messageBuffer = [];
  }

  isStreamConnected(): boolean {
    return this.isConnected;
  }

  private notifyDisconnect(
    connection: ActiveConnection,
    keepalive: boolean,
  ): void {
    void disconnectSessionEvents({
      path: { sessionId: connection.sessionId },
      query: {
        clientId: this.clientId,
        connectionAttemptId: connection.connectionAttemptId,
      },
      keepalive,
    }).catch((error) => {
      this.logger.error("[SSEManager] Failed to notify disconnect:", error);
    });
  }

  private registerPageHideHandler(): void {
    if (typeof window === "undefined" || this.pageHideHandler) {
      return;
    }

    this.pageHideHandler = () => {
      if (this.activeConnection) {
        this.notifyDisconnect(this.activeConnection, true);
      }
    };

    window.addEventListener("pagehide", this.pageHideHandler);
  }

  private unregisterPageHideHandler(): void {
    if (typeof window === "undefined" || !this.pageHideHandler) {
      return;
    }

    window.removeEventListener("pagehide", this.pageHideHandler);
    this.pageHideHandler = null;
  }
}
