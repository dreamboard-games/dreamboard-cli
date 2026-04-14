import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { LocalMaintainerRegistryConfig } from "../../types.js";
import { resolveCliRepoRoot } from "../../utils/repo-root.js";
import {
  LOCAL_REGISTRY_URL,
  didLocalMaintainerSnapshotChange,
  getLocalMaintainerNpmrcContent,
  isLocalMaintainerRegistryEnabled,
  isLocalMaintainerRegistryUrl,
} from "./local-maintainer-registry-shared.js";

export {
  didLocalMaintainerSnapshotChange,
  getLocalMaintainerNpmrcContent,
  isLocalMaintainerRegistryEnabled,
  isLocalMaintainerRegistryUrl,
};

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

function getCliPackageRoot(): string {
  try {
    return path.join(
      resolveCliRepoRoot(import.meta.url),
      "apps",
      "dreamboard-cli",
    );
  } catch {
    return path.resolve(MODULE_DIR, "../../..");
  }
}

function getScriptInvocation(): {
  command: string;
  args: string[];
  attemptedCommand: string;
  cwd: string;
} {
  const cliPackageRoot = getCliPackageRoot();
  const scriptPath = path.join(
    cliPackageRoot,
    "scripts",
    "local-maintainer-registry.ts",
  );
  if (!existsSync(scriptPath)) {
    throw new Error(
      [
        "Dreamboard local maintainer registry support is only available from a source checkout.",
        `Expected helper script at ${scriptPath}.`,
      ].join(" "),
    );
  }

  const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const args = ["exec", "tsx", scriptPath];
  return {
    command,
    args,
    attemptedCommand: `${command} ${args.join(" ")}`,
    cwd: cliPackageRoot,
  };
}

function buildScriptSetupError(options: {
  attemptedCommand: string;
  message: string;
  stderr?: string;
}): Error {
  return new Error(
    [
      "Dreamboard local maintainer registry support requires the source-checkout CLI tooling.",
      options.message,
      `Attempted command: ${options.attemptedCommand}`,
      options.stderr?.trim() ? `stderr:\n${options.stderr.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

async function runLocalMaintainerScript<T>(args: string[]): Promise<T> {
  const invocation = getScriptInvocation();

  return new Promise<T>((resolve, reject) => {
    const child = spawn(invocation.command, [...invocation.args, ...args], {
      cwd: invocation.cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      const errnoError = error as NodeJS.ErrnoException;
      if (errnoError.code === "ENOENT") {
        reject(
          buildScriptSetupError({
            attemptedCommand: invocation.attemptedCommand,
            message:
              "`pnpm` was not found on PATH, so the source-checkout local maintainer helper could not run.",
          }),
        );
        return;
      }
      reject(error);
    });
    child.on("close", (code) => {
      if (code !== 0) {
        const missingTsx =
          stderr.includes('Command "tsx" not found') ||
          stderr.includes("tsx: command not found") ||
          stderr.includes("tsx: not found");
        reject(
          buildScriptSetupError({
            attemptedCommand: invocation.attemptedCommand,
            message: missingTsx
              ? "`tsx` is not available for the source-checkout CLI package."
              : "The source-checkout local maintainer helper failed.",
            stderr,
          }),
        );
        return;
      }

      const trimmedStdout = stdout.trim();
      if (!trimmedStdout) {
        reject(
          buildScriptSetupError({
            attemptedCommand: invocation.attemptedCommand,
            message:
              "The source-checkout local maintainer helper completed without returning JSON.",
            stderr,
          }),
        );
        return;
      }

      try {
        resolve(JSON.parse(trimmedStdout) as T);
      } catch (error) {
        reject(
          buildScriptSetupError({
            attemptedCommand: invocation.attemptedCommand,
            message: `Failed to parse JSON from the source-checkout local maintainer helper: ${
              error instanceof Error ? error.message : String(error)
            }`,
            stderr: [stderr.trim(), trimmedStdout].filter(Boolean).join("\n"),
          }),
        );
      }
    });
  });
}

export async function ensureLocalMaintainerSnapshot(
  apiBaseUrl: string,
): Promise<LocalMaintainerRegistryConfig | null> {
  if (!isLocalMaintainerRegistryEnabled(apiBaseUrl)) {
    return null;
  }

  return runLocalMaintainerScript<LocalMaintainerRegistryConfig | null>([
    "ensure-snapshot",
    "--api-base-url",
    apiBaseUrl,
  ]);
}

export async function readWorkspaceLocalMaintainerRegistry(
  projectRoot: string,
  fallbackRegistryUrl: string = LOCAL_REGISTRY_URL,
): Promise<LocalMaintainerRegistryConfig | null> {
  return runLocalMaintainerScript<LocalMaintainerRegistryConfig | null>([
    "read-workspace",
    "--project-root",
    projectRoot,
    "--fallback-registry-url",
    fallbackRegistryUrl,
  ]);
}
