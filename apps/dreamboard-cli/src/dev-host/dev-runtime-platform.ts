import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import type { Alias, ServerOptions } from "vite";
import { resolveDevDiagnosticsLevel } from "./dev-diagnostics.js";

export interface DevRuntimePlatformOptions {
  importMetaUrl: string;
  projectRoot: string;
  debug: boolean;
  port?: number;
  tailwindCssEntry: string;
}

export interface DevRuntimePlatform {
  devHostRoot: string;
  repoRoot: string;
  cliRoot: string;
  diagnosticsLevel: ReturnType<typeof resolveDevDiagnosticsLevel>;
  viteLogLevel: "info" | "warn";
  serverConfig: ServerOptions;
  resolveDedupe: string[];
  resolveAlias: Alias[];
}

export function createDevRuntimePlatform(
  options: DevRuntimePlatformOptions,
): DevRuntimePlatform {
  const devHostRoot = resolveDevHostRoot(options.importMetaUrl);
  const cliRoot = resolveCliRoot(options.importMetaUrl);
  const repoRoot = resolveRepoRoot(cliRoot);
  const require = createRequire(options.importMetaUrl);
  const diagnosticsLevel = resolveDevDiagnosticsLevel(options.debug);

  return {
    devHostRoot,
    repoRoot,
    cliRoot,
    diagnosticsLevel,
    viteLogLevel: diagnosticsLevel === "verbose" ? "info" : "warn",
    serverConfig: {
      host: "localhost",
      port: options.port ?? 5173,
      strictPort: false,
      watch: {
        ignored: [/[\\/]\.dreamboard[\\/]/],
      },
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
      fs: {
        allow: [options.projectRoot, repoRoot],
      },
    },
    resolveDedupe: ["react", "react-dom"],
    resolveAlias: [
      {
        find: /^react$/,
        replacement: resolveCliDependency(
          require,
          cliRoot,
          "react",
          "node_modules/react/index.js",
        ),
      },
      {
        find: /^react\/jsx-runtime$/,
        replacement: resolveCliDependency(
          require,
          cliRoot,
          "react/jsx-runtime",
          "node_modules/react/jsx-runtime.js",
        ),
      },
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: resolveCliDependency(
          require,
          cliRoot,
          "react/jsx-dev-runtime",
          "node_modules/react/jsx-dev-runtime.js",
        ),
      },
      {
        find: /^react-dom$/,
        replacement: resolveCliDependency(
          require,
          cliRoot,
          "react-dom",
          "node_modules/react-dom/index.js",
        ),
      },
      {
        find: /^react-dom\/client$/,
        replacement: resolveCliDependency(
          require,
          cliRoot,
          "react-dom/client",
          "node_modules/react-dom/client.js",
        ),
      },
      {
        find: /^@dreamboard\/manifest-contract$/,
        replacement: path.resolve(
          options.projectRoot,
          "shared/manifest-contract.ts",
        ),
      },
      {
        find: /^@dreamboard\/ui-contract$/,
        replacement: path.resolve(
          options.projectRoot,
          "shared/generated/ui-contract.ts",
        ),
      },
      {
        find: /^@shared\/(.*)$/,
        replacement: path.resolve(options.projectRoot, "shared/$1"),
      },
      {
        find: /^tailwindcss$/,
        replacement: options.tailwindCssEntry,
      },
    ],
  };
}

function resolveCliDependency(
  require: NodeJS.Require,
  cliRoot: string,
  specifier: string,
  fallbackRelativePath: string,
): string {
  try {
    return require.resolve(specifier);
  } catch {
    return path.resolve(cliRoot, fallbackRelativePath);
  }
}

function resolveDevHostRoot(importMetaUrl: string): string {
  const currentDir = path.dirname(fileURLToPath(importMetaUrl));
  const sourceDirCandidate = path.resolve(currentDir, "../src/dev-host");
  return existsSync(sourceDirCandidate) ? sourceDirCandidate : currentDir;
}

function resolveCliRoot(importMetaUrl: string): string {
  let currentDir = path.dirname(fileURLToPath(importMetaUrl));

  while (true) {
    if (existsSync(path.join(currentDir, "package.json"))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return path.resolve(resolveDevHostRoot(importMetaUrl), "../..");
    }
    currentDir = parentDir;
  }
}

function resolveRepoRoot(cliRoot: string): string {
  let currentDir = cliRoot;

  while (true) {
    if (existsSync(path.join(currentDir, "pnpm-workspace.yaml"))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return cliRoot;
    }
    currentDir = parentDir;
  }
}
