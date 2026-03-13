import { expect, mock, test } from "bun:test";

const resolveConfig = mock(() => ({
  webBaseUrl: "https://dreamboard.games",
}));
const loadGlobalConfig = mock(async () => ({}));
const saveGlobalConfig = mock(async () => undefined);
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
const parseLoginCommandArgs = mock((args: Record<string, unknown>) => args);

mock.module("../build-target.js", () => ({
  IS_PUBLISHED_BUILD: true,
  PUBLISHED_ENVIRONMENT: "prod",
}));

mock.module("../config/resolve.js", () => ({
  resolveConfig,
}));

mock.module("../config/global-config.js", () => ({
  getGlobalConfigPath: () => "/tmp/.dreamboard/config.json",
  loadGlobalConfig,
  saveGlobalConfig,
}));

mock.module("../auth/auth-server.js", () => ({
  startCliAuthServer,
  openBrowser,
}));

mock.module("../flags.js", () => ({
  parseLoginCommandArgs,
}));

const loginCommand = (await import("./login.ts")).default;

test("published login resolves config without injecting an env flag", async () => {
  resolveConfig.mockClear();
  loadGlobalConfig.mockClear();
  saveGlobalConfig.mockClear();
  startCliAuthServer.mockClear();
  closeServer.mockClear();
  openBrowser.mockClear();
  parseLoginCommandArgs.mockClear();

  await loginCommand.run({
    args: {},
  });

  expect(parseLoginCommandArgs).toHaveBeenCalledWith({});
  expect(resolveConfig).toHaveBeenCalledWith({}, {});
  const openedUrl = openBrowser.mock.calls[0]?.[0];
  expect(openedUrl).toEqual(
    expect.stringMatching(
      /^https:\/\/dreamboard\.games\/cli-login\?port=43123&state=.+$/,
    ),
  );
  expect(saveGlobalConfig).toHaveBeenCalledWith({
    authToken: "access-token",
    refreshToken: "refresh-token",
    environment: "prod",
  });
  expect(closeServer).toHaveBeenCalledTimes(1);
});
