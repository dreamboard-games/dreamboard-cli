import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import {
  copyFile,
  mkdtemp,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  LocalMaintainerRegistryConfig,
  LocalMaintainerRegistryPackages,
  LocalMaintainerSdkPackageName,
} from "../src/types.js";
import {
  ensureDir,
  exists,
  readJsonFile,
  writeJsonFile,
} from "../src/utils/fs.js";
import {
  acquireDirectoryLock,
  type DirectoryLockOwner,
} from "../src/services/project/directory-lock.js";
import { readPackagePublishFingerprint } from "../src/services/project/local-snapshot-fingerprint.js";
import { resolveCliRepoRoot } from "../src/utils/repo-root.js";
import {
  LOCAL_REGISTRY_HOST,
  LOCAL_REGISTRY_PORT,
  LOCAL_REGISTRY_URL,
  LOCAL_SNAPSHOT_FORMAT_VERSION,
  SDK_PUBLISH_ORDER,
  type PackageJsonShape,
  type SnapshotManifest,
  isLocalMaintainerRegistryEnabled,
  packageShortName,
  readWorkspaceLocalMaintainerRegistryFromPackageJson,
  shortHash,
  toLocalSnapshotTimestamp,
} from "../src/services/project/local-maintainer-registry-shared.js";

const repoRoot = resolveCliRepoRoot(import.meta.url);
const LOCAL_DEV_ROOT = path.join(repoRoot, ".dreamboard-dev");
const LOCAL_REGISTRY_ROOT = path.join(LOCAL_DEV_ROOT, "verdaccio");
const LOCAL_REGISTRY_STORAGE = path.join(LOCAL_REGISTRY_ROOT, "storage");
const LOCAL_REGISTRY_CONFIG_PATH = path.join(
  LOCAL_REGISTRY_ROOT,
  "config.yaml",
);
const LOCAL_REGISTRY_PID_PATH = path.join(LOCAL_REGISTRY_ROOT, "verdaccio.pid");
const LOCAL_REGISTRY_LOG_PATH = path.join(LOCAL_REGISTRY_ROOT, "verdaccio.log");
const LOCAL_REGISTRY_AUTH_NPMRC_PATH = path.join(
  LOCAL_REGISTRY_ROOT,
  "publish-user.npmrc",
);
const LOCAL_SNAPSHOT_MANIFEST_PATH = path.join(
  LOCAL_REGISTRY_ROOT,
  "sdk-snapshots.json",
);
const LOCAL_SNAPSHOT_LOCK_PATH = path.join(
  LOCAL_REGISTRY_ROOT,
  "sdk-snapshots.lock",
);
const VERDACCIO_VERSION = "6.1.3";
const LOCAL_REGISTRY_PUBLISH_USER = "dreamboard-local-publisher";
const LOCAL_REGISTRY_PUBLISH_PASSWORD = "dreamboard-local-publisher";
const LOCAL_REGISTRY_PUBLISH_EMAIL = "dreamboard-local@example.com";
let activeSnapshotLockOwnerPid: number | null = null;
let snapshotLockCleanupHandlersInstalled = false;
const SDK_PACKAGE_PATHS: Record<LocalMaintainerSdkPackageName, string> = {
  "@dreamboard/api-client": path.join(repoRoot, "packages", "api-client"),
  "@dreamboard/reducer-contract": path.join(
    repoRoot,
    "packages",
    "reducer-contract",
  ),
  "@dreamboard/app-sdk": path.join(repoRoot, "packages", "app-sdk"),
  "@dreamboard/sdk-types": path.join(repoRoot, "packages", "sdk-types"),
  "@dreamboard/testing": path.join(repoRoot, "packages", "testing"),
  "@dreamboard/ui-sdk": path.join(repoRoot, "packages", "ui-sdk"),
};

function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readSnapshotManifest(): Promise<SnapshotManifest> {
  if (!(await exists(LOCAL_SNAPSHOT_MANIFEST_PATH))) {
    return { snapshotsByFingerprint: {} };
  }

  return readJsonFile<SnapshotManifest>(LOCAL_SNAPSHOT_MANIFEST_PATH);
}

async function writeSnapshotManifest(
  manifest: SnapshotManifest,
): Promise<void> {
  await ensureDir(path.dirname(LOCAL_SNAPSHOT_MANIFEST_PATH));
  await writeJsonFile(LOCAL_SNAPSHOT_MANIFEST_PATH, manifest);
}

