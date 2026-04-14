import type { PluginStateSnapshot } from "@dreamboard/ui-sdk/reducer";
import type { ValidationResult } from "@dreamboard/ui-sdk/types/runtime-api";
import { PluginBridge } from "./plugin-bridge.js";
import { PluginHealthCheck } from "./plugin-health-check.js";
import type { LoggerLike } from "./logger.js";
import { consoleLogger } from "./logger.js";

export interface GameSessionStoreApi {
  getStateSnapshot: () => PluginStateSnapshot;
  subscribe: (callback: () => void) => () => void;
  onStateAck: (syncId: number) => void;
  markNotificationRead: (notificationId: string) => void;
}

export type GatewayState = "loading" | "handshaking" | "connected" | "error";

export interface PluginSessionGatewayConfig {
  iframe: HTMLIFrameElement;
  sessionId: string;
  controllablePlayerIds: string[];
  controllingPlayerId: string;
  userId: string | null;
  onReady: () => void;
  onError: (error: Error) => void;
  onAction: (
    playerId: string,
    actionType: string,
    params: Record<string, unknown>,
  ) => void | Promise<void>;
  onPromptResponse: (
    playerId: string,
    promptId: string,
    response: unknown,
  ) => void | Promise<void>;
  onWindowAction: (
    playerId: string,
    windowId: string,
    actionType: string,
    params?: Record<string, unknown>,
  ) => void | Promise<void>;
  onValidateAction: (
    playerId: string,
    actionType: string,
    params: Record<string, unknown>,
  ) => Promise<ValidationResult>;
  onSwitchPlayer?: (playerId: string) => void;
  onRestoreHistory?: (entryId: string) => void;
  logger?: LoggerLike;
}

export class PluginSessionGateway {
  private bridge: PluginBridge | null = null;
  private healthCheck: PluginHealthCheck | null = null;
  private state: GatewayState = "loading";
  private unsubscribeHandlers: Array<() => void> = [];
  private config: PluginSessionGatewayConfig;
  private readyTimeout: ReturnType<typeof setTimeout> | null = null;
  private initRetryInterval: ReturnType<typeof setInterval> | null = null;
  private storeUnsubscribe: (() => void) | null = null;
  private gameSessionStore: GameSessionStoreApi | null = null;
  private lastSentSyncId: number | null = null;
  private logger: LoggerLike;

  constructor(config: PluginSessionGatewayConfig) {
    this.config = config;
    this.logger = config.logger ?? consoleLogger;
  }

  connect(): void {
    if (this.bridge) {
      this.logger.warn("[Gateway] Already connected");
      return;
    }

    this.state = "loading";

    const targetOrigin = "*";
    this.bridge = new PluginBridge(this.config.iframe, targetOrigin, {
      logger: this.logger,
    });

    this.readyTimeout = setTimeout(() => {
      if (this.state !== "connected") {
        this.handleError(
          new Error("Plugin failed to send ready message within 10 seconds"),
        );
      }
    }, 10000);

    this.setupActionHandler();
    this.setupPromptResponseHandler();
    this.setupWindowActionHandler();
    this.setupValidateActionHandler();
    this.setupReadyHandler();
    this.setupErrorHandler();
    this.setupSwitchPlayerHandler();
    this.setupRestoreHistoryHandler();
    this.setupStateAckHandler();
    this.setupMarkNotificationReadHandler();

    this.state = "handshaking";

    setTimeout(() => {
      this.sendInit();
      this.initRetryInterval = setInterval(() => {
        if (this.state === "connected") {
          this.clearInitRetryInterval();
          return;
        }
        this.sendInit();
      }, 250);
    }, 50);
  }

