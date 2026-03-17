import path from "node:path";
import { expect, mock, test } from "bun:test";

mock.restore();

let authoringHeadData: {
  authoringStateId: string;
  sourceRevisionId: string;
  sourceTreeHash: string;
  manifestId: string;
  manifestContentHash: string;
  ruleId: string;
} | null = {
  authoringStateId: "authoring-1",
  sourceRevisionId: "source-revision-1",
  sourceTreeHash: "tree-hash-1",
  manifestId: "manifest-1",
  manifestContentHash: "content-hash",
  ruleId: "rule-1",
};
const pullIntoDirectory = mock(async () => undefined);
const writeScaffoldFiles = mock(async () => undefined);
const actualApiClient = await import("@dreamboard/api-client");
const actualFlags = await import("../flags.js");
const actualFs = await import("../utils/fs.js");
const actualLocalFiles = await import("../services/project/local-files.js");
const actualSync = await import("../services/project/sync.js");
const actualStrings = await import("../utils/strings.js");

mock.module("@dreamboard/api-client", () => ({
  ...actualApiClient,
  createGame: mock(async () => ({
    data: { id: "game-1" },
    error: null,
    response: { status: 200 },
  })),
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
  getGameSources: mock(async () => ({
    data: {
      authoringStateId: "authoring-state-2",
      files: {
        "app/phases/setup.ts": "export const phase = {}\n",
      },
      sourceRevisionId: "source-revision-2",
      treeHash: "tree-hash-2",
      manifestId: "manifest-2",
      manifest: {
        stateMachine: {
          states: [{ name: "setup" }],
        },
      },
      ruleId: "rule-2",
      ruleText: "# Remote rule\n",
    },
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
  findManifests: mock(async () => ({
    data: { currentManifestId: "manifest-1" },
  })),
  scaffoldGameSourcesV3: mock(async () => ({
    data: {
      generatedFiles: {
        "C:/temp/outside.ts": "bad",
      },
      seedFiles: {},
    },
    error: null,
    response: { status: 200 },
  })),
}));

mock.module("../config/resolve.js", () => ({
  resolveConfig: () => ({
    apiBaseUrl: "https://api.example.com",
    webBaseUrl: "https://web.example.com",
    token: "token",
  }),
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
  configureClient: async () => undefined,
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
}));

mock.module("../services/api/index.js", () => ({
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
  getAuthoringHeadSdk: async () => authoringHeadData,
  findCompiledResultsForAuthoringState: async () => [
    {
      id: "result-2",
      authoringStateId: "authoring-1",
      success: true,
    },
  ],
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
  writeScaffoldFiles,
}));

mock.module("../config/project-config.js", () => ({
  updateProjectState: async () => undefined,
}));

mock.module("../services/project/sync.js", () => ({
  ...actualSync,
  pullIntoDirectory,
}));

mock.module("../services/project/static-scaffold.js", () => ({
  scaffoldStaticWorkspace: async () => undefined,
}));

mock.module("../utils/errors.js", () => ({
  formatApiError: () => "api error",
}));

const cloneCommand = (await import("./clone.ts")).default;

test("clone command rejects invalid scaffold payloads before writing files", async () => {
  authoringHeadData = null;

  await expect(
    cloneCommand.run({
      args: {
        slug: "test-game",
      },
    }),
  ).rejects.toThrow("Invalid scaffold payload");

  expect(writeScaffoldFiles).not.toHaveBeenCalled();
});

test("clone uses the compiled-result sync path when the project already has a remote result", async () => {
  authoringHeadData = {
    authoringStateId: "authoring-1",
    sourceRevisionId: "source-revision-1",
    sourceTreeHash: "tree-hash-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash",
    ruleId: "rule-1",
  };
  pullIntoDirectory.mockImplementation(async () => ({
    gameId: "game-1",
    slug: "test-game",
    apiBaseUrl: "https://api.example.com",
    webBaseUrl: "https://web.example.com",
    authoring: {
      authoringStateId: "authoring-1",
      sourceRevisionId: "source-revision-1",
      sourceTreeHash: "tree-hash-1",
      manifestId: "manifest-1",
      manifestContentHash: "content-hash",
      ruleId: "rule-1",
    },
  }));

  await cloneCommand.run({
    args: {
      slug: "test-game",
    },
  });

  expect(pullIntoDirectory).toHaveBeenCalledWith(
    {
      apiBaseUrl: "https://api.example.com",
      webBaseUrl: "https://web.example.com",
      token: "token",
    },
    path.resolve(process.cwd(), "test-game"),
    {
      gameId: "game-1",
      slug: "test-game",
      apiBaseUrl: "https://api.example.com",
      webBaseUrl: "https://web.example.com",
    },
  );
  expect(writeScaffoldFiles).not.toHaveBeenCalled();
});
