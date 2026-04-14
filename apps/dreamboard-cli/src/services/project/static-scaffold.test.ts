import { mkdtemp, mkdir, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { expect, test } from "bun:test";
import {
  assertCliStaticScaffoldComplete,
  resolveStaticAssetRoot,
  scaffoldStaticWorkspace,
} from "./static-scaffold.js";

const TYPECHECK_FIXTURE_ROOT = path.resolve(
  import.meta.dir,
  "__fixtures__/static-typecheck",
);
/** Package deps (e.g. zod) resolve from the CLI workspace, not the monorepo root. */
const WORKSPACE_NODE_MODULES = path.join(
  path.resolve(import.meta.dir, "../../.."),
  "node_modules",
);
const UI_SDK_NODE_MODULES = path.join(
  path.resolve(import.meta.dir, "../../../../../packages/ui-sdk"),
  "node_modules",
);
const REQUIRE = createRequire(import.meta.url);
const TSC_BIN = REQUIRE.resolve("typescript/bin/tsc");

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
        path.join(tempRoot, "shared", "game-message.d.ts"),
      ).exists(),
    ).toBe(false);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("resolves scaffold assets for bundled dist builds", async () => {
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

test("fails compile preflight when shared static files are missing", async () => {
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

test("materialized static scaffold typechecks for app and ui targets", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-static-scaffold-"));

  try {
    await scaffoldStaticWorkspace(tempRoot, "new");
    await seedDynamicFilesForTypecheck(tempRoot);

    runTypecheck(tempRoot, "app/tsconfig.json");
    runTypecheck(tempRoot, "ui/tsconfig.json");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}, 20_000);
