import { beforeEach, mock } from "bun:test";
import type {
  ApiError,
  GlobalConfig,
  LocalDiff,
  ProjectConfig,
  ResolvedConfig,
} from "../types.js";

type HttpResponse = {
  status: number;
};

type ApiCallResult<T> = {
  data: T | null;
  error: ApiError | null;
  response: HttpResponse;
};

type CompiledResultSummary = {
  id: string;
  authoringStateId?: string;
  success?: boolean;
  sourceRevisionId?: string;
  manifestId?: string;
  ruleId?: string;
};

type SourceRevisionResult = {
  id: string;
  treeHash: string;
};

type CompiledResultDiagnostic =
  | {
      type: "file";
      file: string;
      line: number;
      column: number;
      message: string;
    }
  | {
      type: "general";
      category: string;
      message: string;
      context?: {
        file?: string;
        details?: string;
      };
    };

type CompiledResultResult = {
  id: string;
  success: boolean;
  authoringStateId: string;
  sourceRevisionId: string;
  diagnostics?: CompiledResultDiagnostic[];
  parentResultId?: string;
  manifestId?: string;
  ruleId?: string;
};

type CompletionLights = {
  rules: boolean;
  manifest: boolean;
  phases: boolean;
  ui: boolean;
};

type RemoteProjectSources = {
  authoringStateId: string;
  files: Record<string, string>;
  sourceRevisionId: string;
  treeHash: string;
  sourceTreeHash?: string;
  manifestId?: string;
  manifestContentHash?: string;
  manifest?: Record<string, unknown>;
  ruleId?: string;
  ruleText?: string;
};

type RemoteReconcileResult = {
  latest: RemoteProjectSources;
  remoteUserFiles: Record<string, string>;
  written: string[];
  deleted: string[];
  conflicts: string[];
};

type HarnessCalls = {
  assertCliStaticScaffoldComplete: Array<{
    projectRoot: string;
    deletedPaths: readonly string[];
  }>;
  assertReducerContractPreflight: string[];
  assertReducerBundleSmoke: Array<{ projectRoot: string }>;
  buildRemoteAlignedSnapshotFiles: Array<{
    localFiles: Record<string, string>;
    remoteUserFiles: Record<string, string>;
  }>;
  configureClient: ResolvedConfig[];
  getAuthoringHeadSdk: string[];
  createAuthoringStateSdk: Array<{
    gameId: string;
    request: Record<string, unknown>;
  }>;
  findCompiledResultsForAuthoringState: Array<{
    gameId: string;
    authoringStateId: string;
  }>;
  queueCompiledResultJobSdk: Array<{
    gameId: string;
    authoringStateId: string;
  }>;
  runLocalTypecheck: string[];
  waitForCompiledResultJobSdk: Array<{
    gameId: string;
    jobId: string;
  }>;
  createSourceRevisionSdk: Array<{
    gameId: string;
    request: Record<string, unknown>;
  }>;
  uploadSourceBlobsSdk: Array<{
    gameId: string;
    blobs: Array<{
      content: string;
      contentHash: string;
      byteSize: number;
    }>;
  }>;
  fetchLatestRemoteSources: string[];
  findLatestSuccessfulCompiledResult: string[];
  getLatestManifestIdSdk: Array<{
    gameId: string;
    ruleId?: string;
  }>;
  getLatestRuleIdSdk: string[];
  isManifestDifferentFromServer: Array<{
    manifestId?: string;
    manifestContentHash?: string;
  }>;
  readTextFileIfExists: string[];
  reconcileRemoteChangesIntoWorkspace: Array<{
    projectRoot: string;
    projectConfig: ProjectConfig;
    baseAuthoringStateId: string;
    latestAuthoringStateId: string;
  }>;
  requireAuth: ResolvedConfig[];
  saveManifestSdk: Array<{
    gameId: string;
    manifest: Record<string, unknown>;
    ruleId: string;
  }>;
  saveRuleSdk: Array<{
    gameId: string;
    ruleText: string;
  }>;
  applyWorkspaceCodegen: Array<{
    projectRoot: string;
    manifest: Record<string, unknown>;
  }>;
  installWorkspaceDependencies: string[];
  ensureLocalMaintainerSnapshot: string[];
  scaffoldStaticWorkspace: Array<{
    projectRoot: string;
    mode: "new" | "update";
    localMaintainerRegistry?: ProjectConfig["localMaintainerRegistry"];
  }>;
  updateProjectState: Array<{
    rootDir: string;
    config: ProjectConfig;
  }>;
  writeManifest: Array<{
    rootDir: string;
    manifest: Record<string, unknown>;
  }>;
  writeSnapshot: string[];
  writeSnapshotFromFiles: Array<{
    rootDir: string;
    files: Record<string, string>;
  }>;
};

