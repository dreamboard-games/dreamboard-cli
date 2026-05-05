import { expect, mock, test } from "bun:test";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

mock.restore();

const actualApiClient = await import("@dreamboard/api-client");
const actualFs = await import("../utils/fs.js");
const SESSION_FILE_PATH =
  "/tmp/dreamboard-project/.dreamboard/dev/session.json";

const createSession = mock(async () => ({
  data: {
    sessionId: "fresh-session",
    shortCode: "fresh-code",
    gameId: "game-1",
  },
  error: null,
  response: { status: 200 },
}));
const getSessionBootstrap = mock(async () => ({
  data: {
    session: {
      sessionId: "cached-session",
      shortCode: "cached-code",
      gameId: "game-1",
      hostUserId: "user-1",
      status: "active" as const,
      phase: "gameplay" as const,
      setupProfileId: null,
    },
    lobby: {
      seats: [],
      canStart: false,
      hostUserId: "user-1",
    },
    control: { switchablePlayerIds: [] },
    history: null,
    selectedPlayerId: null,
    gameplay: null,
  },
  error: null,
}));
const resolveProjectContext = mock(async () => ({
  projectRoot: "/tmp/dreamboard-project",
  projectConfig: {
    gameId: "game-1",
    slug: "test-game",
  },
  config: {
    apiBaseUrl: "https://api.example.com",
    authToken: null,
  },
}));
const configureClient = mock(async () => undefined);
const actualFlags = await import("../flags.js");
const resolveSetupProfileSelectionForSession = mock(async () => ({
  id: null,
  name: null,
  source: "none" as const,
}));

const parseDevCommandArgs = mock((args: Record<string, unknown>) => ({
  debug: false,
  resume: undefined,
  "new-session": false,
  open: false,
  ...args,
}));
const ensureDir = mock(async (dirPath: string) => {
  await mkdir(dirPath, { recursive: true });
});
const exists = mock(async (filePath: string) => {
  if (filePath === SESSION_FILE_PATH) {
    return true;
  }
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
});
const readJsonFile = mock(async (filePath: string) =>
  filePath === SESSION_FILE_PATH
    ? {
        sessionId: "cached-session",
        shortCode: "cached-code",
        gameId: "game-1",
        seed: 7,
        compiledResultId: "compiled-result-1",
        createdAt: "2026-03-25T00:00:00.000Z",
        controllablePlayerIds: [],
        yourTurnCount: 0,
      }
    : JSON.parse(await readFile(filePath, "utf8")),
);
const writeJsonFile = mock(async (filePath: string, data: unknown) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
});
const resolvePlayerCount = mock(async () => 4);
const runDevPreflight = mock(async () => ({
  warnings: [],
  compiledResult: {
    id: "compiled-result-2",
  },
}));
const createSessionFromScenario = mock(async () => ({
  sessionId: "scenario-session",
  shortCode: "scenario-code",
  gameId: "game-1",
  seed: 2024,
  playerCount: 3,
  setupProfileId: "scenario-profile",
  scenarioId: "smoke-opening",
  phase: "play",
  stage: "main",
}));
const openBrowser = mock(() => undefined);
const startDreamboardDevServer = mock(async () => ({
  url: "http://localhost:5173/index.html",
  close: async () => undefined,
  server: {} as never,
}));
const consolaWarn = mock(() => undefined);
const consolaInfo = mock(() => undefined);
const consolaSuccess = mock(() => undefined);
const consoleLog = mock(() => undefined);
const originalConsoleLog = console.log;
console.log = consoleLog as typeof console.log;

mock.module("@dreamboard/api-client", () => ({
  ...actualApiClient,
  createSession,
  getSessionBootstrap,
}));

mock.module("../config/resolve.js", () => ({
  resolveProjectContext,
  configureClient,
}));

mock.module("../flags.js", () => ({
  ...actualFlags,
  parseDevCommandArgs,
}));

mock.module("../services/workflows/resolve-setup-profile.js", () => ({
  resolveSetupProfileSelectionForSession,
}));

