import { describe, expect, test } from "bun:test";

import { SessionStorageDevHostStorage } from "./dev-host-storage.js";

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
  test("persists sidebar state", () => {
    const storage = new MemoryStorage();
    const devHostStorage = new SessionStorageDevHostStorage(storage);

    devHostStorage.persistSidebarOpen(true);

    expect(storage.getItem("dreamboard-dev-sidebar")).toBe("true");
    expect(devHostStorage.loadSidebarOpen()).toBe(true);
  });

  test("defaults sidebar state to closed when nothing is stored", () => {
    const devHostStorage = new SessionStorageDevHostStorage(
      new MemoryStorage(),
    );

    expect(devHostStorage.loadSidebarOpen()).toBe(false);
  });

  test("persists selected player state", () => {
    const storage = new MemoryStorage();
    const devHostStorage = new SessionStorageDevHostStorage(storage);

    devHostStorage.persistSelectedPlayerId(" player-2 ");

    expect(storage.getItem("dreamboard-dev-selected-player")).toBe("player-2");
    expect(devHostStorage.loadSelectedPlayerId()).toBe("player-2");
  });

  test("clears selected player state when no player is provided", () => {
    const storage = new MemoryStorage();
    const devHostStorage = new SessionStorageDevHostStorage(storage);

    devHostStorage.persistSelectedPlayerId("player-2");
    devHostStorage.persistSelectedPlayerId(null);

    expect(storage.getItem("dreamboard-dev-selected-player")).toBeNull();
    expect(devHostStorage.loadSelectedPlayerId()).toBeNull();
  });
});
