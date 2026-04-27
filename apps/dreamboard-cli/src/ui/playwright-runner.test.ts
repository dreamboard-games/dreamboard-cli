import { beforeEach, expect, mock, test } from "bun:test";

const getUser = mock(async () => ({
  data: {
    user: {
      id: "user-123",
      email: "test@example.com",
    },
  },
}));
const setSession = mock(async () => ({
  data: {
    session: null,
  },
}));
const createClient = mock(() => ({
  auth: {
    getUser,
    setSession,
  },
}));

mock.module("@supabase/supabase-js", () => ({
  createClient,
}));

const { buildBrowserAuthInitScript } = await import("./playwright-runner.ts");

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
  createClient.mockClear();
  getUser.mockClear();
  setSession.mockClear();
  getUser.mockImplementation(async () => ({
    data: {
      user: {
        id: "user-123",
        email: "test@example.com",
      },
    },
  }));
});

test("buildBrowserAuthInitScript seeds browser auth without rotating the stored session", async () => {
  const script = await buildBrowserAuthInitScript({
    apiBaseUrl: "http://127.0.0.1:8080",
    webBaseUrl: "http://127.0.0.1:5173",
    supabaseUrl: "https://demo.supabase.co",
    supabaseAnonKey: "anon-key",
    authToken: createJwt(3600),
    refreshToken: "refresh-token",
    authTokenSource: "global",
    refreshTokenSource: "global",
  });

  expect(createClient).toHaveBeenCalledWith(
    "https://demo.supabase.co",
    "anon-key",
  );
  expect(getUser).toHaveBeenCalledTimes(1);
  expect(setSession).not.toHaveBeenCalled();
  expect(script).toContain("refresh-token");
  expect(script).toContain("sb-demo-auth-token");
});
