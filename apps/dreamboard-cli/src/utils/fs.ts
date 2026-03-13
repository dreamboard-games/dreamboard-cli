import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { SKILL_ASSET_FILES } from "../generated/skill-content.generated.js";

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

/**
 * Copies the bundled public skill into `.agents/skills/dreamboard/` inside the
 * given project root so that AI coding agents can discover it.
 */
export async function installSkillFile(projectRoot: string): Promise<void> {
  const skillRoot = path.join(projectRoot, ".agents", "skills", "dreamboard");
  for (const [relativePath, content] of Object.entries(SKILL_ASSET_FILES)) {
    const targetPath = path.join(skillRoot, relativePath);
    await ensureDir(path.dirname(targetPath));
    await writeFile(targetPath, content, "utf8");
  }
}

export async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readTextFile(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}

export async function readTextFileIfExists(
  filePath: string,
): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

export async function writeTextFile(
  filePath: string,
  content: string,
): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, content, "utf8");
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const data = await readTextFile(filePath);
  return JSON.parse(data) as T;
}

export async function writeJsonFile(
  filePath: string,
  data: unknown,
): Promise<void> {
  await writeTextFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}