mock.module("../utils/fs.js", () => ({
  ...actualFs,
  ensureDir,
  exists,
  readJsonFile,
  writeJsonFile,
}));

mock.module("../utils/player-count.js", () => ({
  resolvePlayerCount,
}));

mock.module("../services/workflows/dev-preflight.js", () => ({
  runDevPreflight,
}));

mock.module("../services/testing/reducer-native-test-harness.js", () => ({
  createSessionFromScenario,
}));

mock.module("../auth/auth-server.js", () => ({
  openBrowser,
}));

mock.module("../dev-host/start-dev-server.js", () => ({
  startDreamboardDevServer,
}));

mock.module("consola", () => ({
  default: {
    warn: consolaWarn,
    info: consolaInfo,
    success: consolaSuccess,
  },
}));

const devModule = await import("./dev.ts");
const devCommand = devModule.default;
const { waitForTermination } = devModule;

function resetMocks(): void {
  createSession.mockClear();
  getSessionBootstrap.mockClear();
  resolveProjectContext.mockClear();
  configureClient.mockClear();
  parseDevCommandArgs.mockClear();
  ensureDir.mockClear();
  exists.mockClear();
  readJsonFile.mockClear();
  writeJsonFile.mockClear();
  resolvePlayerCount.mockClear();
  runDevPreflight.mockClear();
  createSessionFromScenario.mockClear();
  resolveSetupProfileSelectionForSession.mockClear();
  openBrowser.mockClear();
  startDreamboardDevServer.mockClear();
  consolaWarn.mockClear();
  consolaInfo.mockClear();
  consolaSuccess.mockClear();
  consoleLog.mockClear();
}

async function runWithAutoTermination(
  args: Record<string, unknown>,
): Promise<void> {
  const originalOn = process.on;
  const originalOff = process.off;
  const originalExit = process.exit;
  const listeners = new Map<
    string | symbol,
    (...eventArgs: unknown[]) => void
  >();

  process.on = ((event, listener) => {
    listeners.set(event, listener as (...eventArgs: unknown[]) => void);
    if (event === "SIGTERM") {
      queueMicrotask(() => {
        listeners.get(event)?.();
      });
    }
    return process;
  }) as typeof process.on;

  process.off = ((event, listener) => {
    if (listeners.get(event) === listener) {
      listeners.delete(event);
    }
    return process;
  }) as typeof process.off;
  process.exit = mock((_code?: string | number | null | undefined) => {
    return undefined as never;
  }) as typeof process.exit;

  try {
    await devCommand.run({ args });
  } finally {
    process.on = originalOn;
    process.off = originalOff;
    process.exit = originalExit;
  }
}

test("waitForTermination exits after graceful signal cleanup", async () => {
  resetMocks();
  const close = mock(async () => undefined);
  const exitProcess = mock((_code: number) => undefined);

  const waiting = waitForTermination(close, {
    exitAfterShutdown: true,
    exitProcess,
  });
  process.emit("SIGINT");
  await waiting;

  expect(close).toHaveBeenCalledTimes(1);
  expect(exitProcess).toHaveBeenCalledWith(0);
  expect(consolaInfo).toHaveBeenCalledWith("Stopped local dev host (SIGINT).");
});