  attachStore(store: GameSessionStoreApi): void {
    if (this.state !== "connected") {
      this.logger.warn(
        "[Gateway] Cannot attach store - plugin not ready yet (state: " +
          this.state +
          ")",
      );
      return;
    }

    if (this.storeUnsubscribe) {
      this.logger.warn("[Gateway] Store already attached");
      return;
    }

    this.gameSessionStore = store;

    const sendStateSync = () => {
      if (!this.bridge) return;

      const snapshot = store.getStateSnapshot();

      if (snapshot.syncId !== this.lastSentSyncId) {
        this.lastSentSyncId = snapshot.syncId;
        this.bridge.sendStateSync(snapshot.syncId, snapshot);
        this.logger.log("[Gateway] Sent state-sync, syncId:", snapshot.syncId);
      }
    };

    sendStateSync();

    this.storeUnsubscribe = store.subscribe(() => {
      sendStateSync();
    });
  }

  getState(): GatewayState {
    return this.state;
  }

  disconnect(): void {
    if (this.readyTimeout) {
      clearTimeout(this.readyTimeout);
      this.readyTimeout = null;
    }

    this.clearInitRetryInterval();

    if (this.healthCheck) {
      this.healthCheck.stop();
      this.healthCheck = null;
    }

    if (this.bridge) {
      this.bridge.disconnect();
      this.bridge = null;
    }

    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
    }

    this.unsubscribeHandlers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeHandlers = [];

