import { defineCommand } from "citty";
import consola from "consola";
import {
  getGlobalAuthPath,
  getGlobalConfigPath,
  loadGlobalConfig,
  saveGlobalConfig,
} from "../config/global-config.js";

export default defineCommand({
  meta: { name: "logout", description: "Clear the stored Dreamboard session" },
  args: {},
  async run() {
    const globalConfig = await loadGlobalConfig();
    await saveGlobalConfig({
      ...globalConfig,
      authToken: undefined,
      refreshToken: undefined,
    });
    consola.success(`Logged out. Cleared session from ${getGlobalAuthPath()}.`);
  },
});
