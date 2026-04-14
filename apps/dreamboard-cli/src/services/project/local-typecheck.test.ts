import { lstat, mkdtemp, mkdir, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "bun:test";
import type { GameTopologyManifest } from "@dreamboard/sdk-types";
import { generateDynamicGeneratedFiles } from "@dreamboard/workspace-codegen";

const TYPECHECK_FIXTURE_ROOT = path.resolve(
  import.meta.dir,
  "__fixtures__/static-typecheck",
);
const WORKSPACE_NODE_MODULES = path.join(
  path.resolve(import.meta.dir, "../../.."),
  "node_modules",
);
const UI_SDK_NODE_MODULES = path.join(
  path.resolve(import.meta.dir, "../../../../../packages/ui-sdk"),
  "node_modules",
);

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

async function seedDynamicFilesForTypecheck(
  tempRoot: string,
  manifest: GameTopologyManifest,
): Promise<void> {
  const generatedFiles = generateDynamicGeneratedFiles(manifest);
  const extraFixtureFiles = [
    "app/manifest-contract-smoke.ts",
    "shared/manifest.ts",
    "shared/ui-args.ts",
  ] as const;

  for (const [relativePath, content] of Object.entries(generatedFiles)) {
    const targetPath = path.join(tempRoot, relativePath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await Bun.write(targetPath, content);
  }

  for (const relativePath of extraFixtureFiles) {
    const sourcePath = path.join(TYPECHECK_FIXTURE_ROOT, relativePath);
    const targetPath = path.join(tempRoot, relativePath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await Bun.write(targetPath, await Bun.file(sourcePath).text());
  }

  const uiFrameworkTsConfigPath = path.join(
    tempRoot,
    "ui",
    "tsconfig.framework.json",
  );
  const uiFrameworkTsConfig = JSON.parse(
    await Bun.file(uiFrameworkTsConfigPath).text(),
  ) as {
    compilerOptions?: {
      paths?: Record<string, string[]>;
    };
  };
  uiFrameworkTsConfig.compilerOptions ??= {};
  uiFrameworkTsConfig.compilerOptions.paths ??= {};
  uiFrameworkTsConfig.compilerOptions.paths["@dreamboard/manifest"] = [
    "../shared/manifest.ts",
  ];
  uiFrameworkTsConfig.compilerOptions.paths["@dreamboard/ui-args"] = [
    "../shared/ui-args.ts",
  ];
  await Bun.write(
    uiFrameworkTsConfigPath,
    `${JSON.stringify(uiFrameworkTsConfig, null, 2)}\n`,
  );
}

async function createTypecheckWorkspace(
  manifest: GameTopologyManifest,
): Promise<string> {
  const { scaffoldStaticWorkspace } = await loadStaticScaffold();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-local-typecheck-"));
  await Bun.write(
    path.join(tempRoot, "manifest.ts"),
    renderManifestSource(manifest),
  );
  await scaffoldStaticWorkspace(tempRoot, "new");
  await seedDynamicFilesForTypecheck(tempRoot, manifest);
  await symlink(WORKSPACE_NODE_MODULES, path.join(tempRoot, "node_modules"));
  await symlink(UI_SDK_NODE_MODULES, path.join(tempRoot, "ui", "node_modules"));
  return tempRoot;
}

async function expectGeneratedWorkspaceTypechecks(
  manifest: GameTopologyManifest,
): Promise<void> {
  const { runLocalTypecheck } = await loadLocalTypecheck();
  const tempRoot = await createTypecheckWorkspace(manifest);

  try {
    await expect(runLocalTypecheck(tempRoot)).resolves.toEqual({
      success: true,
      output: "",
    });
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

for (const { name, manifest } of MANIFEST_TYPECHECK_CASES) {
  test(`runLocalTypecheck accepts generated workspace for ${name}`, async () => {
    await expectGeneratedWorkspaceTypechecks(manifest);
  }, 60_000);
}

test("runLocalTypecheck does not require Bun on PATH", async () => {
  const { runLocalTypecheck } = await loadLocalTypecheck();
  const tempRoot = await createTypecheckWorkspace(FULL_TYPECHECK_MANIFEST);
  const originalPath = process.env.PATH;

  try {
    process.env.PATH = "";

    await expect(runLocalTypecheck(tempRoot)).resolves.toEqual({
      success: true,
      output: "",
    });
  } finally {
    process.env.PATH = originalPath;
    await rm(tempRoot, { recursive: true, force: true });
  }
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
