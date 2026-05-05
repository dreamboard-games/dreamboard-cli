import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ResolvedConfig } from "../types.js";
import {
  createBootstrapSessionHandler,
  createNewSessionHandler,
  createStartSessionHandler,
} from "./dev-log-relay-plugin.ts";

const runtimeConfig = {
  apiBaseUrl: "http://127.0.0.1:8080",
  userId: "user-1",
  gameId: "game-1",
  compiledResultId: "compiled-1",
  setupProfileId: null,
  playerCount: 4,
  debug: false,
  slug: "test-game",
  autoStartGame: false,
  initialSession: {
    sessionId: "fallback-session",
    shortCode: "FALL",
    gameId: "game-1",
    seed: 1337,
  },
} as const;

const config = {
  apiBaseUrl: "http://api.local",
  webBaseUrl: "http://web.local",
  authToken: "dev-token",
} satisfies ResolvedConfig;

const originalFetch = globalThis.fetch;
let tempRoot = "";
let sessionFilePath = "";
let fetchMock: ReturnType<typeof mock>;

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(tmpdir(), "dreamboard-dev-log-relay-"));
  sessionFilePath = path.join(tempRoot, "session.json");
  fetchMock = mock(handleBackendFetch);
  globalThis.fetch = fetchMock as typeof fetch;
});

afterEach(async () => {
  globalThis.fetch = originalFetch;
  await rm(tempRoot, { recursive: true, force: true });
});

test("bootstrap hydrates from the invocation session before opening streams", async () => {
  const handler = createBootstrapSessionHandler({
    sessionFilePath,
    runtimeConfig,
    config,
  });

  const response = await invokeHandler(handler, "GET");

  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.body)).toEqual(
    expect.objectContaining({
      session: expect.objectContaining({
        sessionId: "fallback-session",
        seed: 1337,
      }),
    }),
  );
  expect(fetchMock).toHaveBeenCalledWith(
    "http://api.local/api/sessions/fallback-session/bootstrap",
    expect.objectContaining({
      method: "GET",
      headers: { authorization: "Bearer dev-token" },
    }),
  );
});

test("bootstrap forwards requested player id to the backend", async () => {
  const handler = createBootstrapSessionHandler({
    sessionFilePath,
    runtimeConfig,
    config,
  });

  const response = await invokeHandler(
    handler,
    "GET",
    undefined,
    "/__dreamboard_dev/session/bootstrap?playerId=player-2",
  );

  expect(response.statusCode).toBe(200);
  expect(fetchMock).toHaveBeenCalledWith(
    "http://api.local/api/sessions/fallback-session/bootstrap?playerId=player-2",
    expect.objectContaining({
      method: "GET",
      headers: { authorization: "Bearer dev-token" },
    }),
  );
});

test("bootstrap preserves requested player id after local auto-start", async () => {
  const handler = createBootstrapSessionHandler({
    sessionFilePath,
    runtimeConfig: {
      ...runtimeConfig,
      autoStartGame: true,
    },
    config,
  });

  const response = await invokeHandler(
    handler,
    "GET",
    undefined,
    "/__dreamboard_dev/session/bootstrap?playerId=player-2",
  );

  expect(response.statusCode).toBe(200);
  expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
    "http://api.local/api/sessions/fallback-session/bootstrap?playerId=player-2",
    "http://api.local/api/sessions/fallback-session/start",
    "http://api.local/api/sessions/fallback-session/bootstrap?playerId=player-2",
  ]);
});

test("new-session creates, auto-starts, persists, and returns a bootstrap", async () => {
  const handler = createNewSessionHandler({
    sessionFilePath,
    runtimeConfig: {
      ...runtimeConfig,
      autoStartGame: true,
    },
    config,
  });

  const response = await invokeHandler(handler, "POST", { seed: 42 });

  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.body)).toEqual(
    expect.objectContaining({
      session: expect.objectContaining({
        sessionId: "fresh-session",
        phase: "gameplay",
        seed: 42,
      }),
      selectedPlayerId: "player-1",
      gameplay: expect.objectContaining({ playerId: "player-1" }),
    }),
  );
  expect(JSON.parse(await readFile(sessionFilePath, "utf8"))).toEqual({
    sessionId: "fresh-session",
  });
});

