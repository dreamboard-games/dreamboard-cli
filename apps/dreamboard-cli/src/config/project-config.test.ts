import path from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { loadProjectConfig, updateProjectState } from "./project-config.js";

const tempDirs: string[] = [];

afterEach(async () => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      await rm(dir, { recursive: true, force: true });
    }
  }
});

describe("project config normalization", () => {
  test("writes and reads nested authoring state", async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), "dreamboard-config-"));
    tempDirs.push(rootDir);

    await updateProjectState(rootDir, {
      gameId: "game-1",
      slug: "sample-game",
      authoring: {
        authoringStateId: "authoring-1",
        sourceRevisionId: "source-1",
        sourceTreeHash: "tree-1",
        manifestId: "manifest-1",
        manifestContentHash: "manifest-hash-1",
        ruleId: "rule-1",
        pendingSync: {
          phase: "authoring_state_created",
          authoringStateId: "authoring-2",
          sourceRevisionId: "source-2",
          sourceTreeHash: "tree-2",
          manifestId: "manifest-2",
          manifestContentHash: "manifest-hash-2",
          ruleId: "rule-2",
        },
      },
      compile: {
        latestAttempt: {
          resultId: "result-1",
          authoringStateId: "authoring-1",
          status: "failed",
          diagnosticsSummary: "Broken import",
        },
      },
    });

    const loaded = await loadProjectConfig(rootDir);
    expect(loaded.authoring?.authoringStateId).toBe("authoring-1");
    expect(loaded.authoring?.pendingSync?.authoringStateId).toBe("authoring-2");
    expect(loaded.compile?.latestAttempt?.status).toBe("failed");
    expect(loaded.resultId).toBeUndefined();
  });

  test("writes and reads failed compile attempts without a compiled result id", async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), "dreamboard-config-"));
    tempDirs.push(rootDir);

    await updateProjectState(rootDir, {
      gameId: "game-1",
      slug: "sample-game",
      authoring: {
        authoringStateId: "authoring-1",
      },
      compile: {
        latestAttempt: {
          jobId: "compile-job-1",
          authoringStateId: "authoring-1",
          status: "failed",
          diagnosticsSummary: "Failed to get job (HTTP 500)",
        },
      },
    });

    const loaded = await loadProjectConfig(rootDir);
    expect(loaded.compile?.latestAttempt?.resultId).toBeUndefined();
    expect(loaded.compile?.latestAttempt?.jobId).toBe("compile-job-1");
    expect(loaded.compile?.latestSuccessful).toBeUndefined();
  });

  test("upgrades legacy flat fields into nested authoring and compile state", async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), "dreamboard-config-"));
    tempDirs.push(rootDir);

    await updateProjectState(rootDir, {
      gameId: "game-1",
      slug: "legacy-game",
      ruleId: "rule-legacy",
      manifestId: "manifest-legacy",
      manifestContentHash: "manifest-hash-legacy",
      resultId: "result-legacy",
      sourceRevisionId: "source-legacy",
      sourceTreeHash: "tree-legacy",
    });

    const loaded = await loadProjectConfig(rootDir);
    expect(loaded.authoring?.ruleId).toBe("rule-legacy");
    expect(loaded.authoring?.manifestId).toBe("manifest-legacy");
    expect(loaded.authoring?.sourceRevisionId).toBe("source-legacy");
    expect(loaded.compile?.latestAttempt?.resultId).toBe("result-legacy");
    expect(loaded.compile?.latestSuccessful?.resultId).toBe("result-legacy");
  });
});
