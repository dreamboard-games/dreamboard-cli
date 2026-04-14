import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "bun:test";

const LOCAL_FILES_MODULE_PATH = path.resolve(import.meta.dir, "local-files.js");

const VALID_MANIFEST = {
  cardSets: [],
  zones: [],
  boardTemplates: [],
  boards: [],
  pieceTypes: [],
  pieceSeeds: [],
  dieTypes: [],
  dieSeeds: [],
  players: {
    minPlayers: 2,
    maxPlayers: 4,
    optimalPlayers: 2,
  },
  resources: [],
  setupOptions: [],
  setupProfiles: [],
} as const;

function renderManifestSource(manifestSource: string): string {
  return [
    'import { defineTopologyManifest } from "@dreamboard/sdk-types";',
    "",
    "export default defineTopologyManifest(",
    manifestSource,
    ");",
    "",
  ].join("\n");
}

async function withTempProject(
  manifestContents: string,
  run: (rootDir: string) => Promise<void>,
): Promise<void> {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "db-local-files-"));

  try {
    await Bun.write(path.join(rootDir, "manifest.ts"), manifestContents);
    await run(rootDir);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
}

function runLoadManifest(rootDir: string): {
  exitCode: number;
  stdout: string;
  stderr: string;
} {
  const result = Bun.spawnSync({
    cmd: [
      process.execPath,
      "--eval",
      `
        import { loadManifest } from ${JSON.stringify(LOCAL_FILES_MODULE_PATH)};

        const rootDir = process.argv[1];

        try {
          const manifest = await loadManifest(rootDir);
          console.log(JSON.stringify(manifest));
        } catch (error) {
          console.error(error instanceof Error ? error.message : String(error));
          process.exit(1);
        }
      `,
      rootDir,
    ],
    cwd: path.resolve(import.meta.dir, "../../../../.."),
    stdout: "pipe",
    stderr: "pipe",
  });

  return {
    exitCode: result.exitCode,
    stdout: new TextDecoder().decode(result.stdout).trim(),
    stderr: new TextDecoder().decode(result.stderr).trim(),
  };
}

test("loadManifest parses a valid manifest with the generated Zod schema", async () => {
  await withTempProject(
    renderManifestSource(`${JSON.stringify(VALID_MANIFEST, null, 2)}`),
    async (rootDir) => {
      const result = runLoadManifest(rootDir);

      expect(result.exitCode).toBe(0);
      const manifest = JSON.parse(result.stdout);
      expect(manifest.players.minPlayers).toBe(2);
      expect(manifest.zones).toEqual([]);
    },
  );
});

