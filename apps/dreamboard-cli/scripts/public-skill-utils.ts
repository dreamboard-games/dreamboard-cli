import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repoRoot = path.resolve(packageRoot, "..", "..");
const packageSkillRoot = path.join(packageRoot, "skills", "dreamboard");
const repoSkillRoot = path.join(repoRoot, "skills", "dreamboard");
const ALLOWED_PUBLIC_SKILL_SCRIPT_ENTRY_NAMES = new Set<string>();

export const IGNORED_PUBLIC_SKILL_ENTRY_NAMES = new Set([
  ".DS_Store",
  "__pycache__",
]);

export async function resolvePublicSkillRoot(): Promise<string | null> {
  try {
    await access(repoSkillRoot);
    return repoSkillRoot;
  } catch {
    try {
      await access(packageSkillRoot);
      return packageSkillRoot;
    } catch {
      return null;
    }
  }
}

export async function assertPublicSkillScriptsArePublishable(
  rootDir: string | null,
) {
  if (!rootDir) {
    return;
  }
  const scriptsDir = path.join(rootDir, "scripts");
  try {
    await access(scriptsDir);
  } catch {
    return;
  }
  const entries = await readdir(scriptsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORED_PUBLIC_SKILL_ENTRY_NAMES.has(entry.name)) {
      continue;
    }
    if (!ALLOWED_PUBLIC_SKILL_SCRIPT_ENTRY_NAMES.has(entry.name)) {
      throw new Error(
        `Unexpected entry under skills/dreamboard/scripts: ${entry.name}. Keep local-only assets outside the public skill tree.`,
      );
    }
    if (!entry.isFile()) {
      throw new Error(
        `Only published helper files belong under skills/dreamboard/scripts. Found non-file entry: ${entry.name}.`,
      );
    }
  }
}
