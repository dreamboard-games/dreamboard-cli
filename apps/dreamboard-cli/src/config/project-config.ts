import path from "node:path";
import type { ProjectConfig } from "../types.js";
import { PROJECT_DIR_NAME, PROJECT_CONFIG_FILE } from "../constants.js";
import { ensureDir, exists, readJsonFile, writeJsonFile } from "../utils/fs.js";

function normalizeProjectConfig(config: ProjectConfig): ProjectConfig {
  const authoring = config.authoring ?? {
    authoringStateId: undefined,
    ruleId: config.ruleId,
    manifestId: config.manifestId,
    manifestContentHash: config.manifestContentHash,
    sourceRevisionId: config.sourceRevisionId,
    sourceTreeHash: config.sourceTreeHash,
  };
  const compile = config.compile ?? {
    latestAttempt: config.resultId
      ? {
          resultId: config.resultId,
          authoringStateId: authoring.authoringStateId ?? "",
          status: "successful",
        }
      : undefined,
    latestSuccessful: config.resultId
      ? {
          resultId: config.resultId,
          authoringStateId: authoring.authoringStateId ?? "",
        }
      : undefined,
  };

  return {
    gameId: config.gameId,
    slug: config.slug,
    authoring,
    compile,
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
  await writeJsonFile(
    path.join(dir, PROJECT_CONFIG_FILE),
    normalizeProjectConfig(config),
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