test("loadManifest preserves JSON-valued authored fields and richer property schemas", async () => {
  const manifestWithTypedFields = {
    ...VALID_MANIFEST,
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
            note: {
              type: "string",
              description: "Optional note",
              optional: true,
              nullable: true,
            },
            scoreByPlayer: {
              type: "record",
              description: "Scores by player",
              values: {
                type: "integer",
                description: "Player score",
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
    ],
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
              description: "Round marker",
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
        spaces: [
          {
            id: "space-a",
            typeId: "worker-space",
            fields: {
              reward: {
                coins: 2,
              },
              flags: ["open", true, 3],
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
              description: "Whether exhausted",
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
          tags: ["starter"],
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
              description: "Icon",
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
          note: null,
        },
      },
    ],
  };

  await withTempProject(
    renderManifestSource(`${JSON.stringify(manifestWithTypedFields, null, 2)}`),
    async (rootDir) => {
      const result = runLoadManifest(rootDir);

      expect(result.exitCode).toBe(0);
      const manifest = JSON.parse(result.stdout);
      expect(manifest.cardSets[0].cards[0].properties.value).toBe(1);
      expect(manifest.cardSets[0].cards[0].properties.note).toBeNull();
      expect(manifest.cardSets[0].cards[0].properties.scoreByPlayer).toEqual({
        "player-1": 2,
      });
      expect(manifest.boards[0].fields.notes).toEqual({
        intro: "start",
      });
      expect(manifest.boards[0].spaces[0].fields.flags).toEqual([
        "open",
        true,
        3,
      ]);
      expect(manifest.pieceSeeds[0].fields).toEqual({
        exhausted: false,
        tags: ["starter"],
      });
      expect(manifest.dieSeeds[0].fields).toEqual({
        icon: "pip",
        note: null,
      });
      expect(manifest.cardSets[0].cardSchema.properties.note.nullable).toBe(
        true,
      );
      expect(manifest.cardSets[0].cardSchema.properties.note.optional).toBe(
        true,
      );
      expect(
        manifest.cardSets[0].cardSchema.properties.scoreByPlayer.values.type,
      ).toBe("integer");
    },
  );
});

test("loadManifest surfaces path-specific Zod issues for invalid resources", async () => {
  const invalidManifest = {
    ...VALID_MANIFEST,
    resources: [{ id: "wood", displayName: "Wood" }],
  };

  await withTempProject(
    renderManifestSource(`${JSON.stringify(invalidManifest, null, 2)}`),
    async (rootDir) => {
      const result = runLoadManifest(rootDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("manifest.resources[0].name");
      expect(result.stderr).toContain(
        "Invalid input: expected string, received undefined",
      );
    },
  );
});

test("loadManifest rejects unknown manifest fields", async () => {
  const invalidManifest = {
    ...VALID_MANIFEST,
    decks: [],
  };

  await withTempProject(
    renderManifestSource(`${JSON.stringify(invalidManifest, null, 2)}`),
    async (rootDir) => {
      const result = runLoadManifest(rootDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Unrecognized key");
      expect(result.stderr).toContain("decks");
    },
  );
});

test("loadManifest rejects setupProfiles that reference unknown setup options", async () => {
  const invalidManifest = {
    ...VALID_MANIFEST,
    setupOptions: [
      {
        id: "mode",
        name: "Mode",
        choices: [{ id: "base", label: "Base Game" }],
      },
    ],
    setupProfiles: [
      {
        id: "draft-profile",
        name: "Draft Profile",
        optionValues: {
          expansion: "leaders",
        },
      },
    ],
  };

  await withTempProject(
    renderManifestSource(`${JSON.stringify(invalidManifest, null, 2)}`),
    async (rootDir) => {
      const result = runLoadManifest(rootDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Invalid manifest:");
      expect(result.stderr).toContain(
        "manifest.setupProfiles[0].optionValues.expansion: Unknown setup option 'expansion'.",
      );
    },
  );
});

test("loadManifest rejects player-scoped seed homes without ownerId", async () => {
  const invalidManifest = {
    ...VALID_MANIFEST,
    zones: [
      {
        id: "scout-hand",
        name: "Scout Hand",
        scope: "perPlayer",
      },
    ],
    boards: [
      {
        id: "player-mat",
        name: "Player Mat",
        layout: "square",
        scope: "perPlayer",
        spaces: [{ id: "camp", row: 0, col: 0 }],
        relations: [],
        containers: [],
        edges: [],
        vertices: [],
      },
    ],
    pieceTypes: [{ id: "meeple", name: "Meeple" }],
    pieceSeeds: [
      {
        id: "worker-a",
        typeId: "meeple",
        home: {
          type: "space",
          boardId: "player-mat",
          spaceId: "camp",
        },
      },
    ],
    dieTypes: [{ id: "d6", name: "D6", sides: 6 }],
    dieSeeds: [
      {
        id: "die-a",
        typeId: "d6",
        home: {
          type: "zone",
          zoneId: "scout-hand",
        },
      },
    ],
  };

  await withTempProject(
    renderManifestSource(`${JSON.stringify(invalidManifest, null, 2)}`),
    async (rootDir) => {
      const result = runLoadManifest(rootDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Invalid manifest:");
      expect(result.stderr).toContain(
        "manifest.pieceSeeds[0].home.boardId: Piece seed 'worker-a' requires ownerId because board 'player-mat' has scope 'perPlayer'. Add ownerId to resolve the player-scoped destination.",
      );
      expect(result.stderr).toContain(
        "manifest.dieSeeds[0].home.zoneId: Die seed 'die-a' requires ownerId because zone 'scout-hand' has scope 'perPlayer'. Add ownerId to resolve the player-scoped destination.",
      );
    },
  );
});

test("loadManifest rejects setupProfiles that reference unknown setup option choices", async () => {
  const invalidManifest = {
    ...VALID_MANIFEST,
    setupOptions: [
      {
        id: "mode",
        name: "Mode",
        choices: [{ id: "base", label: "Base Game" }],
      },
    ],
    setupProfiles: [
      {
        id: "draft-profile",
        name: "Draft Profile",
        optionValues: {
          mode: "leaders",
        },
      },
    ],
  };

  await withTempProject(
    renderManifestSource(`${JSON.stringify(invalidManifest, null, 2)}`),
    async (rootDir) => {
      const result = runLoadManifest(rootDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Invalid manifest:");
      expect(result.stderr).toContain(
        "manifest.setupProfiles[0].optionValues.mode: Unknown choice 'leaders' for setup option 'mode'.",
      );
    },
  );
});

test("loadManifest reports invalid manifest.ts syntax cleanly", async () => {
  await withTempProject(
    [
      'import { defineTopologyManifest } from "@dreamboard/sdk-types";',
      "",
      "export default defineTopologyManifest({",
      "",
    ].join("\n"),
    async (rootDir) => {
      const result = runLoadManifest(rootDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Failed to evaluate manifest.ts:");
    },
  );
});

test("getLocalDiff ignores playwright and generated test artifacts", async () => {
  await withTempProject(
    renderManifestSource(`${JSON.stringify(VALID_MANIFEST, null, 2)}`),
    async (rootDir) => {
      const { getLocalDiff, writeSnapshotFromFiles } = await import(
        LOCAL_FILES_MODULE_PATH
      );

      await writeSnapshotFromFiles(rootDir, {
        "manifest.ts": renderManifestSource(
          `${JSON.stringify(VALID_MANIFEST, null, 2)}`,
        ),
      });

      await Bun.write(
        path.join(rootDir, ".playwright-cli", "console.log"),
        "console artifact\n",
      );
      await Bun.write(
        path.join(rootDir, "test", "generated", "base.generated.ts"),
        "export const generated = true;\n",
      );

      const diff = await getLocalDiff(rootDir);

      expect(diff).toEqual({
        modified: [],
        added: [],
        deleted: [],
      });
    },
  );
});
