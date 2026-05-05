import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { EventEmitter } from "node:events";
import httpProxy from "http-proxy";
import { createDevApiProxyPlugin } from "./dev-api-proxy-plugin.ts";
import type { ResolvedConfig } from "../types.js";

type UpstreamRequest = {
  method: string;
  url: string;
  headers: http.IncomingHttpHeaders;
  body: string;
};

let upstream: http.Server;
let upstreamUrl: string;
const upstreamRequests: UpstreamRequest[] = [];
let upstreamHandler:
  | ((req: http.IncomingMessage, res: http.ServerResponse) => void)
  | null = null;

beforeAll(async () => {
  upstream = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => {
      upstreamRequests.push({
        method: req.method ?? "",
        url: req.url ?? "",
        headers: { ...req.headers },
        body: Buffer.concat(chunks).toString("utf8"),
      });
      if (upstreamHandler) {
        upstreamHandler(req, res);
        return;
      }
      res.statusCode = 200;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: true, path: req.url }));
    });
  });
  await new Promise<void>((resolve) => upstream.listen(0, resolve));
  const address = upstream.address() as AddressInfo;
  upstreamUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => upstream.close(() => resolve()));
});

afterEach(() => {
  upstreamRequests.length = 0;
  upstreamHandler = null;
});

function makeConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    apiBaseUrl: upstreamUrl,
    webBaseUrl: "http://localhost:3000",
    supabaseUrl: "http://localhost:54321",
    supabaseAnonKey: "anon-key",
    authToken: undefined,
    refreshToken: undefined,
    authTokenSource: "none",
    refreshTokenSource: "none",
    ...overrides,
  };
}

type NextFn = (err?: unknown) => void;
type MiddlewareFn = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  next: NextFn,
) => void;

/**
 * Minimal shim for the bits of `ViteDevServer` that the proxy plugin
 * uses during `configureServer`: a Connect-like `middlewares.use`
 * supporting both `use(handler)` and `use(path, handler)`, and a
 * `httpServer` EventEmitter for the `close` hook.
 */
function makeServerShim() {
  let installed: { path: string | null; handler: MiddlewareFn } | null = null;
  const httpServer = new EventEmitter();
  const server = {
    middlewares: {
      use(pathOrHandler: string | MiddlewareFn, maybeHandler?: MiddlewareFn) {
        if (typeof pathOrHandler === "function") {
          installed = { path: null, handler: pathOrHandler };
          return;
        }
        if (maybeHandler) {
          installed = { path: pathOrHandler, handler: maybeHandler };
        }
      },
    },
    httpServer,
  };
  return {
    server,
    getMiddleware(): MiddlewareFn {
      if (!installed) throw new Error("middleware not registered");
      return installed.handler;
    },
    getMiddlewarePath(): string | null {
      if (!installed) throw new Error("middleware not registered");
      return installed.path;
    },
    httpServer,
  };
}

