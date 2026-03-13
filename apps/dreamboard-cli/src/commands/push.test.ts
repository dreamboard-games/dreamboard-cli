import { expect, mock, test } from "bun:test";

const uploadFileOverrides = mock(async () => []);
const updateProjectState = mock(async () => undefined);
const writeSnapshot = mock(async () => undefined);
const assertCliStaticScaffoldComplete = mock(async () => undefined);
const actualFlags = await import("../flags.js");

mock.module("@dreamboard/api-client", () => ({
  getLatestCompiledResult: mock(async () => ({
    data: null,
  })),
  getGameSources: mock(async () => ({
    data: { files: {} },
  })),
  recompileGame: mock(async () => ({
    data: {
      result: {
        id: "result-1",
        success: true,
        sourceKey: "source-key",
      },
    },
    error: null,
    response: { status: 200 },
  })),
}));

mock.module("../config/resolve.js", () => ({
  resolveProjectContext: async () => ({
    projectRoot: "/tmp/dreamboard-project",
    projectConfig: {
      gameId: "game-1",
      manifestId: "manifest-1",
      ruleId: "rule-1",
      manifestContentHash: "content-hash",
      remoteBaseResultId: undefined,
      resultId: undefined,
      serverUserFiles: [],
    },
    config: {
      apiBaseUrl: "http://127.0.0.1:8080",
      authToken: "token",
      supabaseUrl: "http://127.0.0.1:54321",
      supabaseAnonKey: "anon-key",
    },
  }),
}));

mock.module("../flags.js", () => ({
  ...actualFlags,
  parsePushCommandArgs: (args: Record<string, unknown>) => args,
}));

mock.module("../services/project/local-files.js", () => ({
  getLocalDiff: async () => ({
    modified: ["app/phases/placeThing.ts"],
    added: [],
    deleted: [],
  }),
  collectLocalFiles: async () => ({
    "package.json": '{"name":"test"}\n',
    "shared/index.ts": "export {}\n",
    "app/phases/placeThing.ts": "export const phase = {}\n",
  }),
  isAllowedGamePath: () => true,
  isLibraryPath: () => false,
  loadManifest: async () => ({}),
  loadRule: async () => "",
  writeSnapshot,
}));

mock.module("../services/project/scaffold-ownership.js", () => ({
  PRESERVED_USER_FILES: new Set<string>(),
}));

mock.module("../services/project/static-scaffold.js", () => ({
  assertCliStaticScaffoldComplete,
}));

mock.module("../services/api/index.js", () => ({
  saveManifestSdk: async () => ({
    manifestId: "manifest-1",
    contentHash: "content-hash",
  }),
  saveRuleSdk: async () => ({
    ruleId: "rule-1",
  }),
  getLatestRuleIdSdk: async () => "rule-1",
  findLatestSuccessfulCompiledResult: async () => null,
}));

mock.module("../services/storage/supabase-storage.js", () => ({
  uploadFileOverrides,
}));

mock.module("../config/project-config.js", () => ({
  updateProjectState,
}));

mock.module("../utils/errors.js", () => ({
  formatApiError: () => "api error",
}));

const pushCommand = (await import("./push.ts")).default;

test("push performs a full-source upload when no successful remote result exists", async () => {
  await pushCommand.run({
    args: {
      env: "local",
    },
  });

  expect(assertCliStaticScaffoldComplete).toHaveBeenCalled();
  expect(uploadFileOverrides).toHaveBeenCalledWith(
    expect.anything(),
    "/tmp/dreamboard-project",
    "game-1",
    ["package.json", "shared/index.ts", "app/phases/placeThing.ts"],
  );
  expect(updateProjectState).toHaveBeenCalled();
  expect(writeSnapshot).toHaveBeenCalled();
});
