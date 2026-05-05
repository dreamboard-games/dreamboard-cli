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
  optimizeDepsExclude: string[];
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
    resolveDedupe: [
      "react",
      "react-dom",
      "@dreamboard/ui-sdk",
      "@dreamboard/sdk-types",
    ],
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
        find: /^@dreamboard\/ui-sdk$/,
        replacement: path.resolve(repoRoot, "packages/ui-sdk/src/index.ts"),
      },
      {
        find: /^@dreamboard\/ui-sdk\/reducer$/,
        replacement: path.resolve(repoRoot, "packages/ui-sdk/src/reducer.ts"),
      },
      {
        // Must resolve to the same source tree as the `@dreamboard/ui-sdk`
        // alias. If this subpath falls through to `node_modules/.../dist` it
        // creates a second RuntimeContext identity, and consumers calling
        // `useRuntimeContext` on the workspace-source copy will never find
        // the provider that's set up via the dist copy (and vice versa).
        find: /^@dreamboard\/ui-sdk\/components$/,
        replacement: path.resolve(
          repoRoot,
          "packages/ui-sdk/src/components/index.ts",
        ),
      },
      {
        find: /^@dreamboard\/ui-sdk\/internal\/runtime-context$/,
        replacement: path.resolve(
          repoRoot,
          "packages/ui-sdk/src/context/RuntimeContext.tsx",
        ),
      },
      {
        find: /^@dreamboard\/ui-sdk\/internal\/usePluginRuntime$/,
        replacement: path.resolve(
          repoRoot,
          "packages/ui-sdk/src/hooks/usePluginRuntime.ts",
        ),
      },
      {
        find: /^@dreamboard\/ui-sdk\/internal\/createPluginRuntimeAPI$/,
        replacement: path.resolve(
          repoRoot,
          "packages/ui-sdk/src/runtime/createPluginRuntimeAPI.ts",
        ),
      },
      {
        find: /^@dreamboard\/ui-sdk\/internal\/useHandLayout$/,
        replacement: path.resolve(
          repoRoot,
          "packages/ui-sdk/src/hooks/useHandLayout.ts",
        ),
      },
      {
        find: /^@dreamboard\/ui-sdk\/internal\/usePanZoom$/,
        replacement: path.resolve(
          repoRoot,
          "packages/ui-sdk/src/hooks/usePanZoom.ts",
        ),
      },
      {
        find: /^@dreamboard\/ui-sdk\/internal\/useIsMobile$/,
        replacement: path.resolve(
          repoRoot,
          "packages/ui-sdk/src/hooks/useIsMobile.ts",
        ),
      },
      {
        find: /^@dreamboard\/ui-sdk\/internal\/player-state$/,
        replacement: path.resolve(
          repoRoot,
          "packages/ui-sdk/src/types/player-state.ts",
        ),
      },
      {
        find: /^@dreamboard\/ui-sdk\/internal\/tiled-board$/,
        replacement: path.resolve(
          repoRoot,
          "packages/ui-sdk/src/types/tiled-board.ts",
        ),
      },
      {
        find: /^@dreamboard\/ui-sdk\/internal\/plugin-state$/,
        replacement: path.resolve(
          repoRoot,
          "packages/ui-sdk/src/types/plugin-state.ts",
        ),
      },
      {
        find: /^@dreamboard\/ui-sdk\/types\/runtime-api$/,
        replacement: path.resolve(
          repoRoot,
          "packages/ui-sdk/src/types/runtime-api.ts",
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
        find: /^@dreamboard\/ui-sdk\/plugin-styles\.css$/,
        replacement: resolveCliDependency(
          require,
          cliRoot,
          "@dreamboard/ui-sdk/plugin-styles.css",
          "packages/ui-sdk/src/plugin-styles.css",
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
    optimizeDepsExclude: ["@dreamboard/ui-sdk", "@dreamboard/sdk-types"],
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
