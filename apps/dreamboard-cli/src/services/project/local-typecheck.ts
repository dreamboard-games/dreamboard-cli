import { spawn } from "node:child_process";
import { lstat, mkdir, symlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type LocalTypecheckResult = {
  success: boolean;
  output: string;
};

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, "../../../../..");
const WORKSPACE_NODE_MODULES = path.join(REPO_ROOT, "node_modules");
const UI_SDK_NODE_MODULES = path.join(
  REPO_ROOT,
  "packages",
  "ui-sdk",
  "node_modules",
);

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await lstat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureSymlink(targetPath: string, linkPath: string) {
  if (await pathExists(linkPath)) {
    return;
  }

  await mkdir(path.dirname(linkPath), { recursive: true });
  await symlink(
    targetPath,
    linkPath,
    process.platform === "win32" ? "junction" : "dir",
  );
}

async function ensureTypecheckDependencies(projectRoot: string) {
  await ensureSymlink(
    WORKSPACE_NODE_MODULES,
    path.join(projectRoot, "node_modules"),
  );
  await ensureSymlink(
    UI_SDK_NODE_MODULES,
    path.join(projectRoot, "ui", "node_modules"),
  );
}

export async function runLocalTypecheck(
  projectRoot: string,
): Promise<LocalTypecheckResult> {
  await ensureTypecheckDependencies(projectRoot);

  return new Promise((resolve, reject) => {
    const child = spawn("bun", ["run", "typecheck"], {
      cwd: projectRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      reject(
        new Error(
          `Failed to start local typecheck. Ensure Bun is installed and available on PATH. ${error.message}`,
        ),
      );
    });
    child.on("close", (code) => {
      const output = [stdout, stderr].filter(Boolean).join("\n").trim();
      resolve({
        success: code === 0,
        output,
      });
    });
  });
}
