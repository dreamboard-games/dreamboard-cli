import path from "node:path";
import type { ProjectConfig } from "../types.js";
import { PROJECT_DIR_NAME, PROJECT_CONFIG_FILE } from "../constants.js";
import { ensureDir, exists, readJsonFile, writeJsonFile } from "../utils/fs.js";

export async function loadProjectConfig(
  rootDir: string,
): Promise<ProjectConfig> {
  const filePath = path.join(rootDir, PROJECT_DIR_NAME, PROJECT_CONFIG_FILE);
  const config = await readJsonFile<ProjectConfig>(filePath);
  return {
    ...config,
    remoteBaseResultId: config.remoteBaseResultId ?? config.resultId,
  };
}

export async function updateProjectState(
  rootDir: string,
  config: ProjectConfig,
): Promise<void> {
  const dir = path.join(rootDir, PROJECT_DIR_NAME);
  await ensureDir(dir);
  await writeJsonFile(path.join(dir, PROJECT_CONFIG_FILE), config);
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