async function acquireSnapshotLock(): Promise<() => Promise<void>> {
  installSnapshotLockCleanupHandlers();
  const releaseDirectoryLock = await acquireDirectoryLock({
    lockPath: LOCAL_SNAPSHOT_LOCK_PATH,
    owner: buildSnapshotLockOwner(),
    isProcessAlive,
  });
  activeSnapshotLockOwnerPid = process.pid;

  return async () => {
    activeSnapshotLockOwnerPid = null;
    await releaseDirectoryLock();
  };
}

function buildSnapshotLockOwner(): DirectoryLockOwner {
  return {
    pid: process.pid,
    createdAt: new Date().toISOString(),
    command: process.argv.slice(1),
    cwd: process.cwd(),
  };
}

function installSnapshotLockCleanupHandlers(): void {
  if (snapshotLockCleanupHandlersInstalled) {
    return;
  }

  snapshotLockCleanupHandlersInstalled = true;

  process.once("SIGINT", () => {
    cleanupOwnedSnapshotLockSync();
    process.exit(130);
  });
  process.once("SIGTERM", () => {
    cleanupOwnedSnapshotLockSync();
    process.exit(143);
  });
}

function cleanupOwnedSnapshotLockSync(): void {
  if (activeSnapshotLockOwnerPid !== process.pid) {
    return;
  }

  activeSnapshotLockOwnerPid = null;
  rmSync(LOCAL_SNAPSHOT_LOCK_PATH, { recursive: true, force: true });
}

async function fetchRegistryHealth(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
    });
    return response.status >= 200 && response.status < 500;
  } catch {
    return false;
  }
}

async function hasLocalRegistryState(): Promise<boolean> {
  return (
    (await pathExists(LOCAL_REGISTRY_CONFIG_PATH)) &&
    (await pathExists(LOCAL_REGISTRY_STORAGE))
  );
}

async function isProcessAlive(pid: number): Promise<boolean> {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function resolveVerdaccioInvocation(): Promise<{
  command: string;
  args: string[];
}> {
  const localBins = [
    path.join(
      repoRoot,
      "apps",
      "dreamboard-cli",
      "node_modules",
      ".bin",
      "verdaccio",
    ),
    path.join(repoRoot, "node_modules", ".bin", "verdaccio"),
  ];

  for (const localBin of localBins) {
    if (await pathExists(localBin)) {
      return {
        command: localBin,
        args: [
          "--config",
          LOCAL_REGISTRY_CONFIG_PATH,
          "--listen",
          `${LOCAL_REGISTRY_HOST}:${LOCAL_REGISTRY_PORT}`,
        ],
      };
    }
  }

  return {
    command: "pnpm",
    args: [
      "dlx",
      `verdaccio@${VERDACCIO_VERSION}`,
      "--config",
      LOCAL_REGISTRY_CONFIG_PATH,
      "--listen",
      `${LOCAL_REGISTRY_HOST}:${LOCAL_REGISTRY_PORT}`,
    ],
  };
}

async function ensureVerdaccioConfig(): Promise<void> {
  await ensureDir(LOCAL_REGISTRY_ROOT);
  await ensureDir(LOCAL_REGISTRY_STORAGE);
  const config = `storage: ${JSON.stringify(LOCAL_REGISTRY_STORAGE)}
auth:
  htpasswd:
    file: ${JSON.stringify(path.join(LOCAL_REGISTRY_ROOT, "htpasswd"))}
    max_users: 1000
uplinks: {}
packages:
  '@dreamboard/*':
    access: $all
    publish: $all
    unpublish: $all
  '**':
    access: $all
    publish: $all
log:
  - { type: stdout, format: pretty, level: http }
`;
  await writeFile(LOCAL_REGISTRY_CONFIG_PATH, config, "utf8");
}

async function waitForVerdaccioHealthy(
  timeoutMs: number = 20_000,
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await fetchRegistryHealth(LOCAL_REGISTRY_URL)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(
    `Timed out waiting for local Verdaccio at ${LOCAL_REGISTRY_URL}. See ${LOCAL_REGISTRY_LOG_PATH}.`,
  );
}

async function startVerdaccioDaemon(): Promise<void> {
  await ensureVerdaccioConfig();
  const invocation = await resolveVerdaccioInvocation();
  await writeFile(LOCAL_REGISTRY_LOG_PATH, "", "utf8");
  const child = spawn(invocation.command, invocation.args, {
    cwd: repoRoot,
    detached: true,
    stdio: ["ignore", "ignore", "ignore"],
    env: {
      ...process.env,
      HOME: os.homedir(),
    },
  });
  child.unref();
  await writeFile(LOCAL_REGISTRY_PID_PATH, `${child.pid ?? ""}\n`, "utf8");
  await waitForVerdaccioHealthy();
}

async function readPortListenerPid(port: number): Promise<number | null> {
  try {
    const output = await new Promise<string>((resolve, reject) => {
      const child = spawn("lsof", [`-tiTCP:${port}`, "-sTCP:LISTEN"], {
        stdio: ["ignore", "pipe", "ignore"],
      });
      let stdout = "";
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0 || code === 1) {
          resolve(stdout.trim());
          return;
        }
        reject(new Error(`lsof exited with ${code ?? "unknown"}`));
      });
    });
    const pid = Number.parseInt(output.split(/\s+/)[0] ?? "", 10);
    return Number.isFinite(pid) ? pid : null;
  } catch {
    return null;
  }
}

