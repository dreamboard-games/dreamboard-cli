import {
  restoreHistory,
  type SessionBootstrap,
  submitPlayerAction,
  validatePlayerAction,
} from "@dreamboard/api-client";
import {
  PERF_MARK_NAMES,
  PluginSessionGateway,
  correlateVersion,
  recordMark,
  type GameSessionStoreApi,
  type LoggerLike,
  type UnifiedSessionStore,
} from "@dreamboard/ui-host-runtime/runtime";
import { formatConsoleArgs } from "./dev-diagnostics.js";
import type { ActiveSession, DevHostStorage } from "./dev-host-storage.js";

const AUTO_RECOVERY_SSE_FAILURE_THRESHOLD = 2;
const MAX_AUTO_RECOVERY_ATTEMPTS = 1;

// Mirrors `apps/web`'s runtime-api: client-minted correlation id threaded
// as a header so the backend can stamp it on its Tier-0 input-latency span
// attrs and summary log line. Set conditionally so existing dev-host tests
// (which call `onInteraction` without a `meta`) keep asserting the absence
// of any `headers` property on the generated request.
const CLIENT_ACTION_ID_HEADER = "X-Dreamboard-Client-Action-Id";

type DevSessionBootstrap = SessionBootstrap & {
  session: SessionBootstrap["session"] & { seed?: number | null };
};

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
  return (
    state.bootstrap.status === "renderable" &&
    state.getPluginSnapshot().view !== null
  );
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
  compiledResultId: string;
  debug: boolean;
  fallbackSession: ActiveSession;
  gameId: string;
  playerCount: number;
  setupProfileId: string | null;
  slug: string;
  userId: string | null;
}

/**
 * Structured surface for reducer/runtime failures that bubble up from the
 * backend. These are shown in the dev host overlay so authors see the same
 * file/line/stack information they'd get from a `dreamboard dev` backend log.
 */
export interface DevHostRuntimeError {
  title: string;
  summary: string;
  violations: Array<{
    message: string;
    field?: string;
    code?: string;
  }>;
  correlationId?: string;
}

export interface DevHostControllerSnapshot {
  session: ActiveSession;
  seedValue: string;
  isCreatingSession: boolean;
  iframeSrc: string;
  pluginReady: boolean;
  runtimeError: DevHostRuntimeError | null;
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
  private pluginFrameReloadCounter = 0;
  private autoRecoveryAttempts = 0;
  private sessionSnapshotSseFailureCount = 0;
  private recoveryInFlight = false;
  private runtimeError: DevHostRuntimeError | null = null;
  private playerSwitchRequestId = 0;