test("dev creates a fresh session by default instead of reusing cached state", async () => {
  resetMocks();

  await runWithAutoTermination({
    env: "local",
  });

  expect(getSessionBootstrap).not.toHaveBeenCalled();
  expect(consolaWarn).not.toHaveBeenCalled();
  expect(createSession).toHaveBeenCalledWith({
    path: { gameId: "game-1" },
    body: {
      compiledResultId: "compiled-result-2",
      seed: 1337,
      playerCount: 4,
      autoAssignSeats: true,
      setupProfileId: undefined,
    },
  });
  expect(writeJsonFile).toHaveBeenCalledWith(SESSION_FILE_PATH, {
    sessionId: "fresh-session",
  });
  expect(startDreamboardDevServer).toHaveBeenCalledWith(
    expect.objectContaining({
      runtimeConfig: expect.objectContaining({
        autoStartGame: true,
        initialSession: expect.objectContaining({
          sessionId: "fresh-session",
        }),
      }),
      config: expect.objectContaining({
        apiBaseUrl: "https://api.example.com",
      }),
    }),
  );
  const runtimeConfigArg =
    startDreamboardDevServer.mock.calls[0]?.[0].runtimeConfig;
  expect(runtimeConfigArg).not.toHaveProperty("authToken");
  expect(consolaInfo).toHaveBeenCalledWith(
    "Created session fresh-code (fresh-session).",
  );
  expect(consolaInfo).toHaveBeenCalledWith("Backend session id: fresh-session");
  expect(resolveSetupProfileSelectionForSession).toHaveBeenCalledWith({
    projectRoot: "/tmp/dreamboard-project",
    requestedSetupProfileId: undefined,
  });
  expect(resolveProjectContext).toHaveBeenCalledWith(
    expect.objectContaining({
      env: "local",
    }),
    { requireAuth: false },
  );
  expect(configureClient).toHaveBeenCalledWith(
    expect.objectContaining({
      apiBaseUrl: "https://api.example.com",
      authToken: null,
    }),
  );
  expect(consoleLog).toHaveBeenCalledWith(
    "\nOpen Dreamboard dev host:\nhttp://localhost:5173/index.html\n",
  );
});

test("dev reuses a compatible cached session when --resume is provided", async () => {
  resetMocks();
  readJsonFile.mockImplementationOnce(async () => ({
    sessionId: "cached-session",
    shortCode: "cached-code",
    gameId: "game-1",
    seed: 7,
    compiledResultId: "compiled-result-2",
    createdAt: "2026-03-25T00:00:00.000Z",
    controllablePlayerIds: [],
    yourTurnCount: 0,
  }));

  await runWithAutoTermination({
    env: "local",
    resume: "cached-session",
  });

  expect(getSessionBootstrap).toHaveBeenCalledWith({
    path: { sessionId: "cached-session" },
  });
  expect(createSession).not.toHaveBeenCalled();
  expect(consolaWarn).not.toHaveBeenCalled();
  expect(startDreamboardDevServer).toHaveBeenCalledWith(
    expect.objectContaining({
      runtimeConfig: expect.objectContaining({
        autoStartGame: false,
        initialSession: expect.objectContaining({
          sessionId: "cached-session",
        }),
      }),
    }),
  );
  expect(consolaInfo).toHaveBeenCalledWith(
    "Reusing session cached-code (cached-session).",
  );
  expect(consolaInfo).toHaveBeenCalledWith(
    "Backend session id: cached-session",
  );
  expect(consoleLog).toHaveBeenCalledWith(
    "\nOpen Dreamboard dev host:\nhttp://localhost:5173/index.html\n",
  );
});

test("dev resumes from backend bootstrap without trusting cached compiled metadata", async () => {
  resetMocks();

  await runWithAutoTermination({
    env: "local",
    resume: "cached-session",
  });

  expect(getSessionBootstrap).toHaveBeenCalledWith({
    path: { sessionId: "cached-session" },
  });
  expect(consolaWarn).not.toHaveBeenCalled();
  expect(createSession).not.toHaveBeenCalled();
  expect(writeJsonFile).toHaveBeenCalledWith(SESSION_FILE_PATH, {
    sessionId: "cached-session",
  });
});

