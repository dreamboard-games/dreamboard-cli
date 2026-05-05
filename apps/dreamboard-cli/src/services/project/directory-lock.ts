import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_LOCK_METADATA_FILE = "owner.json";
const DEFAULT_STALE_AFTER_MS = 5_000;
const DEFAULT_WAIT_MS = 250;

type LockOwnerMetadata = {
  pid?: unknown;
  createdAt?: unknown;
  command?: unknown;
  cwd?: unknown;
};

export type DirectoryLockOwner = {
  pid: number;
  createdAt: string;
  command: string[];
  cwd: string;
};

export async function acquireDirectoryLock(options: {
  lockPath: string;
  owner: DirectoryLockOwner;
  lockMetadataFileName?: string;
  staleAfterMs?: number;
  waitMs?: number;
  isProcessAlive?: (pid: number) => Promise<boolean>;
}): Promise<() => Promise<void>> {
  const lockMetadataFileName =
    options.lockMetadataFileName ?? DEFAULT_LOCK_METADATA_FILE;
  await mkdir(path.dirname(options.lockPath), { recursive: true });

  while (true) {
    try {
      await mkdir(options.lockPath);
      await writeFile(
        path.join(options.lockPath, lockMetadataFileName),
        `${JSON.stringify(options.owner, null, 2)}\n`,
        "utf8",
      );
      return async () => {
        await rm(options.lockPath, { recursive: true, force: true });
      };
    } catch (error) {
      if (
        !(error instanceof Error && "code" in error && error.code === "EEXIST")
      ) {
        throw error;
      }

      if (await clearStaleDirectoryLock(options)) {
        continue;
      }

      await waitForDirectoryLockRelease(options);
    }
  }
}

export async function waitForDirectoryLockRelease(options: {
  lockPath: string;
  lockMetadataFileName?: string;
  staleAfterMs?: number;
  waitMs?: number;
  isProcessAlive?: (pid: number) => Promise<boolean>;
}): Promise<void> {
  while (await pathExists(options.lockPath)) {
    if (await clearStaleDirectoryLock(options)) {
      return;
    }
    await sleep(options.waitMs ?? DEFAULT_WAIT_MS);
  }
}

async function clearStaleDirectoryLock(options: {
  lockPath: string;
  lockMetadataFileName?: string;
  staleAfterMs?: number;
  isProcessAlive?: (pid: number) => Promise<boolean>;
}): Promise<boolean> {
  if (!(await pathExists(options.lockPath))) {
    return false;
  }

  const isStale = await isDirectoryLockStale(options);
  if (!isStale) {
    return false;
  }

  await rm(options.lockPath, { recursive: true, force: true });
  return true;
}

async function isDirectoryLockStale(options: {
  lockPath: string;
  lockMetadataFileName?: string;
  staleAfterMs?: number;
  isProcessAlive?: (pid: number) => Promise<boolean>;
}): Promise<boolean> {
  const staleAfterMs = options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS;
  const lockStat = await stat(options.lockPath).catch(() => null);
  if (!lockStat) {
    return false;
  }

  const metadata = await readLockOwnerMetadata(
    options.lockPath,
    options.lockMetadataFileName ?? DEFAULT_LOCK_METADATA_FILE,
  );

  if (metadata?.pid !== undefined) {
    const isAlive = await (options.isProcessAlive ?? defaultIsProcessAlive)(
      metadata.pid,
    );
    return !isAlive;
  }

  return Date.now() - lockStat.mtimeMs >= staleAfterMs;
}

async function readLockOwnerMetadata(
  lockPath: string,
  lockMetadataFileName: string,
): Promise<{ pid?: number } | null> {
  const metadataText = await readFile(
    path.join(lockPath, lockMetadataFileName),
    "utf8",
  ).catch(() => null);
  if (!metadataText) {
    return null;
  }

  try {
    const parsed = JSON.parse(metadataText) as LockOwnerMetadata;
    return {
      pid:
        typeof parsed.pid === "number" && Number.isFinite(parsed.pid)
          ? parsed.pid
          : undefined,
    };
  } catch {
    return null;
  }
}

async function defaultIsProcessAlive(pid: number): Promise<boolean> {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function pathExists(targetPath: string): Promise<boolean> {
  return (await stat(targetPath).catch(() => null)) !== null;
}

async function sleep(waitMs: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, waitMs));
}
