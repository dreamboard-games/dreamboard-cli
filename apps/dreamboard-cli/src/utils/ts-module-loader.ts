import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { resolveCliRepoRoot } from "./repo-root.js";
import { createRepoLocalPackageResolutionPlugin } from "./repo-local-package-resolution.js";

const ESBUILD_EXTERNALS = [
  "playwright",
  "playwright-core",
  "chromium-bidi",
  "electron",
];
const CLI_REPO_ROOT = resolveCliRepoRoot(import.meta.url);
const ESBUILD_NODE_PATHS = [
  path.join(CLI_REPO_ROOT, "apps", "dreamboard-cli", "node_modules"),
  path.join(CLI_REPO_ROOT, "node_modules"),
];

export async function bundleTypeScriptModuleText(
  entryPath: string,
): Promise<string> {
  const result = await build({
    entryPoints: [entryPath],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
    sourcemap: "inline",
    external: ESBUILD_EXTERNALS,
    nodePaths: ESBUILD_NODE_PATHS,
    plugins: [createRepoLocalPackageResolutionPlugin()],
    write: false,
  });

  const output = result.outputFiles?.[0];
  if (!output) {
    throw new Error(`Failed to bundle TypeScript module '${entryPath}'.`);
  }
  return output.text;
}

export async function importTypeScriptModule<T>(entryPath: string): Promise<T> {
  const tempDir = await mkdtemp(path.join(tmpdir(), "dreamboard-ts-module-"));
  const outfile = path.join(
    tempDir,
    `${path.basename(entryPath).replace(/\.[^.]+$/u, "")}.mjs`,
  );

  try {
    const bundledText = await bundleTypeScriptModuleText(entryPath);
    await writeFile(outfile, bundledText);

    return (await import(pathToFileURL(outfile).href)) as T;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
