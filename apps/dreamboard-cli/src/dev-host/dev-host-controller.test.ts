import { beforeEach, expect, mock, test } from "bun:test";

mock.restore();

const submitPlayerAction = mock(async () => ({
  data: {
    accepted: true,
    version: 1,
    actionSetVersion: "1:test",
  },
  error: null,
}));
const validatePlayerAction = mock(async () => ({
  data: {
    valid: true,
    version: 0,
    actionSetVersion: "0:test",
    errorCode: null,
    message: null,
  },
  error: null,
}));
const restoreHistory = mock(async () => ({
  error: null,
}));

let attachStoreCalls = 0;
let lastGatewayConfig: {
  onInteraction: (
    playerId: string,
    interactionId: string,
    params: Record<string, unknown>,
    meta?: { clientActionId?: string },
  ) => Promise<void>;
  onValidateInteraction: (
    playerId: string,
    interactionId: string,
    params: Record<string, unknown>,
  ) => Promise<{
    valid: boolean;
    errorCode?: string;
    message?: string;
  }>;
  onReady: () => void;
  onSwitchPlayer: (playerId: string) => void;
} | null = null;

class MockPluginSessionGateway {
  constructor(config: typeof lastGatewayConfig) {
    lastGatewayConfig = config;
  }

  connect(): void {
    lastGatewayConfig?.onReady();
  }

  disconnect(): void {}

  attachStore(): void {
    attachStoreCalls += 1;
  }
}

mock.module("@dreamboard/api-client", () => ({
  restoreHistory,
  submitPlayerAction,
  validatePlayerAction,
}));

mock.module("@dreamboard/ui-host-runtime/runtime", () => ({
  PluginSessionGateway: MockPluginSessionGateway,
  PERF_MARK_NAMES: {
    T2_HTTP_SENT: "t2_http_sent",
    T3_HTTP_RESPONSE: "t3_http_response",
  },
  recordMark: mock(() => undefined),
  correlateVersion: mock(() => undefined),
}));

const fetchMock = mock(async () => new Response(null, { status: 204 }));
globalThis.fetch = fetchMock as unknown as typeof fetch;

const { DevHostController } = await import("./dev-host-controller.ts");

type ControllerConfig = ConstructorParameters<typeof DevHostController>[2];

function baseControllerConfig(
  overrides: Partial<ControllerConfig> = {},
): ControllerConfig {
  return {
    autoStartGame: false,
    compiledResultId: "compiled-1",
    debug: false,
    fallbackSession: {
      sessionId: "session-1",
      shortCode: "ABCD",
      gameId: "game-1",
      seed: 1337,
    },
    gameId: "game-1",
    playerCount: 4,
    setupProfileId: null,
    slug: "test-game",
    userId: "user-1",
    ...overrides,
  };
}

function gameplayBootstrap(
  overrides: Record<string, unknown> = {},
  playerId = "player-1",
) {
  return {
    session: {
      sessionId: "session-1",
      shortCode: "ABCD",
      gameId: "game-1",
      hostUserId: "user-1",
      phase: "gameplay",
      status: "active",
      seed: 1337,
    },
    lobby: {
      seats: [
        {
          playerId: "player-1",
          controllerUserId: "user-1",
          displayName: "Player 1",
          playerColor: "#E53935",
          isHost: true,
        },
        {
          playerId: "player-2",
          controllerUserId: "user-1",
          displayName: "Player 2",
          playerColor: "#1E88E5",
          isHost: false,
        },
      ],
      canStart: false,
      hostUserId: "user-1",
    },
    control: { switchablePlayerIds: ["player-1", "player-2"] },
    history: {
      entries: [],
      currentIndex: -1,
      canGoBack: false,
      canGoForward: false,
    },
    selectedPlayerId: playerId,
    gameplay: {
      playerId,
      version: 0,
      actionSetVersion: "0:test",
      activePlayers: [playerId],
      currentPhase: "main",
      currentStage: null,
      stageSeats: [playerId],
      view: JSON.stringify({ hand: [], playerId }),
      availableInteractions: [],
      zones: {},
      boardStatic: null,
      boardStaticHash: null,
    },
    ...overrides,
  };
}

