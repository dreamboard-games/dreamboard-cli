import { EventEmitter } from "node:events";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, mock, test } from "bun:test";

const spawnMock = mock(
  (
    binary: string,
    args: string[],
    options: { cwd: string; env: NodeJS.ProcessEnv },
  ) => {
    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
    };
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();

    queueMicrotask(async () => {
      if (args.includes("install")) {
        await writeFile(
          path.join(options.cwd, "pnpm-lock.yaml"),
          "lockfileVersion: '9.0'\n",
        );
        await ensureInstalledDependency(
          options.cwd,
          "@dreamboard/app-sdk",
          "0.0.40",
        );
        await ensureInstalledDependency(
          options.cwd,
          "@dreamboard/ui-sdk",
          "0.0.40",
        );
        await ensureInstalledDependency(
          options.cwd,
          "@dreamboard/sdk-types",
          "0.1.0",
        );
      }

      child.emit("close", 0);
    });

    return child;
  },
);

mock.module("node:child_process", () => ({
  spawn: spawnMock,
}));

async function loadWorkspaceDependencies() {
  return import(`./workspace-dependencies.ts?test=${Math.random()}`);
}

async function ensureInstalledDependency(
  projectRoot: string,
  packageName: string,
  version: string,
) {
  const packageRoot = path.join(
    projectRoot,
    "node_modules",
    ...packageName.split("/"),
  );
  await mkdir(packageRoot, { recursive: true });
  await writeFile(
    path.join(packageRoot, "package.json"),
    JSON.stringify({ name: packageName, version }, null, 2),
  );
}

function expectedInstallInvocation(args: string[]) {
  const corepackPath = path.join(path.dirname(process.execPath), "corepack");
  return existsSync(corepackPath)
    ? [corepackPath, ["pnpm", ...args]]
    : ["pnpm", args];
}

afterEach(() => {
  spawnMock.mockClear();
});

test("generatePnpmLockfile normalizes packageManager and creates a pnpm lockfile", async () => {
  const { generatePnpmLockfile } = await loadWorkspaceDependencies();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-lockfile-"));
  const packageJsonPath = path.join(tempRoot, "package.json");

  await writeFile(
    packageJsonPath,
    JSON.stringify(
      {
        private: true,
        dependencies: {
          "@dreamboard/app-sdk": "0.0.40",
          "@dreamboard/ui-sdk": "0.0.40",
        },
        devDependencies: {
          "@dreamboard/sdk-types": "0.1.0",
        },
      },
      null,
      2,
    ),
  );

  const generated = await generatePnpmLockfile(tempRoot);
  expect(generated).toBe(true);
  expect(spawnMock.mock.calls.map(([binary, args]) => [binary, args])).toEqual([
    expectedInstallInvocation([
      "install",
      "--ignore-workspace",
      "--lockfile-only",
      "--config.shared-workspace-lockfile=false",
    ]),
  ]);
  expect(JSON.parse(await readFile(packageJsonPath, "utf8"))).toMatchObject({
    packageManager: "pnpm@10.4.1",
    dependencies: {
      "@dreamboard/app-sdk": "0.0.40",
      "@dreamboard/ui-sdk": "0.0.40",
    },
    devDependencies: {
      "@dreamboard/sdk-types": "0.1.0",
    },
  });
  expect(
    await Bun.file(path.join(tempRoot, "pnpm-lock.yaml")).text(),
  ).toContain("lockfileVersion");
});

test("reconcileWorkspaceDependencies installs when the lockfile is missing and records metadata", async () => {
  const { reconcileWorkspaceDependencies } = await loadWorkspaceDependencies();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-reconcile-"));
  const packageJsonPath = path.join(tempRoot, "package.json");

  await writeFile(
    packageJsonPath,
    JSON.stringify(
      {
        private: true,
        packageManager: "pnpm@0.0.1",
        dependencies: {
          "@dreamboard/app-sdk": "0.0.40",
          "@dreamboard/ui-sdk": "0.0.40",
        },
        devDependencies: {
          "@dreamboard/sdk-types": "0.1.0",
        },
      },
      null,
      2,
    ),
  );

  const result = await reconcileWorkspaceDependencies(tempRoot);
  expect(result).toMatchObject({
    required: true,
    installed: true,
    lockfileGenerated: true,
    packageManagerNormalized: true,
    fingerprint: expect.any(String),
  });
  expect(
    JSON.parse(
      await readFile(
        path.join(tempRoot, ".dreamboard", "dependency-install.json"),
        "utf8",
      ),
    ),
  ).toMatchObject({
    dependencyFingerprint: result.fingerprint,
    packageManager: "pnpm@10.4.1",
  });
});

