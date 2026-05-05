import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { build } from "esbuild";
import { expect, test } from "bun:test";
import {
  createRepoLocalPackageResolutionPlugin,
  resolveRepoLocalPackageSource,
} from "./repo-local-package-resolution.js";

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(filePath: string, content: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
}

async function createFakeRepo(): Promise<string> {
  const repoRoot = await mkdtemp(
    path.join(os.tmpdir(), "dreamboard-repo-local-resolution-"),
  );

  await writeFile(
    path.join(repoRoot, "pnpm-workspace.yaml"),
    "packages:\n  - packages/*\n",
  );
  await writeJson(
    path.join(repoRoot, "apps", "dreamboard-cli", "package.json"),
    {
      name: "dreamboard-cli",
      private: true,
    },
  );

  await writeJson(
    path.join(repoRoot, "packages", "sdk-types", "package.json"),
    {
      name: "@dreamboard/sdk-types",
      type: "module",
      exports: {
        ".": {
          bun: "./src/index.ts",
          import: "./dist/index.js",
        },
      },
    },
  );
  await writeText(
    path.join(repoRoot, "packages", "sdk-types", "src", "index.ts"),
    'export const sdkMarker = "sdk-source";\n',
  );

  await writeJson(path.join(repoRoot, "packages", "app-sdk", "package.json"), {
    name: "@dreamboard/app-sdk",
    type: "module",
    exports: {
      "./reducer": {
        bun: "./src/reducer.ts",
        import: "./dist/reducer.js",
      },
    },
  });
  await writeText(
    path.join(repoRoot, "packages", "app-sdk", "src", "reducer.ts"),
    'export const reducerMarker = "reducer-source";\n',
  );

  return repoRoot;
}

test("resolveRepoLocalPackageSource reads bun exports from package manifests", async () => {
  const repoRoot = await createFakeRepo();

  try {
    expect(
      resolveRepoLocalPackageSource("@dreamboard/sdk-types", { repoRoot }),
    ).toBe(path.join(repoRoot, "packages", "sdk-types", "src", "index.ts"));
    expect(
      resolveRepoLocalPackageSource("@dreamboard/app-sdk/reducer", {
        repoRoot,
      }),
    ).toBe(path.join(repoRoot, "packages", "app-sdk", "src", "reducer.ts"));
    expect(
      resolveRepoLocalPackageSource("@dreamboard/app-sdk", { repoRoot }),
    ).toBeNull();
    expect(
      resolveRepoLocalPackageSource("@dreamboard/app-sdk/reducer/model", {
        repoRoot,
      }),
    ).toBeNull();
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("repo-local package resolution plugin bundles source-checkout imports without dist outputs", async () => {
  const repoRoot = await createFakeRepo();
  const entryPath = path.join(repoRoot, "entry.ts");
  await writeText(
    entryPath,
    [
      'import { sdkMarker } from "@dreamboard/sdk-types";',
      'import { reducerMarker } from "@dreamboard/app-sdk/reducer";',
      'export const combined = [sdkMarker, reducerMarker].join(",");',
      "",
    ].join("\n"),
  );

  try {
    const result = await build({
      absWorkingDir: repoRoot,
      entryPoints: [entryPath],
      bundle: true,
      format: "esm",
      platform: "node",
      target: "node20",
      write: false,
      plugins: [createRepoLocalPackageResolutionPlugin({ repoRoot })],
    });

    const outputText = result.outputFiles?.[0]?.text ?? "";
    expect(outputText).toContain("sdk-source");
    expect(outputText).toContain("reducer-source");
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});
