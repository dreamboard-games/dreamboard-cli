import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { PROD_SUPABASE_ANON_KEY, PROD_SUPABASE_URL } from "../constants.js";

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
const setClientConfig = mock(() => undefined);
const loadGlobalConfig = mock(async () => ({}));
const saveGlobalConfig = mock(async () => undefined);

mock.module("@supabase/supabase-js", () => ({
  createClient: createSupabaseClient,
}));

mock.module("@dreamboard/api-client/client.gen", () => ({
  client: {
    setConfig: setClientConfig,
  },
}));

mock.module("./global-config.js", () => ({
  getGlobalAuthPath: () => "/tmp/.dreamboard/auth.json",
  getGlobalConfigPath: () => "/tmp/.dreamboard/config.json",
  loadGlobalConfig,
  saveGlobalConfig,
}));

// In-memory credential backend. All CredentialStore exports are wired up
// against the same snapshot so `withCredentialLock`, `getStoredSession`,
// and any rotated `writeFull` calls stay consistent across a test.
type StoredSnapshot = { accessToken?: string; refreshToken?: string } | null;
let storedSnapshot: StoredSnapshot = null;

async function backendRead() {
  return storedSnapshot;
}
async function backendWriteFull(creds: {
  accessToken: string;
  refreshToken: string;
}) {
  storedSnapshot = {
    accessToken: creds.accessToken,
    refreshToken: creds.refreshToken,
  };
}
async function backendWriteAccessOnly(accessToken: string) {
  storedSnapshot = { accessToken };
}
async function backendClear() {
  storedSnapshot = null;
}

const getStoredSession = mock(async () => storedSnapshot);
const getCredentials = mock(async () => {
  if (!storedSnapshot) return null;
  if (!storedSnapshot.accessToken || !storedSnapshot.refreshToken) return null;
  return {
    accessToken: storedSnapshot.accessToken,
    refreshToken: storedSnapshot.refreshToken,
  };
});
const setCredentials = mock(backendWriteFull);
const setAccessOnlySession = mock(backendWriteAccessOnly);
const clearCredentials = mock(backendClear);
const getActiveCredentialBackendName = mock(async () => "file" as const);
const withCredentialLock = mock(async (fn: any) => {
  return fn({
    backendName: "file" as const,
    read: backendRead,
    writeFull: backendWriteFull,
    writeAccessOnly: backendWriteAccessOnly,
    clear: backendClear,
  });
});

mock.module("./credential-store.js", () => ({
  clearCredentials,
  getActiveCredentialBackendName,
  getCredentialFilePath: () => "/tmp/.dreamboard/auth.json",
  getCredentials,
  getStoredSession,
  setAccessOnlySession,
  setCredentials,
  withCredentialLock,
}));

const { _resetRefreshCoordinatorForTests } = await import(
  "../auth/refresh-coordinator.ts"
);
const { configureClient, resolveConfig } = await import("./resolve.ts");

const originalEnvToken = process.env.DREAMBOARD_TOKEN;
const originalEnvRefreshToken = process.env.DREAMBOARD_REFRESH_TOKEN;
const originalApiBaseUrl = process.env.DREAMBOARD_API_BASE_URL;
const originalWebBaseUrl = process.env.DREAMBOARD_WEB_BASE_URL;

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
  setSession.mockClear();
  createSupabaseClient.mockClear();
  setClientConfig.mockClear();
  loadGlobalConfig.mockClear();
  saveGlobalConfig.mockClear();
  getStoredSession.mockClear();
  getCredentials.mockClear();
  setCredentials.mockClear();
  setAccessOnlySession.mockClear();
  clearCredentials.mockClear();
  getActiveCredentialBackendName.mockClear();
  withCredentialLock.mockClear();

  storedSnapshot = null;
  _resetRefreshCoordinatorForTests();

  setSession.mockImplementation(async () => ({
    data: {
      session: {
        access_token: "refreshed-access-token",
        refresh_token: "refreshed-refresh-token",
      },
    },
    error: null,
  }));
  createSupabaseClient.mockImplementation(() => ({
    auth: {
      setSession,
    },
  }));
  loadGlobalConfig.mockImplementation(async () => ({}));
  saveGlobalConfig.mockImplementation(async () => undefined);

  delete process.env.DREAMBOARD_TOKEN;
  delete process.env.DREAMBOARD_REFRESH_TOKEN;
  delete process.env.DREAMBOARD_API_BASE_URL;
  delete process.env.DREAMBOARD_WEB_BASE_URL;
});