type ConsoleCall = {
  level: "error" | "info" | "log" | "start" | "success" | "warn";
  args: unknown[];
};

export type AuthoringCommandTestState = {
  calls: HarnessCalls;
  collectLocalFilesResult: Record<string, string>;
  completionLights: CompletionLights | null;
  config: ResolvedConfig;
  consoleCalls: ConsoleCall[];
  createAuthoringStateError: Error | null;
  createAuthoringStateResult: RemoteProjectSources;
  queueCompiledResultJobError: Error | null;
  createCompileJobResult: {
    jobId?: string;
  };
  createCompiledResultResult: CompiledResultResult;
  createSourceRevisionError: Error | null;
  createSourceRevisionResult: SourceRevisionResult;
  installWorkspaceDependenciesError: Error | null;
  installWorkspaceDependenciesResult: {
    required: boolean;
    installed: boolean;
    lockfileGenerated: boolean;
    packageManagerNormalized: boolean;
    fingerprint: string | null;
  };
  installWorkspaceDependenciesNextCollectLocalFilesResult: Record<
    string,
    string
  > | null;
  installWorkspaceDependenciesNextLocalDiffResult: LocalDiff | null;
  ensureLocalMaintainerSnapshotResult:
    | ProjectConfig["localMaintainerRegistry"]
    | null;
  didLocalMaintainerSnapshotChangeResult: boolean;
  applyWorkspaceCodegenError: Error | null;
  applyWorkspaceCodegenErrorOnCall: number | null;
  applyWorkspaceCodegenNextCollectLocalFilesResult: Record<
    string,
    string
  > | null;
  applyWorkspaceCodegenNextLocalDiffResult: LocalDiff | null;
  reducerContractPreflightError: Error | null;
  reducerBundleSmokeError: Error | null;
  fetchLatestRemoteSourcesResult: RemoteProjectSources | null;
  getAuthoringHeadSdkResult: RemoteProjectSources | null;
  findLatestSuccessfulCompiledResultResult: { id: string } | null;
  findCompiledResultsForAuthoringStateResult: CompiledResultSummary[];
  getLatestManifestIdSdkResult?: string;
  getLatestRuleIdSdkResult: string;
  getLocalDiffResult: LocalDiff;
  getManifestResponse: ApiCallResult<{
    manifest: Record<string, unknown>;
    contentHash: string;
  }>;
  getManifestSdkResult: { contentHash: string } | null;
  globalConfig: GlobalConfig;
  isManifestDifferentFromServerResult: boolean;
  latestGameResponse: ApiCallResult<{
    completionLights?: CompletionLights;
  }>;
  localTypecheckResult: {
    success: boolean;
    output: string;
    skipped?: boolean;
  };
  loadManifestError: Error | null;
  loadManifestResult: Record<string, unknown>;
  loadRuleResult: string;
  projectConfig: ProjectConfig;
  projectRoot: string;
  readTextFiles: Record<string, string | null>;
  reconcileRemoteChangesIntoWorkspaceResult: RemoteReconcileResult;
  requireAuthError: Error | null;
  saveManifestSdkResult: {
    manifestId: string;
    contentHash: string;
  };
  saveRuleSdkResult: {
    ruleId: string;
  };
  waitForCompiledResultJobError: Error | null;
  waitForCompiledResultJobTerminalResult: {
    status: "COMPLETED" | "FAILED";
    phase?: string;
    message?: string;
    createdCompiledResultId?: string;
  } | null;
};

