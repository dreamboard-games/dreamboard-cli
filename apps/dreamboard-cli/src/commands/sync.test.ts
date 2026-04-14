import { beforeEach, expect, test } from "bun:test";
import {
  authoringCommandTestHarness,
  resetAuthoringCommandTestHarness,
} from "../test-support/authoring-command-test-harness.ts";
import { DreamboardApiError } from "../utils/errors.ts";
import { CLI_PROBLEM_TYPES } from "../utils/problem-types.js";

const syncCommand = (await import("./sync.ts")).default;

function currentState() {
  return authoringCommandTestHarness.current;
}

function createProblemError(options: {
  type: string;
  status: number;
  detail: string;
  title?: string;
  context?: Record<string, string>;
}): DreamboardApiError {
  return new DreamboardApiError({
    type: options.type,
    title: options.title ?? "Problem",
    status: options.status,
    detail: options.detail,
    context: options.context,
  });
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
      yes: false,
    },
  });

  expect(state.calls.createSourceRevisionSdk).toHaveLength(1);
  expect(state.calls.uploadSourceBlobsSdk).toEqual([
    {
      gameId: "game-1",
      blobs: [
        expect.objectContaining({
          content: "export const updatedPhase = true;\n",
          contentHash: expect.any(String),
          byteSize: expect.any(Number),
        }),
      ],
    },
  ]);
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

test("sync excludes framework-owned generated files from incremental source revisions", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: [
      "app/index.ts",
      "app/phases/setup.ts",
      "shared/manifest-contract.ts",
    ],
    added: [],
    deleted: [],
  };
  state.collectLocalFilesResult = {
    "app/phases/setup.ts": "export const updatedPhase = true;\n",
    "app/index.ts": "export { default } from './game';\n",
    "shared/manifest-contract.ts": "export const manifestContract = {};\n",
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
      yes: false,
    },
  });

  expect(state.calls.createSourceRevisionSdk).toHaveLength(1);
  expect(state.calls.createSourceRevisionSdk[0]?.request.changes).toEqual([
    {
      kind: "upsert",
      path: "app/phases/setup.ts",
      contentHash: expect.any(String),
      byteSize: expect.any(Number),
    },
  ]);
  expect(state.calls.uploadSourceBlobsSdk).toEqual([
    {
      gameId: "game-1",
      blobs: [
        expect.objectContaining({
          content: "export const updatedPhase = true;\n",
          contentHash: expect.any(String),
          byteSize: expect.any(Number),
        }),
      ],
    },
  ]);
});

test("sync requires a lockfile when package.json is present", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: ["app/phases/setup.ts"],
    added: [],
    deleted: [],
  };
  state.collectLocalFilesResult = {
    "app/phases/setup.ts": "export const updatedPhase = true;\n",
    "package.json": JSON.stringify({
      name: "test-game",
      dependencies: {
        "@dreamboard/app-sdk": "0.0.40",
        "@dreamboard/ui-sdk": "0.0.40",
      },
    }),
  };

  await expect(
    syncCommand.run({
      args: {
        env: "local",
        force: false,
        yes: false,
      },
    }),
  ).rejects.toThrow("A lockfile is required");

  expect(state.calls.createSourceRevisionSdk).toHaveLength(0);
});

test("sync accepts package-lock.json when package.json is present", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: ["app/phases/setup.ts"],
    added: [],
    deleted: [],
  };
  state.collectLocalFilesResult = {
    "app/phases/setup.ts": "export const updatedPhase = true;\n",
    "package.json": JSON.stringify({
      name: "test-game",
      dependencies: {
        "@dreamboard/app-sdk": "0.0.40",
        "@dreamboard/ui-sdk": "0.0.40",
      },
    }),
    "package-lock.json": JSON.stringify({
      lockfileVersion: 3,
      packages: {},
    }),
  };

  await syncCommand.run({
    args: {
      env: "local",
      force: false,
      yes: false,
    },
  });

  expect(state.calls.createSourceRevisionSdk).toHaveLength(1);
});