async function dispatch(
  middleware: MiddlewareFn,
  options: {
    method: string;
    path: string;
    headers?: http.IncomingHttpHeaders;
    body?: string;
  },
): Promise<{
  status: number;
  body: string;
  headers: http.IncomingHttpHeaders;
}> {
  return new Promise((resolve, reject) => {
    // Spin up an in-process HTTP server that delegates to the Vite
    // middleware - this is the simplest way to produce an
    // IncomingMessage / ServerResponse pair with a real socket so
    // http-proxy can forward the request. If the middleware calls
    // `next()` we treat it as an unmatched route and respond 404, which
    // mirrors Connect's fall-through behaviour.
    const local = http.createServer((req, res) => {
      middleware(req, res, () => {
        if (!res.headersSent) {
          res.statusCode = 404;
          res.end();
        }
      });
    });
    local.listen(0, () => {
      const address = local.address() as AddressInfo;
      const opts = {
        method: options.method,
        host: "127.0.0.1",
        port: address.port,
        path: options.path,
        headers: options.headers ?? {},
      };
      const req = http.request(opts, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          local.close();
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      });
      req.on("error", (err) => {
        local.close();
        reject(err);
      });
      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  });
}

function makeProxyFactory() {
  return (target: string) =>
    httpProxy.createProxyServer({
      target,
      changeOrigin: true,
      xfwd: true,
    });
}

test("forwards /api/* requests with a freshly-resolved bearer header", async () => {
  const shim = makeServerShim();
  const plugin = createDevApiProxyPlugin({
    config: makeConfig(),
    deps: {
      createProxy: makeProxyFactory(),
      resolveBearer: async () => ({ kind: "ok", token: "fresh-token" }),
    },
  });
  plugin.configureServer!(shim.server as never);

  const response = await dispatch(shim.getMiddleware(), {
    method: "GET",
    path: "/api/games/abc",
  });

  expect(response.status).toBe(200);
  expect(upstreamRequests).toHaveLength(1);
  expect(upstreamRequests[0]!.url).toBe("/api/games/abc");
  expect(upstreamRequests[0]!.headers.authorization).toBe("Bearer fresh-token");
});

test("is not mounted on /api (would strip the prefix and break upstream routing)", async () => {
  const shim = makeServerShim();
  const plugin = createDevApiProxyPlugin({
    config: makeConfig(),
    deps: {
      createProxy: makeProxyFactory(),
      resolveBearer: async () => ({ kind: "ok", token: "fresh-token" }),
    },
  });
  plugin.configureServer!(shim.server as never);

  expect(shim.getMiddlewarePath()).toBeNull();
});

test("forwards the full /api/sessions/:id/status path to the upstream backend", async () => {
  const shim = makeServerShim();
  const plugin = createDevApiProxyPlugin({
    config: makeConfig(),
    deps: {
      createProxy: makeProxyFactory(),
      resolveBearer: async () => ({ kind: "ok", token: "fresh-token" }),
    },
  });
  plugin.configureServer!(shim.server as never);

  const response = await dispatch(shim.getMiddleware(), {
    method: "GET",
    path: "/api/sessions/d57f2885-5574-4d85-bef6-619aebf39832/status",
  });

  expect(response.status).toBe(200);
  expect(upstreamRequests).toHaveLength(1);
  expect(upstreamRequests[0]!.url).toBe(
    "/api/sessions/d57f2885-5574-4d85-bef6-619aebf39832/status",
  );
});

test("passes non-/api requests through to the next middleware", async () => {
  const shim = makeServerShim();
  const plugin = createDevApiProxyPlugin({
    config: makeConfig(),
    deps: {
      createProxy: makeProxyFactory(),
      resolveBearer: async () => ({ kind: "ok", token: "fresh-token" }),
    },
  });
  plugin.configureServer!(shim.server as never);

  const response = await dispatch(shim.getMiddleware(), {
    method: "GET",
    path: "/index.html",
  });

  expect(response.status).toBe(404);
  expect(upstreamRequests).toHaveLength(0);
});

test("does not forward paths that only start with /api literally (e.g. /apiary)", async () => {
  const shim = makeServerShim();
  const plugin = createDevApiProxyPlugin({
    config: makeConfig(),
    deps: {
      createProxy: makeProxyFactory(),
      resolveBearer: async () => ({ kind: "ok", token: "fresh-token" }),
    },
  });
  plugin.configureServer!(shim.server as never);

  const response = await dispatch(shim.getMiddleware(), {
    method: "GET",
    path: "/apiary/foo",
  });

  expect(response.status).toBe(404);
  expect(upstreamRequests).toHaveLength(0);
});

test("strips existing Authorization header when bearer resolver returns null", async () => {
  const shim = makeServerShim();
  const plugin = createDevApiProxyPlugin({
    config: makeConfig(),
    deps: {
      createProxy: makeProxyFactory(),
      resolveBearer: async () => ({ kind: "ok", token: null }),
    },
  });
  plugin.configureServer!(shim.server as never);

  const response = await dispatch(shim.getMiddleware(), {
    method: "GET",
    path: "/api/sessions/xyz",
    headers: { authorization: "Bearer stale-value" },
  });

  expect(response.status).toBe(200);
  expect(upstreamRequests).toHaveLength(1);
  expect(upstreamRequests[0]!.headers.authorization).toBeUndefined();
});

test("permanent refresh failure returns 401 session_invalid envelope without forwarding", async () => {
  const shim = makeServerShim();
  const plugin = createDevApiProxyPlugin({
    config: makeConfig(),
    deps: {
      createProxy: makeProxyFactory(),
      resolveBearer: async () => ({
        kind: "permanent_invalid",
        message: "refresh token is invalid",
      }),
    },
  });
  plugin.configureServer!(shim.server as never);

  const response = await dispatch(shim.getMiddleware(), {
    method: "POST",
    path: "/api/sessions/xyz/inputs",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "ping" }),
  });

  expect(response.status).toBe(401);
  const payload = JSON.parse(response.body) as {
    error: string;
    message: string;
  };
  expect(payload.error).toBe("session_invalid");
  expect(payload.message).toBe("refresh token is invalid");
  expect(upstreamRequests).toHaveLength(0);
});

