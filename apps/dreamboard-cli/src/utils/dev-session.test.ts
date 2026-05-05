import { describe, expect, test } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createPersistedDevSession,
  generateRandomDevSeed,
  loadPersistedDevSession,
  parseOptionalDevSeed,
  parseDevSeed,
} from "./dev-session.js";

describe("parseDevSeed", () => {
  test("returns the default seed when omitted", () => {
    expect(parseDevSeed(undefined)).toBe(1337);
  });

  test("accepts safe signed 64-bit integers", () => {
    expect(parseDevSeed("42")).toBe(42);
    expect(parseDevSeed(String(Number.MIN_SAFE_INTEGER))).toBe(
      Number.MIN_SAFE_INTEGER,
    );
    expect(parseDevSeed(String(Number.MAX_SAFE_INTEGER))).toBe(
      Number.MAX_SAFE_INTEGER,
    );
  });

  test("rejects invalid seed values", () => {
    expect(() => parseDevSeed("abc")).toThrow("seed must be an integer");
    expect(() => parseDevSeed("9007199254740992")).toThrow(
      "seed must be within JavaScript safe integer range",
    );
  });
});

describe("parseOptionalDevSeed", () => {
  test("returns undefined when omitted", () => {
    expect(parseOptionalDevSeed(undefined)).toBeUndefined();
    expect(parseOptionalDevSeed("   ")).toBeUndefined();
  });
});

describe("generateRandomDevSeed", () => {
  test("returns a safe integer seed within the accepted range", () => {
    const seed = generateRandomDevSeed();

    expect(Number.isSafeInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(2_147_483_648);
  });
});

describe("createPersistedDevSession", () => {
  test("creates the shared persisted session pointer", () => {
    expect(
      createPersistedDevSession({
        sessionId: "session-1",
      }),
    ).toEqual({
      sessionId: "session-1",
    });
  });
});

describe("loadPersistedDevSession", () => {
  test("loads the shared persisted session pointer", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "dev-session-"));
    const sessionFilePath = path.join(tempRoot, "session.json");
    await writeFile(
      sessionFilePath,
      JSON.stringify({
        sessionId: "session-1",
        shortCode: "swift-falcon-73",
        gameId: "game-1",
        seed: 42,
        createdAt: "2026-03-16T00:00:00.000Z",
        controllablePlayerIds: "invalid",
        yourTurnCount: 2.8,
      }),
      "utf8",
    );

    expect(await loadPersistedDevSession(sessionFilePath)).toEqual({
      sessionId: "session-1",
    });
  });

  test("returns null when the session file is missing", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "dev-session-"));

    expect(
      await loadPersistedDevSession(path.join(tempRoot, "session.json")),
    ).toBeNull();
  });
});
