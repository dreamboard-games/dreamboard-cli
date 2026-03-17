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
  sourceRevisionId: string;
  diagnostics?: CompiledResultDiagnostic[];
  parentResultId?: string;
  manifestId?: string;
  ruleId?: string;
};

type DynamicScaffoldResult = {
  allFiles: Record<string, string | null>;
};

type CompletionLights = {
  rules: boolean;
  manifest: boolean;
  phases: boolean;
  ui: boolean;
};

type RemoteProjectSources = {
  resultId: string;
  files: Record<string, string>;
  sourceRevisionId: string;
  treeHash: string;
  manifestId?: string;
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
  buildRemoteAlignedSnapshotFiles: Array<{
    localFiles: Record<string, string>;
    remoteUserFiles: Record<string, string>;
  }>;
  collectModifiedStaticSdkFiles: string[];
  configureClient: ResolvedConfig[];
  createCompiledResultSdk: Array<{
    gameId: string;
    sourceRevisionId: string;
    manifestId: string;
    ruleId: string;
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
    baseResultId: string;
    latestResultId: string;
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
  scaffoldStaticWorkspace: Array<{
    projectRoot: string;
    mode: "new" | "update";
    options: { updateSdk?: boolean };
  }>;
  updateProjectState: Array<{
    rootDir: string;
    config: ProjectConfig;
  }>;
  writeManifest: Array<{
    rootDir: string;
    manifest: Record<string, unknown>;
  }>;
  writeScaffoldFiles: Array<{
    rootDir: string;
    files: Record<string, string | null>;
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
  createCompiledResultError: Error | null;
  createCompileJobResult: {
    jobId: string;
  };
  createCompiledResultResult: CompiledResultResult;
  createSourceRevisionError: Error | null;
  createSourceRevisionResult: SourceRevisionResult;
  dynamicScaffoldError: Error | null;
  dynamicScaffoldResult: DynamicScaffoldResult;
  fetchLatestRemoteSourcesResult: RemoteProjectSources | null;
  findLatestSuccessfulCompiledResultResult: { id: string } | null;
  getLatestCompiledResultResponse: ApiCallResult<{
    id: string;
    sourceRevisionId?: string;
  }>;
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
  loadManifestResult: Record<string, unknown>;
  loadRuleResult: string;
  modifiedStaticSdkFiles: string[];
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
  scaffoldWriteResult: {
    written: string[];
    skipped: string[];
  };
  waitForCompiledResultJobError: Error | null;
  writeScaffoldFilesError: Error | null;
};

function createDefaultState(): AuthoringCommandTestState {
  return {
    calls: {
      assertCliStaticScaffoldComplete: [],
      buildRemoteAlignedSnapshotFiles: [],
      collectModifiedStaticSdkFiles: [],
      configureClient: [],
      createCompiledResultSdk: [],
      runLocalTypecheck: [],
      waitForCompiledResultJobSdk: [],
      createSourceRevisionSdk: [],
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
      scaffoldStaticWorkspace: [],
      updateProjectState: [],
      writeManifest: [],
      writeScaffoldFiles: [],
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
    createCompiledResultError: null,
    createCompileJobResult: {
      jobId: "compile-job-1",
    },
    createCompiledResultResult: {
      id: "result-2",
      success: true,
      sourceRevisionId: "source-revision-2",
    },
    createSourceRevisionError: null,
    createSourceRevisionResult: {
      id: "source-revision-2",
      treeHash: "tree-hash-2",
    },
    dynamicScaffoldError: null,
    dynamicScaffoldResult: {
      allFiles: {
        "app/phases/setup.ts": "export const phase = {}\n",
      },
    },
    fetchLatestRemoteSourcesResult: null,
    findLatestSuccessfulCompiledResultResult: {
      id: "result-1",
    },
    getLatestCompiledResultResponse: {
      data: {
        id: "result-1",
        sourceRevisionId: "source-revision-1",
      },
      error: null,
      response: {
        status: 200,
      },
    },
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
      authToken: "token",
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
    loadManifestResult: {
      stateMachine: {
        states: [{ name: "setup" }],
      },
    },
    loadRuleResult: "rule text",
    modifiedStaticSdkFiles: [],
    projectConfig: {
      gameId: "game-1",
      slug: "test-game",
      ruleId: "rule-1",
      manifestId: "manifest-1",
      manifestContentHash: "content-hash-1",
      resultId: "result-1",
      sourceRevisionId: "source-revision-1",
      sourceTreeHash: "tree-hash-1",
    },
    projectRoot: "/tmp/dreamboard-project",
    readTextFiles: {},
    reconcileRemoteChangesIntoWorkspaceResult: {
      latest: {
        resultId: "result-2",
        files: {
          "app/phases/setup.ts": "export const phase = {}\n",
        },
        sourceRevisionId: "source-revision-2",
        treeHash: "tree-hash-2",
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
    scaffoldWriteResult: {
      written: ["app/phases/setup.ts"],
      skipped: [],
    },
    waitForCompiledResultJobError: null,
    writeScaffoldFilesError: null,
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
  getLatestCompiledResult: async () =>
    authoringCommandTestHarness.current.getLatestCompiledResultResponse,
  scaffoldGameSourcesV3: async () => {
    const state = authoringCommandTestHarness.current;
    if (state.dynamicScaffoldError) {
      return {
        data: null,
        error: { message: state.dynamicScaffoldError.message },
        response: { status: 500 },
      };
    }
    return {
      data: { generatedFiles: {}, seedFiles: {} },
      error: null,
      response: { status: 200 },
    };
  },
}));

mock.module("@dreamboard/api-client/source-revisions", () => ({
  planSourceRevisionTransport: (request: {
    changes: Array<{ kind: string }>;
  }) => ({
    upsertCount: request.changes.filter((change) => change.kind === "upsert")
      .length,
    byteLength: JSON.stringify(request).length,
    useBundle: false,
    request,
    serializedJson: JSON.stringify(request),
  }),
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
  parsePushCommandArgs: (args: Record<string, unknown>) => args,
  parseStatusCommandArgs: (args: Record<string, unknown>) => args,
  parseUpdateCommandArgs: (args: Record<string, unknown>) => args,
}));

mock.module("../services/api/index.js", () => ({
  createCompiledResultSdk: async (options: {
    gameId: string;
    sourceRevisionId: string;
    manifestId: string;
    ruleId: string;
  }) => {
    const state = authoringCommandTestHarness.current;
    state.calls.createCompiledResultSdk.push(structuredClone(options));
    if (state.createCompiledResultError) {
      throw state.createCompiledResultError;
    }
    return structuredClone(state.createCompileJobResult);
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
    return {
      job: {
        id: options.jobId,
        jobId: options.jobId,
        gameId: options.gameId,
        status: state.createCompiledResultResult.success
          ? "COMPLETED"
          : "FAILED",
        createdCompiledResultId: state.createCompiledResultResult.id,
      },
      compiledResult: structuredClone(state.createCompiledResultResult),
    };
  },
}));

mock.module("../services/project/dynamic-scaffold-response.js", () => ({
  validateDynamicScaffoldResponse: () =>
    structuredClone(authoringCommandTestHarness.current.dynamicScaffoldResult),
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
    filePath !== "manifest.json" &&
    filePath !== "rule.md",
  loadManifest: async () =>
    structuredClone(authoringCommandTestHarness.current.loadManifestResult),
  loadRule: async () => authoringCommandTestHarness.current.loadRuleResult,
  writeManifest: async (rootDir: string, manifest: Record<string, unknown>) => {
    authoringCommandTestHarness.current.calls.writeManifest.push({
      rootDir,
      manifest: structuredClone(manifest),
    });
  },
  writeScaffoldFiles: async (
    rootDir: string,
    files: Record<string, string | null>,
  ) => {
    const state = authoringCommandTestHarness.current;
    state.calls.writeScaffoldFiles.push({
      rootDir,
      files: structuredClone(files),
    });
    if (state.writeScaffoldFilesError) {
      throw state.writeScaffoldFilesError;
    }
    return structuredClone(state.scaffoldWriteResult);
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
  collectModifiedStaticSdkFiles: async () => {
    const state = authoringCommandTestHarness.current;
    state.calls.collectModifiedStaticSdkFiles.push("called");
    return [...state.modifiedStaticSdkFiles];
  },
  scaffoldStaticWorkspace: async (
    projectRoot: string,
    mode: "new" | "update",
    options: { updateSdk?: boolean } = {},
  ) => {
    authoringCommandTestHarness.current.calls.scaffoldStaticWorkspace.push({
      projectRoot,
      mode,
      options: { ...options },
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
    baseResultId: string;
    latestResultId: string;
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
}));

mock.module("../utils/fs.js", () => ({
  ensureDir: async () => undefined,
  readTextFileIfExists: async (filePath: string) => {
    const state = authoringCommandTestHarness.current;
    state.calls.readTextFileIfExists.push(filePath);
    return state.readTextFiles[filePath] ?? null;
  },
  writeTextFile: async () => undefined,
}));

mock.module("../utils/prompts.js", () => ({
  confirmPrompt: async () => true,
}));

beforeEach(() => {
  resetAuthoringCommandTestHarness();
});
