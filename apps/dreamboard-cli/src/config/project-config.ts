import path from "node:path";
import type { ProjectConfig } from "../types.js";
import { PROJECT_DIR_NAME, PROJECT_CONFIG_FILE } from "../constants.js";
import { ensureDir, exists, readJsonFile } from "../utils/fs.js";
import { atomicWriteFile } from "../utils/atomic-file.js";

function normalizeProjectConfig(config: ProjectConfig): ProjectConfig {
  return {
    gameId: config.gameId,
    slug: config.slug,
    authoring: config.authoring,
    compile: config.compile,
    localMaintainerRegistry: config.localMaintainerRegistry,
    apiBaseUrl: config.apiBaseUrl,
    webBaseUrl: config.webBaseUrl,
  };
}

export async function loadProjectConfig(
  rootDir: string,
): Promise<ProjectConfig> {
  const filePath = path.join(rootDir, PROJECT_DIR_NAME, PROJECT_CONFIG_FILE);
  return normalizeProjectConfig(await readJsonFile<ProjectConfig>(filePath));
}

export async function updateProjectState(
  rootDir: string,
  config: ProjectConfig,
): Promise<void> {
  const dir = path.join(rootDir, PROJECT_DIR_NAME);
  await ensureDir(dir);
  // Use the atomic-file primitive so a crash during `dreamboard sync`
  // cannot leave `.dreamboard/project.json` truncated. A truncated
  // project file would break `findProjectRoot` and force the user to
  // re-clone the workspace. `0o644` (world-readable) is intentional:
  // this file is not secret and users frequently mount workspaces into
  // containers running under a different uid.
  await atomicWriteFile(
    path.join(dir, PROJECT_CONFIG_FILE),
    `${JSON.stringify(normalizeProjectConfig(config), null, 2)}\n`,
    { mode: 0o644 },
  );
}

export async function findProjectRoot(
  startDir: string,
): Promise<string | null> {
  let current = path.resolve(startDir);
  for (let i = 0; i < 25; i++) {
    const candidate = path.join(current, PROJECT_DIR_NAME, PROJECT_CONFIG_FILE);
    if (await exists(candidate)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}
