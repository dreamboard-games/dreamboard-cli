import { beforeEach, expect, mock, test } from "bun:test";

mock.restore();

const createSession = mock(async () => ({
  data: null,
  error: null,
}));

const getSessionStatus = mock(async () => ({
  data: {
    sessionId: "session-1",
    shortCode: "ABCD",
    gameId: "game-1",
    hostUserId: "user-1",
    phase: "gameplay" as const,
    status: "active" as const,
    seats: [
      {
        playerId: "player-1",
        controllerUserId: "user-1",
        displayName: "Player 1",
      },
      {
        playerId: "player-2",
        controllerUserId: "user-1",
        displayName: "Player 2",
      },
    ],
    canStart: false,
  },
  error: null,
}));
const startGame = mock(async () => ({
  data: {
    gameId: "game-1",
  },
  error: null,
}));
const submitInput = mock(async () => ({
  error: null,
}));
const validateInput = mock(async () => ({
  data: {
    valid: true,
    errorCode: null,
    message: null,
  },
  error: null,
}));
const restoreHistory = mock(async () => ({
  error: null,
}));

let lastGatewayConfig: {
  onAction: (
    playerId: string,
    actionType: string,
    params: Record<string, unknown>,
  ) => Promise<void>;
  onPromptResponse: (
    playerId: string,
    promptId: string,
    response: unknown,
  ) => Promise<void>;
  onWindowAction: (
    playerId: string,
    windowId: string,
    actionType: string,
    params?: Record<string, unknown>,
  ) => Promise<void>;
  onValidateAction: (
    playerId: string,
    actionType: string,
    params: Record<string, unknown>,
  ) => Promise<{
    valid: boolean;
    errorCode?: string;
    message?: string;
  }>;
  onReady: () => void;
} | null = null;

class MockPluginSessionGateway {
  constructor(config: typeof lastGatewayConfig) {
    lastGatewayConfig = config;
  }

  connect(): void {
    lastGatewayConfig?.onReady();
  }

  disconnect(): void {}

  attachStore(): void {}
}

mock.module("@dreamboard/api-client", () => ({
  createSession,
  getSessionStatus,
  restoreHistory,
  startGame,
  submitInput,
  validateInput,
}));

mock.module("@dreamboard/ui-host-runtime/runtime", () => ({
  PluginSessionGateway: MockPluginSessionGateway,
}));

Object.assign(globalThis, {
  window: {
    setTimeout: mock(() => 1),
    clearTimeout: mock(() => undefined),
  },
});

const { DevHostController } = await import("./dev-host-controller.ts");

