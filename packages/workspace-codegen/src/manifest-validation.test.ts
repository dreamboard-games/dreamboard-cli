import { expect, test } from "bun:test";
import type { GameTopologyManifest } from "@dreamboard/sdk-types";
import { validateManifestAuthoring } from "./manifest-validation.js";

const BASE_MANIFEST: GameTopologyManifest = {
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

test("validateManifestAuthoring rejects hex vertex refs that do not resolve to a shared corner", () => {
  const issues = validateManifestAuthoring({
    ...BASE_MANIFEST,
    boards: [
      {
        id: "hex-board",
        name: "Hex Board",
        layout: "hex",
        scope: "shared",
        spaces: [
          { id: "a", q: 0, r: 0 },
          { id: "b", q: 1, r: 0 },
          { id: "c", q: 2, r: 0 },
        ],
        vertices: [
          {
            ref: {
              spaces: ["a", "b", "c"],
            },
          },
        ],
      },
    ],
  });

  expect(issues).toContain(
    "manifest.boards[0].vertices[0].ref: Hex board 'hex-board' with spaces 'a, b, c' failed validation. Hex vertex ref spaces 'a, b, c' do not resolve to exactly one shared vertex.",
  );
});

test("validateManifestAuthoring accepts hex vertex refs that resolve after template space merge", () => {
  const issues = validateManifestAuthoring({
    ...BASE_MANIFEST,
    boardTemplates: [
      {
        id: "triad",
        name: "Triad",
        layout: "hex",
        spaces: [
          { id: "a", q: 0, r: 0 },
          { id: "b", q: 1, r: 0 },
          { id: "c", q: 0, r: 1 },
        ],
      },
    ],
    boards: [
      {
        id: "hex-board",
        name: "Hex Board",
        layout: "hex",
        scope: "shared",
        templateId: "triad",
        spaces: [{ id: "a", q: 0, r: 0 }],
        vertices: [
          {
            ref: {
              spaces: ["a", "b", "c"],
            },
          },
        ],
      },
    ],
  });

  expect(issues).toEqual([]);
});
