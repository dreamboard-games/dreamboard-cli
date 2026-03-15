import { expect, mock, test } from "bun:test";

const createSession = mock(async () => ({
  data: {
    sessionId: "session-1",
    gameId: "game-1",
  },
  error: null,
  response: { status: 200 },
}));
const startGame = mock(async () => ({
  data: {
    sessionId: "session-1",
    shortCode: "swift-falcon-73",
  },
  error: null,
  response: { status: 200 },
}));
const resolveProjectContext = mock(async () => ({
  projectRoot: "/tmp/dreamboard-project",
  projectConfig: {
    gameId: "game-1",
    slug: "test-game",
    resultId: "result-1",
  },
  config: {
    webBaseUrl: "https://dreamboard.games",
  },
}));
const resolveCompiledResultForRun = mock(async () => ({
  id: "compiled-result-1",
}));
const resolvePlayerCount = mock(async () => 4);
const parseStartCommandArgs = mock((args: Record<string, unknown>) => args);
const ensureDir = mock(async () => undefined);
const writeJsonFile = mock(async () => undefined);
const openBrowser = mock(() => undefined);
const consolaInfo = mock(() => undefined);
const consolaSuccess = mock(() => undefined);
const actualFlags = await import("../flags.js");

mock.module("@dreamboard/api-client", () => ({
  createSession,
  startGame,
}));

mock.module("../config/resolve.js", () => ({
  resolveProjectContext,
}));

mock.module("../services/workflows/resolve-run-result.js", () => ({
  resolveCompiledResultForRun,
}));

mock.module("../ui/playwright-runner.js", () => ({
  resolvePlayerCount,
}));

mock.module("../flags.js", () => ({
  ...actualFlags,
  parseStartCommandArgs,
}));

mock.module("../utils/fs.js", () => ({
  ensureDir,
  writeJsonFile,
}));

mock.module("../auth/auth-server.js", () => ({
  openBrowser,
}));

mock.module("consola", () => ({
  default: {
    info: consolaInfo,
    success: consolaSuccess,
  },
}));

const startCommand = (await import("./start.ts")).default;

test("start creates and starts a fresh session, persists it, and opens the play URL", async () => {
  await startCommand.run({
    args: {
      env: "local",
      seed: "42",
      players: "4",
    },
  });

  expect(parseStartCommandArgs).toHaveBeenCalledWith({
    env: "local",
    seed: "42",
    players: "4",
  });
  expect(resolveProjectContext).toHaveBeenCalledWith({
    env: "local",
    seed: "42",
    players: "4",
  });
  expect(resolveCompiledResultForRun).toHaveBeenCalledWith(
    "/tmp/dreamboard-project",
    expect.objectContaining({ gameId: "game-1" }),
  );
  expect(resolvePlayerCount).toHaveBeenCalledWith("/tmp/dreamboard-project", {
    players: "4",
  });
  expect(createSession).toHaveBeenCalledWith({
    path: { gameId: "game-1" },
    body: {
      compiledResultId: "compiled-result-1",
      seed: 42,
      playerCount: 4,
      autoAssignSeats: true,
    },
  });
  expect(startGame).toHaveBeenCalledWith({
    path: { sessionId: "session-1" },
  });
  expect(ensureDir).toHaveBeenCalledWith(
    "/tmp/dreamboard-project/.dreamboard/run",
  );
  expect(writeJsonFile).toHaveBeenCalledWith(
    "/tmp/dreamboard-project/.dreamboard/run/session.json",
    expect.objectContaining({
      sessionId: "session-1",
      shortCode: "swift-falcon-73",
      gameId: "game-1",
      seed: 42,
      compiledResultId: "compiled-result-1",
      controllablePlayerIds: [],
      yourTurnCount: 0,
    }),
  );
  expect(openBrowser).toHaveBeenCalledWith(
    "https://dreamboard.games/play/swift-falcon-73",
  );
  expect(consolaSuccess).toHaveBeenCalledWith(
    "Started session swift-falcon-73.",
  );
});

test("start falls back to manifest min players when --players is omitted", async () => {
  parseStartCommandArgs.mockClear();
  resolveProjectContext.mockClear();
  resolveCompiledResultForRun.mockClear();
  resolvePlayerCount.mockClear();
  createSession.mockClear();
  startGame.mockClear();

  await startCommand.run({
    args: {
      env: "local",
    },
  });

  expect(parseStartCommandArgs).toHaveBeenCalledWith({
    env: "local",
  });
  expect(resolvePlayerCount).toHaveBeenCalledWith("/tmp/dreamboard-project", {
    players: undefined,
  });
  expect(createSession).toHaveBeenCalledWith({
    path: { gameId: "game-1" },
    body: {
      compiledResultId: "compiled-result-1",
      seed: 1337,
      playerCount: 4,
      autoAssignSeats: true,
    },
  });
});
