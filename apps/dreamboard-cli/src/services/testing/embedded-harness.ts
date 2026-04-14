import { createHash } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { createWriteStream } from "node:fs";
import { lstat, mkdir, mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";
import type { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { client } from "@dreamboard/api-client/client.gen";
import consola from "consola";
import type { ProjectConfig } from "../../types.js";
import { exists } from "../../utils/fs.js";
import { hashContent } from "../../utils/crypto.js";
import { getProjectAuthoringState } from "../project/project-state.js";
import { loadManifest } from "../project/local-files.js";

const READY_PREFIX = "HARNESS_READY ";
const HARNESS_START_IDLE_TIMEOUT_MS = 180_000;
const HARNESS_START_MAX_TIMEOUT_MS = 600_000;
const HARNESS_STOP_TIMEOUT_MS = 10_000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, "../../../../..");
const PROJECT_DEPENDENCY_NODE_MODULES = path.join(
  REPO_ROOT,
  "apps",
  "dreamboard-cli",
  "node_modules",
);
const UI_SDK_NODE_MODULES = path.join(
  REPO_ROOT,
  "packages",
  "ui-sdk",
  "node_modules",
);

type EmbeddedHarnessReady = {
  status: "ready";
  baseUrl: string;
  port: number;
  gameId: string;
  compiledResultId: string;
  manifestId: string;
  ruleId: string;
  hostUserId: string;
  hostToken: string;
  guestUserId: string;
  guestToken: string;
};

type LocalHarnessFixture = {
  bundleRoot: string;
  manifestHash: string;
  gameId: string;
  manifestId: string;
  compiledResultId: string;
  ruleId: string;
  gameSlug: string;
  gameName: string;
};

type HarnessMonitor = {
  ready: EmbeddedHarnessReady;
  dispose: () => void;
};

export type EmbeddedHarnessSession = {
  gameId: string;
  compiledResultId: string;
  manifestHash: string;
  baseUrl: string;
  logFilePath: string;
  stop: () => Promise<void>;
};

export async function startEmbeddedHarnessSession(options: {
  projectRoot: string;
  projectConfig: ProjectConfig;
  configureClient?: boolean;
}): Promise<EmbeddedHarnessSession> {
  const repoRoot = await resolveRepoRoot(options.projectRoot);
  const gradlew = await resolveGradleLauncher(repoRoot);
  const fixture = await prepareLocalHarnessFixture(options);
  const logDir = path.join(options.projectRoot, "test", "generated");
  const logFilePath = path.join(logDir, "embedded-harness.log");
  await mkdir(logDir, { recursive: true });

  const previousClientConfig = client.getConfig();
  const child = spawn(
    gradlew.command,
    [
      ...gradlew.args,
      "--console=plain",
      ":apps:backend:runEmbeddedHarness",
      `-PharnessManifestPath=${path.join(options.projectRoot, "manifest.json")}`,
      `-PharnessBundlePath=${fixture.bundleRoot}`,
      `-PharnessGameId=${fixture.gameId}`,
      `-PharnessManifestId=${fixture.manifestId}`,
      `-PharnessCompiledResultId=${fixture.compiledResultId}`,
      `-PharnessRuleId=${fixture.ruleId}`,
      `-PharnessGameSlug=${fixture.gameSlug}`,
      `-PharnessGameName=${fixture.gameName}`,
      "-PharnessHostEmail=host@example.com",
      "-PharnessGuestEmail=guest@example.com",
    ],
    {
      cwd: repoRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let stopped = false;
  let restoreClientConfig: (() => void) | undefined;
  let monitor: HarnessMonitor;
  try {
    monitor = await waitForHarnessReady(child, logFilePath);
    if (options.configureClient !== false) {
      client.setConfig({
        ...previousClientConfig,
        baseUrl: monitor.ready.baseUrl,
        headers: {
          ...(previousClientConfig.headers ?? {}),
          Authorization: `Bearer ${monitor.ready.hostToken}`,
        },
      });
      restoreClientConfig = () => client.setConfig(previousClientConfig);
    }
  } catch (error) {
    await terminateChild(child);
    await rm(fixture.bundleRoot, { recursive: true, force: true });
    throw error;
  }

  consola.info(`Embedded harness ready at ${monitor.ready.baseUrl}`);

  return {
    gameId: fixture.gameId,
    compiledResultId: fixture.compiledResultId,
    manifestHash: fixture.manifestHash,
    baseUrl: monitor.ready.baseUrl,
    logFilePath,
    stop: async () => {
      if (stopped) return;
      stopped = true;
      restoreClientConfig?.();
      await terminateChild(child);
      monitor.dispose();
      await rm(fixture.bundleRoot, { recursive: true, force: true });
    },
  };
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await lstat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureSymlink(targetPath: string, linkPath: string) {
  if (await pathExists(linkPath)) {
    return;
  }

  await mkdir(path.dirname(linkPath), { recursive: true });
  await symlink(
    targetPath,
    linkPath,
    process.platform === "win32" ? "junction" : "dir",
  );
}

async function ensureEmbeddedHarnessDependencies(
  projectRoot: string,
): Promise<void> {
  if (await pathExists(PROJECT_DEPENDENCY_NODE_MODULES)) {
    await ensureSymlink(
      PROJECT_DEPENDENCY_NODE_MODULES,
      path.join(projectRoot, "node_modules"),
    );
  }

  if (await pathExists(UI_SDK_NODE_MODULES)) {
    await ensureSymlink(
      UI_SDK_NODE_MODULES,
      path.join(projectRoot, "ui", "node_modules"),
    );
  }
}

async function prepareLocalHarnessFixture(options: {
  projectRoot: string;
  projectConfig: ProjectConfig;
}): Promise<LocalHarnessFixture> {
  await ensureEmbeddedHarnessDependencies(options.projectRoot);

  const manifestPath = path.join(options.projectRoot, "manifest.json");
  const manifestContent = await readFile(manifestPath, "utf8");
  await loadManifest(options.projectRoot);

  const appEntryPath = path.join(options.projectRoot, "app", "index.ts");
  if (!(await exists(appEntryPath))) {
    throw new Error(
      `Embedded harness requires ${path.relative(options.projectRoot, appEntryPath)}.`,
    );
  }

  const bundleRoot = await mkdtemp(path.join(tmpdir(), "dreamboard-harness-"));
  const bundleEntryPath = path.join(bundleRoot, "src", "app", "index.js");
  await mkdir(path.dirname(bundleEntryPath), { recursive: true });

  const bunExecutable = Bun.which("bun");
  if (!bunExecutable) {
    await rm(bundleRoot, { recursive: true, force: true });
    throw new Error(
      "Failed to locate the Bun executable for embedded harness bundling.",
    );
  }

  const buildResult = spawn(
    bunExecutable,
    [
      "build",
      "app/index.ts",
      `--outfile=${bundleEntryPath}`,
      "--format=esm",
      "--target=browser",
      "--sourcemap=none",
    ],
    {
      cwd: options.projectRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  const [stdout, stderr, exitCode] = await Promise.all([
    readStreamText(buildResult.stdout),
    readStreamText(buildResult.stderr),
    waitForExitCode(buildResult),
  ]);

  if (exitCode !== 0) {
    await rm(bundleRoot, { recursive: true, force: true });
    const issues =
      [stdout.trim(), stderr.trim()]
        .filter((value) => value.length > 0)
        .join("\n")
        .trim() || "unknown Bun build failure";
    throw new Error(`Failed to bundle local game logic: ${issues}`);
  }

  const bundleContent = await readFile(bundleEntryPath, "utf8");
  const manifestHash = hashContent(manifestContent);
  const bundleHash = hashContent(bundleContent);
  const gameSlug =
    options.projectConfig.slug || path.basename(options.projectRoot);
  const authoring = getProjectAuthoringState(options.projectConfig);

  return {
    bundleRoot,
    manifestHash,
    gameId: normalizeUuid(
      options.projectConfig.gameId,
      `game:${gameSlug}:${options.projectRoot}`,
    ),
    manifestId: normalizeUuid(authoring.manifestId, `manifest:${manifestHash}`),
    compiledResultId: stableUuid(`compiled:${manifestHash}:${bundleHash}`),
    ruleId: normalizeUuid(
      authoring.ruleId,
      `rule:${gameSlug}:${authoring.ruleId ?? "local"}`,
    ),
    gameSlug,
    gameName: toTitleCase(gameSlug),
  };
}

async function waitForExitCode(child: ChildProcess): Promise<number> {
  if (child.exitCode !== null) {
    return child.exitCode;
  }

  return await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => resolve(code ?? 1));
  });
}

async function readStreamText(
  stream: Readable | null | undefined,
): Promise<string> {
  if (!stream) {
    return "";
  }

  let text = "";
  for await (const chunk of stream) {
    text += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
  }
  return text;
}

async function waitForHarnessReady(
  child: ChildProcess,
  logFilePath: string,
): Promise<HarnessMonitor> {
  const stdout = child.stdout;
  const stderr = child.stderr;
  if (!stdout || !stderr) {
    throw new Error("Embedded harness process did not expose stdout/stderr.");
  }

  const logStream = createWriteStream(logFilePath, { flags: "w" });
  stdout.pipe(logStream, { end: false });
  stderr.pipe(logStream, { end: false });

  const stdoutReader = createInterface({ input: stdout });
  const stderrReader = createInterface({ input: stderr });
  const recentLines: string[] = [];

  const rememberLine = (line: string): void => {
    if (!line.trim()) return;
    recentLines.push(line);
    while (recentLines.length > 30) {
      recentLines.shift();
    }
  };

  return await new Promise<HarnessMonitor>((resolve, reject) => {
    let settled = false;
    let idleTimeoutHandle: ReturnType<typeof setTimeout> | undefined;
    let maxTimeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const dispose = (): void => {
      stdout.off("data", refreshIdleTimeout);
      stderr.off("data", refreshIdleTimeout);
      stdoutReader.close();
      stderrReader.close();
      stdout.unpipe(logStream);
      stderr.unpipe(logStream);
      logStream.end();
    };

    const finish = (callback: () => void): void => {
      if (settled) return;
      settled = true;
      if (idleTimeoutHandle) {
        clearTimeout(idleTimeoutHandle);
      }
      if (maxTimeoutHandle) {
        clearTimeout(maxTimeoutHandle);
      }
      callback();
    };

    const refreshIdleTimeout = (): void => {
      if (settled) {
        return;
      }
      if (idleTimeoutHandle) {
        clearTimeout(idleTimeoutHandle);
      }
      idleTimeoutHandle = setTimeout(() => {
        rejectWithContext(
          `Timed out after ${HARNESS_START_IDLE_TIMEOUT_MS}ms without harness output while waiting for embedded harness readiness.`,
        );
      }, HARNESS_START_IDLE_TIMEOUT_MS);
    };
    const rejectWithContext = (message: string): void => {
      finish(() => {
        dispose();
        const tail =
          recentLines.length > 0
            ? `\nRecent output:\n${recentLines.join("\n")}`
            : "";
        reject(new Error(`${message}\nHarness log: ${logFilePath}${tail}`));
      });
    };

    stdoutReader.on("line", (line) => {
      rememberLine(line);
      if (!line.startsWith(READY_PREFIX)) {
        return;
      }

      try {
        const payload = JSON.parse(
          line.slice(READY_PREFIX.length),
        ) as EmbeddedHarnessReady;
        finish(() =>
          resolve({
            ready: payload,
            dispose,
          }),
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "invalid readiness payload";
        rejectWithContext(
          `Embedded harness emitted malformed readiness JSON: ${message}`,
        );
      }
    });

    stderrReader.on("line", rememberLine);
    stdout.on("data", refreshIdleTimeout);
    stderr.on("data", refreshIdleTimeout);

    child.once("error", (error) => {
      rejectWithContext(`Failed to launch embedded harness: ${error.message}`);
    });

    child.once("exit", (code, signal) => {
      if (settled) {
        return;
      }
      rejectWithContext(
        `Embedded harness exited before becoming ready (code=${code ?? "null"}, signal=${signal ?? "null"}).`,
      );
    });

    refreshIdleTimeout();

    maxTimeoutHandle = setTimeout(() => {
      rejectWithContext(
        `Timed out waiting ${HARNESS_START_MAX_TIMEOUT_MS}ms total for embedded harness readiness.`,
      );
    }, HARNESS_START_MAX_TIMEOUT_MS);
  });
}

async function terminateChild(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  child.kill("SIGTERM");
  const exited = await waitForExit(child, HARNESS_STOP_TIMEOUT_MS);
  if (exited) {
    return;
  }

  child.kill("SIGKILL");
  await waitForExit(child, HARNESS_STOP_TIMEOUT_MS);
}

async function waitForExit(
  child: ChildProcess,
  timeoutMs: number,
): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return true;
  }

  return await new Promise<boolean>((resolve) => {
    const timeoutHandle = setTimeout(() => resolve(false), timeoutMs);
    child.once("exit", () => {
      clearTimeout(timeoutHandle);
      resolve(true);
    });
  });
}

async function resolveGradleLauncher(repoRoot: string): Promise<{
  command: string;
  args: string[];
}> {
  if (process.platform === "win32") {
    const gradleBat = path.join(repoRoot, "gradlew.bat");
    if (!(await exists(gradleBat))) {
      throw new Error(`Missing Gradle launcher at ${gradleBat}`);
    }
    return { command: gradleBat, args: [] };
  }

  const gradleShell = path.join(repoRoot, "gradlew");
  if (!(await exists(gradleShell))) {
    throw new Error(`Missing Gradle launcher at ${gradleShell}`);
  }
  return { command: gradleShell, args: [] };
}

async function resolveRepoRoot(projectRoot: string): Promise<string> {
  const currentFile = fileURLToPath(import.meta.url);
  const searchRoots = [path.dirname(currentFile), projectRoot, process.cwd()];

  for (const root of searchRoots) {
    const repoRoot = await findSourceCheckoutRepoRoot(root);
    if (repoRoot) {
      return repoRoot;
    }
  }

  throw new Error(
    "Embedded harness is only available from a source checkout with local Dreamboard backend support. Use 'dreamboard test ... --env prod' from a published install.",
  );
}

async function findSourceCheckoutRepoRoot(
  startDir: string,
): Promise<string | null> {
  let currentDir = path.resolve(startDir);

  while (true) {
    if (await isSourceCheckoutRepoRoot(currentDir)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }
    currentDir = parentDir;
  }
}

async function isSourceCheckoutRepoRoot(rootDir: string): Promise<boolean> {
  return (
    (await exists(path.join(rootDir, "gradlew"))) &&
    (await exists(path.join(rootDir, "apps", "backend", "build.gradle.kts")))
  );
}

function normalizeUuid(
  candidate: string | undefined,
  fallbackSeed: string,
): string {
  if (candidate && UUID_PATTERN.test(candidate)) {
    return candidate;
  }
  return stableUuid(fallbackSeed);
}

function stableUuid(seed: string): string {
  const hex = createHash("sha256")
    .update(seed, "utf8")
    .digest("hex")
    .slice(0, 32);
  const chars = hex.split("");
  chars[12] = "5";
  chars[16] = ((parseInt(chars[16] ?? "0", 16) & 0x3) | 0x8).toString(16);
  return `${chars.slice(0, 8).join("")}-${chars.slice(8, 12).join("")}-${chars.slice(12, 16).join("")}-${chars.slice(16, 20).join("")}-${chars.slice(20, 32).join("")}`;
}

function toTitleCase(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
