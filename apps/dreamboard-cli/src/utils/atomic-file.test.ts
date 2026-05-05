import { afterAll, beforeEach, expect, test } from "bun:test";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { atomicWriteFile, withFileLock } from "./atomic-file.ts";

const testRoot = path.join(
  os.tmpdir(),
  `dreamboard-atomic-file-test-${process.pid}`,
);

beforeEach(async () => {
  await fs.rm(testRoot, { recursive: true, force: true });
  await fs.mkdir(testRoot, { recursive: true });
});

afterAll(async () => {
  await fs.rm(testRoot, { recursive: true, force: true });
});

test("atomicWriteFile creates the file with the requested payload and mode", async () => {
  const target = path.join(testRoot, "payload.json");
  await atomicWriteFile(target, '{"foo":"bar"}\n');

  const contents = await fs.readFile(target, "utf8");
  expect(contents).toBe('{"foo":"bar"}\n');

  if (process.platform !== "win32") {
    const stat = await fs.stat(target);
    // Only check the user/group/other mode bits.
    // eslint-disable-next-line no-bitwise
    expect(stat.mode & 0o777).toBe(0o600);
  }
});

test("atomicWriteFile refuses to clobber with an empty payload", async () => {
  const target = path.join(testRoot, "keepme.json");
  await atomicWriteFile(target, '{"keep":true}\n');

  await expect(atomicWriteFile(target, "")).rejects.toThrow(
    /Refusing to atomicWriteFile an empty payload/,
  );

  const contents = await fs.readFile(target, "utf8");
  expect(contents).toBe('{"keep":true}\n');
});

test("atomicWriteFile overwrites atomically so readers never see a partial file", async () => {
  const target = path.join(testRoot, "overwrite.json");
  await atomicWriteFile(target, '{"value":"v1"}\n');
  await atomicWriteFile(target, '{"value":"v2"}\n');

  const contents = await fs.readFile(target, "utf8");
  expect(contents).toBe('{"value":"v2"}\n');

  // The .tmp sidecar from the second write should not remain on disk.
  const entries = await fs.readdir(testRoot);
  expect(entries).toEqual(["overwrite.json"]);
});

test("withFileLock serializes concurrent holders around a critical section", async () => {
  const lockPath = path.join(testRoot, "mutex.lock");
  const state = { active: 0, peak: 0 };

  async function criticalSection() {
    return withFileLock(lockPath, async () => {
      state.active += 1;
      state.peak = Math.max(state.peak, state.active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      state.active -= 1;
    });
  }

  await Promise.all([
    criticalSection(),
    criticalSection(),
    criticalSection(),
    criticalSection(),
  ]);

  expect(state.peak).toBe(1);
  // Lock file is cleaned up after the last holder releases it.
  const entries = await fs.readdir(testRoot);
  expect(entries).toEqual([]);
});

test("withFileLock forcibly reclaims a stale lock left by a crashed process", async () => {
  const lockPath = path.join(testRoot, "stale.lock");
  await fs.writeFile(lockPath, "99999\n");
  const old = new Date(Date.now() - 60_000);
  await fs.utimes(lockPath, old, old);

  let ran = false;
  await withFileLock(
    lockPath,
    async () => {
      ran = true;
    },
    { staleMs: 10 },
  );
  expect(ran).toBe(true);
});
