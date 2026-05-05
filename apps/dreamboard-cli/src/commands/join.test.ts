import { expect, mock, test } from "bun:test";

mock.restore();

const actualResolve = await import("../config/resolve.js");
const actualDevSession = await import("../utils/dev-session.js");

const loadGlobalConfig = mock(async () => ({
  environment: "dev" as const,
}));
const getStoredSession = mock(async () => ({
  accessToken: "access-token",
  refreshToken: undefined,
}));
const findProjectRoot = mock(async () => "/tmp/dreamboard-project");
const loadProjectConfig = mock(async () => ({
  gameId: "game-1",
  slug: "test-game",
  apiBaseUrl: "https://project-api.example.com",
  webBaseUrl: "https://project-web.example.com",
}));
const configureClient = mock(async () => undefined);
const loadPersistedDevSession = mock(async () => ({
  sessionId: "cached-session",
}));
const runJoinJsonlSession = mock(async () => undefined);
const getSessionBootstrap = mock(async () => ({
  data: {
    lobby: {
      seats: [
        { playerId: "player-1" },
        { playerId: "player-2" },
        { playerId: "player-3" },
      ],
    },
  },
}));

mock.module("@dreamboard/api-client", () => ({
  getSessionBootstrap,
}));

mock.module("../config/global-config.js", () => ({
  loadGlobalConfig,
}));

mock.module("../config/credential-store.js", () => ({
  getStoredSession,
}));

mock.module("../config/project-config.js", () => ({
  findProjectRoot,
  loadProjectConfig,
}));

mock.module("../config/resolve.js", () => ({
  ...actualResolve,
  configureClient,
}));

mock.module("../utils/dev-session.js", () => ({
  ...actualDevSession,
  loadPersistedDevSession,
}));

mock.module("../services/join/jsonl-bot-session.js", () => ({
  runJoinJsonlSession,
}));

const joinCommand = (await import("./join.ts")).default;

function resetMocks(): void {
  loadGlobalConfig.mockClear();
  getStoredSession.mockClear();
  findProjectRoot.mockClear();
  loadProjectConfig.mockClear();
  configureClient.mockClear();
  loadPersistedDevSession.mockClear();
  runJoinJsonlSession.mockClear();
  getSessionBootstrap.mockClear();
}

test("join defaults to the persisted dev session id", async () => {
  resetMocks();

  await joinCommand.run({
    args: {
      player: "2",
      env: "local",
    },
  });

  expect(loadPersistedDevSession).toHaveBeenCalledWith(
    "/tmp/dreamboard-project/.dreamboard/dev/session.json",
  );
  expect(runJoinJsonlSession).toHaveBeenCalledWith(
    expect.objectContaining({
      sessionId: "cached-session",
      playerId: "player-2",
    }),
  );
  expect(getSessionBootstrap).toHaveBeenCalledWith({
    path: { sessionId: "cached-session" },
  });
});

test("join uses an explicit session id when provided", async () => {
  resetMocks();

  await joinCommand.run({
    args: {
      session: "explicit-session",
      player: "2",
      env: "local",
    },
  });

  expect(loadPersistedDevSession).not.toHaveBeenCalled();
  expect(runJoinJsonlSession).toHaveBeenCalledWith(
    expect.objectContaining({
      sessionId: "explicit-session",
      playerId: "player-2",
    }),
  );
  expect(getSessionBootstrap).toHaveBeenCalledWith({
    path: { sessionId: "explicit-session" },
  });
});

test("join preserves explicit player ids", async () => {
  resetMocks();

  await joinCommand.run({
    args: {
      session: "explicit-session",
      player: "player-2",
      env: "local",
    },
  });

  expect(runJoinJsonlSession).toHaveBeenCalledWith(
    expect.objectContaining({
      playerId: "player-2",
    }),
  );
});

test("join hard fails before opening the stream for unknown player ids", async () => {
  resetMocks();

  await expect(
    joinCommand.run({
      args: {
        session: "explicit-session",
        player: "5",
        env: "local",
      },
    }),
  ).rejects.toThrow(
    "Unknown player id 'player-5' for session explicit-session. Available players: player-1, player-2, player-3.",
  );

  expect(getSessionBootstrap).toHaveBeenCalledWith({
    path: { sessionId: "explicit-session" },
  });
  expect(runJoinJsonlSession).not.toHaveBeenCalled();
});

test("join reports a missing default session outside a project", async () => {
  resetMocks();
  findProjectRoot.mockResolvedValueOnce(null);

  await expect(
    joinCommand.run({
      args: {
        player: "2",
        env: "local",
      },
    }),
  ).rejects.toThrow(
    "No session id provided and this directory is not a Dreamboard project.",
  );

  expect(loadProjectConfig).not.toHaveBeenCalled();
  expect(loadPersistedDevSession).not.toHaveBeenCalled();
  expect(runJoinJsonlSession).not.toHaveBeenCalled();
});
