import { expect, test } from "bun:test";
import type { GameTopologyManifest } from "@dreamboard/sdk-types";
import { generateManifestContractSource } from "./manifest-contract.js";

const TEST_MANIFEST: GameTopologyManifest = {
  players: {
    minPlayers: 2,
    maxPlayers: 4,
    optimalPlayers: 3,
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
      fields: {
        roundMarker: 1,
      },
      spaces: [
        {
          id: "space-a",
          typeId: "worker-space",
          fields: {
            bonusByPlayer: {
              "player-1": 2,
            },
            labelOverride: null,
          },
        },
      ],
      relations: [
        {
          typeId: "adjacent",
          fromSpaceId: "space-a",
          toSpaceId: "space-a",
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
          allowedCardSetIds: ["standard-deck"],
          fields: {
            displaySize: 3,
          },
        },
      ],
    },
    {
      id: "hex-map",
      name: "Hex Map",
      layout: "hex",
      typeId: "map",
      scope: "shared",
      orientation: "pointy-top",
      spaceFieldsSchema: {
        properties: {
          richness: {
            type: "integer",
            description: "Space richness",
          },
        },
      },
      edgeFieldsSchema: {
        properties: {
          rate: {
            type: "integer",
            description: "Edge trade rate",
          },
        },
      },
      vertexFieldsSchema: {
        properties: {
          buildCost: {
            type: "integer",
            description: "Vertex build cost",
          },
        },
      },
      spaces: [
        {
          id: "hex-a",
          q: 0,
          r: 0,
          typeId: "forest",
          fields: {
            richness: 3,
          },
        },
        {
          id: "hex-b",
          q: 1,
          r: 0,
        },
        {
          id: "hex-c",
          q: 0,
          r: 1,
        },
      ],
      edges: [
        {
          ref: {
            spaces: ["hex-a", "hex-b"],
          },
          typeId: "three-to-one",
          fields: {
            rate: 3,
          },
        },
      ],
      vertices: [
        {
          ref: {
            spaces: ["hex-a", "hex-b", "hex-c"],
          },
          typeId: "settlement-slot",
          fields: {
            buildCost: 2,
          },
        },
      ],
    },
    {
      id: "square-grid",
      name: "Square Grid",
      layout: "square",
      typeId: "grid",
      scope: "shared",
      relationFieldsSchema: {
        properties: {
          cost: {
            type: "integer",
            description: "Movement cost",
          },
        },
      },
      containerFieldsSchema: {
        properties: {
          capacity: {
            type: "integer",
            description: "Container capacity",
          },
        },
      },
      edgeFieldsSchema: {
        properties: {
          durability: {
            type: "integer",
            description: "Edge durability",
          },
        },
      },
      vertexFieldsSchema: {
        properties: {
          value: {
            type: "integer",
            description: "Vertex value",
          },
        },
      },
      spaces: [
        {
          id: "cell-a1",
          row: 0,
          col: 0,
          typeId: "meadow",
        },
        {
          id: "cell-a2",
          row: 0,
          col: 1,
        },
        {
          id: "cell-b1",
          row: 1,
          col: 0,
        },
        {
          id: "cell-b2",
          row: 1,
          col: 1,
        },
      ],
      relations: [
        {
          id: "portal",
          typeId: "portal",
          fromSpaceId: "cell-a1",
          toSpaceId: "cell-b2",
          directed: false,
          fields: {
            cost: 2,
          },
        },
      ],
      containers: [
        {
          id: "cache",
          name: "Cache",
          host: {
            type: "board",
          },
          fields: {
            capacity: 2,
          },
        },
      ],
      edges: [
        {
          ref: {
            spaces: ["cell-a1", "cell-a2"],
          },
          typeId: "wall-slot",
          fields: {
            durability: 2,
          },
        },
      ],
      vertices: [
        {
          ref: {
            spaces: ["cell-a1", "cell-a2", "cell-b1", "cell-b2"],
          },
          typeId: "crossing",
          fields: {
            value: 1,
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
      },
    },
  ],
  resources: [
    {
      id: "coins",
      name: "Coins",
    },
  ],
  setupOptions: [],
  setupProfiles: [],
};

const EMPTY_MANIFEST: GameTopologyManifest = {
  players: {
    minPlayers: 2,
    maxPlayers: 4,
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

test("generateManifestContractSource emits typed topology fields and helper literals", () => {
  const source = generateManifestContractSource(TEST_MANIFEST);

  expect(source).toContain("export type TrackBoardBoardFields = {");
  expect(source).toContain('  "roundMarker": number;');
  expect(source).toContain("export type TrackBoardSpaceFields = {");
  expect(source).toContain("export type TrackBoardContainerFields = {");
  expect(source).toContain("export type TrackBoardRelationFields = {");
  expect(source).toContain("export type HexMapSpaceFields = {");
  expect(source).toContain("export type HexMapEdgeFields = {");
  expect(source).toContain("export type HexMapVertexFields = {");
  expect(source).toContain("export type SquareGridRelationFields = {");
  expect(source).toContain("export type SquareGridContainerFields = {");
  expect(source).toContain("export type SquareGridEdgeFields = {");
  expect(source).toContain("export type SquareGridVertexFields = {");
  expect(source).toContain("export type WorkerPieceFields = {");
  expect(source).toContain("export type D6DieFields = {");
  expect(source).toContain(
    'spaceTypeIds: ["forest", "meadow", "worker-space"] as const',
  );
  expect(source).toContain(
    'edgeTypeIds: ["three-to-one", "wall-slot"] as const',
  );
  expect(source).toContain(
    'vertexTypeIds: ["crossing", "settlement-slot"] as const',
  );
  expect(source).toContain('boardTypeIds: ["grid", "map", "track"] as const');
  expect(source).toContain(
    'boardLayouts: ["generic", "hex", "square"] as const',
  );
  expect(source).toContain("spaceIdsByBoardId:");
  expect(source).toContain("containerIdsByBoardId:");
  expect(source).toContain("boardIdsByTypeId:");
  expect(source).toContain("spaceIdsByTypeId:");
  expect(source).toContain("relationTypeIdsByBoardId:");
  expect(source).toContain("edgeIdsByTypeId:");
  expect(source).toContain("vertexIdsByTypeId:");
  expect(source).toContain("function buildPerPlayerComponentIds(");
  expect(source).toContain("function buildPlayerResources(");
  expect(source).toContain("createManifestStringLiteralSchema");
  expect(source).toContain(
    "export const runtimeSchema = createManifestRuntimeSchema({",
  );
  expect(source).toContain("zones: (playerIds?: readonly string[]) => ({");
  expect(source).toContain("cardSetIdsByZoneId: cloneManifestDefault(");
  expect(source).toContain(
    'cardSetIdsBySharedZoneId: {\n  "draw-deck": ["standard-deck"] as const,',
  );
  expect(source).toContain("allowedCardSetIds?: readonly CardSetId[];");
  expect(source).not.toContain("export type BoardSpaceId = SpaceId | TileId;");
  expect(source).toContain('layout: z.literal("generic")');
  expect(source).toContain("typeId: ids.relationTypeId");
  expect(source).toContain("export type SquareBoardStateById = {");
  expect(source).toContain("export type CardStateRecord<");
  expect(source).toContain(
    '"CARD_A": CardStateRecord<"CARD_A", "standard-deck", "CARD_A", StandardDeckCardProperties>;',
  );
  expect(source).toContain(
    "const cardPropertiesSchemaByCardSetId: Record<string, z.ZodTypeAny> = {",
  );
  expect(source).toContain(
    "function createCardStateSchema<CardIdValue extends CardId>(",
  );
  expect(source).toContain(
    "literals.cardIds.map((cardId) => [cardId, createCardStateSchema(cardId)])",
  );
  expect(source).not.toContain("const createStringLiteralSchema = <Values");
  expect(source).not.toContain(
    "function createRuntimeSchema<PhaseNameSchema extends z.ZodTypeAny>(",
  );
});

test("generateManifestContractSource renders optional nullable and record schemas", () => {
  const source = generateManifestContractSource(TEST_MANIFEST);

  expect(source).toContain('  "note"?: string | null;');
  expect(source).toContain('  "scoreByPlayer": Record<string, number>;');
  expect(source).toContain('  "labelOverride"?: string | null;');
  expect(source).toContain(
    "export const StandardDeckCardPropertiesSchema = z.object({",
  );
  expect(source).toContain('"note": z.string().nullable().optional()');
  expect(source).toContain("z.record(z.string(), z.number().int())");
});

test("generateManifestContractSource uses safe empty component state maps", () => {
  const source = generateManifestContractSource(EMPTY_MANIFEST);

  expect(source).toContain(
    "export type CardStateById = Record<string, never>;",
  );
  expect(source).toContain(
    "export type PieceStateById = Record<string, never>;",
  );
  expect(source).toContain("export type DieStateById = Record<string, never>;");
  expect(source).not.toContain("function createCardStateSchema<CardIdValue");
});
