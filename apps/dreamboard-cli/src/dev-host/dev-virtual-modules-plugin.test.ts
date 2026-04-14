import { expect, test } from "bun:test";
import { createVirtualDevModulesPlugin } from "./dev-virtual-modules-plugin.ts";

const runtimeConfig = {
  apiBaseUrl: "http://127.0.0.1:8080",
  authToken: null,
  userId: "user-1",
  sessionId: "session-1",
  shortCode: "short-code",
  gameId: "game-1",
  seed: 1337,
  compiledResultId: "result-1",
  setupProfileId: null,
  playerCount: 4,
  debug: false,
  slug: "test-game",
  autoStartGame: false,
};

test("project entry virtual module bootstraps App under PluginRuntime", async () => {
  const plugin = createVirtualDevModulesPlugin({
    projectRoot: "/tmp/project",
    runtimeConfig,
    generatedFallbackStylesheetPath: null,
  });

  const resolvedId = plugin.resolveId?.("virtual:dreamboard-project-entry");
  expect(resolvedId).toBe("\0virtual:dreamboard-project-entry");

  const source = await plugin.load?.(resolvedId as string);
  expect(source).toContain(
    'import { RuntimeProvider } from "@dreamboard/ui-sdk/internal/runtime-context";',
  );
  expect(source).toContain(
    'import { usePluginRuntime } from "@dreamboard/ui-sdk/internal/usePluginRuntime";',
  );
  expect(source).toContain('import "/@fs//tmp/project/ui/style.css";');
  expect(source).toContain('import App from "/@fs//tmp/project/ui/App.tsx";');
  expect(source).toContain("function DreamboardPluginRoot()");
  expect(source).toContain("createElement(DreamboardPluginRoot)");
});