async function readProcessCommand(pid: number): Promise<string | null> {
  try {
    return await new Promise<string>((resolve, reject) => {
      const child = spawn("ps", ["-p", String(pid), "-o", "command="], {
        stdio: ["ignore", "pipe", "ignore"],
      });
      let stdout = "";
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0 || code === 1) {
          resolve(stdout.trim() || "");
          return;
        }
        reject(new Error(`ps exited with ${code ?? "unknown"}`));
      });
    });
  } catch {
    return null;
  }
}

async function stopLocalVerdaccioDaemon(): Promise<void> {
  const candidatePids = new Set<number>();

  if (await exists(LOCAL_REGISTRY_PID_PATH)) {
    try {
      const pidText = (await readFile(LOCAL_REGISTRY_PID_PATH, "utf8")).trim();
      const pid = Number.parseInt(pidText, 10);
      if (Number.isFinite(pid)) {
        candidatePids.add(pid);
      }
    } catch (error) {
      if (!isMissingPathError(error)) {
        throw error;
      }
    }
  }

  const listenerPid = await readPortListenerPid(LOCAL_REGISTRY_PORT);
  if (listenerPid !== null) {
    candidatePids.add(listenerPid);
  }

  for (const pid of candidatePids) {
    const command = await readProcessCommand(pid);
    if (command && !command.toLowerCase().includes("verdaccio")) {
      continue;
    }
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      continue;
    }
  }

  await rm(LOCAL_REGISTRY_PID_PATH, { force: true });
}

async function restartLocalVerdaccioDaemon(): Promise<void> {
  await stopLocalVerdaccioDaemon();
  await rm(LOCAL_REGISTRY_AUTH_NPMRC_PATH, { force: true });
  await ensureVerdaccioConfig();
  await startVerdaccioDaemon();
}

async function ensureLocalMaintainerVerdaccio(): Promise<string> {
  if (await fetchRegistryHealth(LOCAL_REGISTRY_URL)) {
    if (!(await hasLocalRegistryState())) {
      await restartLocalVerdaccioDaemon();
    }
    return LOCAL_REGISTRY_URL;
  }

  if (await exists(LOCAL_REGISTRY_PID_PATH)) {
    try {
      const pidText = (await readFile(LOCAL_REGISTRY_PID_PATH, "utf8")).trim();
      const pid = Number.parseInt(pidText, 10);
      if (Number.isFinite(pid) && (await isProcessAlive(pid))) {
        await waitForVerdaccioHealthy();
        return LOCAL_REGISTRY_URL;
      }
    } catch (error) {
      if (!isMissingPathError(error)) {
        throw error;
      }
    }
  }

  await startVerdaccioDaemon();
  return LOCAL_REGISTRY_URL;
}

async function computeLocalSnapshotFingerprint(): Promise<string> {
  const parts: string[] = [
    `snapshot-format:${LOCAL_SNAPSHOT_FORMAT_VERSION}`,
    `publish-order:${SDK_PUBLISH_ORDER.join(",")}`,
  ];
  for (const packageName of SDK_PUBLISH_ORDER) {
    const packageRoot = SDK_PACKAGE_PATHS[packageName];
    parts.push(
      `${packageName}:${await readPackagePublishFingerprint(packageRoot)}`,
    );
  }
  return crypto.createHash("sha256").update(parts.join("\n")).digest("hex");
}