test("reconcileWorkspaceDependencies skips reinstall when the fingerprint and installed deps still match", async () => {
  const { reconcileWorkspaceDependencies } = await loadWorkspaceDependencies();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-reconcile-"));
  const packageJsonPath = path.join(tempRoot, "package.json");

  await writeFile(
    packageJsonPath,
    JSON.stringify(
      {
        private: true,
        packageManager: "pnpm@10.4.1",
        dependencies: {
          "@dreamboard/app-sdk": "0.0.40",
          "@dreamboard/ui-sdk": "0.0.40",
        },
        devDependencies: {
          "@dreamboard/sdk-types": "0.1.0",
        },
      },
      null,
      2,
    ) + "\n",
  );
  await writeFile(
    path.join(tempRoot, "pnpm-lock.yaml"),
    "lockfileVersion: '9.0'\n",
  );
  await ensureInstalledDependency(tempRoot, "@dreamboard/app-sdk", "0.0.40");
  await ensureInstalledDependency(tempRoot, "@dreamboard/ui-sdk", "0.0.40");
  await ensureInstalledDependency(tempRoot, "@dreamboard/sdk-types", "0.1.0");

  const firstResult = await reconcileWorkspaceDependencies(tempRoot);
  spawnMock.mockClear();
  const secondResult = await reconcileWorkspaceDependencies(tempRoot);

  expect(firstResult.installed).toBe(true);
  expect(secondResult).toMatchObject({
    required: true,
    installed: false,
    lockfileGenerated: false,
    packageManagerNormalized: false,
    fingerprint: firstResult.fingerprint,
  });
  expect(spawnMock).not.toHaveBeenCalled();
});

test("reconcileWorkspaceDependencies reinstalls when sdk-types is missing from node_modules", async () => {
  const { reconcileWorkspaceDependencies } = await loadWorkspaceDependencies();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-reconcile-"));

  await writeFile(
    path.join(tempRoot, "package.json"),
    JSON.stringify(
      {
        private: true,
        packageManager: "pnpm@10.4.1",
        dependencies: {
          "@dreamboard/app-sdk": "0.0.40",
          "@dreamboard/ui-sdk": "0.0.40",
        },
        devDependencies: {
          "@dreamboard/sdk-types": "0.1.0",
        },
      },
      null,
      2,
    ) + "\n",
  );
  await writeFile(
    path.join(tempRoot, "pnpm-lock.yaml"),
    "lockfileVersion: '9.0'\n",
  );
  await ensureInstalledDependency(tempRoot, "@dreamboard/app-sdk", "0.0.40");
  await ensureInstalledDependency(tempRoot, "@dreamboard/ui-sdk", "0.0.40");

  await reconcileWorkspaceDependencies(tempRoot);
  spawnMock.mockClear();
  await rm(path.join(tempRoot, "node_modules", "@dreamboard", "sdk-types"), {
    recursive: true,
    force: true,
  });

  const result = await reconcileWorkspaceDependencies(tempRoot);
  expect(result.installed).toBe(true);
  expect(spawnMock.mock.calls.map(([binary, args]) => [binary, args])).toEqual([
    expectedInstallInvocation([
      "install",
      "--ignore-workspace",
      "--config.shared-workspace-lockfile=false",
    ]),
  ]);
});

test("reconcileWorkspaceDependencies rejects package-lock-only workspaces", async () => {
  const { reconcileWorkspaceDependencies } = await loadWorkspaceDependencies();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-reconcile-"));

  await writeFile(
    path.join(tempRoot, "package.json"),
    JSON.stringify(
      {
        private: true,
        dependencies: {
          "@dreamboard/app-sdk": "0.0.40",
        },
      },
      null,
      2,
    ),
  );
  await writeFile(
    path.join(tempRoot, "package-lock.json"),
    JSON.stringify({ lockfileVersion: 3 }, null, 2),
  );

  await expect(reconcileWorkspaceDependencies(tempRoot)).rejects.toThrow(
    "Dreamboard manages workspace dependencies during `dreamboard sync`.",
  );
});

test("reconcileWorkspaceDependencies explains how to fix missing corepack or pnpm", async () => {
  const { reconcileWorkspaceDependencies } = await loadWorkspaceDependencies();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-reconcile-"));

  await writeFile(
    path.join(tempRoot, "package.json"),
    JSON.stringify(
      {
        private: true,
        dependencies: {
          "@dreamboard/app-sdk": "0.0.40",
        },
      },
      null,
      2,
    ),
  );

  spawnMock.mockImplementationOnce(
    (
      _binary: string,
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
        const error = new Error("spawn ENOENT") as NodeJS.ErrnoException;
        error.code = "ENOENT";
        child.emit("error", error);
      });
      return child;
    },
  );

  const error = await reconcileWorkspaceDependencies(tempRoot).catch(
    (caught) => caught as Error,
  );
  expect(error).toBeInstanceOf(Error);
  expect(error.message).toContain(
    "Dreamboard needs dependency tooling to finish `dreamboard sync`.",
  );
  expect(error.message).toContain("Corepack enabled");
  expect(error.message).toContain("npm install -g pnpm");
});

test("reconcileWorkspaceDependencies wraps package-manager exit failures with Dreamboard-first wording", async () => {
  const { reconcileWorkspaceDependencies } = await loadWorkspaceDependencies();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-reconcile-"));

  await writeFile(
    path.join(tempRoot, "package.json"),
    JSON.stringify(
      {
        private: true,
        dependencies: {
          "@dreamboard/app-sdk": "0.0.40",
        },
      },
      null,
      2,
    ),
  );

  spawnMock.mockImplementationOnce(
    (
      _binary: string,
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
        child.stderr.emit("data", "ERR_PNPM_NO_MATCHING_VERSION");
        child.emit("close", 1);
      });
      return child;
    },
  );

  const error = await reconcileWorkspaceDependencies(tempRoot).catch(
    (caught) => caught as Error,
  );
  expect(error).toBeInstanceOf(Error);
  expect(error.message).toContain(
    "Dreamboard could not finish preparing workspace dependencies during `dreamboard sync`",
  );
  expect(error.message).toContain("ERR_PNPM_NO_MATCHING_VERSION");
  expect(error.message).not.toContain("pnpm dependency reconciliation failed");
});
