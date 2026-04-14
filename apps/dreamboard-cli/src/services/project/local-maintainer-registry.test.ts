import { EventEmitter } from "node:events";
import { afterEach, expect, mock, test } from "bun:test";

type SpawnBehavior =
  | {
      type: "success";
      stdout: string;
      stderr?: string;
      exitCode?: number;
    }
  | {
      type: "failure";
      stdout?: string;
      stderr: string;
      exitCode: number;
    }
  | {
      type: "error";
      error: NodeJS.ErrnoException;
    };

const spawnBehaviors: SpawnBehavior[] = [];
const spawnMock = mock((command: string, args: string[], options: object) => {
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
  };
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  const behavior = spawnBehaviors.shift() ?? {
    type: "success",
    stdout: "null\n",
  };

  queueMicrotask(() => {
    if (behavior.type === "error") {
      child.emit("error", behavior.error);
      return;
    }
    if (behavior.stdout) {
      child.stdout.emit("data", Buffer.from(behavior.stdout));
    }
    if (behavior.stderr) {
      child.stderr.emit("data", Buffer.from(behavior.stderr));
    }
    child.emit(
      "close",
      behavior.type === "success"
        ? (behavior.exitCode ?? 0)
        : behavior.exitCode,
    );
  });

  return child;
});

const actualChildProcess = await import("node:child_process");

mock.module("node:child_process", () => ({
  ...actualChildProcess,
  spawn: spawnMock,
}));

function queueSpawnBehavior(behavior: SpawnBehavior) {
  spawnBehaviors.push(behavior);
}

async function loadLocalMaintainerRegistry() {
  return import(`./local-maintainer-registry.ts?test=${Math.random()}`);
}

afterEach(() => {
  spawnBehaviors.length = 0;
  spawnMock.mockClear();
});

test("ensureLocalMaintainerSnapshot returns null without invoking the helper outside local maintainer mode", async () => {
  const { ensureLocalMaintainerSnapshot } = await loadLocalMaintainerRegistry();

  await expect(
    ensureLocalMaintainerSnapshot("https://api.dreamboard.games"),
  ).resolves.toBeNull();
  expect(spawnMock).not.toHaveBeenCalled();
});

test("ensureLocalMaintainerSnapshot delegates to the source-checkout helper and parses JSON", async () => {
  const { ensureLocalMaintainerSnapshot } = await loadLocalMaintainerRegistry();
  queueSpawnBehavior({
    type: "success",
    stdout: `${JSON.stringify({
      registryUrl: "http://127.0.0.1:4873",
      snapshotId: "snapshot-1",
      fingerprint: "fingerprint-1",
      publishedAt: "2026-04-13T00:00:00.000Z",
      packages: {
        "@dreamboard/api-client": "0.1.0-local.1",
        "@dreamboard/app-sdk": "0.0.40-local.1",
        "@dreamboard/sdk-types": "0.1.0-local.1",
        "@dreamboard/ui-sdk": "0.0.40-local.1",
      },
    })}\n`,
  });

  const result = await ensureLocalMaintainerSnapshot("http://localhost:8080");

  expect(result?.snapshotId).toBe("snapshot-1");
  expect(spawnMock).toHaveBeenCalledTimes(1);
  expect(spawnMock.mock.calls[0]?.[0]).toBe(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  );
  expect(spawnMock.mock.calls[0]?.[1]).toEqual(
    expect.arrayContaining([
      "exec",
      "tsx",
      expect.stringContaining("scripts/local-maintainer-registry.ts"),
      "ensure-snapshot",
      "--api-base-url",
      "http://localhost:8080",
    ]),
  );
});

test("readWorkspaceLocalMaintainerRegistry delegates to the helper and accepts null JSON responses", async () => {
  const { readWorkspaceLocalMaintainerRegistry } =
    await loadLocalMaintainerRegistry();
  queueSpawnBehavior({
    type: "success",
    stdout: "null\n",
  });

  await expect(
    readWorkspaceLocalMaintainerRegistry("/tmp/workspace"),
  ).resolves.toBeNull();
  expect(spawnMock).toHaveBeenCalledTimes(1);
  expect(spawnMock.mock.calls[0]?.[1]).toEqual(
    expect.arrayContaining([
      "read-workspace",
      "--project-root",
      "/tmp/workspace",
      "--fallback-registry-url",
      "http://127.0.0.1:4873",
    ]),
  );
});

test("helper failures surface stderr and attempted command", async () => {
  const { ensureLocalMaintainerSnapshot } = await loadLocalMaintainerRegistry();
  queueSpawnBehavior({
    type: "failure",
    stderr: "helper exploded",
    exitCode: 1,
  });

  await expect(async () => {
    try {
      await ensureLocalMaintainerSnapshot("http://localhost:8080");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("helper exploded");
      expect((error as Error).message).toContain("Attempted command:");
      throw error;
    }
  }).toThrow();
});

test("missing pnpm surfaces a targeted source-checkout setup error", async () => {
  const { ensureLocalMaintainerSnapshot } = await loadLocalMaintainerRegistry();
  const error = new Error("spawn pnpm ENOENT") as NodeJS.ErrnoException;
  error.code = "ENOENT";
  queueSpawnBehavior({
    type: "error",
    error,
  });

  await expect(
    ensureLocalMaintainerSnapshot("http://localhost:8080"),
  ).rejects.toThrow("`pnpm` was not found on PATH");
});
