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

export type ProjectAuthoringState = {
  authoringStateId?: string;
  ruleId?: string;
  manifestId?: string;
  manifestContentHash?: string;
  sourceRevisionId?: string;
  sourceTreeHash?: string;
};

export type ProjectCompileAttempt = {
  resultId?: string;
  jobId?: string;
  authoringStateId: string;
  status: "successful" | "failed";
  diagnosticsSummary?: string;
};

export type ProjectCompileState = {
  latestAttempt?: ProjectCompileAttempt;
  latestSuccessful?: {
    resultId: string;
    authoringStateId: string;
  };
};

export type ProjectConfig = {
  gameId: string;
  slug: string;
  authoring?: ProjectAuthoringState;
  compile?: ProjectCompileState;
  apiBaseUrl?: string;
  webBaseUrl?: string;
  ruleId?: string;
  manifestId?: string;
  manifestContentHash?: string;
  resultId?: string;
  sourceRevisionId?: string;
  sourceTreeHash?: string;
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
