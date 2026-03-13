import crypto from "node:crypto";
import { defineCommand } from "citty";
import consola from "consola";
import { DEFAULT_LOGIN_TIMEOUT_MS } from "../constants.js";
import { IS_PUBLISHED_BUILD, PUBLISHED_ENVIRONMENT } from "../build-target.js";
import { resolveConfig } from "../config/resolve.js";
import { parseLoginCommandArgs } from "../flags.js";
import {
  getGlobalConfigPath,
  loadGlobalConfig,
  saveGlobalConfig,
} from "../config/global-config.js";
import { startCliAuthServer, openBrowser } from "../auth/auth-server.js";

export default defineCommand({
  meta: {
    name: "login",
    description:
      "Open browser login and store a refreshable Dreamboard session",
  },
  args: {
    ...(IS_PUBLISHED_BUILD
      ? {}
      : {
          env: {
            type: "string" as const,
            description: "Environment: local | dev | prod",
          },
        }),
  },
  async run({ args }) {
    const parsedArgs = parseLoginCommandArgs(args);
    const globalConfig = await loadGlobalConfig();
    const effectiveArgs = IS_PUBLISHED_BUILD
      ? { ...parsedArgs, env: PUBLISHED_ENVIRONMENT }
      : parsedArgs;
    const config = resolveConfig(globalConfig, effectiveArgs);
    const state = crypto.randomUUID();

    const server = await startCliAuthServer(state, DEFAULT_LOGIN_TIMEOUT_MS);
    const loginUrl = `${config.webBaseUrl.replace(/\/$/, "")}/cli-login?port=${server.port}&state=${state}`;

    consola.info("Opening browser for login...");
    consola.info(`If the browser does not open, visit: ${loginUrl}`);
    openBrowser(loginUrl);

    consola.start("Waiting for login to complete...");
    const { token, refreshToken } = await server.waitForToken;

    await saveGlobalConfig({
      ...globalConfig,
      authToken: token,
      refreshToken: refreshToken ?? undefined,
      environment: IS_PUBLISHED_BUILD
        ? PUBLISHED_ENVIRONMENT
        : effectiveArgs.env || globalConfig.environment,
    });
    consola.success(
      `Login successful. Session saved to ${getGlobalConfigPath()}.`,
    );
  },
});
