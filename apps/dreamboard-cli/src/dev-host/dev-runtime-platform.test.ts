import os from "node:os";
import path from "node:path";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { describe, expect, test } from "bun:test";

import { createDevRuntimePlatform } from "./dev-runtime-platform.js";

function findAliasReplacement(
  platform: ReturnType<typeof createDevRuntimePlatform>,
  pattern: string,
): string | undefined {
  const alias = platform.resolveAlias.find(
    (entry) => entry.find instanceof RegExp && entry.find.source === pattern,
  );
  return typeof alias?.replacement === "string" ? alias.replacement : undefined;
}

describe("createDevRuntimePlatform", () => {
  test("builds quiet-by-default Vite config with shared React resolution", () => {
    const projectRoot = path.resolve("/tmp/dreamboard-project");
    const tailwindCssEntry = path.resolve(
      "/tmp/dreamboard-project/node_modules/tailwindcss/index.css",
    );

    const platform = createDevRuntimePlatform({
      importMetaUrl: import.meta.url,
      projectRoot,
      debug: false,
      tailwindCssEntry,
    });

    expect(platform.diagnosticsLevel).toBe("errors");
    expect(platform.viteLogLevel).toBe("warn");
    expect(platform.serverConfig.host).toBe("localhost");
    expect(platform.serverConfig.port).toBe(5173);
    expect(platform.serverConfig.strictPort).toBe(false);
    expect(platform.serverConfig.headers).toEqual({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    });
    expect(platform.serverConfig.fs?.allow).toEqual([
      projectRoot,
      platform.repoRoot,
    ]);
    expect(platform.resolveDedupe).toEqual([
      "react",
      "react-dom",
      "@dreamboard/ui-sdk",
      "@dreamboard/sdk-types",
    ]);
    expect(findAliasReplacement(platform, "^react$")).toMatch(
      /react\/index\.js$/,
    );
    expect(findAliasReplacement(platform, "^react-dom$")).toMatch(
      /react-dom\/index\.js$/,
    );
    expect(
      findAliasReplacement(platform, "^@dreamboard\\/manifest-contract$"),
    ).toBe(path.resolve(projectRoot, "shared/manifest-contract.ts"));
    expect(findAliasReplacement(platform, "^@dreamboard\\/ui-contract$")).toBe(
      path.resolve(projectRoot, "shared/generated/ui-contract.ts"),
    );
    expect(findAliasReplacement(platform, "^@shared\\/(.*)$")).toBe(
      path.resolve(projectRoot, "shared/$1"),
    );
    expect(findAliasReplacement(platform, "^tailwindcss$")).toBe(
      tailwindCssEntry,
    );
    const ignoredPatterns = platform.serverConfig.watch?.ignored;
    expect(Array.isArray(ignoredPatterns)).toBe(true);
    expect(ignoredPatterns).toHaveLength(1);
    expect(ignoredPatterns?.[0]).toBeInstanceOf(RegExp);
    expect(
      "/tmp/project/.dreamboard/cache".match(ignoredPatterns?.[0] as RegExp),
    ).not.toBeNull();
  });

  test("uses verbose diagnostics and a custom port when requested", () => {
    const platform = createDevRuntimePlatform({
      importMetaUrl: import.meta.url,
      projectRoot: "/tmp/dreamboard-project",
      debug: true,
      port: 6111,
      tailwindCssEntry:
        "/tmp/dreamboard-project/node_modules/tailwindcss/index.css",
    });

    expect(platform.diagnosticsLevel).toBe("verbose");
    expect(platform.viteLogLevel).toBe("info");
    expect(platform.serverConfig.port).toBe(6111);
  });

  test("resolves cliRoot for installed package layouts", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "db-dev-runtime-"));
    const cliRoot = path.join(
      repoRoot,
      "build",
      "install",
      "node_modules",
      "dreamboard",
    );
    const distRoot = path.join(cliRoot, "dist");

    try {
      await mkdir(distRoot, { recursive: true });
      await writeFile(
        path.join(repoRoot, "pnpm-workspace.yaml"),
        "packages:\n  - apps/*\n",
        "utf8",
      );
      await writeFile(path.join(repoRoot, "package.json"), "{}\n", "utf8");
      await writeFile(path.join(cliRoot, "package.json"), "{}\n", "utf8");

      const platform = createDevRuntimePlatform({
        importMetaUrl: pathToFileURL(path.join(distRoot, "index.js")).href,
        projectRoot: "/tmp/dreamboard-project",
        debug: false,
        tailwindCssEntry:
          "/tmp/dreamboard-project/node_modules/tailwindcss/index.css",
      });

      expect(platform.cliRoot).toBe(cliRoot);
      expect(platform.repoRoot).toBe(repoRoot);
      expect(findAliasReplacement(platform, "^react$")).toBe(
        path.resolve(platform.cliRoot, "node_modules/react/index.js"),
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
});
