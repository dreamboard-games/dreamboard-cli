import { expect, mock, test } from "bun:test";

const applyWorkspaceCodegen = mock(async () => ({
  written: [],
  skipped: [],
  merged: [],
}));
const installWorkspaceDependencies = mock(async () => undefined);
const createGame = mock(async () => ({
  data: { id: "game-1" },
  error: null,
  response: { status: 200 },
}));
const actualFlags = await import("../flags.js");
const actualFs = await import("../utils/fs.js");
const actualLocalFiles = await import("../services/project/local-files.js");
const actualApiServices = await import("../services/api/index.js");
const actualStrings = await import("../utils/strings.js");
const actualErrors = await import("../utils/errors.js");
const configureClient = mock(async () => undefined);
const ensureLocalMaintainerSnapshot = mock(async () => null);
const localMaintainerSnapshot = {
  registryUrl: "http://127.0.0.1:4873",
  snapshotId: "snapshot-1",
  fingerprint: "fingerprint-1",
  publishedAt: "2026-04-12T00:00:00.000Z",
  packages: {
    "@dreamboard/api-client": "0.1.0-local.1",
    "@dreamboard/app-sdk": "0.0.40-local.1",
    "@dreamboard/sdk-types": "0.1.0-local.1",
    "@dreamboard/ui-sdk": "0.0.40-local.1",
  },
} as const;

mock.module("@dreamboard/api-client", () => ({
  createGame,
  deleteGame: mock(async () => ({
    error: null,
    response: { status: 204 },
  })),
  getGameBySlug: mock(async () => ({
    data: { id: "game-1" },
    error: null,
    response: { status: 200 },
  })),
  getGame: mock(async () => ({
    data: { id: "game-1" },
    error: null,
    response: { status: 200 },
  })),
  getLatestGameRule: mock(async () => ({
    data: { ruleText: "" },
    error: null,
  })),
  getManifest: mock(async () => ({
    data: {
      manifest: {},
      contentHash: "content-hash",
    },
    error: null,
  })),
  getLatestCompiledResult: mock(async () => ({
    data: null,
  })),
  findManifests: mock(async () => ({
    data: { currentManifestId: "manifest-1" },
  })),
}));

mock.module("../config/resolve.js", () => ({
  resolveConfig: (_globalConfig: unknown, args: Record<string, unknown>) =>
    args.env === "local"
      ? {
          apiBaseUrl: "http://localhost:8080",
          webBaseUrl: "http://localhost:5173",
          token: "token",
        }
      : {
          apiBaseUrl: "https://api.example.com",
          webBaseUrl: "https://web.example.com",
          token: "token",
        },
  resolveProjectContext: async () => ({
    projectRoot: "/tmp/dreamboard-project",
    projectConfig: {
      gameId: "game-1",
      ruleId: "rule-1",
      manifestId: "manifest-1",
      manifestContentHash: "content-hash",
    },
  }),
  requireAuth: () => undefined,
  configureClient,
}));

mock.module("../flags.js", () => ({
  ...actualFlags,
  parseNewCommandArgs: (args: Record<string, unknown>) => args,
  parseCloneCommandArgs: (args: Record<string, unknown>) => args,
}));

mock.module("../config/global-config.js", () => ({
  loadGlobalConfig: async () => ({}),
}));

mock.module("../utils/strings.js", () => ({
  ...actualStrings,
  normalizeSlug: (value: string) => value,
  titleFromSlug: () => "Test Game",
}));

mock.module("../utils/fs.js", () => ({
  ...actualFs,
  ensureDir: async () => undefined,
  installSkillFile: async () => undefined,
  writeTextFile: async () => undefined,
}));

mock.module("../services/api/index.js", () => ({
  ...actualApiServices,
  tryGetGameBySlug: async () => null,
  createAuthoringStateSdk: async () => ({
    authoringStateId: "authoring-1",
    sourceRevisionId: "source-revision-1",
    sourceTreeHash: "tree-hash-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash",
    ruleId: "rule-1",
  }),
  queueCompiledResultJobSdk: async () => ({
    jobId: "compile-job-1",
  }),
  createSourceRevisionSdk: async () => ({
    id: "source-revision-1",
    treeHash: "tree-hash-1",
  }),
  findCompiledResultsForAuthoringState: async () => [],
  getAuthoringHeadSdk: async () => null,
  getLatestRuleIdSdk: async () => "rule-1",
  saveManifestSdk: async () => ({
    manifestId: "manifest-1",
    contentHash: "content-hash",
  }),
  getLatestManifestIdSdk: async () => "manifest-1",
  isManifestDifferentFromServer: async () => false,
  saveRuleSdk: async () => ({
    ruleId: "rule-1",
  }),
  waitForCompiledResultJobSdk: async () => ({
    compiledResult: {
      id: "result-1",
      authoringStateId: "authoring-1",
      success: true,
      sourceRevisionId: "source-revision-1",
    },
  }),
}));

