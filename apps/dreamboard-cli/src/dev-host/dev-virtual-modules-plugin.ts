import path from "node:path";
import { normalizePath, type Plugin } from "vite";
import type { DreamboardDevRuntimeConfig } from "./dev-runtime-config.js";

export function createVirtualDevModulesPlugin(options: {
  projectRoot: string;
  runtimeConfig: DreamboardDevRuntimeConfig;
  generatedFallbackStylesheetPath: string | null;
}): Plugin {
  const configModuleId = "virtual:dreamboard-dev-config";
  const resolvedConfigModuleId = `\0${configModuleId}`;
  const projectEntryModuleId = "virtual:dreamboard-project-entry";
  const resolvedProjectEntryModuleId = `\0${projectEntryModuleId}`;
  const projectAppPath = path.resolve(options.projectRoot, "ui/App.tsx");
  const projectStylePath = path.resolve(options.projectRoot, "ui/style.css");

  return {
    name: "dreamboard-dev-virtual-modules",
    resolveId(id) {
      if (id === configModuleId) {
        return resolvedConfigModuleId;
      }
      if (id === projectEntryModuleId) {
        return resolvedProjectEntryModuleId;
      }
      return null;
    },
    load(id) {
      if (id === resolvedConfigModuleId) {
        return `export const devConfig = ${JSON.stringify(options.runtimeConfig)};\nexport default devConfig;\n`;
      }
      if (id === resolvedProjectEntryModuleId) {
        const fallbackImport = options.generatedFallbackStylesheetPath
          ? `import "/@fs/${normalizePath(options.generatedFallbackStylesheetPath)}";\n`
          : "";
        return `${fallbackImport}import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { RuntimeProvider } from "@dreamboard/ui-sdk/internal/runtime-context";
import { usePluginRuntime } from "@dreamboard/ui-sdk/internal/usePluginRuntime";
import "/@fs/${normalizePath(projectStylePath)}";
import App from "/@fs/${normalizePath(projectAppPath)}";

function DreamboardPluginRoot() {
  const { runtime, isReady, error } = usePluginRuntime();

  if (error) {
    return createElement("div", { role: "alert" }, error);
  }

  if (!isReady) {
    return createElement("div", null, "Waiting for game state...");
  }

  return createElement(
    RuntimeProvider,
    { runtime },
    createElement(App),
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Dreamboard dev plugin root element was not found.");
}

createRoot(rootElement).render(
  createElement(DreamboardPluginRoot),
);
`;
      }
      return null;
    },
  };
}