async function readBaseVersion(
  packageName: LocalMaintainerSdkPackageName,
): Promise<string> {
  const packageJson = await readJsonFile<PackageJsonShape>(
    path.join(SDK_PACKAGE_PATHS[packageName], "package.json"),
  );
  if (!packageJson.version) {
    throw new Error(`Package ${packageName} is missing a version.`);
  }
  return packageJson.version.trim();
}

async function buildSnapshotVersions(
  fingerprint: string,
): Promise<LocalMaintainerRegistryPackages> {
  const timestamp = toLocalSnapshotTimestamp();
  const hash = shortHash(fingerprint);
  const entries = await Promise.all(
    SDK_PUBLISH_ORDER.map(async (packageName) => [
      packageName,
      `${await readBaseVersion(packageName)}-local.${timestamp}.${hash}`,
    ]),
  );
  return Object.fromEntries(entries) as LocalMaintainerRegistryPackages;
}

async function copyDirectoryContents(
  sourceDir: string,
  targetDir: string,
): Promise<void> {
  if (!(await pathExists(sourceDir))) {
    return;
  }
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      await copyDirectoryContents(sourcePath, targetPath);
      continue;
    }
    if (entry.isFile()) {
      await copyFile(sourcePath, targetPath);
    }
  }
}

function normalizePublishedPackageJson(
  packageJson: PackageJsonShape,
  packageName: LocalMaintainerSdkPackageName,
  versions: LocalMaintainerRegistryPackages,
): PackageJsonShape {
  const dependencies = { ...(packageJson.dependencies ?? {}) };
  for (const dependencyName of SDK_PUBLISH_ORDER) {
    const dependencyVersion = versions[dependencyName];
    if (
      dependencyName in dependencies &&
      typeof dependencyVersion === "string" &&
      dependencyVersion.length > 0
    ) {
      dependencies[dependencyName] = dependencyVersion;
    }
  }

  return {
    name: packageName,
    version: versions[packageName],
    description: packageJson.description,
    type: packageJson.type,
    main: packageJson.main,
    types: packageJson.types,
    exports: packageJson.exports,
    typesVersions: packageJson.typesVersions,
    files: packageJson.files,
    dependencies,
    peerDependencies: packageJson.peerDependencies,
  };
}

function getPublishedPackageEntries(packageJson: PackageJsonShape): string[] {
  const entries =
    packageJson.files?.filter(
      (entry) => typeof entry === "string" && entry.trim().length > 0,
    ) ?? [];
  if (entries.length > 0) {
    return Array.from(
      new Set(entries.map((entry) => entry.replace(/\/+$/, ""))),
    ).sort((left, right) => left.localeCompare(right));
  }
  return ["dist"];
}

async function copyPublishEntry(options: {
  sourcePath: string;
  targetPath: string;
}): Promise<void> {
  if (!(await pathExists(options.sourcePath))) {
    return;
  }

  const sourceStat = await stat(options.sourcePath);
  if (sourceStat.isDirectory()) {
    await copyDirectoryContents(options.sourcePath, options.targetPath);
    return;
  }

  await mkdir(path.dirname(options.targetPath), { recursive: true });
  await copyFile(options.sourcePath, options.targetPath);
}

async function createNormalizedPackageDirectory(options: {
  tempRoot: string;
  packageName: LocalMaintainerSdkPackageName;
  versions: LocalMaintainerRegistryPackages;
}): Promise<string> {
  const packageRoot = SDK_PACKAGE_PATHS[options.packageName];
  const sourcePackageJson = await readJsonFile<PackageJsonShape>(
    path.join(packageRoot, "package.json"),
  );
  const normalizedRoot = path.join(
    options.tempRoot,
    packageShortName(options.packageName),
  );
  await rm(normalizedRoot, { recursive: true, force: true });
  await ensureDir(normalizedRoot);
  for (const entry of getPublishedPackageEntries(sourcePackageJson)) {
    await copyPublishEntry({
      sourcePath: path.join(packageRoot, entry),
      targetPath: path.join(normalizedRoot, entry),
    });
  }
  await writeJsonFile(
    path.join(normalizedRoot, "package.json"),
    normalizePublishedPackageJson(
      sourcePackageJson,
      options.packageName,
      options.versions,
    ),
  );
  return normalizedRoot;
}

