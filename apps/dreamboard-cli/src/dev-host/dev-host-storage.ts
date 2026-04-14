export type ActiveSession = {
  sessionId: string;
  shortCode: string;
  gameId: string;
  seed: number | null;
  compiledResultId: string;
  setupProfileId: string | null;
};

export interface DevHostStorage {
  loadActiveSession(): ActiveSession | null;
  persistActiveSession(session: ActiveSession): void;
  loadSidebarOpen(): boolean;
  persistSidebarOpen(open: boolean): void;
}

const ACTIVE_SESSION_STORAGE_KEY = "dreamboard-dev-active-session";
const SIDEBAR_STORAGE_KEY = "dreamboard-dev-sidebar";

export class SessionStorageDevHostStorage implements DevHostStorage {
  constructor(private readonly storage: Storage) {}

  loadActiveSession(): ActiveSession | null {
    try {
      const raw = this.storage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Partial<ActiveSession>;
      if (
        typeof parsed.sessionId !== "string" ||
        typeof parsed.shortCode !== "string" ||
        typeof parsed.gameId !== "string" ||
        typeof parsed.compiledResultId !== "string"
      ) {
        return null;
      }

      return {
        sessionId: parsed.sessionId,
        shortCode: parsed.shortCode,
        gameId: parsed.gameId,
        seed: typeof parsed.seed === "number" ? parsed.seed : null,
        compiledResultId: parsed.compiledResultId,
        setupProfileId:
          typeof parsed.setupProfileId === "string"
            ? parsed.setupProfileId
            : null,
      };
    } catch {
      return null;
    }
  }

  persistActiveSession(session: ActiveSession): void {
    try {
      this.storage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore persistence failures in locked-down browser contexts.
    }
  }

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
}
