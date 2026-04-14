import crypto from "node:crypto";
import { defineCommand } from "citty";
import consola from "consola";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { startCliAuthServer, openBrowser } from "../auth/auth-server.js";
import { DEFAULT_LOGIN_TIMEOUT_MS, ENVIRONMENT_CONFIGS } from "../constants.js";
import {
  getGlobalConfigPath,
  loadGlobalConfig,
  saveGlobalConfig,
} from "../config/global-config.js";
import {
  formatStoredSessionInvalidMessage,
  isInvalidRefreshTokenMessage,
} from "../config/resolve.js";
import { parseAuthCommandArgs } from "../flags.js";
import { IS_PUBLISHED_BUILD, PUBLISHED_ENVIRONMENT } from "../build-target.js";

async function loginWithBrowser(
  webBaseUrl: string,
  quiet: boolean,
): Promise<{ token: string; refreshToken: string | undefined }> {
  const state = crypto.randomUUID();
  const server = await startCliAuthServer(state, DEFAULT_LOGIN_TIMEOUT_MS);
  const loginUrl = `${webBaseUrl.replace(/\/$/, "")}/cli-login?port=${server.port}&state=${state}`;

  if (!quiet) {
    consola.info("Opening browser for login...");
    consola.info(`If the browser does not open, visit: ${loginUrl}`);
  }

  openBrowser(loginUrl);

  if (!quiet) {
    consola.start("Waiting for login to complete...");
  }

  try {
    const { token, refreshToken } = await server.waitForToken;
    return { token, refreshToken: refreshToken ?? undefined };
  } finally {
    server.close();
  }
}

export default defineCommand({
  meta: { name: "auth", description: "Manage stored Dreamboard sessions" },
  args: {
    action: {
      type: "positional",
      description: IS_PUBLISHED_BUILD
        ? "Action: clear | login"
        : "Action: set | clear | login | env",
      required: true,
    },
    ...(IS_PUBLISHED_BUILD
      ? {}
      : {
          tokenValue: {
            type: "positional" as const,
            description: "Token value (for set) or environment name (for env)",
            required: false,
          },
          token: {
            type: "string" as const,
            description: "Auth token (alternative)",
          },
          jwt: {
            type: "boolean" as const,
            description: "Print auth token JSON to stdout",
          },
          env: {
            type: "string" as const,
            description: "Environment: local | dev | prod",
          },
        }),
  },
  async run({ args }) {
    const parsedArgs = parseAuthCommandArgs(args);
    const action = parsedArgs.action;
    const config = await loadGlobalConfig();

    if (IS_PUBLISHED_BUILD && action !== "login" && action !== "clear") {
      throw new Error(
        "The published Dreamboard CLI only supports browser login and logout. Use `dreamboard login` or `dreamboard logout`.",
      );
    }

    if (action === "env") {
      if (IS_PUBLISHED_BUILD) {
        throw new Error(
          "The published Dreamboard CLI is production-only and does not support switching environments.",
        );
      }
      const environment = parsedArgs.tokenValue ?? parsedArgs.env;
      if (!environment) {
        throw new Error("Usage: dreamboard auth env <local|dev|prod>");
      }
      if (!["local", "dev", "prod"].includes(environment)) {
        throw new Error(
          `Invalid environment '${environment}'. Valid options: local, dev, prod`,
        );
      }
      await saveGlobalConfig({ ...config, environment: environment as any });
      consola.success(`Environment set to '${environment}'.`);
      return;
    }

    if (action === "set") {
      if (IS_PUBLISHED_BUILD) {
        throw new Error(
          "Direct JWT injection is not supported in the published Dreamboard CLI. Use `dreamboard login` so the CLI can store a refreshable session.",
        );
      }
      const token = parsedArgs.tokenValue ?? parsedArgs.token ?? "";
      if (!token) throw new Error("Usage: dreamboard auth set <token>");
      await saveGlobalConfig({ ...config, authToken: token });
      consola.success("Auth token saved.");
      return;
    }

    if (action === "clear") {
      await saveGlobalConfig({
        ...config,
        authToken: undefined,
        refreshToken: undefined,
      });
      consola.success(
        `Stored Dreamboard session cleared from ${getGlobalConfigPath()}.`,
      );
      return;
    }

    if (action === "login") {
      const shouldPrintJwt = !IS_PUBLISHED_BUILD && parsedArgs.jwt === true;
      const environment = IS_PUBLISHED_BUILD
        ? PUBLISHED_ENVIRONMENT
        : parsedArgs.env || config.environment || "dev";
      const envConfig = ENVIRONMENT_CONFIGS[environment];

      const supabaseUrl = envConfig?.supabaseUrl;
      const supabaseAnonKey = envConfig?.supabaseAnonKey;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          `Missing Supabase config for environment '${environment}'. Check ENVIRONMENT_CONFIGS in constants.ts.`,
        );
      }

      const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
      let accessToken = config.authToken;
      let refreshToken = config.refreshToken;
      let didRefreshStoredSession = false;
      let didUseBrowserLogin = false;

      if (accessToken) {
        if (refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            if (isInvalidRefreshTokenMessage(error.message)) {
              consola.warn(formatStoredSessionInvalidMessage(error.message));
              accessToken = undefined;
              refreshToken = undefined;
            } else {
              throw new Error(
                `Stored session refresh failed: ${error.message}`,
              );
            }
          } else {
            accessToken = data.session?.access_token ?? accessToken;
            refreshToken = data.session?.refresh_token ?? refreshToken;
            didRefreshStoredSession = true;
          }
        }
      }

      if (!accessToken) {
        const browserLogin = await loginWithBrowser(
          envConfig.webBaseUrl,
          shouldPrintJwt,
        );
        accessToken = browserLogin.token;
        refreshToken = browserLogin.refreshToken;
        didUseBrowserLogin = true;
      }

      if (!accessToken) {
        throw new Error("Login completed but no access token was returned.");
      }

      await saveGlobalConfig({
        ...config,
        authToken: accessToken,
        refreshToken: refreshToken,
        environment: environment as any,
      });

      if (shouldPrintJwt) {
        process.stdout.write(
          `${JSON.stringify(
            {
              token: accessToken,
              refreshToken: refreshToken ?? null,
              environment,
            },
            null,
            2,
          )}\n`,
        );
        return;
      }

      if (didUseBrowserLogin) {
        consola.success(
          `Browser login successful. Session saved to ${getGlobalConfigPath()}.`,
        );
      } else if (config.authToken && didRefreshStoredSession) {
        consola.success(
          `Stored auth session refreshed and saved to ${getGlobalConfigPath()}.`,
        );
      } else if (config.authToken) {
        consola.success(
          `Stored auth token found. Session data remains in ${getGlobalConfigPath()}.`,
        );
      }
      return;
    }

    throw new Error(
      IS_PUBLISHED_BUILD
        ? "Usage:\n  dreamboard auth clear\n  dreamboard auth login"
        : "Usage:\n  dreamboard auth clear\n  dreamboard auth login [--env <local|dev|prod>] [--jwt]\n  dreamboard auth set <token>\n  dreamboard auth env <local|dev|prod>",
    );
  },
});
