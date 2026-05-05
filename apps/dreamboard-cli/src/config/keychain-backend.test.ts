import { afterAll, afterEach, beforeEach, expect, test } from "bun:test";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

// Redirect ~/.dreamboard to an isolated tmpdir BEFORE importing the
// store or keychain modules.
const testHome = path.join(
  os.tmpdir(),
  `dreamboard-keychain-backend-test-${process.pid}`,
);
const originalHomedir = os.homedir;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(os as any).homedir = () => testHome;

const {
  _resetCredentialStoreForTests,
  getCredentialBackend,
  getActiveCredentialBackendName,
  getCredentialFilePath,
  getStoredSession,
  setCredentialBackendResolver,
  fileCredentialBackend,
} = await import("./credential-store.ts");

const { getGlobalConfigPath, saveGlobalConfig } = await import(
  "./global-config.ts"
);

const {
  _resetKeyringModuleForTests,
  _setKeyringModuleForTests,
  tryKeychainBackend,
} = await import("./keychain-backend.ts");

async function optInToKeychain(): Promise<void> {
  // Equivalent to editing `~/.dreamboard/config.json` and setting
  // `credentialBackend: "keychain"`. The file backend is the default,
  // so tests that want keychain behavior must write this preference
  // explicitly.
  await saveGlobalConfig({ credentialBackend: "keychain" });
}

async function clearGlobalConfig(): Promise<void> {
  await fs.rm(getGlobalConfigPath(), { force: true });
}

type FakeEntry = {
  _value: string | null;
  setPassword(value: string): void;
  getPassword(): string | null;
  deletePassword(): boolean;
};

let fakeEntries = new Map<string, FakeEntry>();
function buildFakeKeyringModule(options: {
  probeThrows?: boolean;
  getThrows?: boolean;
}) {
  return {
    Entry: class {
      private key: string;
      constructor(service: string, account: string) {
        this.key = `${service}/${account}`;
        if (!fakeEntries.has(this.key)) {
          fakeEntries.set(this.key, {
            _value: null,
            setPassword(value) {
              this._value = value;
            },
            getPassword() {
              if (options.getThrows) throw new Error("keyring unavailable");
              return this._value;
            },
            deletePassword() {
              const had = this._value !== null;
              this._value = null;
              return had;
            },
          });
        }
      }
      setPassword(value: string) {
        fakeEntries.get(this.key)!.setPassword(value);
      }
      getPassword(): string | null {
        if (options.probeThrows) {
          throw new Error("keyring probe failed");
        }
        return fakeEntries.get(this.key)!.getPassword();
      }
      deletePassword(): boolean {
        return fakeEntries.get(this.key)!.deletePassword();
      }
    },
  } as any;
}

afterAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (os as any).homedir = originalHomedir;
});

beforeEach(async () => {
  fakeEntries = new Map();
  _resetKeyringModuleForTests();
  _resetCredentialStoreForTests();
  delete process.env.DREAMBOARD_CREDENTIAL_BACKEND;
  await fs.rm(testHome, { recursive: true, force: true });
  await fs.mkdir(testHome, { recursive: true });
});

afterEach(async () => {
  _resetKeyringModuleForTests();
  _resetCredentialStoreForTests();
  delete process.env.DREAMBOARD_CREDENTIAL_BACKEND;
  await fs.rm(testHome, { recursive: true, force: true });
});

test("tryKeychainBackend reports unavailable when the native module is missing", async () => {
  _setKeyringModuleForTests(null);
  const result = await tryKeychainBackend();
  expect(result.available).toBe(false);
  if (!result.available) {
    expect(result.reason).toContain("not installed");
  }
});

test("tryKeychainBackend reports unavailable when the probe throws", async () => {
  _setKeyringModuleForTests(buildFakeKeyringModule({ probeThrows: true }));
  const result = await tryKeychainBackend();
  expect(result.available).toBe(false);
  if (!result.available) {
    expect(result.reason).toContain("not accessible");
  }
});

