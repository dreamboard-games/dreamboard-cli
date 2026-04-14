import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import path from "node:path";
import type { Readable } from "node:stream";
import { resolveCliRepoRoot } from "../../utils/repo-root.js";
import { exists, readJsonFile, writeJsonFile } from "../../utils/fs.js";

type PackageJsonShape = {
  dependencies?: Record<string, string>;
};

type LockfileGenerationOptions = {
  localSdkPackageFallback?: boolean;
};

type LockfileCommand = {
  binary: "pnpm" | "npm";
  args: string[];
};

class LockfileGenerationError extends Error {
  constructor(
    readonly binary: LockfileCommand["binary"],
    readonly details: {
      code?: number | null;
      stdout: string;
      stderr: string;
      cause?: Error;
    },
  ) {
    super(buildLockfileGenerationErrorMessage(binary, details), {
      cause: details.cause,
    });
    this.name = "LockfileGenerationError";
  }
}

const repoRoot = resolveCliRepoRoot(import.meta.url);

const LOCAL_CHECKOUT_SDK_DEPENDENCIES = {
  "@dreamboard/app-sdk": `file:${path.join(repoRoot, "packages", "app-sdk")}`,
  "@dreamboard/sdk-types": `file:${path.join(repoRoot, "packages", "sdk-types")}`,
  "@dreamboard/ui-sdk": `file:${path.join(repoRoot, "packages", "ui-sdk")}`,
} as const;

export async function generatePnpmLockfile(
  projectRoot: string,
  options: LockfileGenerationOptions = {},
): Promise<boolean> {
  if (options.localSdkPackageFallback) {
    await rewriteWorkspacePackageDependencies(
      projectRoot,
      LOCAL_CHECKOUT_SDK_DEPENDENCIES,
    );
  }

  await runPreferredPackageManagerCommand(
    projectRoot,
    {
      binary: "pnpm",
      args: [
        "install",
        "--ignore-workspace",
        "--lockfile-only",
        "--config.shared-workspace-lockfile=false",
      ],
    },
    {
      binary: "npm",
      args: ["install", "--package-lock-only"],
    },
  );
  return true;
}

export async function installWorkspaceDependencies(
  projectRoot: string,
  options: LockfileGenerationOptions = {},
): Promise<boolean> {
  if (options.localSdkPackageFallback) {
    await rewriteWorkspacePackageDependencies(
      projectRoot,
      LOCAL_CHECKOUT_SDK_DEPENDENCIES,
    );
  }

  await runPreferredPackageManagerCommand(
    projectRoot,
    {
      binary: "pnpm",
      args: [
        "install",
        "--ignore-workspace",
        "--config.shared-workspace-lockfile=false",
      ],
    },
    {
      binary: "npm",
      args: ["install"],
    },
  );
  return true;
}

async function rewriteWorkspacePackageDependencies(
  projectRoot: string,
  dependencies: Record<string, string>,
): Promise<void> {
  const packageJsonPath = path.join(projectRoot, "package.json");
  if (!(await exists(packageJsonPath))) {
    return;
  }

  const packageJson = await readJsonFile<PackageJsonShape>(packageJsonPath);
  const nextDependencies = {
    ...(packageJson.dependencies ?? {}),
  };

  let changed = false;
  for (const [packageName, specifier] of Object.entries(dependencies)) {
    if (nextDependencies[packageName] === specifier) {
      continue;
    }
    if (!(packageName in nextDependencies)) {
      continue;
    }
    nextDependencies[packageName] = specifier;
    changed = true;
  }

  if (!changed) {
    return;
  }

  await writeJsonFile(packageJsonPath, {
    ...packageJson,
    dependencies: nextDependencies,
  });
}

function buildLockfileGenerationErrorMessage(
  binary: LockfileCommand["binary"],
  details: {
    code?: number | null;
    stdout: string;
    stderr: string;
    cause?: Error;
  },
): string {
  if (details.cause) {
    return `Failed to start ${binary} for lockfile generation. ${details.cause.message}`;
  }

  const output = [details.stdout.trim(), details.stderr.trim()]
    .filter((chunk) => chunk.length > 0)
    .join("\n");

  return `${binary} lockfile generation failed with exit code ${details.code ?? "unknown"}${output ? `:\n${output}` : "."}`;
}

function isCommandNotFoundError(
  error: unknown,
  binary: LockfileCommand["binary"],
): boolean {
  return (
    error instanceof LockfileGenerationError &&
    error.binary === binary &&
    (error.details.cause?.message.includes("ENOENT") ?? false)
  );
}

async function runPreferredPackageManagerCommand(
  projectRoot: string,
  preferred: LockfileCommand,
  fallback: LockfileCommand,
): Promise<void> {
  try {
    await runLockfileCommand(projectRoot, preferred);
    return;
  } catch (error) {
    if (!isCommandNotFoundError(error, preferred.binary)) {
      throw error;
    }
  }

  await runLockfileCommand(projectRoot, fallback);
}

async function runLockfileCommand(
  projectRoot: string,
  command: LockfileCommand,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command.binary, command.args, {
      cwd: projectRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    bindStream(child.stdout, (chunk) => {
      stdout += chunk.toString();
    });
    bindStream(child.stderr, (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (cause) => {
      reject(
        new LockfileGenerationError(command.binary, {
          stdout,
          stderr,
          cause,
        }),
      );
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new LockfileGenerationError(command.binary, {
          code,
          stdout,
          stderr,
        }),
      );
    });
  });
}

function bindStream(
  stream: Readable | EventEmitter | null | undefined,
  onData: (chunk: Buffer | string) => void,
): void {
  stream?.on("data", onData);
}