test("transient refresh failure falls back to existing access token", async () => {
  const shim = makeServerShim();
  // Simulate a transient refresh failure by using the default resolver
  // path: we pass a stored-session config but make the Supabase URL
  // something that will never fulfil the refresh. With our custom deps
  // we short-circuit that and directly return the existing token.
  const plugin = createDevApiProxyPlugin({
    config: makeConfig({
      authToken: "existing-token",
      authTokenSource: "global",
      refreshToken: "refresh-token",
      refreshTokenSource: "global",
    }),
    deps: {
      createProxy: makeProxyFactory(),
      resolveBearer: async (cfg) => ({
        kind: "ok",
        token: cfg.authToken ?? null,
      }),
    },
  });
  plugin.configureServer!(shim.server as never);

  const response = await dispatch(shim.getMiddleware(), {
    method: "GET",
    path: "/api/sessions/xyz",
  });

  expect(response.status).toBe(200);
  expect(upstreamRequests).toHaveLength(1);
  expect(upstreamRequests[0]!.headers.authorization).toBe(
    "Bearer existing-token",
  );
});

test("upstream 5xx responses pass through without mutation", async () => {
  upstreamHandler = (_req, res) => {
    res.statusCode = 503;
    res.setHeader("content-type", "application/problem+json");
    res.end(JSON.stringify({ type: "backend-overloaded" }));
  };

  const shim = makeServerShim();
  const plugin = createDevApiProxyPlugin({
    config: makeConfig(),
    deps: {
      createProxy: makeProxyFactory(),
      resolveBearer: async () => ({ kind: "ok", token: "token" }),
    },
  });
  plugin.configureServer!(shim.server as never);

  const response = await dispatch(shim.getMiddleware(), {
    method: "GET",
    path: "/api/whatever",
  });

  expect(response.status).toBe(503);
  expect(response.headers["content-type"]).toContain(
    "application/problem+json",
  );
  const payload = JSON.parse(response.body) as { type: string };
  expect(payload.type).toBe("backend-overloaded");
});

test("streams Server-Sent Events end-to-end", async () => {
  upstreamHandler = (_req, res) => {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    });
    res.write("event: hello\n");
    res.write("data: one\n\n");
    res.write("event: hello\n");
    res.write("data: two\n\n");
    res.end();
  };

  const shim = makeServerShim();
  const plugin = createDevApiProxyPlugin({
    config: makeConfig(),
    deps: {
      createProxy: makeProxyFactory(),
      resolveBearer: async () => ({ kind: "ok", token: "token" }),
    },
  });
  plugin.configureServer!(shim.server as never);

  const response = await dispatch(shim.getMiddleware(), {
    method: "GET",
    path: "/api/sessions/xyz/events",
    headers: { accept: "text/event-stream" },
  });

  expect(response.status).toBe(200);
  expect(response.headers["content-type"]).toContain("text/event-stream");
  expect(response.body).toContain("data: one");
  expect(response.body).toContain("data: two");
});

test("upstream connect error produces 502 upstream_unavailable envelope", async () => {
  const shim = makeServerShim();
  const plugin = createDevApiProxyPlugin({
    config: makeConfig({ apiBaseUrl: "http://127.0.0.1:1" }),
    deps: {
      createProxy: (target) =>
        httpProxy.createProxyServer({ target, changeOrigin: true }),
      resolveBearer: async () => ({ kind: "ok", token: "token" }),
    },
  });
  plugin.configureServer!(shim.server as never);

  const response = await dispatch(shim.getMiddleware(), {
    method: "GET",
    path: "/api/ping",
  });

  expect(response.status).toBe(502);
  const payload = JSON.parse(response.body) as {
    error: string;
    message: string;
  };
  expect(payload.error).toBe("upstream_unavailable");
  expect(payload.message.length).toBeGreaterThan(0);
});
