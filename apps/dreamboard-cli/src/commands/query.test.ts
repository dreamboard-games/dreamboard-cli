import { afterAll, beforeEach, expect, mock, test } from "bun:test";

const queryWorkshopRulebook = mock(async () => ({
  data: {
    ruleText:
      "Dreamboard sample rules text excerpt. Top-three fallback succeeded.",
  },
  error: null,
  response: { status: 200 },
}));
const loadGlobalConfig = mock(async () => ({
  authToken: "test-token",
  environment: "local",
}));
const getStoredSession = mock(async () => ({
  accessToken: "stored-access-token",
  refreshToken: "stored-refresh-token",
  expiresAt: null,
}));
const configureClient = mock(async () => undefined);
const requireAuth = mock(() => undefined);
const resolveConfig = mock(() => ({
  apiBaseUrl: "http://127.0.0.1:8080",
  authToken: "test-token",
}));
const consoleLog = mock(() => undefined);
const actualFlags = await import("../flags.js");

mock.module("@dreamboard/api-client", () => ({
  queryWorkshopRulebook,
  getLatestCompiledResult: mock(async () => ({
    data: null,
  })),
}));

mock.module("../config/global-config.js", () => ({
  loadGlobalConfig,
}));

mock.module("../config/credential-store.js", () => ({
  getStoredSession,
}));

mock.module("../config/resolve.js", () => ({
  resolveConfig,
  resolveProjectContext: async () => {
    throw new Error("Unexpected resolveProjectContext call in query test");
  },
  configureClient,
  requireAuth,
}));

mock.module("../flags.js", () => ({
  ...actualFlags,
  parseQueryCommandArgs: (args: Record<string, unknown>) => args,
}));

const originalConsoleLog = console.log;
console.log = consoleLog;

afterAll(() => {
  console.log = originalConsoleLog;
});

const queryCommand = (await import("./query.ts")).default;

beforeEach(() => {
  queryWorkshopRulebook.mockClear();
  loadGlobalConfig.mockClear();
  getStoredSession.mockClear();
  configureClient.mockClear();
  requireAuth.mockClear();
  resolveConfig.mockClear();
});

test("query command fetches rulebook text from the backend", async () => {
  await queryCommand.run({
    args: {
      title: "Chess",
      env: "local",
    },
  });

  expect(loadGlobalConfig).toHaveBeenCalled();
  expect(requireAuth).toHaveBeenCalled();
  expect(configureClient).toHaveBeenCalled();
  expect(queryWorkshopRulebook).toHaveBeenCalledWith({
    query: {
      title: "Chess",
    },
  });
  expect(consoleLog).toHaveBeenCalledWith(
    "Dreamboard sample rules text excerpt. Top-three fallback succeeded.",
  );
});

test("query command threads the freshly loaded stored session into resolveConfig", async () => {
  // Regression: query previously called resolveConfig without a stored
  // session, so a freshly persisted credential (e.g. just after `dreamboard
  // login` or `dreamboard config set`) was ignored on the very next
  // invocation.
  await queryCommand.run({
    args: {
      title: "Chess",
      env: "local",
    },
  });

  expect(getStoredSession).toHaveBeenCalledTimes(1);
  expect(resolveConfig).toHaveBeenCalledTimes(1);
  const callArgs = resolveConfig.mock.calls[0]!;
  expect(callArgs.length).toBeGreaterThanOrEqual(4);
  expect(callArgs[3]).toEqual({
    accessToken: "stored-access-token",
    refreshToken: "stored-refresh-token",
    expiresAt: null,
  });
});