mock.module("../services/project/local-files.js", () => ({
  ...actualLocalFiles,
  collectLocalFiles: async () => ({}),
  getLocalDiff: async () => ({
    modified: [],
    added: [],
    deleted: [],
  }),
  loadManifest: async () => ({
    players: {
      minPlayers: 2,
      maxPlayers: 2,
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
  }),
  loadRule: async () => "",
  writeManifest: async () => undefined,
  writeRule: async () => undefined,
  writeSnapshotFromFiles: async () => undefined,
}));

mock.module("../services/project/workspace-codegen.js", () => ({
  applyWorkspaceCodegen,
}));

mock.module("../services/project/workspace-dependencies.js", () => ({
  installWorkspaceDependencies,
}));

mock.module("../services/project/local-maintainer-registry.js", () => ({
  ensureLocalMaintainerSnapshot,
  didLocalMaintainerSnapshotChange: () => false,
  readWorkspaceLocalMaintainerRegistry: async () => null,
}));

mock.module("../config/project-config.js", () => ({
  updateProjectState: async () => undefined,
}));

mock.module("../utils/errors.js", () => ({
  ...actualErrors,
}));

const newCommand = (await import("./new.ts")).default;

test("new command scaffolds locally with workspace codegen", async () => {
  applyWorkspaceCodegen.mockClear();
  installWorkspaceDependencies.mockClear();
  createGame.mockClear();
  configureClient.mockClear();
  ensureLocalMaintainerSnapshot.mockClear();

  await newCommand.run({
    args: {
      slug: "test-game",
      description: "A test game",
      force: false,
    },
  });

  expect(applyWorkspaceCodegen).toHaveBeenCalledWith({
    projectRoot: expect.stringContaining("test-game"),
    manifest: expect.objectContaining({
      players: expect.objectContaining({
        minPlayers: 2,
      }),
    }),
  });
  expect(installWorkspaceDependencies).toHaveBeenCalledWith(
    expect.stringContaining("test-game"),
  );
  expect(ensureLocalMaintainerSnapshot).toHaveBeenCalledWith(
    "https://api.example.com",
  );
});

test("new command writes local maintainer snapshot dependencies for local env scaffolds", async () => {
  applyWorkspaceCodegen.mockClear();
  installWorkspaceDependencies.mockClear();
  createGame.mockClear();
  configureClient.mockClear();
  ensureLocalMaintainerSnapshot.mockClear();
  ensureLocalMaintainerSnapshot.mockResolvedValueOnce(localMaintainerSnapshot);

  await newCommand.run({
    args: {
      slug: "test-game-local",
      description: "A local test game",
      force: false,
      env: "local",
    },
  });

  expect(ensureLocalMaintainerSnapshot).toHaveBeenCalledWith(
    "http://localhost:8080",
  );
  expect(installWorkspaceDependencies).toHaveBeenCalledWith(
    expect.stringContaining("test-game-local"),
  );
});

test("new command surfaces a re-login hint for invalid stored sessions", async () => {
  applyWorkspaceCodegen.mockClear();
  installWorkspaceDependencies.mockClear();
  createGame.mockClear();
  configureClient.mockClear();
  ensureLocalMaintainerSnapshot.mockClear();
  configureClient.mockImplementationOnce(async () => {
    throw new Error(
      "Stored Dreamboard session is expired or invalid (Invalid Refresh Token: Refresh Token Not Found). Run `dreamboard login` to authenticate again.",
    );
  });

  await expect(
    newCommand.run({
      args: {
        slug: "test-game",
        description: "A test game",
        force: false,
      },
    }),
  ).rejects.toThrow("Run `dreamboard login` to authenticate again.");

  expect(createGame).not.toHaveBeenCalled();
  expect(applyWorkspaceCodegen).not.toHaveBeenCalled();
  expect(installWorkspaceDependencies).not.toHaveBeenCalled();
});
