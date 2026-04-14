import { PluginBridge } from "./plugin-bridge.js";
import type { LoggerLike } from "./logger.js";
import { consoleLogger } from "./logger.js";

export interface HealthCheckConfig {
  pingInterval: number;
  pongTimeout: number;
  maxMissedPongs: number;
}

const DEFAULT_CONFIG: HealthCheckConfig = {
  pingInterval: 5000,
  pongTimeout: 2000,
  maxMissedPongs: 3,
};

export class PluginHealthCheck {
  private bridge: PluginBridge;
  private config: HealthCheckConfig;
  private onUnhealthy: () => void;
  private logger: LoggerLike;

  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private pongTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private missedPongCount = 0;
  private isRunning = false;
  private pongUnsubscribe: (() => void) | null = null;

  constructor(
    bridge: PluginBridge,
    options: {
      config?: Partial<HealthCheckConfig>;
      onUnhealthy: () => void;
      logger?: LoggerLike;
    },
  ) {
    this.bridge = bridge;
    this.config = { ...DEFAULT_CONFIG, ...options.config };
    this.onUnhealthy = options.onUnhealthy;
    this.logger = options.logger ?? consoleLogger;
  }

  start(): void {
    if (this.isRunning) {
      this.logger.warn("[HealthCheck] Already running");
      return;
    }

    this.isRunning = true;
    this.missedPongCount = 0;

    this.pongUnsubscribe = this.bridge.onPluginMessage("pong", () => {
      this.handlePong();
    });

    this.pingIntervalId = setInterval(() => {
      this.sendPing();
    }, this.config.pingInterval);

    this.sendPing();
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }

    if (this.pongTimeoutId) {
      clearTimeout(this.pongTimeoutId);
      this.pongTimeoutId = null;
    }

    if (this.pongUnsubscribe) {
      this.pongUnsubscribe();
      this.pongUnsubscribe = null;
    }

    this.missedPongCount = 0;
    this.logger.log("[HealthCheck] Stopped monitoring");
  }

  private sendPing(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.pongTimeoutId) {
      clearTimeout(this.pongTimeoutId);
    }

    this.bridge.sendPing();

    this.pongTimeoutId = setTimeout(() => {
      this.handleMissedPong();
    }, this.config.pongTimeout);
  }

  private handlePong(): void {
    if (this.pongTimeoutId) {
      clearTimeout(this.pongTimeoutId);
      this.pongTimeoutId = null;
    }

    if (this.missedPongCount > 0) {
      this.logger.log("[HealthCheck] Plugin recovered");
      this.missedPongCount = 0;
    }
  }

  private handleMissedPong(): void {
    this.missedPongCount++;

    this.logger.warn(
      `[HealthCheck] Missed pong #${this.missedPongCount}/${this.config.maxMissedPongs}`,
    );

    if (this.missedPongCount >= this.config.maxMissedPongs) {
      this.logger.error("[HealthCheck] Plugin iframe is unresponsive!");
      this.stop();
      this.onUnhealthy();
    }
  }

  isHealthCheckRunning(): boolean {
    return this.isRunning;
  }

  getMissedPongCount(): number {
    return this.missedPongCount;
  }
}
