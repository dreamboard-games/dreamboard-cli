import { mkdtemp, mkdir, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "bun:test";
import { STATIC_SCAFFOLD_FILES } from "../../scaffold/static/static-files.generated.js";
import {
  assertCliStaticScaffoldComplete,
  collectModifiedStaticSdkFiles,
  scaffoldStaticWorkspace,
} from "./static-scaffold.js";

const TYPECHECK_FIXTURE_ROOT = path.resolve(
  import.meta.dir,
  "__fixtures__/static-typecheck",
);
const WORKSPACE_NODE_MODULES = path.join(
  path.resolve(import.meta.dir, "../../../../.."),
  "node_modules",
);
const UI_SDK_NODE_MODULES = path.join(
  path.resolve(import.meta.dir, "../../../../../packages/ui-sdk"),
  "node_modules",
);
const TSC_BIN = path.join(WORKSPACE_NODE_MODULES, ".bin", "tsc");

async function seedDynamicFilesForTypecheck(tempRoot: string): Promise<void> {
  const fixtureFiles = [
    "shared/manifest.ts",
    "shared/ui-args.ts",
    "app/generated/guards.ts",
    "ui/App.tsx",
  ] as const;

  for (const relativePath of fixtureFiles) {
    const sourcePath = path.join(TYPECHECK_FIXTURE_ROOT, relativePath);
    const targetPath = path.join(tempRoot, relativePath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await Bun.write(targetPath, await Bun.file(sourcePath).text());
  }

  await symlink(WORKSPACE_NODE_MODULES, path.join(tempRoot, "node_modules"));
  await symlink(UI_SDK_NODE_MODULES, path.join(tempRoot, "ui", "node_modules"));
}

function runTypecheck(tempRoot: string, projectPath: string): void {
  const result = Bun.spawnSync({
    cmd: [TSC_BIN, "--noEmit", "-p", projectPath],
    cwd: tempRoot,
    stdout: "pipe",
    stderr: "pipe",
  });

  if (result.exitCode === 0) {
    return;
  }

  const decoder = new TextDecoder();
  throw new Error(
    `Typecheck failed for ${projectPath}\nstdout:\n${decoder.decode(result.stdout)}\nstderr:\n${decoder.decode(result.stderr)}`,
  );
}

test("scaffolds static framework files locally", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));

  try {
    await scaffoldStaticWorkspace(tempRoot, "new", { updateSdk: true });

    expect(
      await Bun.file(path.join(tempRoot, "app", "tsconfig.json")).exists(),
    ).toBe(true);
    expect(
      await Bun.file(path.join(tempRoot, "ui", "index.tsx")).exists(),
    ).toBe(true);
    expect(
      await Bun.file(
        path.join(tempRoot, "shared", "game-message.d.ts"),
      ).exists(),
    ).toBe(true);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("update-sdk false preserves modified SDK files and true refreshes them", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));
  const sdkFilePath = path.join(
    tempRoot,
    "ui",
    "sdk",
    "components",
    "Card.tsx",
  );

  try {
    await scaffoldStaticWorkspace(tempRoot, "new", { updateSdk: true });

    const original = await Bun.file(sdkFilePath).text();
    const modified = `${original}\n// local change\n`;
    await Bun.write(sdkFilePath, modified);

    const detected = await collectModifiedStaticSdkFiles(tempRoot);
    expect(detected).toContain("ui/sdk/components/Card.tsx");

    await scaffoldStaticWorkspace(tempRoot, "update", { updateSdk: false });
    expect(await Bun.file(sdkFilePath).text()).toBe(modified);

    await scaffoldStaticWorkspace(tempRoot, "update", { updateSdk: true });
    expect(await Bun.file(sdkFilePath).text()).toBe(original);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("migrates legacy scenario testing import to local testing-types", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));

  try {
    const scenariosDir = path.join(tempRoot, "test", "scenarios");
    await mkdir(scenariosDir, { recursive: true });
    const scenarioPath = path.join(scenariosDir, "setup.scenario.ts");
    await Bun.write(
      scenarioPath,
      "import { defineScenario } from '@dreamboard/cli/testing';\nexport default defineScenario({});\n",
    );

    await scaffoldStaticWorkspace(tempRoot, "update");

    const migrated = await Bun.file(scenarioPath).text();
    expect(migrated).toContain("from '../testing-types'");

    const legacyShimPath = path.join(
      tempRoot,
      "node_modules",
      "@dreamboard",
      "cli",
      "testing.js",
    );
    expect(await Bun.file(legacyShimPath).exists()).toBe(false);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("fails push preflight when shared static files are missing", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));
  const missingFilePath = path.join(tempRoot, "shared", "index.ts");

  try {
    await scaffoldStaticWorkspace(tempRoot, "new", { updateSdk: true });
    await rm(missingFilePath, { force: true });

    await expect(assertCliStaticScaffoldComplete(tempRoot)).rejects.toThrow(
      "dreamboard update",
    );
    await expect(assertCliStaticScaffoldComplete(tempRoot)).rejects.toThrow(
      "shared/index.ts",
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("fails push preflight when sdk scaffold files are missing", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));
  const missingFilePath = path.join(
    tempRoot,
    "ui",
    "sdk",
    "components",
    "Card.tsx",
  );

  try {
    await scaffoldStaticWorkspace(tempRoot, "new", { updateSdk: true });
    await rm(missingFilePath, { force: true });

    await expect(assertCliStaticScaffoldComplete(tempRoot)).rejects.toThrow(
      "ui/sdk/components/Card.tsx",
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("fails push preflight when cli static files are deleted locally", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));

  try {
    await scaffoldStaticWorkspace(tempRoot, "new", { updateSdk: true });

    await expect(
      assertCliStaticScaffoldComplete(tempRoot, ["ui/sdk/components/Card.tsx"]),
    ).rejects.toThrow("deleted");
    await expect(
      assertCliStaticScaffoldComplete(tempRoot, ["ui/sdk/components/Card.tsx"]),
    ).rejects.toThrow("dreamboard update");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("refreshes generated testing-types on update when the file is still framework-owned", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));
  const testingTypesPath = path.join(tempRoot, "test", "testing-types.ts");

  try {
    await scaffoldStaticWorkspace(tempRoot, "new", { updateSdk: true });
    await Bun.write(
      testingTypesPath,
      `// Generated by dreamboard — do not edit by hand.\nexport function defineScenario(scenario) { return scenario; }\n`,
    );

    await scaffoldStaticWorkspace(tempRoot, "update");

    const refreshed = await Bun.file(testingTypesPath).text();
    expect(refreshed).toContain("getNormalizedHands");
    expect(refreshed).toContain("getNormalizedDecks");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("static scaffold root sdk files use local types imports", () => {
  const apiWrappers = STATIC_SCAFFOLD_FILES.find(
    (entry) => entry.targetPath === "app/sdk/apiWrappers.ts",
  );
  const stateApi = STATIC_SCAFFOLD_FILES.find(
    (entry) => entry.targetPath === "app/sdk/stateApi.ts",
  );

  expect(apiWrappers?.content).toContain('from "./types"');
  expect(apiWrappers?.content).not.toContain('from "../types"');
  expect(stateApi?.content).toContain('from "./types.js"');
  expect(stateApi?.content).not.toContain('from "../types.js"');
});

test("materialized static scaffold typechecks for app and ui targets", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));

  try {
    await scaffoldStaticWorkspace(tempRoot, "new", { updateSdk: true });
    await seedDynamicFilesForTypecheck(tempRoot);

    runTypecheck(tempRoot, "app/tsconfig.json");
    runTypecheck(tempRoot, "ui/tsconfig.json");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}, 20_000);
