import { client } from "@dreamboard/api-client/client.gen";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { GlobalConfig, ProjectConfig, ResolvedConfig } from "../types.js";
import type { ConfigFlags } from "../flags.js";
import { IS_PUBLISHED_BUILD, PUBLISHED_ENVIRONMENT } from "../build-target.js";
import {
  DEFAULT_API_BASE_URL,
  DEFAULT_WEB_BASE_URL,
  ENVIRONMENT_CONFIGS,
} from "../constants.js";
import { loadGlobalConfig } from "./global-config.js";
import { findProjectRoot, loadProjectConfig } from "./project-config.js";

export function resolveConfig(
  globalConfig: GlobalConfig,
  flags: ConfigFlags,
  project?: ProjectConfig,
): ResolvedConfig {
  if (IS_PUBLISHED_BUILD) {
    assertPublicRuntimeFlags(flags);
  }

  const environment = IS_PUBLISHED_BUILD
    ? PUBLISHED_ENVIRONMENT
    : flags.env || globalConfig.environment || "dev";
  const envConfig = ENVIRONMENT_CONFIGS[environment];

  const apiBaseUrl = IS_PUBLISHED_BUILD
    ? ENVIRONMENT_CONFIGS[PUBLISHED_ENVIRONMENT].apiBaseUrl
    : project?.apiBaseUrl || envConfig?.apiBaseUrl || DEFAULT_API_BASE_URL;

  const webBaseUrl = IS_PUBLISHED_BUILD
    ? ENVIRONMENT_CONFIGS[PUBLISHED_ENVIRONMENT].webBaseUrl
    : project?.webBaseUrl || envConfig?.webBaseUrl || DEFAULT_WEB_BASE_URL;

  const supabaseUrl = envConfig?.supabaseUrl;
  const supabaseAnonKey = envConfig?.supabaseAnonKey;

  const authToken = IS_PUBLISHED_BUILD
    ? globalConfig.authToken
    : valueOrUndefined(flags.token) ||
      process.env.DREAMBOARD_TOKEN ||
      globalConfig.authToken;

  const refreshToken = IS_PUBLISHED_BUILD
    ? globalConfig.refreshToken
    : process.env.DREAMBOARD_REFRESH_TOKEN || globalConfig.refreshToken;

  return {
    apiBaseUrl,
    webBaseUrl,
    supabaseUrl,
    supabaseAnonKey,
    authToken,
    refreshToken,
  };
}

function assertPublicRuntimeFlags(flags: ConfigFlags): void {
  const argv = process.argv.slice(2);

  if (flags.env || argv.includes("--env")) {
    throw new Error(
      "The published Dreamboard CLI is production-only and does not accept `--env`.",
    );
  }

  if (valueOrUndefined(flags.token) || argv.includes("--token")) {
    throw new Error(
      "Direct JWT injection is not supported in the published Dreamboard CLI. Use `dreamboard login` so the CLI can store and refresh your session.",
    );
  }

  if (process.env.DREAMBOARD_TOKEN || process.env.DREAMBOARD_REFRESH_TOKEN) {
    throw new Error(
      "The published Dreamboard CLI ignores direct token environment variables. Use `dreamboard login` so the CLI can manage refreshable credentials.",
    );
  }
}

/**
 * Configure the API client with the resolved auth token.
 *
 * When a refresh token is available (e.g. DREAMBOARD_REFRESH_TOKEN env var set
 * inside a sandbox), this will first use the Supabase SDK to refresh the session
 * so the CLI always has a valid access token, even if the original JWT has expired.
 */
export async function configureClient(config: ResolvedConfig): Promise<void> {
  await refreshAuthTokenIfNeeded(config);

  client.setConfig({
    baseUrl: config.apiBaseUrl,
    headers: config.authToken
      ? { Authorization: `Bearer ${config.authToken}` }
      : {},
  });
}

/**
 * If both an auth token and a refresh token are available (e.g. inside a sandbox),
 * use the Supabase SDK to refresh the session. This ensures the CLI always has
 * a valid access token even if the original JWT has expired.
 *
 * Mutates `config.authToken` in-place with the fresh token.
 */
async function refreshAuthTokenIfNeeded(config: ResolvedConfig): Promise<void> {
  if (!config.authToken || !config.refreshToken) return;
  if (!config.supabaseUrl || !config.supabaseAnonKey) return;

  try {
    const supabase = createSupabaseClient(
      config.supabaseUrl,
      config.supabaseAnonKey,
    );

    const { data, error } = await supabase.auth.setSession({
      access_token: config.authToken,
      refresh_token: config.refreshToken,
    });

    if (error) {
      // If refresh fails, continue with the original token — it may still be valid
      console.warn(`Token refresh failed: ${error.message}`);
      return;
    }

    if (data.session?.access_token) {
      config.authToken = data.session.access_token;
    }
  } catch {
    // Swallow errors — the original token may still work
  }
}

export function requireAuth(config: ResolvedConfig): void {
  if (!config.authToken) {
    throw new Error(
      "Missing Dreamboard session. Run `dreamboard login` to authenticate.",
    );
  }
}

export function valueOrUndefined(
  value: string | boolean | undefined,
): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

/**
 * Common init pattern used by pull, push, status, update, run commands:
 * find project root, load config, resolve config, require auth, configure client.
 *
 * When a refresh token is available (e.g. DREAMBOARD_REFRESH_TOKEN env var set
 * inside a sandbox), automatically refreshes the auth token via Supabase before
 * configuring the API client.
 */
export async function resolveProjectContext(
  flags: ConfigFlags,
  opts?: { requireAuth?: boolean },
): Promise<{
  projectRoot: string;
  projectConfig: ProjectConfig;
  config: ResolvedConfig;
}> {
  const projectRoot = await findProjectRoot(process.cwd());
  if (!projectRoot) {
    throw new Error(
      "Not inside a dreamboard project (missing .dreamboard/project.json).",
    );
  }

  const projectConfig = await loadProjectConfig(projectRoot);
  const config = resolveConfig(await loadGlobalConfig(), flags, projectConfig);

  if (opts?.requireAuth !== false) {
    requireAuth(config);
    await configureClient(config);
  }

  return { projectRoot, projectConfig, config };
}