function createDefaultState(): AuthoringCommandTestState {
  return {
    calls: {
      assertCliStaticScaffoldComplete: [],
      assertReducerContractPreflight: [],
      assertReducerBundleSmoke: [],
      buildRemoteAlignedSnapshotFiles: [],
      configureClient: [],
      getAuthoringHeadSdk: [],
      createAuthoringStateSdk: [],
      findCompiledResultsForAuthoringState: [],
      queueCompiledResultJobSdk: [],
      runLocalTypecheck: [],
      waitForCompiledResultJobSdk: [],
      createSourceRevisionSdk: [],
      uploadSourceBlobsSdk: [],
      fetchLatestRemoteSources: [],
      findLatestSuccessfulCompiledResult: [],
      getLatestManifestIdSdk: [],
      getLatestRuleIdSdk: [],
      isManifestDifferentFromServer: [],
      readTextFileIfExists: [],
      reconcileRemoteChangesIntoWorkspace: [],
      requireAuth: [],
      saveManifestSdk: [],
      saveRuleSdk: [],
      applyWorkspaceCodegen: [],
      installWorkspaceDependencies: [],
      ensureLocalMaintainerSnapshot: [],
      scaffoldStaticWorkspace: [],
      updateProjectState: [],
      writeManifest: [],
      writeSnapshot: [],
      writeSnapshotFromFiles: [],
    },
    collectLocalFilesResult: {
      "app/phases/setup.ts": "export const phase = {}\n",
    },
    completionLights: null,
    config: {
      apiBaseUrl: "https://api.example.com",
      webBaseUrl: "https://web.example.com",
      authToken: "token",
    },
    consoleCalls: [],
    createAuthoringStateError: null,
    createAuthoringStateResult: {
      authoringStateId: "authoring-2",
      files: {
        "app/phases/setup.ts": "export const phase = {}\n",
      },
      sourceRevisionId: "source-revision-2",
      treeHash: "tree-hash-2",
      sourceTreeHash: "tree-hash-2",
      manifestId: "manifest-2",
      manifestContentHash: "content-hash-2",
      ruleId: "rule-2",
    },
    queueCompiledResultJobError: null,
    createCompileJobResult: {
      jobId: "compile-job-1",
    },
    createCompiledResultResult: {
      id: "result-2",
      success: true,
      authoringStateId: "authoring-2",
      sourceRevisionId: "source-revision-2",
    },
    createSourceRevisionError: null,
    createSourceRevisionResult: {
      id: "source-revision-2",
      treeHash: "tree-hash-2",
    },
    installWorkspaceDependenciesError: null,
    installWorkspaceDependenciesResult: {
      required: false,
      installed: false,
      lockfileGenerated: false,
      packageManagerNormalized: false,
      fingerprint: null,
    },
    installWorkspaceDependenciesNextCollectLocalFilesResult: null,
    installWorkspaceDependenciesNextLocalDiffResult: null,
    ensureLocalMaintainerSnapshotResult: null,
    didLocalMaintainerSnapshotChangeResult: false,
    applyWorkspaceCodegenError: null,
    applyWorkspaceCodegenErrorOnCall: null,
    applyWorkspaceCodegenNextCollectLocalFilesResult: null,
    applyWorkspaceCodegenNextLocalDiffResult: null,
    reducerContractPreflightError: null,
    reducerBundleSmokeError: null,
    fetchLatestRemoteSourcesResult: null,
    getAuthoringHeadSdkResult: {
      authoringStateId: "authoring-1",
      files: {
        "app/phases/setup.ts": "export const phase = {}\n",
      },
      sourceRevisionId: "source-revision-1",
      treeHash: "tree-hash-1",
      manifestId: "manifest-1",
      manifestContentHash: "content-hash-1",
      ruleId: "rule-1",
    },
    findLatestSuccessfulCompiledResultResult: {
      id: "result-1",
    },
    findCompiledResultsForAuthoringStateResult: [
      {
        id: "result-1",
        authoringStateId: "authoring-1",
        success: true,
        sourceRevisionId: "source-revision-1",
      },
    ],
    getLatestManifestIdSdkResult: "manifest-1",
    getLatestRuleIdSdkResult: "rule-1",
    getLocalDiffResult: {
      modified: [],
      added: [],
      deleted: [],
    },
    getManifestResponse: {
      data: {
        manifest: {},
        contentHash: "content-hash-1",
      },
      error: null,
      response: {
        status: 200,
      },
    },
    getManifestSdkResult: {
      contentHash: "content-hash-1",
    },
    globalConfig: {
      environment: "local",
    },
    isManifestDifferentFromServerResult: false,
    latestGameResponse: {
      data: null,
      error: null,
      response: {
        status: 200,
      },
    },
    localTypecheckResult: {
      success: true,
      output: "",
    },
    loadManifestError: null,
    loadManifestResult: {
      players: {
        minPlayers: 2,
        maxPlayers: 4,
        optimalPlayers: 2,
      },
      cardSets: [],
      zones: [],
      boardTemplates: [],
      boards: [],
      pieceTypes: [],
      pieceSeeds: [],
      dieTypes: [],
      dieSeeds: [],
      resources: [],
      setupOptions: [],
      setupProfiles: [],
    },
    loadRuleResult: "rule text",
    projectConfig: {
      gameId: "game-1",
      slug: "test-game",
      authoring: {
        authoringStateId: "authoring-1",
        ruleId: "rule-1",
        manifestId: "manifest-1",
        manifestContentHash: "content-hash-1",
        sourceRevisionId: "source-revision-1",
        sourceTreeHash: "tree-hash-1",
      },
      compile: {
        latestAttempt: {
          resultId: "result-1",
          authoringStateId: "authoring-1",
          status: "successful",
        },
        latestSuccessful: {
          resultId: "result-1",
          authoringStateId: "authoring-1",
        },
      },
    },
    projectRoot: "/tmp/dreamboard-project",
    readTextFiles: {},
    reconcileRemoteChangesIntoWorkspaceResult: {
      latest: {
        authoringStateId: "authoring-2",
        files: {
          "app/phases/setup.ts": "export const phase = {}\n",
        },
        sourceRevisionId: "source-revision-2",
        treeHash: "tree-hash-2",
        manifestId: "manifest-2",
        manifestContentHash: "content-hash-2",
        ruleId: "rule-2",
      },
      remoteUserFiles: {},
      written: [],
      deleted: [],
      conflicts: [],
    },
    requireAuthError: null,
    saveManifestSdkResult: {
      manifestId: "manifest-2",
      contentHash: "content-hash-2",
    },
    saveRuleSdkResult: {
      ruleId: "rule-2",
    },
    waitForCompiledResultJobError: null,
    waitForCompiledResultJobTerminalResult: null,
  };
}

