import { spawnSync } from "node:child_process";
import path from "node:path";
import type { CompiledResult } from "@dreamboard/api-client";
import { getApiVersion, type ApiVersionResponse } from "@dreamboard/api-client";
import type { ProjectConfig } from "../../types.js";
import { resolveCliRepoRoot } from "../../utils/repo-root.js";
import { readTextFile } from "../../utils/fs.js";
import { getLocalDiff } from "../project/local-files.js";
import { assertCliStaticScaffoldComplete } from "../project/static-scaffold.js";
import {
  getProjectAuthoringState,
  getProjectPendingAuthoringSync,
} from "../project/project-state.js";
import { getAuthoringHeadSdk } from "../api/index.js";
import { resolveLatestCompiledResult } from "./resolve-latest-compiled-result.js";

export interface GitRevisionInfo {
  revision: string | null;
  dirty: boolean;
}

export interface DevPreflightResult {
  compiledResult: CompiledResult;
  localSdkVersion: string;
  backendVersion: ApiVersionResponse;
  gitRevision: GitRevisionInfo;
  warnings: string[];
}

export interface DevPreflightDependencies {
  getLocalDiff: typeof getLocalDiff;
  assertCliStaticScaffoldComplete: typeof assertCliStaticScaffoldComplete;
  getAuthoringHeadSdk: typeof getAuthoringHeadSdk;
  getApiVersion: typeof getApiVersion;
  resolveLatestCompiledResult: typeof resolveLatestCompiledResult;
  readTextFile: typeof readTextFile;
  getGitRevisionInfo: (repoRoot: string) => GitRevisionInfo;
}

interface StableSdkVersion {
  major: number;
  minor: number;
  patch: number;
}

const defaultDependencies: DevPreflightDependencies = {
  getLocalDiff,
  assertCliStaticScaffoldComplete,
  getAuthoringHeadSdk,
  getApiVersion,
  resolveLatestCompiledResult,
  readTextFile,
  getGitRevisionInfo,
};

function isIgnorableDevPreflightPath(filePath: string): boolean {
  return (
    filePath.startsWith("test/generated/") ||
    filePath.startsWith(".playwright-cli/")
  );
}

