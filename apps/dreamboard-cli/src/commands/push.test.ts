import { expect, test } from "bun:test";
import { authoringCommandTestHarness } from "../test-support/authoring-command-test-harness.ts";

const pushCommand = (await import("./push.ts")).default;

function currentState() {
  return authoringCommandTestHarness.current;
}

function consoleMessages(level: "error" | "info" | "log" | "success" | "warn") {
  return currentState()
    .consoleCalls.filter((call) => call.level === level)
    .map((call) => call.args.map(String).join(" "));
}

test("push returns early when local state already matches the latest successful result", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: [],
    added: [],
    deleted: [],
  };
  state.projectConfig.resultId = "result-1";
  state.findLatestSuccessfulCompiledResultResult = { id: "result-1" };

  await pushCommand.run({
    args: {
      env: "local",
    },
  });

  expect(state.calls.assertCliStaticScaffoldComplete).toHaveLength(0);
  expect(state.calls.createSourceRevisionSdk).toHaveLength(0);
  expect(state.calls.createCompiledResultSdk).toHaveLength(0);
  expect(state.calls.updateProjectState).toHaveLength(0);
  expect(consoleMessages("info")).toContain("No local changes to push.");
});

test("push rejects when the remote base is unknown locally", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: ["app/phases/setup.ts"],
    added: [],
    deleted: [],
  };
  state.projectConfig.resultId = undefined;
  state.projectConfig.sourceRevisionId = undefined;
  state.getLatestCompiledResultResponse = {
    data: {
      id: "result-remote",
      sourceRevisionId: "source-revision-remote",
    },
    error: null,
    response: { status: 200 },
  };

  await expect(
    pushCommand.run({
      args: {
        env: "local",
      },
    }),
  ).rejects.toThrow("Remote base is unknown.");

  expect(state.calls.assertCliStaticScaffoldComplete).toEqual([
    {
      projectRoot: "/tmp/dreamboard-project",
      deletedPaths: [],
    },
  ]);
  expect(state.calls.createSourceRevisionSdk).toHaveLength(0);
  expect(state.calls.createCompiledResultSdk).toHaveLength(0);
  expect(state.calls.updateProjectState).toHaveLength(0);
  expect(state.calls.writeSnapshot).toHaveLength(0);
});

test("push rejects when the remote latest result differs from the local base", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: ["app/phases/setup.ts"],
    added: [],
    deleted: [],
  };
  state.projectConfig.resultId = "result-1";
  state.getLatestCompiledResultResponse = {
    data: {
      id: "result-2",
      sourceRevisionId: "source-revision-2",
    },
    error: null,
    response: { status: 200 },
  };

  await expect(
    pushCommand.run({
      args: {
        env: "local",
      },
    }),
  ).rejects.toThrow("Remote drift detected.");

  expect(state.calls.createSourceRevisionSdk).toHaveLength(0);
  expect(state.calls.createCompiledResultSdk).toHaveLength(0);
  expect(state.calls.updateProjectState).toHaveLength(0);
  expect(state.calls.writeSnapshot).toHaveLength(0);
});

test("push performs a full-source upload when no remote result exists", async () => {
  const state = currentState();
  state.projectConfig.resultId = undefined;
  state.projectConfig.sourceRevisionId = undefined;
  state.findLatestSuccessfulCompiledResultResult = null;
  state.getLatestCompiledResultResponse = {
    data: null,
    error: null,
    response: { status: 404 },
  };
  state.getLocalDiffResult = {
    modified: ["app/phases/placeThing.ts"],
    added: [],
    deleted: [],
  };
  state.collectLocalFilesResult = {
    "package.json": '{"name":"test"}\n',
    "shared/index.ts": "export {}\n",
    "app/phases/placeThing.ts": "export const phase = {}\n",
    "manifest.json": "{}\n",
    "rule.md": "rule text\n",
  };
  state.createCompiledResultResult = {
    id: "result-1",
    success: true,
    sourceRevisionId: "source-revision-1",
  };
  state.createSourceRevisionResult = {
    id: "source-revision-1",
    treeHash: "tree-hash-1",
  };

  await pushCommand.run({
    args: {
      env: "local",
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
            path: "app/phases/placeThing.ts",
            content: "export const phase = {}\n",
          },
          {
            kind: "upsert",
            path: "package.json",
            content: '{"name":"test"}\n',
          },
          {
            kind: "upsert",
            path: "shared/index.ts",
            content: "export {}\n",
          },
        ],
      },
    },
  ]);
  expect(state.calls.updateProjectState).toEqual([
    {
      rootDir: "/tmp/dreamboard-project",
      config: {
        gameId: "game-1",
        slug: "test-game",
        ruleId: "rule-1",
        manifestId: "manifest-1",
        manifestContentHash: "content-hash-1",
        resultId: undefined,
        sourceRevisionId: "source-revision-1",
        sourceTreeHash: "tree-hash-1",
      },
    },
    {
      rootDir: "/tmp/dreamboard-project",
      config: {
        gameId: "game-1",
        slug: "test-game",
        ruleId: "rule-1",
        manifestId: "manifest-1",
        manifestContentHash: "content-hash-1",
        resultId: "result-1",
        sourceRevisionId: "source-revision-1",
        sourceTreeHash: "tree-hash-1",
      },
    },
  ]);
  expect(state.calls.writeSnapshot).toEqual(["/tmp/dreamboard-project"]);
});