export const authoringCommandTestHarness: {
  current: AuthoringCommandTestState;
} = {
  current: createDefaultState(),
};

export function resetAuthoringCommandTestHarness(): void {
  authoringCommandTestHarness.current = createDefaultState();
}

function cloneProjectConfig(config: ProjectConfig): ProjectConfig {
  return structuredClone(config);
}

function cloneResolvedConfig(config: ResolvedConfig): ResolvedConfig {
  return structuredClone(config);
}

function recordConsoleCall(level: ConsoleCall["level"], args: unknown[]): void {
  authoringCommandTestHarness.current.consoleCalls.push({ level, args });
}

mock.module("consola", () => ({
  default: {
    error: (...args: unknown[]) => recordConsoleCall("error", args),
    info: (...args: unknown[]) => recordConsoleCall("info", args),
    log: (...args: unknown[]) => recordConsoleCall("log", args),
    start: (...args: unknown[]) => recordConsoleCall("start", args),
    success: (...args: unknown[]) => recordConsoleCall("success", args),
    warn: (...args: unknown[]) => recordConsoleCall("warn", args),
  },
}));

mock.module("@dreamboard/api-client", () => ({
  getGame: async () => {
    const state = authoringCommandTestHarness.current;
    return {
      ...state.latestGameResponse,
      data:
        state.latestGameResponse.data === null
          ? null
          : {
              ...state.latestGameResponse.data,
              completionLights: state.completionLights ?? undefined,
            },
    };
  },
}));

function mockContentHash(content: string): string {
  const checksum = Array.from(content).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return `content-hash-${content.length}-${checksum}`;
}

