/**
 * Reverse-proxy plugin for the `dreamboard dev` Vite server.
 *
 * Every `/api/*` request the browser makes is intercepted here, run
 * through `ensureFreshAccessToken` so the CLI's stored Supabase session
 * is refreshed when needed, and forwarded to the configured upstream
 * backend with an `Authorization: Bearer <fresh-token>` header injected
 * on the wire. The access and refresh tokens never reach the browser.
 *
 * Failure contract:
 * - Permanent refresh failure (stored refresh token invalid) responds
 *   with `401 { error: "session_invalid", message }` so the browser can
 *   show a "Run dreamboard login" overlay instead of surfacing a
 *   confusing upstream 401.
 * - Transient refresh failure (network blip) falls back to the snapshot
 *   access token in `ResolvedConfig` when we still have one - this lets
 *   a short outage degrade to "existing token" behavior instead of
 *   blocking the iframe outright.
 * - Upstream connection failure responds with `502 { error:
 *   "upstream_unavailable", message }`.
 *
 * The proxy is deliberately unaware of the session file / persist
 * endpoint / log relay; those live in `dev-log-relay-plugin.ts`.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import consola from "consola";
import httpProxy from "http-proxy";
import type { Plugin } from "vite";
import {
  DEFAULT_REFRESH_WINDOW_MS,
  ensureFreshAccessToken,
} from "../auth/refresh-coordinator.js";
import { PermanentRefreshError } from "../auth/refresh-error.js";
import type { ResolvedConfig } from "../types.js";

export type ResolvedBearerOk = {
  readonly kind: "ok";
  readonly token: string | null;
};
export type ResolvedBearerPermanentFailure = {
  readonly kind: "permanent_invalid";
  readonly message: string;
};
export type ResolvedBearer = ResolvedBearerOk | ResolvedBearerPermanentFailure;

export interface DevApiProxyPluginDeps {
  /**
   * Hook point for tests: resolve the bearer token (or a permanent
   * failure) synchronously once per request.
   */
  resolveBearer?: (config: ResolvedConfig) => Promise<ResolvedBearer>;
  /**
   * Hook point for tests: construct the underlying proxy. Allows
   * injecting an in-memory proxy that talks to a fake upstream.
   */
  createProxy?: (target: string) => httpProxy;
}

export function createDevApiProxyPlugin(options: {
  config: ResolvedConfig;
  deps?: DevApiProxyPluginDeps;
}): Plugin {
  const { config, deps } = options;
  const target = config.apiBaseUrl;

  return {
    name: "dreamboard-dev-api-proxy",
    configureServer(server) {
      const createProxy =
        deps?.createProxy ??
        ((proxyTarget: string) =>
          httpProxy.createProxyServer({
            target: proxyTarget,
            changeOrigin: true,
            xfwd: true,
            // SSE responses must not be buffered; http-proxy streams by
            // default, but we also disable body parsing upstream.
            selfHandleResponse: false,
          }));

      const proxy = createProxy(target);

      proxy.on("error", (err, _req, res) => {
        consola.debug(`[dev-proxy] upstream error: ${formatUnknown(err)}`);
        if (res instanceof Object && "writeHead" in res && !res.headersSent) {
          respondUpstreamUnavailable(res as ServerResponse, err);
        } else if (res && "destroy" in res) {
          (res as { destroy: () => void }).destroy();
        }
      });

      const resolveBearer = deps?.resolveBearer ?? resolveDevBearer;

      // NOTE: we intentionally do NOT mount this middleware on `/api`.
      // Connect-style `middlewares.use(path, handler)` strips the mount
      // prefix from `req.url` before invoking the handler, which would
      // cause the proxy to forward `/sessions/.../status` instead of
      // `/api/sessions/.../status` and the backend would respond 404.
      // Filtering inside the handler keeps the full path intact.
      server.middlewares.use((req, res, next) => {
        if (!req.url || !isApiRequest(req.url)) {
          next();
          return;
        }
        void handleApiRequest({ req, res, config, proxy, resolveBearer });
      });

      server.httpServer?.once("close", () => {
        proxy.close();
      });
    },
  };
}

async function handleApiRequest(options: {
  req: IncomingMessage;
  res: ServerResponse;
  config: ResolvedConfig;
  proxy: httpProxy;
  resolveBearer: (config: ResolvedConfig) => Promise<ResolvedBearer>;
}): Promise<void> {
  const { req, res, config, proxy, resolveBearer } = options;
  try {
    const bearer = await resolveBearer(config);
    if (bearer.kind === "permanent_invalid") {
      respondSessionInvalid(res, bearer.message);
      return;
    }

    if (bearer.token) {
      req.headers.authorization = `Bearer ${bearer.token}`;
    } else {
      delete req.headers.authorization;
    }

    proxy.web(req, res, {}, (err) => {
      if (!err) return;
      consola.debug(`[dev-proxy] forward error: ${formatUnknown(err)}`);
      if (!res.headersSent) {
        respondUpstreamUnavailable(res, err);
      }
    });
  } catch (err) {
    consola.debug(`[dev-proxy] pre-forward error: ${formatUnknown(err)}`);
    respondRefreshFailed(res, err);
  }
}

export async function resolveDevBearer(
  config: ResolvedConfig,
): Promise<ResolvedBearer> {
  // Env/flag-provided tokens are not owned by `CredentialStore` and must
  // not be rotated. Forward them as-is.
  if (!usesStoredSession(config)) {
    return { kind: "ok", token: config.authToken ?? null };
  }

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return { kind: "ok", token: config.authToken ?? null };
  }

  try {
    const result = await ensureFreshAccessToken({
      supabaseUrl: config.supabaseUrl,
      supabaseAnonKey: config.supabaseAnonKey,
      refreshWindowMs: DEFAULT_REFRESH_WINDOW_MS,
    });
    switch (result.kind) {
      case "missing":
        return { kind: "ok", token: config.authToken ?? null };
      case "unchanged":
      case "rotated":
        return { kind: "ok", token: result.credentials.accessToken };
      case "transient_failure":
        return { kind: "ok", token: config.authToken ?? null };
    }
  } catch (err) {
    if (err instanceof PermanentRefreshError) {
      return { kind: "permanent_invalid", message: err.message };
    }
    throw err;
  }
}

function usesStoredSession(config: ResolvedConfig): boolean {
  return (
    config.authTokenSource === "global" &&
    config.refreshTokenSource === "global"
  );
}

function respondSessionInvalid(res: ServerResponse, message: string): void {
  if (res.headersSent) return;
  res.statusCode = 401;
  res.setHeader("content-type", "application/json");
  res.end(
    JSON.stringify({
      error: "session_invalid",
      message,
    }),
  );
}

function respondUpstreamUnavailable(res: ServerResponse, error: unknown): void {
  if (res.headersSent) return;
  res.statusCode = 502;
  res.setHeader("content-type", "application/json");
  res.end(
    JSON.stringify({
      error: "upstream_unavailable",
      message: formatUnknown(error),
    }),
  );
}

function respondRefreshFailed(res: ServerResponse, error: unknown): void {
  if (res.headersSent) return;
  res.statusCode = 502;
  res.setHeader("content-type", "application/json");
  res.end(
    JSON.stringify({
      error: "refresh_failed",
      message: formatUnknown(error),
    }),
  );
}

function isApiRequest(url: string): boolean {
  return url === "/api" || url.startsWith("/api/") || url.startsWith("/api?");
}

function formatUnknown(value: unknown): string {
  if (value instanceof Error) {
    return value.message || value.name || "Unknown error";
  }
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
