/// <reference lib="dom" />

import "./host-main.css";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Wrench, X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@dreamboard/ui/components/drawer";
import { client } from "@dreamboard/api-client/client.gen";
import {
  HostFeedbackToaster,
  HostHistoryNavigator,
  HostPlayerSwitcher,
  HostSessionMetadata,
  HostSessionToolbar,
  PerfOverlay,
  type HostControllablePlayer,
} from "@dreamboard/ui-host-runtime/components";
import {
  SSEManager,
  createUnifiedSessionStore,
} from "@dreamboard/ui-host-runtime/runtime";
import devConfig from "virtual:dreamboard-dev-config";
import {
  createDevDiagnosticsLogger,
  formatConsoleArgs,
  resolveDevDiagnosticsLevel,
  shouldRelayDevLog,
  stringifyForRelay,
  type DevLogEnvelope,
} from "./dev-diagnostics.js";
import {
  DevHostController,
  type DevHostRuntimeError,
} from "./dev-host-controller.js";
import {
  SessionStorageDevHostStorage,
  type ActiveSession,
} from "./dev-host-storage.js";

const diagnosticsLevel = resolveDevDiagnosticsLevel(devConfig.debug);
const devLogger = createDevDiagnosticsLogger(diagnosticsLevel);
const storage = new SessionStorageDevHostStorage(window.sessionStorage);
let runtimeDisposed = false;

const store = createUnifiedSessionStore({
  createSseManager: () =>
    new SSEManager({
      logger: {
        log: (...args: unknown[]) => {
          if (runtimeDisposed) {
            return;
          }
          devLogger.log(...args);
        },
        warn: (...args: unknown[]) => {
          if (runtimeDisposed) {
            return;
          }
          devLogger.warn(...args);
        },
        error: (...args: unknown[]) => {
          if (runtimeDisposed) {
            return;
          }
          devLogger.error(...args);
          controller.handleSseTransportError(args);
        },
      },
    }),
  logger: devLogger,
  fallbackToAllSeatsWhenUserIdMissing: !devConfig.userId,
});

const controller = new DevHostController(
  store,
  storage,
  {
    autoStartGame: devConfig.autoStartGame,
    compiledResultId: devConfig.compiledResultId,
    debug: devConfig.debug,
    fallbackSession: devConfig.initialSession,
    gameId: devConfig.gameId,
    playerCount: devConfig.playerCount,
    setupProfileId: devConfig.setupProfileId,
    slug: devConfig.slug,
    userId: devConfig.userId,
  },
  devLogger,
);

// The browser never sees the bearer token. All backend traffic is
// same-origin and the CLI's reverse-proxy middleware (`/api/*`) injects
// `Authorization: Bearer <fresh>` on the wire.
client.setConfig({ baseUrl: "" });
installProxyAuthErrorInterceptor();

const app = document.getElementById("app");
if (!(app instanceof HTMLElement)) {
  throw new Error("Missing root app container.");
}
const root = createRoot(app);

function installProxyAuthErrorInterceptor(): void {
  client.interceptors.response.use(async (response) => {
    if (response.status !== 401) {
      return response;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return response;
    }
    // Clone first so downstream handlers can still read the body.
    const clone = response.clone();
    let payload: { error?: unknown; message?: unknown } | null = null;
    try {
      payload = (await clone.json()) as typeof payload;
    } catch {
      return response;
    }
    if (payload?.error !== "session_invalid") {
      return response;
    }
    const detail =
      typeof payload.message === "string" && payload.message.length > 0
        ? payload.message
        : "Stored Dreamboard session is no longer valid.";
    controller.reportRuntimeError({
      title: "Session expired",
      summary: `${detail} Run \`dreamboard login\` in your terminal, then reload this page.`,
      violations: [],
    });
    return response;
  });
}

const restoreConsoleRelay = installConsoleRelay("host");
const removeWindowErrorRelay = installWindowErrorRelay("host");
installSseRelay();
window.addEventListener("message", handlePluginLogMessage);
window.addEventListener("pagehide", disposeHostRuntime);
window.addEventListener("beforeunload", disposeHostRuntime);

const unsubscribeStoreRender = store.subscribe(() => {
  render();
});
const unsubscribeControllerRender = controller.subscribe(() => {
  render();
});

void controller.initialize();

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    disposeHostRuntime();
  });
}