function createStore() {
  const calls: string[] = [];
  const listeners = new Set<(state: any, previous: any) => void>();
  type BootstrapStatus = "loading" | "lobby" | "renderable" | "error";
  const state = {
    bootstrap: { status: "loading" as BootstrapStatus },
    connectionError: null,
    phase: "idle",
    error: null,
    identity: null as {
      sessionId: string;
      shortCode: string;
      gameId: string;
    } | null,
    selectedPlayerId: null as string | null,
    lobby: {
      seats: [] as Array<Record<string, unknown>>,
      canStart: false,
      hostUserId: "",
    },
    gameplay: {
      version: 0,
      actionSetVersion: "0:test",
      currentPhase: null as string | null,
      controllablePlayerIds: [] as string[],
      controllingPlayerId: "",
      view: null as unknown,
      availableInteractions: [] as Array<Record<string, unknown>>,
      boardStaticHash: null as string | null,
    },
    history: null as unknown,
    notifications: [],
    syncId: 0,
    isConnected: false,
    userId: "user-1" as string | null,
    _calls: calls,
    setLoading: mock(() => {
      calls.push("setLoading");
      state.phase = "loading";
      state.bootstrap = { status: "loading" };
    }),
    setError: mock((error: string) => {
      calls.push("setError");
      state.error = error;
      state.phase = "error";
      state.bootstrap = { status: "error" };
    }),
    hydrateBootstrap: mock(
      (bootstrap: ReturnType<typeof gameplayBootstrap>) => {
        calls.push("hydrateBootstrap");
        const previous = { ...state };
        state.bootstrap = {
          status: bootstrap.gameplay ? "renderable" : "lobby",
        };
        state.phase = bootstrap.session.phase;
        state.identity = {
          sessionId: bootstrap.session.sessionId,
          shortCode: bootstrap.session.shortCode,
          gameId: bootstrap.session.gameId,
        };
        state.selectedPlayerId = bootstrap.selectedPlayerId ?? null;
        state.lobby = bootstrap.lobby;
        state.history = bootstrap.history;
        state.gameplay = {
          ...state.gameplay,
          version: bootstrap.gameplay?.version ?? 0,
          actionSetVersion: bootstrap.gameplay?.actionSetVersion ?? "0:test",
          currentPhase: bootstrap.gameplay?.currentPhase ?? null,
          controllablePlayerIds: bootstrap.control.switchablePlayerIds,
          controllingPlayerId: bootstrap.selectedPlayerId ?? "",
          view: bootstrap.gameplay ? { hand: [] } : null,
        };
        state.syncId += 1;
        listeners.forEach((listener) => listener(state, previous));
      },
    ),
    connect: mock(() => {
      calls.push("connect");
      state.isConnected = true;
    }),
    switchPlayer: mock((playerId: string) => {
      state.selectedPlayerId = playerId;
    }),
    enqueueActionRejected: mock(() => undefined),
    applyGameplaySnapshotLocal: mock(() => undefined),
    reset: mock(() => {
      calls.push("reset");
    }),
    disconnect: mock(() => {
      calls.push("disconnect");
    }),
    closeStreams: mock(() => {
      calls.push("closeStreams");
    }),
    onStateAck: mock(() => undefined),
    markNotificationRead: mock(() => undefined),
    getPluginSnapshot: () => ({
      view: state.gameplay.view,
      gameplay: {
        currentPhase: state.gameplay.currentPhase,
        availableInteractions: [],
      },
      lobby: state.lobby,
      notifications: [],
      session: {
        sessionId: state.identity?.sessionId ?? null,
        controllablePlayerIds: state.gameplay.controllablePlayerIds,
        controllingPlayerId: state.gameplay.controllingPlayerId || null,
        userId: state.userId,
      },
      history: state.history,
      syncId: state.syncId,
    }),
  };

  return {
    getState: () => state,
    subscribe: mock(
      (
        listener: (state: typeof state, previousState: typeof state) => void,
      ) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    ),
  };
}

function createStorage() {
  return {
    loadSidebarOpen: mock(() => false),
    persistSidebarOpen: mock(() => undefined),
    loadSelectedPlayerId: mock(() => null),
    persistSelectedPlayerId: mock(() => undefined),
  };
}

function createLogger() {
  return {
    log: mock(() => undefined),
    warn: mock(() => undefined),
    error: mock(() => undefined),
  };
}

beforeEach(() => {
  submitPlayerAction.mockClear();
  validatePlayerAction.mockClear();
  restoreHistory.mockClear();
  fetchMock.mockClear();
  fetchMock.mockImplementation(async (input) => {
    const url = String(input);
    if (url === "/__dreamboard_dev/session/bootstrap") {
      return jsonResponse(gameplayBootstrap());
    }
    if (url === "/__dreamboard_dev/session/bootstrap?playerId=player-2") {
      return jsonResponse(gameplayBootstrap({}, "player-2"));
    }
    if (url === "/__dreamboard_dev/session/start") {
      return jsonResponse(gameplayBootstrap());
    }
    if (url === "/__dreamboard_dev/session/new") {
      return jsonResponse(
        gameplayBootstrap({
          session: {
            sessionId: "fresh-session",
            shortCode: "FRESH",
            gameId: "game-1",
            hostUserId: "user-1",
            phase: "gameplay",
            status: "active",
            seed: 42,
          },
        }),
      );
    }
    return new Response(null, { status: 404 });
  });
  attachStoreCalls = 0;
  lastGatewayConfig = null;
});

