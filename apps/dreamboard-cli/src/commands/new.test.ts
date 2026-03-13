import { expect, mock, test } from "bun:test";

const writeScaffoldFiles = mock(async () => undefined);
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
      generatedFiles: {
        "../outside.ts": "bad",
      },
      seedFiles: {},
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

mock.module("../config/global-config.js", () => ({
  loadGlobalConfig: async () => ({}),
}));

mock.module("../utils/strings.js", () => ({
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
  tryGetGameBySlug: async () => null,
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
  writeManifest: async () => undefined,
  writeRule: async () => undefined,
  writeSnapshotFromFiles: async () => undefined,
  writeScaffoldFiles,
}));

mock.module("../config/project-config.js", () => ({
  updateProjectState: async () => undefined,
}));

mock.module("../utils/errors.js", () => ({
  formatApiError: () => "api error",
}));

const newCommand = (await import("./new.ts")).default;

test("new command rejects invalid scaffold payloads before writing files", async () => {
  await expect(
    newCommand.run({
      args: {
        slug: "test-game",
        description: "A test game",
        force: false,
      },
    }),
  ).rejects.toThrow("Invalid scaffold payload");

  expect(writeScaffoldFiles).not.toHaveBeenCalled();
});