mock.module("@dreamboard/api-client/source-revisions", () => ({
  mapUpsertBlobContentsByContentHash: (
    localChanges: ReadonlyArray<
      | { kind: "upsert"; path: string; content: string }
      | { kind: "delete"; path: string }
    >,
    materializedChanges: ReadonlyArray<
      | {
          kind: "upsert";
          path: string;
          contentHash: string;
          byteSize: number;
        }
      | { kind: "delete"; path: string }
    >,
  ) => {
    const uploadBlobs = new Map<
      string,
      { contentHash: string; byteSize: number; content: string }
    >();
    const length = Math.min(localChanges.length, materializedChanges.length);
    for (let index = 0; index < length; index += 1) {
      const localChange = localChanges[index];
      const materializedChange = materializedChanges[index];
      if (
        localChange?.kind !== "upsert" ||
        materializedChange?.kind !== "upsert"
      ) {
        continue;
      }

      uploadBlobs.set(materializedChange.contentHash, {
        contentHash: materializedChange.contentHash,
        byteSize: materializedChange.byteSize,
        content: localChange.content,
      });
    }

    return uploadBlobs;
  },
  materializeSourceChangeOperations: async (
    changes: Array<
      | { kind: "upsert"; path: string; content: string }
      | { kind: "delete"; path: string }
    >,
  ) => {
    const textEncoder = new TextEncoder();
    const blobsByHash = new Map<
      string,
      { contentHash: string; byteSize: number }
    >();
    const materialized = changes.map((change) => {
      if (change.kind === "delete") {
        return structuredClone(change);
      }

      const contentHash = mockContentHash(change.content);
      const byteSize = textEncoder.encode(change.content).byteLength;
      blobsByHash.set(contentHash, { contentHash, byteSize });
      return {
        kind: "upsert" as const,
        path: change.path,
        contentHash,
        byteSize,
      };
    });

    return {
      blobs: Array.from(blobsByHash.values()),
      changes: materialized,
    };
  },
}));

mock.module("../config/global-config.js", () => ({
  loadGlobalConfig: async () =>
    authoringCommandTestHarness.current.globalConfig,
}));

mock.module("../config/project-config.js", () => ({
  updateProjectState: async (rootDir: string, config: ProjectConfig) => {
    const clonedConfig = cloneProjectConfig(config);
    const state = authoringCommandTestHarness.current;
    state.calls.updateProjectState.push({ rootDir, config: clonedConfig });
    state.projectConfig = clonedConfig;
  },
}));

mock.module("../config/resolve.js", () => ({
  configureClient: async (config: ResolvedConfig) => {
    authoringCommandTestHarness.current.calls.configureClient.push(
      cloneResolvedConfig(config),
    );
  },
  requireAuth: (config: ResolvedConfig) => {
    const state = authoringCommandTestHarness.current;
    state.calls.requireAuth.push(cloneResolvedConfig(config));
    if (state.requireAuthError) {
      throw state.requireAuthError;
    }
  },
  resolveConfig: () =>
    cloneResolvedConfig(authoringCommandTestHarness.current.config),
  resolveProjectContext: async () => ({
    projectRoot: authoringCommandTestHarness.current.projectRoot,
    projectConfig: cloneProjectConfig(
      authoringCommandTestHarness.current.projectConfig,
    ),
    config: cloneResolvedConfig(authoringCommandTestHarness.current.config),
  }),
}));

mock.module("../flags.js", () => ({
  parseCompileCommandArgs: (args: Record<string, unknown>) => args,
  parsePullCommandArgs: (args: Record<string, unknown>) => args,
  parseStatusCommandArgs: (args: Record<string, unknown>) => args,
  parseSyncCommandArgs: (args: Record<string, unknown>) => args,
}));

