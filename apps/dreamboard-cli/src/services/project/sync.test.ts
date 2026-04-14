import { expect, test } from "bun:test";
import { buildPulledProjectConfig } from "./sync.ts";

const MINIMAL_MANIFEST = {
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
} as const;

test("buildPulledProjectConfig preserves configured URLs while hydrating the latest authoring head", () => {
  expect(
    buildPulledProjectConfig(
      {
        apiBaseUrl: "https://api.example.com",
        webBaseUrl: "https://web.example.com",
      },
      {
        gameId: "game-1",
        slug: "test-game",
        manifestId: "manifest-1",
        ruleId: "rule-1",
        authoring: {
          pendingSync: {
            phase: "authoring_state_created",
            authoringStateId: "authoring-state-stale",
            sourceRevisionId: "source-revision-stale",
            sourceTreeHash: "tree-hash-stale",
            manifestId: "manifest-stale",
            manifestContentHash: "manifest-hash-stale",
            ruleId: "rule-stale",
          },
        },
      },
      {
        authoringStateId: "authoring-state-2",
        files: {},
        sourceRevisionId: "source-revision-2",
        treeHash: "tree-hash-2",
        manifestId: "manifest-2",
        manifest: MINIMAL_MANIFEST,
        ruleId: "rule-2",
        ruleText: "# Remote rule\n",
      },
    ),
  ).toMatchObject({
    gameId: "game-1",
    slug: "test-game",
    apiBaseUrl: "https://api.example.com",
    webBaseUrl: "https://web.example.com",
    authoring: {
      authoringStateId: "authoring-state-2",
      manifestId: "manifest-2",
      ruleId: "rule-2",
      sourceRevisionId: "source-revision-2",
      sourceTreeHash: "tree-hash-2",
    },
  });
});
