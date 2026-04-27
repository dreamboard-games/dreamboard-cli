import { beforeEach, expect, test } from "bun:test";
import {
  authoringCommandTestHarness,
  resetAuthoringCommandTestHarness,
} from "../test-support/authoring-command-test-harness.ts";

const compileCommand = (await import("./compile.ts")).default;

function currentState() {
  return authoringCommandTestHarness.current;
}

beforeEach(() => {
  resetAuthoringCommandTestHarness();
});

test("compile success updates latest attempt and latest successful state", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: [],
    added: [],
    deleted: [],
  };
  state.findCompiledResultsForAuthoringStateResult = [];
  state.createCompiledResultResult = {
    id: "result-2",
    authoringStateId: "authoring-1",
    success: true,
    sourceRevisionId: "source-revision-1",
  };

  await compileCommand.run({
    args: {
      env: "local",
    },
  });

  expect(state.calls.queueCompiledResultJobSdk).toEqual([
    {
      gameId: "game-1",
      authoringStateId: "authoring-1",
    },
  ]);
  expect(state.projectConfig.compile?.latestAttempt).toEqual({
    resultId: "result-2",
    jobId: "compile-job-1",
    authoringStateId: "authoring-1",
    status: "successful",
    diagnosticsSummary: undefined,
  });
  expect(state.projectConfig.compile?.latestSuccessful).toEqual({
    resultId: "result-2",
    authoringStateId: "authoring-1",
  });
});

test("compile reuses an existing successful result for the current authored state", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: [],
    added: [],
    deleted: [],
  };
  state.findCompiledResultsForAuthoringStateResult = [
    {
      id: "result-existing",
      authoringStateId: "authoring-1",
      success: true,
      sourceRevisionId: "source-revision-1",
    },
  ];

  await compileCommand.run({
    args: {
      env: "local",
    },
  });

  expect(state.calls.findCompiledResultsForAuthoringState).toEqual([
    {
      gameId: "game-1",
      authoringStateId: "authoring-1",
    },
  ]);
  expect(state.calls.queueCompiledResultJobSdk).toHaveLength(0);
  expect(state.calls.waitForCompiledResultJobSdk).toHaveLength(0);
  expect(state.projectConfig.compile?.latestAttempt).toEqual({
    resultId: "result-existing",
    jobId: undefined,
    authoringStateId: "authoring-1",
    status: "successful",
    diagnosticsSummary: undefined,
  });
  expect(state.projectConfig.compile?.latestSuccessful).toEqual({
    resultId: "result-existing",
    authoringStateId: "authoring-1",
  });
});

test("compile failure persists the failed attempt without changing authored sync", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: [],
    added: [],
    deleted: [],
  };
  state.findCompiledResultsForAuthoringStateResult = [];
  state.createCompiledResultResult = {
    id: "result-failed",
    authoringStateId: "authoring-1",
    success: false,
    sourceRevisionId: "source-revision-1",
    diagnostics: [
      {
        type: "general",
        category: "typescript",
        message: "Broken import",
      },
    ],
  };

  await expect(
    compileCommand.run({
      args: {
        env: "local",
      },
    }),
  ).rejects.toThrow(
    "Remote compile failed, but your authored state is synced. Fix the diagnostics and run 'dreamboard compile' again.",
  );

  expect(state.projectConfig.authoring?.authoringStateId).toBe("authoring-1");
  expect(state.projectConfig.compile?.latestAttempt).toEqual({
    resultId: "result-failed",
    jobId: "compile-job-1",
    authoringStateId: "authoring-1",
    status: "failed",
    diagnosticsSummary: "Broken import",
  });
  expect(state.projectConfig.compile?.latestSuccessful).toEqual({
    resultId: "result-1",
    authoringStateId: "authoring-1",
  });
});

test("compile treats a failed job with a compiled artifact as a failed attempt", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: [],
    added: [],
    deleted: [],
  };
  state.findCompiledResultsForAuthoringStateResult = [];
  state.createCompiledResultResult = {
    id: "result-2",
    authoringStateId: "authoring-1",
    success: true,
    sourceRevisionId: "source-revision-1",
  };
  state.waitForCompiledResultJobTerminalResult = {
    status: "FAILED",
    phase: "publishing",
    message: "Failed to connect to external service",
  };

  await expect(
    compileCommand.run({
      args: {
        env: "local",
      },
    }),
  ).rejects.toThrow(
    "Compile failed [publishing] Failed to connect to external service. The backend created compiled result result-2, but the compile job did not complete cleanly. Run 'dreamboard compile' again after fixing the backend/compiler issue.",
  );

  expect(state.projectConfig.compile?.latestAttempt).toEqual({
    resultId: "result-2",
    jobId: "compile-job-1",
    authoringStateId: "authoring-1",
    status: "failed",
    diagnosticsSummary:
      "Compile failed [publishing] Failed to connect to external service",
  });
  expect(state.projectConfig.compile?.latestSuccessful).toEqual({
    resultId: "result-1",
    authoringStateId: "authoring-1",
  });
});

test("compile persists a failed attempt when the queued job errors before producing a result", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: [],
    added: [],
    deleted: [],
  };
  state.findCompiledResultsForAuthoringStateResult = [];
  state.waitForCompiledResultJobError = new Error(
    "Failed to get job (HTTP 500)",
  );

  await expect(
    compileCommand.run({
      args: {
        env: "local",
      },
    }),
  ).rejects.toThrow(
    "Remote compile job compile-job-1 could not be completed. Failed to get job (HTTP 500) Check backend health and try 'dreamboard compile' again.",
  );

  expect(state.projectConfig.compile?.latestAttempt).toEqual({
    resultId: undefined,
    jobId: "compile-job-1",
    authoringStateId: "authoring-1",
    status: "failed",
    diagnosticsSummary: "Failed to get job (HTTP 500)",
  });
  expect(state.projectConfig.compile?.latestSuccessful).toEqual({
    resultId: "result-1",
    authoringStateId: "authoring-1",
  });
});

test("compile preserves actionable compiler terminal detail without appending a backend health hint", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: [],
    added: [],
    deleted: [],
  };
  state.findCompiledResultsForAuthoringStateResult = [];
  state.waitForCompiledResultJobError = new Error(
    "Compile failed [failed]: Compiler job job-9 ended without a result (status=COMPLETED, phase=completed, message=Compiler accepted the job but produced no result)",
  );

  await expect(
    compileCommand.run({
      args: {
        env: "local",
      },
    }),
  ).rejects.toThrow(
    "Remote compile job compile-job-1 could not be completed. Compile failed [failed]: Compiler job job-9 ended without a result (status=COMPLETED, phase=completed, message=Compiler accepted the job but produced no result)",
  );

  expect(state.projectConfig.compile?.latestAttempt).toEqual({
    resultId: undefined,
    jobId: "compile-job-1",
    authoringStateId: "authoring-1",
    status: "failed",
    diagnosticsSummary:
      "Compile failed [failed]: Compiler job job-9 ended without a result (status=COMPLETED, phase=completed, message=Compiler accepted the job but produced no result)",
  });
});

test("compile refuses to run while a previous sync is still finalizing locally", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: [],
    added: [],
    deleted: [],
  };
  state.projectConfig.authoring = {
    ...state.projectConfig.authoring,
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

  await expect(
    compileCommand.run({
      args: {
        env: "local",
      },
    }),
  ).rejects.toThrow(
    "Previous sync reached the remote authored head, but local scaffold finalization did not complete. Run 'dreamboard sync' again before compiling.",
  );

  expect(state.calls.queueCompiledResultJobSdk).toHaveLength(0);
});
