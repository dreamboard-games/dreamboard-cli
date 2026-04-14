import { defineTopologyManifest } from "@dreamboard/sdk-types";

defineTopologyManifest({
  players: {
    minPlayers: 2,
    maxPlayers: 2,
    optimalPlayers: 2,
  },
  cardSets: [
    {
      id: "main",
      name: "Main",
      type: "manual",
      cardSchema: {
        type: "object",
        properties: {},
      },
      cards: [
        {
          type: "ace",
          name: "Ace",
          count: 1,
          properties: {},
          home: {
            type: "zone",
            zoneId: "discard",
          },
        },
      ],
    },
  ],
  zones: [
    {
      id: "draw",
      name: "Draw",
      scope: "shared",
      allowedCardSetIds: ["missing-card-set"],
    },
  ],
  boardTemplates: [],
  boards: [
    {
      id: "board",
      name: "Board",
      layout: "square",
      scope: "shared",
      spaces: [{ id: "space-a", row: 0, col: 0 }],
      containers: [{ id: "supply", name: "Supply", host: { type: "board" } }],
    },
  ],
  pieceTypes: [{ id: "meeple", name: "Meeple" }],
  pieceSeeds: [
    {
      typeId: "pawn",
      ownerId: "player-1",
      home: {
        type: "space",
        boardId: "board",
        spaceId: "space-a",
      },
    },
    {
      typeId: "meeple",
      ownerId: "player-3",
      home: {
        type: "space",
        boardId: "missing-board",
        spaceId: "space-a",
      },
    },
  ],
  dieTypes: [{ id: "d6", name: "D6", sides: 6 }],
  dieSeeds: [
    {
      typeId: "d6",
      home: {
        type: "container",
        boardId: "board",
        containerId: "missing-container",
      },
    },
  ],
  resources: [],
  setupOptions: [
    {
      id: "mode",
      name: "Mode",
      choices: [{ id: "standard", label: "Standard" }],
    },
  ],
  setupProfiles: [
    {
      id: "standard-profile",
      name: "Standard",
      optionValues: {
        mode: "draft",
      },
    },
  ],
} as const);
