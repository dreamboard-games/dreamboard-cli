import { MANIFEST_TYPECHECK_CONFIG_FILE } from "../../constants.js";
import { spawn } from "node:child_process";
import { lstat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type LocalTypecheckResult = {
  success: boolean;
  output: string;
  skipped?: boolean;
};

type TypecheckRunner = {
  command: string;
  argsPrefix: string[];
};

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, "../../../../..");
const TYPESCRIPT_NODE_MODULES = path.join(REPO_ROOT, "node_modules");
const TYPESCRIPT_BIN_PATH_SEGMENTS = [
  "node_modules",
  "typescript",
  "bin",
  "tsc",
];
const TYPESCRIPT_CLI = path.join(
  TYPESCRIPT_NODE_MODULES,
  "typescript",
  "bin",
  "tsc",
);

function getProjectNodeModules(projectRoot: string): string {
  return path.join(projectRoot, "node_modules");
}

function getProjectTypescriptCli(projectRoot: string): string {
  return path.join(projectRoot, ...TYPESCRIPT_BIN_PATH_SEGMENTS);
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await lstat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureTypecheckDependencies(
  projectRoot: string,
): Promise<string | null> {
  if (await pathExists(getProjectNodeModules(projectRoot))) {
    return null;
  }

  return `Skipping local typecheck: workspace dependencies are not installed at ${getProjectNodeModules(projectRoot)}. Run \`dreamboard sync\` to reconcile workspace dependencies first.`;
}

async function resolveTypecheckRunner(
  projectRoot: string,
): Promise<TypecheckRunner | null> {
  const localTypescriptCli = getProjectTypescriptCli(projectRoot);
  if (await pathExists(localTypescriptCli)) {
    return {
      command: process.execPath,
      argsPrefix: [localTypescriptCli],
    };
  }

  if (await pathExists(TYPESCRIPT_CLI)) {
    return {
      command: process.execPath,
      argsPrefix: [TYPESCRIPT_CLI],
    };
  }

  const globalTscAvailable = await new Promise<boolean>((resolve) => {
    const child = spawn("tsc", ["--version"], {
      env: process.env,
      stdio: "ignore",
    });

    child.on("error", () => {
      resolve(false);
    });
    child.on("close", (code) => {
      resolve(code === 0);
    });
  });

  if (!globalTscAvailable) {
    return null;
  }

  return {
    command: "tsc",
    argsPrefix: [],
  };
}

async function runTypecheckProject(
  runner: TypecheckRunner,
  projectRoot: string,
  projectPath: string,
): Promise<LocalTypecheckResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      runner.command,
      [...runner.argsPrefix, "--noEmit", "-p", projectPath],
      {
        cwd: projectRoot,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      reject(new Error(`Failed to start local typecheck. ${error.message}`));
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

export async function runLocalTypecheck(
  projectRoot: string,
): Promise<LocalTypecheckResult> {
  const dependencySkipReason = await ensureTypecheckDependencies(projectRoot);
  if (dependencySkipReason) {
    return {
      success: true,
      skipped: true,
      output: dependencySkipReason,
    };
  }

  const runner = await resolveTypecheckRunner(projectRoot);
  if (!runner) {
    return {
      success: true,
      skipped: true,
      output:
        "Skipping local typecheck: TypeScript CLI was not found in workspace dependencies or on PATH.",
    };
  }

  for (const projectPath of [
    MANIFEST_TYPECHECK_CONFIG_FILE,
    "app/tsconfig.json",
    "ui/tsconfig.json",
  ]) {
    const result = await runTypecheckProject(runner, projectRoot, projectPath);
    if (!result.success) {
      return result;
    }
  }

  return {
    success: true,
    output: "",
  };
}
