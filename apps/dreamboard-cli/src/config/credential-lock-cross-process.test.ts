/**
 * Cross-process lock coverage.
 *
 * The in-process `withCredentialLock` test in `credential-store.test.ts`
 * proves we serialize within a single Bun process. The scenario that
 * originally motivated the cross-process lock is two *independent* CLI
 * invocations running at the same time (e.g. `dreamboard sync` while a
 * `dreamboard compile` is still in flight). That path is only observable
 * with real child processes.
 *
 * This test spawns four `bun` children that each take the credential
 * lock, read the current access token, sleep briefly, and append their
 * suffix. If the lock is correctly enforced across processes, every
 * suffix lands in the final access token exactly once with no lost
 * updates. If it is not, we will see either a corrupted `auth.json` or
 * an access token missing one of the worker suffixes.
 */

import { afterEach, beforeEach, expect, test } from "bun:test";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const testRoot = path.join(
  os.tmpdir(),
  `dreamboard-credential-lock-cross-process-${process.pid}`,
);
const credentialFile = path.join(testRoot, ".dreamboard", "auth.json");
const lockFile = `${credentialFile}.lock`;
const workerScript = path.join(
  import.meta.dir,
  "__fixtures__",
  "credential-lock-worker.ts",
);

beforeEach(async () => {
  await fs.rm(testRoot, { recursive: true, force: true });
  await fs.mkdir(path.dirname(credentialFile), { recursive: true });
  await fs.writeFile(
    credentialFile,
    `${JSON.stringify(
      { authToken: "rotation-0", refreshToken: "refresh-seed" },
      null,
      2,
    )}\n`,
    { mode: 0o600 },
  );
});

afterEach(async () => {
  await fs.rm(testRoot, { recursive: true, force: true });
});

async function runWorker(suffix: string): Promise<void> {
  const child = Bun.spawn({
    cmd: ["bun", "run", workerScript],
    cwd: path.resolve(import.meta.dir, "..", ".."),
    env: {
      ...process.env,
      HOME: testRoot,
      USERPROFILE: testRoot,
      WORKER_SUFFIX: suffix,
      DREAMBOARD_CREDENTIAL_BACKEND: "file",
    },
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await child.exited;
  if (exitCode !== 0) {
    const stdout = await new Response(child.stdout).text();
    const stderr = await new Response(child.stderr).text();
    throw new Error(
      `credential-lock-worker (${suffix}) exited ${exitCode}.\n` +
        `stdout:\n${stdout}\nstderr:\n${stderr}`,
    );
  }
}

test("withCredentialLock serializes rotations across separate CLI processes", async () => {
  const suffixes = ["a", "b", "c", "d"];

  await Promise.all(suffixes.map((suffix) => runWorker(suffix)));

  const raw = await fs.readFile(credentialFile, "utf8");
  // No partial writes: the JSON must round-trip cleanly.
  const parsed = JSON.parse(raw) as {
    authToken: string;
    refreshToken: string;
  };

  // The refresh token must never be lost when the access token rotates.
  expect(parsed.refreshToken).toBe("refresh-seed");

  // The access token starts as "rotation-0" and each worker appends
  // "-<suffix>" to the value it read under the lock. With correct
  // serialization we get 4 suffix segments appended after "rotation-0",
  // each unique, all four workers represented.
  expect(parsed.authToken.startsWith("rotation-0-")).toBe(true);
  const appended = parsed.authToken
    .slice("rotation-0-".length)
    .split("-")
    .filter((segment) => segment.length > 0);
  expect(appended.length).toBe(suffixes.length);
  expect(new Set(appended)).toEqual(new Set(suffixes));

  // Lock file is released after each worker finishes.
  await expect(fs.access(lockFile)).rejects.toThrow();

  // No stray atomic-write temp files left behind.
  const entries = await fs.readdir(path.dirname(credentialFile));
  expect(entries.sort()).toEqual(["auth.json"]);
});
