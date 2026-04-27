import { mkdtemp, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "bun:test";
import type { GameTopologyManifest } from "@dreamboard/sdk-types";
import { writeManifest, writeRule } from "../project/local-files.js";
import { scaffoldStaticWorkspace } from "../project/static-scaffold.js";
import { applyWorkspaceCodegen } from "../project/workspace-codegen.js";

import {
  assertDispatchResultWireContract,
  generateReducerNativeArtifacts,
} from "./reducer-native-test-harness.js";

const WORKSPACE_NODE_MODULES = path.join(
  path.resolve(import.meta.dir, "../../.."),
  "node_modules",
);

const PRESET_DECK_MANIFEST: GameTopologyManifest = {
  players: {
    minPlayers: 2,
    maxPlayers: 4,
    optimalPlayers: 2,
  },
  cardSets: [
    {
      type: "preset",
      id: "poker-standard",
      name: "Standard Deck",
      presetId: "standard_52_deck",
    },
  ],
  zones: [
    {
      id: "draw-deck",
      name: "Draw Deck",
      scope: "shared",
      allowedCardSetIds: ["poker-standard"],
    },
  ],
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

const UNSUPPORTED_PRESET_MANIFEST: GameTopologyManifest = {
  ...PRESET_DECK_MANIFEST,
  cardSets: [
    {
      type: "preset",
      id: "unsupported-deck",
      name: "Unsupported Deck",
      presetId: "custom_deck",
    },
  ],
  zones: [
    {
      id: "draw-deck",
      name: "Draw Deck",
      scope: "shared",
      allowedCardSetIds: ["unsupported-deck"],
    },
  ],
};

async function createReducerTestingWorkspace(options: {
  manifest: GameTopologyManifest;
  scenarioContent?: string;
}): Promise<string> {
  const tempRoot = await mkdtemp(
    path.join(os.tmpdir(), "db-reducer-native-harness-"),
  );

  await scaffoldStaticWorkspace(tempRoot, "new");
  await writeManifest(tempRoot, options.manifest);
  await writeRule(tempRoot, "");
  await applyWorkspaceCodegen({
    projectRoot: tempRoot,
    manifest: options.manifest,
  });
  await symlink(WORKSPACE_NODE_MODULES, path.join(tempRoot, "node_modules"));

  if (options.scenarioContent) {
    await Bun.write(
      path.join(
        tempRoot,
        "test",
        "scenarios",
        "smoke-initial-turn.scenario.ts",
      ),
      options.scenarioContent,
    );
  }

  return tempRoot;
}

const SCENARIO_CONTENT = `import { defineScenario } from "../testing-types";

export default defineScenario({
  id: "smoke-initial-turn",
  from: "initial-turn",
  when: async () => undefined,
  then: ({ expect, players, prompts, state }) => {
    expect(state()).toBe("setup");
    for (const playerId of players()) {
      expect(prompts(playerId)).toEqual([]);
    }
  },
});
`;

test("accept dispatch results require kind discriminators throughout trace payloads", () => {
  expect(() =>
    assertDispatchResultWireContract({
      type: "accept",
      kind: "accept",
      trace: [
        {
          type: "acceptedClientInput",
          kind: "acceptedClientInput",
          input: { kind: "action" },
        },
        {
          type: "appliedEffect",
          kind: "appliedEffect",
          effect: {
            type: "transition",
            kind: "transition",
          },
        },
      ],
    }),
  ).not.toThrow();
});

test("missing top-level dispatch result kind fails with a backend-like contract error", () => {
  expect(() =>
    assertDispatchResultWireContract({
      type: "accept",
      trace: [],
    }),
  ).toThrow("DispatchResult must include kind='accept'");
});

test("missing nested effect kind fails with a precise payload path", () => {
  expect(() =>
    assertDispatchResultWireContract({
      type: "accept",
      kind: "accept",
      trace: [
        {
          type: "appliedEffect",
          kind: "appliedEffect",
          effect: {
            type: "transition",
          },
        },
      ],
    }),
  ).toThrow(
    "DispatchResult.accept.trace[0].effect must include kind='transition'",
  );
});

test("generateReducerNativeArtifacts materializes preset card sets", async () => {
  const tempRoot = await createReducerTestingWorkspace({
    manifest: PRESET_DECK_MANIFEST,
    scenarioContent: SCENARIO_CONTENT,
  });

  try {
    const result = await generateReducerNativeArtifacts({
      projectRoot: tempRoot,
    });

    expect(result.bases).toHaveLength(1);
    expect(result.scenarios).toHaveLength(1);

    const generatedBaseStates = await Bun.file(
      path.join(tempRoot, "test", "generated", "base-states.generated.ts"),
    ).text();
    expect(generatedBaseStates).toContain('"cardSetId": "poker-standard"');
    expect(generatedBaseStates).toContain('"SPADES_3"');
    expect(generatedBaseStates).toContain('"DIAMONDS_2"');
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("unsupported preset ids still fail with a precise error", async () => {
  await expect(
    createReducerTestingWorkspace({
      manifest: UNSUPPORTED_PRESET_MANIFEST,
      scenarioContent: SCENARIO_CONTENT,
    }),
  ).rejects.toThrow("Unsupported preset deck: custom_deck");
});
