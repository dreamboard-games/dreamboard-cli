import { mkdir, mkdtemp, rm, stat, utimes, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "bun:test";
import { acquireDirectoryLock } from "./directory-lock.js";

test("acquireDirectoryLock removes an orphaned lock without owner metadata", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-directory-lock-"));
  const lockPath = path.join(tempRoot, "snapshot.lock");

  try {
    await mkdir(lockPath);
    const staleTimestamp = new Date(Date.now() - 60_000);
    await utimes(lockPath, staleTimestamp, staleTimestamp);

    const releaseLock = await acquireDirectoryLock({
      lockPath,
      owner: {
        pid: process.pid,
        createdAt: new Date().toISOString(),
        command: ["bun", "test"],
        cwd: tempRoot,
      },
      staleAfterMs: 1,
      waitMs: 1,
    });

    await releaseLock();
    await expect(stat(lockPath)).rejects.toThrow();
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("acquireDirectoryLock removes a lock owned by a dead process", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-directory-lock-"));
  const lockPath = path.join(tempRoot, "snapshot.lock");

  try {
    await mkdir(lockPath);
    await writeFile(
      path.join(lockPath, "owner.json"),
      JSON.stringify({
        pid: 999_999,
        createdAt: new Date(Date.now() - 60_000).toISOString(),
        command: ["stale"],
        cwd: tempRoot,
      }),
      "utf8",
    );

    const releaseLock = await acquireDirectoryLock({
      lockPath,
      owner: {
        pid: process.pid,
        createdAt: new Date().toISOString(),
        command: ["bun", "test"],
        cwd: tempRoot,
      },
      waitMs: 1,
      isProcessAlive: async (pid) => pid === process.pid,
    });

    await releaseLock();
    await expect(stat(lockPath)).rejects.toThrow();
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
