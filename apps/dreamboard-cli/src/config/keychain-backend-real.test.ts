/**
 * Real-dependency smoke for the keychain backend.
 *
 * Unlike `keychain-backend.test.ts`, this file deliberately does NOT
 * install a fake `@napi-rs/keyring` module. It exercises the actual
 * dynamic-import + probe path so we catch regressions in the native
 * dependency, the probe logic, or the resolver's fallback behavior on
 * the current platform.
 *
 * The concrete assertion we can make portably is that
 * `tryKeychainBackend()` returns a well-formed result without throwing,
 * regardless of whether libsecret / Keychain / Credential Vault happens
 * to be available. With the default-is-file resolver we also assert
 * that a fresh config (no `credentialBackend` preference, no env var
 * override) resolves to the file backend on every platform - users
 * must opt in to keychain explicitly.
 */

import { afterAll, afterEach, beforeEach, expect, test } from "bun:test";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const testHome = path.join(
  os.tmpdir(),
  `dreamboard-keychain-backend-real-${process.pid}`,
);
const originalHomedir = os.homedir;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(os as any).homedir = () => testHome;

const { _resetCredentialStoreForTests, getActiveCredentialBackendName } =
  await import("./credential-store.ts");

const { _resetKeyringModuleForTests, tryKeychainBackend } = await import(
  "./keychain-backend.ts"
);

afterAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (os as any).homedir = originalHomedir;
});

beforeEach(async () => {
  _resetKeyringModuleForTests();
  _resetCredentialStoreForTests();
  delete process.env.DREAMBOARD_CREDENTIAL_BACKEND;
  await fs.rm(testHome, { recursive: true, force: true });
  await fs.mkdir(testHome, { recursive: true });
});

afterEach(() => {
  _resetKeyringModuleForTests();
  _resetCredentialStoreForTests();
});

test("tryKeychainBackend returns a well-formed result without throwing", async () => {
  const result = await tryKeychainBackend();
  if (result.available) {
    expect(result.backend.name).toBe("keychain");
    expect(typeof result.backend.read).toBe("function");
    expect(typeof result.backend.writeFull).toBe("function");
    expect(typeof result.backend.writeAccessOnly).toBe("function");
    expect(typeof result.backend.clear).toBe("function");
  } else {
    expect(typeof result.reason).toBe("string");
    expect(result.reason.length).toBeGreaterThan(0);
  }
});

test("defaultBackendResolver resolves to the file backend when no opt-in is set", async () => {
  // With the default-is-file resolver, the active backend must be
  // "file" regardless of whether the OS keychain is reachable. On
  // darwin / windows / linux-with-dbus the keychain is physically
  // available, but users should not be auto-enrolled into it.
  const name = await getActiveCredentialBackendName();
  expect(name).toBe("file");
});
