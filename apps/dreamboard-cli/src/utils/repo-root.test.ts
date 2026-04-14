import path from "node:path";
import { expect, test } from "bun:test";
import { resolveCliRepoRoot } from "./repo-root.ts";

test("resolves repo root from bundled dist entrypoints", () => {
  const repoRoot = path.resolve(import.meta.dir, "../../../..");
  const distEntryPath = path.join(
    repoRoot,
    "apps",
    "dreamboard-cli",
    "dist",
    "index.js",
  );

  expect(resolveCliRepoRoot(`file://${distEntryPath}`)).toBe(repoRoot);
});

test("resolves repo root from source entrypoints", () => {
  const repoRoot = path.resolve(import.meta.dir, "../../../..");
  const sourcePath = path.join(
    repoRoot,
    "apps",
    "dreamboard-cli",
    "src",
    "services",
    "project",
    "workspace-dependencies.ts",
  );

  expect(resolveCliRepoRoot(`file://${sourcePath}`)).toBe(repoRoot);
});
