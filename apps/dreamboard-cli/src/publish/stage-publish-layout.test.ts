import { expect, test } from "bun:test";
import { getPublishedPackageFiles } from "./stage-publish-layout.js";

test("published package file list excludes source-only local maintainer scripts", () => {
  expect(getPublishedPackageFiles(false)).toEqual(["dist", "README.md"]);
  expect(getPublishedPackageFiles(true)).toEqual([
    "dist",
    "README.md",
    "skills",
  ]);
  expect(
    getPublishedPackageFiles(true).some(
      (entry) =>
        entry.includes("scripts") ||
        entry.includes("local-maintainer-registry"),
    ),
  ).toBe(false);
});
