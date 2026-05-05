import { beforeEach, expect, mock, test } from "bun:test";

const loadGlobalConfig = mock(async () => ({}));
const saveGlobalConfig = mock(async () => undefined);
const getStoredSession = mock(async () => null as any);
const setCredentials = mock(async () => undefined);
const setAccessOnlySession = mock(async () => undefined);
const clearCredentials = mock(async () => undefined);
const getActiveCredentialBackendName = mock(async () => "file" as const);
// Simulated in-memory credential store used by the refresh coordinator.
// `withCredentialLock` hands the callback an ops handle that mirrors the
// real backend API but operates on the in-memory snapshot returned by
// `getStoredSession`.
const withCredentialLock = mock(async (fn: any) => {
  const snapshot = (await getStoredSession()) as any;
  const ops = {
    backendName: "file" as const,
    read: async () => snapshot,
    writeFull: async (creds: any) => {
      getStoredSession.mockImplementation(async () => ({
        accessToken: creds.accessToken,
        refreshToken: creds.refreshToken,
      }));
    },
    writeAccessOnly: async (token: string) => {
      getStoredSession.mockImplementation(async () => ({
        accessToken: token,
      }));
    },
    clear: async () => {
      getStoredSession.mockImplementation(async () => null);
    },
  };
  return fn(ops);
});
const getCredentials = mock(async () => null as any);
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
const parseLoginCommandArgs = mock((args: Record<string, unknown>) => args);
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
  getGlobalAuthPath: () => "/tmp/.dreamboard/auth.json",
  getGlobalConfigPath: () => "/tmp/.dreamboard/config.json",
  loadGlobalConfig,
  saveGlobalConfig,
}));

mock.module("../config/credential-store.js", () => ({
  clearCredentials,
  getActiveCredentialBackendName,
  getCredentials,
  getStoredSession,
  setAccessOnlySession,
  setCredentials,
  withCredentialLock,
}));

mock.module("../auth/auth-server.js", () => ({
  openBrowser,
  startCliAuthServer,
}));

mock.module("../flags.js", () => ({
  parseLoginCommandArgs,
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
  getStoredSession.mockClear();
  setCredentials.mockClear();
  setAccessOnlySession.mockClear();
  clearCredentials.mockClear();
  getActiveCredentialBackendName.mockClear();
  setSession.mockClear();
  createSupabaseClient.mockClear();
  parseLoginCommandArgs.mockClear();
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
  getStoredSession.mockImplementation(async () => null as any);
  setCredentials.mockImplementation(async () => undefined);
  setAccessOnlySession.mockImplementation(async () => undefined);
  clearCredentials.mockImplementation(async () => undefined);
  getActiveCredentialBackendName.mockImplementation(
    async () => "file" as const,
  );
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
  }));
  getStoredSession.mockImplementation(async () => ({
    accessToken: createJwt(3600),
    refreshToken: "refresh-token",
  }));

  await authCommand.run!({
    args: {
      action: "status",
    } as any,
  } as any);

  expect(parseAuthCommandArgs).toHaveBeenCalledWith({
    action: "status",
  });
  expect(setSession).not.toHaveBeenCalled();
  expect(saveGlobalConfig).not.toHaveBeenCalled();
  expect(setCredentials).not.toHaveBeenCalled();
  expect(consolaSuccess).toHaveBeenCalledWith("Dreamboard session is active.");
});

test("auth status refreshes an expired stored session via the credential store", async () => {
  const expiredToken = createJwt(-3600);
  const refreshedToken = createJwt(7200);

  loadGlobalConfig.mockImplementation(async () => ({
    environment: "prod",
  }));
  getStoredSession.mockImplementation(async () => ({
    accessToken: expiredToken,
    refreshToken: "stored-refresh-token",
  }));
  // The refresh coordinator re-reads inside the lock; the mocked
  // credential store returns the same snapshot both times.
  setSession.mockImplementation(async () => ({
    data: {
      session: {
        access_token: refreshedToken,
        refresh_token: "rotated-refresh-token",
      },
    },
    error: null,
  }));

  await authCommand.run!({
    args: {
      action: "status",
    } as any,
  } as any);

  // auth status delegates to refreshResolvedAuthSession, which hits
  // Supabase setSession with the stored credentials. saveGlobalConfig
  // is NEVER called with credentials now - that path is owned by
  // CredentialStore.
  expect(setSession).toHaveBeenCalledWith({
    access_token: expiredToken,
    refresh_token: "stored-refresh-token",
  });
  expect(saveGlobalConfig).not.toHaveBeenCalled();
  // Credentials were rotated and persisted via the credential store.
  expect(consolaSuccess).toHaveBeenCalledWith(
    "Access token was expired and has been refreshed.",
  );
});

test("auth set writes an access-only session without touching saveGlobalConfig", async () => {
  loadGlobalConfig.mockImplementation(async () => ({
    environment: "local",
  }));
  getStoredSession.mockImplementation(async () => ({
    accessToken: "old-access-token",
    refreshToken: "stale-refresh-token",
  }));

  await authCommand.run!({
    args: {
      action: "set",
      tokenValue: "new-access-token",
    } as any,
  } as any);

  expect(setAccessOnlySession).toHaveBeenCalledWith("new-access-token");
  expect(saveGlobalConfig).not.toHaveBeenCalled();
  expect(setCredentials).not.toHaveBeenCalled();
  expect(consolaSuccess).toHaveBeenCalledWith(
    "Auth token saved to /tmp/.dreamboard/auth.json.",
  );
});

test("auth clear delegates to clearCredentials without touching saveGlobalConfig", async () => {
  loadGlobalConfig.mockImplementation(async () => ({
    environment: "local",
  }));

  await authCommand.run!({
    args: {
      action: "clear",
    } as any,
  } as any);

  expect(clearCredentials).toHaveBeenCalledTimes(1);
  expect(saveGlobalConfig).not.toHaveBeenCalled();
  expect(setCredentials).not.toHaveBeenCalled();
  expect(setAccessOnlySession).not.toHaveBeenCalled();
});