test("sync includes newly seeded phase files in the same source revision when the manifest changes", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: ["manifest.json"],
    added: [],
    deleted: [],
  };
  state.collectLocalFilesResult = {
    "app/phases/setup.ts": "export const phase = {}\n",
  };
  state.applyWorkspaceCodegenNextCollectLocalFilesResult = {
    "app/phases/setup.ts": "export const phase = {}\n",
    "app/phases/harnessReview.ts": "export const phase = {}\n",
  };
  state.applyWorkspaceCodegenNextLocalDiffResult = {
    modified: ["manifest.json"],
    added: ["app/phases/harnessReview.ts"],
    deleted: [],
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
    manifestId: "manifest-2",
    manifestContentHash: "content-hash-2",
    ruleId: "rule-1",
  };

  await syncCommand.run({
    args: {
      env: "local",
      force: false,
      yes: false,
    },
  });

  expect(state.calls.createSourceRevisionSdk).toHaveLength(1);
  expect(state.calls.createSourceRevisionSdk[0]?.request.changes).toEqual([
    {
      kind: "upsert",
      path: "app/phases/harnessReview.ts",
      contentHash: expect.any(String),
      byteSize: expect.any(Number),
    },
  ]);
  expect(state.calls.uploadSourceBlobsSdk).toEqual([
    {
      gameId: "game-1",
      blobs: [
        expect.objectContaining({
          content: "export const phase = {}\n",
          contentHash: expect.any(String),
          byteSize: expect.any(Number),
        }),
      ],
    },
  ]);
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
      yes: false,
    },
  });

  expect(state.calls.createSourceRevisionSdk).toHaveLength(1);
  expect(state.calls.createSourceRevisionSdk[0]?.gameId).toBe("game-1");
  expect(state.calls.createSourceRevisionSdk[0]?.request.mode).toBe("replace");
  expect(state.calls.createSourceRevisionSdk[0]?.request).not.toHaveProperty(
    "baseSourceRevisionId",
  );
  expect(state.calls.createSourceRevisionSdk[0]?.request.changes).toHaveLength(
    1,
  );
  expect(
    state.calls.createSourceRevisionSdk[0]?.request.changes[0],
  ).toMatchObject({
    kind: "upsert",
    path: "app/phases/setup.ts",
  });
  expect(state.calls.uploadSourceBlobsSdk).toEqual([
    {
      gameId: "game-1",
      blobs: [
        expect.objectContaining({
          content: "export const phase = {}\n",
          contentHash: expect.any(String),
          byteSize: expect.any(Number),
        }),
      ],
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

test("sync fails fast with a targeted manifest error when a resource uses displayName", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: ["manifest.json"],
    added: [],
    deleted: [],
  };
  state.loadManifestError = new Error(
    "Invalid manifest:\n- manifest.resources[0].name: Invalid input: expected string, received undefined",
  );

  await expect(
    syncCommand.run({
      args: {
        env: "local",
        force: false,
        yes: false,
      },
    }),
  ).rejects.toThrow("manifest.resources[0].name");
  expect(state.calls.saveManifestSdk).toHaveLength(0);
});

test("sync explains how to recover when first sync hits a remote source revision drift", async () => {
  const state = currentState();
  state.projectConfig.authoring = {
    ruleId: "rule-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
  };
  state.projectConfig.compile = {};
  state.getAuthoringHeadSdkResult = null;
  state.getLocalDiffResult = {
    modified: ["app/phases/setup.ts"],
    added: [],
    deleted: [],
  };
  state.createSourceRevisionError = createProblemError({
    type: CLI_PROBLEM_TYPES.SOURCE_REVISION_DRIFT,
    status: 409,
    title: "Source revision drift detected",
    detail:
      "Source revision drift detected. Expected head=source-revision-remote, received base=null.",
    context: {
      expectedHeadSourceRevisionId: "source-revision-remote",
    },
  });

  let thrown: unknown;
  try {
    await syncCommand.run({
      args: {
        env: "local",
        force: false,
        yes: false,
      },
    });
  } catch (error) {
    thrown = error;
  }

  expect(thrown).toBeInstanceOf(Error);
  expect((thrown as Error).message).toContain(
    "server already has remote source revision source-revision-remote",
  );
  expect((thrown as Error).message).toContain("needs backend repair");
  expect(state.calls.createAuthoringStateSdk).toHaveLength(0);
});

test("sync checkpoints the source revision before authoring state creation", async () => {
  const state = currentState();
  state.projectConfig.authoring = {
    ruleId: "rule-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
  };
  state.projectConfig.compile = {};
  state.getAuthoringHeadSdkResult = null;
  state.getLocalDiffResult = {
    modified: ["app/phases/setup.ts"],
    added: [],
    deleted: [],
  };
  state.createAuthoringStateError = new Error("authoring state failed");

  await expect(
    syncCommand.run({
      args: {
        env: "local",
        force: false,
        yes: false,
      },
    }),
  ).rejects.toThrow("authoring state failed");

  expect(state.calls.updateProjectState).toHaveLength(1);
  expect(state.calls.updateProjectState[0]?.config.authoring).toEqual({
    ruleId: "rule-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    pendingSync: {
      phase: "source_revision_created",
      sourceRevisionId: "source-revision-2",
      sourceTreeHash: "tree-hash-2",
      manifestId: "manifest-1",
      manifestContentHash: "content-hash-1",
      ruleId: "rule-1",
    },
  });
});

