import path from "node:path";
import { expect, test } from "bun:test";
import { STATIC_SCAFFOLD_FILES } from "../../scaffold/static/static-files.generated.js";
import { SCAFFOLD_OWNERSHIP } from "./scaffold-ownership.generated.js";
import {
  isCliStaticPath,
  isDynamicGeneratedPath,
  isDynamicSeedPath,
  isLibraryPath,
} from "./scaffold-ownership.js";

test("generated ownership file matches shared ownership manifest", async () => {
  const ownershipPath = path.resolve(
    import.meta.dir,
    "../../../../../packages/sdk-types/scaffolding/ownership.json",
  );
  const sharedOwnership = (await Bun.file(
    ownershipPath,
  ).json()) as typeof SCAFFOLD_OWNERSHIP;
  expect(SCAFFOLD_OWNERSHIP).toEqual(sharedOwnership);
});

test("all bundled static scaffold files are classified as cli-static only", () => {
  for (const entry of STATIC_SCAFFOLD_FILES) {
    expect(isCliStaticPath(entry.targetPath)).toBe(true);
    expect(isDynamicGeneratedPath(entry.targetPath)).toBe(false);
    expect(isDynamicSeedPath(entry.targetPath)).toBe(false);
    expect(isLibraryPath(entry.targetPath)).toBe(true);
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

test("ownership exact cli-static files are all bundled in the scaffold", () => {
  const bundledPaths = new Set(
    STATIC_SCAFFOLD_FILES.map((entry) => entry.targetPath),
  );

  for (const filePath of SCAFFOLD_OWNERSHIP.cliStatic.exactFiles) {
    expect(bundledPaths.has(filePath)).toBe(true);
  }
});

test("ownership cli-static directory prefixes are represented in the scaffold", () => {
  const bundledPaths = STATIC_SCAFFOLD_FILES.map((entry) => entry.targetPath);

  for (const prefix of SCAFFOLD_OWNERSHIP.cliStatic.directoryPrefixes) {
    expect(bundledPaths.some((filePath) => filePath.startsWith(prefix))).toBe(
      true,
    );
  }
});
