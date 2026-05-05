/**
 * Integration-level regression test for the refresh-token-wipe bug that
 * motivated the credential-store rewrite.
 *
 * This test uses the REAL filesystem, the REAL `fileCredentialBackend`,
 * the REAL `withCredentialLock`, and the REAL `RefreshCoordinator`. The
 * only mocked dependency is Supabase itself. It asserts that no matter
 * what Supabase returns - a transient 5xx, a thrown network error, or
 * even a known "Invalid Refresh Token" failure - `~/.dreamboard/
 * auth.json` is never truncated, rewritten, or emptied behind the user's
 * back. The only legal paths that mutate disk are:
 *
 * - a successful refresh (access + refresh token rotation), or
 * - an explicit `setCredentials` / `clearCredentials` call.
 */

import { afterAll, afterEach, beforeEach, expect, mock, test } from "bun:test";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

// Pin HOME so the real file backend writes into an isolated tmpdir.
const testHome = path.join(
  os.tmpdir(),
  `dreamboard-refresh-integration-test-${process.pid}`,
);
const originalHomedir = os.homedir;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(os as any).homedir = () => testHome;
// Force the file backend so the test does not write to a real OS
// keychain.
process.env.DREAMBOARD_CREDENTIAL_BACKEND = "file";

// Mock only Supabase.
const setSession = mock(async () => ({
  data: {
    session: {
      access_token: "rotated-access-token",
      refresh_token: "rotated-refresh-token",
    },
  },
  error: null,
}));
mock.module("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { setSession } }),
}));

const {
  _resetCredentialStoreForTests,
  fileCredentialBackend,
  getCredentialFilePath,
  setCredentialBackendResolver,
  setCredentials,
} = await import("../config/credential-store.ts");

const { _resetRefreshCoordinatorForTests, ensureFreshAccessToken } =
  await import("./refresh-coordinator.ts");
const { PermanentRefreshError } = await import("./refresh-error.ts");

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

const REFRESH_CONTEXT = {
  supabaseUrl: "https://supabase.example",
  supabaseAnonKey: "anon-key",
};

afterAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (os as any).homedir = originalHomedir;
  delete process.env.DREAMBOARD_CREDENTIAL_BACKEND;
});

beforeEach(async () => {
  setSession.mockClear();
  setSession.mockImplementation(async () => ({
    data: {
      session: {
        access_token: "rotated-access-token",
        refresh_token: "rotated-refresh-token",
      },
    },
    error: null,
  }));
  _resetCredentialStoreForTests();
  setCredentialBackendResolver(() => fileCredentialBackend);
  _resetRefreshCoordinatorForTests();
  await fs.rm(testHome, { recursive: true, force: true });
  await fs.mkdir(testHome, { recursive: true });
});

afterEach(async () => {
  await fs.rm(testHome, { recursive: true, force: true });
});

async function seedRefreshableSession(
  accessToken: string,
  refreshToken: string,
) {
  await setCredentials({ accessToken, refreshToken });
  // Snapshot the exact bytes on disk so later assertions can compare
  // the post-refresh file to the pre-refresh file.
  return fs.readFile(getCredentialFilePath(), "utf8");
}

test("auth.json survives a Supabase transient 5xx during refresh", async () => {
  const expiring = createJwt(60);
  const originalBytes = await seedRefreshableSession(
    expiring,
    "refresh-do-not-wipe",
  );
  setSession.mockImplementation(async () => ({
    data: { session: null },
    error: { message: "Temporary failure, try again" },
  }));

  const result = await ensureFreshAccessToken(REFRESH_CONTEXT);
  expect(result.kind).toBe("transient_failure");

  const postBytes = await fs.readFile(getCredentialFilePath(), "utf8");
  expect(postBytes).toBe(originalBytes);
});

test("auth.json survives a Supabase thrown network error during refresh", async () => {
  const expiring = createJwt(60);
  const originalBytes = await seedRefreshableSession(
    expiring,
    "refresh-do-not-wipe",
  );
  setSession.mockImplementation(async () => {
    throw new Error("fetch failed");
  });

  const result = await ensureFreshAccessToken(REFRESH_CONTEXT);
  expect(result.kind).toBe("transient_failure");

  const postBytes = await fs.readFile(getCredentialFilePath(), "utf8");
  expect(postBytes).toBe(originalBytes);
});

test("auth.json survives a permanent-invalid refresh (PermanentRefreshError thrown, file untouched)", async () => {
  const expiring = createJwt(60);
  const originalBytes = await seedRefreshableSession(expiring, "stale-refresh");
  setSession.mockImplementation(async () => ({
    data: { session: null },
    error: { message: "Invalid Refresh Token: Refresh Token Not Found" },
  }));

  await expect(ensureFreshAccessToken(REFRESH_CONTEXT)).rejects.toBeInstanceOf(
    PermanentRefreshError,
  );

  // CRITICAL: the on-disk file must still contain the original refresh
  // token so the user can recover via `dreamboard login` without losing
  // visibility into their previous state.
  const postBytes = await fs.readFile(getCredentialFilePath(), "utf8");
  expect(postBytes).toBe(originalBytes);
});

test("auth.json is ONLY rewritten when Supabase returns a successful rotation", async () => {
  const expiring = createJwt(60);
  await seedRefreshableSession(expiring, "refresh-token");

  const result = await ensureFreshAccessToken(REFRESH_CONTEXT);
  expect(result.kind).toBe("rotated");

  const parsed = JSON.parse(await fs.readFile(getCredentialFilePath(), "utf8"));
  expect(parsed).toEqual({
    authToken: "rotated-access-token",
    refreshToken: "rotated-refresh-token",
  });
});

test("the lock file cleans up even after a permanent-invalid failure", async () => {
  const expiring = createJwt(60);
  await seedRefreshableSession(expiring, "stale-refresh");
  setSession.mockImplementation(async () => ({
    data: { session: null },
    error: { message: "Invalid Refresh Token: Refresh Token Not Found" },
  }));

  await expect(ensureFreshAccessToken(REFRESH_CONTEXT)).rejects.toBeInstanceOf(
    PermanentRefreshError,
  );

  const dreamboardDir = path.dirname(getCredentialFilePath());
  const entries = await fs.readdir(dreamboardDir);
  // auth.json remains; auth.json.lock must NOT leak and block the next
  // invocation from acquiring the cross-process lock.
  expect(entries.sort()).toEqual(["auth.json"]);
});
