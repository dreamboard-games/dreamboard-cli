import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { afterEach, expect, test } from "bun:test";

import { prepareFallbackStylesheet } from "./dev-fallback-stylesheet.ts";

const tempDirs: string[] = [];

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

test("creates a unique fallback stylesheet path for each dev server instance", () => {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "dreamboard-repo-"));
  const projectRoot = mkdtempSync(path.join(tmpdir(), "dreamboard-project-"));
  tempDirs.push(repoRoot, projectRoot);

  const firstPath = prepareFallbackStylesheet({ projectRoot, repoRoot });
  const secondPath = prepareFallbackStylesheet({ projectRoot, repoRoot });

  expect(firstPath).not.toBeNull();
  expect(secondPath).not.toBeNull();
  expect(firstPath).not.toBe(secondPath);
  expect(path.basename(firstPath!)).toMatch(
    /^plugin-styles-[a-f0-9]{8}-[a-f0-9]{8}\.css$/,
  );
  expect(readFileSync(firstPath!, "utf8")).toContain("@import");
  expect(readFileSync(secondPath!, "utf8")).toContain("@source");
});