function render(): void {
  if (runtimeDisposed) {
    return;
  }

  const state = store.getState();
  const controllerState = controller.getSnapshot();
  const session = state.getPluginSnapshot().session;
  const controllablePlayers: HostControllablePlayer[] =
    session.controllablePlayerIds.map((playerId) => {
      const seat = state.lobby.seats.find(
        (entry) => entry.playerId === playerId,
      );
      return {
        playerId,
        displayName: seat?.displayName || playerId,
      };
    });
  const isHost =
    Boolean(devConfig.userId) && state.lobby.hostUserId === devConfig.userId;

  root.render(
    <DevHostApp
      session={controllerState.session}
      phase={state.phase}
      bootstrapStatus={state.bootstrap.status}
      isConnected={state.isConnected}
      connectionError={state.connectionError}
      runtimeError={controllerState.runtimeError}
      syncId={state.syncId}
      pluginReady={controllerState.pluginReady}
      controllablePlayers={controllablePlayers}
      controllingPlayerId={
        state.selectedPlayerId ?? session.controllingPlayerId
      }
      canStart={state.phase === "lobby" && state.lobby.canStart}
      isHost={isHost}
      history={state.history}
      hostFeedback={state.hostFeedback}
      notifications={state.notifications}
      iframeSrc={controllerState.iframeSrc}
      seedValue={controllerState.seedValue}
      isCreatingSession={controllerState.isCreatingSession}
      onSeedChange={(value) => controller.setSeedValue(value)}
      onCreateSession={() => void controller.createNewSession()}
      onStartGame={() => void controller.startGameFromSidebar()}
      onSwitchPlayer={(playerId) => controller.switchPlayer(playerId)}
      onRestoreHistory={(entryId) => controller.restoreHistoryEntry(entryId)}
      onDismissHostFeedback={(feedbackId) =>
        store.getState().dismissHostFeedback(feedbackId)
      }
      onReadNotification={(notificationId) =>
        store.getState().markNotificationRead(notificationId)
      }
      onDismissRuntimeError={() => controller.dismissRuntimeError()}
      onIframeReady={(element) => {
        controller.setIframe(element);
      }}
      onIframeLoad={() => {
        controller.onIframeLoad();
      }}
    />,
  );
}

type DevHostAppProps = {
  session: ActiveSession;
  phase: string;
  bootstrapStatus: "loading" | "lobby" | "renderable" | "error";
  isConnected: boolean;
  connectionError: string | null;
  runtimeError: DevHostRuntimeError | null;
  syncId: number;
  pluginReady: boolean;
  controllablePlayers: HostControllablePlayer[];
  controllingPlayerId: string | null;
  canStart: boolean;
  isHost: boolean;
  history: ReturnType<typeof store.getState>["history"];
  hostFeedback: ReturnType<typeof store.getState>["hostFeedback"];
  notifications: ReturnType<typeof store.getState>["notifications"];
  iframeSrc: string;
  seedValue: string;
  isCreatingSession: boolean;
  onSeedChange: (value: string) => void;
  onCreateSession: () => void;
  onStartGame: () => void;
  onSwitchPlayer: (playerId: string) => void;
  onRestoreHistory: (entryId: string) => Promise<void>;
  onDismissHostFeedback: (feedbackId: string) => void;
  onReadNotification: (notificationId: string) => void;
  onDismissRuntimeError: () => void;
  onIframeReady: (element: HTMLIFrameElement | null) => void;
  onIframeLoad: () => void;
};