function createStore() {
  const state = {
    connectionError: null,
    phase: "idle",
    error: null,
    identity: null as {
      sessionId: string;
      shortCode: string;
      gameId: string;
    } | null,
    lobby: {
      seats: [] as Array<Record<string, unknown>>,
      canStart: false,
      hostUserId: "",
    },
    gameplay: {
      currentPhase: null as string | null,
      controllablePlayerIds: [] as string[],
      controllingPlayerId: "",
      availableActions: [] as Array<Record<string, unknown>>,
      prompts: [] as Array<Record<string, unknown>>,
      windows: [] as Array<Record<string, unknown>>,
      seatViewsByPlayerId: {} as Record<string, unknown>,
    },
    history: null,
    notifications: [],
    syncId: 1,
    isConnected: true,
    userId: "user-1" as string | null,
    setLoading: mock(() => {
      state.phase = "loading";
    }),
    setLobby: mock((identity, lobby) => {
      state.identity = identity;
      state.lobby = lobby;
      state.phase = "lobby";
    }),
    setGameplay: mock((identity, gameplay, preservedLobby) => {
      state.identity = identity;
      state.gameplay = gameplay;
      state.lobby = preservedLobby ?? state.lobby;
      state.phase = "gameplay";
    }),
    setEnded: mock((identity) => {
      state.identity = identity;
      state.phase = "ended";
    }),
    setError: mock((error: string) => {
      state.error = error;
      state.phase = "error";
    }),
    enqueueActionRejected: mock(() => undefined),
    connect: mock(() => undefined),
    switchPlayer: mock((playerId: string) => {
      state.gameplay.controllingPlayerId = playerId;
    }),
    reset: mock(() => undefined),
    disconnect: mock(() => undefined),
    onStateAck: mock(() => undefined),
    markNotificationRead: mock(() => undefined),
    getPluginSnapshot: () => ({
      game: null,
      view: null,
      gameplay: {
        currentPhase: state.gameplay.currentPhase,
        availableActions: [],
        prompts: [],
        windows: [],
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
    subscribe: mock(() => () => undefined),
  };
}

function createStorage() {
  return {
    loadActiveSession: mock(() => null),
    persistActiveSession: mock(() => undefined),
    loadSidebarOpen: mock(() => false),
    persistSidebarOpen: mock(() => undefined),
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
  getSessionStatus.mockClear();
  createSession.mockClear();
  startGame.mockClear();
  submitInput.mockClear();
  validateInput.mockClear();
  restoreHistory.mockClear();
  lastGatewayConfig = null;
});

test("initialize uses the dev auth token for session status requests", async () => {
  const store = createStore();
  const storage = createStorage();
  const controller = new DevHostController(
    store as never,
    storage as never,
    {
      autoStartGame: false,
      authToken: "token-123",
      compiledResultId: "compiled-1",
      debug: false,
      gameId: "game-1",
      seed: 1337,
      sessionId: "session-1",
      shortCode: "ABCD",
      setupProfileId: null,
      slug: "test-game",
      userId: "user-1",
    },
    createLogger() as never,
  );

  await controller.initialize();

  expect(getSessionStatus).toHaveBeenCalledWith({
    path: { sessionId: "session-1" },
    headers: { Authorization: "Bearer token-123" },
  });
  expect(store.getState().connect).toHaveBeenCalledWith("session-1", "user-1");
});

test("initialize treats all seats as controllable when local dev has no user id", async () => {
  const store = createStore();
  store.getState().userId = null;
  const storage = createStorage();
  const controller = new DevHostController(
    store as never,
    storage as never,
    {
      autoStartGame: false,
      authToken: null,
      compiledResultId: "compiled-1",
      debug: false,
      gameId: "game-1",
      seed: 1337,
      sessionId: "session-1",
      shortCode: "ABCD",
      setupProfileId: null,
      slug: "test-game",
      userId: null,
    },
    createLogger() as never,
  );

  await controller.initialize();

  expect(store.getState().setGameplay).toHaveBeenCalledWith(
    {
      sessionId: "session-1",
      shortCode: "ABCD",
      gameId: "game-1",
    },
    expect.objectContaining({
      controllablePlayerIds: ["player-1", "player-2"],
      controllingPlayerId: "player-1",
    }),
    expect.objectContaining({
      seats: expect.any(Array),
    }),
  );
  expect(store.getState().connect).toHaveBeenCalledWith("session-1", null);
});

test("gateway actions and history restore forward the dev auth token", async () => {
  const store = createStore();
  const storage = createStorage();
  const controller = new DevHostController(
    store as never,
    storage as never,
    {
      autoStartGame: false,
      authToken: "token-123",
      compiledResultId: "compiled-1",
      debug: false,
      gameId: "game-1",
      seed: 1337,
      sessionId: "session-1",
      shortCode: "ABCD",
      setupProfileId: null,
      slug: "test-game",
      userId: "user-1",
    },
    createLogger() as never,
  );

  await controller.initialize();
  controller.setIframe({ contentWindow: {} } as HTMLIFrameElement);
  controller.onIframeLoad();

  expect(lastGatewayConfig).not.toBeNull();

  await lastGatewayConfig!.onAction("player-1", "takeTurn", { spice: 2 });
  expect(submitInput).toHaveBeenCalledWith({
    path: { sessionId: "session-1" },
    headers: { Authorization: "Bearer token-123" },
    body: {
      input: {
        kind: "action",
        playerId: "player-1",
        actionType: "takeTurn",
        params: JSON.stringify({ spice: 2 }),
      },
      expectedVersion: 0,
    },
  });

  await lastGatewayConfig!.onValidateAction("player-1", "takeTurn", {
    spice: 2,
  });
  expect(validateInput).toHaveBeenCalledWith({
    path: { sessionId: "session-1" },
    headers: { Authorization: "Bearer token-123" },
    body: {
      input: {
        kind: "action",
        playerId: "player-1",
        actionType: "takeTurn",
        params: JSON.stringify({ spice: 2 }),
      },
      expectedVersion: 0,
    },
  });

  await controller.restoreHistoryEntry("entry-1");
  expect(restoreHistory).toHaveBeenCalledWith({
    path: { sessionId: "session-1" },
    headers: { Authorization: "Bearer token-123" },
    body: { entryId: "entry-1" },
  });
});

test("gateway actions surface backend submission failures", async () => {
  submitInput.mockResolvedValueOnce({
    error: { detail: "backend rejected action" },
    response: { status: 400 },
  });

  const controller = new DevHostController(
    createStore() as never,
    createStorage() as never,
    {
      autoStartGame: false,
      authToken: "token-123",
      compiledResultId: "compiled-1",
      debug: false,
      gameId: "game-1",
      seed: 1337,
      sessionId: "session-1",
      shortCode: "ABCD",
      setupProfileId: null,
      slug: "test-game",
      userId: "user-1",
    },
    createLogger() as never,
  );

  await controller.initialize();
  controller.setIframe({ contentWindow: {} } as HTMLIFrameElement);
  controller.onIframeLoad();

  const error = await lastGatewayConfig!
    .onAction("player-1", "takeTurn", { spice: 2 })
    .catch((rejection) => rejection);

  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toBe("Failed to submit action");
  expect((error as Error & { errorCode?: string }).name).toBe(
    "SubmissionError",
  );
  expect((error as Error & { errorCode?: string }).errorCode).toBe("api-error");
});

test("gateway actions enqueue platform feedback for rejected submissions", async () => {
  submitInput.mockResolvedValueOnce({
    data: {
      accepted: false,
      errorCode: "INSUFFICIENT_COINS",
      message: "You cannot afford that wonder.",
    },
    error: null,
  });

  const store = createStore();
  const controller = new DevHostController(
    store as never,
    createStorage() as never,
    {
      autoStartGame: false,
      authToken: "token-123",
      compiledResultId: "compiled-1",
      debug: false,
      gameId: "game-1",
      seed: 1337,
      sessionId: "session-1",
      shortCode: "ABCD",
      setupProfileId: null,
      slug: "test-game",
      userId: "user-1",
    },
    createLogger() as never,
  );

  await controller.initialize();
  controller.setIframe({ contentWindow: {} } as HTMLIFrameElement);
  controller.onIframeLoad();

  const error = await lastGatewayConfig!
    .onAction("player-1", "buildWonder", { wonderId: "the-colossus" })
    .catch((rejection) => rejection);

  expect(store.getState().enqueueActionRejected).toHaveBeenCalledWith(
    "You cannot afford that wonder.",
    "player-1",
  );
  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toBe("You cannot afford that wonder.");
  expect((error as Error & { errorCode?: string }).errorCode).toBe(
    "INSUFFICIENT_COINS",
  );
});

test("both manual and automatic game starts forward the dev auth token", async () => {
  const store = createStore();
  const storage = createStorage();
  const controller = new DevHostController(
    store as never,
    storage as never,
    {
      autoStartGame: false,
      authToken: "token-123",
      compiledResultId: "compiled-1",
      debug: false,
      gameId: "game-1",
      seed: 1337,
      sessionId: "session-1",
      shortCode: "ABCD",
      setupProfileId: null,
      slug: "test-game",
      userId: "user-1",
    },
    createLogger() as never,
  );

  await controller.startGameFromSidebar();
  expect(startGame).toHaveBeenCalledWith({
    path: { sessionId: "session-1" },
    headers: { Authorization: "Bearer token-123" },
  });

  startGame.mockClear();
  (controller as any).waitForSseConnection = mock(async () => true);
  (controller as any).autoStartRequested = true;

  await (controller as any).autoStartGame();
  expect(startGame).toHaveBeenCalledWith({
    path: { sessionId: "session-1" },
    headers: { Authorization: "Bearer token-123" },
  });
});