test("sync explains how to recover when authoring state creation cannot find the source revision", async () => {
  const state = currentState();
  state.projectConfig.authoring = {
    ruleId: "rule-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
  };
  state.projectConfig.compile = {};
  state.getAuthoringHeadSdkResult = null;
  state.getLocalDiffResult = {
    modified: ["app/phases/setup.ts"],
    added: [],
    deleted: [],
  };
  state.createAuthoringStateError = createProblemError({
    type: CLI_PROBLEM_TYPES.SOURCE_REVISION_NOT_FOUND,
    status: 404,
    title: "Source revision not found",
    detail: "Source revision not found: source-revision-2",
    context: {
      sourceRevisionId: "source-revision-2",
    },
  });

  await expect(
    syncCommand.run({
      args: {
        env: "local",
        force: false,
        yes: false,
      },
    }),
  ).rejects.toThrow("Run `dreamboard sync --force`");

  expect(state.calls.updateProjectState).toHaveLength(1);
  expect(state.calls.updateProjectState[0]?.config.authoring).toEqual({
    ruleId: "rule-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    pendingSync: {
      phase: "source_revision_created",
      sourceRevisionId: "source-revision-2",
      sourceTreeHash: "tree-hash-2",
      manifestId: "manifest-1",
      manifestContentHash: "content-hash-1",
      ruleId: "rule-1",
    },
  });
});

test("sync --force discards a stale source-revision checkpoint and rebuilds from local files", async () => {
  const state = currentState();
  state.projectConfig.authoring = {
    ruleId: "rule-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    sourceRevisionId: "source-revision-old",
    sourceTreeHash: "tree-hash-old",
    pendingSync: {
      phase: "source_revision_created",
      sourceRevisionId: "source-revision-missing",
      sourceTreeHash: "tree-hash-missing",
      manifestId: "manifest-1",
      manifestContentHash: "content-hash-1",
      ruleId: "rule-1",
    },
  };
  state.getAuthoringHeadSdkResult = null;
  state.getLocalDiffResult = {
    modified: ["app/phases/setup.ts"],
    added: [],
    deleted: [],
  };
  state.collectLocalFilesResult = {
    "app/phases/setup.ts": "export const rebuiltPhase = true;\n",
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
      force: true,
      yes: false,
    },
  });

  expect(state.calls.createAuthoringStateSdk).toEqual([
    {
      gameId: "game-1",
      request: {
        sourceRevisionId: "source-revision-2",
        sourceTreeHash: "tree-hash-2",
        manifestId: "manifest-1",
        manifestContentHash: "content-hash-1",
        ruleId: "rule-1",
      },
    },
  ]);
  expect(state.calls.createSourceRevisionSdk).toHaveLength(1);
  expect(state.calls.createSourceRevisionSdk[0]?.gameId).toBe("game-1");
  expect(state.calls.createSourceRevisionSdk[0]?.request).toMatchObject({
    baseSourceRevisionId: "source-revision-old",
    mode: "replace",
  });
  expect(state.calls.createSourceRevisionSdk[0]?.request.changes).toHaveLength(
    1,
  );
  expect(
    state.calls.createSourceRevisionSdk[0]?.request.changes[0],
  ).toMatchObject({
    kind: "upsert",
    path: "app/phases/setup.ts",
  });
  expect(state.calls.updateProjectState[0]?.config.authoring).toEqual({
    ruleId: "rule-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    sourceRevisionId: "source-revision-old",
    sourceTreeHash: "tree-hash-old",
  });
  expect(state.projectConfig.authoring).toEqual({
    authoringStateId: "authoring-2",
    sourceRevisionId: "source-revision-2",
    sourceTreeHash: "tree-hash-2",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    ruleId: "rule-1",
  });
});

