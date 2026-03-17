import { expect, test } from "bun:test";
import { buildPulledProjectConfig } from "./sync.ts";

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
      },
      {
        authoringStateId: "authoring-state-2",
        files: {},
        sourceRevisionId: "source-revision-2",
        treeHash: "tree-hash-2",
        manifestId: "manifest-2",
        manifest: {
          stateMachine: {
            states: [{ name: "setup" }],
          },
        },
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