mock.module("../services/api/index.js", () => ({
  createAuthoringStateSdk: async (
    gameId: string,
    request: Record<string, unknown>,
  ) => {
    const state = authoringCommandTestHarness.current;
    state.calls.createAuthoringStateSdk.push({
      gameId,
      request: structuredClone(request),
    });
    if (state.createAuthoringStateError) {
      throw state.createAuthoringStateError;
    }
    return structuredClone(state.createAuthoringStateResult);
  },
  queueCompiledResultJobSdk: async (options: {
    gameId: string;
    authoringStateId: string;
  }) => {
    const state = authoringCommandTestHarness.current;
    state.calls.queueCompiledResultJobSdk.push(structuredClone(options));
    if (state.queueCompiledResultJobError) {
      throw state.queueCompiledResultJobError;
    }
    return structuredClone(state.createCompileJobResult);
  },
  findCompiledResultsForAuthoringState: async (options: {
    gameId: string;
    authoringStateId: string;
  }) => {
    const state = authoringCommandTestHarness.current;
    state.calls.findCompiledResultsForAuthoringState.push(
      structuredClone(options),
    );
    return structuredClone(state.findCompiledResultsForAuthoringStateResult);
  },
  createSourceRevisionSdk: async (
    gameId: string,
    request: Record<string, unknown>,
  ) => {
    const state = authoringCommandTestHarness.current;
    state.calls.createSourceRevisionSdk.push({
      gameId,
      request: structuredClone(request),
    });
    if (state.createSourceRevisionError) {
      throw state.createSourceRevisionError;
    }
    return structuredClone(state.createSourceRevisionResult);
  },
  uploadSourceBlobsSdk: async (
    gameId: string,
    blobs: Array<{
      content: string;
      contentHash: string;
      byteSize: number;
    }>,
  ) => {
    const state = authoringCommandTestHarness.current;
    state.calls.uploadSourceBlobsSdk.push({
      gameId,
      blobs: structuredClone(blobs),
    });
  },
  findLatestSuccessfulCompiledResult: async (gameId: string) => {
    const state = authoringCommandTestHarness.current;
    state.calls.findLatestSuccessfulCompiledResult.push(gameId);
    return structuredClone(state.findLatestSuccessfulCompiledResultResult);
  },
  getLatestManifestIdSdk: async (gameId: string, ruleId?: string) => {
    const state = authoringCommandTestHarness.current;
    state.calls.getLatestManifestIdSdk.push({ gameId, ruleId });
    return state.getLatestManifestIdSdkResult;
  },
  getLatestRuleIdSdk: async (gameId: string) => {
    const state = authoringCommandTestHarness.current;
    state.calls.getLatestRuleIdSdk.push(gameId);
    return state.getLatestRuleIdSdkResult;
  },
  getAuthoringHeadSdk: async (gameId: string) => {
    const state = authoringCommandTestHarness.current;
    state.calls.getAuthoringHeadSdk.push(gameId);
    return structuredClone(state.getAuthoringHeadSdkResult);
  },
  getManifestSdk: async () =>
    structuredClone(authoringCommandTestHarness.current.getManifestSdkResult),
  isManifestDifferentFromServer: async (
    manifestId?: string,
    manifestContentHash?: string,
  ) => {
    const state = authoringCommandTestHarness.current;
    state.calls.isManifestDifferentFromServer.push({
      manifestId,
      manifestContentHash,
    });
    return state.isManifestDifferentFromServerResult;
  },
  saveManifestSdk: async (
    gameId: string,
    manifest: Record<string, unknown>,
    ruleId: string,
  ) => {
    const state = authoringCommandTestHarness.current;
    state.calls.saveManifestSdk.push({
      gameId,
      manifest: structuredClone(manifest),
      ruleId,
    });
    return structuredClone(state.saveManifestSdkResult);
  },
  saveRuleSdk: async (gameId: string, ruleText: string) => {
    const state = authoringCommandTestHarness.current;
    state.calls.saveRuleSdk.push({
      gameId,
      ruleText,
    });
    return structuredClone(state.saveRuleSdkResult);
  },
  waitForCompiledResultJobSdk: async (options: {
    gameId: string;
    jobId: string;
    onProgress?: (job: {
      status: string;
      phase?: string;
      queuePosition?: number;
      message?: string;
    }) => void;
  }) => {
    const state = authoringCommandTestHarness.current;
    state.calls.waitForCompiledResultJobSdk.push({
      gameId: options.gameId,
      jobId: options.jobId,
    });
    options.onProgress?.({
      status: "PENDING",
      phase: "queued",
      queuePosition: 0,
      message: "Queued in harness",
    });
    options.onProgress?.({
      status: "RUNNING",
      phase: "compiling",
      message: "Compiling in harness",
    });
    if (state.waitForCompiledResultJobError) {
      throw state.waitForCompiledResultJobError;
    }
    const terminalResult = state.waitForCompiledResultJobTerminalResult;
    return {
      job: {
        id: options.jobId,
        jobId: options.jobId,
        gameId: options.gameId,
        status:
          terminalResult?.status ??
          (state.createCompiledResultResult.success ? "COMPLETED" : "FAILED"),
        phase: terminalResult?.phase,
        message: terminalResult?.message,
        createdCompiledResultId:
          terminalResult?.createdCompiledResultId ??
          state.createCompiledResultResult.id,
      },
      compiledResult: structuredClone(state.createCompiledResultResult),
    };
  },
}));

