import { expect, test } from "bun:test";
import { BE_CLI_OPERATIONS } from "./registry.js";

function getOperation(resource: string, action: string) {
  const operation = BE_CLI_OPERATIONS.find(
    (entry) => entry.resource === resource && entry.action === action,
  );
  if (!operation) {
    throw new Error(`Missing be-cli operation ${resource}.${action}`);
  }
  return operation;
}

test("registry exposes one representative read command per major resource group", () => {
  expect(
    getOperation("health", "check").buildRequest({ args: {}, body: undefined }),
  ).toEqual({ url: "/health" });
  expect(
    getOperation("games", "get").buildRequest({
      args: { "game-id": "game-1" },
      body: undefined,
    }),
  ).toEqual({
    path: { gameId: "game-1" },
  });
  expect(
    getOperation("rules", "latest").buildRequest({
      args: { "game-id": "game-1" },
      body: undefined,
    }),
  ).toEqual({
    path: { gameId: "game-1" },
  });
  expect(
    getOperation("manifests", "get").buildRequest({
      args: { "manifest-id": "manifest-1" },
      body: undefined,
    }),
  ).toEqual({
    path: { manifestId: "manifest-1" },
  });
  expect(
    getOperation("results", "latest").buildRequest({
      args: { "game-id": "game-1", "success-only": true },
      body: undefined,
    }),
  ).toEqual({
    path: { gameId: "game-1" },
    query: { successOnly: true },
  });
  expect(
    getOperation("sources", "get").buildRequest({
      args: { "game-id": "game-1", "result-id": "result-1" },
      body: undefined,
    }),
  ).toEqual({
    path: { gameId: "game-1" },
    query: { resultId: "result-1" },
  });
  expect(
    getOperation("sessions", "status").buildRequest({
      args: { "session-id": "session-1" },
      body: undefined,
    }),
  ).toEqual({
    path: { sessionId: "session-1" },
  });
});

test("registry exposes representative mutation commands for games and sessions", () => {
  expect(
    getOperation("games", "create").buildRequest({
      args: {},
      body: { slug: "game-1" },
    }),
  ).toEqual({
    body: { slug: "game-1" },
  });
  expect(
    getOperation("sessions", "create").buildRequest({
      args: { "game-id": "game-1" },
      body: { playerCount: 4 },
    }),
  ).toEqual({
    path: { gameId: "game-1" },
    body: { playerCount: 4 },
  });
});
