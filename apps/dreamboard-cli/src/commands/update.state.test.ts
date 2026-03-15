import { expect, test } from "bun:test";
import { authoringCommandTestHarness } from "../test-support/authoring-command-test-harness.ts";

const updateCommand = (await import("./update.ts")).default;

function currentState() {
  return authoringCommandTestHarness.current;
}

test("update clears compiled result metadata when manifest or rule content changes", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: ["manifest.json", "rule.md"],
    added: [],
    deleted: [],
  };
  state.loadManifestResult = {
    stateMachine: {
      states: [{ name: "setup" }, { name: "review" }],
    },
  };
  state.loadRuleResult = "# Updated rule\n";
  state.saveRuleSdkResult = {
    ruleId: "rule-2",
  };
  state.saveManifestSdkResult = {
    manifestId: "manifest-2",
    contentHash: "content-hash-2",
  };
  state.collectLocalFilesResult = {
    "app/phases/setup.ts": "export const phase = {}\n",
    "app/phases/review.ts": "export const phase = {}\n",
  };

  await updateCommand.run({
    args: {
      env: "local",
      "update-sdk": false,
      yes: false,
      pull: false,
    },
  });

  expect(state.calls.saveRuleSdk).toEqual([
    {
      gameId: "game-1",
      ruleText: "# Updated rule\n",
    },
  ]);
  expect(state.calls.saveManifestSdk).toEqual([
    {
      gameId: "game-1",
      manifest: {
        stateMachine: {
          states: [{ name: "setup" }, { name: "review" }],
        },
      },
      ruleId: "rule-2",
    },
  ]);
  expect(state.calls.updateProjectState[0]?.config).toEqual({
    gameId: "game-1",
    slug: "test-game",
    ruleId: "rule-2",
    manifestId: "manifest-2",
    manifestContentHash: "content-hash-2",
    resultId: undefined,
    sourceRevisionId: undefined,
    sourceTreeHash: undefined,
  });
});

test("update preserves compiled result metadata when it is only regenerating scaffold files", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: [],
    added: [],
    deleted: [],
  };
  state.isManifestDifferentFromServerResult = false;
  state.scaffoldWriteResult = {
    written: [],
    skipped: [],
  };
  state.collectLocalFilesResult = {
    "app/phases/setup.ts": "export const phase = {}\n",
  };

  await updateCommand.run({
    args: {
      env: "local",
      "update-sdk": false,
      yes: false,
      pull: false,
    },
  });

  expect(state.calls.saveRuleSdk).toHaveLength(0);
  expect(state.calls.saveManifestSdk).toHaveLength(0);
  expect(state.calls.updateProjectState[0]?.config).toEqual({
    gameId: "game-1",
    slug: "test-game",
    ruleId: "rule-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    resultId: "result-1",
    sourceRevisionId: "source-revision-1",
    sourceTreeHash: "tree-hash-1",
  });
});
