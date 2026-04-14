import { createRequire } from "node:module";
import path from "node:path";
import { expect, test } from "bun:test";

const require = createRequire(import.meta.url);
const tscBin = require.resolve("typescript/bin/tsc");
const fixtureRoot = path.join(import.meta.dir, "__fixtures__", "sdk-types");
const workspaceCodegenRoot = path.resolve(import.meta.dir, "..");

function runTypecheck(fileName: string) {
  return Bun.spawnSync({
    cmd: [
      tscBin,
      "--noEmit",
      "--strict",
      "--target",
      "ES2022",
      "--module",
      "ESNext",
      "--moduleResolution",
      "bundler",
      fileName,
    ],
    cwd: workspaceCodegenRoot,
    stdout: "pipe",
    stderr: "pipe",
  });
}

test("defineTopologyManifest accepts valid typed references", () => {
  const result = runTypecheck(path.join(fixtureRoot, "valid-manifest.ts"));
  const decoder = new TextDecoder();
  if (result.exitCode !== 0) {
    throw new Error(
      `Typecheck failed for valid-manifest.ts\nstdout:\n${decoder.decode(result.stdout)}\nstderr:\n${decoder.decode(result.stderr)}`,
    );
  }
});

test("defineTopologyManifest rejects invalid typed references", () => {
  const result = runTypecheck(path.join(fixtureRoot, "invalid-manifest.ts"));
  const decoder = new TextDecoder();
  const output = `${decoder.decode(result.stdout)}\n${decoder.decode(result.stderr)}`;

  expect(result.exitCode).not.toBe(0);
  expect(output).toContain('Type \'"discard"\' is not assignable to type \'"draw"\'');
  expect(output).toContain(
    'Type \'"missing-card-set"\' is not assignable to type \'"main"\'',
  );
  expect(output).toContain('Type \'"pawn"\' is not assignable to type \'"meeple"\'');
  expect(output).toContain(
    'Type \'"missing-container"\' is not assignable to type \'"supply"\'',
  );
  expect(output).toContain(
    'Type \'"draft"\' is not assignable to type \'"standard"\'',
  );
});
