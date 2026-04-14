import { EventEmitter } from "node:events";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, mock, test } from "bun:test";

const spawnMock = mock(
  (
    binary: string,
    _args: string[],
    _options: { cwd: string; env: NodeJS.ProcessEnv },
  ) => {
    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
    };
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();

    queueMicrotask(() => {
      if (binary === "pnpm") {
        child.emit("error", new Error("spawn pnpm ENOENT"));
        return;
      }
      child.emit("close", 0);
    });

    return child;
  },
);

mock.module("node:child_process", () => ({
  spawn: spawnMock,
}));

const { generatePnpmLockfile, installWorkspaceDependencies } = await import(
  "./workspace-dependencies.ts"
);

afterEach(() => {
  spawnMock.mockClear();
});

test("generatePnpmLockfile falls back to npm when pnpm is unavailable", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-lockfile-"));
  const packageJsonPath = path.join(tempRoot, "package.json");

  await writeFile(
    packageJsonPath,
    JSON.stringify(
      {
        private: true,
        dependencies: {
          "@dreamboard/app-sdk": "0.0.40",
          "@dreamboard/sdk-types": "0.0.40",
          "@dreamboard/ui-sdk": "0.0.40",
        },
      },
      null,
      2,
    ),
  );

  const generated = await generatePnpmLockfile(tempRoot);
  expect(generated).toBe(true);

  expect(spawnMock.mock.calls.map(([binary, args]) => [binary, args])).toEqual([
    [
      "pnpm",
      [
        "install",
        "--ignore-workspace",
        "--lockfile-only",
        "--config.shared-workspace-lockfile=false",
      ],
    ],
    ["npm", ["install", "--package-lock-only"]],
  ]);
  expect(JSON.parse(await readFile(packageJsonPath, "utf8"))).toMatchObject({
    dependencies: {
      "@dreamboard/app-sdk": "0.0.40",
      "@dreamboard/sdk-types": "0.0.40",
      "@dreamboard/ui-sdk": "0.0.40",
    },
  });
});

test("installWorkspaceDependencies rewrites local sdk package specs for local checkout fallback", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-install-"));
  const packageJsonPath = path.join(tempRoot, "package.json");

  await writeFile(
    packageJsonPath,
    JSON.stringify(
      {
        private: true,
        dependencies: {
          "@dreamboard/app-sdk": "0.0.40",
          "@dreamboard/sdk-types": "0.0.40",
          "@dreamboard/ui-sdk": "0.0.40",
        },
      },
      null,
      2,
    ),
  );

  await installWorkspaceDependencies(tempRoot, {
    localSdkPackageFallback: true,
  });

  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    dependencies: Record<string, string>;
  };
  expect(packageJson.dependencies["@dreamboard/app-sdk"]).toContain(
    "packages/app-sdk",
  );
  expect(packageJson.dependencies["@dreamboard/sdk-types"]).toContain(
    "packages/sdk-types",
  );
  expect(packageJson.dependencies["@dreamboard/ui-sdk"]).toContain(
    "packages/ui-sdk",
  );
});

test("installWorkspaceDependencies falls back to npm when pnpm is unavailable", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-install-"));
  const packageJsonPath = path.join(tempRoot, "package.json");

  await writeFile(
    packageJsonPath,
    JSON.stringify(
      {
        private: true,
        dependencies: {
          "@dreamboard/app-sdk": "0.0.40",
          "@dreamboard/sdk-types": "0.0.40",
          "@dreamboard/ui-sdk": "0.0.40",
        },
      },
      null,
      2,
    ),
  );

  const installed = await installWorkspaceDependencies(tempRoot);
  expect(installed).toBe(true);

  expect(spawnMock.mock.calls.map(([binary, args]) => [binary, args])).toEqual([
    [
      "pnpm",
      ["install", "--ignore-workspace", "--config.shared-workspace-lockfile=false"],
    ],
    ["npm", ["install"]],
  ]);
  expect(JSON.parse(await readFile(packageJsonPath, "utf8"))).toMatchObject({
    dependencies: {
      "@dreamboard/app-sdk": "0.0.40",
      "@dreamboard/sdk-types": "0.0.40",
      "@dreamboard/ui-sdk": "0.0.40",
    },
  });
});