test("initialize hydrates from the local bootstrap endpoint before opening live streams", async () => {
  const store = createStore();
  const controller = new DevHostController(
    store as never,
    createStorage() as never,
    baseControllerConfig(),
    createLogger() as never,
  );

  await controller.initialize();

  expect(fetchMock).toHaveBeenCalledWith(
    "/__dreamboard_dev/session/bootstrap",
    { method: "GET" },
  );
  expect(store.getState()._calls).toEqual([
    "setLoading",
    "hydrateBootstrap",
    "connect",
  ]);
  expect(store.getState().disconnect).not.toHaveBeenCalled();
  expect(store.getState().connect).toHaveBeenCalledWith("session-1", "user-1", {
    source: "dev-bootstrap",
    playerId: "player-1",
  });
});

test("initialize preserves a stored player selection through HTTP bootstrap", async () => {
  const store = createStore();
  const storage = createStorage();
  storage.loadSelectedPlayerId.mockReturnValue("player-2");
  const controller = new DevHostController(
    store as never,
    storage as never,
    baseControllerConfig(),
    createLogger() as never,
  );

  await controller.initialize();

  expect(fetchMock).toHaveBeenCalledWith(
    "/__dreamboard_dev/session/bootstrap?playerId=player-2",
    { method: "GET" },
  );
  expect(store.getState().connect).toHaveBeenCalledWith("session-1", "user-1", {
    source: "dev-bootstrap",
    playerId: "player-2",
  });
  expect(storage.persistSelectedPlayerId).toHaveBeenCalledWith("player-2");
});

test("player switch hydrates from bootstrap before reconnecting gameplay stream", async () => {
  const store = createStore();
  const storage = createStorage();
  const controller = new DevHostController(
    store as never,
    storage as never,
    baseControllerConfig(),
    createLogger() as never,
  );

  await controller.initialize();
  controller.switchPlayer("player-2");
  await flushAsyncWork();

  expect(fetchMock).toHaveBeenCalledWith(
    "/__dreamboard_dev/session/bootstrap?playerId=player-2",
    { method: "GET" },
  );
  expect(store.getState()._calls).toEqual([
    "setLoading",
    "hydrateBootstrap",
    "connect",
    "hydrateBootstrap",
  ]);
  expect(store.getState().switchPlayer).toHaveBeenCalledWith("player-2");
  expect(store.getState().connect).toHaveBeenCalledTimes(1);
  expect(storage.persistSelectedPlayerId).toHaveBeenLastCalledWith("player-2");
});

test("failed player switch leaves previous renderable view intact", async () => {
  const store = createStore();
  const logger = createLogger();
  const controller = new DevHostController(
    store as never,
    createStorage() as never,
    baseControllerConfig(),
    logger as never,
  );

  await controller.initialize();
  const previousView = store.getState().gameplay.view;
  fetchMock.mockImplementationOnce(async () =>
    Response.json(
      { title: "Forbidden", detail: "Player not controlled" },
      { status: 403 },
    ),
  );

  controller.switchPlayer("player-2");
  await flushAsyncWork();

  expect(store.getState().gameplay.view).toBe(previousView);
  expect(store.getState().bootstrap.status).toBe("renderable");
  expect(store.getState().switchPlayer).not.toHaveBeenCalled();
  expect(logger.error).toHaveBeenCalled();
  expect(controller.getSnapshot().runtimeError).toEqual(
    expect.objectContaining({
      title: "Forbidden",
      summary: "Player not controlled",
    }),
  );
});

test("mismatched player switch bootstrap does not reconnect the previous player", async () => {
  const store = createStore();
  const logger = createLogger();
  const controller = new DevHostController(
    store as never,
    createStorage() as never,
    baseControllerConfig(),
    logger as never,
  );

  await controller.initialize();
  fetchMock.mockImplementationOnce(async () =>
    jsonResponse(gameplayBootstrap()),
  );

  controller.switchPlayer("player-2");
  await flushAsyncWork();

  expect(store.getState().switchPlayer).not.toHaveBeenCalled();
  expect(store.getState().connect).toHaveBeenCalledTimes(1);
  expect(store.getState().selectedPlayerId).toBe("player-1");
  expect(controller.getSnapshot().runtimeError).toEqual(
    expect.objectContaining({
      summary: "Switch bootstrap selected player-1 instead of player-2.",
    }),
  );
});