async function buildSdkPackages(): Promise<void> {
  for (const packageName of SDK_PUBLISH_ORDER) {
    await runCommand({
      command: "pnpm",
      args: ["--filter", packageName, "build"],
      cwd: repoRoot,
    });
  }
}

async function runCommand(options: {
  command: string;
  args: string[];
  cwd: string;
  env?: NodeJS.ProcessEnv;
  stdin?: string;
}): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(options.command, options.args, {
      cwd: options.cwd,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        ...options.env,
      },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    if (options.stdin) {
      child.stdin.write(options.stdin);
    }
    child.stdin.end();
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          [
            `${options.command} ${options.args.join(" ")} failed with exit code ${code ?? "unknown"}.`,
            stdout.trim(),
            stderr.trim(),
          ]
            .filter(Boolean)
            .join("\n"),
        ),
      );
    });
  });
}

async function ensureLocalRegistryPublishUser(
  registryUrl: string,
  allowRetry: boolean = true,
): Promise<string> {
  if (await pathExists(LOCAL_REGISTRY_AUTH_NPMRC_PATH)) {
    const existingUserConfig = await readFile(
      LOCAL_REGISTRY_AUTH_NPMRC_PATH,
      "utf8",
    ).catch(() => null);
    if (
      existingUserConfig?.includes("@dreamboard:registry=") &&
      existingUserConfig.includes(":_authToken=")
    ) {
      return LOCAL_REGISTRY_AUTH_NPMRC_PATH;
    }
    await rm(LOCAL_REGISTRY_AUTH_NPMRC_PATH, { force: true });
  }

  const username = `${LOCAL_REGISTRY_PUBLISH_USER}-${Date.now().toString(36)}`;
  const createUserResponse = await fetch(
    `${registryUrl}/-/user/org.couchdb.user:${encodeURIComponent(username)}`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        _id: `org.couchdb.user:${username}`,
        name: username,
        password: LOCAL_REGISTRY_PUBLISH_PASSWORD,
        email: LOCAL_REGISTRY_PUBLISH_EMAIL,
        type: "user",
        roles: [],
        date: new Date().toISOString(),
      }),
    },
  );
  const createUserBody = await createUserResponse.text();
  if (!createUserResponse.ok) {
    if (allowRetry && createUserResponse.status >= 500) {
      await restartLocalVerdaccioDaemon();
      return ensureLocalRegistryPublishUser(registryUrl, false);
    }
    throw new Error(
      `Failed to create local Verdaccio publish user (${createUserResponse.status}): ${createUserBody}`,
    );
  }

  const parsedCreateUserBody = JSON.parse(createUserBody) as {
    token?: unknown;
  };
  if (
    typeof parsedCreateUserBody.token !== "string" ||
    parsedCreateUserBody.token.length === 0
  ) {
    throw new Error(
      `Local Verdaccio did not return an auth token for publish user ${username}.`,
    );
  }

  const registry = new URL(registryUrl);
  const registryAuthKey = `//${registry.host}${
    registry.pathname === "/" ? "" : registry.pathname.replace(/\/$/, "")
  }/:_authToken=${parsedCreateUserBody.token}`;
  await writeFile(
    LOCAL_REGISTRY_AUTH_NPMRC_PATH,
    `registry=${registryUrl}\n@dreamboard:registry=${registryUrl}\nalways-auth=false\n${registryAuthKey}\n`,
    "utf8",
  );
  return LOCAL_REGISTRY_AUTH_NPMRC_PATH;
}

async function publishNormalizedPackageDirectory(
  normalizedRoot: string,
  registryUrl: string,
  userConfigPath: string,
): Promise<void> {
  await runCommand({
    command: "npm",
    args: [
      "publish",
      "--registry",
      registryUrl,
      "--access",
      "public",
      "--tag",
      "local",
    ],
    cwd: normalizedRoot,
    env: {
      NPM_CONFIG_USERCONFIG: userConfigPath,
    },
  });
}

