import { expect, mock, test } from "bun:test";

const resolveConfig = mock(() => ({
  webBaseUrl: "https://dreamboard.games",
}));
const loadGlobalConfig = mock(async () => ({}));
const saveGlobalConfig = mock(async () => undefined);
const setCredentials = mock(async () => undefined);
const setAccessOnlySession = mock(async () => undefined);
const getStoredSession = mock(async () => null);
const closeServer = mock(() => undefined);
const startCliAuthServer = mock(async () => ({
  port: 43123,
  waitForToken: Promise.resolve({
    token: "access-token",
    refreshToken: "refresh-token",
  }),
  close: closeServer,
}));
const openBrowser = mock(() => undefined);
const parseAuthCommandArgs = mock((args: Record<string, unknown>) => args);
const parseLoginCommandArgs = mock((args: Record<string, unknown>) => args);

mock.module("../build-target.js", () => ({
  IS_PUBLISHED_BUILD: true,
  PUBLISHED_ENVIRONMENT: "prod",
}));

mock.module("../config/resolve.js", () => ({
  resolveConfig,
}));

mock.module("../config/global-config.js", () => ({
  getGlobalAuthPath: () => "/tmp/.dreamboard/auth.json",
  getGlobalConfigPath: () => "/tmp/.dreamboard/config.json",
  loadGlobalConfig,
  saveGlobalConfig,
}));

mock.module("../config/credential-store.js", () => ({
  getStoredSession,
  setAccessOnlySession,
  setCredentials,
}));

mock.module("../auth/auth-server.js", () => ({
  startCliAuthServer,
  openBrowser,
}));

mock.module("../flags.js", () => ({
  parseAuthCommandArgs,
  parseLoginCommandArgs,
}));

const loginCommand = (await import("./login.ts")).default;

test("published login persists env via saveGlobalConfig and credentials via setCredentials", async () => {
  resolveConfig.mockClear();
  loadGlobalConfig.mockClear();
  saveGlobalConfig.mockClear();
  setCredentials.mockClear();
  setAccessOnlySession.mockClear();
  startCliAuthServer.mockClear();
  closeServer.mockClear();
  openBrowser.mockClear();
  parseAuthCommandArgs.mockClear();
  parseLoginCommandArgs.mockClear();

  await loginCommand.run!({
    args: {} as any,
  } as any);

  expect(parseLoginCommandArgs).toHaveBeenCalledWith({});
  expect(resolveConfig).toHaveBeenCalledWith({}, {}, undefined, null);
  expect(getStoredSession).toHaveBeenCalledTimes(1);
  const openedUrl = (openBrowser as any).mock.calls[0]?.[0];
  expect(openedUrl).toEqual(
    expect.stringMatching(
      /^https:\/\/dreamboard\.games\/cli-login\?port=43123&state=.+$/,
    ),
  );
  // Config (env only) goes through saveGlobalConfig; credentials go
  // through the narrow CredentialStore API.
  expect(saveGlobalConfig).toHaveBeenCalledWith({
    environment: "prod",
  });
  expect(setCredentials).toHaveBeenCalledWith({
    accessToken: "access-token",
    refreshToken: "refresh-token",
  });
  expect(setAccessOnlySession).not.toHaveBeenCalled();
  expect(closeServer).toHaveBeenCalledTimes(1);
});