test("start-session reads the persisted pointer and returns the started bootstrap", async () => {
  await writeFile(sessionFilePath, '{"sessionId":"fallback-session"}', "utf8");
  const handler = createStartSessionHandler({
    sessionFilePath,
    runtimeConfig,
    config,
  });

  const response = await invokeHandler(handler, "POST");

  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.body)).toEqual(
    expect.objectContaining({
      session: expect.objectContaining({
        sessionId: "fallback-session",
        phase: "gameplay",
        seed: null,
      }),
      selectedPlayerId: "player-1",
    }),
  );
  expect(JSON.parse(await readFile(sessionFilePath, "utf8"))).toEqual({
    sessionId: "fallback-session",
  });
});

test("bootstrap rejects corrupt session pointers", async () => {
  await writeFile(sessionFilePath, '{"sessionId":42}', "utf8");
  const handler = createBootstrapSessionHandler({
    sessionFilePath,
    runtimeConfig,
    config,
  });

  const response = await invokeHandler(handler, "GET");

  expect(response.statusCode).toBe(500);
  expect(JSON.parse(response.body)).toEqual(
    expect.objectContaining({
      error: expect.stringContaining("valid session pointer"),
    }),
  );
});

async function handleBackendFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = String(input);
  if (url === "http://api.local/api/games/game-1/sessions") {
    return Response.json(
      {
        sessionId: "fresh-session",
        shortCode: "FRESH",
        gameId: "game-1",
      },
      { status: 201 },
    );
  }
  if (new URL(url).pathname.endsWith("/bootstrap")) {
    const sessionId = url.includes("fresh-session")
      ? "fresh-session"
      : "fallback-session";
    return Response.json(createBootstrap(sessionId, "lobby"), { status: 200 });
  }
  if (url.endsWith("/start")) {
    const sessionId = url.includes("fresh-session")
      ? "fresh-session"
      : "fallback-session";
    return Response.json(createBootstrap(sessionId, "gameplay"), {
      status: 200,
    });
  }
  return Response.json({ error: `Unexpected request ${url}` }, { status: 404 });
}

function createBootstrap(sessionId: string, phase: "lobby" | "gameplay") {
  return {
    session: {
      sessionId,
      shortCode: sessionId === "fresh-session" ? "FRESH" : "FALL",
      gameId: "game-1",
      hostUserId: "user-1",
      status: "active",
      phase,
      setupProfileId: null,
    },
    lobby: {
      seats: [
        {
          playerId: "player-1",
          controllerUserId: "user-1",
          displayName: "Player 1",
        },
      ],
      canStart: true,
      hostUserId: "user-1",
    },
    control: { switchablePlayerIds: ["player-1"] },
    history: null,
    selectedPlayerId: phase === "gameplay" ? "player-1" : null,
    gameplay:
      phase === "gameplay"
        ? {
            version: 1,
            actionSetVersion: "1:test",
            playerId: "player-1",
            activePlayers: ["player-1"],
            currentPhase: "main",
            currentStage: "turn",
            stageSeats: ["player-1"],
            view: '{"board":{}}',
            availableInteractions: [],
            zones: {},
          }
        : null,
  };
}

async function invokeHandler(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
  method: string,
  body?: Record<string, unknown>,
  url = "/__dreamboard_dev/session/bootstrap",
): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}> {
  const req = Readable.from(
    body ? [JSON.stringify(body)] : [],
  ) as IncomingMessage;
  req.method = method;
  req.url = url;

  return new Promise((resolve) => {
    const headers: Record<string, string> = {};
    let responseBody = "";
    const res = {
      statusCode: 200,
      setHeader(name: string, value: string) {
        headers[name.toLowerCase()] = value;
      },
      end(chunk?: string) {
        responseBody = chunk ?? "";
        resolve({
          statusCode: this.statusCode,
          headers,
          body: responseBody,
        });
      },
    } as unknown as ServerResponse;

    handler(req, res);
  });
}