async function publishLocalSnapshot(
  fingerprint: string,
  registryUrl: string,
): Promise<LocalMaintainerRegistryConfig> {
  const versions = await buildSnapshotVersions(fingerprint);
  const snapshotId = shortHash(
    `${fingerprint}:${Object.values(versions).join(",")}`,
  );
  const publishedAt = new Date().toISOString();
  const normalizedTempRoot = await mkdtemp(
    path.join(os.tmpdir(), "dreamboard-local-snapshot-"),
  );
  const publishUserConfigPath =
    await ensureLocalRegistryPublishUser(registryUrl);

  try {
    for (const packageName of SDK_PUBLISH_ORDER) {
      const normalizedRoot = await createNormalizedPackageDirectory({
        tempRoot: normalizedTempRoot,
        packageName,
        versions,
      });
      await publishNormalizedPackageDirectory(
        normalizedRoot,
        registryUrl,
        publishUserConfigPath,
      );
    }
  } finally {
    await rm(normalizedTempRoot, { recursive: true, force: true });
  }

  return {
    registryUrl,
    snapshotId,
    fingerprint,
    publishedAt,
    packages: versions,
  };
}

async function ensureSnapshot(
  apiBaseUrl: string,
): Promise<LocalMaintainerRegistryConfig | null> {
  if (!isLocalMaintainerRegistryEnabled(apiBaseUrl)) {
    return null;
  }

  const releaseSnapshotLock = await acquireSnapshotLock();
  try {
    const prebuildFingerprint = await computeLocalSnapshotFingerprint();
    const manifest = await readSnapshotManifest();
    const existing = manifest.snapshotsByFingerprint[prebuildFingerprint];
    const registryUrl = await ensureLocalMaintainerVerdaccio();
    if (existing) {
      return existing;
    }

    await buildSdkPackages();
    const fingerprint = await computeLocalSnapshotFingerprint();
    const manifestAfterBuild = await readSnapshotManifest();
    const existingAfterBuild =
      manifestAfterBuild.snapshotsByFingerprint[fingerprint];
    if (existingAfterBuild) {
      return existingAfterBuild;
    }

    const snapshot = await publishLocalSnapshot(fingerprint, registryUrl);
    await writeSnapshotManifest({
      snapshotsByFingerprint: {
        ...manifestAfterBuild.snapshotsByFingerprint,
        [fingerprint]: snapshot,
      },
    });
    return snapshot;
  } finally {
    await releaseSnapshotLock();
  }
}

async function readWorkspace(
  projectRoot: string,
  fallbackRegistryUrl: string,
): Promise<LocalMaintainerRegistryConfig | null> {
  const inferred = await readWorkspaceLocalMaintainerRegistryFromPackageJson(
    projectRoot,
    fallbackRegistryUrl,
  );
  if (!inferred) {
    return null;
  }

  const manifest = await readSnapshotManifest();
  const matched = Object.values(manifest.snapshotsByFingerprint).find(
    (snapshot) =>
      snapshot.packages["@dreamboard/app-sdk"] ===
        inferred.packages["@dreamboard/app-sdk"] &&
      snapshot.packages["@dreamboard/ui-sdk"] ===
        inferred.packages["@dreamboard/ui-sdk"] &&
      snapshot.packages["@dreamboard/sdk-types"] ===
        inferred.packages["@dreamboard/sdk-types"] &&
      (snapshot.packages["@dreamboard/testing"] ?? undefined) ===
        (inferred.packages["@dreamboard/testing"] ?? undefined),
  );
  return matched ?? inferred;
}

function parseFlag(argv: string[], flagName: string): string | null {
  const index = argv.indexOf(flagName);
  if (index === -1) {
    return null;
  }
  return argv[index + 1] ?? null;
}

async function main(): Promise<void> {
  const [command, ...argv] = process.argv.slice(2);

  switch (command) {
    case "ensure-snapshot": {
      const apiBaseUrl = parseFlag(argv, "--api-base-url");
      if (!apiBaseUrl) {
        throw new Error("Missing required flag: --api-base-url");
      }
      process.stdout.write(
        `${JSON.stringify(await ensureSnapshot(apiBaseUrl))}\n`,
      );
      return;
    }
    case "read-workspace": {
      const projectRoot = parseFlag(argv, "--project-root");
      if (!projectRoot) {
        throw new Error("Missing required flag: --project-root");
      }
      const fallbackRegistryUrl =
        parseFlag(argv, "--fallback-registry-url") ?? LOCAL_REGISTRY_URL;
      process.stdout.write(
        `${JSON.stringify(
          await readWorkspace(projectRoot, fallbackRegistryUrl),
        )}\n`,
      );
      return;
    }
    default:
      throw new Error(
        `Unsupported local maintainer registry command: ${command ?? "<missing>"}`,
      );
  }
}

try {
  await main();
} catch (error) {
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  process.exit(1);
}
