import {
  getSessionStatus,
  restoreHistory,
  startGame,
  submitInput,
  validateInput,
} from "@dreamboard/api-client";
import {
  PluginSessionGateway,
  type GameSessionStoreApi,
  type LoggerLike,
  type UnifiedSessionStore,
} from "@dreamboard/ui-host-runtime/runtime";
import { formatConsoleArgs } from "./dev-diagnostics.js";
import type { ActiveSession, DevHostStorage } from "./dev-host-storage.js";

const INITIAL_SYNC_TIMEOUT_MS = 8000;
const AUTO_RECOVERY_SSE_FAILURE_THRESHOLD = 2;
const MAX_AUTO_RECOVERY_ATTEMPTS = 1;

type SessionStoreApi = {
  getState: () => UnifiedSessionStore;
  subscribe: (
    listener: (
      state: UnifiedSessionStore,
      previousState: UnifiedSessionStore,
    ) => void,
  ) => () => void;
};

function hasRenderableSnapshot(store: SessionStoreApi): boolean {
  const state = store.getState();
  if (state.phase === "lobby" || state.phase === "ended") {
    return true;
  }
  return state.gameplay.currentPhase !== null;
}

function createSubmissionError(
  errorCode: string | undefined,
  message: string | undefined,
  fallbackMessage: string,
): Error & { errorCode?: string } {
  const error = new Error(message ?? fallbackMessage) as Error & {
    errorCode?: string;
  };
  error.name = "SubmissionError";
  error.errorCode = errorCode;
  return error;
}

export interface DevHostControllerConfig {
  autoStartGame: boolean;
  authToken: string | null;
  compiledResultId: string;
  debug: boolean;
  gameId: string;
  seed: number | null;
  sessionId: string;
  shortCode: string;
  setupProfileId: string | null;
  slug: string;
  userId: string | null;
}

export interface DevHostControllerSnapshot {
  session: ActiveSession;
  seedValue: string;
  isCreatingSession: boolean;
  iframeSrc: string;
  pluginReady: boolean;
}

export class DevHostController {
  private readonly listeners = new Set<() => void>();
  private readonly defaultSession: ActiveSession;
  private readonly unsubscribeStore: () => void;

  private currentSession: ActiveSession;
  private seedValue: string;
  private isCreatingSession = false;
  private pluginReady = false;
  private iframeLoaded = false;
  private iframe: HTMLIFrameElement | null = null;
  private gateway: PluginSessionGateway | null = null;
  private gatewayStoreAttached = false;
  private autoStartRequested: boolean;
  private pluginFrameReloadCounter = 0;
  private sessionSnapshotTimeoutId: number | null = null;
  private autoRecoveryAttempts = 0;
  private sessionSnapshotSseFailureCount = 0;
  private recoveryInFlight = false;

