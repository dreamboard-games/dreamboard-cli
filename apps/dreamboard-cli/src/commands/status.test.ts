import { expect, test } from "bun:test";
import { authoringCommandTestHarness } from "../test-support/authoring-command-test-harness.ts";

const statusCommand = (await import("./status.ts")).default;

function currentState() {
  return authoringCommandTestHarness.current;
}

function consoleMessages(level: "info" | "warn") {
  return currentState()
    .consoleCalls.filter((call) => call.level === level)
    .map((call) => call.args.map(String).join(" "));
}

test("status warns when the remote latest result differs from the local base", async () => {
  const state = currentState();
  state.getLocalDiffResult = {
    modified: [],
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

  await statusCommand.run({
    args: {
      env: "local",
    },
  });

  expect(consoleMessages("warn")).toContain(
    "Remote drift detected: local base=result-1, remote latest=result-2. Run 'dreamboard update --pull' to reconcile.",
  );
});

test("status warns when the remote base is unknown locally", async () => {
  const state = currentState();
  state.projectConfig.resultId = undefined;
  state.getLatestCompiledResultResponse = {
    data: {
      id: "result-remote",
      sourceRevisionId: "source-revision-remote",
    },
    error: null,
    response: { status: 200 },
  };

  await statusCommand.run({
    args: {
      env: "local",
    },
  });

  expect(consoleMessages("warn")).toContain(
    "Remote base is unknown. Latest remote result: result-remote. Run 'dreamboard update --pull' to reconcile this workspace.",
  );
});

test("status reports that remote state is unavailable when there is no auth token", async () => {
  const state = currentState();
  state.config = {
    ...state.config,
    authToken: undefined,
  };

  await statusCommand.run({
    args: {
      env: "local",
    },
  });

  expect(state.calls.configureClient).toHaveLength(0);
  expect(consoleMessages("warn")).toContain(
    "Remote status unavailable (no auth token).",
  );
});
