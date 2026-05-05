export type Environment = "local" | "dev" | "prod";

export type LocalMaintainerSdkPackageName =
  | "@dreamboard/api-client"
  | "@dreamboard/reducer-contract"
  | "@dreamboard/app-sdk"
  | "@dreamboard/sdk-types"
  | "@dreamboard/testing"
  | "@dreamboard/ui-sdk";

export type LocalMaintainerRegistryPackages = {
  "@dreamboard/api-client": string;
  "@dreamboard/sdk-types": string;
  "@dreamboard/app-sdk": string;
  "@dreamboard/testing"?: string;
  "@dreamboard/ui-sdk": string;
  "@dreamboard/reducer-contract"?: string;
};

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

/**
 * Non-credential configuration persisted at `~/.dreamboard/config.json`.
 *
 * IMPORTANT: `authToken` and `refreshToken` intentionally do NOT live here.
 * Credentials are owned exclusively by the `CredentialStore` module
 * (`config/credential-store.ts`). Mixing them into `GlobalConfig` was the
 * root cause of the refresh-token-wipe bug: `saveGlobalConfig({ ...config })`
 * could silently erase stored credentials if the caller forgot to include
 * them. With credentials removed from this type, that failure mode is a
 * type error.
 *
 * `credentialBackend` is a *selector*, not a credential: it only says where
 * tokens are stored. The default (unset) is `"file"` because the OS keychain
 * prompts the user for their login password on first use on macOS (and is
 * re-prompted whenever the Node binary signature changes, e.g. after an
 * `nvm`/`volta` upgrade). Users who want encrypted-at-rest storage can opt
 * in by writing `"credentialBackend": "keychain"` into this file.
 */
export type CredentialBackendPreference = "file" | "keychain";

export type GlobalConfig = {
  // Current environment (defaults to 'dev' if not set)
  environment?: Environment;
  // Where stored credentials live. Unset = "file".
  credentialBackend?: CredentialBackendPreference;
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

/**
 * A resolved, read-only snapshot of "what should this CLI invocation do".
 *
 * `authToken` and `refreshToken` are read-only projections of the active
 * credentials at the moment `resolveConfig` runs. They are marked `readonly`
 * to discourage reassignment from command code; the refresh path never
 * mutates this object and instead goes through `CredentialStore` directly.
 * Persisting a `ResolvedConfig` back into `GlobalConfig`/`auth.json` is
 * not possible because `GlobalConfig` has no credential fields.
 */
export type ResolvedConfig = {
  readonly apiBaseUrl: string;
  readonly webBaseUrl: string;
  readonly supabaseUrl?: string;
  readonly supabaseAnonKey?: string;
  readonly authToken?: string;
  readonly refreshToken?: string;
  readonly authTokenSource?: "global" | "env" | "flag" | "none";
  readonly refreshTokenSource?: "global" | "env" | "none";
};

export type ApiError = {
  message?: string;
  errors?: Record<string, string[]>;
};

export type RenderState = {
  buffers: Map<string, string>;
  opened: Set<string>;
};
