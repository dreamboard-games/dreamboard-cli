import { expect, test } from "bun:test";

import {
  describeFingerprintMismatch,
  parseScenarioDefinition,
} from "./test.js";

test("zero-step scenarios are valid for initial-state invariant checks", () => {
  const scenario = parseScenarioDefinition({
    meta: {
      id: "initial-state",
      description: "Asserts structural invariants before any actions",
    },
    given: {
      base: "initial-turn",
    },
    when: {
      steps: [],
    },
    then: {
      assert: () => undefined,
    },
  });

  expect(scenario.when.steps).toEqual([]);
});

test("fingerprint mismatch message distinguishes base setup and compiled result drift", () => {
  const message = describeFingerprintMismatch({
    generatedFingerprint: {
      base: "initial-turn",
      seed: 1337,
      players: 4,
      baseSetupHash: "base-a",
      compiledResultId: "compiled-a",
      manifestHash: "manifest-a",
      gameId: "game-a",
    },
    runtimeFingerprint: {
      base: "initial-turn",
      seed: 1338,
      players: 4,
      baseSetupHash: "base-b",
      compiledResultId: "compiled-b",
      manifestHash: "manifest-b",
      gameId: "game-a",
    },
  });

  expect(message).toContain("base setup changed");
  expect(message).toContain("compiled result changed");
});