test("keychain backend round-trips a refreshable session", async () => {
  _setKeyringModuleForTests(buildFakeKeyringModule({}));
  const result = await tryKeychainBackend();
  expect(result.available).toBe(true);
  if (!result.available) return;
  const backend = result.backend;

  expect(await backend.read()).toBeNull();
  await backend.writeFull({
    accessToken: "access-1",
    refreshToken: "refresh-1",
  });
  expect(await backend.read()).toEqual({
    accessToken: "access-1",
    refreshToken: "refresh-1",
  });
  await backend.clear();
  expect(await backend.read()).toBeNull();
});

test("keychain backend refuses to persist empty tokens", async () => {
  _setKeyringModuleForTests(buildFakeKeyringModule({}));
  const result = await tryKeychainBackend();
  expect(result.available).toBe(true);
  if (!result.available) return;
  await expect(
    result.backend.writeFull({ accessToken: "", refreshToken: "refresh" }),
  ).rejects.toThrow(/empty/);
  await expect(
    result.backend.writeFull({ accessToken: "access", refreshToken: "" }),
  ).rejects.toThrow(/empty/);
  await expect(result.backend.writeAccessOnly("")).rejects.toThrow(/empty/);
});

test("credential store defaults to the file backend when no opt-in is set", async () => {
  // Fake keychain is available, but the user has not opted in via
  // config. We must resolve to the file backend so users never get a
  // macOS password prompt on first use.
  await clearGlobalConfig();
  _setKeyringModuleForTests(buildFakeKeyringModule({}));
  _resetCredentialStoreForTests();

  const backend = await getCredentialBackend();
  expect(backend.name).toBe("file");
  expect(await getActiveCredentialBackendName()).toBe("file");
});

test("credentialBackend: 'keychain' in config.json opts into the OS keychain", async () => {
  await optInToKeychain();
  _setKeyringModuleForTests(buildFakeKeyringModule({}));
  _resetCredentialStoreForTests();

  const backend = await getCredentialBackend();
  expect(backend.name).toBe("keychain");
  expect(await getActiveCredentialBackendName()).toBe("keychain");
});

test("credentialBackend: 'file' in config.json pins the file backend", async () => {
  await saveGlobalConfig({ credentialBackend: "file" });
  _setKeyringModuleForTests(buildFakeKeyringModule({}));
  _resetCredentialStoreForTests();

  const backend = await getCredentialBackend();
  expect(backend.name).toBe("file");
});

test("opted-in keychain falls back to file when the native module is missing", async () => {
  await optInToKeychain();
  _setKeyringModuleForTests(null);
  _resetCredentialStoreForTests();

  const backend = await getCredentialBackend();
  expect(backend.name).toBe("file");
});

test("credential store migrates legacy auth.json into the keychain after the user opts in", async () => {
  // Seed the file backend with legacy tokens.
  await fs.mkdir(path.dirname(getCredentialFilePath()), { recursive: true });
  await fs.writeFile(
    getCredentialFilePath(),
    JSON.stringify({
      authToken: "legacy-access",
      refreshToken: "legacy-refresh",
    }),
    "utf8",
  );

  await optInToKeychain();
  const fakeModule = buildFakeKeyringModule({});
  _setKeyringModuleForTests(fakeModule);
  _resetCredentialStoreForTests();

  const backend = await getCredentialBackend();
  expect(backend.name).toBe("keychain");
  expect(await getActiveCredentialBackendName()).toBe("keychain");

  // The session is now visible through the credential-store public API
  // (which reads through the active backend).
  expect(await getStoredSession()).toEqual({
    accessToken: "legacy-access",
    refreshToken: "legacy-refresh",
  });
  // The file has been removed after a successful migration.
  await expect(fs.access(getCredentialFilePath())).rejects.toThrow();
});