test("gateway attaches only after a renderable bootstrap exists", async () => {
  const store = createStore();
  const controller = new DevHostController(
    store as never,
    createStorage() as never,
    baseControllerConfig(),
    createLogger() as never,
  );

  controller.setIframe({ contentWindow: {} } as HTMLIFrameElement);
  controller.onIframeLoad();
  expect(attachStoreCalls).toBe(0);

  await controller.initialize();

  expect(attachStoreCalls).toBe(1);
});

test("manual start uses the local lifecycle endpoint and hydrates the returned bootstrap", async () => {
  const store = createStore();
  const controller = new DevHostController(
    store as never,
    createStorage() as never,
    baseControllerConfig(),
    createLogger() as never,
  );

  await controller.startGameFromSidebar();

  expect(fetchMock).toHaveBeenCalledWith("/__dreamboard_dev/session/start", {
    method: "POST",
    body: undefined,
    headers: undefined,
  });
  expect(store.getState().hydrateBootstrap).toHaveBeenCalled();
});

test("new session uses the local lifecycle endpoint and resets only for the explicit new-session action", async () => {
  const store = createStore();
  const controller = new DevHostController(
    store as never,
    createStorage() as never,
    baseControllerConfig(),
    createLogger() as never,
  );

  controller.setSeedValue("42");
  await controller.createNewSession();

  expect(fetchMock).toHaveBeenCalledWith("/__dreamboard_dev/session/new", {
    method: "POST",
    body: JSON.stringify({ seed: 42 }),
    headers: { "content-type": "application/json" },
  });
  expect(store.getState().reset).toHaveBeenCalled();
  expect(controller.getSnapshot().session).toEqual({
    sessionId: "fresh-session",
    shortCode: "FRESH",
    gameId: "game-1",
    seed: 42,
  });
});

test("gateway actions and history restore rely on proxy-managed auth", async () => {
  const store = createStore();
  const controller = new DevHostController(
    store as never,
    createStorage() as never,
    baseControllerConfig(),
    createLogger() as never,
  );

  await controller.initialize();
  controller.setIframe({ contentWindow: {} } as HTMLIFrameElement);
  controller.onIframeLoad();

  expect(lastGatewayConfig).not.toBeNull();

  await lastGatewayConfig!.onInteraction("player-1", "takeTurn", { spice: 2 });
  expect(submitPlayerAction).toHaveBeenCalledWith({
    path: {
      sessionId: "session-1",
      playerId: "player-1",
      interactionId: "takeTurn",
    },
    body: {
      expectedVersion: 0,
      actionSetVersion: "0:test",
      inputs: { spice: 2 },
    },
  });
  expect(submitPlayerAction.mock.calls[0]?.[0]).not.toHaveProperty("headers");

  await lastGatewayConfig!.onValidateInteraction("player-1", "takeTurn", {
    spice: 2,
  });
  expect(validatePlayerAction).toHaveBeenCalledWith({
    path: {
      sessionId: "session-1",
      playerId: "player-1",
      interactionId: "takeTurn",
    },
    body: {
      expectedVersion: 0,
      actionSetVersion: "0:test",
      inputs: { spice: 2 },
    },
  });
  expect(validatePlayerAction.mock.calls[0]?.[0]).not.toHaveProperty("headers");

  await controller.restoreHistoryEntry("entry-1");
  expect(restoreHistory).toHaveBeenCalledWith({
    path: { sessionId: "session-1" },
    body: { entryId: "entry-1" },
  });
  expect(restoreHistory.mock.calls[0]?.[0]).not.toHaveProperty("headers");
});

test("gateway actions apply accepted submitter snapshots locally", async () => {
  submitPlayerAction.mockResolvedValueOnce({
    data: {
      accepted: true,
      version: 1,
      actionSetVersion: "1:test",
      gameplay: {
        version: 1,
        actionSetVersion: "1:test",
        playerId: "player-1",
        activePlayers: ["player-1"],
        currentPhase: "main",
        currentStage: null,
        stageSeats: ["player-1"],
        view: "{}",
        availableInteractions: [],
        zones: {},
        boardStatic: null,
        boardStaticHash: null,
      },
    },
    error: null,
  });

  const store = createStore();
  const controller = new DevHostController(
    store as never,
    createStorage() as never,
    baseControllerConfig(),
    createLogger() as never,
  );

  await controller.initialize();
  controller.setIframe({ contentWindow: {} } as HTMLIFrameElement);
  controller.onIframeLoad();

  await lastGatewayConfig!.onInteraction("player-1", "takeTurn", {});

  expect(store.getState().applyGameplaySnapshotLocal).toHaveBeenCalledWith(
    expect.objectContaining({
      version: 1,
      playerId: "player-1",
      actionSetVersion: "1:test",
    }),
    undefined,
  );
});

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

async function flushAsyncWork(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