mock.module("../services/project/local-files.js", () => ({
  collectLocalFiles: async () =>
    structuredClone(
      authoringCommandTestHarness.current.collectLocalFilesResult,
    ),
  getLocalDiff: async () =>
    structuredClone(authoringCommandTestHarness.current.getLocalDiffResult),
  isAllowedGamePath: (filePath: string) =>
    !filePath.startsWith(".dreamboard/") &&
    filePath !== "manifest.ts" &&
    filePath !== "rule.md",
  loadManifest: async () =>
    (() => {
      const state = authoringCommandTestHarness.current;
      if (state.loadManifestError) {
        throw state.loadManifestError;
      }
      return structuredClone(state.loadManifestResult);
    })(),
  loadRule: async () => authoringCommandTestHarness.current.loadRuleResult,
  writeManifest: async (rootDir: string, manifest: Record<string, unknown>) => {
    authoringCommandTestHarness.current.calls.writeManifest.push({
      rootDir,
      manifest: structuredClone(manifest),
    });
  },
  writeSnapshot: async (rootDir: string) => {
    authoringCommandTestHarness.current.calls.writeSnapshot.push(rootDir);
  },
  writeSnapshotFromFiles: async (
    rootDir: string,
    files: Record<string, string>,
  ) => {
    authoringCommandTestHarness.current.calls.writeSnapshotFromFiles.push({
      rootDir,
      files: structuredClone(files),
    });
  },
}));

mock.module("../services/project/static-scaffold.js", () => ({
  assertCliStaticScaffoldComplete: async (
    projectRoot: string,
    deletedPaths: readonly string[] = [],
  ) => {
    authoringCommandTestHarness.current.calls.assertCliStaticScaffoldComplete.push(
      {
        projectRoot,
        deletedPaths: [...deletedPaths],
      },
    );
  },
  scaffoldStaticWorkspace: async (
    projectRoot: string,
    mode: "new" | "update",
    options?: {
      localMaintainerRegistry?: ProjectConfig["localMaintainerRegistry"];
    },
  ) => {
    authoringCommandTestHarness.current.calls.scaffoldStaticWorkspace.push({
      projectRoot,
      mode,
      localMaintainerRegistry: structuredClone(
        options?.localMaintainerRegistry,
      ),
    });
  },
}));

mock.module("../services/project/local-typecheck.js", () => ({
  runLocalTypecheck: async (projectRoot: string) => {
    const state = authoringCommandTestHarness.current;
    state.calls.runLocalTypecheck.push(projectRoot);
    return structuredClone(state.localTypecheckResult);
  },
}));

mock.module("../services/project/workspace-codegen.js", () => ({
  applyWorkspaceCodegen: async (options: {
    projectRoot: string;
    manifest: Record<string, unknown>;
  }) => {
    const state = authoringCommandTestHarness.current;
    state.calls.applyWorkspaceCodegen.push({
      projectRoot: options.projectRoot,
      manifest: structuredClone(options.manifest),
    });
    if (
      state.applyWorkspaceCodegenError &&
      (state.applyWorkspaceCodegenErrorOnCall === null ||
        state.applyWorkspaceCodegenErrorOnCall ===
          state.calls.applyWorkspaceCodegen.length)
    ) {
      throw state.applyWorkspaceCodegenError;
    }
    if (state.applyWorkspaceCodegenNextCollectLocalFilesResult) {
      state.collectLocalFilesResult = structuredClone(
        state.applyWorkspaceCodegenNextCollectLocalFilesResult,
      );
    }
    if (state.applyWorkspaceCodegenNextLocalDiffResult) {
      state.getLocalDiffResult = structuredClone(
        state.applyWorkspaceCodegenNextLocalDiffResult,
      );
    }
    return {
      written: [],
      skipped: [],
      merged: [],
    };
  },
}));

mock.module("../services/project/reducer-contract-preflight.js", () => ({
  assertReducerContractPreflight: async (projectRoot: string) => {
    const state = authoringCommandTestHarness.current;
    state.calls.assertReducerContractPreflight.push(projectRoot);
    if (state.reducerContractPreflightError) {
      throw state.reducerContractPreflightError;
    }
  },
}));

mock.module("../services/project/reducer-bundle-preflight.js", () => ({
  assertReducerBundleSmoke: async (options: { projectRoot: string }) => {
    const state = authoringCommandTestHarness.current;
    state.calls.assertReducerBundleSmoke.push({
      projectRoot: options.projectRoot,
    });
    if (state.reducerBundleSmokeError) {
      throw state.reducerBundleSmokeError;
    }
  },
}));

