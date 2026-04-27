import { lstat, mkdir, mkdtemp, rm, stat, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { GameTopologyManifest } from "@dreamboard/sdk-types";
import { generateDynamicGeneratedFiles } from "@dreamboard/workspace-codegen";

const TYPECHECK_FIXTURE_ROOT = path.resolve(
  import.meta.dir,
  "__fixtures__/static-typecheck",
);
const CLI_ROOT = path.resolve(import.meta.dir, "../../..");
const REPO_ROOT = path.resolve(CLI_ROOT, "../../");
const WORKSPACE_NODE_MODULES = path.join(CLI_ROOT, "node_modules");
const UI_SDK_PACKAGE_ROOT = path.join(REPO_ROOT, "packages/ui-sdk");
const UI_SDK_NODE_MODULES = path.join(UI_SDK_PACKAGE_ROOT, "node_modules");
const UI_SDK_DIST = path.join(UI_SDK_PACKAGE_ROOT, "dist");
const APP_SDK_PACKAGE_ROOT = path.join(REPO_ROOT, "packages/app-sdk");
const APP_SDK_DIST = path.join(APP_SDK_PACKAGE_ROOT, "dist");

async function loadLocalTypecheck() {
  return import(`./local-typecheck.ts?test=${Math.random()}`);
}

async function loadStaticScaffold() {
  return import(`./static-scaffold.ts?test=${Math.random()}`);
}

function renderManifestSource(manifest: GameTopologyManifest): string {
  return [
    'import { defineTopologyManifest } from "@dreamboard/sdk-types";',
    "",
    "export default defineTopologyManifest(",
    `${JSON.stringify(manifest, null, 2)}`,
    ");",
    "",
  ].join("\n");
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * The tests run `tsc --noEmit` against the scaffolded workspace, which resolves
 * `@dreamboard/ui-sdk` and `@dreamboard/app-sdk` via their `package.json` source
 * entry points. Walking the full SDK source trees on every test invocation costs
 * ~20 seconds per tsc run and is duplicative - we only care that the generated
 * workspace's user-authored code types against the SDK public surface, not that
 * the SDK re-typechecks itself.
 *
 * Pre-build the SDKs' `.d.ts` outputs once per test process (if missing) so the
 * scaffold tsconfig overrides below can redirect SDK imports to the compiled
 * declarations instead of re-traversing source.
 */
async function ensureSdkDistsBuilt(): Promise<void> {
  const uiDistMarker = path.join(UI_SDK_DIST, "index.d.ts");
  const appDistMarker = path.join(APP_SDK_DIST, "index.d.ts");

  const missing: string[] = [];
  if (!(await pathExists(uiDistMarker))) missing.push("@dreamboard/ui-sdk");
  if (!(await pathExists(appDistMarker))) missing.push("@dreamboard/app-sdk");

  if (missing.length === 0) return;

  const filterArgs = missing.flatMap((name) => ["--filter", name]);
  const { exitCode, stdout, stderr } = Bun.spawnSync({
    cmd: ["pnpm", ...filterArgs, "build"],
    cwd: REPO_ROOT,
    stdout: "pipe",
    stderr: "pipe",
  });

  if (exitCode !== 0) {
    const decoder = new TextDecoder();
    throw new Error(
      `Failed to build SDK dists ${missing.join(", ")}:\n${decoder.decode(stdout)}\n${decoder.decode(stderr)}`,
    );
  }
}

const FULL_TYPECHECK_MANIFEST: GameTopologyManifest = {
  players: {
    minPlayers: 2,
    maxPlayers: 2,
    optimalPlayers: 2,
  },
  cardSets: [
    {
      type: "manual",
      id: "standard-deck",
      name: "Standard Deck",
      cardSchema: {
        properties: {
          value: {
            type: "integer",
            description: "Card value",
          },
          label: {
            type: "string",
            description: "Optional label",
            optional: true,
          },
          note: {
            type: "string",
            description: "Nullable note",
            optional: true,
            nullable: true,
          },
          scoreByPlayer: {
            type: "record",
            description: "Scores by player",
            values: {
              type: "integer",
              description: "Per-player score",
            },
          },
        },
      },
      cards: [
        {
          type: "CARD_A",
          name: "Card A",
          count: 1,
          properties: {
            value: 1,
            note: null,
            scoreByPlayer: {
              "player-1": 2,
            },
          },
        },
      ],
    },
  ],
  zones: [
    {
      id: "draw-deck",
      name: "Draw Deck",
      scope: "shared",
      allowedCardSetIds: ["standard-deck"],
    },
    {
      id: "main-hand",
      name: "Main Hand",
      scope: "perPlayer",
      visibility: "ownerOnly",
      allowedCardSetIds: ["standard-deck"],
    },
  ],
  boardTemplates: [],
  boards: [
    {
      id: "track-board",
      name: "Track Board",
      layout: "generic",
      typeId: "track",
      scope: "shared",
      boardFieldsSchema: {
        properties: {
          roundMarker: {
            type: "integer",
            description: "Round marker index",
          },
          notes: {
            type: "record",
            description: "Board notes",
            optional: true,
            values: {
              type: "string",
              description: "Board note",
            },
          },
        },
      },
      fields: {
        roundMarker: 1,
        notes: {
          intro: "start",
        },
      },
      spaceFieldsSchema: {
        properties: {
          bonusByPlayer: {
            type: "record",
            description: "Bonus by player",
            values: {
              type: "integer",
              description: "Bonus amount",
            },
          },
          labelOverride: {
            type: "string",
            description: "Optional override label",
            optional: true,
            nullable: true,
          },
        },
      },
      relationFieldsSchema: {
        properties: {
          cost: {
            type: "integer",
            description: "Movement cost",
            optional: true,
          },
        },
      },
      containerFieldsSchema: {
        properties: {
          displaySize: {
            type: "integer",
            description: "Display size",
          },
          featuredByPlayer: {
            type: "record",
            description: "Featured markers by player",
            optional: true,
            values: {
              type: "boolean",
              description: "Whether featured",
            },
          },
        },
      },
      spaces: [
        {
          id: "space-a",
          typeId: "worker-space",
          occupiable: true,
          fields: {
            bonusByPlayer: {
              "player-1": 2,
            },
            labelOverride: null,
          },
        },
        {
          id: "space-b",
          typeId: "market-space",
          occupiable: true,
          fields: {
            bonusByPlayer: {
              "player-2": 1,
            },
          },
        },
      ],
      relations: [
        {
          typeId: "adjacent",
          fromSpaceId: "space-a",
          toSpaceId: "space-b",
          directed: false,
          fields: {
            cost: 1,
          },
        },
      ],
      containers: [
        {
          id: "market-row",
          name: "Market Row",
          host: {
            type: "board",
          },
          fields: {
            displaySize: 3,
            featuredByPlayer: {
              "player-1": true,
            },
          },
        },
      ],
    },
  ],
  pieceTypes: [
    {
      id: "worker",
      name: "Worker",
      fieldsSchema: {
        properties: {
          exhausted: {
            type: "boolean",
            description: "Whether the worker is exhausted",
          },
          ownerScoreByPlayer: {
            type: "record",
            description: "Score by player",
            values: {
              type: "integer",
              description: "Score",
            },
          },
        },
      },
    },
  ],
  pieceSeeds: [
    {
      id: "worker-1",
      typeId: "worker",
      fields: {
        exhausted: false,
        ownerScoreByPlayer: {
          "player-1": 1,
        },
      },
    },
  ],
  dieTypes: [
    {
      id: "d6",
      name: "D6",
      sides: 6,
      fieldsSchema: {
        properties: {
          icon: {
            type: "string",
            description: "Icon name",
          },
          weightByFace: {
            type: "record",
            description: "Weight by face",
            values: {
              type: "integer",
              description: "Weight",
            },
          },
          note: {
            type: "string",
            description: "Optional note",
            optional: true,
            nullable: true,
          },
        },
      },
    },
  ],
  dieSeeds: [
    {
      id: "d6",
      typeId: "d6",
      fields: {
        icon: "pip",
        weightByFace: {
          "1": 1,
          "6": 2,
        },
        note: null,
      },
    },
  ],
  resources: [
    {
      id: "coins",
      name: "Coins",
    },
  ],
  setupOptions: [
    {
      id: "mode",
      name: "Mode",
      choices: [
        {
          id: "base",
          label: "Base Game",
        },
      ],
    },
  ],
  setupProfiles: [
    {
      id: "default-setup",
      name: "Default Setup",
      optionValues: {
        mode: "base",
      },
    },
  ],
};

const EMPTY_TYPECHECK_MANIFEST: GameTopologyManifest = {
  players: {
    minPlayers: 2,
    maxPlayers: 2,
    optimalPlayers: 2,
  },
  cardSets: [],
  zones: [],
  boardTemplates: [],
  boards: [],
  pieceTypes: [],
  pieceSeeds: [],
  dieTypes: [],
  dieSeeds: [],
  resources: [],
  setupOptions: [],
  setupProfiles: [],
};

const MULTI_CARD_SET_TYPECHECK_MANIFEST: GameTopologyManifest = {
  ...structuredClone(FULL_TYPECHECK_MANIFEST),
  cardSets: [
    ...structuredClone(FULL_TYPECHECK_MANIFEST.cardSets),
    {
      type: "manual",
      id: "tarot-deck",
      name: "Tarot Deck",
      cardSchema: {
        properties: {
          arcana: {
            type: "string",
            description: "Arcana type",
          },
          strength: {
            type: "integer",
            description: "Card strength",
          },
        },
      },
      cards: [
        {
          type: "FOOL",
          name: "The Fool",
          count: 1,
          properties: {
            arcana: "major",
            strength: 0,
          },
        },
        {
          type: "MAGICIAN",
          name: "The Magician",
          count: 1,
          properties: {
            arcana: "major",
            strength: 1,
          },
        },
      ],
    },
  ],
  zones: [
    ...structuredClone(FULL_TYPECHECK_MANIFEST.zones),
    {
      id: "discard-pile",
      name: "Discard Pile",
      scope: "shared",
      allowedCardSetIds: ["standard-deck", "tarot-deck"],
    },
  ],
};

const PER_PLAYER_BOARD_TYPECHECK_MANIFEST: GameTopologyManifest = {
  ...structuredClone(FULL_TYPECHECK_MANIFEST),
  boards: [
    {
      ...structuredClone(FULL_TYPECHECK_MANIFEST.boards[0]),
      id: "player-track",
      name: "Player Track",
      scope: "perPlayer",
    },
    ...structuredClone(FULL_TYPECHECK_MANIFEST.boards.slice(1)),
  ],
};

const TILED_BOARD_INTERACTION_TYPECHECK_MANIFEST: GameTopologyManifest = {
  players: {
    minPlayers: 2,
    maxPlayers: 2,
    optimalPlayers: 2,
  },
  cardSets: [],
  zones: [],
  boardTemplates: [],
  boards: [
    {
      id: "frontier-map",
      name: "Frontier Map",
      layout: "hex",
      scope: "shared",
      spaces: [
        { id: "ridge", q: 0, r: 0 },
        { id: "grove", q: 1, r: 0 },
        { id: "ford", q: 0, r: 1 },
      ],
      edges: [
        { ref: { spaces: ["ridge", "grove"] } },
        { ref: { spaces: ["ridge", "ford"] } },
        { ref: { spaces: ["grove", "ford"] } },
      ],
      vertices: [{ ref: { spaces: ["ridge", "grove", "ford"] } }],
    },
    {
      id: "arena-grid",
      name: "Arena Grid",
      layout: "square",
      scope: "shared",
      spaces: [
        { id: "a1", row: 0, col: 0 },
        { id: "a2", row: 0, col: 1 },
        { id: "b1", row: 1, col: 0 },
        { id: "b2", row: 1, col: 1 },
      ],
      edges: [
        { ref: { spaces: ["a1", "a2"] } },
        { ref: { spaces: ["a1", "b1"] } },
      ],
      vertices: [{ ref: { spaces: ["a1", "a2", "b1", "b2"] } }],
    },
  ],
  pieceTypes: [],
  pieceSeeds: [],
  dieTypes: [],
  dieSeeds: [],
  resources: [],
  setupOptions: [],
  setupProfiles: [],
};

type ManifestTypecheckCase = {
  name: string;
  manifest: GameTopologyManifest;
};

const MANIFEST_TYPECHECK_CASES: readonly ManifestTypecheckCase[] = [
  {
    name: "empty manifest",
    manifest: EMPTY_TYPECHECK_MANIFEST,
  },
  {
    name: "full topology manifest",
    manifest: FULL_TYPECHECK_MANIFEST,
  },
  {
    name: "multiple card sets manifest",
    manifest: MULTI_CARD_SET_TYPECHECK_MANIFEST,
  },
  {
    name: "per-player board manifest",
    manifest: PER_PLAYER_BOARD_TYPECHECK_MANIFEST,
  },
] as const;

const EXTRA_SEED_FIXTURE_FILES = [
  "app/game.ts",
  "app/manifest-contract-smoke.ts",
  "shared/manifest.ts",
  "shared/ui-args.ts",
  "ui/prompt-flow-smoke.tsx",
] as const;

async function writeDynamicFilesForManifest(
  tempRoot: string,
  manifest: GameTopologyManifest,
): Promise<void> {
  const generatedFiles = generateDynamicGeneratedFiles(manifest);

  for (const [relativePath, content] of Object.entries(generatedFiles)) {
    const targetPath = path.join(tempRoot, relativePath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await Bun.write(targetPath, content);
  }

  for (const relativePath of EXTRA_SEED_FIXTURE_FILES) {
    const sourcePath = path.join(TYPECHECK_FIXTURE_ROOT, relativePath);
    const targetPath = path.join(tempRoot, relativePath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await Bun.write(targetPath, await Bun.file(sourcePath).text());
  }

  // Must run AFTER `generateDynamicGeneratedFiles`, which regenerates the
  // framework tsconfigs and would otherwise clobber the dist path overrides
  // along with the manifest/ui-args aliases injected here.
  await applyTsConfigPathAugments(tempRoot);
}

/**
 * Layers the families of tsconfig augments that the scaffolded tsconfigs need
 * to typecheck the generated workspace:
 *   1. `@dreamboard/ui-sdk` + `@dreamboard/app-sdk` redirected to their
 *      prebuilt `.d.ts` trees (speed optimization; see `ensureSdkDistsBuilt`).
 *   2. `@dreamboard/manifest` / `@dreamboard/ui-args` aliases used by the
 *      fixture-based UI smoke files.
 *   3. Incremental compilation enabled with per-project `tsBuildInfoFile`s
 *      under `.tscache/` so the ~21 `tsc --noEmit` invocations across the
 *      shared workspace share declaration graph work. The first test still
 *      pays the cold compile cost; subsequent tests only recheck changed
 *      source files.
 */
async function applyTsConfigPathAugments(tempRoot: string): Promise<void> {
  const distOverrides: Record<string, string[]> = {
    "@dreamboard/ui-sdk": [path.join(UI_SDK_DIST, "index")],
    "@dreamboard/ui-sdk/*": [path.join(UI_SDK_DIST, "*")],
    "@dreamboard/app-sdk": [path.join(APP_SDK_DIST, "index")],
    "@dreamboard/app-sdk/reducer": [path.join(APP_SDK_DIST, "reducer")],
    "@dreamboard/app-sdk/reducer/*": [path.join(APP_SDK_DIST, "reducer/*")],
    "@dreamboard/app-sdk/internal": [path.join(APP_SDK_DIST, "internal")],
  };
  const uiFixtureAliases: Record<string, string[]> = {
    "@dreamboard/manifest": ["../shared/manifest.ts"],
    "@dreamboard/ui-args": ["../shared/ui-args.ts"],
  };

  type TsconfigPatch = {
    tsBuildInfoFile: string;
    paths: Record<string, string[]>;
  };

  const patches: Record<string, TsconfigPatch> = {
    "app/tsconfig.framework.json": {
      tsBuildInfoFile: "../.tscache/app.tsbuildinfo",
      paths: distOverrides,
    },
    "ui/tsconfig.framework.json": {
      tsBuildInfoFile: "../.tscache/ui.tsbuildinfo",
      paths: { ...distOverrides, ...uiFixtureAliases },
    },
    "manifest.tsconfig.json": {
      tsBuildInfoFile: "./.tscache/manifest.tsbuildinfo",
      paths: distOverrides,
    },
  };

  for (const [rel, patch] of Object.entries(patches)) {
    const tsconfigPath = path.join(tempRoot, rel);
    const existing = JSON.parse(await Bun.file(tsconfigPath).text()) as {
      compilerOptions?: {
        paths?: Record<string, string[]>;
        incremental?: boolean;
        tsBuildInfoFile?: string;
      };
    };
    existing.compilerOptions ??= {};
    existing.compilerOptions.paths = {
      ...(existing.compilerOptions.paths ?? {}),
      ...patch.paths,
    };
    existing.compilerOptions.incremental = true;
    existing.compilerOptions.tsBuildInfoFile = patch.tsBuildInfoFile;
    await Bun.write(tsconfigPath, `${JSON.stringify(existing, null, 2)}\n`);
  }
}

async function scaffoldBaseWorkspace(): Promise<string> {
  const { scaffoldStaticWorkspace } = await loadStaticScaffold();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-local-typecheck-"));
  await Bun.write(
    path.join(tempRoot, "manifest.ts"),
    renderManifestSource(EMPTY_TYPECHECK_MANIFEST),
  );
  await scaffoldStaticWorkspace(tempRoot, "new");
  await symlink(WORKSPACE_NODE_MODULES, path.join(tempRoot, "node_modules"));
  await symlink(UI_SDK_NODE_MODULES, path.join(tempRoot, "ui", "node_modules"));
  return tempRoot;
}

/**
 * Removes fixture overrides that a previous test may have written. Dynamic
 * generated files are clobbered on every manifest reset via
 * {@link writeDynamicFilesForManifest}, so we only need to scrub the handful of
 * opt-in override targets that `writeFixtureOverride` can place.
 */
async function clearPriorFixtureOverrides(tempRoot: string): Promise<void> {
  const overrideTargets = [
    "app/reducer-query-typing-smoke.ts",
    "ui/board-typing-smoke.tsx",
  ];
  for (const rel of overrideTargets) {
    await rm(path.join(tempRoot, rel), { force: true });
  }
}

let sharedWorkspacePromise: Promise<string> | null = null;

async function getSharedWorkspace(): Promise<string> {
  if (!sharedWorkspacePromise) {
    sharedWorkspacePromise = scaffoldBaseWorkspace();
  }
  return sharedWorkspacePromise;
}

async function prepareSharedWorkspaceForManifest(
  manifest: GameTopologyManifest,
): Promise<string> {
  const tempRoot = await getSharedWorkspace();
  await clearPriorFixtureOverrides(tempRoot);
  await Bun.write(
    path.join(tempRoot, "manifest.ts"),
    renderManifestSource(manifest),
  );
  await writeDynamicFilesForManifest(tempRoot, manifest);
  return tempRoot;
}

async function writeFixtureOverride(
  tempRoot: string,
  sourceRelativePath: string,
  targetRelativePath: string,
): Promise<void> {
  const sourcePath = path.join(TYPECHECK_FIXTURE_ROOT, sourceRelativePath);
  const targetPath = path.join(tempRoot, targetRelativePath);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await Bun.write(targetPath, await Bun.file(sourcePath).text());
}

beforeAll(async () => {
  await ensureSdkDistsBuilt();
}, 180_000);

afterAll(async () => {
  if (sharedWorkspacePromise) {
    const tempRoot = await sharedWorkspacePromise;
    await rm(tempRoot, { recursive: true, force: true });
  }
});

for (const { name, manifest } of MANIFEST_TYPECHECK_CASES) {
  test(`runLocalTypecheck accepts generated workspace for ${name}`, async () => {
    const { runLocalTypecheck } = await loadLocalTypecheck();
    const tempRoot = await prepareSharedWorkspaceForManifest(manifest);

    await expect(runLocalTypecheck(tempRoot)).resolves.toEqual({
      success: true,
      output: "",
    });
  }, 60_000);
}

test("runLocalTypecheck does not require Bun on PATH", async () => {
  const { runLocalTypecheck } = await loadLocalTypecheck();
  const tempRoot = await prepareSharedWorkspaceForManifest(
    FULL_TYPECHECK_MANIFEST,
  );
  const originalPath = process.env.PATH;

  try {
    process.env.PATH = "";

    await expect(runLocalTypecheck(tempRoot)).resolves.toEqual({
      success: true,
      output: "",
    });
  } finally {
    process.env.PATH = originalPath;
  }
}, 60_000);

test("runLocalTypecheck preserves tiled board callback ids for reducer-projected views", async () => {
  const { runLocalTypecheck } = await loadLocalTypecheck();
  const tempRoot = await prepareSharedWorkspaceForManifest(
    TILED_BOARD_INTERACTION_TYPECHECK_MANIFEST,
  );

  await writeFixtureOverride(tempRoot, "app/board-game.ts", "app/game.ts");
  await writeFixtureOverride(
    tempRoot,
    "ui/board-typing-smoke.tsx",
    "ui/board-typing-smoke.tsx",
  );
  await writeFixtureOverride(
    tempRoot,
    "ui/prompt-flow-empty.tsx",
    "ui/prompt-flow-smoke.tsx",
  );

  await expect(runLocalTypecheck(tempRoot)).resolves.toEqual({
    success: true,
    output: "",
  });
}, 60_000);

test("runLocalTypecheck supports docs-guided reducer helpers without casts", async () => {
  const { runLocalTypecheck } = await loadLocalTypecheck();
  const tempRoot = await prepareSharedWorkspaceForManifest(
    FULL_TYPECHECK_MANIFEST,
  );

  await writeFixtureOverride(
    tempRoot,
    "app/reducer-query-typing-smoke.ts",
    "app/reducer-query-typing-smoke.ts",
  );

  await expect(runLocalTypecheck(tempRoot)).resolves.toEqual({
    success: true,
    output: "",
  });
}, 60_000);

test("runLocalTypecheck prefers project-local TypeScript without workspace symlinks", async () => {
  const { runLocalTypecheck } = await loadLocalTypecheck();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-local-typecheck-"));
  const localTscPath = path.join(
    tempRoot,
    "node_modules",
    "typescript",
    "bin",
    "tsc",
  );

  try {
    await mkdir(path.dirname(localTscPath), { recursive: true });

    await Bun.write(
      localTscPath,
      [
        "#!/usr/bin/env node",
        'process.stderr.write("LOCAL_TSC_SENTINEL\\n");',
        "process.exit(1);",
      ].join("\n"),
    );

    await expect(runLocalTypecheck(tempRoot)).resolves.toEqual({
      success: false,
      output: "LOCAL_TSC_SENTINEL",
    });

    await expect(
      lstat(path.join(tempRoot, "ui", "node_modules")),
    ).rejects.toBeDefined();
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