test("push uploads an empty source revision when source metadata is missing but only manifest metadata changed", async () => {
  const state = currentState();
  state.projectConfig.resultId = undefined;
  state.projectConfig.sourceRevisionId = undefined;
  state.projectConfig.manifestId = "manifest-1";
  state.projectConfig.ruleId = "rule-1";
  state.findLatestSuccessfulCompiledResultResult = null;
  state.getLatestCompiledResultResponse = {
    data: null,
    error: null,
    response: { status: 404 },
  };
  state.getLocalDiffResult = {
    modified: ["manifest.json"],
    added: [],
    deleted: [],
  };
  state.collectLocalFilesResult = {
    "manifest.json": "{}\n",
    "rule.md": "rule text\n",
  };
  state.createSourceRevisionResult = {
    id: "source-revision-bootstrap",
    treeHash: "tree-hash-bootstrap",
  };
  state.createCompiledResultResult = {
    id: "result-bootstrap",
    success: true,
    sourceRevisionId: "source-revision-bootstrap",
  };

  await pushCommand.run({
    args: {
      env: "local",
    },
  });

  expect(state.calls.createSourceRevisionSdk).toEqual([
    {
      gameId: "game-1",
      request: {
        mode: "replace",
        changes: [],
      },
    },
  ]);
  expect(state.calls.createCompiledResultSdk[0]?.sourceRevisionId).toBe(
    "source-revision-bootstrap",
  );
});

test("push creates an incremental source revision from modified added and deleted authored files only", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: ["app/phases/setup.ts"],
    added: ["shared/new.ts"],
    deleted: ["rule.md", "ui/removed.ts"],
  };
  state.collectLocalFilesResult = {
    "app/phases/setup.ts": "export const phase = 'updated';\n",
    "shared/new.ts": "export const added = true;\n",
    "manifest.json": "{}\n",
    "rule.md": "rule text\n",
  };
  state.createCompiledResultResult = {
    id: "result-2",
    success: true,
    sourceRevisionId: "source-revision-2",
  };
  state.createSourceRevisionResult = {
    id: "source-revision-2",
    treeHash: "tree-hash-2",
  };

  await pushCommand.run({
    args: {
      env: "local",
    },
  });

  expect(state.calls.createSourceRevisionSdk).toEqual([
    {
      gameId: "game-1",
      request: {
        baseSourceRevisionId: "source-revision-1",
        mode: "incremental",
        changes: [
          {
            kind: "upsert",
            path: "app/phases/setup.ts",
            content: "export const phase = 'updated';\n",
          },
          {
            kind: "upsert",
            path: "shared/new.ts",
            content: "export const added = true;\n",
          },
          {
            kind: "delete",
            path: "ui/removed.ts",
          },
        ],
      },
    },
  ]);
});

