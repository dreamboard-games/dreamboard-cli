import type { IncomingMessage, ServerResponse } from "node:http";
import consola from "consola";
import type { Plugin } from "vite";
import { createPersistedDevSession } from "../utils/dev-session.js";
import { writeJsonFile } from "../utils/fs.js";
import {
  shouldRelayDevLog,
  type DevDiagnosticsLevel,
  type DevLogEnvelope,
} from "./dev-diagnostics.js";
import type { DreamboardDevRuntimeConfig } from "./dev-runtime-config.js";

export function createDevLogRelayPlugin(options: {
  sessionFilePath: string;
  runtimeConfig: DreamboardDevRuntimeConfig;
  diagnosticsLevel: DevDiagnosticsLevel;
}): Plugin {
  return {
    name: "dreamboard-dev-log-relay",
    configureServer(server) {
      server.middlewares.use("/__dreamboard_dev/log", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        const chunks: Buffer[] = [];
        req.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        req.on("end", () => {
          try {
            const body = Buffer.concat(chunks).toString("utf8");
            const payload = JSON.parse(body) as Partial<DevLogEnvelope>;
            const normalizedPayload = {
              source: coerceLogSource(payload.source),
              level: coerceLogLevel(payload.level),
              message:
                typeof payload.message === "string"
                  ? payload.message
                  : "Missing dev log message",
            } satisfies DevLogEnvelope;
            if (
              shouldRelayDevLog(options.diagnosticsLevel, normalizedPayload)
            ) {
              relayDevLog(normalizedPayload);
            }
            res.statusCode = 204;
            res.end();
          } catch (error) {
            consola.warn(
              `[dev-host] Failed to decode browser log payload: ${formatUnknown(error)}`,
            );
            res.statusCode = 400;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ error: "Invalid dev log payload" }));
          }
        });
      });

      server.middlewares.use(
        "/__dreamboard_dev/session/new",
        createNewSessionHandler({
          sessionFilePath: options.sessionFilePath,
          runtimeConfig: options.runtimeConfig,
        }),
      );
    },
  };
}

function createNewSessionHandler(options: {
  sessionFilePath: string;
  runtimeConfig: DreamboardDevRuntimeConfig;
}): (req: IncomingMessage, res: ServerResponse) => void {
  return (req, res) => {
    void handleNewSessionRequest(req, res, options);
  };
}

async function handleNewSessionRequest(
  req: IncomingMessage,
  res: ServerResponse,
  options: {
    sessionFilePath: string;
    runtimeConfig: DreamboardDevRuntimeConfig;
  },
): Promise<void> {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const body = await readJsonBody(req);
    const seed = normalizeSeed(body.seed);
    const session = await createRemoteSession({
      runtimeConfig: options.runtimeConfig,
      seed,
    });

    const persistedSession = createPersistedDevSession({
      sessionId: session.sessionId,
      shortCode: session.shortCode,
      gameId: session.gameId,
      seed,
      compiledResultId: options.runtimeConfig.compiledResultId,
      setupProfileId: options.runtimeConfig.setupProfileId ?? undefined,
    });
    await writeJsonFile(options.sessionFilePath, persistedSession);

    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        sessionId: session.sessionId,
        shortCode: session.shortCode,
        gameId: session.gameId,
        seed,
        setupProfileId: options.runtimeConfig.setupProfileId,
      }),
    );
  } catch (error) {
    res.statusCode = 400;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        error: formatUnknown(error),
      }),
    );
  }
}

async function readJsonBody(
  req: IncomingMessage,
): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => resolve());
    req.on("error", reject);
  });
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? (JSON.parse(text) as Record<string, unknown>) : {};
}

function normalizeSeed(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new Error("Seed must be a safe integer.");
  }
  return value;
}

async function createRemoteSession(options: {
  runtimeConfig: DreamboardDevRuntimeConfig;
  seed: number;
}): Promise<{ sessionId: string; shortCode: string; gameId: string }> {
  const response = await fetch(
    `${options.runtimeConfig.apiBaseUrl}/api/games/${options.runtimeConfig.gameId}/sessions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(options.runtimeConfig.authToken
          ? { Authorization: `Bearer ${options.runtimeConfig.authToken}` }
          : {}),
      },
      body: JSON.stringify({
        compiledResultId: options.runtimeConfig.compiledResultId,
        seed: options.seed,
        playerCount: options.runtimeConfig.playerCount,
        autoAssignSeats: true,
        setupProfileId: options.runtimeConfig.setupProfileId,
      }),
    },
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `Failed to create session (${response.status}): ${text || response.statusText}`,
    );
  }

  const parsed = JSON.parse(text) as Partial<{
    sessionId: string;
    shortCode: string;
    gameId: string;
  }>;
  if (!parsed.sessionId || !parsed.shortCode || !parsed.gameId) {
    throw new Error("Backend returned an incomplete session response.");
  }

  return {
    sessionId: parsed.sessionId,
    shortCode: parsed.shortCode,
    gameId: parsed.gameId,
  };
}

function relayDevLog(payload: DevLogEnvelope): void {
  const formatted = `[dev:${payload.source}] ${payload.message}`;
  switch (payload.level) {
    case "error":
      consola.error(formatted);
      break;
    case "warn":
      consola.warn(formatted);
      break;
    case "info":
      consola.info(formatted);
      break;
    default:
      consola.log(formatted);
      break;
  }
}

function coerceLogSource(value: unknown): DevLogEnvelope["source"] {
  return value === "host" || value === "plugin" || value === "sse"
    ? value
    : "host";
}

function coerceLogLevel(value: unknown): DevLogEnvelope["level"] {
  return value === "warn" ||
    value === "error" ||
    value === "info" ||
    value === "log"
    ? value
    : "log";
}

function formatUnknown(value: unknown): string {
  if (value instanceof Error) {
    return value.stack ?? value.message;
  }
  return typeof value === "string" ? value : JSON.stringify(value);
}