    this.state = "loading";
    this.lastSentSyncId = null;
  }

  private setupReadyHandler(): void {
    if (!this.bridge) return;

    const unsubscribe = this.bridge.onPluginMessage("ready", () => {
      if (this.readyTimeout) {
        clearTimeout(this.readyTimeout);
        this.readyTimeout = null;
      }
      this.clearInitRetryInterval();

      this.state = "connected";

      if (this.bridge) {
        this.healthCheck = new PluginHealthCheck(this.bridge, {
          onUnhealthy: () => {
            this.handleError(new Error("Plugin iframe is unresponsive"));
          },
          logger: this.logger,
        });
        this.healthCheck.start();
      }

      this.config.onReady();
    });

    this.unsubscribeHandlers.push(unsubscribe);
  }

  private sendInit(): void {
    if (!this.bridge) {
      return;
    }

    this.bridge.sendInit(
      this.config.sessionId,
      this.config.controllablePlayerIds,
      this.config.controllingPlayerId,
      this.config.userId,
    );
  }

  private clearInitRetryInterval(): void {
    if (this.initRetryInterval) {
      clearInterval(this.initRetryInterval);
      this.initRetryInterval = null;
    }
  }

  private setupActionHandler(): void {
    if (!this.bridge) return;

    const unsubscribe = this.bridge.onPluginMessage(
      "action",
      async (message) => {
        try {
          await this.config.onAction(
            message.playerId,
            message.actionType,
            message.params,
          );
          this.sendSubmitResult(message.messageId, { accepted: true });
        } catch (error) {
          this.logger.error("[Gateway] Action submission error:", error);
          this.sendSubmitResult(
            message.messageId,
            this.describeSubmissionFailure(error, "Action rejected"),
          );
        }
      },
    );

    this.unsubscribeHandlers.push(unsubscribe);
  }

  private setupPromptResponseHandler(): void {
    if (!this.bridge) return;

    const unsubscribe = this.bridge.onPluginMessage(
      "prompt-response",
      async (message) => {
        try {
          await this.config.onPromptResponse(
            message.playerId,
            message.promptId,
            message.response,
          );
          this.sendSubmitResult(message.messageId, { accepted: true });
        } catch (error) {
          this.logger.error(
            "[Gateway] Prompt response submission error:",
            error,
          );
          this.sendSubmitResult(
            message.messageId,
            this.describeSubmissionFailure(error, "Prompt response rejected"),
          );
        }
      },
    );

    this.unsubscribeHandlers.push(unsubscribe);
  }

  private setupWindowActionHandler(): void {
    if (!this.bridge) return;

    const unsubscribe = this.bridge.onPluginMessage(
      "window-action",
      async (message) => {
        try {
          await this.config.onWindowAction(
            message.playerId,
            message.windowId,
            message.actionType,
            message.params,
          );
          this.sendSubmitResult(message.messageId, { accepted: true });
        } catch (error) {
          this.logger.error("[Gateway] Window action submission error:", error);
          this.sendSubmitResult(
            message.messageId,
            this.describeSubmissionFailure(error, "Window action rejected"),
          );
        }
      },
    );

    this.unsubscribeHandlers.push(unsubscribe);
  }

  private setupValidateActionHandler(): void {
    if (!this.bridge) return;

    const unsubscribe = this.bridge.onPluginMessage(
      "validate-action",
      async (message) => {
        try {
          const result = await this.config.onValidateAction(
            message.playerId,
            message.actionType,
            message.params,
          );

          this.bridge?.send({
            type: "validate-action-result",
            messageId: message.messageId,
            result,
          });
        } catch (error) {
          this.logger.error("[Gateway] Validate action error:", error);

          this.bridge?.send({
            type: "validate-action-result",
            messageId: message.messageId,
            result: {
              valid: false,
              errorCode: "validation-error",
              message:
                error instanceof Error ? error.message : "Validation failed",
            },
          });
        }
      },
    );

    this.unsubscribeHandlers.push(unsubscribe);
  }

  private setupErrorHandler(): void {
    if (!this.bridge) return;

    const unsubscribe = this.bridge.onPluginMessage("error", (message) => {
      this.logger.error("[Gateway] Plugin error:", message.message);
      if (message.code) {
        this.logger.error("[Gateway] Error code:", message.code);
      }
    });

    this.unsubscribeHandlers.push(unsubscribe);
  }

  private setupSwitchPlayerHandler(): void {
    if (!this.bridge) return;

    const unsubscribe = this.bridge.onPluginMessage(
      "switch-player",
      (message) => {
        this.logger.log("[Gateway] Switch player request:", message.playerId);
        if (this.config.onSwitchPlayer) {
          this.config.onSwitchPlayer(message.playerId);
        }
      },
    );

    this.unsubscribeHandlers.push(unsubscribe);
  }

  private setupRestoreHistoryHandler(): void {
    if (!this.bridge) return;

    const unsubscribe = this.bridge.onPluginMessage(
      "restore-history",
      (message) => {
        this.logger.log("[Gateway] Restore history request:", message.entryId);
        if (this.config.onRestoreHistory) {
          this.config.onRestoreHistory(message.entryId);
        }
      },
    );

    this.unsubscribeHandlers.push(unsubscribe);
  }

  private setupStateAckHandler(): void {
    if (!this.bridge) return;

    const unsubscribe = this.bridge.onPluginMessage("state-ack", (message) => {
      this.logger.log("[Gateway] Received state-ack, syncId:", message.syncId);
      this.gameSessionStore?.onStateAck(message.syncId);
    });

    this.unsubscribeHandlers.push(unsubscribe);
  }

  private setupMarkNotificationReadHandler(): void {
    if (!this.bridge) return;

    const unsubscribe = this.bridge.onPluginMessage(
      "mark-notification-read",
      (message) => {
        this.logger.log(
          "[Gateway] Mark notification read:",
          message.notificationId,
        );
        this.gameSessionStore?.markNotificationRead(message.notificationId);
      },
    );

    this.unsubscribeHandlers.push(unsubscribe);
  }

  private handleError(error: Error): void {
    this.logger.error("[Gateway] Error:", error);
    this.state = "error";
    this.config.onError(error);
  }

  private sendSubmitResult(
    messageId: string,
    result: {
      accepted: boolean;
      errorCode?: string;
      message?: string;
    },
  ): void {
    this.bridge?.sendSubmitResult({
      messageId,
      accepted: result.accepted,
      errorCode: result.errorCode,
      message: result.message,
    });
  }

  private describeSubmissionFailure(
    error: unknown,
    fallbackMessage: string,
  ): {
    accepted: false;
    errorCode?: string;
    message: string;
  } {
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "errorCode" in error &&
      typeof error.errorCode === "string"
        ? error.errorCode
        : undefined;
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : fallbackMessage;
    return {
      accepted: false,
      errorCode,
      message,
    };
  }
}
