import { describe, expect, test } from "bun:test";
import type { CompiledResult } from "@dreamboard/api-client";
import type {
  DevPreflightDependencies,
  GitRevisionInfo,
} from "./dev-preflight.ts";
import { runDevPreflight } from "./dev-preflight.ts";

const compiledResult: CompiledResult = {
  id: "result-1",
  gameId: "game-1",
  userId: "user-1",
  authoringStateId: "authoring-1",
  manifestId: "manifest-1",
  ruleId: "rule-1",
  success: true,
  appStorageType: "local",
  uiStorageType: "local",
  sourceRevisionId: "source-revision-1",
  sdkVersion: "0.0.40",
  createdAt: "2026-03-19T00:00:00Z",
  lastModifiedAt: "2026-03-19T00:00:00Z",
};

function createDependencies(
  overrides: Partial<DevPreflightDependencies> = {},
): DevPreflightDependencies {
  return {
    getLocalDiff: async () => ({
      modified: [],
      added: [],
      deleted: [],
    }),
    assertCliStaticScaffoldComplete: async () => undefined,
    getAuthoringHeadSdk: async () => ({
      authoringStateId: "authoring-1",
    }),
    getApiVersion: async () =>
      buildApiVersionResult({
        backendRevision: "backend-rev-1",
        uiSdkVersion: "0.0.40",
      }),
    resolveLatestCompiledResult: async () => compiledResult,
    readTextFile: async (filePath) =>
      filePath.endsWith("/package.json")
        ? JSON.stringify({
            dependencies: {
              "@dreamboard/ui-sdk": "^0.0.40",
            },
          })
        : "",
    getGitRevisionInfo: (): GitRevisionInfo => ({
      revision: "backend-rev-1",
      dirty: false,
    }),
    ...overrides,
  };
}

const projectConfig = {
  gameId: "game-1",
  slug: "things-in-rings",
  authoring: {
    authoringStateId: "authoring-1",
  },
};

function buildApiVersionResult(
  data: { backendRevision?: string; uiSdkVersion?: string } | undefined,
) {
  return {
    data,
    error: undefined,
    request: new Request("http://localhost/api/version"),
    response: new Response(JSON.stringify(data ?? null), { status: 200 }),
  };
}

describe("runDevPreflight", () => {
  test("blocks when local authored files have not been synced", async () => {
    const deps = createDependencies({
      getLocalDiff: async () => ({
        modified: ["ui/App.tsx"],
        added: [],
        deleted: [],
      }),
    });

    await expect(
      runDevPreflight(
        {
          projectRoot: "/tmp/project",
          projectConfig,
        },
        deps,
      ),
    ).rejects.toThrow("Run 'dreamboard sync'");
  });

  test("blocks when a previous sync is still pending local finalization", async () => {
    await expect(
      runDevPreflight(
        {
          projectRoot: "/tmp/project",
          projectConfig: {
            ...projectConfig,
            authoring: {
              authoringStateId: "authoring-1",
              pendingSync: {
                phase: "authoring_state_created",
                authoringStateId: "authoring-1",
                sourceRevisionId: "source-revision-1",
                sourceTreeHash: "tree-hash-1",
              },
            },
          },
        },
        createDependencies(),
      ),
    ).rejects.toThrow("Run 'dreamboard sync' again");
  });

  test("blocks when the remote authored head does not match local", async () => {
    await expect(
      runDevPreflight(
        {
          projectRoot: "/tmp/project",
          projectConfig,
        },
        createDependencies({
          getAuthoringHeadSdk: async () => ({
            authoringStateId: "authoring-2",
          }),
        }),
      ),
    ).rejects.toThrow("Run 'dreamboard pull'");
  });

  test("blocks when the scaffold sdk version does not match the backend", async () => {
    await expect(
      runDevPreflight(
        {
          projectRoot: "/tmp/project",
          projectConfig,
        },
        createDependencies({
          getApiVersion: async () =>
            buildApiVersionResult({
              backendRevision: "backend-rev-1",
              uiSdkVersion: "0.0.41",
            }),
        }),
      ),
    ).rejects.toThrow("Local workspace SDK version is ^0.0.40");
  });

  test("blocks when the latest compiled result sdk version does not match the backend", async () => {
    await expect(
      runDevPreflight(
        {
          projectRoot: "/tmp/project",
          projectConfig,
        },
        createDependencies({
          getApiVersion: async () =>
            buildApiVersionResult({
              backendRevision: "backend-rev-1",
              uiSdkVersion: "0.0.41",
            }),
          readTextFile: async (filePath) =>
            filePath.endsWith("/package.json")
              ? JSON.stringify({
                  dependencies: {
                    "@dreamboard/ui-sdk": "0.0.41",
                  },
                })
              : "",
        }),
      ),
    ).rejects.toThrow(
      "Latest successful compile result-1 was built with SDK 0.0.40",
    );
  });

  test("accepts a scaffold sdk range when it satisfies the backend version", async () => {
    const result = await runDevPreflight(
      {
        projectRoot: "/tmp/project",
        projectConfig,
      },
      createDependencies(),
    );

    expect(result.localSdkVersion).toBe("^0.0.40");
    expect(result.backendVersion.uiSdkVersion).toBe("0.0.40");
  });

  test("blocks when backend version metadata cannot be loaded", async () => {
    await expect(
      runDevPreflight(
        {
          projectRoot: "/tmp/project",
          projectConfig,
        },
        createDependencies({
          getApiVersion: async () => ({
            data: undefined,
            error: { message: "backend unavailable" },
            request: new Request("http://localhost/api/version"),
            response: new Response(null, { status: 503 }),
          }),
        }),
      ),
    ).rejects.toThrow("Failed to load backend version metadata");
  });

  test("warns when backend revision differs from local HEAD", async () => {
    const result = await runDevPreflight(
      {
        projectRoot: "/tmp/project",
        projectConfig,
      },
      createDependencies({
        getGitRevisionInfo: () => ({
          revision: "local-head-1",
          dirty: true,
        }),
      }),
    );

    expect(result.warnings).toEqual([
      "Backend revision backend-rev-1 does not match local platform revision local-head-1. Local platform sources are dirty, so the comparison is against HEAD only.",
    ]);
  });
});