test("credential store does not stomp a keychain session with a stale file session", async () => {
  await optInToKeychain();
  // Keychain has an already-migrated, fresh session.
  _setKeyringModuleForTests(buildFakeKeyringModule({}));
  const bootstrap = await tryKeychainBackend();
  expect(bootstrap.available).toBe(true);
  if (!bootstrap.available) return;
  await bootstrap.backend.writeFull({
    accessToken: "fresh-access",
    refreshToken: "fresh-refresh",
  });

  // Pretend an old auth.json from a previous CLI install is still on
  // disk.
  await fs.mkdir(path.dirname(getCredentialFilePath()), { recursive: true });
  await fs.writeFile(
    getCredentialFilePath(),
    JSON.stringify({
      authToken: "stale-access",
      refreshToken: "stale-refresh",
    }),
    "utf8",
  );

  _resetCredentialStoreForTests();
  const backend = await getCredentialBackend();
  expect(backend.name).toBe("keychain");
  expect(await getStoredSession()).toEqual({
    accessToken: "fresh-access",
    refreshToken: "fresh-refresh",
  });
  // Stale file is cleaned up but the fresh keychain session is
  // untouched.
  await expect(fs.access(getCredentialFilePath())).rejects.toThrow();
});

test("DREAMBOARD_CREDENTIAL_BACKEND=file pins the file backend even when the user opted into keychain", async () => {
  await optInToKeychain();
  process.env.DREAMBOARD_CREDENTIAL_BACKEND = "file";
  _setKeyringModuleForTests(buildFakeKeyringModule({}));
  _resetCredentialStoreForTests();

  const backend = await getCredentialBackend();
  expect(backend.name).toBe("file");
  expect(await getActiveCredentialBackendName()).toBe("file");
});

test("DREAMBOARD_CREDENTIAL_BACKEND=keychain overrides config.json and opts into keychain", async () => {
  await clearGlobalConfig();
  process.env.DREAMBOARD_CREDENTIAL_BACKEND = "keychain";
  _setKeyringModuleForTests(buildFakeKeyringModule({}));
  _resetCredentialStoreForTests();

  const backend = await getCredentialBackend();
  expect(backend.name).toBe("keychain");
});

test("DREAMBOARD_CREDENTIAL_BACKEND=auto follows the config preference", async () => {
  await optInToKeychain();
  process.env.DREAMBOARD_CREDENTIAL_BACKEND = "auto";
  _setKeyringModuleForTests(buildFakeKeyringModule({}));
  _resetCredentialStoreForTests();

  const backend = await getCredentialBackend();
  expect(backend.name).toBe("keychain");
});

test("DREAMBOARD_CREDENTIAL_BACKEND with an unknown value fails loud", async () => {
  process.env.DREAMBOARD_CREDENTIAL_BACKEND = "cloud";
  _setKeyringModuleForTests(buildFakeKeyringModule({}));
  _resetCredentialStoreForTests();

  await expect(getCredentialBackend()).rejects.toThrow(
    /Unknown DREAMBOARD_CREDENTIAL_BACKEND/,
  );
});

test("keychain read() returns null when the OS reports a missing entry", async () => {
  _setKeyringModuleForTests(buildFakeKeyringModule({}));
  const real = await tryKeychainBackend();
  expect(real.available).toBe(true);
  if (!real.available) return;
  // After the probe succeeded, monkey-patch the underlying fake entry
  // to throw a "not found"-style error on read. The backend's error
  // filter should translate that into `null` (no session) rather than
  // propagating.
  const entry = [...fakeEntries.values()][0]!;
  const originalGet = entry.getPassword.bind(entry);
  entry.getPassword = () => {
    throw new Error("no matching entry in keyring");
  };
  try {
    expect(await real.backend.read()).toBeNull();
  } finally {
    entry.getPassword = originalGet;
  }
});

test("keychain read() rethrows unknown errors so callers can surface them", async () => {
  _setKeyringModuleForTests(buildFakeKeyringModule({}));
  const real = await tryKeychainBackend();
  expect(real.available).toBe(true);
  if (!real.available) return;
  const entry = [...fakeEntries.values()][0]!;
  entry.getPassword = () => {
    throw new Error("keyring returned a surprising error");
  };
  await expect(real.backend.read()).rejects.toThrow(/surprising error/);
  // Restore the file backend so teardown does not accidentally hit
  // the broken keyring.
  setCredentialBackendResolver(() => fileCredentialBackend);
});
