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
const getSessionStatus = mock(async () => ({
  data: {
    sessionId: "cached-session",
    shortCode: "cached-code",
    gameId: "game-1",
    hostUserId: "user-1",
    status: "active" as const,
    phase: "gameplay" as const,
    seats: [],
    canStart: false,
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
const resolveSetupProfileIdForSession = mock(async () => null);

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
  getSessionStatus,
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
  resolveSetupProfileIdForSession,
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

const devCommand = (await import("./dev.ts")).default;

function resetMocks(): void {
  createSession.mockClear();
  getSessionStatus.mockClear();
  resolveProjectContext.mockClear();
  configureClient.mockClear();
  parseDevCommandArgs.mockClear();
  ensureDir.mockClear();
  exists.mockClear();
  readJsonFile.mockClear();
  writeJsonFile.mockClear();
  resolvePlayerCount.mockClear();
  runDevPreflight.mockClear();
  resolveSetupProfileIdForSession.mockClear();
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

  try {
    await devCommand.run({ args });
  } finally {
    process.on = originalOn;
    process.off = originalOff;
  }
}

test("dev creates a fresh session by default instead of reusing cached state", async () => {
  resetMocks();

  await runWithAutoTermination({
    env: "local",
  });

  expect(getSessionStatus).not.toHaveBeenCalled();
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
  expect(startDreamboardDevServer).toHaveBeenCalledWith(
    expect.objectContaining({
      runtimeConfig: expect.objectContaining({
        sessionId: "fresh-session",
        autoStartGame: true,
      }),
    }),
  );
  expect(consolaInfo).toHaveBeenCalledWith(
    "Created session fresh-code (fresh-session).",
  );
  expect(consolaInfo).toHaveBeenCalledWith("Backend session id: fresh-session");
  expect(resolveSetupProfileIdForSession).toHaveBeenCalledWith({
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

  expect(getSessionStatus).toHaveBeenCalledWith({
    path: { sessionId: "cached-session" },
  });
  expect(createSession).not.toHaveBeenCalled();
  expect(consolaWarn).not.toHaveBeenCalled();
  expect(startDreamboardDevServer).toHaveBeenCalledWith(
    expect.objectContaining({
      runtimeConfig: expect.objectContaining({
        sessionId: "cached-session",
        autoStartGame: false,
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

test("dev refuses to resume a cached session from an older compiled result", async () => {
  resetMocks();

  await runWithAutoTermination({
    env: "local",
    resume: "cached-session",
  });

  expect(getSessionStatus).not.toHaveBeenCalled();
  expect(consolaWarn).toHaveBeenCalledWith(
    "Ignoring requested dev session cached-session: compiled result changed from compiled-result-1 to compiled-result-2",
  );
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
  getSessionStatus.mockResolvedValueOnce({
    data: {
      sessionId: "cached-session",
      shortCode: "cached-code",
      gameId: "game-1",
      hostUserId: "user-1",
      status: "active" as const,
      phase: "lobby" as const,
      seats: [],
      canStart: true,
    },
    error: null,
  });

  await runWithAutoTermination({
    env: "local",
    resume: "cached-session",
  });

  expect(getSessionStatus).toHaveBeenCalledWith({
    path: { sessionId: "cached-session" },
  });
  expect(consolaWarn).not.toHaveBeenCalled();
  expect(createSession).not.toHaveBeenCalled();
  expect(startDreamboardDevServer).toHaveBeenCalledWith(
    expect.objectContaining({
      runtimeConfig: expect.objectContaining({
        sessionId: "cached-session",
        autoStartGame: false,
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
  resolveSetupProfileIdForSession.mockResolvedValueOnce("draft-profile");

  await runWithAutoTermination({
    env: "local",
    resume: "cached-session",
    "setup-profile": "draft-profile",
  });

  expect(getSessionStatus).not.toHaveBeenCalled();
  expect(consolaWarn).toHaveBeenCalledWith(
    "Ignoring requested dev session cached-session: setup profile changed from base-profile to draft-profile",
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

process.on("exit", () => {
  console.log = originalConsoleLog;
});