test("sync --force clears a stale source-revision checkpoint when the remote head still matches the local base", async () => {
  const state = currentState();
  state.projectConfig.authoring = {
    authoringStateId: "authoring-1",
    ruleId: "rule-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    sourceRevisionId: "source-revision-old",
    sourceTreeHash: "tree-hash-old",
    pendingSync: {
      phase: "source_revision_created",
      sourceRevisionId: "source-revision-missing",
      sourceTreeHash: "tree-hash-missing",
      manifestId: "manifest-1",
      manifestContentHash: "content-hash-1",
      ruleId: "rule-1",
    },
  };
  state.getAuthoringHeadSdkResult = {
    ...state.getAuthoringHeadSdkResult!,
    authoringStateId: "authoring-1",
    sourceRevisionId: "source-revision-old",
    sourceTreeHash: "tree-hash-old",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    ruleId: "rule-1",
  };
  state.getLocalDiffResult = {
    modified: ["app/phases/setup.ts"],
    added: [],
    deleted: [],
  };
  state.collectLocalFilesResult = {
    "app/phases/setup.ts": "export const rebuiltPhase = true;\n",
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
      force: true,
      yes: false,
    },
  });

  expect(state.calls.createSourceRevisionSdk).toHaveLength(1);
  expect(state.calls.createSourceRevisionSdk[0]?.request).toMatchObject({
    baseSourceRevisionId: "source-revision-old",
    mode: "replace",
  });
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
  expect(state.calls.updateProjectState[0]?.config.authoring).toEqual({
    authoringStateId: "authoring-1",
    ruleId: "rule-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    sourceRevisionId: "source-revision-old",
    sourceTreeHash: "tree-hash-old",
  });
  expect(state.projectConfig.authoring).toEqual({
    authoringStateId: "authoring-2",
    sourceRevisionId: "source-revision-2",
    sourceTreeHash: "tree-hash-2",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    ruleId: "rule-1",
  });
});

test("sync checkpoints authored head before scaffold writes", async () => {
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
  state.applyWorkspaceCodegenError = new Error("workspace codegen failed");
  state.applyWorkspaceCodegenErrorOnCall = 2;

  await expect(
    syncCommand.run({
      args: {
        env: "local",
        force: false,
        yes: false,
      },
    }),
  ).rejects.toThrow("workspace codegen failed");

  expect(state.calls.updateProjectState).toHaveLength(2);
  expect(state.calls.updateProjectState[1]?.config.authoring).toEqual({
    authoringStateId: "authoring-1",
    sourceRevisionId: "source-revision-1",
    sourceTreeHash: "tree-hash-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    ruleId: "rule-1",
    pendingSync: {
      phase: "authoring_state_created",
      authoringStateId: "authoring-2",
      sourceRevisionId: "source-revision-2",
      sourceTreeHash: "tree-hash-2",
      manifestId: "manifest-1",
      manifestContentHash: "content-hash-1",
      ruleId: "rule-1",
    },
  });
  expect(state.calls.writeSnapshot).toHaveLength(0);
});