  constructor(
    private readonly store: SessionStoreApi,
    private readonly storage: DevHostStorage,
    private readonly config: DevHostControllerConfig,
    private readonly logger: LoggerLike,
  ) {
    this.defaultSession = {
      sessionId: config.sessionId,
      shortCode: config.shortCode,
      gameId: config.gameId,
      seed: config.seed,
      compiledResultId: config.compiledResultId,
      setupProfileId: config.setupProfileId,
    };
    this.currentSession = this.loadInitialSession();
    this.seedValue = String(this.currentSession.seed ?? 1337);
    this.autoStartRequested = config.autoStartGame;

    this.unsubscribeStore = this.store.subscribe((state, previousState) => {
      if (previousState.syncId === 0 && state.syncId > 0) {
        this.sessionSnapshotSseFailureCount = 0;
        this.clearSessionSnapshotTimeout();
        if (
          this.pluginReady &&
          !this.gatewayStoreAttached &&
          hasRenderableSnapshot(this.store)
        ) {
          this.attachStore();
        }
      }

      if (
        this.autoStartRequested &&
        state.phase === "lobby" &&
        state.lobby.canStart &&
        (previousState.phase !== "lobby" || !previousState.lobby.canStart)
      ) {
        void this.autoStartGame();
      }
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): DevHostControllerSnapshot {
    return {
      session: this.currentSession,
      seedValue: this.seedValue,
      isCreatingSession: this.isCreatingSession,
      iframeSrc: `/plugin.html?session=${encodeURIComponent(this.currentSession.sessionId)}&reload=${this.pluginFrameReloadCounter}`,
      pluginReady: this.pluginReady,
    };
  }

  async initialize(): Promise<void> {
    this.sessionSnapshotSseFailureCount = 0;
    this.clearSessionSnapshotTimeout();
    this.storage.persistActiveSession(this.currentSession);
    this.seedValue = String(this.currentSession.seed ?? 1337);
    this.store.getState().setLoading();
    this.notify();

    const { data, error } = await getSessionStatus({
      path: { sessionId: this.currentSession.sessionId },
      headers: this.authHeaders(),
    });

    if (error || !data) {
      if (this.currentSession.sessionId !== this.defaultSession.sessionId) {
        this.currentSession = structuredClone(this.defaultSession);
        this.storage.persistActiveSession(this.currentSession);
        this.seedValue = String(this.currentSession.seed ?? 1337);
        this.notify();
        await this.initialize();
        return;
      }

      this.store.getState().setError("Failed to load the backend session.");
      this.notify();
      return;
    }

    const identity = {
      sessionId: data.sessionId,
      shortCode: data.shortCode,
      gameId: data.gameId,
    };
    const controllablePlayerIds = deriveControllablePlayerIds(
      data.seats,
      this.config.userId,
    );
    const controllingPlayerId = controllablePlayerIds[0] ?? "";

    switch (data.phase) {
      case "lobby":
        this.store.getState().setLobby(identity, {
          seats: data.seats,
          canStart: data.canStart,
          hostUserId: data.hostUserId,
        });
        break;
      case "gameplay":
        this.store.getState().setGameplay(
          identity,
          {
            version: 0,
            activePlayers: [],
            controllablePlayerIds,
            controllingPlayerId,
            currentPhase: null,
            seatViewsByPlayerId: {},
            availableActions: [],
            prompts: [],
            windows: [],
            layout: null,
            cardDisplayConfigs: null,
          },
          {
            seats: data.seats,
            canStart: false,
            hostUserId: data.hostUserId,
          },
        );
        break;
      case "ended":
        this.store.getState().setEnded(identity);
        break;
    }

    this.store
      .getState()
      .connect(this.currentSession.sessionId, this.config.userId);
    this.scheduleSessionSnapshotTimeout();
    if (this.autoStartRequested && data.phase === "lobby" && data.canStart) {
      void this.autoStartGame();
    }
    if (this.iframeLoaded) {
      this.connectGateway();
    }
    this.notify();
  }

  setSeedValue(value: string): void {
    this.seedValue = value;
    this.notify();
  }

  async createNewSession(): Promise<void> {
    const nextSeed = Number.parseInt(this.seedValue.trim(), 10);
    if (!Number.isSafeInteger(nextSeed)) {
      this.logger.error("[DevHost] Seed must be a safe integer.");
      return;
    }

    this.isCreatingSession = true;
    this.notify();

    try {
      await this.attachToSession(await this.requestNewSession(nextSeed));
    } catch (error) {
      this.logger.error("[DevHost] Failed to create a new session:", error);
    } finally {
      this.isCreatingSession = false;
      this.notify();
    }
  }

  async startGameFromSidebar(): Promise<void> {
    const { data, error } = await startGame({
      path: { sessionId: this.currentSession.sessionId },
      headers: this.authHeaders(),
    });
    if (error || !data) {
      this.logger.error("[DevHost] Failed to start the backend session.");
      return;
    }

    this.currentSession = {
      ...this.currentSession,
      gameId: data.gameId,
    };
    this.storage.persistActiveSession(this.currentSession);
    this.notify();
    await this.reconnectSessionSnapshot();
  }

  switchPlayer(playerId: string): void {
    this.store.getState().switchPlayer(playerId);
    this.notify();
  }

  async restoreHistoryEntry(entryId: string): Promise<void> {
    const { error } = await restoreHistory({
      path: { sessionId: this.currentSession.sessionId },
      headers: this.authHeaders(),
      body: { entryId },
    });
    if (error) {
      throw error;
    }
  }

  setIframe(element: HTMLIFrameElement | null): void {
    this.iframe = element;
  }

  onIframeLoad(): void {
    this.iframeLoaded = true;
    this.connectGateway();
  }

  matchesPluginWindow(source: MessageEvent["source"]): boolean {
    return Boolean(this.iframe && source === this.iframe.contentWindow);
  }

  handleSseTransportError(args: unknown[]): void {
    if (this.store.getState().syncId > 0 || this.recoveryInFlight) {
      return;
    }

    const errorMessage = args
      .map((value) => (value instanceof Error ? value.message : String(value)))
      .join(" ");
    if (!errorMessage.includes("SSE failed: 400")) {
      return;
    }

    this.sessionSnapshotSseFailureCount += 1;
    if (
      this.sessionSnapshotSseFailureCount < AUTO_RECOVERY_SSE_FAILURE_THRESHOLD
    ) {
      return;
    }

    void this.recoverFromUnhealthySession(
      "The current session stream is unhealthy, creating a fresh session...",
    );
  }

  dispose(): void {
    this.clearSessionSnapshotTimeout();
    this.unsubscribeStore();
    if (this.gateway) {
      this.gateway.disconnect();
      this.gateway = null;
    }
    this.gatewayStoreAttached = false;
    this.store.getState().disconnect();
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  private loadInitialSession(): ActiveSession {
    const persisted = this.storage.loadActiveSession();
    if (!persisted) {
      return structuredClone(this.defaultSession);
    }

    if (
      persisted.gameId !== this.defaultSession.gameId ||
      persisted.compiledResultId !== this.defaultSession.compiledResultId ||
      persisted.setupProfileId !== this.defaultSession.setupProfileId
    ) {
      return structuredClone(this.defaultSession);
    }

    return persisted;
  }

  private async autoStartGame(): Promise<void> {
    if (!this.autoStartRequested) {
      return;
    }

    this.autoStartRequested = false;

    const connected = await this.waitForSseConnection();
    if (!connected) {
      this.logger.error(
        "[DevHost] Timed out waiting for SSE before starting the game.",
      );
      return;
    }

    const { data, error } = await startGame({
      path: { sessionId: this.currentSession.sessionId },
      headers: this.authHeaders(),
    });
    if (error || !data) {
      this.logger.error("[DevHost] Failed to start the backend session.");
      return;
    }

    this.currentSession = {
      ...this.currentSession,
      gameId: data.gameId,
    };
    this.storage.persistActiveSession(this.currentSession);
    this.notify();
    await this.reconnectSessionSnapshot();
  }

  private async attachToSession(nextSession: ActiveSession): Promise<void> {
    this.currentSession = nextSession;
    this.storage.persistActiveSession(this.currentSession);
    this.autoStartRequested = true;
    this.clearSessionSnapshotTimeout();
    this.seedValue = String(nextSession.seed ?? 1337);
    this.pluginReady = false;
    this.iframeLoaded = false;
    if (this.gateway) {
      this.gateway.disconnect();
      this.gateway = null;
    }
    this.store.getState().reset();
    this.reloadPluginFrame();
    this.notify();
    await this.initialize();
  }

  private async waitForSseConnection(timeoutMs = 5000): Promise<boolean> {
    if (this.store.getState().isConnected) {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      const timeout = window.setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);

      const unsubscribe = this.store.subscribe((state) => {
        if (!state.isConnected) {
          return;
        }
        window.clearTimeout(timeout);
        unsubscribe();
        resolve(true);
      });
    });
  }

  private connectGateway(): void {
    if (!this.iframeLoaded || !this.iframe) {
      return;
    }

    if (!this.store.getState().identity?.sessionId) {
      return;
    }

    const session = this.store.getState().getPluginSnapshot().session;

    if (this.gateway) {
      this.gateway.disconnect();
      this.gateway = null;
    }
    this.gatewayStoreAttached = false;

    this.pluginReady = false;

    this.gateway = new PluginSessionGateway({
      iframe: this.iframe,
      sessionId: this.currentSession.sessionId,
      controllablePlayerIds: session.controllablePlayerIds,
      controllingPlayerId: session.controllingPlayerId ?? "",
      userId: this.config.userId,
      onReady: () => {
        this.pluginReady = true;
        if (hasRenderableSnapshot(this.store)) {
          this.attachStore();
        }
        this.notify();
      },
      onError: (error) => {
        this.pluginReady = false;
        this.logger.error(
          "[DevHost] Plugin iframe failed:",
          error instanceof Error ? error.message : error,
        );
        this.notify();
      },
      onAction: async (
        playerId: string,
        actionType: string,
        params: Record<string, unknown>,
      ) => {
        const expectedVersion = this.store.getState().gameplay.version;
        const { data, error } = await submitInput({
          path: { sessionId: this.currentSession.sessionId },
          headers: this.authHeaders(),
          body: {
            input: {
              kind: "action",
              playerId,
              actionType,
              params: JSON.stringify(params),
            },
            expectedVersion,
          },
        });

        if (error) {
          throw createSubmissionError(
            "api-error",
            undefined,
            "Failed to submit action",
          );
        }
        if (data?.accepted === false) {
          this.store
            .getState()
            .enqueueActionRejected(data.message ?? "Action rejected", playerId);
          throw createSubmissionError(
            data.errorCode ?? undefined,
            data.message ?? undefined,
            "Action rejected",
          );
        }
      },
      onPromptResponse: async (playerId, promptId, response) => {
        const expectedVersion = this.store.getState().gameplay.version;
        const { data, error } = await submitInput({
          path: { sessionId: this.currentSession.sessionId },
          headers: this.authHeaders(),
          body: {
            input: {
              kind: "promptResponse",
              playerId,
              promptId,
              response: JSON.stringify(response),
            },
            expectedVersion,
          },
        });

        if (error) {
          throw createSubmissionError(
            "api-error",
            undefined,
            "Failed to submit prompt response",
          );
        }
        if (data?.accepted === false) {
          this.store
            .getState()
            .enqueueActionRejected(
              data.message ?? "Prompt response rejected",
              playerId,
            );
          throw createSubmissionError(
            data.errorCode ?? undefined,
            data.message ?? undefined,
            "Prompt response rejected",
          );
        }
      },
      onWindowAction: async (playerId, windowId, actionType, params = {}) => {
        const expectedVersion = this.store.getState().gameplay.version;
        const { data, error } = await submitInput({
          path: { sessionId: this.currentSession.sessionId },
          headers: this.authHeaders(),
          body: {
            input: {
              kind: "windowAction",
              playerId,
              windowId,
              actionType,
              params: JSON.stringify(params),
            },
            expectedVersion,
          },
        });

        if (error) {
          throw createSubmissionError(
            "api-error",
            undefined,
            "Failed to submit window action",
          );
        }
        if (data?.accepted === false) {
          this.store
            .getState()
            .enqueueActionRejected(
              data.message ?? "Window action rejected",
              playerId,
            );
          throw createSubmissionError(
            data.errorCode ?? undefined,
            data.message ?? undefined,
            "Window action rejected",
          );
        }
      },
      onValidateAction: async (
        playerId: string,
        actionType: string,
        params: Record<string, unknown>,
      ) => {
        const expectedVersion = this.store.getState().gameplay.version;
        const { data, error } = await validateInput({
          path: { sessionId: this.currentSession.sessionId },
          headers: this.authHeaders(),
          body: {
            input: {
              kind: "action",
              playerId,
              actionType,
              params: JSON.stringify(params),
            },
            expectedVersion,
          },
        });

        if (error) {
          return {
            valid: false,
            errorCode: "api-error",
            message: "Failed to validate action",
          };
        }

        return {
          valid: data?.valid ?? true,
          errorCode: data?.errorCode ?? undefined,
          message: data?.message ?? undefined,
        };
      },
      onSwitchPlayer: (playerId: string) => {
        this.switchPlayer(playerId);
      },
      onRestoreHistory: async (entryId: string) => {
        await this.restoreHistoryEntry(entryId);
      },
      logger: this.logger,
    });

    this.gateway.connect();
  }

  private authHeaders(): Record<string, string> {
    return this.config.authToken
      ? { Authorization: `Bearer ${this.config.authToken}` }
      : {};
  }

  private attachStore(): void {
    if (!this.gateway || this.gatewayStoreAttached) {
      return;
    }

    const storeApi: GameSessionStoreApi = {
      getStateSnapshot: this.store.getState().getPluginSnapshot,
      subscribe: (listener: () => void) =>
        this.store.subscribe((_state, _previousState) => {
          listener();
        }),
      onStateAck: this.store.getState().onStateAck,
      markNotificationRead: this.store.getState().markNotificationRead,
    };

    this.gateway.attachStore(storeApi);
    this.gatewayStoreAttached = true;
  }

  private reloadPluginFrame(): void {
    this.pluginFrameReloadCounter += 1;
    this.iframeLoaded = false;
    this.pluginReady = false;
    this.gatewayStoreAttached = false;
  }

  private scheduleSessionSnapshotTimeout(): void {
    this.clearSessionSnapshotTimeout();
    this.sessionSnapshotTimeoutId = window.setTimeout(() => {
      if (this.store.getState().syncId > 0 || this.recoveryInFlight) {
        return;
      }
      void this.recoverFromUnhealthySession(
        `No initial state-sync arrived within ${INITIAL_SYNC_TIMEOUT_MS}ms.`,
      );
    }, INITIAL_SYNC_TIMEOUT_MS);
  }

  private clearSessionSnapshotTimeout(): void {
    if (this.sessionSnapshotTimeoutId !== null) {
      window.clearTimeout(this.sessionSnapshotTimeoutId);
      this.sessionSnapshotTimeoutId = null;
    }
  }

  private async recoverFromUnhealthySession(reason: string): Promise<void> {
    if (
      this.recoveryInFlight ||
      this.autoRecoveryAttempts >= MAX_AUTO_RECOVERY_ATTEMPTS ||
      this.store.getState().syncId > 0
    ) {
      return;
    }

    this.recoveryInFlight = true;
    this.autoRecoveryAttempts += 1;
    this.clearSessionSnapshotTimeout();

    try {
      this.logger.warn("[DevHost] " + reason);
      const nextSession = await this.requestNewSession(
        this.currentSession.seed ?? 1337,
      );
      await this.attachToSession(nextSession);
    } catch (error) {
      this.logger.error(
        "[DevHost] Automatic recovery failed:",
        formatConsoleArgs([error]),
      );
    } finally {
      this.recoveryInFlight = false;
    }
  }

  private async reconnectSessionSnapshot(): Promise<void> {
    this.autoStartRequested = false;
    this.sessionSnapshotSseFailureCount = 0;
    this.clearSessionSnapshotTimeout();
    this.store.getState().disconnect();
    this.store.getState().setLoading();
    this.store
      .getState()
      .connect(this.currentSession.sessionId, this.config.userId);
    this.scheduleSessionSnapshotTimeout();
    this.notify();
  }

  private async requestNewSession(seed: number): Promise<ActiveSession> {
    const response = await fetch("/__dreamboard_dev/session/new", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ seed }),
    });
    const payload = (await response.json()) as Partial<{
      sessionId: string;
      shortCode: string;
      gameId: string;
      seed: number;
      setupProfileId: string | null;
      error: string;
    }>;
    if (
      !response.ok ||
      !payload.sessionId ||
      !payload.shortCode ||
      !payload.gameId
    ) {
      throw new Error(payload.error ?? "Failed to create a new session.");
    }

    return {
      sessionId: payload.sessionId,
      shortCode: payload.shortCode,
      gameId: payload.gameId,
      seed: typeof payload.seed === "number" ? payload.seed : seed,
      compiledResultId: this.config.compiledResultId,
      setupProfileId:
        typeof payload.setupProfileId === "string"
          ? payload.setupProfileId
          : null,
    };
  }
}

function deriveControllablePlayerIds(
  seats: Array<{ playerId: string; controllerUserId?: string | null }>,
  userId: string | null,
): string[] {
  if (!userId) {
    return seats.map((seat) => seat.playerId);
  }

  return seats
    .filter((seat) => seat.controllerUserId === userId)
    .map((seat) => seat.playerId);
}
