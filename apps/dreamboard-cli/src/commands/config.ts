import { defineCommand } from "citty";
import consola from "consola";
import type { GlobalConfig, Environment } from "../types.js";
import { IS_PUBLISHED_BUILD } from "../build-target.js";
import { resolveConfig, valueOrUndefined } from "../config/resolve.js";
import { parseConfigCommandArgs } from "../flags.js";
import {
  getGlobalConfigPath,
  loadGlobalConfig,
  saveGlobalConfig,
} from "../config/global-config.js";

export default defineCommand({
  meta: {
    name: "config",
    description: IS_PUBLISHED_BUILD
      ? "View CLI configuration"
      : "View or update CLI configuration",
  },
  args: {
    action: {
      type: "positional",
      description: IS_PUBLISHED_BUILD ? "Action: show" : "Action: show | set",
      default: "show",
    },
    ...(IS_PUBLISHED_BUILD
      ? {}
      : {
          env: {
            type: "string" as const,
            description: "Environment: local | dev | prod",
          },
          token: {
            type: "string" as const,
            description: "Auth token (Supabase JWT)",
          },
        }),
  },
  async run({ args }) {
    const parsedArgs = parseConfigCommandArgs(args);
    const action = parsedArgs.action;
    const globalConfig = await loadGlobalConfig();

    if (action === "show") {
      const config = resolveConfig(globalConfig, parsedArgs);
      console.log(
        JSON.stringify(
          IS_PUBLISHED_BUILD
            ? {
                configPath: getGlobalConfigPath(),
                authenticated: Boolean(config.authToken),
                refreshableSession: Boolean(config.refreshToken),
              }
            : {
                configPath: getGlobalConfigPath(),
                environment:
                  parsedArgs.env || globalConfig.environment || "dev",
                apiBaseUrl: config.apiBaseUrl,
                webBaseUrl: config.webBaseUrl,
                authenticated: Boolean(config.authToken),
                refreshableSession: Boolean(config.refreshToken),
              },
          null,
          2,
        ),
      );
      return;
    }

    if (action === "set") {
      if (IS_PUBLISHED_BUILD) {
        throw new Error(
          "The published Dreamboard CLI does not support config overrides. Use `dreamboard login` to authenticate.",
        );
      }
      const updated: GlobalConfig = { ...globalConfig };
      if (parsedArgs.env) updated.environment = parsedArgs.env as Environment;
      const authToken = valueOrUndefined(parsedArgs.token);
      if (authToken) updated.authToken = authToken;
      await saveGlobalConfig(updated);
      consola.success("Config updated.");
      return;
    }

    throw new Error(
      IS_PUBLISHED_BUILD
        ? "Usage: dreamboard config show"
        : "Usage: dreamboard config show | dreamboard config set --env <local|dev|prod>",
    );
  },
});
