import { expect, test } from "bun:test";
import { createVirtualDevModulesPlugin } from "./dev-virtual-modules-plugin.ts";

const runtimeConfig = {
  apiBaseUrl: "http://127.0.0.1:8080",
  userId: "user-1",
  gameId: "game-1",
  compiledResultId: "result-1",
  setupProfileId: null,
  playerCount: 4,
  debug: false,
  slug: "test-game",
  autoStartGame: false,
  initialSession: {
    sessionId: "session-1",
    shortCode: "short-code",
    gameId: "game-1",
    seed: 1337,
  },
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
    'import { ErrorBoundary, PluginRuntime } from "/@fs//tmp/project/ui/components/dreamboard/index.ts";',
  );
  expect(source).toContain('import "/@fs//tmp/project/ui/style.css";');
  expect(source).toContain('import App from "/@fs//tmp/project/ui/App.tsx";');
  expect(source).toContain("createElement(\n    ErrorBoundary,");
  expect(source).toContain("createElement(\n      PluginRuntime,");
});

test("serialized dev config virtual module does not leak an auth token", async () => {
  const plugin = createVirtualDevModulesPlugin({
    projectRoot: "/tmp/project",
    runtimeConfig,
    generatedFallbackStylesheetPath: null,
  });

  const resolvedId = plugin.resolveId?.("virtual:dreamboard-dev-config");
  expect(resolvedId).toBe("\0virtual:dreamboard-dev-config");

  const source = (await plugin.load?.(resolvedId as string)) as string;
  expect(source).not.toContain("authToken");
  expect(source).not.toContain("Bearer");
  expect(source).not.toContain("refreshToken");
});
