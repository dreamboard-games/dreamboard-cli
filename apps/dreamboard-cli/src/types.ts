export type Environment = "local" | "dev" | "prod";

export type EnvironmentConfig = {
  apiBaseUrl: string;
  webBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export type GlobalConfig = {
  // Current environment (defaults to 'dev' if not set)
  environment?: Environment;
  // Auth tokens
  authToken?: string;
  refreshToken?: string;
};

export type ProjectConfig = {
  gameId: string;
  slug: string;
  ruleId?: string;
  manifestId?: string;
  /** SHA-256 hash returned by the server after the last manifest push. Used to detect server-side changes. */
  manifestContentHash?: string;
  resultId?: string;
  sourceRevisionId?: string;
  sourceTreeHash?: string;
  apiBaseUrl?: string;
  webBaseUrl?: string;
};

export type Snapshot = {
  files: Record<string, string>;
  manifestHash?: string;
  resultId?: string;
};

export type LocalDiff = {
  modified: string[];
  added: string[];
  deleted: string[];
};

export type ResolvedConfig = {
  apiBaseUrl: string;
  webBaseUrl: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  authToken?: string;
  refreshToken?: string;
};

export type ApiError = {
  message?: string;
  errors?: Record<string, string[]>;
};

export type UiStep = {
  playerId: string;
  buttons?: string[];
  turns?: number;
  mouse_x?: number;
  mouse_y?: number;
};

export type ApiScenarioStep = {
  playerId: string;
  actionType: string;
  parameters?: Record<string, unknown>;
  turns?: number;
};

export type TurnTracker = {
  waitForTurns: (turns: number) => Promise<void>;
  close: () => void;
};

export type RenderState = {
  buffers: Map<string, string>;
  opened: Set<string>;
};