test("push reuses the stored source revision when only manifest or rule content changed", async () => {
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
  state.createCompiledResultResult = {
    id: "result-2",
    success: true,
    sourceRevisionId: "source-revision-1",
  };

  await pushCommand.run({
    args: {
      env: "local",
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
  expect(state.calls.createSourceRevisionSdk).toHaveLength(0);
  expect(state.calls.createCompiledResultSdk).toEqual([
    {
      gameId: "game-1",
      sourceRevisionId: "source-revision-1",
      manifestId: "manifest-2",
      ruleId: "rule-2",
    },
  ]);
  expect(state.calls.updateProjectState).toEqual([
    {
      rootDir: "/tmp/dreamboard-project",
      config: {
        gameId: "game-1",
        slug: "test-game",
        ruleId: "rule-2",
        manifestId: "manifest-2",
        manifestContentHash: "content-hash-2",
        resultId: "result-1",
        sourceRevisionId: "source-revision-1",
        sourceTreeHash: "tree-hash-1",
      },
    },
    {
      rootDir: "/tmp/dreamboard-project",
      config: {
        gameId: "game-1",
        slug: "test-game",
        ruleId: "rule-2",
        manifestId: "manifest-2",
        manifestContentHash: "content-hash-2",
        resultId: "result-2",
        sourceRevisionId: "source-revision-1",
        sourceTreeHash: "tree-hash-1",
      },
    },
  ]);
});

test("push forces a replace upload even when there is no local diff", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: [],
    added: [],
    deleted: [],
  };
  state.findLatestSuccessfulCompiledResultResult = {
    id: "result-1",
  };
  state.collectLocalFilesResult = {
    "package.json": '{"name":"test"}\n',
    "shared/index.ts": "export {}\n",
    "app/phases/setup.ts": "export const phase = {}\n",
  };
  state.createCompiledResultResult = {
    id: "result-2",
    success: true,
    sourceRevisionId: "source-revision-force",
  };
  state.createSourceRevisionResult = {
    id: "source-revision-force",
    treeHash: "tree-hash-force",
  };

  await pushCommand.run({
    args: {
      env: "local",
      force: true,
    },
  });

  expect(state.calls.createSourceRevisionSdk).toEqual([
    {
      gameId: "game-1",
      request: {
        baseSourceRevisionId: "source-revision-1",
        mode: "replace",
        changes: [
          {
            kind: "upsert",
            path: "app/phases/setup.ts",
            content: "export const phase = {}\n",
          },
          {
            kind: "upsert",
            path: "package.json",
            content: '{"name":"test"}\n',
          },
          {
            kind: "upsert",
            path: "shared/index.ts",
            content: "export {}\n",
          },
        ],
      },
    },
  ]);
});

test("push does not update project state when source revision creation fails", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: ["app/phases/setup.ts"],
    added: [],
    deleted: [],
  };
  state.createSourceRevisionError = new Error("source revision request failed");

  await expect(
    pushCommand.run({
      args: {
        env: "local",
      },
    }),
  ).rejects.toThrow("source revision request failed");

  expect(state.calls.createSourceRevisionSdk).toHaveLength(1);
  expect(state.calls.createCompiledResultSdk).toHaveLength(0);
  expect(state.calls.updateProjectState).toHaveLength(0);
  expect(state.calls.writeSnapshot).toHaveLength(0);
});

test("push checkpoints remote authoring state when compiled result creation throws", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: ["app/phases/setup.ts", "manifest.json", "rule.md"],
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
  state.createSourceRevisionResult = {
    id: "source-revision-2",
    treeHash: "tree-hash-2",
  };
  state.createCompiledResultError = new Error("compiled result request failed");

  await expect(
    pushCommand.run({
      args: {
        env: "local",
      },
    }),
  ).rejects.toThrow("compiled result request failed");

  expect(state.calls.createSourceRevisionSdk).toHaveLength(1);
  expect(state.calls.createCompiledResultSdk).toHaveLength(1);
  expect(state.calls.updateProjectState).toEqual([
    {
      rootDir: "/tmp/dreamboard-project",
      config: {
        gameId: "game-1",
        slug: "test-game",
        ruleId: "rule-2",
        manifestId: "manifest-2",
        manifestContentHash: "content-hash-2",
        resultId: "result-1",
        sourceRevisionId: "source-revision-2",
        sourceTreeHash: "tree-hash-2",
      },
    },
  ]);
  expect(state.calls.writeSnapshot).toHaveLength(0);
});

