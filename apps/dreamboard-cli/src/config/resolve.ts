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
import { loadGlobalConfig, saveGlobalConfig } from "./global-config.js";
import { findProjectRoot, loadProjectConfig } from "./project-config.js";

const LOGIN_HINT = "Run `dreamboard login` to authenticate again.";
const TOKEN_REFRESH_WINDOW_MS = 5 * 60 * 1000;

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
  const publishedEnvConfig = ENVIRONMENT_CONFIGS[PUBLISHED_ENVIRONMENT];
  const hasExplicitEnvironmentOverride =
    !IS_PUBLISHED_BUILD && Boolean(flags.env);

  const resolvedApiBaseUrl = IS_PUBLISHED_BUILD
    ? (publishedEnvConfig?.apiBaseUrl ?? DEFAULT_API_BASE_URL)
    : hasExplicitEnvironmentOverride
      ? envConfig?.apiBaseUrl || DEFAULT_API_BASE_URL
      : project?.apiBaseUrl || envConfig?.apiBaseUrl || DEFAULT_API_BASE_URL;
  const apiBaseUrl =
    valueOrUndefined(process.env.DREAMBOARD_API_BASE_URL) ?? resolvedApiBaseUrl;

  const resolvedWebBaseUrl = IS_PUBLISHED_BUILD
    ? (publishedEnvConfig?.webBaseUrl ?? DEFAULT_WEB_BASE_URL)
    : hasExplicitEnvironmentOverride
      ? envConfig?.webBaseUrl || DEFAULT_WEB_BASE_URL
      : project?.webBaseUrl || envConfig?.webBaseUrl || DEFAULT_WEB_BASE_URL;
  const webBaseUrl =
    valueOrUndefined(process.env.DREAMBOARD_WEB_BASE_URL) ?? resolvedWebBaseUrl;

  const supabaseUrl = envConfig?.supabaseUrl;
  const supabaseAnonKey = envConfig?.supabaseAnonKey;
  const flagToken = valueOrUndefined(flags.token);
  const envToken = valueOrUndefined(process.env.DREAMBOARD_TOKEN);
  const envRefreshToken = valueOrUndefined(
    process.env.DREAMBOARD_REFRESH_TOKEN,
  );

  const authToken = IS_PUBLISHED_BUILD
    ? globalConfig.authToken
    : flagToken || envToken || globalConfig.authToken;

  const refreshToken = IS_PUBLISHED_BUILD
    ? globalConfig.refreshToken
    : envRefreshToken || globalConfig.refreshToken;

  const authTokenSource = IS_PUBLISHED_BUILD
    ? globalConfig.authToken
      ? "global"
      : "none"
    : flagToken
      ? "flag"
      : envToken
        ? "env"
        : globalConfig.authToken
          ? "global"
          : "none";

  const refreshTokenSource = IS_PUBLISHED_BUILD
    ? globalConfig.refreshToken
      ? "global"
      : "none"
    : envRefreshToken
      ? "env"
      : globalConfig.refreshToken
        ? "global"
        : "none";

  return {
    apiBaseUrl,
    webBaseUrl,
    supabaseUrl,
    supabaseAnonKey,
    authToken,
    refreshToken,
    authTokenSource,
    refreshTokenSource,
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
  await refreshResolvedAuthSession(config);

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
async function refreshAuthTokenIfNeeded(
  config: ResolvedConfig,
): Promise<{ authToken: string; refreshToken?: string } | null> {
  if (!config.authToken || !config.refreshToken) return null;
  if (!config.supabaseUrl || !config.supabaseAnonKey) return null;

  const authTokenExpiry = getAuthTokenExpiry(config.authToken);
  const expiresAtMs = authTokenExpiry?.getTime();
  const isExpired = expiresAtMs !== undefined && expiresAtMs <= Date.now();
  const shouldRefresh =
    expiresAtMs !== undefined &&
    expiresAtMs <= Date.now() + TOKEN_REFRESH_WINDOW_MS;

  if (!shouldRefresh) {
    return null;
  }

  try {
    const initialSession = {
      authToken: config.authToken,
      refreshToken: config.refreshToken,
    };
    const { session, error } = await refreshSessionWithSupabase(
      config,
      initialSession,
    );

    if (error) {
      if (
        usesStoredSession(config) &&
        isInvalidRefreshTokenMessage(error.message)
      ) {
        const recoveredSession = await tryRecoverStoredSession(config, {
          attemptedSession: initialSession,
        });
        if (recoveredSession) {
          config.authToken = recoveredSession.authToken;
          config.refreshToken =
            recoveredSession.refreshToken ?? config.refreshToken;
          return recoveredSession;
        }

        config.refreshToken = undefined;
        await persistStoredSession({
          authToken: config.authToken,
          refreshToken: undefined,
        });

        if (isExpired) {
          throw new Error(formatStoredSessionInvalidMessage(error.message));
        }

        console.warn(
          `Stored refresh token is invalid: ${error.message}. Continuing with the existing access token until it expires.`,
        );
        return null;
      }

      if (isExpired) {
        throw new Error(
          `Access token refresh failed: ${error.message}. ${LOGIN_HINT}`,
        );
      }

      // If refresh fails, continue with the original token — it may still be valid
      console.warn(`Token refresh failed: ${error.message}`);
      return null;
    }

    if (session?.authToken) {
      config.authToken = session.authToken;
      config.refreshToken = session.refreshToken ?? config.refreshToken;
      return {
        authToken: config.authToken,
        refreshToken: config.refreshToken,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes(LOGIN_HINT)) {
      throw error;
    }

    // Swallow errors — the original token may still work
  }

  return null;
}

export async function refreshResolvedAuthSession(
  config: ResolvedConfig,
): Promise<{ authToken: string; refreshToken?: string } | null> {
  const refreshedSession = await refreshAuthTokenIfNeeded(config);

  if (refreshedSession && usesStoredSession(config)) {
    await persistStoredSession(refreshedSession);
  }

  return refreshedSession;
}

async function refreshSessionWithSupabase(
  config: Pick<ResolvedConfig, "supabaseUrl" | "supabaseAnonKey">,
  session: { authToken: string; refreshToken: string },
): Promise<{
  session: { authToken: string; refreshToken?: string } | null;
  error: { message: string } | null;
}> {
  const supabase = createSupabaseClient(
    config.supabaseUrl!,
    config.supabaseAnonKey!,
  );

  const { data, error } = await supabase.auth.setSession({
    access_token: session.authToken,
    refresh_token: session.refreshToken,
  });

  if (error) {
    return { session: null, error };
  }

  if (!data.session?.access_token) {
    return { session: null, error: null };
  }

  return {
    session: {
      authToken: data.session.access_token,
      refreshToken: data.session.refresh_token ?? session.refreshToken,
    },
    error: null,
  };
}

async function tryRecoverStoredSession(
  config: Pick<ResolvedConfig, "supabaseUrl" | "supabaseAnonKey">,
  options: {
    attemptedSession: { authToken: string; refreshToken: string };
  },
): Promise<{ authToken: string; refreshToken?: string } | null> {
  const globalConfig = await loadGlobalConfig();
  const reloadedAuthToken = globalConfig.authToken;
  const reloadedRefreshToken = globalConfig.refreshToken;

  if (!reloadedAuthToken || !reloadedRefreshToken) {
    return null;
  }

  if (
    reloadedAuthToken === options.attemptedSession.authToken &&
    reloadedRefreshToken === options.attemptedSession.refreshToken
  ) {
    return null;
  }

  const { session } = await refreshSessionWithSupabase(config, {
    authToken: reloadedAuthToken,
    refreshToken: reloadedRefreshToken,
  });

  return session;
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

export function getAuthTokenExpiry(authToken: string | undefined): Date | null {
  if (!authToken) {
    return null;
  }

  const parts = authToken.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1]!, "base64url").toString("utf8"),
    ) as { exp?: unknown };
    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
      return null;
    }
    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
}

export function isInvalidRefreshTokenMessage(
  message: string | undefined,
): boolean {
  if (!message) return false;

  const normalized = message.toLowerCase();
  if (!normalized.includes("refresh token")) {
    return false;
  }

  return [
    "not found",
    "invalid",
    "expired",
    "revoked",
    "reuse",
    "already used",
  ].some((fragment) => normalized.includes(fragment));
}

export function formatStoredSessionInvalidMessage(reason?: string): string {
  const detail = reason ? ` (${reason})` : "";
  return `Stored Dreamboard session is expired or invalid${detail}. ${LOGIN_HINT}`;
}

function usesStoredSession(config: ResolvedConfig): boolean {
  return (
    config.authTokenSource === "global" &&
    config.refreshTokenSource === "global"
  );
}

async function persistStoredSession(session: {
  authToken: string;
  refreshToken?: string;
}): Promise<void> {
  const globalConfig = await loadGlobalConfig();
  await saveGlobalConfig({
    ...globalConfig,
    authToken: session.authToken,
    refreshToken: session.refreshToken,
  });
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