test("sync resumes local finalization from a pending authored checkpoint", async () => {
  const state = currentState();
  state.projectConfig.authoring = {
    authoringStateId: "authoring-1",
    sourceRevisionId: "source-revision-1",
    sourceTreeHash: "tree-hash-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    ruleId: "rule-1",
    pendingSync: {
      phase: "authoring_state_created",
      authoringStateId: "authoring-2",
      sourceRevisionId: "source-revision-2",
      sourceTreeHash: "tree-hash-2",
      manifestId: "manifest-1",
      manifestContentHash: "content-hash-1",
      ruleId: "rule-1",
    },
  };
  state.getLocalDiffResult = {
    modified: [],
    added: [],
    deleted: [],
  };
  state.getAuthoringHeadSdkResult = {
    ...state.getAuthoringHeadSdkResult!,
    authoringStateId: "authoring-2",
    sourceRevisionId: "source-revision-2",
    sourceTreeHash: "tree-hash-2",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    ruleId: "rule-1",
  };

  await syncCommand.run({
    args: {
      env: "local",
      force: false,
      yes: false,
    },
  });

  expect(state.calls.createSourceRevisionSdk).toHaveLength(0);
  expect(state.calls.createAuthoringStateSdk).toHaveLength(0);
  expect(state.projectConfig.authoring).toEqual({
    authoringStateId: "authoring-2",
    sourceRevisionId: "source-revision-2",
    sourceTreeHash: "tree-hash-2",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    ruleId: "rule-1",
  });
});

test("sync refreshes static scaffold even without authored changes", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: [],
    added: [],
    deleted: [],
  };
  state.getAuthoringHeadSdkResult = {
    ...state.getAuthoringHeadSdkResult!,
    authoringStateId: "authoring-1",
    sourceRevisionId: "source-revision-1",
    sourceTreeHash: "tree-hash-1",
  };
  state.projectConfig.authoring = {
    authoringStateId: "authoring-1",
    sourceRevisionId: "source-revision-1",
    sourceTreeHash: "tree-hash-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    ruleId: "rule-1",
  };

  await syncCommand.run({
    args: {
      env: "local",
      force: false,
      yes: false,
    },
  });

  expect(state.calls.scaffoldStaticWorkspace).toEqual([
    {
      projectRoot: "/tmp/dreamboard-project",
      mode: "update",
    },
  ]);
  expect(state.calls.createSourceRevisionSdk).toHaveLength(0);
  expect(
    state.consoleCalls.some(
      (call) =>
        call.level === "info" &&
        call.args.includes("No local authored changes to sync."),
    ),
  ).toBe(true);
});

test("sync refreshes static scaffold before checking for missing files", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: [],
    added: [],
    deleted: ["app/tsconfig.json", "ui/style.css"],
  };
  state.getAuthoringHeadSdkResult = {
    ...state.getAuthoringHeadSdkResult!,
    authoringStateId: "authoring-1",
    sourceRevisionId: "source-revision-1",
    sourceTreeHash: "tree-hash-1",
  };
  state.projectConfig.authoring = {
    authoringStateId: "authoring-1",
    sourceRevisionId: "source-revision-1",
    sourceTreeHash: "tree-hash-1",
    manifestId: "manifest-1",
    manifestContentHash: "content-hash-1",
    ruleId: "rule-1",
  };

  await syncCommand.run({
    args: {
      env: "local",
      force: false,
      yes: false,
    },
  });

  expect(state.calls.scaffoldStaticWorkspace[0]).toEqual({
    projectRoot: "/tmp/dreamboard-project",
    mode: "update",
  });
  expect(state.calls.assertCliStaticScaffoldComplete).toEqual([
    {
      projectRoot: "/tmp/dreamboard-project",
      deletedPaths: ["app/tsconfig.json", "ui/style.css"],
    },
  ]);
  expect(state.calls.createSourceRevisionSdk).toHaveLength(1);
});
