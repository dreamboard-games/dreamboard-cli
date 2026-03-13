import os from "node:os";
import path from "node:path";
import type { GlobalConfig } from "../types.js";
import { PROJECT_DIR_NAME } from "../constants.js";
import { ensureDir, readJsonFile, writeJsonFile } from "../utils/fs.js";

export function getGlobalConfigPath(): string {
  return path.join(os.homedir(), PROJECT_DIR_NAME, "config.json");
}

export async function loadGlobalConfig(): Promise<GlobalConfig> {
  const configPath = getGlobalConfigPath();
  return readJsonFile<GlobalConfig>(configPath).catch(() => ({}));
}

export async function saveGlobalConfig(config: GlobalConfig): Promise<void> {
  const configDir = path.join(os.homedir(), PROJECT_DIR_NAME);
  await ensureDir(configDir);
  await writeJsonFile(getGlobalConfigPath(), config);
}
