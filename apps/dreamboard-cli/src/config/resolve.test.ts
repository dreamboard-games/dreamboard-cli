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

  const config = resolveConfig(
    {
      environment: "prod",
      authToken: activeToken,
      refreshToken: "stored-refresh-token",
    },
    {},
  );

  await configureClient(config);

  expect(setSession).not.toHaveBeenCalled();
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

  loadGlobalConfig.mockImplementation(async () => ({
    environment: "prod",
    authToken: expiredToken,
    refreshToken: "stored-refresh-token",
  }));

  const config = resolveConfig(
    {
      environment: "prod",
      authToken: expiredToken,
      refreshToken: "stored-refresh-token",
    },
    {},
  );

  await configureClient(config);

  expect(setSession).toHaveBeenCalledWith({
    access_token: expiredToken,
    refresh_token: "stored-refresh-token",
  });
  expect(saveGlobalConfig).toHaveBeenCalledWith({
    environment: "prod",
    authToken: "refreshed-access-token",
    refreshToken: "refreshed-refresh-token",
  });
  expect(setClientConfig).toHaveBeenCalledWith({
    baseUrl: config.apiBaseUrl,
    headers: {
      Authorization: "Bearer refreshed-access-token",
    },
  });
});

test("configureClient preserves the access token when the stored refresh token is invalid", async () => {
  const expiringToken = createJwt(60);

  loadGlobalConfig.mockImplementation(async () => ({
    environment: "prod",
    authToken: expiringToken,
    refreshToken: "stale-refresh-token",
  }));
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
      authToken: expiringToken,
      refreshToken: "stale-refresh-token",
    },
    {},
  );

  await expect(configureClient(config)).resolves.toBeUndefined();

  expect(config.authToken).toBe(expiringToken);
  expect(config.refreshToken).toBeUndefined();
  expect(saveGlobalConfig).toHaveBeenCalledWith({
    environment: "prod",
    authToken: expiringToken,
    refreshToken: undefined,
  });
  expect(setClientConfig).toHaveBeenCalledWith({
    baseUrl: config.apiBaseUrl,
    headers: {
      Authorization: `Bearer ${expiringToken}`,
    },
  });
});

test("configureClient fails fast when the stored refresh token is invalid and the access token is expired", async () => {
  const expiredToken = createJwt(-3600);

  loadGlobalConfig.mockImplementation(async () => ({
    environment: "prod",
    authToken: expiredToken,
    refreshToken: "stale-refresh-token",
  }));
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
      authToken: expiredToken,
      refreshToken: "stale-refresh-token",
    },
    {},
  );

  await expect(configureClient(config)).rejects.toThrow(
    "Stored Dreamboard session is expired or invalid (Invalid Refresh Token: Refresh Token Not Found). Run `dreamboard login` to authenticate again.",
  );

  expect(config.authToken).toBe(expiredToken);
  expect(config.refreshToken).toBeUndefined();
  expect(saveGlobalConfig).toHaveBeenCalledWith({
    environment: "prod",
    authToken: expiredToken,
    refreshToken: undefined,
  });
  expect(setClientConfig).not.toHaveBeenCalled();
});

test("configureClient recovers when another process already rotated the stored session", async () => {
  const expiredToken = createJwt(-3600);

  loadGlobalConfig.mockImplementation(async () => ({
    environment: "prod",
    authToken: "fresh-access-token",
    refreshToken: "fresh-refresh-token",
  }));
  setSession.mockImplementation(
    async ({
      refresh_token,
    }: {
      access_token: string;
      refresh_token: string;
    }) => {
      if (refresh_token === "stale-refresh-token") {
        return {
          data: {
            session: null,
          },
          error: {
            message: "Invalid Refresh Token: Already Used",
          },
        };
      }

      return {
        data: {
          session: {
            access_token: "recovered-access-token",
            refresh_token: "recovered-refresh-token",
          },
        },
        error: null,
      };
    },
  );

  const config = resolveConfig(
    {
      environment: "prod",
      authToken: expiredToken,
      refreshToken: "stale-refresh-token",
    },
    {},
  );

  await configureClient(config);

  expect(setSession).toHaveBeenNthCalledWith(1, {
    access_token: expiredToken,
    refresh_token: "stale-refresh-token",
  });
  expect(setSession).toHaveBeenNthCalledWith(2, {
    access_token: "fresh-access-token",
    refresh_token: "fresh-refresh-token",
  });
  expect(saveGlobalConfig).toHaveBeenCalledWith({
    environment: "prod",
    authToken: "recovered-access-token",
    refreshToken: "recovered-refresh-token",
  });
  expect(setClientConfig).toHaveBeenCalledWith({
    baseUrl: config.apiBaseUrl,
    headers: {
      Authorization: "Bearer recovered-access-token",
    },
  });
});

test("configureClient does not rewrite env-provided sessions", async () => {
  const envToken = createJwt(3600);
  process.env.DREAMBOARD_TOKEN = envToken;
  process.env.DREAMBOARD_REFRESH_TOKEN = "env-refresh-token";

  const config = resolveConfig({}, {});

  await expect(configureClient(config)).resolves.toBeUndefined();

  expect(setSession).not.toHaveBeenCalled();
  expect(saveGlobalConfig).not.toHaveBeenCalled();
  expect(setClientConfig).toHaveBeenCalledWith({
    baseUrl: config.apiBaseUrl,
    headers: {
      Authorization: `Bearer ${envToken}`,
    },
  });
});
