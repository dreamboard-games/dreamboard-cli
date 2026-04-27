import { rmSync } from "node:fs";
import { createRequire } from "node:module";
import react from "@vitejs/plugin-react";
import tailwindcssPostcss from "@tailwindcss/postcss";
import { createServer, type ViteDevServer } from "vite";
import { createDevRuntimePlatform } from "./dev-runtime-platform.js";
import { createVirtualDevModulesPlugin } from "./dev-virtual-modules-plugin.js";
import { createDevLogRelayPlugin } from "./dev-log-relay-plugin.js";
import { prepareFallbackStylesheet } from "./dev-fallback-stylesheet.js";
import type { DreamboardDevRuntimeConfig } from "./dev-runtime-config.js";

const require = createRequire(import.meta.url);
const tailwindCssEntry = require.resolve("tailwindcss/index.css");

export type { DreamboardDevRuntimeConfig } from "./dev-runtime-config.js";

export async function startDreamboardDevServer(options: {
  projectRoot: string;
  sessionFilePath: string;
  port?: number;
  runtimeConfig: DreamboardDevRuntimeConfig;
}): Promise<{
  url: string;
  close: () => Promise<void>;
  server: ViteDevServer;
}> {
  const { projectRoot, port, runtimeConfig } = options;
  const platform = createDevRuntimePlatform({
    importMetaUrl: import.meta.url,
    projectRoot,
    debug: runtimeConfig.debug,
    port,
    tailwindCssEntry,
  });
  const generatedFallbackStylesheetPath = prepareFallbackStylesheet({
    projectRoot,
    repoRoot: platform.repoRoot,
  });

  const server = await createServer({
    root: platform.devHostRoot,
    appType: "spa",
    plugins: [
      react(),
      createVirtualDevModulesPlugin({
        projectRoot,
        runtimeConfig,
        generatedFallbackStylesheetPath,
      }),
      createDevLogRelayPlugin({
        sessionFilePath: options.sessionFilePath,
        runtimeConfig,
        diagnosticsLevel: platform.diagnosticsLevel,
      }),
    ],
    css: {
      postcss: {
        plugins: [tailwindcssPostcss()],
      },
    },
    logLevel: platform.viteLogLevel,
    resolve: {
      dedupe: platform.resolveDedupe,
      alias: platform.resolveAlias,
    },
    optimizeDeps: {
      exclude: platform.optimizeDepsExclude,
    },
    server: platform.serverConfig,
  });

  await server.listen();
  const resolvedPort = getBoundPort(server);
  return {
    url: `http://localhost:${resolvedPort}/index.html`,
    close: async () => {
      await server.close();
      if (generatedFallbackStylesheetPath) {
        rmSync(generatedFallbackStylesheetPath, { force: true });
      }
    },
    server,
  };
}

function getBoundPort(server: ViteDevServer): number {
  const address = server.httpServer?.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to determine local dev server port.");
  }
  return address.port;
}