afterEach(() => {
  if (originalEnvToken === undefined) {
    delete process.env.DREAMBOARD_TOKEN;
  } else {
    process.env.DREAMBOARD_TOKEN = originalEnvToken;
  }

  if (originalEnvRefreshToken === undefined) {
    delete process.env.DREAMBOARD_REFRESH_TOKEN;
  } else {
    process.env.DREAMBOARD_REFRESH_TOKEN = originalEnvRefreshToken;
  }

  if (originalApiBaseUrl === undefined) {
    delete process.env.DREAMBOARD_API_BASE_URL;
  } else {
    process.env.DREAMBOARD_API_BASE_URL = originalApiBaseUrl;
  }

  if (originalWebBaseUrl === undefined) {
    delete process.env.DREAMBOARD_WEB_BASE_URL;
  } else {
    process.env.DREAMBOARD_WEB_BASE_URL = originalWebBaseUrl;
  }
});

test("prod config always includes the published Supabase settings", () => {
  const config = resolveConfig(
    {
      environment: "prod",
    },
    {},
  );

  expect(config.supabaseUrl).toBe(PROD_SUPABASE_URL);
  expect(config.supabaseAnonKey).toBe(PROD_SUPABASE_ANON_KEY);
});

test("explicit env overrides project-local API and web base URLs", () => {
  const config = resolveConfig(
    {
      environment: "dev",
    },
    {
      env: "prod",
    },
    {
      gameId: "game-id",
      slug: "slug",
      apiBaseUrl: "http://localhost:8080",
      webBaseUrl: "http://localhost:5173",
    },
  );

  expect(config.apiBaseUrl).toBe("https://api.dreamboard.games");
  expect(config.webBaseUrl).toBe("https://dreamboard.games");
  expect(config.supabaseUrl).toBe(PROD_SUPABASE_URL);
  expect(config.supabaseAnonKey).toBe(PROD_SUPABASE_ANON_KEY);
});

test("environment variable base URLs override resolved environment defaults", () => {
  process.env.DREAMBOARD_API_BASE_URL = "http://127.0.0.1:8081";
  process.env.DREAMBOARD_WEB_BASE_URL = "http://127.0.0.1:4173";

  const config = resolveConfig(
    {
      environment: "local",
    },
    {
      env: "local",
    },
  );

  expect(config.apiBaseUrl).toBe("http://127.0.0.1:8081");
  expect(config.webBaseUrl).toBe("http://127.0.0.1:4173");
});

test("configureClient does not eagerly refresh active stored sessions", async () => {
  const activeToken = createJwt(3600);
  storedSnapshot = {
    accessToken: activeToken,
    refreshToken: "stored-refresh-token",
  };

  const config = resolveConfig(
    {
      environment: "prod",
    },
    {},
    undefined,
    storedSnapshot,
  );

  await configureClient(config);

  expect(setSession).not.toHaveBeenCalled();
  expect(setCredentials).not.toHaveBeenCalled();
  expect(saveGlobalConfig).not.toHaveBeenCalled();
  expect(setClientConfig).toHaveBeenCalledWith({
    baseUrl: config.apiBaseUrl,
    headers: {
      Authorization: `Bearer ${activeToken}`,
    },
  });
});

test("configureClient persists rotated stored sessions when the access token is expired", async () => {
  const expiredToken = createJwt(-3600);
  storedSnapshot = {
    accessToken: expiredToken,
    refreshToken: "stored-refresh-token",
  };

  const config = resolveConfig(
    {
      environment: "prod",
    },
    {},
    undefined,
    storedSnapshot,
  );

  await configureClient(config);

  expect(setSession).toHaveBeenCalledWith({
    access_token: expiredToken,
    refresh_token: "stored-refresh-token",
  });
  // New invariant: the refresh-coordinator persists rotated tokens
  // through the in-lock ops handle, NOT through saveGlobalConfig and
  // NOT through the public setCredentials export. Assert that the
  // disk state (our in-memory backend) was updated.
  expect(saveGlobalConfig).not.toHaveBeenCalled();
  expect(setCredentials).not.toHaveBeenCalled();
  expect(storedSnapshot).toEqual({
    accessToken: "refreshed-access-token",
    refreshToken: "refreshed-refresh-token",
  });
  expect(setClientConfig).toHaveBeenCalledWith({
    baseUrl: config.apiBaseUrl,
    headers: {
      Authorization: "Bearer refreshed-access-token",
    },
  });
});

test("configureClient throws a permanent-session error when the stored refresh token is invalid", async () => {
  // Access token expires within the 5-minute refresh window, so the
  // refresh-coordinator will attempt rotation. Supabase returns a
  // permanent-invalid error; resolve.ts should surface it as a clear
  // "run dreamboard login" message without wiping disk state.
  const expiringToken = createJwt(60);
  storedSnapshot = {
    accessToken: expiringToken,
    refreshToken: "stale-refresh-token",
  };
  setSession.mockImplementation(async () => ({
    data: {
      session: null,
    },
    error: {
      message: "Invalid Refresh Token: Refresh Token Not Found",
    },
  }));

  const config = resolveConfig(
    {
      environment: "prod",
    },
    {},
    undefined,
    storedSnapshot,
  );

  await expect(configureClient(config)).rejects.toThrow(
    "Stored Dreamboard session is expired or invalid (Invalid Refresh Token: Refresh Token Not Found). Run `dreamboard login` to authenticate again.",
  );

  // CRITICAL: the stored refresh token must not be wiped on a
  // permanent-invalid classification. Only `dreamboard login` is allowed
  // to replace it.
  expect(storedSnapshot).toEqual({
    accessToken: expiringToken,
    refreshToken: "stale-refresh-token",
  });
  expect(saveGlobalConfig).not.toHaveBeenCalled();
  expect(setCredentials).not.toHaveBeenCalled();
  expect(clearCredentials).not.toHaveBeenCalled();
});

