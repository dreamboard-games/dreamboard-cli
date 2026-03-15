import { expect, mock, test } from "bun:test";

const writeScaffoldFiles = mock(async () => ({
  written: [],
  skipped: [],
}));
const actualFlags = await import("../flags.js");
const actualFs = await import("../utils/fs.js");
const actualLocalFiles = await import("../services/project/local-files.js");

mock.module("@dreamboard/api-client", () => ({
  createGame: mock(async () => ({
    data: { id: "game-1" },
    error: null,
    response: { status: 200 },
  })),
  deleteGame: mock(async () => ({
    error: null,
    response: { status: 204 },
  })),
  scaffoldGameSourcesV3: mock(async () => ({
    data: {
      generatedFiles: {},
      seedFiles: {
        "app\\phases\\setup.ts": "bad",
      },
    },
    error: null,
    response: { status: 200 },
  })),
  getGameBySlug: mock(async () => ({
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
  parseUpdateCommandArgs: (args: Record<string, unknown>) => args,
  parseCloneCommandArgs: (args: Record<string, unknown>) => args,
}));

mock.module("../config/project-config.js", () => ({
  updateProjectState: async () => undefined,
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
    stateMachine: {
      states: [{ name: "setup" }],
    },
  }),
  loadRule: async () => "",
  writeScaffoldFiles,
  writeManifest: async () => undefined,
  writeSnapshotFromFiles: async () => undefined,
}));

mock.module("../utils/fs.js", () => ({
  ...actualFs,
  ensureDir: async () => undefined,
  installSkillFile: async () => undefined,
  readTextFileIfExists: async () => null,
  writeTextFile: async () => undefined,
}));

mock.module("../services/project/sync.js", () => ({
  buildRemoteAlignedSnapshotFiles: (options: {
    localFiles: Record<string, string>;
  }) => options.localFiles,
  fetchLatestRemoteSources: async () => null,
  reconcileRemoteChangesIntoWorkspace: async () => ({
    latest: {
      resultId: "result-1",
      files: {},
      sourceRevisionId: "source-revision-1",
      treeHash: "tree-hash-1",
    },
    remoteUserFiles: {},
    written: [],
    deleted: [],
    conflicts: [],
  }),
}));

mock.module("../services/api/index.js", () => ({
  tryGetGameBySlug: async () => null,
  getLatestManifestIdSdk: async () => "manifest-1",
  getManifestSdk: async () => ({
    contentHash: "content-hash",
  }),
  isManifestDifferentFromServer: async () => false,
  saveManifestSdk: async () => ({
    manifestId: "manifest-1",
    contentHash: "content-hash",
  }),
  saveRuleSdk: async () => ({
    ruleId: "rule-1",
  }),
  getLatestRuleIdSdk: async () => "rule-1",
}));

mock.module("../config/global-config.js", () => ({
  loadGlobalConfig: async () => ({}),
}));

mock.module("../utils/strings.js", () => ({
  normalizeSlug: (value: string) => value,
  titleFromSlug: () => "Test Game",
}));

mock.module("../utils/errors.js", () => ({
  formatApiError: () => "api error",
}));

mock.module("../utils/prompts.js", () => ({
  confirmPrompt: async () => true,
}));

const updateCommand = (await import("./update.ts")).default;

test("update command rejects invalid scaffold payloads before writing files", async () => {
  await expect(
    updateCommand.run({
      args: {
        "update-sdk": false,
        yes: false,
      },
    }),
  ).rejects.toThrow("Invalid scaffold payload");

  expect(writeScaffoldFiles).not.toHaveBeenCalled();
});