test("dev resumes an explicitly requested lobby session", async () => {
  resetMocks();
  readJsonFile.mockImplementationOnce(async () => ({
    sessionId: "cached-session",
    shortCode: "cached-code",
    gameId: "game-1",
    seed: 7,
    compiledResultId: "compiled-result-2",
    createdAt: "2026-03-25T00:00:00.000Z",
    controllablePlayerIds: [],
    yourTurnCount: 0,
  }));
  getSessionBootstrap.mockResolvedValueOnce({
    data: {
      session: {
        sessionId: "cached-session",
        shortCode: "cached-code",
        gameId: "game-1",
        hostUserId: "user-1",
        status: "active" as const,
        phase: "lobby" as const,
        setupProfileId: null,
      },
      lobby: {
        seats: [],
        canStart: true,
        hostUserId: "user-1",
      },
      control: { switchablePlayerIds: [] },
      history: null,
      selectedPlayerId: null,
      gameplay: null,
    },
    error: null,
  });

  await runWithAutoTermination({
    env: "local",
    resume: "cached-session",
  });

  expect(getSessionBootstrap).toHaveBeenCalledWith({
    path: { sessionId: "cached-session" },
  });
  expect(consolaWarn).not.toHaveBeenCalled();
  expect(createSession).not.toHaveBeenCalled();
  expect(startDreamboardDevServer).toHaveBeenCalledWith(
    expect.objectContaining({
      runtimeConfig: expect.objectContaining({
        autoStartGame: false,
        initialSession: expect.objectContaining({
          sessionId: "cached-session",
        }),
      }),
    }),
  );
  expect(consolaInfo).toHaveBeenCalledWith(
    "Reusing session cached-code (cached-session).",
  );
});

test("dev refuses to resume a cached session when the selected setup profile changes", async () => {
  resetMocks();
  readJsonFile.mockImplementationOnce(async () => ({
    sessionId: "cached-session",
    shortCode: "cached-code",
    gameId: "game-1",
    seed: 7,
    compiledResultId: "compiled-result-2",
    setupProfileId: "base-profile",
    createdAt: "2026-03-25T00:00:00.000Z",
    controllablePlayerIds: [],
    yourTurnCount: 0,
  }));
  resolveSetupProfileSelectionForSession.mockResolvedValueOnce({
    id: "draft-profile",
    name: "Draft Profile",
    source: "explicit",
  });

  await runWithAutoTermination({
    env: "local",
    resume: "cached-session",
    "setup-profile": "draft-profile",
  });

  expect(getSessionBootstrap).toHaveBeenCalledWith({
    path: { sessionId: "cached-session" },
  });
  expect(consolaWarn).toHaveBeenCalledWith(
    "Ignoring requested dev session cached-session: setup profile changed from none to draft-profile",
  );
  expect(createSession).toHaveBeenCalledWith({
    path: { gameId: "game-1" },
    body: {
      compiledResultId: "compiled-result-2",
      seed: 1337,
      playerCount: 4,
      autoAssignSeats: true,
      setupProfileId: "draft-profile",
    },
  });
});

test("dev seeds a session from a typed scenario and disables autostart", async () => {
  resetMocks();

  await runWithAutoTermination({
    env: "local",
    "from-scenario": "smoke-opening",
  });

  expect(createSessionFromScenario).toHaveBeenCalledWith({
    projectRoot: "/tmp/dreamboard-project",
    scenarioId: "smoke-opening",
    compiledResultId: "compiled-result-2",
    gameId: "game-1",
    debug: false,
  });
  expect(resolvePlayerCount).not.toHaveBeenCalled();
  expect(resolveSetupProfileSelectionForSession).not.toHaveBeenCalled();
  expect(createSession).not.toHaveBeenCalled();
  expect(startDreamboardDevServer).toHaveBeenCalledWith(
    expect.objectContaining({
      runtimeConfig: expect.objectContaining({
        autoStartGame: false,
        playerCount: 3,
        setupProfileId: "scenario-profile",
        initialSession: expect.objectContaining({
          sessionId: "scenario-session",
          shortCode: "scenario-code",
        }),
      }),
    }),
  );
  expect(consolaInfo).toHaveBeenCalledWith(
    "Seeded session scenario-code (scenario-session) from scenario smoke-opening.",
  );
});

test("dev rejects --resume with --from-scenario", async () => {
  resetMocks();

  await expect(
    devCommand.run({
      args: {
        env: "local",
        resume: "cached-session",
        "from-scenario": "smoke-opening",
      },
    }),
  ).rejects.toThrow("Cannot combine --resume with --from-scenario.");
});

process.on("exit", () => {
  console.log = originalConsoleLog;
});
