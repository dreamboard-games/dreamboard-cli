import { expect, mock, test } from "bun:test";

const updateProjectState = mock(async () => undefined);
const writeManifest = mock(async () => undefined);
const writeRule = mock(async () => undefined);
const writeSnapshot = mock(async () => undefined);
const writeSourceFiles = mock(async () => undefined);
const removeExtraneousFiles = mock(async () => undefined);

mock.module("@dreamboard/api-client", () => ({
  getLatestCompiledResult: mock(async () => ({
    data: {
      id: "result-2",
    },
  })),
  getGameSources: mock(async () => ({
    data: {
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
}));

mock.module("../../config/project-config.js", () => ({
  updateProjectState,
}));

mock.module("./local-files.js", () => ({
  collectLocalFiles: async () => ({}),
  removeExtraneousFiles,
  writeManifest,
  writeRule,
  writeSnapshot,
  writeSourceFiles,
}));

const { pullIntoDirectory } = await import("./sync.ts");

test("pullIntoDirectory hydrates source revision and tree hash from the latest compiled result", async () => {
  await pullIntoDirectory(
    {
      apiBaseUrl: "https://api.example.com",
      webBaseUrl: "https://web.example.com",
      authToken: "token",
    },
    "/tmp/dreamboard-project",
    {
      gameId: "game-1",
      slug: "test-game",
      manifestId: "manifest-1",
      ruleId: "rule-1",
    },
  );

  expect(writeSourceFiles).toHaveBeenCalledWith("/tmp/dreamboard-project", {
    "app/phases/setup.ts": "export const phase = {}\n",
  });
  expect(writeManifest).toHaveBeenCalledWith("/tmp/dreamboard-project", {
    stateMachine: {
      states: [{ name: "setup" }],
    },
  });
  expect(writeRule).toHaveBeenCalledWith(
    "/tmp/dreamboard-project",
    "# Remote rule\n",
  );
  expect(updateProjectState).toHaveBeenCalledWith("/tmp/dreamboard-project", {
    gameId: "game-1",
    slug: "test-game",
    manifestId: "manifest-2",
    ruleId: "rule-2",
    resultId: "result-2",
    sourceRevisionId: "source-revision-2",
    sourceTreeHash: "tree-hash-2",
  });
  expect(writeSnapshot).toHaveBeenCalledWith("/tmp/dreamboard-project");
});