export async function runDevPreflight(
  options: {
    projectRoot: string;
    projectConfig: ProjectConfig;
  },
  dependencies: DevPreflightDependencies = defaultDependencies,
): Promise<DevPreflightResult> {
  const { projectRoot, projectConfig } = options;
  const rawDiff = await dependencies.getLocalDiff(projectRoot);
  const diff = {
    modified: rawDiff.modified.filter(
      (filePath) => !isIgnorableDevPreflightPath(filePath),
    ),
    added: rawDiff.added.filter(
      (filePath) => !isIgnorableDevPreflightPath(filePath),
    ),
    deleted: rawDiff.deleted.filter(
      (filePath) => !isIgnorableDevPreflightPath(filePath),
    ),
  };
  await dependencies.assertCliStaticScaffoldComplete(projectRoot, diff.deleted);

  if (
    diff.modified.length > 0 ||
    diff.added.length > 0 ||
    diff.deleted.length > 0
  ) {
    throw new Error(
      "Local authored changes are not synced yet. Run 'dreamboard sync' before starting local dev.",
    );
  }

  const localAuthoring = getProjectAuthoringState(projectConfig);
  const pendingSync = getProjectPendingAuthoringSync(projectConfig);
  if (pendingSync) {
    if (pendingSync.phase === "authoring_state_created") {
      throw new Error(
        "Previous sync reached the remote authored head, but local scaffold finalization did not complete. Run 'dreamboard sync' again before starting local dev.",
      );
    }
    throw new Error(
      "Previous sync uploaded source changes but did not finish creating the authored head. Run 'dreamboard sync' again before starting local dev.",
    );
  }

  if (!localAuthoring.authoringStateId) {
    throw new Error(
      "This workspace does not know its authored base yet. Run 'dreamboard sync' first.",
    );
  }

  const remoteHead = await dependencies.getAuthoringHeadSdk(
    projectConfig.gameId,
  );
  if (!remoteHead?.authoringStateId) {
    throw new Error(
      "Remote has no authored state for this game yet. Run 'dreamboard sync' first.",
    );
  }

  if (remoteHead.authoringStateId !== localAuthoring.authoringStateId) {
    throw new Error(
      `Remote authored state is ${remoteHead.authoringStateId} but this workspace is based on ${localAuthoring.authoringStateId}. Run 'dreamboard pull' before starting local dev.`,
    );
  }

  const compiledResult = await dependencies.resolveLatestCompiledResult(
    projectRoot,
    projectConfig,
  );
  const localSdkVersion = await readLocalWorkspaceSdkVersion(
    projectRoot,
    dependencies,
  );
  const { data: backendVersion, error: backendVersionError } =
    await dependencies.getApiVersion();
  if (backendVersionError || !backendVersion) {
    throw new Error(
      "Failed to load backend version metadata. Check your backend connection and try again.",
    );
  }

  if (
    backendVersion.uiSdkVersion &&
    !doesLocalSdkVersionMatchBackend(
      localSdkVersion,
      backendVersion.uiSdkVersion,
    )
  ) {
    throw new Error(
      `Local workspace SDK version is ${localSdkVersion}, but the backend expects ${backendVersion.uiSdkVersion}. Run 'dreamboard sync', then 'dreamboard compile'.`,
    );
  }

  if (
    backendVersion.uiSdkVersion &&
    compiledResult.sdkVersion !== backendVersion.uiSdkVersion
  ) {
    throw new Error(
      `Latest successful compile ${compiledResult.id} was built with SDK ${compiledResult.sdkVersion ?? "unknown"}, but the backend expects ${backendVersion.uiSdkVersion}. Run 'dreamboard compile' again after syncing the scaffold.`,
    );
  }

  const repoRoot = resolveCliRepoRoot();
  const gitRevision = dependencies.getGitRevisionInfo(repoRoot);
  const warnings: string[] = [];
  if (
    backendVersion.backendRevision &&
    gitRevision.revision &&
    backendVersion.backendRevision !== gitRevision.revision
  ) {
    const dirtyNote = gitRevision.dirty
      ? " Local platform sources are dirty, so the comparison is against HEAD only."
      : "";
    warnings.push(
      `Backend revision ${backendVersion.backendRevision} does not match local platform revision ${gitRevision.revision}.${dirtyNote}`,
    );
  }

  return {
    compiledResult,
    localSdkVersion,
    backendVersion,
    gitRevision,
    warnings,
  };
}

function doesLocalSdkVersionMatchBackend(
  localSdkVersion: string,
  backendSdkVersion: string,
): boolean {
  if (localSdkVersion === backendSdkVersion) {
    return true;
  }

  const backendVersion = parseStableSdkVersion(backendSdkVersion);
  if (!backendVersion) {
    return false;
  }

  const exactLocalVersion = parseStableSdkVersion(localSdkVersion);
  if (exactLocalVersion) {
    return compareStableSdkVersions(exactLocalVersion, backendVersion) === 0;
  }

  const localRangePrefix = localSdkVersion[0];
  const localRangeVersion = parseStableSdkVersion(localSdkVersion.slice(1));
  if (!localRangeVersion) {
    return false;
  }

  if (localRangePrefix === "^") {
    return satisfiesCaretRange(backendVersion, localRangeVersion);
  }

  if (localRangePrefix === "~") {
    return satisfiesTildeRange(backendVersion, localRangeVersion);
  }

  return false;
}

function parseStableSdkVersion(input: string): StableSdkVersion | null {
  const match = input.trim().match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    return null;
  }
  const [, major, minor, patch] = match;
  if (!major || !minor || !patch) {
    return null;
  }

  return {
    major: Number.parseInt(major, 10),
    minor: Number.parseInt(minor, 10),
    patch: Number.parseInt(patch, 10),
  };
}

