import { lstat, mkdir, mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { expect, test } from "bun:test";
import type { GameTopologyManifest } from "@dreamboard/sdk-types";
import { generateAuthoritativeFiles } from "./index.js";
import { validateManifestAuthoring } from "./manifest-validation.js";
import { materializeManifest } from "../../../apps/dreamboard-cli/src/services/project/manifest-authoring.ts";

const repoRoot = path.resolve(import.meta.dir, "../../..");
const benchmarkRoot = path.join(repoRoot, "examples", "board-contract-lab");
const pnpmBinary = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const WORKSPACE_NODE_MODULES = path.join(
  repoRoot,
  "apps",
  "dreamboard-cli",
  "node_modules",
);
const UI_SDK_NODE_MODULES = path.join(
  repoRoot,
  "packages",
  "ui-sdk",
  "node_modules",
);
const SDK_TYPES_PACKAGE_ROOT = path.join(repoRoot, "packages", "sdk-types");

async function loadBenchmarkManifest(): Promise<GameTopologyManifest> {
  return materializeManifest(benchmarkRoot) as Promise<GameTopologyManifest>;
}

async function ensureSymlink(targetPath: string, linkPath: string) {
  try {
    await lstat(linkPath);
    return;
  } catch {
    // Fall through and create the symlink.
  }

  await mkdir(path.dirname(linkPath), { recursive: true });
  await symlink(
    targetPath,
    linkPath,
    process.platform === "win32" ? "junction" : "dir",
  );
}

function collectComponentHomeTypes(
  manifest: GameTopologyManifest,
): Set<string> {
  const homes = new Set<string>();

  for (const cardSet of manifest.cardSets) {
    if (cardSet.type !== "manual") {
      continue;
    }
    for (const card of cardSet.cards) {
      if (card.home?.type) {
        homes.add(card.home.type);
      }
    }
  }

  for (const component of [...manifest.pieceSeeds, ...manifest.dieSeeds]) {
    if (component.home?.type) {
      homes.add(component.home.type);
    }
  }

  return homes;
}

function decodeOutput(buffer: Uint8Array<ArrayBufferLike>): string {
  return new TextDecoder().decode(buffer);
}

async function formatWithRepoPrettier(
  relativePath: string,
  content: string,
): Promise<string> {
  const tempRoot = await mkdtemp(
    path.join(os.tmpdir(), "db-authoring-benchmark-"),
  );
  const tempFile = path.join(tempRoot, relativePath);

  await Bun.write(tempFile, content);

  try {
    const result = Bun.spawnSync({
      cmd: [
        pnpmBinary,
        "exec",
        "prettier",
        "--log-level",
        "warn",
        "--write",
        tempFile,
      ],
      cwd: repoRoot,
      stdout: "pipe",
      stderr: "pipe",
    });

    if (result.exitCode !== 0) {
      throw new Error(
        [
          `Prettier failed for generated benchmark file ${relativePath}`,
          "",
          "stdout:",
          decodeOutput(result.stdout),
          "",
          "stderr:",
          decodeOutput(result.stderr),
        ].join("\n"),
      );
    }

    return await readFile(tempFile, "utf8");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

test("board-contract-lab covers the stricter authored manifest surfaces", async () => {
  const manifest = await loadBenchmarkManifest();
  const validation = validateManifestAuthoring(manifest);

  expect(validation.errors).toEqual([]);
  expect(new Set(manifest.boards.map((board) => board.layout))).toEqual(
    new Set(["generic", "hex", "square"]),
  );
  expect(new Set(manifest.boards.map((board) => board.scope))).toEqual(
    new Set(["shared", "perPlayer"]),
  );
  expect(
    new Set(
      manifest.boards
        .map((board) => board.templateId)
        .filter((templateId): templateId is string => Boolean(templateId)),
    ),
  ).toEqual(
    new Set(["market-template", "frontier-template", "player-mat-template"]),
  );
  expect(new Set(manifest.cardSets.map((cardSet) => cardSet.type))).toEqual(
    new Set(["manual", "preset"]),
  );
  expect(collectComponentHomeTypes(manifest)).toEqual(
    new Set(["zone", "space", "container", "edge", "vertex", "slot"]),
  );
  expect(manifest.setupOptions.map((option) => option.id)).toEqual([
    "map",
    "market",
    "crew",
  ]);
  expect(manifest.setupProfiles.map((profile) => profile.id)).toEqual([
    "standard-expedition",
    "river-draft",
  ]);
});

test("board-contract-lab authoritative generated files stay in sync with workspace-codegen", async () => {
  const manifest = await loadBenchmarkManifest();
  const authoritativeFiles = generateAuthoritativeFiles(manifest);

  expect(Object.keys(authoritativeFiles).sort()).toEqual([
    "app/index.ts",
    "app/tsconfig.framework.json",
    "shared/generated/ui-contract.ts",
    "shared/manifest-contract.ts",
    "ui/tsconfig.framework.json",
  ]);

  for (const [relativePath, expected] of Object.entries(authoritativeFiles)) {
    const filePath = path.join(benchmarkRoot, relativePath);
    const actual = await readFile(filePath, "utf8");
    const formattedExpected = await formatWithRepoPrettier(
      relativePath,
      expected,
    );
    expect(actual).toBe(formattedExpected);
  }
}, 20_000);

test("board-contract-lab example workspace typechecks", async () => {
  await ensureSymlink(
    WORKSPACE_NODE_MODULES,
    path.join(benchmarkRoot, "node_modules"),
  );
  await ensureSymlink(
    SDK_TYPES_PACKAGE_ROOT,
    path.join(benchmarkRoot, "node_modules", "@dreamboard", "sdk-types"),
  );
  await ensureSymlink(
    UI_SDK_NODE_MODULES,
    path.join(benchmarkRoot, "ui", "node_modules"),
  );

  const result = Bun.spawnSync({
    cmd: [pnpmBinary, "--dir", benchmarkRoot, "typecheck"],
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe",
  });

  if (result.exitCode !== 0) {
    throw new Error(
      [
        `Typecheck failed for ${benchmarkRoot}`,
        "",
        "stdout:",
        decodeOutput(result.stdout),
        "",
        "stderr:",
        decodeOutput(result.stderr),
      ].join("\n"),
    );
  }
}, 60_000);
