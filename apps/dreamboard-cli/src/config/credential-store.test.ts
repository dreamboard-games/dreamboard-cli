import { afterAll, afterEach, beforeEach, expect, mock, test } from "bun:test";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

// Redirect ~/.dreamboard to an isolated tmpdir BEFORE importing the store.
const testHome = path.join(
  os.tmpdir(),
  `dreamboard-credential-store-test-${process.pid}`,
);
const originalHomedir = os.homedir;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(os as any).homedir = () => testHome;
// Pin the file backend so these tests never reach for the real OS
// keychain (which would pollute the developer's machine with test
// credentials and fail on headless CI).
process.env.DREAMBOARD_CREDENTIAL_BACKEND = "file";

const {
  _resetCredentialStoreForTests,
  clearCredentials,
  fileCredentialBackend,
  getCredentialFilePath,
  getCredentials,
  getStoredSession,
  setAccessOnlySession,
  setCredentialBackendResolver,
  setCredentials,
  withCredentialLock,
} = await import("./credential-store.ts");

afterAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (os as any).homedir = originalHomedir;
});

beforeEach(async () => {
  _resetCredentialStoreForTests();
  setCredentialBackendResolver(() => fileCredentialBackend);
  await fs.rm(testHome, { recursive: true, force: true });
  await fs.mkdir(testHome, { recursive: true });
});

afterEach(async () => {
  await fs.rm(testHome, { recursive: true, force: true });
});

test("getStoredSession returns null when auth.json does not exist", async () => {
  expect(await getStoredSession()).toBeNull();
  expect(await getCredentials()).toBeNull();
});

test("setCredentials round-trips a refreshable session through disk", async () => {
  await setCredentials({
    accessToken: "access-1",
    refreshToken: "refresh-1",
  });

  const snapshot = await getStoredSession();
  expect(snapshot).toEqual({
    accessToken: "access-1",
    refreshToken: "refresh-1",
  });
  const creds = await getCredentials();
  expect(creds).toEqual({
    accessToken: "access-1",
    refreshToken: "refresh-1",
  });

  const raw = await fs.readFile(getCredentialFilePath(), "utf8");
  const parsed = JSON.parse(raw);
  // The on-disk shape is backward compatible with older CLIs that
  // expect `authToken` + `refreshToken`.
  expect(parsed).toEqual({
    authToken: "access-1",
    refreshToken: "refresh-1",
  });
});

test("setCredentials refuses to persist empty tokens", async () => {
  await expect(
    setCredentials({
      accessToken: "",
      refreshToken: "refresh-1",
    }),
  ).rejects.toThrow(/empty/);
  await expect(
    setCredentials({
      accessToken: "access-1",
      refreshToken: "",
    }),
  ).rejects.toThrow(/empty/);
  expect(await getStoredSession()).toBeNull();
});

test("setAccessOnlySession writes a token without a refresh token", async () => {
  await setAccessOnlySession("access-only");

  const snapshot = await getStoredSession();
  expect(snapshot).toEqual({ accessToken: "access-only" });
  // getCredentials requires both tokens; access-only sessions must not
  // masquerade as refreshable credentials.
  expect(await getCredentials()).toBeNull();
});

test("setAccessOnlySession overwriting a refreshable session drops the refresh token", async () => {
  await setCredentials({
    accessToken: "access-1",
    refreshToken: "refresh-1",
  });
  await setAccessOnlySession("access-only");

  expect(await getStoredSession()).toEqual({ accessToken: "access-only" });
  expect(await getCredentials()).toBeNull();
});

test("getStoredSession accepts the legacy `authToken` key for backward compatibility", async () => {
  const target = getCredentialFilePath();
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(
    target,
    JSON.stringify({
      authToken: "legacy-access",
      refreshToken: "legacy-refresh",
    }),
    "utf8",
  );
  expect(await getStoredSession()).toEqual({
    accessToken: "legacy-access",
    refreshToken: "legacy-refresh",
  });
});

test("getStoredSession tolerates a malformed auth.json by returning null", async () => {
  const target = getCredentialFilePath();
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, "not-json", "utf8");
  expect(await getStoredSession()).toBeNull();
});

test("clearCredentials removes the on-disk session", async () => {
  await setCredentials({
    accessToken: "access-1",
    refreshToken: "refresh-1",
  });
  await clearCredentials();
  expect(await getStoredSession()).toBeNull();
  await expect(fs.access(getCredentialFilePath())).rejects.toThrow();
});

test("clearCredentials is idempotent when auth.json does not exist", async () => {
  await expect(clearCredentials()).resolves.toBeUndefined();
});

test("withCredentialLock serializes concurrent read-modify-write rotations", async () => {
  await setCredentials({
    accessToken: "access-0",
    refreshToken: "refresh-0",
  });

  const state = { active: 0, peak: 0 };
  async function rotate(suffix: string) {
    return withCredentialLock(async (ops) => {
      state.active += 1;
      state.peak = Math.max(state.peak, state.active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      const existing = await ops.read();
      await ops.writeFull({
        accessToken: `${existing?.accessToken}-${suffix}`,
        refreshToken: `${existing?.refreshToken}-${suffix}`,
      });
      state.active -= 1;
    });
  }

  await Promise.all([rotate("a"), rotate("b"), rotate("c"), rotate("d")]);

  expect(state.peak).toBe(1);
  const snapshot = await getStoredSession();
  // Each rotation appended its own suffix; observed values must reflect
  // a strictly-serial sequence.
  expect(snapshot?.accessToken?.startsWith("access-0-")).toBe(true);
  const rotations = snapshot?.accessToken?.split("-").slice(2) ?? [];
  expect(rotations.length).toBe(4);
  expect(new Set(rotations)).toEqual(new Set(["a", "b", "c", "d"]));
});

test("a failing writer inside withCredentialLock does not corrupt auth.json", async () => {
  await setCredentials({
    accessToken: "access-original",
    refreshToken: "refresh-original",
  });

  // Simulate a crash *during* the write path (e.g. kernel signal,
  // fs.write throws). atomicWriteFile leaves the target untouched
  // because it renames from a temp sidecar.
  const originalOpen = fs.open;
  const openSpy = mock(async (pathlike: any, flags: any, mode?: any) => {
    const asStr = String(pathlike);
    if (asStr.includes("auth.json.tmp-")) {
      throw new Error("simulated fs outage during write");
    }
    return originalOpen(pathlike, flags, mode);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (fs as any).open = openSpy;
  try {
    await expect(
      setCredentials({
        accessToken: "access-next",
        refreshToken: "refresh-next",
      }),
    ).rejects.toThrow(/simulated fs outage/);
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fs as any).open = originalOpen;
  }

  // The existing session must still be readable verbatim.
  expect(await getStoredSession()).toEqual({
    accessToken: "access-original",
    refreshToken: "refresh-original",
  });
  // No temp files left behind in the ~/.dreamboard directory.
  const entries = await fs.readdir(path.dirname(getCredentialFilePath()));
  expect(entries.sort()).toEqual(["auth.json"]);
});