function compareStableSdkVersions(
  left: StableSdkVersion,
  right: StableSdkVersion,
): number {
  if (left.major !== right.major) {
    return left.major - right.major;
  }
  if (left.minor !== right.minor) {
    return left.minor - right.minor;
  }
  return left.patch - right.patch;
}

function satisfiesCaretRange(
  candidate: StableSdkVersion,
  minimum: StableSdkVersion,
): boolean {
  if (compareStableSdkVersions(candidate, minimum) < 0) {
    return false;
  }

  if (minimum.major > 0) {
    return candidate.major === minimum.major;
  }

  if (minimum.minor > 0) {
    return candidate.major === 0 && candidate.minor === minimum.minor;
  }

  return (
    candidate.major === 0 &&
    candidate.minor === 0 &&
    candidate.patch === minimum.patch
  );
}

function satisfiesTildeRange(
  candidate: StableSdkVersion,
  minimum: StableSdkVersion,
): boolean {
  return (
    compareStableSdkVersions(candidate, minimum) >= 0 &&
    candidate.major === minimum.major &&
    candidate.minor === minimum.minor
  );
}

async function readLocalWorkspaceSdkVersion(
  projectRoot: string,
  dependencies: Pick<DevPreflightDependencies, "readTextFile">,
): Promise<string> {
  const packageJsonPath = path.join(projectRoot, "package.json");
  let raw: string;
  try {
    raw = await dependencies.readTextFile(packageJsonPath);
  } catch {
    throw new Error(
      "Local workspace package.json is missing. Run 'dreamboard sync', then 'dreamboard compile'.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "Local workspace package.json is invalid. Run 'dreamboard sync', then 'dreamboard compile'.",
    );
  }

  const uiSdkSpecifier =
    typeof parsed === "object" &&
    parsed !== null &&
    "dependencies" in parsed &&
    typeof parsed.dependencies === "object" &&
    parsed.dependencies !== null &&
    "@dreamboard/ui-sdk" in parsed.dependencies &&
    typeof parsed.dependencies["@dreamboard/ui-sdk"] === "string"
      ? parsed.dependencies["@dreamboard/ui-sdk"].trim()
      : "";

  let version = uiSdkSpecifier;

  if (
    uiSdkSpecifier.startsWith("workspace:") ||
    uiSdkSpecifier.startsWith("file:")
  ) {
    const repoUiSdkPackageJsonPath = path.join(
      resolveCliRepoRoot(),
      "packages",
      "ui-sdk",
      "package.json",
    );
    try {
      const repoUiSdkPackageJson = JSON.parse(
        await dependencies.readTextFile(repoUiSdkPackageJsonPath),
      ) as { version?: unknown };
      if (typeof repoUiSdkPackageJson.version === "string") {
        version = repoUiSdkPackageJson.version.trim();
      }
    } catch {
      throw new Error(
        "Local workspace depends on @dreamboard/ui-sdk via local resolution, but the local platform package version could not be read. Reinstall dependencies or run 'dreamboard sync' and try again.",
      );
    }
  }

  if (!version) {
    throw new Error(
      "Local workspace package.json is missing an @dreamboard/ui-sdk dependency. Run 'dreamboard sync', then 'dreamboard compile'.",
    );
  }

  return version;
}

function getGitRevisionInfo(repoRoot: string): GitRevisionInfo {
  const revisionResult = spawnSync(
    "git",
    ["-C", repoRoot, "rev-parse", "HEAD"],
    {
      encoding: "utf8",
    },
  );
  const revision =
    revisionResult.status === 0 ? revisionResult.stdout.trim() || null : null;

  const dirtyResult = spawnSync(
    "git",
    ["-C", repoRoot, "status", "--porcelain", "--untracked-files=no"],
    {
      encoding: "utf8",
    },
  );

  return {
    revision,
    dirty: dirtyResult.status === 0 && dirtyResult.stdout.trim().length > 0,
  };
}
