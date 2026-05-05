import crypto from "node:crypto";
import { defineCommand } from "citty";
import consola from "consola";
import { DEFAULT_LOGIN_TIMEOUT_MS } from "../constants.js";
import { IS_PUBLISHED_BUILD, PUBLISHED_ENVIRONMENT } from "../build-target.js";
import { resolveConfig } from "../config/resolve.js";
import { parseLoginCommandArgs } from "../flags.js";
import {
  getGlobalAuthPath,
  loadGlobalConfig,
  saveGlobalConfig,
} from "../config/global-config.js";
import {
  getStoredSession,
  setAccessOnlySession,
  setCredentials,
} from "../config/credential-store.js";
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
    const [globalConfig, storedSession] = await Promise.all([
      loadGlobalConfig(),
      getStoredSession(),
    ]);
    const config = resolveConfig(
      globalConfig,
      parsedArgs,
      undefined,
      storedSession,
    );
    const state = crypto.randomUUID();

    const server = await startCliAuthServer(state, DEFAULT_LOGIN_TIMEOUT_MS);
    const loginUrl = `${config.webBaseUrl.replace(/\/$/, "")}/cli-login?port=${server.port}&state=${state}`;

    consola.info("Opening browser for login...");
    consola.info(`If the browser does not open, visit: ${loginUrl}`);
    openBrowser(loginUrl);

    consola.start("Waiting for login to complete...");
    try {
      const { token, refreshToken } = await server.waitForToken;

      const resolvedEnvironment = IS_PUBLISHED_BUILD
        ? PUBLISHED_ENVIRONMENT
        : parsedArgs.env || globalConfig.environment;

      // Persist environment choice separately from credentials. The
      // credential write itself goes through CredentialStore, which
      // applies atomic-write + 0600 + cross-process lock.
      await saveGlobalConfig({
        ...globalConfig,
        environment: resolvedEnvironment,
      });

      if (refreshToken) {
        await setCredentials({
          accessToken: token,
          refreshToken,
        });
      } else {
        // Browser flow normally always returns both tokens; fall back
        // to an access-only session if not so we do not regress older
        // servers that only emit the access token.
        consola.warn(
          "Auth server did not return a refresh token. Session saved without auto-refresh support.",
        );
        await setAccessOnlySession(token);
      }

      consola.success(
        `Login successful. Session saved to ${getGlobalAuthPath()}`,
      );
    } finally {
      server.close();
    }
  },
});