test("configureClient keeps the access token and preserves disk state on transient refresh failures", async () => {
  // An expiring (but still valid) access token plus a transient
  // Supabase outage: we should continue with the existing access token
  // and leave disk state untouched.
  const expiringToken = createJwt(60);
  storedSnapshot = {
    accessToken: expiringToken,
    refreshToken: "stored-refresh-token",
  };
  setSession.mockImplementation(async () => ({
    data: { session: null },
    error: { message: "fetch failed" },
  }));

  const config = resolveConfig(
    {
      environment: "prod",
    },
    {},
    undefined,
    storedSnapshot,
  );

  await configureClient(config);

  expect(storedSnapshot).toEqual({
    accessToken: expiringToken,
    refreshToken: "stored-refresh-token",
  });
  expect(saveGlobalConfig).not.toHaveBeenCalled();
  expect(setCredentials).not.toHaveBeenCalled();
  expect(clearCredentials).not.toHaveBeenCalled();
  expect(setClientConfig).toHaveBeenCalledWith({
    baseUrl: config.apiBaseUrl,
    headers: {
      Authorization: `Bearer ${expiringToken}`,
    },
  });
});

test("configureClient fails fast when the stored refresh token is invalid and the access token is expired", async () => {
  const expiredToken = createJwt(-3600);
  storedSnapshot = {
    accessToken: expiredToken,
    refreshToken: "stale-refresh-token",
  };
  setSession.mockImplementation(async () => ({
    data: {
      session: null,
    },
    error: {
      message: "Invalid Refresh Token: Refresh Token Not Found",
    },
  }));

  const config = resolveConfig(
    {
      environment: "prod",
    },
    {},
    undefined,
    storedSnapshot,
  );

  await expect(configureClient(config)).rejects.toThrow(
    "Stored Dreamboard session is expired or invalid (Invalid Refresh Token: Refresh Token Not Found). Run `dreamboard login` to authenticate again.",
  );

  expect(storedSnapshot).toEqual({
    accessToken: expiredToken,
    refreshToken: "stale-refresh-token",
  });
  expect(saveGlobalConfig).not.toHaveBeenCalled();
  expect(setCredentials).not.toHaveBeenCalled();
  expect(setClientConfig).not.toHaveBeenCalled();
});

test("configureClient recovers when another process already rotated the stored session", async () => {
  // The caller resolved a stale snapshot, but by the time we acquire
  // the cross-process lock another CLI invocation has already rotated
  // disk state to fresh credentials. The coordinator must re-read
  // inside the lock and observe the fresh state instead of blindly
  // POSTing the stale refresh_token.
  const expiredToken = createJwt(-3600);
  const staleSnapshot = {
    accessToken: expiredToken,
    refreshToken: "stale-refresh-token",
  };
  const freshAccessToken = createJwt(3600);

  // Simulate the "other process" by swapping disk state during the test
  // to the post-rotation snapshot BEFORE the lock opens.
  storedSnapshot = {
    accessToken: freshAccessToken,
    refreshToken: "fresh-refresh-token",
  };

  setSession.mockImplementation(async () => {
    throw new Error(
      "setSession should not be called when disk state is already fresh",
    );
  });

  const config = resolveConfig(
    {
      environment: "prod",
    },
    {},
    undefined,
    staleSnapshot,
  );

  await configureClient(config);

  expect(setSession).not.toHaveBeenCalled();
  expect(saveGlobalConfig).not.toHaveBeenCalled();
  expect(setCredentials).not.toHaveBeenCalled();
  expect(setClientConfig).toHaveBeenCalledWith({
    baseUrl: config.apiBaseUrl,
    headers: {
      Authorization: `Bearer ${freshAccessToken}`,
    },
  });
});

test("configureClient does not rewrite env-provided sessions", async () => {
  const envToken = createJwt(3600);
  process.env.DREAMBOARD_TOKEN = envToken;
  process.env.DREAMBOARD_REFRESH_TOKEN = "env-refresh-token";

  const config = resolveConfig({}, {}, undefined, null);

  await expect(configureClient(config)).resolves.toBeUndefined();

  expect(setSession).not.toHaveBeenCalled();
  expect(saveGlobalConfig).not.toHaveBeenCalled();
  expect(setCredentials).not.toHaveBeenCalled();
  expect(setClientConfig).toHaveBeenCalledWith({
    baseUrl: config.apiBaseUrl,
    headers: {
      Authorization: `Bearer ${envToken}`,
    },
  });
});
