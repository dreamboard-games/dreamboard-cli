export type ActiveSession = {
  sessionId: string;
  shortCode: string;
  gameId: string;
  seed: number | null;
};

export interface DevHostStorage {
  loadSidebarOpen(): boolean;
  persistSidebarOpen(open: boolean): void;
  loadSelectedPlayerId(): string | null;
  persistSelectedPlayerId(playerId: string | null): void;
}

const SIDEBAR_STORAGE_KEY = "dreamboard-dev-sidebar";
const SELECTED_PLAYER_STORAGE_KEY = "dreamboard-dev-selected-player";

export class SessionStorageDevHostStorage implements DevHostStorage {
  constructor(private readonly storage: Storage) {}

  loadSidebarOpen(): boolean {
    try {
      return this.storage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  }

  persistSidebarOpen(open: boolean): void {
    try {
      this.storage.setItem(SIDEBAR_STORAGE_KEY, String(open));
    } catch {
      // Ignore persistence failures in locked-down browser contexts.
    }
  }

  loadSelectedPlayerId(): string | null {
    try {
      return this.storage.getItem(SELECTED_PLAYER_STORAGE_KEY)?.trim() || null;
    } catch {
      return null;
    }
  }

  persistSelectedPlayerId(playerId: string | null): void {
    try {
      if (playerId?.trim()) {
        this.storage.setItem(SELECTED_PLAYER_STORAGE_KEY, playerId.trim());
      } else {
        this.storage.removeItem(SELECTED_PLAYER_STORAGE_KEY);
      }
    } catch {
      // Ignore persistence failures in locked-down browser contexts.
    }
  }
}
