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
  loadGlobalConfig,
  saveGlobalConfig,
}));

const { configureClient, resolveConfig } = await import("./resolve.ts");

const originalEnvToken = process.env.DREAMBOARD_TOKEN;
const originalEnvRefreshToken = process.env.DREAMBOARD_REFRESH_TOKEN;

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

test("configureClient persists rotated stored sessions", async () => {
  loadGlobalConfig.mockImplementation(async () => ({
    environment: "prod",
    authToken: "stored-access-token",
    refreshToken: "stored-refresh-token",
  }));

  const config = resolveConfig(
    {
      environment: "prod",
      authToken: "stored-access-token",
      refreshToken: "stored-refresh-token",
    },
    {},
  );

  await configureClient(config);

  expect(setSession).toHaveBeenCalledWith({
    access_token: "stored-access-token",
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

test("configureClient fails fast when the stored refresh token is invalid", async () => {
  loadGlobalConfig.mockImplementation(async () => ({
    environment: "prod",
    authToken: "stored-access-token",
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
      authToken: "stored-access-token",
      refreshToken: "stale-refresh-token",
    },
    {},
  );

  await expect(configureClient(config)).rejects.toThrow(
    "Stored Dreamboard session is expired or invalid (Invalid Refresh Token: Refresh Token Not Found). Run `dreamboard login` to authenticate again.",
  );

  expect(config.authToken).toBeUndefined();
  expect(config.refreshToken).toBeUndefined();
  expect(saveGlobalConfig).toHaveBeenCalledWith({
    environment: "prod",
    authToken: undefined,
    refreshToken: undefined,
  });
  expect(setClientConfig).not.toHaveBeenCalled();
});

test("configureClient recovers when another process already rotated the stored session", async () => {
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
      authToken: "stale-access-token",
      refreshToken: "stale-refresh-token",
    },
    {},
  );

  await configureClient(config);

  expect(setSession).toHaveBeenNthCalledWith(1, {
    access_token: "stale-access-token",
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
  process.env.DREAMBOARD_TOKEN = "env-access-token";
  process.env.DREAMBOARD_REFRESH_TOKEN = "env-refresh-token";
  setSession.mockImplementation(async () => ({
    data: {
      session: null,
    },
    error: {
      message: "Invalid Refresh Token: Refresh Token Not Found",
    },
  }));

  const config = resolveConfig({}, {});

  await expect(configureClient(config)).resolves.toBeUndefined();

  expect(saveGlobalConfig).not.toHaveBeenCalled();
  expect(setClientConfig).toHaveBeenCalledWith({
    baseUrl: config.apiBaseUrl,
    headers: {
      Authorization: "Bearer env-access-token",
    },
  });
});
