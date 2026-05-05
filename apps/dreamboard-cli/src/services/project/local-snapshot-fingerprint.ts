import crypto from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const IGNORED_FINGERPRINT_PATH_SEGMENTS = new Set([
  "node_modules",
  "dist",
  ".turbo",
  "type-stubs",
  "coverage",
  ".vitest-cache",
]);

const IGNORED_FINGERPRINT_BASENAMES = new Set(["pnpm-lock.yaml", ".DS_Store"]);

function normalizeRelativePath(relativePath: string): string {
  return relativePath.split(path.sep).join("/");
}

export function shouldIgnoreSnapshotFingerprintPath(
  relativePath: string,
): boolean {
  const normalizedRelativePath = normalizeRelativePath(relativePath);
  const pathSegments = normalizedRelativePath.split("/");
  const basename =
    pathSegments[pathSegments.length - 1] ?? normalizedRelativePath;

  return (
    pathSegments.some((segment) =>
      IGNORED_FINGERPRINT_PATH_SEGMENTS.has(segment),
    ) ||
    IGNORED_FINGERPRINT_BASENAMES.has(basename) ||
    basename.endsWith(".tsbuildinfo")
  );
}

async function walkFingerprintFiles(
  rootDir: string,
  currentDir: string,
  files: string[],
): Promise<void> {
  const entries = await readdir(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relativePath = normalizeRelativePath(
      path.relative(rootDir, fullPath),
    );
    if (shouldIgnoreSnapshotFingerprintPath(relativePath)) {
      continue;
    }
    if (entry.isDirectory()) {
      await walkFingerprintFiles(rootDir, fullPath, files);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    files.push(relativePath);
  }
}

export async function collectPackageFingerprintFiles(
  packageRoot: string,
): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(packageRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (shouldIgnoreSnapshotFingerprintPath(entry.name)) {
      continue;
    }
    const fullPath = path.join(packageRoot, entry.name);
    if (entry.isDirectory()) {
      await walkFingerprintFiles(packageRoot, fullPath, files);
      continue;
    }
    if (entry.isFile()) {
      files.push(entry.name);
    }
  }

  return Array.from(new Set(files)).sort();
}

export async function readPackagePublishFingerprint(
  packageRoot: string,
): Promise<string> {
  const files = await collectPackageFingerprintFiles(packageRoot);
  const parts: string[] = [];
  for (const relativePath of files) {
    const content = await readFile(
      path.join(packageRoot, relativePath),
      "utf8",
    );
    parts.push(`${relativePath}\n${content}`);
  }
  return crypto
    .createHash("sha256")
    .update(parts.join("\n---\n"))
    .digest("hex");
}
