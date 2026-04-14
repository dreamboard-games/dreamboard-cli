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
  const repoRoot = path.resolve(devHostRoot, "../../../..");
  const cliRoot = path.resolve(devHostRoot, "../..");
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
        replacement: path.resolve(cliRoot, "node_modules/react/index.js"),
      },
      {
        find: /^react\/jsx-runtime$/,
        replacement: path.resolve(cliRoot, "node_modules/react/jsx-runtime.js"),
      },
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: path.resolve(
          cliRoot,
          "node_modules/react/jsx-dev-runtime.js",
        ),
      },
      {
        find: /^react-dom$/,
        replacement: path.resolve(cliRoot, "node_modules/react-dom/index.js"),
      },
      {
        find: /^react-dom\/client$/,
        replacement: path.resolve(cliRoot, "node_modules/react-dom/client.js"),
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
        find: /^@dreamboard\/ui-sdk$/,
        replacement: path.resolve(repoRoot, "packages/ui-sdk/src/index.ts"),
      },
      ...createUiSdkAliases(repoRoot),
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

function createUiSdkAliases(repoRoot: string): Alias[] {
  const uiSdkRoot = path.resolve(repoRoot, "packages/ui-sdk/src");
  return [
    {
      find: /^@dreamboard\/ui-sdk\/reducer$/,
      replacement: path.resolve(uiSdkRoot, "reducer.ts"),
    },
    {
      find: /^@dreamboard\/ui-sdk\/internal\/runtime-context$/,
      replacement: path.resolve(uiSdkRoot, "context/RuntimeContext.tsx"),
    },
    {
      find: /^@dreamboard\/ui-sdk\/internal\/usePluginRuntime$/,
      replacement: path.resolve(uiSdkRoot, "hooks/usePluginRuntime.ts"),
    },
    {
      find: /^@dreamboard\/ui-sdk\/internal\/createPluginRuntimeAPI$/,
      replacement: path.resolve(uiSdkRoot, "runtime/createPluginRuntimeAPI.ts"),
    },
    {
      find: /^@dreamboard\/ui-sdk\/internal\/useHandLayout$/,
      replacement: path.resolve(uiSdkRoot, "hooks/useHandLayout.ts"),
    },
    {
      find: /^@dreamboard\/ui-sdk\/internal\/usePanZoom$/,
      replacement: path.resolve(uiSdkRoot, "hooks/usePanZoom.ts"),
    },
    {
      find: /^@dreamboard\/ui-sdk\/internal\/useIsMobile$/,
      replacement: path.resolve(uiSdkRoot, "hooks/useIsMobile.ts"),
    },
    {
      find: /^@dreamboard\/ui-sdk\/internal\/player-state$/,
      replacement: path.resolve(uiSdkRoot, "types/player-state.ts"),
    },
    {
      find: /^@dreamboard\/ui-sdk\/internal\/plugin-state$/,
      replacement: path.resolve(uiSdkRoot, "types/plugin-state.ts"),
    },
    {
      find: /^@dreamboard\/ui-sdk\/types\/runtime-api$/,
      replacement: path.resolve(uiSdkRoot, "types/runtime-api.ts"),
    },
    {
      find: /^@dreamboard\/ui-sdk\/plugin-styles\.css$/,
      replacement: path.resolve(uiSdkRoot, "plugin-styles.css"),
    },
  ];
}

function resolveDevHostRoot(importMetaUrl: string): string {
  const currentDir = path.dirname(fileURLToPath(importMetaUrl));
  const sourceDirCandidate = path.resolve(currentDir, "../src/dev-host");
  return existsSync(sourceDirCandidate) ? sourceDirCandidate : currentDir;
}