  constructor(
    private readonly store: SessionStoreApi,
    private readonly storage: DevHostStorage,
    private readonly config: DevHostControllerConfig,
    private readonly logger: LoggerLike,
  ) {
    this.defaultSession = structuredClone(config.fallbackSession);
    this.currentSession = structuredClone(this.defaultSession);
    this.seedValue = String(this.currentSession.seed ?? 1337);
    this.unsubscribeStore = this.store.subscribe((state) => {
      if (state.bootstrap.status !== "loading") {
        this.sessionSnapshotSseFailureCount = 0;
      }
      if (
        this.pluginReady &&
        !this.gatewayStoreAttached &&
        hasRenderableSnapshot(this.store)
      ) {
        this.attachStore();
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
      runtimeError: this.runtimeError,
    };
  }

  dismissRuntimeError(): void {
    if (this.runtimeError === null) {
      return;
    }
    this.runtimeError = null;
    this.notify();
  }

  /**
   * Public entry point for surfacing runtime errors originating outside
   * the controller (e.g. the api-client interceptor that detects a
   * `session_invalid` envelope from the dev proxy and wants to route
   * the failure through the existing overlay).
   */
  reportRuntimeError(error: DevHostRuntimeError): void {
    this.setRuntimeError(error);
  }

  async initialize(): Promise<void> {
    this.sessionSnapshotSseFailureCount = 0;
    this.store.getState().setLoading();
    this.notify();

    try {
      const preferredPlayerId = this.storage.loadSelectedPlayerId();
      const bootstrap =
        await this.loadBootstrapFromDevServer(preferredPlayerId);
      this.hydrateFromBootstrap(bootstrap);
    } catch (initialError) {
      const preferredPlayerId = this.storage.loadSelectedPlayerId();
      let error = initialError;
      if (preferredPlayerId) {
        this.logger.warn(
          "[DevHost] Failed to bootstrap the persisted player selection; retrying with the default player:",
          error instanceof Error ? error.message : String(error),
        );
        this.storage.persistSelectedPlayerId(null);
        try {
          const bootstrap = await this.loadBootstrapFromDevServer();
          this.hydrateFromBootstrap(bootstrap);
          this.notify();
          return;
        } catch (retryError) {
          error = retryError;
        }
      }
      this.logger.error(
        "[DevHost] Failed to bootstrap the backend session:",
        error instanceof Error ? error.message : String(error),
      );
      this.store.getState().setError("Failed to load the backend session.");
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
      const bootstrap = await this.postBootstrapEndpoint(
        "/__dreamboard_dev/session/new",
        { seed: nextSeed },
      );
      this.clearRuntimeError();
      if (this.gateway) {
        this.gateway.disconnect();
        this.gateway = null;
      }
      this.gatewayStoreAttached = false;
      this.pluginReady = false;
      this.reloadPluginFrame();
      this.store.getState().reset();
      this.hydrateFromBootstrap(bootstrap);
    } catch (error) {
      this.logger.error("[DevHost] Failed to create a new session:", error);
    } finally {
      this.isCreatingSession = false;
      this.notify();
    }
  }

  async startGameFromSidebar(): Promise<void> {
    try {
      const bootstrap = await this.postBootstrapEndpoint(
        "/__dreamboard_dev/session/start",
      );
      this.clearRuntimeError();
      this.hydrateFromBootstrap(bootstrap);
      this.notify();
    } catch (error) {
      this.setRuntimeError(
        convertProblemDetailsToRuntimeError(
          error,
          "Failed to start the backend session.",
        ),
      );
      this.logger.error(
        "[DevHost] Failed to start the backend session:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  switchPlayer(playerId: string): void {
    void this.switchPlayerFromBootstrap(playerId);
  }

  async restoreHistoryEntry(entryId: string): Promise<void> {
    const { error } = await restoreHistory({
      path: { sessionId: this.currentSession.sessionId },
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
    if (
      this.store.getState().bootstrap.status !== "loading" ||
      this.recoveryInFlight
    ) {
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
    this.unsubscribeStore();
    if (this.gateway) {
      this.gateway.disconnect();
      this.gateway = null;
    }
    this.gatewayStoreAttached = false;
    this.store.getState().closeStreams();
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  private setRuntimeError(error: DevHostRuntimeError): void {
    this.runtimeError = error;
    this.notify();
  }

  private clearRuntimeError(): void {
    if (this.runtimeError === null) {
      return;
    }
    this.runtimeError = null;
    this.notify();
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
      onInteraction: async (
        playerId: string,
        interactionId: string,
        params: unknown,
        meta,
      ) => {
        const expectedVersion = this.store.getState().gameplay.version;
        const actionSetVersion =
          this.store.getState().gameplay.actionSetVersion;
        const clientActionId = meta?.clientActionId;
        const headers = clientActionId
          ? { [CLIENT_ACTION_ID_HEADER]: clientActionId }
          : undefined;

        // Tier-0 perf: bracket the HTTP submit so the HUD can compute
        // `server = t3 - t2`. t0/t1 are written by the plugin iframe and
        // gateway respectively against the same actionId; t4..t8 arrive
        // via SSE, store apply, plugin state-ack, and state-rendered.
        if (clientActionId) {
          recordMark(clientActionId, PERF_MARK_NAMES.T2_HTTP_SENT, {
            extra: { playerId, interactionId, expectedVersion },
          });
        }

        const { data, error } = await submitPlayerAction({
          path: {
            sessionId: this.currentSession.sessionId,
            playerId,
            interactionId,
          },
          body: {
            expectedVersion,
            actionSetVersion,
            inputs:
              params && typeof params === "object" && !Array.isArray(params)
                ? (params as never)
                : {},
          },
          ...(headers ? { headers } : {}),
        });

        if (clientActionId) {
          recordMark(clientActionId, PERF_MARK_NAMES.T3_HTTP_RESPONSE, {
            extra: {
              accepted: data?.accepted,
              errorCode: data?.errorCode,
              version: data?.version,
              transport: error ? "error" : "ok",
            },
          });
          if (data?.version !== undefined && data?.accepted !== false) {
            correlateVersion(clientActionId, data.version);
          }
        }

        if (error) {
          throw createSubmissionError(
            "api-error",
            undefined,
            "Failed to submit interaction",
          );
        }
        if (data?.accepted !== false && data?.gameplay) {
          this.store
            .getState()
            .applyGameplaySnapshotLocal(data.gameplay, clientActionId);
        }
        if (data?.accepted === false) {
          this.store
            .getState()
            .enqueueActionRejected(
              data.message ?? "Interaction rejected",
              playerId,
            );
          throw createSubmissionError(
            data.errorCode ?? undefined,
            data.message ?? undefined,
            "Interaction rejected",
          );
        }
      },
      onValidateInteraction: async (
        playerId: string,
        interactionId: string,
        params: unknown,
      ) => {
        const expectedVersion = this.store.getState().gameplay.version;
        const actionSetVersion =
          this.store.getState().gameplay.actionSetVersion;
        const { data, error } = await validatePlayerAction({
          path: {
            sessionId: this.currentSession.sessionId,
            playerId,
            interactionId,
          },
          body: {
            expectedVersion,
            actionSetVersion,
            inputs:
              params && typeof params === "object" && !Array.isArray(params)
                ? (params as never)
                : {},
          },
        });

        if (error) {
          return {
            valid: false,
            errorCode: "api-error",
            message: "Failed to validate interaction",
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

  private async recoverFromUnhealthySession(reason: string): Promise<void> {
    if (
      this.recoveryInFlight ||
      this.autoRecoveryAttempts >= MAX_AUTO_RECOVERY_ATTEMPTS ||
      this.store.getState().bootstrap.status !== "loading"
    ) {
      return;
    }

    this.recoveryInFlight = true;
    this.autoRecoveryAttempts += 1;

    try {
      this.logger.warn("[DevHost] " + reason);
      const bootstrap = await this.postBootstrapEndpoint(
        "/__dreamboard_dev/session/new",
        { seed: this.currentSession.seed ?? 1337 },
      );
      this.hydrateFromBootstrap(bootstrap);
    } catch (error) {
      this.logger.error(
        "[DevHost] Automatic recovery failed:",
        formatConsoleArgs([error]),
      );
    } finally {
      this.recoveryInFlight = false;
    }
  }

  private async loadBootstrapFromDevServer(
    playerId?: string | null,
  ): Promise<DevSessionBootstrap> {
    return this.requestBootstrap(
      playerId?.trim()
        ? `/__dreamboard_dev/session/bootstrap?playerId=${encodeURIComponent(playerId.trim())}`
        : "/__dreamboard_dev/session/bootstrap",
      {
        method: "GET",
      },
    );
  }

  private async postBootstrapEndpoint(
    path: string,
    body?: Record<string, unknown>,
  ): Promise<DevSessionBootstrap> {
    return this.requestBootstrap(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      headers: body ? { "content-type": "application/json" } : undefined,
    });
  }

  private async requestBootstrap(
    path: string,
    init: RequestInit,
  ): Promise<DevSessionBootstrap> {
    const response = await fetch(path, init);
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
    if (!response.ok) {
      throw payload;
    }
    return payload as DevSessionBootstrap;
  }

  private hydrateFromBootstrap(
    bootstrap: DevSessionBootstrap,
    options: {
      connectStreams?: boolean;
      reconnectGateway?: boolean;
      source?: string;
    } = {},
  ): void {
    const connectStreams = options.connectStreams ?? true;
    const reconnectGateway = options.reconnectGateway ?? true;
    const source = options.source ?? "dev-bootstrap";
    this.currentSession = {
      sessionId: bootstrap.session.sessionId,
      shortCode: bootstrap.session.shortCode,
      gameId: bootstrap.session.gameId,
      seed: bootstrap.session.seed ?? null,
    };
    this.seedValue = String(this.currentSession.seed ?? 1337);
    this.store.getState().hydrateBootstrap(bootstrap, this.config.userId);
    if (bootstrap.selectedPlayerId) {
      this.storage.persistSelectedPlayerId(bootstrap.selectedPlayerId);
    }
    if (connectStreams) {
      this.store
        .getState()
        .connect(
          this.currentSession.sessionId,
          this.config.userId,
          bootstrap.gameplay && bootstrap.selectedPlayerId
            ? { source, playerId: bootstrap.selectedPlayerId }
            : { source },
        );
    }
    if (reconnectGateway && this.iframeLoaded) {
      this.connectGateway();
    }
  }

  private async switchPlayerFromBootstrap(playerId: string): Promise<void> {
    const requestId = ++this.playerSwitchRequestId;
    try {
      const bootstrap = await this.loadBootstrapFromDevServer(playerId);
      if (requestId !== this.playerSwitchRequestId) {
        return;
      }
      this.assertSwitchBootstrapMatchesPlayer(bootstrap, playerId);
      this.clearRuntimeError();
      this.hydrateFromBootstrap(bootstrap, {
        connectStreams: false,
        reconnectGateway: false,
      });
      if (bootstrap.gameplay && bootstrap.selectedPlayerId) {
        this.store.getState().switchPlayer(playerId);
      }
      this.notify();
    } catch (error) {
      if (requestId !== this.playerSwitchRequestId) {
        return;
      }
      this.logger.error(
        "[DevHost] Failed to switch player:",
        error instanceof Error ? error.message : String(error),
      );
      this.setRuntimeError(
        convertProblemDetailsToRuntimeError(
          error,
          `Failed to switch to ${playerId}.`,
        ),
      );
    }
  }

  private assertSwitchBootstrapMatchesPlayer(
    bootstrap: DevSessionBootstrap,
    playerId: string,
  ): void {
    if (bootstrap.session.phase !== "gameplay") {
      return;
    }
    if (bootstrap.selectedPlayerId !== playerId) {
      throw new Error(
        `Switch bootstrap selected ${bootstrap.selectedPlayerId ?? "<none>"} instead of ${playerId}.`,
      );
    }
    if (bootstrap.gameplay?.playerId !== playerId) {
      throw new Error(
        `Switch bootstrap gameplay snapshot is for ${bootstrap.gameplay?.playerId ?? "<none>"} instead of ${playerId}.`,
      );
    }
  }
}

type ApiErrorPayload = {
  title?: string;
  detail?: string;
  status?: number;
  requestId?: string;
  violations?: Array<{
    message?: string;
    field?: string;
    code?: string;
  }>;
};

/**
 * Convert a backend `ProblemDetails` (or an opaque error object) into the
 * structured shape the dev host overlay renders. We surface every violation
 * intentionally — when a reducer `initialize` throws, the JS stack lives in
 * the second violation entry, so collapsing them into a single string would
 * lose the file and line information we just went to the trouble of
 * preserving in `JsExecutor.jsRejectionToException`.
 */
function convertProblemDetailsToRuntimeError(
  error: unknown,
  fallbackMessage: string,
): DevHostRuntimeError {
  const payload = (error ?? {}) as ApiErrorPayload;
  const violations = (payload.violations ?? [])
    .filter((violation) => typeof violation?.message === "string")
    .map((violation) => ({
      message: violation.message as string,
      field: typeof violation.field === "string" ? violation.field : undefined,
      code: typeof violation.code === "string" ? violation.code : undefined,
    }));

  const title = payload.title?.trim() || "Game failed to start";
  const summary =
    payload.detail?.trim() ||
    (error instanceof Error ? error.message : fallbackMessage);

  return {
    title,
    summary,
    violations,
    correlationId: payload.requestId,
  };
}
