export type Environment = "local" | "dev" | "prod";

export type GlobalAuth = {
  authToken?: string;
  refreshToken?: string;
};

export type LocalMaintainerSdkPackageName =
  | "@dreamboard/api-client"
  | "@dreamboard/app-sdk"
  | "@dreamboard/sdk-types"
  | "@dreamboard/ui-sdk";

export type LocalMaintainerRegistryPackages = Record<
  LocalMaintainerSdkPackageName,
  string
>;

export type LocalMaintainerRegistryConfig = {
  registryUrl: string;
  snapshotId: string;
  fingerprint: string;
  publishedAt: string;
  packages: LocalMaintainerRegistryPackages;
};

export type EnvironmentConfig = {
  apiBaseUrl: string;
  webBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export type GlobalConfig = GlobalAuth & {
  // Current environment (defaults to 'dev' if not set)
  environment?: Environment;
};

export type ProjectPendingSyncPhase =
  | "source_revision_created"
  | "authoring_state_created";

export type ProjectPendingAuthoringSync = {
  phase: ProjectPendingSyncPhase;
  authoringStateId?: string;
  ruleId?: string;
  manifestId?: string;
  manifestContentHash?: string;
  sourceRevisionId: string;
  sourceTreeHash: string;
};

export type ProjectAuthoringState = {
  authoringStateId?: string;
  ruleId?: string;
  manifestId?: string;
  manifestContentHash?: string;
  sourceRevisionId?: string;
  sourceTreeHash?: string;
  pendingSync?: ProjectPendingAuthoringSync;
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
  localMaintainerRegistry?: LocalMaintainerRegistryConfig;
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
  authTokenSource?: "global" | "env" | "flag" | "none";
  refreshTokenSource?: "global" | "env" | "none";
};

export type ApiError = {
  message?: string;
  errors?: Record<string, string[]>;
};

export type RenderState = {
  buffers: Map<string, string>;
  opened: Set<string>;
};
