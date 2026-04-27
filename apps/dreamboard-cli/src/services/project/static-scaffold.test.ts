import { mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "bun:test";

async function loadStaticScaffold() {
  return import(`./static-scaffold.ts?test=${Math.random()}`);
}

function renderManifestSource(manifest: Record<string, unknown>): string {
  return [
    'import { defineTopologyManifest } from "@dreamboard/sdk-types";',
    "",
    "export default defineTopologyManifest(",
    `${JSON.stringify(manifest, null, 2)}`,
    ");",
    "",
  ].join("\n");
}

test("scaffolds static framework files locally", async () => {
  const { scaffoldStaticWorkspace } = await loadStaticScaffold();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));

  try {
    await scaffoldStaticWorkspace(tempRoot, "new");

    expect(
      await Bun.file(path.join(tempRoot, "app", "tsconfig.json")).exists(),
    ).toBe(true);
    expect(
      await Bun.file(path.join(tempRoot, "ui", "index.tsx")).exists(),
    ).toBe(true);
    expect(await Bun.file(path.join(tempRoot, "package.json")).exists()).toBe(
      true,
    );
    const rootPkg = JSON.parse(
      await Bun.file(path.join(tempRoot, "package.json")).text(),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(rootPkg.dependencies?.["@dreamboard/app-sdk"]).toMatch(/^\^/);
    expect(rootPkg.dependencies?.["@dreamboard/ui-sdk"]).toMatch(/^\^/);
    expect(rootPkg.devDependencies?.["@dreamboard/sdk-types"]).toMatch(/^\^/);
    expect(
      await Bun.file(path.join(tempRoot, "ui", "index.tsx")).text(),
    ).toContain("PluginRuntime");
    expect(
      await Bun.file(
        path.join(
          tempRoot,
          "test",
          "scenarios",
          "smoke-initial-turn.scenario.ts",
        ),
      ).exists(),
    ).toBe(true);
    expect(
      await Bun.file(
        path.join(tempRoot, "shared", "game-message.d.ts"),
      ).exists(),
    ).toBe(false);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("new scaffold derives the initial base player count from manifest optimalPlayers", async () => {
  const { scaffoldStaticWorkspace } = await loadStaticScaffold();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));

  try {
    await Bun.write(
      path.join(tempRoot, "manifest.ts"),
      renderManifestSource({
        players: {
          minPlayers: 2,
          maxPlayers: 5,
          optimalPlayers: 3,
        },
        cardSets: [],
        zones: [],
        boardTemplates: [],
        boards: [],
        pieceTypes: [],
        pieceSeeds: [],
        dieTypes: [],
        dieSeeds: [],
        resources: [],
        setupOptions: [],
        setupProfiles: [],
      }),
    );

    await scaffoldStaticWorkspace(tempRoot, "new");

    expect(
      await Bun.file(
        path.join(tempRoot, "test", "bases", "initial-turn.base.ts"),
      ).text(),
    ).toContain("players: 3");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("new scaffold falls back to manifest minPlayers when optimalPlayers is absent", async () => {
  const { scaffoldStaticWorkspace } = await loadStaticScaffold();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));

  try {
    await Bun.write(
      path.join(tempRoot, "manifest.ts"),
      renderManifestSource({
        players: {
          minPlayers: 3,
          maxPlayers: 6,
        },
        cardSets: [],
        zones: [],
        boardTemplates: [],
        boards: [],
        pieceTypes: [],
        pieceSeeds: [],
        dieTypes: [],
        dieSeeds: [],
        resources: [],
        setupOptions: [],
        setupProfiles: [],
      }),
    );

    await scaffoldStaticWorkspace(tempRoot, "new");

    expect(
      await Bun.file(
        path.join(tempRoot, "test", "bases", "initial-turn.base.ts"),
      ).text(),
    ).toContain("players: 3");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("scaffolds local maintainer registry metadata into package.json and .npmrc", async () => {
  const { scaffoldStaticWorkspace } = await loadStaticScaffold();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));

  try {
    await scaffoldStaticWorkspace(tempRoot, "new", {
      localMaintainerRegistry: {
        registryUrl: "http://127.0.0.1:4873",
        snapshotId: "snapshot-1",
        fingerprint: "fingerprint-1",
        publishedAt: "2026-04-12T00:00:00.000Z",
        packages: {
          "@dreamboard/api-client": "0.1.0-local.1",
          "@dreamboard/app-sdk": "0.0.40-local.1",
          "@dreamboard/sdk-types": "0.1.0-local.1",
          "@dreamboard/ui-sdk": "0.0.40-local.1",
        },
      },
    });

    const rootPkg = JSON.parse(
      await Bun.file(path.join(tempRoot, "package.json")).text(),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    expect(rootPkg.dependencies?.["@dreamboard/app-sdk"]).toBe(
      "0.0.40-local.1",
    );
    expect(rootPkg.dependencies?.["@dreamboard/ui-sdk"]).toBe("0.0.40-local.1");
    expect(rootPkg.devDependencies?.["@dreamboard/sdk-types"]).toBe(
      "0.1.0-local.1",
    );
    expect(await Bun.file(path.join(tempRoot, ".npmrc")).text()).toBe(
      "@dreamboard:registry=http://127.0.0.1:4873\n",
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("removes stale workspace .npmrc when local maintainer registry is absent", async () => {
  const { scaffoldStaticWorkspace } = await loadStaticScaffold();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));

  try {
    await Bun.write(
      path.join(tempRoot, ".npmrc"),
      "@dreamboard:registry=http://127.0.0.1:4873\n",
    );

    await scaffoldStaticWorkspace(tempRoot, "update");

    expect(await Bun.file(path.join(tempRoot, ".npmrc")).exists()).toBe(false);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("update preserves user-added root package dependencies while refreshing framework-owned entries", async () => {
  const { scaffoldStaticWorkspace } = await loadStaticScaffold();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));
  const packageJsonPath = path.join(tempRoot, "package.json");

  try {
    await scaffoldStaticWorkspace(tempRoot, "new");

    const packageJson = JSON.parse(await Bun.file(packageJsonPath).text()) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      packageManager?: string;
      pnpm?: Record<string, unknown>;
    };

    packageJson.dependencies = {
      ...(packageJson.dependencies ?? {}),
      nanoid: "^5.1.5",
    };
    packageJson.devDependencies = {
      ...(packageJson.devDependencies ?? {}),
      vitest: "^3.2.4",
    };
    packageJson.scripts = {
      ...(packageJson.scripts ?? {}),
      lint: "eslint .",
    };
    packageJson.packageManager = "pnpm@0.0.1";
    packageJson.pnpm = {
      onlyBuiltDependencies: ["esbuild"],
    };

    await Bun.write(
      packageJsonPath,
      `${JSON.stringify(packageJson, null, 2)}\n`,
    );

    await scaffoldStaticWorkspace(tempRoot, "update");

    const refreshedPackageJson = JSON.parse(
      await Bun.file(packageJsonPath).text(),
    ) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      packageManager?: string;
      pnpm?: Record<string, unknown>;
    };

    expect(refreshedPackageJson.dependencies?.nanoid).toBe("^5.1.5");
    expect(refreshedPackageJson.devDependencies?.vitest).toBe("^3.2.4");
    expect(refreshedPackageJson.scripts?.lint).toBe("eslint .");
    expect(refreshedPackageJson.scripts?.dev).toBe("dreamboard dev");
    expect(refreshedPackageJson.dependencies?.["@dreamboard/app-sdk"]).toMatch(
      /^\^/,
    );
    expect(
      refreshedPackageJson.devDependencies?.["@dreamboard/sdk-types"],
    ).toMatch(/^\^/);
    expect(refreshedPackageJson.packageManager).toBe("pnpm@0.0.1");
    expect(refreshedPackageJson.pnpm).toEqual({
      onlyBuiltDependencies: ["esbuild"],
    });
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("resolves scaffold assets for bundled dist builds", async () => {
  const { resolveStaticAssetRoot } = await loadStaticScaffold();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));
  const assetRoot = path.join(tempRoot, "dist", "scaffold", "assets", "static");
  const bundledEntryUrl = pathToFileURL(
    path.join(tempRoot, "dist", "index.js"),
  ).href;

  try {
    await mkdir(assetRoot, { recursive: true });

    expect(path.resolve(resolveStaticAssetRoot(bundledEntryUrl))).toBe(
      path.resolve(assetRoot),
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("resolves sdk dependency ranges from repo-local package manifests", () => {
  return loadStaticScaffold().then(({ resolveSdkDependencyRange }) => {
    expect(resolveSdkDependencyRange("@dreamboard/app-sdk")).toBe("^0.0.40");
    expect(resolveSdkDependencyRange("@dreamboard/sdk-types")).toBe("^0.1.0");
    expect(resolveSdkDependencyRange("@dreamboard/ui-sdk")).toBe("^0.0.40");
  });
});

test("fails compile preflight when shared static files are missing", async () => {
  const { assertCliStaticScaffoldComplete, scaffoldStaticWorkspace } =
    await loadStaticScaffold();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));
  const missingFilePath = path.join(tempRoot, "package.json");

  try {
    await scaffoldStaticWorkspace(tempRoot, "new");
    await rm(missingFilePath, { force: true });

    await expect(assertCliStaticScaffoldComplete(tempRoot)).rejects.toThrow(
      "dreamboard sync",
    );
    await expect(assertCliStaticScaffoldComplete(tempRoot)).rejects.toThrow(
      "package.json",
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("fails compile preflight when cli static files are deleted locally", async () => {
  const { assertCliStaticScaffoldComplete, scaffoldStaticWorkspace } =
    await loadStaticScaffold();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));

  try {
    await scaffoldStaticWorkspace(tempRoot, "new");

    await expect(
      assertCliStaticScaffoldComplete(tempRoot, ["ui/index.tsx"]),
    ).rejects.toThrow("deleted");
    await expect(
      assertCliStaticScaffoldComplete(tempRoot, ["ui/index.tsx"]),
    ).rejects.toThrow("dreamboard sync");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("refreshes generated testing-types on update when the file is still framework-owned", async () => {
  const { scaffoldStaticWorkspace } = await loadStaticScaffold();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));
  const testingTypesPath = path.join(tempRoot, "test", "testing-types.ts");

  try {
    await scaffoldStaticWorkspace(tempRoot, "new");
    await Bun.write(
      testingTypesPath,
      `// Generated by dreamboard — do not edit by hand.\nexport function defineScenario(scenario) { return scenario; }\n`,
    );

    await scaffoldStaticWorkspace(tempRoot, "update");

    const refreshed = await Bun.file(testingTypesPath).text();
    expect(refreshed).toContain("./generated/testing-contract");
    expect(refreshed).toContain("// Generated by dreamboard");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("update preserves user-edited scaffolded scenarios", async () => {
  const { scaffoldStaticWorkspace } = await loadStaticScaffold();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));
  const scenarioPath = path.join(
    tempRoot,
    "test",
    "scenarios",
    "smoke-initial-turn.scenario.ts",
  );
  const userScenario = `import { defineScenario } from "../testing-types";

export default defineScenario({
  id: "custom-smoke",
  from: "initial-turn",
  when: async () => undefined,
  then: ({ expect, players }) => {
    expect(players().length).toBeGreaterThanOrEqual(1);
  },
});
`;

  try {
    await scaffoldStaticWorkspace(tempRoot, "new");
    await Bun.write(scenarioPath, userScenario);

    await scaffoldStaticWorkspace(tempRoot, "update");

    expect(await Bun.file(scenarioPath).text()).toBe(userScenario);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("update preserves edited scaffold scenarios that still keep the scaffold header", async () => {
  const { scaffoldStaticWorkspace } = await loadStaticScaffold();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));
  const scenarioPath = path.join(
    tempRoot,
    "test",
    "scenarios",
    "smoke-initial-turn.scenario.ts",
  );
  const editedScenario = `// Generated by dreamboard scaffold.
import { defineScenario } from "../testing-types";

export default defineScenario({
  id: "edited-smoke",
  description: "User edited scenario that still keeps the scaffold header.",
  from: "initial-turn",
  when: async () => undefined,
  then: ({ expect, state }) => {
    expect(state()).toBe("setup");
  },
});
`;

  try {
    await scaffoldStaticWorkspace(tempRoot, "new");
    await Bun.write(scenarioPath, editedScenario);

    await scaffoldStaticWorkspace(tempRoot, "update");

    expect(await Bun.file(scenarioPath).text()).toBe(editedScenario);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("update keeps the canonical scaffold scenario content intact", async () => {
  const { scaffoldStaticWorkspace } = await loadStaticScaffold();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));
  const scenarioPath = path.join(
    tempRoot,
    "test",
    "scenarios",
    "smoke-initial-turn.scenario.ts",
  );

  try {
    await scaffoldStaticWorkspace(tempRoot, "new");
    const initialScenario = await Bun.file(scenarioPath).text();

    await scaffoldStaticWorkspace(tempRoot, "update");

    expect(await Bun.file(scenarioPath).text()).toBe(initialScenario);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

// End-to-end typecheck of a materialized scaffold is covered by
// `local-typecheck.test.ts`'s empty-manifest case (which exercises the same
// `scaffoldStaticWorkspace` + `generateDynamicGeneratedFiles` + `tsc --noEmit`
// pathway through the real `runLocalTypecheck` entry point). Keep this file
// focused on scaffold-file correctness to keep the suite fast.
