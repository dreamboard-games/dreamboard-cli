import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, test } from "bun:test";
import {
  collectPackageFingerprintFiles,
  readPackagePublishFingerprint,
} from "./local-snapshot-fingerprint.js";

const tempDirs: string[] = [];

async function createTempPackageRoot(): Promise<string> {
  const packageRoot = await mkdtemp(
    path.join(os.tmpdir(), "local-snapshot-fingerprint-"),
  );
  tempDirs.push(packageRoot);
  return packageRoot;
}

async function writePackageFile(
  packageRoot: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const fullPath = path.join(packageRoot, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content);
}

afterEach(async () => {
  await Promise.all(
    tempDirs
      .splice(0)
      .map((tempDir) => rm(tempDir, { recursive: true, force: true })),
  );
});

test("collectPackageFingerprintFiles excludes cache and generated artifacts", async () => {
  const packageRoot = await createTempPackageRoot();
  await writePackageFile(packageRoot, "package.json", '{"name":"demo"}');
  await writePackageFile(
    packageRoot,
    "src/index.ts",
    "export const demo = 1;\n",
  );
  await writePackageFile(packageRoot, ".turbo/turbo-build.log", "build log");
  await writePackageFile(packageRoot, "type-stubs/ui-contract.js", "generated");
  await writePackageFile(packageRoot, "dist/index.js", "built");
  await writePackageFile(packageRoot, "tsconfig.tsbuildinfo", "cache");

  await expect(collectPackageFingerprintFiles(packageRoot)).resolves.toEqual([
    "package.json",
    "src/index.ts",
  ]);
});

test("readPackagePublishFingerprint is stable across generated artifact churn", async () => {
  const packageRoot = await createTempPackageRoot();
  await writePackageFile(packageRoot, "package.json", '{"name":"demo"}');
  await writePackageFile(
    packageRoot,
    "src/index.ts",
    "export const demo = 1;\n",
  );
  await writePackageFile(packageRoot, ".turbo/turbo-build.log", "first log");

  const initialFingerprint = await readPackagePublishFingerprint(packageRoot);

  await writePackageFile(packageRoot, ".turbo/turbo-build.log", "second log");
  await writePackageFile(packageRoot, "type-stubs/ui-contract.js", "generated");

  await expect(readPackagePublishFingerprint(packageRoot)).resolves.toBe(
    initialFingerprint,
  );
});