test("push persists failed compile state, writes a snapshot, and prints diagnostics", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: ["app/phases/setup.ts"],
    added: [],
    deleted: [],
  };
  state.createSourceRevisionResult = {
    id: "source-revision-2",
    treeHash: "tree-hash-2",
  };
  state.createCompiledResultResult = {
    id: "result-failed",
    success: false,
    sourceRevisionId: "source-revision-2",
    diagnostics: [
      {
        type: "file",
        file: "app/phases/setup.ts",
        line: 12,
        column: 4,
        message: "Type 'number' is not assignable to type 'string'.",
      },
      {
        type: "general",
        category: "compiler",
        message: "Build failed",
        context: {
          file: "ui/App.tsx",
          details: "Harness compile failure details",
        },
      },
    ],
  };

  await expect(
    pushCommand.run({
      args: {
        env: "local",
      },
    }),
  ).rejects.toThrow("Compilation failed. Fix diagnostics and push again.");

  expect(state.calls.updateProjectState).toEqual([
    {
      rootDir: "/tmp/dreamboard-project",
      config: {
        gameId: "game-1",
        slug: "test-game",
        ruleId: "rule-1",
        manifestId: "manifest-1",
        manifestContentHash: "content-hash-1",
        resultId: "result-1",
        sourceRevisionId: "source-revision-2",
        sourceTreeHash: "tree-hash-2",
      },
    },
    {
      rootDir: "/tmp/dreamboard-project",
      config: {
        gameId: "game-1",
        slug: "test-game",
        ruleId: "rule-1",
        manifestId: "manifest-1",
        manifestContentHash: "content-hash-1",
        resultId: "result-failed",
        sourceRevisionId: "source-revision-2",
        sourceTreeHash: "tree-hash-2",
      },
    },
  ]);
  expect(state.calls.writeSnapshot).toEqual(["/tmp/dreamboard-project"]);
  expect(consoleMessages("error")).toContain(
    "Compilation failed with 2 diagnostic(s):\n",
  );
  expect(consoleMessages("log")).toContain(
    "  app/phases/setup.ts:12:4  Type 'number' is not assignable to type 'string'.",
  );
  expect(consoleMessages("log")).toContain(
    "  [compiler] (ui/App.tsx) Build failed",
  );
  expect(consoleMessages("log")).toContain(
    "    Harness compile failure details",
  );
});

test("push retries a failed compile without re-uploading sources when local files are unchanged", async () => {
  const state = currentState();
  state.projectConfig.resultId = "result-failed";
  state.projectConfig.sourceRevisionId = "source-revision-failed";
  state.projectConfig.sourceTreeHash = "tree-hash-failed";
  state.getLocalDiffResult = {
    modified: [],
    added: [],
    deleted: [],
  };
  state.findLatestSuccessfulCompiledResultResult = {
    id: "result-1",
  };
  state.getLatestCompiledResultResponse = {
    data: {
      id: "result-failed",
      sourceRevisionId: "source-revision-failed",
    },
    error: null,
    response: { status: 200 },
  };
  state.createCompiledResultResult = {
    id: "result-retry-success",
    success: true,
    sourceRevisionId: "source-revision-failed",
  };

  await pushCommand.run({
    args: {
      env: "local",
    },
  });

  expect(state.calls.createSourceRevisionSdk).toHaveLength(0);
  expect(state.calls.createCompiledResultSdk).toEqual([
    {
      gameId: "game-1",
      sourceRevisionId: "source-revision-failed",
      manifestId: "manifest-1",
      ruleId: "rule-1",
    },
  ]);
  expect(state.calls.updateProjectState[0]?.config).toEqual({
    gameId: "game-1",
    slug: "test-game",
    ruleId: "rule-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    resultId: "result-retry-success",
    sourceRevisionId: "source-revision-failed",
    sourceTreeHash: "tree-hash-failed",
  });
});

test("push retries a thrown compile using the checkpointed source revision as the next base", async () => {
  const state = currentState();
  state.projectConfig.resultId = "result-1";
  state.projectConfig.sourceRevisionId = "source-revision-2";
  state.projectConfig.sourceTreeHash = "tree-hash-2";
  state.getLocalDiffResult = {
    modified: ["app/phases/setup.ts"],
    added: [],
    deleted: [],
  };
  state.findLatestSuccessfulCompiledResultResult = {
    id: "result-1",
  };
  state.getLatestCompiledResultResponse = {
    data: {
      id: "result-1",
      sourceRevisionId: "source-revision-1",
    },
    error: null,
    response: { status: 200 },
  };
  state.createSourceRevisionResult = {
    id: "source-revision-2",
    treeHash: "tree-hash-2",
  };
  state.createCompiledResultResult = {
    id: "result-2",
    success: true,
    sourceRevisionId: "source-revision-2",
  };

  await pushCommand.run({
    args: {
      env: "local",
    },
  });

  expect(state.calls.createSourceRevisionSdk).toEqual([
    {
      gameId: "game-1",
      request: {
        baseSourceRevisionId: "source-revision-2",
        mode: "incremental",
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
  expect(state.calls.createCompiledResultSdk).toEqual([
    {
      gameId: "game-1",
      sourceRevisionId: "source-revision-2",
      manifestId: "manifest-1",
      ruleId: "rule-1",
    },
  ]);
  expect(state.calls.updateProjectState[0]?.config).toEqual({
    gameId: "game-1",
    slug: "test-game",
    ruleId: "rule-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    resultId: "result-2",
    sourceRevisionId: "source-revision-2",
    sourceTreeHash: "tree-hash-2",
  });
});
