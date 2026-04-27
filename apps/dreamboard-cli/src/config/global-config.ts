import os from "node:os";
import path from "node:path";
import type { GlobalAuth, GlobalConfig } from "../types.js";
import { PROJECT_DIR_NAME } from "../constants.js";
import { ensureDir, readJsonFile, writeJsonFile } from "../utils/fs.js";

export function getGlobalConfigPath(): string {
  return path.join(os.homedir(), PROJECT_DIR_NAME, "config.json");
}

export function getGlobalAuthPath(): string {
  return path.join(os.homedir(), PROJECT_DIR_NAME, "auth.json");
}

export async function loadGlobalConfig(): Promise<GlobalConfig> {
  const [config, auth] = await Promise.all([
    readJsonFile<GlobalConfig>(getGlobalConfigPath()).catch(
      () => ({}) as GlobalConfig,
    ),
    readJsonFile<GlobalAuth>(getGlobalAuthPath()).catch(
      () => ({}) as GlobalAuth,
    ),
  ]);

  return {
    ...config,
    authToken: auth.authToken,
    refreshToken: auth.refreshToken,
  };
}

export async function saveGlobalConfig(config: GlobalConfig): Promise<void> {
  const configDir = path.join(os.homedir(), PROJECT_DIR_NAME);
  const { authToken, refreshToken, ...configWithoutAuth } = config;
  await ensureDir(configDir);
  await Promise.all([
    writeJsonFile(getGlobalConfigPath(), configWithoutAuth),
    writeJsonFile(getGlobalAuthPath(), {
      authToken,
      refreshToken,
    }),
  ]);
}
