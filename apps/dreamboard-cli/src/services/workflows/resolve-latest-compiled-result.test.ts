import { beforeEach, describe, expect, mock, test } from "bun:test";

const compiledResultsApi = {
  findCompiledResultsForAuthoringState: mock(),
};

mock.module("../api/compiled-results-api.js", () => compiledResultsApi);

const { resolveLatestCompiledResult } = await import(
  "./resolve-latest-compiled-result.ts"
);

beforeEach(() => {
  compiledResultsApi.findCompiledResultsForAuthoringState.mockReset();
});

describe("resolveLatestCompiledResult", () => {
  test("uses the latest successful compile for the current authoring head", async () => {
    compiledResultsApi.findCompiledResultsForAuthoringState.mockResolvedValue([
      {
        id: "result-failed",
        authoringStateId: "authoring-1",
        success: false,
      },
      {
        id: "result-success",
        authoringStateId: "authoring-1",
        success: true,
        manifestId: "manifest-1",
        ruleId: "rule-1",
      },
    ]);

    const result = await resolveLatestCompiledResult("/tmp/project", {
      gameId: "game-1",
      slug: "sample",
      authoring: {
        authoringStateId: "authoring-1",
      },
    });

    expect(result.id).toBe("result-success");
    expect(
      compiledResultsApi.findCompiledResultsForAuthoringState,
    ).toHaveBeenCalledWith({
      gameId: "game-1",
      authoringStateId: "authoring-1",
    });
  });

  test("fails with compile guidance when the current authoring head has no successful compile", async () => {
    compiledResultsApi.findCompiledResultsForAuthoringState.mockResolvedValue([
      {
        id: "result-failed",
        authoringStateId: "authoring-1",
        success: false,
      },
    ]);

    await expect(
      resolveLatestCompiledResult("/tmp/project", {
        gameId: "game-1",
        slug: "sample",
        authoring: {
          authoringStateId: "authoring-1",
        },
      }),
    ).rejects.toThrow(
      "No successful compile exists for the current authored state. Run 'dreamboard compile' first.",
    );
  });
});
