import { client } from "@dreamboard/api-client/client.gen";
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
import {
  type Credentials,
  type StoredSessionSnapshot,
  getStoredSession,
} from "./credential-store.js";
import {
  PermanentRefreshError,
  classifyRefreshError,
} from "../auth/refresh-error.js";
import {
  DEFAULT_REFRESH_WINDOW_MS,
  ensureFreshAccessToken,
  getAccessTokenExpiry,
} from "../auth/refresh-coordinator.js";

const LOGIN_HINT = "Run `dreamboard login` to authenticate again.";

export type CredentialSnapshot = {
  accessToken?: string;
  refreshToken?: string;
  authTokenSource: ResolvedConfig["authTokenSource"];
  refreshTokenSource: ResolvedConfig["refreshTokenSource"];
};

/**
 * Resolve the effective CLI config for this invocation.
 *
 * `resolveConfig` is pure and synchronous: it takes pre-loaded inputs
 * (global config, flags, optional project config, optional credential
 * snapshot) and assembles a read-only `ResolvedConfig`. It intentionally
 * does not touch disk or the network - refreshing/persisting credentials
 * is the job of `configureClient` + `RefreshCoordinator`.
 *
 * Passing `credentials = undefined` is equivalent to "no stored session
 * for this call", used by contexts that should never inherit the local
 * session (e.g. `dreamboard login` before the browser flow).
 */
export function resolveConfig(
  globalConfig: GlobalConfig,
  flags: ConfigFlags,
  project?: ProjectConfig,
  credentials?: StoredSessionSnapshot | null,
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

  const snapshot = buildCredentialSnapshot(flags, credentials);

  return {
    apiBaseUrl,
    webBaseUrl,
    supabaseUrl,
    supabaseAnonKey,
    authToken: snapshot.accessToken,
    refreshToken: snapshot.refreshToken,
    authTokenSource: snapshot.authTokenSource,
    refreshTokenSource: snapshot.refreshTokenSource,
  };
}

function buildCredentialSnapshot(
  flags: ConfigFlags,
  storedCredentials?: StoredSessionSnapshot | null,
): CredentialSnapshot {
  const flagToken = valueOrUndefined(flags.token);
  const envToken = valueOrUndefined(process.env.DREAMBOARD_TOKEN);
  const envRefreshToken = valueOrUndefined(
    process.env.DREAMBOARD_REFRESH_TOKEN,
  );

  if (IS_PUBLISHED_BUILD) {
    const stored = storedCredentials ?? null;
    return {
      accessToken: stored?.accessToken,
      refreshToken: stored?.refreshToken,
      authTokenSource: stored?.accessToken ? "global" : "none",
      refreshTokenSource: stored?.refreshToken ? "global" : "none",
    };
  }

  const accessToken = flagToken || envToken || storedCredentials?.accessToken;
  const refreshToken = envRefreshToken || storedCredentials?.refreshToken;

  const authTokenSource: ResolvedConfig["authTokenSource"] = flagToken
    ? "flag"
    : envToken
      ? "env"
      : storedCredentials?.accessToken
        ? "global"
        : "none";

  const refreshTokenSource: ResolvedConfig["refreshTokenSource"] =
    envRefreshToken
      ? "env"
      : storedCredentials?.refreshToken
        ? "global"
        : "none";

  return {
    accessToken,
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
 * Configure the API client for the resolved environment, refreshing the
 * stored Supabase session first if it is close to expiry.
 *
 * The refresh path never mutates `config`. It goes through
 * `RefreshCoordinator`, which owns the cross-process lock and the
 * CredentialStore writes. After a successful rotation the HTTP client
 * is configured with the rotated access token; on transient failures we
 * fall back to the `config.authToken` snapshot (which is why commands
 * still see a bearer header and can surface the original error).
 */
export async function configureClient(config: ResolvedConfig): Promise<void> {
  const effectiveAccessToken = await ensureEffectiveAccessToken(config);

  client.setConfig({
    baseUrl: config.apiBaseUrl,
    headers: effectiveAccessToken
      ? { Authorization: `Bearer ${effectiveAccessToken}` }
      : {},
  });
}

async function ensureEffectiveAccessToken(
  config: ResolvedConfig,
): Promise<string | undefined> {
  if (!usesStoredSession(config)) {
    // Env/flag-provided tokens are not owned by CredentialStore and must
    // not be written back. Use them as-is.
    return config.authToken;
  }

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return config.authToken;
  }

  try {
    const result = await ensureFreshAccessToken({
      supabaseUrl: config.supabaseUrl,
      supabaseAnonKey: config.supabaseAnonKey,
      refreshWindowMs: DEFAULT_REFRESH_WINDOW_MS,
    });
    switch (result.kind) {
      case "missing":
        return config.authToken;
      case "unchanged":
      case "rotated":
        return result.credentials.accessToken;
      case "transient_failure": {
        const expiry = getAccessTokenExpiry(config.authToken);
        const isExpired = expiry !== null && expiry.getTime() <= Date.now();
        if (isExpired) {
          throw new Error(
            `Access token refresh failed: ${result.message}. ${LOGIN_HINT}`,
          );
        }
        console.warn(
          `Token refresh failed: ${result.message}. Continuing with the existing access token until it expires.`,
        );
        return config.authToken;
      }
    }
  } catch (error) {
    if (error instanceof PermanentRefreshError) {
      throw new Error(formatStoredSessionInvalidMessage(error.message));
    }
    throw error;
  }
}

/**
 * Explicit "force a refresh attempt right now" entrypoint used by
 * `dreamboard auth status`. Returns the resulting credentials or throws
 * a classified error.
 */
export async function refreshResolvedAuthSession(
  config: ResolvedConfig,
): Promise<Credentials | null> {
  if (!usesStoredSession(config)) return null;
  if (!config.supabaseUrl || !config.supabaseAnonKey) return null;
  try {
    const result = await ensureFreshAccessToken({
      supabaseUrl: config.supabaseUrl,
      supabaseAnonKey: config.supabaseAnonKey,
    });
    switch (result.kind) {
      case "missing":
        return null;
      case "unchanged":
      case "rotated":
        return result.credentials;
      case "transient_failure":
        return result.credentials;
    }
  } catch (error) {
    if (error instanceof PermanentRefreshError) {
      throw new Error(formatStoredSessionInvalidMessage(error.message));
    }
    throw error;
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

export { getAccessTokenExpiry as getAuthTokenExpiry } from "../auth/refresh-coordinator.js";

/**
 * Compatibility helper retained for `dreamboard auth status` / tests.
 * Returns true iff the error looks like a permanent refresh-token
 * invalidation. Prefer `classifyRefreshError` for new call sites.
 */
export function isInvalidRefreshTokenMessage(
  message: string | undefined,
): boolean {
  if (!message) return false;
  return classifyRefreshError({ message }).kind === "permanent_invalid";
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

/**
 * Common init pattern used by pull, push, status, update, run commands:
 * find project root, load config, resolve config, require auth,
 * configure client.
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
  const [globalConfig, credentials] = await Promise.all([
    loadGlobalConfig(),
    getStoredSession(),
  ]);
  const config = resolveConfig(globalConfig, flags, projectConfig, credentials);

  if (opts?.requireAuth !== false) {
    requireAuth(config);
    await configureClient(config);
  }

  return { projectRoot, projectConfig, config };
}