function DevHostApp({
  session,
  phase,
  bootstrapStatus,
  isConnected,
  connectionError,
  runtimeError,
  syncId,
  pluginReady,
  controllablePlayers,
  controllingPlayerId,
  canStart,
  isHost,
  history,
  hostFeedback,
  notifications,
  iframeSrc,
  seedValue,
  isCreatingSession,
  onSeedChange,
  onCreateSession,
  onStartGame,
  onSwitchPlayer,
  onRestoreHistory,
  onDismissHostFeedback,
  onReadNotification,
  onDismissRuntimeError,
  onIframeReady,
  onIframeLoad,
}: DevHostAppProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    storage.loadSidebarOpen(),
  );
  const needsBootstrap = phase !== "error" && bootstrapStatus === "loading";

  const handleToggleSidebar = (open: boolean) => {
    setIsSidebarOpen(open);
    storage.persistSidebarOpen(open);
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-transparent font-sans text-foreground">
      <HostFeedbackToaster
        feedback={hostFeedback}
        notifications={notifications}
        onDismiss={onDismissHostFeedback}
        onReadNotification={onReadNotification}
      />
      <main className="absolute inset-0 z-0 flex flex-col bg-transparent">
        <iframe
          ref={onIframeReady}
          src={iframeSrc}
          referrerPolicy="no-referrer"
          title="Dreamboard UI Plugin"
          className="h-full w-full flex-1 border-0 bg-background"
          onLoad={onIframeLoad}
        />
        {needsBootstrap ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#f7f1da]/92 px-6 text-center backdrop-blur-[2px]">
            <div className="max-w-md border-[3px] border-border bg-white px-5 py-4 shadow-[6px_6px_0px_0px_#2d2d2d] wobbly-border-lg">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Dev Host
              </p>
              <h2 className="mt-2 text-xl font-display text-foreground">
                Waiting for session bootstrap
              </h2>
              <p className="mt-3 text-sm font-medium text-foreground">
                Attaching to{" "}
                <span className="font-bold">{session.shortCode}</span> (
                {session.sessionId}).
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                The host will create a fresh session automatically if the
                current one cannot finish bootstrapping.
              </p>
              {connectionError ? (
                <p className="mt-3 border-[2px] border-border bg-[#ffe1d6] px-3 py-2 text-sm font-bold text-foreground wobbly-border">
                  {connectionError}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        {runtimeError ? (
          <RuntimeErrorOverlay
            error={runtimeError}
            onDismiss={onDismissRuntimeError}
          />
        ) : null}
      </main>

      <Drawer
        open={isSidebarOpen}
        onOpenChange={handleToggleSidebar}
        direction="left"
      >
        {!isSidebarOpen ? (
          <DrawerTrigger asChild>
            <button
              type="button"
              className="absolute left-4 top-4 z-50 flex items-center gap-2 border-[3px] border-border bg-[#fff9c4] px-4 py-2 text-sm font-bold shadow-[4px_4px_0px_0px_#2d2d2d] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#ffe566] hover:shadow-[2px_2px_0px_0px_#2d2d2d] wobbly-border-md"
            >
              <Wrench className="h-4 w-4" />
              Dev Tools
            </button>
          </DrawerTrigger>
        ) : null}

        <DrawerContent className="dev-drawer-content h-full w-[380px] max-w-[calc(100vw-1rem)] border-r-[3px] border-border p-0 shadow-[12px_0px_28px_rgba(0,0,0,0.18)] backdrop-blur-md">
          <div className="dev-drawer-surface flex h-full flex-col overflow-hidden">
            <DrawerHeader className="dev-drawer-header relative overflow-hidden border-b-[3px] border-border px-5 pb-5 pt-4 shadow-[0_4px_0_0_#2d2d2d]">
              <div className="dev-drawer-tape absolute inset-x-0 top-0 h-3" />
              <div className="dev-drawer-highlight absolute -right-8 top-6 h-16 w-24 rotate-12" />
              <DrawerDescription className="sr-only">
                Developer controls for the local Dreamboard host session.
              </DrawerDescription>
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="dev-drawer-label mb-3 inline-block -rotate-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] wobbly-border">
                    Dreamboard Dev Host
                  </p>
                  <DrawerTitle className="truncate pr-2 text-2xl font-display text-foreground rotate-1">
                    {devConfig.slug}
                  </DrawerTitle>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="dev-drawer-session-pill inline-flex max-w-full -rotate-1 items-center gap-2 border-[2px] border-border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] shadow-[2px_2px_0px_0px_#2d2d2d] wobbly-border-md">
                      <span className="dev-drawer-session-dot h-2.5 w-2.5 rounded-full border border-border" />
                      <span className="truncate">{session.shortCode}</span>
                    </div>
                    <StatusPill
                      label={describePhase(phase, isConnected, pluginReady)}
                    />
                    <div className="dev-drawer-note inline-flex items-center border border-border/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] wobbly-border">
                      Sync {syncId}
                    </div>
                  </div>
                </div>
                <DrawerClose asChild>
                  <button
                    type="button"
                    className="dev-drawer-close relative z-10 border-[2px] border-border p-1.5 shadow-[2px_2px_0px_0px_#2d2d2d] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#2d2d2d] wobbly-border"
                    title="Hide Dev Tools"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto px-4 pb-5 pt-4">
              <div className="space-y-4">
                <section className="dev-drawer-card relative overflow-hidden border-[3px] border-border p-4 shadow-[5px_5px_0px_0px_#2d2d2d] wobbly-border-lg -rotate-[0.6deg]">
                  <div className="dev-drawer-label absolute -top-2 left-8 h-5 w-20 -rotate-3 border border-border/10 opacity-90" />
                  <p className="dev-drawer-card-title mb-3 border-b-2 border-dashed border-border/25 pb-2 text-sm font-bold uppercase tracking-[0.18em]">
                    Session
                  </p>
                  <HostSessionMetadata
                    gameId={session.gameId}
                    sessionId={session.sessionId}
                    shortCode={session.shortCode}
                  />
                  <div className="dev-drawer-note mt-4 rounded-2xl border border-border/20 px-3 py-2 text-sm font-bold">
                    Backend: {devConfig.apiBaseUrl}
                  </div>
                </section>

                <section className="dev-drawer-controls-card relative overflow-hidden border-[3px] border-border p-4 shadow-[5px_5px_0px_0px_#2d2d2d] wobbly-border-lg rotate-[0.4deg]">
                  <div className="absolute -top-3 right-4 h-6 w-6 rounded-full border-[3px] border-border bg-primary shadow-[2px_2px_0px_0px_#2d2d2d]" />
                  <p className="dev-drawer-card-title mb-4 border-b-2 border-dashed border-border/25 pb-2 text-sm font-bold uppercase tracking-[0.18em]">
                    Controls
                  </p>
                  <div className="space-y-3">
                    <label
                      className="block text-sm font-bold text-foreground"
                      htmlFor="seed-input"
                    >
                      Seed
                    </label>
                    <input
                      id="seed-input"
                      type="number"
                      inputMode="numeric"
                      className="dev-drawer-input w-full border-[3px] border-border px-3 py-2 text-sm font-bold font-sans outline-none transition focus:ring-2 focus:ring-primary/20 wobbly-border"
                      value={seedValue}
                      onChange={(event) => onSeedChange(event.target.value)}
                    />
                    <button
                      type="button"
                      className="dev-drawer-primary-button w-full border-[3px] border-border px-4 py-2 text-sm font-bold shadow-[3px_3px_0px_0px_#2d2d2d] transition-all hover:opacity-90 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 wobbly-border"
                      disabled={isCreatingSession}
                      onClick={onCreateSession}
                    >
                      {isCreatingSession ? "Creating..." : "New Session"}
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {canStart ? (
                      <button
                        type="button"
                        className="dev-drawer-danger-button w-full border-[3px] border-border px-4 py-2 text-sm font-bold shadow-[3px_3px_0px_0px_#2d2d2d] transition-all active:translate-x-[3px] active:translate-y-[3px] active:shadow-none wobbly-border"
                        onClick={onStartGame}
                      >
                        Start Game
                      </button>
                    ) : null}
                    <div className="dev-drawer-toolbar-shell rounded-[26px] border-[2px] border-dashed border-border/35 p-3">
                      <HostSessionToolbar className="justify-center flex-wrap gap-2">
                        <HostPlayerSwitcher
                          controllablePlayers={controllablePlayers}
                          controllingPlayerId={controllingPlayerId}
                          onSwitchPlayer={onSwitchPlayer}
                        />
                        <HostHistoryNavigator
                          isHost={isHost}
                          history={history}
                          onRestoreHistory={onRestoreHistory}
                        />
                      </HostSessionToolbar>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      <PerfOverlay />
    </div>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <div className="dev-drawer-note inline-flex items-center border border-border/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] wobbly-border">
      {label}
    </div>
  );
}

/**
 * Full-viewport overlay that surfaces runtime failures (e.g. reducer
 * `initialize` rejections, session-start 500s) to the game author instead of
 * burying them in the backend log. Each violation is rendered as its own
 * block so the JS stack trace — which the backend already parses into a
 * separate violation entry — stays readable with file/line detail intact.
 */
function RuntimeErrorOverlay({
  error,
  onDismiss,
}: {
  error: DevHostRuntimeError;
  onDismiss: () => void;
}) {
  const headlineViolation =
    error.violations.length > 0 ? error.violations[0] : null;
  const stackViolations = error.violations.slice(1);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#2d2d2d]/70 px-6 py-8 backdrop-blur-[2px]">
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden border-[3px] border-border bg-[#fff7e5] shadow-[8px_8px_0px_0px_#2d2d2d] wobbly-border-lg">
        <div className="flex items-start justify-between gap-4 border-b-[3px] border-border bg-[#ffd3d3] px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground/70">
              Runtime error
            </p>
            <h2 className="mt-1 text-2xl font-display text-foreground">
              {error.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 border-[2px] border-border bg-white p-1.5 shadow-[2px_2px_0px_0px_#2d2d2d] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#2d2d2d] wobbly-border"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(85vh-88px)] overflow-y-auto px-5 py-4">
          <p className="text-sm font-medium text-foreground">{error.summary}</p>
          {headlineViolation ? (
            <div className="mt-4 border-[2px] border-border bg-white px-3 py-2 wobbly-border">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {headlineViolation.code ?? "message"}
                {headlineViolation.field ? ` · ${headlineViolation.field}` : ""}
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm font-bold text-foreground">
                {headlineViolation.message}
              </p>
            </div>
          ) : null}
          {stackViolations.length > 0 ? (
            <details className="mt-4" open>
              <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/70">
                Stack trace
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto border-[2px] border-border bg-[#1f1f1f] p-3 text-[11px] leading-relaxed text-[#f8f8f2] wobbly-border">
                {stackViolations
                  .map((violation) => violation.message)
                  .join("\n")}
              </pre>
            </details>
          ) : null}
          {error.correlationId ? (
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Request ID · {error.correlationId}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function installSseRelay(): void {
  let lastLoggedEventId = 0;
  store.subscribe((state) => {
    const nextEntries = state.sseEvents.filter(
      (entry) => entry.id > lastLoggedEventId,
    );
    if (nextEntries.length === 0) {
      return;
    }

    for (const entry of nextEntries) {
      lastLoggedEventId = entry.id;
      relayBrowserLog({
        source: "sse",
        level: "info",
        message: devConfig.debug
          ? `${entry.data.type} ${stringifyForRelay(entry.data)}`
          : `${entry.data.type} toUser=${entry.data.toUser ?? "-"}`,
      });
    }
  });
}

function installConsoleRelay(source: "host"): () => void {
  const original = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

  console.log = (...args: unknown[]) => {
    original.log(...args);
    relayBrowserLog({
      source,
      level: "log",
      message: formatConsoleArgs(args),
    });
  };
  console.warn = (...args: unknown[]) => {
    original.warn(...args);
    relayBrowserLog({
      source,
      level: "warn",
      message: formatConsoleArgs(args),
    });
  };
  console.error = (...args: unknown[]) => {
    original.error(...args);
    relayBrowserLog({
      source,
      level: "error",
      message: formatConsoleArgs(args),
    });
  };

  return () => {
    console.log = original.log;
    console.warn = original.warn;
    console.error = original.error;
  };
}

function installWindowErrorRelay(source: "host"): () => void {
  const onError = (event: ErrorEvent) => {
    if (runtimeDisposed || shouldIgnoreBrowserError(event.error)) {
      return;
    }
    relayBrowserLog({
      source,
      level: "error",
      message: `window.error ${event.message}`,
    });
  };
  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (runtimeDisposed || shouldIgnoreBrowserError(event.reason)) {
      return;
    }
    relayBrowserLog({
      source,
      level: "error",
      message: `unhandledrejection ${stringifyForRelay(event.reason)}`,
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}

function handlePluginLogMessage(event: MessageEvent): void {
  if (!controller.matchesPluginWindow(event.source)) {
    return;
  }

  const payload = event.data as Partial<DevLogEnvelope> & { type?: string };
  if (
    !payload ||
    typeof payload !== "object" ||
    payload.type !== "dreamboard-dev-console"
  ) {
    return;
  }

  relayBrowserLog({
    source: "plugin",
    level:
      payload.level === "warn" ||
      payload.level === "error" ||
      payload.level === "log"
        ? payload.level
        : "log",
    message:
      typeof payload.message === "string"
        ? payload.message
        : stringifyForRelay(payload.message),
  });
}

function relayBrowserLog(payload: DevLogEnvelope): void {
  if (runtimeDisposed || !shouldRelayDevLog(diagnosticsLevel, payload)) {
    return;
  }

  void fetch("/__dreamboard_dev/log", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Ignore log relay failures to avoid recursive console noise.
  });
}

function disposeHostRuntime(): void {
  if (runtimeDisposed) {
    return;
  }

  runtimeDisposed = true;
  removeWindowErrorRelay();
  restoreConsoleRelay();
  window.removeEventListener("message", handlePluginLogMessage);
  window.removeEventListener("pagehide", disposeHostRuntime);
  window.removeEventListener("beforeunload", disposeHostRuntime);
  unsubscribeStoreRender();
  unsubscribeControllerRender();
  controller.dispose();
  root.unmount();
}

function shouldIgnoreBrowserError(value: unknown): boolean {
  return value instanceof Error && value.name === "AbortError";
}

function describePhase(
  phase: string,
  isConnected: boolean,
  isPluginReady: boolean,
): string {
  if (phase === "error") {
    return "Error";
  }
  if (!isConnected) {
    return "Connecting SSE";
  }
  if (!isPluginReady) {
    return "Loading iframe";
  }
  return phase === "gameplay" ? "Live gameplay" : phase;
}
