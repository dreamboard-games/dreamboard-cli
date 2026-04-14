import { describe, expect, test } from "bun:test";

import {
  SessionStorageDevHostStorage,
  type ActiveSession,
} from "./dev-host-storage.js";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("SessionStorageDevHostStorage", () => {
  test("loads a persisted active session", () => {
    const storage = new MemoryStorage();
    const persistedSession: ActiveSession = {
      sessionId: "session-1",
      shortCode: "rapid-blaze-91",
      gameId: "game-1",
      seed: 1337,
      compiledResultId: "compiled-result-1",
      setupProfileId: null,
    };
    storage.setItem(
      "dreamboard-dev-active-session",
      JSON.stringify(persistedSession),
    );

    const devHostStorage = new SessionStorageDevHostStorage(storage);

    expect(devHostStorage.loadActiveSession()).toEqual(persistedSession);
  });

  test("drops invalid persisted sessions", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "dreamboard-dev-active-session",
      JSON.stringify({
        sessionId: "session-1",
        gameId: "game-1",
      }),
    );

    const devHostStorage = new SessionStorageDevHostStorage(storage);

    expect(devHostStorage.loadActiveSession()).toBeNull();
  });

  test("falls back to a null seed when persisted seed is invalid", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "dreamboard-dev-active-session",
      JSON.stringify({
        sessionId: "session-1",
        shortCode: "rapid-blaze-91",
        gameId: "game-1",
        seed: "not-a-number",
        compiledResultId: "compiled-result-1",
      }),
    );

    const devHostStorage = new SessionStorageDevHostStorage(storage);

    expect(devHostStorage.loadActiveSession()).toEqual({
      sessionId: "session-1",
      shortCode: "rapid-blaze-91",
      gameId: "game-1",
      seed: null,
      compiledResultId: "compiled-result-1",
      setupProfileId: null,
    });
  });

  test("persists active session and sidebar state", () => {
    const storage = new MemoryStorage();
    const devHostStorage = new SessionStorageDevHostStorage(storage);

    devHostStorage.persistActiveSession({
      sessionId: "session-1",
      shortCode: "rapid-blaze-91",
      gameId: "game-1",
      seed: 42,
      compiledResultId: "compiled-result-1",
      setupProfileId: "draft-profile",
    });
    devHostStorage.persistSidebarOpen(true);

    expect(
      JSON.parse(storage.getItem("dreamboard-dev-active-session") ?? "null"),
    ).toEqual({
      sessionId: "session-1",
      shortCode: "rapid-blaze-91",
      gameId: "game-1",
      seed: 42,
      compiledResultId: "compiled-result-1",
      setupProfileId: "draft-profile",
    });
    expect(storage.getItem("dreamboard-dev-sidebar")).toBe("true");
    expect(devHostStorage.loadSidebarOpen()).toBe(true);
  });

  test("drops persisted sessions from the pre-compiled-result format", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "dreamboard-dev-active-session",
      JSON.stringify({
        sessionId: "session-1",
        shortCode: "rapid-blaze-91",
        gameId: "game-1",
        seed: 42,
      }),
    );

    const devHostStorage = new SessionStorageDevHostStorage(storage);

    expect(devHostStorage.loadActiveSession()).toBeNull();
  });

  test("defaults sidebar state to closed when nothing is stored", () => {
    const devHostStorage = new SessionStorageDevHostStorage(
      new MemoryStorage(),
    );

    expect(devHostStorage.loadSidebarOpen()).toBe(false);
  });
});
