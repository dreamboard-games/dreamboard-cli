import { beforeEach, expect, test } from "bun:test";
import {
  authoringCommandTestHarness,
  resetAuthoringCommandTestHarness,
} from "../test-support/authoring-command-test-harness.ts";

const syncCommand = (await import("./sync.ts")).default;

function currentState() {
  return authoringCommandTestHarness.current;
}

beforeEach(() => {
  resetAuthoringCommandTestHarness();
});

test("sync uploads authored changes and advances authoring state without compiling", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: ["app/phases/setup.ts"],
    added: [],
    deleted: [],
  };
  state.collectLocalFilesResult = {
    "app/phases/setup.ts": "export const updatedPhase = true;\n",
  };
  state.getAuthoringHeadSdkResult = {
    ...state.getAuthoringHeadSdkResult!,
    authoringStateId: "authoring-1",
    sourceRevisionId: "source-revision-1",
    treeHash: "tree-hash-1",
  };
  state.createSourceRevisionResult = {
    id: "source-revision-2",
    treeHash: "tree-hash-2",
  };
  state.createAuthoringStateResult = {
    ...state.createAuthoringStateResult,
    authoringStateId: "authoring-2",
    sourceRevisionId: "source-revision-2",
    treeHash: "tree-hash-2",
    sourceTreeHash: "tree-hash-2",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    ruleId: "rule-1",
  };

  await syncCommand.run({
    args: {
      env: "local",
      force: false,
      "update-sdk": false,
      yes: false,
    },
  });

  expect(state.calls.createSourceRevisionSdk).toHaveLength(1);
  expect(state.calls.createAuthoringStateSdk).toEqual([
    {
      gameId: "game-1",
      request: {
        baseAuthoringStateId: "authoring-1",
        sourceRevisionId: "source-revision-2",
        sourceTreeHash: "tree-hash-2",
        manifestId: "manifest-1",
        manifestContentHash: "content-hash-1",
        ruleId: "rule-1",
      },
    },
  ]);
  expect(state.calls.queueCompiledResultJobSdk).toHaveLength(0);
  expect(state.projectConfig.authoring).toEqual({
    authoringStateId: "authoring-2",
    sourceRevisionId: "source-revision-2",
    sourceTreeHash: "tree-hash-2",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    ruleId: "rule-1",
  });
});

test("sync creates the first authored state even when a new workspace has no local diff yet", async () => {
  const state = currentState();
  state.projectConfig.authoring = {};
  state.projectConfig.compile = {};
  state.getAuthoringHeadSdkResult = null;
  state.getLocalDiffResult = {
    modified: [],
    added: [],
    deleted: [],
  };
  state.createAuthoringStateResult = {
    ...state.createAuthoringStateResult,
    authoringStateId: "authoring-1",
    sourceRevisionId: "source-revision-2",
    treeHash: "tree-hash-2",
    sourceTreeHash: "tree-hash-2",
    manifestId: "manifest-2",
    manifestContentHash: "content-hash-2",
    ruleId: "rule-1",
  };

  await syncCommand.run({
    args: {
      env: "local",
      force: false,
      "update-sdk": false,
      yes: false,
    },
  });

  expect(state.calls.createSourceRevisionSdk).toEqual([
    {
      gameId: "game-1",
      request: {
        mode: "replace",
        changes: [
          {
            kind: "upsert",
            path: "app/phases/setup.ts",
            content: "export const phase = {}\n",
          },
        ],
      },
    },
  ]);
  expect(state.calls.createAuthoringStateSdk).toEqual([
    {
      gameId: "game-1",
      request: {
        sourceRevisionId: "source-revision-2",
        sourceTreeHash: "tree-hash-2",
        manifestId: "manifest-2",
        manifestContentHash: "content-hash-2",
        ruleId: "rule-1",
      },
    },
  ]);
  expect(
    state.consoleCalls.some(
      (call) =>
        call.level === "info" &&
        call.args.includes("No local authored changes to sync."),
    ),
  ).toBe(false);
  expect(state.projectConfig.authoring).toEqual({
    authoringStateId: "authoring-1",
    sourceRevisionId: "source-revision-2",
    sourceTreeHash: "tree-hash-2",
    manifestId: "manifest-2",
    manifestContentHash: "content-hash-2",
    ruleId: "rule-1",
  });
});