mock.module("../services/project/workspace-dependencies.js", () => ({
  installWorkspaceDependencies: async (projectRoot: string) => {
    const state = authoringCommandTestHarness.current;
    state.calls.installWorkspaceDependencies.push(projectRoot);
    if (state.installWorkspaceDependenciesError) {
      throw state.installWorkspaceDependenciesError;
    }
    if (state.installWorkspaceDependenciesNextCollectLocalFilesResult) {
      state.collectLocalFilesResult = structuredClone(
        state.installWorkspaceDependenciesNextCollectLocalFilesResult,
      );
    }
    if (state.installWorkspaceDependenciesNextLocalDiffResult) {
      state.getLocalDiffResult = structuredClone(
        state.installWorkspaceDependenciesNextLocalDiffResult,
      );
    }
    return true;
  },
  reconcileWorkspaceDependencies: async (projectRoot: string) => {
    const state = authoringCommandTestHarness.current;
    state.calls.installWorkspaceDependencies.push(projectRoot);
    if (state.installWorkspaceDependenciesError) {
      throw state.installWorkspaceDependenciesError;
    }
    if (state.installWorkspaceDependenciesNextCollectLocalFilesResult) {
      state.collectLocalFilesResult = structuredClone(
        state.installWorkspaceDependenciesNextCollectLocalFilesResult,
      );
    }
    if (state.installWorkspaceDependenciesNextLocalDiffResult) {
      state.getLocalDiffResult = structuredClone(
        state.installWorkspaceDependenciesNextLocalDiffResult,
      );
    }
    return structuredClone(state.installWorkspaceDependenciesResult);
  },
}));

mock.module("../services/project/local-maintainer-registry.js", () => ({
  ensureLocalMaintainerSnapshot: async (apiBaseUrl: string) => {
    authoringCommandTestHarness.current.calls.ensureLocalMaintainerSnapshot.push(
      apiBaseUrl,
    );
    return structuredClone(
      authoringCommandTestHarness.current.ensureLocalMaintainerSnapshotResult,
    );
  },
  didLocalMaintainerSnapshotChange: () =>
    authoringCommandTestHarness.current.didLocalMaintainerSnapshotChangeResult,
  isLocalMaintainerRegistryEnabled: (apiBaseUrl: string) =>
    apiBaseUrl.includes("localhost") || apiBaseUrl.includes("127.0.0.1"),
  readWorkspaceLocalMaintainerRegistry: async () => null,
}));

mock.module("../services/project/sync.js", () => ({
  buildRemoteAlignedSnapshotFiles: (options: {
    localFiles: Record<string, string>;
    remoteUserFiles: Record<string, string>;
  }) => {
    authoringCommandTestHarness.current.calls.buildRemoteAlignedSnapshotFiles.push(
      {
        localFiles: structuredClone(options.localFiles),
        remoteUserFiles: structuredClone(options.remoteUserFiles),
      },
    );
    return structuredClone(options.localFiles);
  },
  fetchLatestRemoteSources: async (gameId: string) => {
    authoringCommandTestHarness.current.calls.fetchLatestRemoteSources.push(
      gameId,
    );
    return structuredClone(
      authoringCommandTestHarness.current.fetchLatestRemoteSourcesResult,
    );
  },
  reconcileRemoteChangesIntoWorkspace: async (options: {
    projectRoot: string;
    projectConfig: ProjectConfig;
    baseAuthoringStateId: string;
    latestAuthoringStateId: string;
  }) => {
    authoringCommandTestHarness.current.calls.reconcileRemoteChangesIntoWorkspace.push(
      {
        ...options,
        projectConfig: structuredClone(options.projectConfig),
      },
    );
    return structuredClone(
      authoringCommandTestHarness.current
        .reconcileRemoteChangesIntoWorkspaceResult,
    );
  },
}));

mock.module("../utils/errors.js", () => ({
  formatApiError: (_error: unknown, _response: unknown, fallback: string) =>
    fallback,
  formatCliError: (error: unknown) =>
    error instanceof Error ? error.message : String(error),
}));

mock.module("../utils/fs.js", () => ({
  ensureDir: async () => undefined,
  exists: async () => false,
  readJsonFile: async () => {
    throw new Error("readJsonFile mock not implemented for this harness path");
  },
  readTextFileIfExists: async (filePath: string) => {
    const state = authoringCommandTestHarness.current;
    state.calls.readTextFileIfExists.push(filePath);
    return state.readTextFiles[filePath] ?? null;
  },
  writeTextFile: async () => undefined,
  writeJsonFile: async () => undefined,
}));

mock.module("../utils/prompts.js", () => ({
  confirmPrompt: async () => true,
}));

beforeEach(() => {
  resetAuthoringCommandTestHarness();
});
