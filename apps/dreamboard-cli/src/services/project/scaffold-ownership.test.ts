import path from "node:path";
import { readdir } from "node:fs/promises";
import { expect, test } from "bun:test";
import { WORKSPACE_CODEGEN_OWNERSHIP } from "@dreamboard/workspace-codegen";
import {
  SCAFFOLD_OWNERSHIP,
  isAllowedGamePath,
  isCliStaticPath,
  isDynamicGeneratedPath,
  isDynamicSeedPath,
  isLibraryPath,
} from "./scaffold-ownership.js";

const STATIC_ASSET_ROOT = path.resolve(
  import.meta.dir,
  "../../scaffold/assets/static",
);
const DYNAMIC_STATIC_PATHS = [
  ".npmrc",
  "package.json",
  "ui/package.json",
] as const;

test("cli scaffold ownership re-exports workspace-codegen ownership", () => {
  expect(SCAFFOLD_OWNERSHIP).toEqual(WORKSPACE_CODEGEN_OWNERSHIP);
});

test("all bundled static scaffold files are classified as framework-owned only", async () => {
  for (const filePath of await collectBundledStaticPaths()) {
    if (isDynamicGeneratedPath(filePath)) {
      expect(isCliStaticPath(filePath)).toBe(false);
      expect(isDynamicSeedPath(filePath)).toBe(false);
      expect(isLibraryPath(filePath)).toBe(true);
      continue;
    }

    if (isDynamicSeedPath(filePath)) {
      expect(isCliStaticPath(filePath)).toBe(false);
      expect(isLibraryPath(filePath)).toBe(false);
      continue;
    }

    expect(isCliStaticPath(filePath)).toBe(true);
    expect(isLibraryPath(filePath)).toBe(false);
  }
});

test("dynamic generated and seed paths are not classified as cli-static", () => {
  for (const dynamicPath of SCAFFOLD_OWNERSHIP.dynamic.generatedFiles) {
    expect(isCliStaticPath(dynamicPath)).toBe(false);
    expect(isDynamicGeneratedPath(dynamicPath)).toBe(true);
  }

  for (const seedPath of SCAFFOLD_OWNERSHIP.dynamic.seedFiles) {
    expect(isCliStaticPath(seedPath)).toBe(false);
    expect(isDynamicSeedPath(seedPath)).toBe(true);
  }

  const seedPatternSample = "app/phases/setup.ts";
  expect(isDynamicSeedPath(seedPatternSample)).toBe(true);
  expect(isCliStaticPath(seedPatternSample)).toBe(false);
});

test("sdk paths are treated as regular allowed authored paths", () => {
  expect(isAllowedGamePath("app/sdk/apiWrappers.ts")).toBe(true);
  expect(isAllowedGamePath("ui/sdk/hooks/useGameState.ts")).toBe(true);
  expect(isDynamicGeneratedPath("app/sdk/apiWrappers.ts")).toBe(false);
  expect(isLibraryPath("ui/sdk/hooks/useGameState.ts")).toBe(false);
});

test("ownership exact cli-static files are all bundled in the scaffold", async () => {
  const bundledPaths = new Set(await collectBundledStaticPaths());

  for (const filePath of SCAFFOLD_OWNERSHIP.cliStatic.exactFiles) {
    expect(bundledPaths.has(filePath)).toBe(true);
  }
});

test("ownership cli-static directory prefixes are represented in the scaffold", async () => {
  const bundledPaths = await collectBundledStaticPaths();

  for (const prefix of SCAFFOLD_OWNERSHIP.cliStatic.directoryPrefixes) {
    expect(bundledPaths.some((filePath) => filePath.startsWith(prefix))).toBe(
      true,
    );
  }
});

async function collectBundledStaticPaths(): Promise<string[]> {
  const paths = [
    ...(await walkAssetFiles(STATIC_ASSET_ROOT)),
    ...DYNAMIC_STATIC_PATHS,
  ].map((filePath) => filePath.replaceAll("\\", "/"));

  paths.sort();
  return paths;
}

async function walkAssetFiles(rootDir: string): Promise<string[]> {
  const files: string[] = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    if (!currentDir) continue;

    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        files.push(path.relative(rootDir, fullPath));
      }
    }
  }

  return files;
}
