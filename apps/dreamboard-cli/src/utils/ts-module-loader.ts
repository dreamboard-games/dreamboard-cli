import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const ESBUILD_EXTERNALS = [
  "playwright",
  "playwright-core",
  "chromium-bidi",
  "electron",
];

export async function importTypeScriptModule<T>(entryPath: string): Promise<T> {
  const tempDir = await mkdtemp(path.join(tmpdir(), "dreamboard-ts-module-"));
  const outfile = path.join(
    tempDir,
    `${path.basename(entryPath).replace(/\.[^.]+$/u, "")}.mjs`,
  );

  try {
    await build({
      entryPoints: [entryPath],
      outfile,
      bundle: true,
      format: "esm",
      platform: "node",
      target: "node20",
      sourcemap: "inline",
      external: ESBUILD_EXTERNALS,
    });

    return (await import(pathToFileURL(outfile).href)) as T;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
