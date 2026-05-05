import { defineTopologyManifest } from "@dreamboard/sdk-types";

// Standard Star Settlers sector layout in axial coordinates (pointy-top hexes)
// The 19 land hexes use the standard 3-4-5-4-3 ring layout
// Row offsets (r): -2, -1, 0, 1, 2
// Column offsets (q) vary per row

export default defineTopologyManifest({
  players: {
    minPlayers: 3,
    maxPlayers: 4,
    optimalPlayers: 4,
  },

  // Tech card deck
  cardSets: [
    {
      type: "manual",
      id: "tech-cards",
      name: "Tech Cards",
      cardSchema: {
        properties: {
          cardType: {
            type: "enum",
            enums: [
              "patrol",
              "jumpGate",
              "bountySurvey",
              "signalLock",
              "relicCache",
            ],
          },
        },
      },
      cards: [
        {
          type: "patrol",
          name: "Patrol",
          count: 14,
          properties: { cardType: "patrol" },
        },
        {
          type: "jumpGate",
          name: "Jump Gate",
          count: 2,
          properties: { cardType: "jumpGate" },
        },
        {
          type: "bountySurvey",
          name: "Bounty Survey",
          count: 2,
          properties: { cardType: "bountySurvey" },
        },
        {
          type: "signalLock",
          name: "Signal Lock",
          count: 2,
          properties: { cardType: "signalLock" },
        },
        {
          type: "relicCache",
          name: "Relic Cache",
          count: 5,
          properties: { cardType: "relicCache" },
        },
      ],
    },
  ],

  zones: [
    // Shared tech card deck
    {
      id: "tech-deck",
      name: "Tech Card Deck",
      scope: "shared",
      allowedCardSetIds: ["tech-cards"],
      visibility: "hidden",
    },
    // Per-player tech card hand (private)
    {
      id: "tech-hand",
      name: "Tech Card Hand",
      scope: "perPlayer",
      allowedCardSetIds: ["tech-cards"],
      visibility: "ownerOnly",
    },
    // Shared played tech cards discard pile (public)
    {
      id: "tech-played",
      name: "Played Tech Cards",
      scope: "shared",
      allowedCardSetIds: ["tech-cards"],
      visibility: "public",
    },
  ],

  // The Star Settlers sector hex board
  boardTemplates: [
    {
      id: "star-sector",
      name: "Star Settlers Sector",
      layout: "hex",
      orientation: "pointy-top",
      edgeFieldsSchema: {
        properties: {
          relayIndex: {
            type: "integer",
            optional: true,
          },
        },
      },
      // Standard 19-hex Star Settlers layout in axial coordinates
      // Ring 0 (center): 1 hex
      // Ring 1: 6 hexes
      // Ring 2: 12 hexes
      spaces: [
        // Center
        {
          id: "h-0-0",
          q: 0,
          r: 0,
          typeId: "land",
        },

        // Ring 1 (6 hexes)
        {
          id: "h-1-0",
          q: 1,
          r: -1,
          typeId: "land",
        },
        {
          id: "h-1-1",
          q: 1,
          r: 0,
          typeId: "land",
        },
        {
          id: "h-1-2",
          q: 0,
          r: 1,
          typeId: "land",
        },
        {
          id: "h-1-3",
          q: -1,
          r: 1,
          typeId: "land",
        },
        {
          id: "h-1-4",
          q: -1,
          r: 0,
          typeId: "land",
        },
        {
          id: "h-1-5",
          q: 0,
          r: -1,
          typeId: "land",
        },

        // Ring 2 (12 hexes)
        {
          id: "h-2-0",
          q: 2,
          r: -2,
          typeId: "land",
        },
        {
          id: "h-2-1",
          q: 2,
          r: -1,
          typeId: "land",
        },
        {
          id: "h-2-2",
          q: 2,
          r: 0,
          typeId: "land",
        },
        {
          id: "h-2-3",
          q: 1,
          r: 1,
          typeId: "land",
        },
        {
          id: "h-2-4",
          q: 0,
          r: 2,
          typeId: "land",
        },
        {
          id: "h-2-5",
          q: -1,
          r: 2,
          typeId: "land",
        },
        {
          id: "h-2-6",
          q: -2,
          r: 2,
          typeId: "land",
        },
        {
          id: "h-2-7",
          q: -2,
          r: 1,
          typeId: "land",
        },
        {
          id: "h-2-8",
          q: -2,
          r: 0,
          typeId: "land",
        },
        {
          id: "h-2-9",
          q: -1,
          r: -1,
          typeId: "land",
        },
        {
          id: "h-2-10",
          q: 0,
          r: -2,
          typeId: "land",
        },
        {
          id: "h-2-11",
          q: 1,
          r: -2,
          typeId: "land",
        },

        // Ring 3 (18 deepSpace hexes — surrounds the sector)
        {
          id: "o-0",
          q: 3,
          r: -3,
          typeId: "deepSpace",
        },
        {
          id: "o-1",
          q: 3,
          r: -2,
          typeId: "deepSpace",
        },
        {
          id: "o-2",
          q: 3,
          r: -1,
          typeId: "deepSpace",
        },
        {
          id: "o-3",
          q: 3,
          r: 0,
          typeId: "deepSpace",
        },
        {
          id: "o-4",
          q: 2,
          r: 1,
          typeId: "deepSpace",
        },
        {
          id: "o-5",
          q: 1,
          r: 2,
          typeId: "deepSpace",
        },
        {
          id: "o-6",
          q: 0,
          r: 3,
          typeId: "deepSpace",
        },
        {
          id: "o-7",
          q: -1,
          r: 3,
          typeId: "deepSpace",
        },
        {
          id: "o-8",
          q: -2,
          r: 3,
          typeId: "deepSpace",
        },
        {
          id: "o-9",
          q: -3,
          r: 3,
          typeId: "deepSpace",
        },
        {
          id: "o-10",
          q: -3,
          r: 2,
          typeId: "deepSpace",
        },
        {
          id: "o-11",
          q: -3,
          r: 1,
          typeId: "deepSpace",
        },
        {
          id: "o-12",
          q: -3,
          r: 0,
          typeId: "deepSpace",
        },
        {
          id: "o-13",
          q: -2,
          r: -1,
          typeId: "deepSpace",
        },
        {
          id: "o-14",
          q: -1,
          r: -2,
          typeId: "deepSpace",
        },
        {
          id: "o-15",
          q: 0,
          r: -3,
          typeId: "deepSpace",
        },
        {
          id: "o-16",
          q: 1,
          r: -3,
          typeId: "deepSpace",
        },
        {
          id: "o-17",
          q: 2,
          r: -3,
          typeId: "deepSpace",
        },
      ],
      edges: [
        {
          ref: { spaces: ["h-2-11", "o-16"] },
          typeId: "relay",
          fields: { relayIndex: 0 },
        },
        {
          ref: { spaces: ["h-2-11", "o-17"] },
          typeId: "relay",
          fields: { relayIndex: 1 },
        },
        {
          ref: { spaces: ["h-2-1", "o-1"] },
          typeId: "relay",
          fields: { relayIndex: 2 },
        },
        {
          ref: { spaces: ["h-2-3", "o-4"] },
          typeId: "relay",
          fields: { relayIndex: 3 },
        },
        {
          ref: { spaces: ["h-2-4", "o-5"] },
          typeId: "relay",
          fields: { relayIndex: 4 },
        },
        {
          ref: { spaces: ["h-2-5", "o-8"] },
          typeId: "relay",
          fields: { relayIndex: 5 },
        },
        {
          ref: { spaces: ["h-2-7", "o-10"] },
          typeId: "relay",
          fields: { relayIndex: 6 },
        },
        {
          ref: { spaces: ["h-2-8", "o-13"] },
          typeId: "relay",
          fields: { relayIndex: 7 },
        },
        {
          ref: { spaces: ["h-2-9", "o-14"] },
          typeId: "relay",
          fields: { relayIndex: 8 },
        },
      ],
    },
  ],

  boards: [
    {
      id: "sector",
      name: "Star Settlers Sector",
      layout: "hex",
      scope: "shared",
      templateId: "star-sector",
    },
  ],

  // Piece types for routes, outposts, hubs, and raider
  pieceTypes: [
    {
      id: "route",
      name: "Route",
    },
    {
      id: "outpost",
      name: "Outpost",
    },
    {
      id: "hub",
      name: "Hub",
    },
    {
      id: "raider",
      name: "Raider",
    },
  ],

  // Seed the raider (starts detached; setup will place it on the deadZone)
  pieceSeeds: [
    {
      id: "raider",
      typeId: "raider",
      home: { type: "detached" },
    },
    // Per-player routes (15 each)
    {
      id: "route-p1-1",
      typeId: "route",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "route-p1-2",
      typeId: "route",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "route-p1-3",
      typeId: "route",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "route-p1-4",
      typeId: "route",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "route-p1-5",
      typeId: "route",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "route-p1-6",
      typeId: "route",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "route-p1-7",
      typeId: "route",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "route-p1-8",
      typeId: "route",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "route-p1-9",
      typeId: "route",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "route-p1-10",
      typeId: "route",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "route-p1-11",
      typeId: "route",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "route-p1-12",
      typeId: "route",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "route-p1-13",
      typeId: "route",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "route-p1-14",
      typeId: "route",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "route-p1-15",
      typeId: "route",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "route-p2-1",
      typeId: "route",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "route-p2-2",
      typeId: "route",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "route-p2-3",
      typeId: "route",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "route-p2-4",
      typeId: "route",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "route-p2-5",
      typeId: "route",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "route-p2-6",
      typeId: "route",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "route-p2-7",
      typeId: "route",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "route-p2-8",
      typeId: "route",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "route-p2-9",
      typeId: "route",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "route-p2-10",
      typeId: "route",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "route-p2-11",
      typeId: "route",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "route-p2-12",
      typeId: "route",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "route-p2-13",
      typeId: "route",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "route-p2-14",
      typeId: "route",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "route-p2-15",
      typeId: "route",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "route-p3-1",
      typeId: "route",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "route-p3-2",
      typeId: "route",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "route-p3-3",
      typeId: "route",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "route-p3-4",
      typeId: "route",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "route-p3-5",
      typeId: "route",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "route-p3-6",
      typeId: "route",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "route-p3-7",
      typeId: "route",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "route-p3-8",
      typeId: "route",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "route-p3-9",
      typeId: "route",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "route-p3-10",
      typeId: "route",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "route-p3-11",
      typeId: "route",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "route-p3-12",
      typeId: "route",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "route-p3-13",
      typeId: "route",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "route-p3-14",
      typeId: "route",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "route-p3-15",
      typeId: "route",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "route-p4-1",
      typeId: "route",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "route-p4-2",
      typeId: "route",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "route-p4-3",
      typeId: "route",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "route-p4-4",
      typeId: "route",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "route-p4-5",
      typeId: "route",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "route-p4-6",
      typeId: "route",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "route-p4-7",
      typeId: "route",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "route-p4-8",
      typeId: "route",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "route-p4-9",
      typeId: "route",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "route-p4-10",
      typeId: "route",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "route-p4-11",
      typeId: "route",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "route-p4-12",
      typeId: "route",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "route-p4-13",
      typeId: "route",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "route-p4-14",
      typeId: "route",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "route-p4-15",
      typeId: "route",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    // Per-player outposts (5 each)
    {
      id: "outpost-p1-1",
      typeId: "outpost",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "outpost-p1-2",
      typeId: "outpost",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "outpost-p1-3",
      typeId: "outpost",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "outpost-p1-4",
      typeId: "outpost",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "outpost-p1-5",
      typeId: "outpost",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "outpost-p2-1",
      typeId: "outpost",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "outpost-p2-2",
      typeId: "outpost",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "outpost-p2-3",
      typeId: "outpost",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "outpost-p2-4",
      typeId: "outpost",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "outpost-p2-5",
      typeId: "outpost",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "outpost-p3-1",
      typeId: "outpost",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "outpost-p3-2",
      typeId: "outpost",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "outpost-p3-3",
      typeId: "outpost",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "outpost-p3-4",
      typeId: "outpost",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "outpost-p3-5",
      typeId: "outpost",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "outpost-p4-1",
      typeId: "outpost",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "outpost-p4-2",
      typeId: "outpost",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "outpost-p4-3",
      typeId: "outpost",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "outpost-p4-4",
      typeId: "outpost",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "outpost-p4-5",
      typeId: "outpost",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    // Per-player hubs (4 each)
    {
      id: "hub-p1-1",
      typeId: "hub",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "hub-p1-2",
      typeId: "hub",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "hub-p1-3",
      typeId: "hub",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "hub-p1-4",
      typeId: "hub",
      ownerId: "player-1",
      home: { type: "detached" },
    },
    {
      id: "hub-p2-1",
      typeId: "hub",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "hub-p2-2",
      typeId: "hub",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "hub-p2-3",
      typeId: "hub",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "hub-p2-4",
      typeId: "hub",
      ownerId: "player-2",
      home: { type: "detached" },
    },
    {
      id: "hub-p3-1",
      typeId: "hub",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "hub-p3-2",
      typeId: "hub",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "hub-p3-3",
      typeId: "hub",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "hub-p3-4",
      typeId: "hub",
      ownerId: "player-3",
      home: { type: "detached" },
    },
    {
      id: "hub-p4-1",
      typeId: "hub",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "hub-p4-2",
      typeId: "hub",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "hub-p4-3",
      typeId: "hub",
      ownerId: "player-4",
      home: { type: "detached" },
    },
    {
      id: "hub-p4-4",
      typeId: "hub",
      ownerId: "player-4",
      home: { type: "detached" },
    },
  ],

  dieTypes: [
    {
      id: "d6",
      name: "Six-sided die",
      sides: 6,
    },
  ],

  dieSeeds: [
    { id: "die-1", typeId: "d6" },
    { id: "die-2", typeId: "d6" },
  ],

  resources: [
    { id: "carbon", name: "Carbon Cells", icon: "⚫" },
    { id: "alloy", name: "Alloy Plating", icon: "🛰️" },
    { id: "water", name: "Hydrogen Ice", icon: "🧊" },
    { id: "fiber", name: "Biofiber", icon: "🧬" },
    { id: "crystal", name: "Quantum Crystal", icon: "🔷" },
  ],

  setupOptions: [],
  setupProfiles: [
    {
      id: "standard",
      name: "Standard",
      description: "Standard Star Settlers setup",
    },
  ],
});
