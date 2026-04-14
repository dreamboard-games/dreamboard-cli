import { beforeEach, expect, mock, test } from "bun:test";

const loadGlobalConfig = mock(async () => ({}));
const saveGlobalConfig = mock(async () => undefined);
const setSession = mock(async () => ({
  data: {
    session: {
      access_token: "refreshed-access-token",
      refresh_token: "refreshed-refresh-token",
    },
  },
  error: null,
}));
const createSupabaseClient = mock(() => ({
  auth: {
    setSession,
  },
}));
const parseAuthCommandArgs = mock((args: Record<string, unknown>) => args);
const consolaLog = mock(() => undefined);
const consolaWarn = mock(() => undefined);
const consolaSuccess = mock(() => undefined);
const consolaInfo = mock(() => undefined);
const consolaStart = mock(() => undefined);
const openBrowser = mock(() => undefined);
const startCliAuthServer = mock(async () => ({
  port: 43123,
  waitForToken: Promise.resolve({
    token: "access-token",
    refreshToken: "refresh-token",
  }),
  close: mock(() => undefined),
}));

mock.module("@supabase/supabase-js", () => ({
  createClient: createSupabaseClient,
}));

mock.module("consola", () => ({
  default: {
    info: consolaInfo,
    log: consolaLog,
    start: consolaStart,
    success: consolaSuccess,
    warn: consolaWarn,
  },
}));

mock.module("../build-target.js", () => ({
  IS_PUBLISHED_BUILD: false,
  PUBLISHED_ENVIRONMENT: "prod",
}));

mock.module("../config/global-config.js", () => ({
  getGlobalConfigPath: () => "/tmp/.dreamboard/config.json",
  loadGlobalConfig,
  saveGlobalConfig,
}));

mock.module("../auth/auth-server.js", () => ({
  openBrowser,
  startCliAuthServer,
}));

mock.module("../flags.js", () => ({
  parseAuthCommandArgs,
}));

const authCommand = (await import("./auth.ts")).default;

function createJwt(expSecondsFromNow: number): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
    }),
  ).toString("base64url");
  return `${header}.${payload}.signature`;
}

beforeEach(() => {
  loadGlobalConfig.mockClear();
  saveGlobalConfig.mockClear();
  setSession.mockClear();
  createSupabaseClient.mockClear();
  parseAuthCommandArgs.mockClear();
  consolaLog.mockClear();
  consolaWarn.mockClear();
  consolaSuccess.mockClear();
  consolaInfo.mockClear();
  consolaStart.mockClear();
  openBrowser.mockClear();
  startCliAuthServer.mockClear();

  loadGlobalConfig.mockImplementation(async () => ({}));
  saveGlobalConfig.mockImplementation(async () => undefined);
  setSession.mockImplementation(async () => ({
    data: {
      session: {
        access_token: createJwt(3600),
        refresh_token: "refreshed-refresh-token",
      },
    },
    error: null,
  }));
});

test("auth status reports an active session without refreshing a valid token", async () => {
  loadGlobalConfig.mockImplementation(async () => ({
    environment: "dev",
    authToken: createJwt(3600),
    refreshToken: "refresh-token",
  }));

  await authCommand.run({
    args: {
      action: "status",
    },
  });

  expect(parseAuthCommandArgs).toHaveBeenCalledWith({
    action: "status",
  });
  expect(setSession).not.toHaveBeenCalled();
  expect(consolaSuccess).toHaveBeenCalledWith("Dreamboard session is active.");
});

test("auth status refreshes an expired stored session and persists the rotated tokens", async () => {
  const expiredToken = createJwt(-3600);
  const refreshedToken = createJwt(7200);

  loadGlobalConfig.mockImplementation(async () => ({
    environment: "prod",
    authToken: expiredToken,
    refreshToken: "stored-refresh-token",
  }));
  setSession.mockImplementation(async () => ({
    data: {
      session: {
        access_token: refreshedToken,
        refresh_token: "rotated-refresh-token",
      },
    },
    error: null,
  }));

  await authCommand.run({
    args: {
      action: "status",
    },
  });

  expect(setSession).toHaveBeenCalledWith({
    access_token: expiredToken,
    refresh_token: "stored-refresh-token",
  });
  expect(saveGlobalConfig).toHaveBeenCalledWith({
    environment: "prod",
    authToken: refreshedToken,
    refreshToken: "rotated-refresh-token",
  });
  expect(consolaSuccess).toHaveBeenCalledWith(
    "Access token was expired and has been refreshed.",
  );
});
