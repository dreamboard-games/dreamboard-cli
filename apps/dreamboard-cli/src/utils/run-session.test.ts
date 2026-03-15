import { describe, expect, test } from "bun:test";

import { createPersistedRunSession, parseRunSeed } from "./run-session.js";

describe("parseRunSeed", () => {
  test("returns the default seed when omitted", () => {
    expect(parseRunSeed(undefined)).toBe(1337);
  });

  test("accepts safe signed 64-bit integers", () => {
    expect(parseRunSeed("42")).toBe(42);
    expect(parseRunSeed(String(Number.MIN_SAFE_INTEGER))).toBe(
      Number.MIN_SAFE_INTEGER,
    );
    expect(parseRunSeed(String(Number.MAX_SAFE_INTEGER))).toBe(
      Number.MAX_SAFE_INTEGER,
    );
  });

  test("rejects invalid seed values", () => {
    expect(() => parseRunSeed("abc")).toThrow("seed must be an integer");
    expect(() => parseRunSeed("9007199254740992")).toThrow(
      "seed must be within JavaScript safe integer range",
    );
  });
});

describe("createPersistedRunSession", () => {
  test("creates the shared persisted session shape with default counters", () => {
    expect(
      createPersistedRunSession({
        sessionId: "session-1",
        shortCode: "swift-falcon-73",
        gameId: "game-1",
        seed: 42,
        compiledResultId: "compiled-result-1",
        createdAt: "2026-03-16T00:00:00.000Z",
      }),
    ).toEqual({
      sessionId: "session-1",
      shortCode: "swift-falcon-73",
      gameId: "game-1",
      seed: 42,
      compiledResultId: "compiled-result-1",
      createdAt: "2026-03-16T00:00:00.000Z",
      controllablePlayerIds: [],
      yourTurnCount: 0,
    });
  });
});
