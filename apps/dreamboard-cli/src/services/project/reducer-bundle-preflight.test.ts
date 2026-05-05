import { describe, expect, test } from "bun:test";
import type { GameTopologyManifest } from "@dreamboard/sdk-types";
import { asPlayerId, perPlayer } from "@dreamboard/app-sdk/reducer";
import {
  assertViewPerPlayerSeatsValid,
  buildScenarios,
  driveReducerBundleThroughScenarios,
  type ReducerBundleLike,
  type ReducerBundleSmokeScenario,
} from "./reducer-bundle-preflight.js";

const BASE_MANIFEST: GameTopologyManifest = {
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
};

function manifestWith(
  overrides: Partial<GameTopologyManifest>,
): GameTopologyManifest {
  return { ...BASE_MANIFEST, ...overrides };
}

describe("buildScenarios", () => {
  test("returns no scenarios when the manifest has no player bounds", () => {
    const manifest = manifestWith({
      players: {
        // @ts-expect-error - mimic an older manifest with missing bounds.
        minPlayers: null,
        // @ts-expect-error - ditto.
        maxPlayers: null,
        optimalPlayers: 2,
      },
    });
    expect(buildScenarios(manifest)).toEqual([]);
  });

  test("returns min and max player scenarios without setup profiles", () => {
    const manifest = manifestWith({
      players: { minPlayers: 2, maxPlayers: 4, optimalPlayers: 2 },
      setupProfiles: [],
    });
    expect(buildScenarios(manifest)).toEqual([
      { setupProfileId: null, playerCount: 2 },
      { setupProfileId: null, playerCount: 4 },
    ]);
  });

  test("deduplicates when min and max player counts match", () => {
    const manifest = manifestWith({
      players: { minPlayers: 3, maxPlayers: 3, optimalPlayers: 3 },
    });
    expect(buildScenarios(manifest)).toEqual([
      { setupProfileId: null, playerCount: 3 },
    ]);
  });

  test("cross-products setup profiles with player counts", () => {
    const manifest = manifestWith({
      players: { minPlayers: 2, maxPlayers: 4, optimalPlayers: 2 },
      setupProfiles: [
        { id: "draft", name: "Draft" },
        { id: "final", name: "Final" },
      ],
    });
    expect(buildScenarios(manifest)).toEqual([
      { setupProfileId: "draft", playerCount: 2 },
      { setupProfileId: "draft", playerCount: 4 },
      { setupProfileId: "final", playerCount: 2 },
      { setupProfileId: "final", playerCount: 4 },
    ]);
  });
});

describe("assertViewPerPlayerSeatsValid", () => {
  test("returns null for primitive views without any PerPlayer nodes", () => {
    expect(assertViewPerPlayerSeatsValid(null, ["a"])).toBeNull();
    expect(assertViewPerPlayerSeatsValid(42, ["a"])).toBeNull();
    expect(assertViewPerPlayerSeatsValid("hello", ["a"])).toBeNull();
    expect(
      assertViewPerPlayerSeatsValid({ title: "hi", scores: [1, 2, 3] }, [
        "player-1",
        "player-2",
      ]),
    ).toBeNull();
  });

  test("accepts a PerPlayer that matches the runtime seat list", () => {
    const seats = [asPlayerId("player-1"), asPlayerId("player-2")];
    const scores = perPlayer(seats, (id, index) => ({ id, index }));
    expect(
      assertViewPerPlayerSeatsValid(scores, ["player-1", "player-2"]),
    ).toBeNull();
  });

  test("accepts a PerPlayer whose entries are a permutation of the seat list", () => {
    const seats = [asPlayerId("player-2"), asPlayerId("player-1")];
    const scores = perPlayer(seats, (id) => ({ id }));
    expect(
      assertViewPerPlayerSeatsValid(scores, ["player-1", "player-2"]),
    ).toBeNull();
  });

  test("flags a PerPlayer missing a runtime seat", () => {
    const seats = [asPlayerId("player-1"), asPlayerId("player-2")];
    const scores = perPlayer(seats, (id) => id);
    const message = assertViewPerPlayerSeatsValid(scores, [
      "player-1",
      "player-2",
      "player-3",
    ]);
    expect(message).not.toBeNull();
    expect(message).toContain("PerPlayer seat mismatch");
    expect(message).toContain("player-3");
  });

  test("flags a PerPlayer containing an unexpected seat", () => {
    const seats = [
      asPlayerId("player-1"),
      asPlayerId("player-2"),
      asPlayerId("player-3"),
    ];
    const scores = perPlayer(seats, (id) => id);
    const message = assertViewPerPlayerSeatsValid(scores, [
      "player-1",
      "player-2",
    ]);
    expect(message).not.toBeNull();
    expect(message).toContain("Unexpected player id");
    expect(message).toContain("player-3");
  });

  test("includes the breadcrumb path when the mismatch is nested", () => {
    const seats = [asPlayerId("player-1")];
    const scores = perPlayer(seats, (id) => id);
    const message = assertViewPerPlayerSeatsValid(
      { layout: { zones: [{ label: "hand", perPlayer: scores }] } },
      ["player-1", "player-2"],
    );
    expect(message).not.toBeNull();
    expect(message).toContain("at view.layout.zones.[0].perPlayer");
  });
});

describe("driveReducerBundleThroughScenarios", () => {
  test("returns no failures when the bundle emits a correctly shaped PerPlayer view", async () => {
    const manifest = manifestWith({
      players: { minPlayers: 2, maxPlayers: 3, optimalPlayers: 2 },
    });
    const scenarios = buildScenarios(manifest);
    const initializeCalls: Array<{
      playerIds: string[];
      setup: string | null;
      rngSeed: number | null;
    }> = [];
    const projectSeatsDynamicCalls: Array<{ playerIds: string[] }> = [];

    const bundle: ReducerBundleLike = {
      async initialize({ playerIds, setup, rngSeed }) {
        initializeCalls.push({
          playerIds: [...playerIds],
          setup: setup?.profileId ?? null,
          rngSeed: rngSeed ?? null,
        });
        return { playerIds: [...playerIds] };
      },
      projectSeatsDynamic({ state, playerIds }) {
        projectSeatsDynamicCalls.push({ playerIds: [...playerIds] });
        const ids = (state as { playerIds: string[] }).playerIds.map((id) =>
          asPlayerId(id),
        );
        const view = {
          scores: perPlayer(ids, (id) => ({ id })),
        };
        const seats: Record<string, { view: unknown }> = {};
        for (const pid of playerIds) {
          seats[pid] = { view };
        }
        return { seats };
      },
    };

    const failures = await driveReducerBundleThroughScenarios({
      manifest,
      bundle,
      scenarios,
    });

    expect(failures).toEqual([]);
    expect(initializeCalls).toEqual([
      { playerIds: ["player-1", "player-2"], setup: null, rngSeed: 1337 },
      {
        playerIds: ["player-1", "player-2", "player-3"],
        setup: null,
        rngSeed: 1337,
      },
    ]);
    expect(projectSeatsDynamicCalls).toEqual([
      { playerIds: ["player-1", "player-2"] },
      { playerIds: ["player-1", "player-2", "player-3"] },
    ]);
  });

  test("records a VALIDATE_VIEW failure when the bundle returns the wrong seat count", async () => {
    const manifest = manifestWith({
      players: { minPlayers: 2, maxPlayers: 3, optimalPlayers: 2 },
    });
    const scenarios = buildScenarios(manifest);
    const fixedSeats = [asPlayerId("player-1"), asPlayerId("player-2")];
    const fixedScores = perPlayer(fixedSeats, (id) => ({ id }));
    const fixedView = { scores: fixedScores };

    const bundle: ReducerBundleLike = {
      async initialize() {
        return {};
      },
      projectSeatsDynamic({ playerIds }) {
        const seats: Record<string, { view: unknown }> = {};
        for (const pid of playerIds) {
          seats[pid] = { view: fixedView };
        }
        return { seats };
      },
    };

    const failures = await driveReducerBundleThroughScenarios({
      manifest,
      bundle,
      scenarios,
    });

    const threePlayerFailures = failures.filter(
      (failure) => failure.scenario.playerCount === 3,
    );
    expect(threePlayerFailures.length).toBeGreaterThan(0);
    for (const failure of threePlayerFailures) {
      expect(failure.phase).toBe("VALIDATE_VIEW");
      expect(failure.headline).toContain("PerPlayer seat mismatch");
      expect(failure.headline).toContain("player-3");
    }

    const twoPlayerFailures = failures.filter(
      (failure) => failure.scenario.playerCount === 2,
    );
    expect(twoPlayerFailures).toEqual([]);
  });

  test("captures initialize() rejections as INITIALIZE failures", async () => {
    const manifest = manifestWith({
      players: { minPlayers: 2, maxPlayers: 2, optimalPlayers: 2 },
    });
    const scenarios = buildScenarios(manifest);

    const bundle: ReducerBundleLike = {
      async initialize() {
        throw new Error("boom during initialize");
      },
      projectSeatsDynamic() {
        throw new Error(
          "projectSeatsDynamic should not run when initialize fails",
        );
      },
    };

    const failures = await driveReducerBundleThroughScenarios({
      manifest,
      bundle,
      scenarios,
    });

    expect(failures).toHaveLength(1);
    expect(failures[0]?.phase).toBe("INITIALIZE");
    expect(failures[0]?.headline).toContain("boom during initialize");
  });

  test("captures projectSeatsDynamic() throws as PROJECT_SEATS failures", async () => {
    const manifest = manifestWith({
      players: { minPlayers: 2, maxPlayers: 2, optimalPlayers: 2 },
    });
    const scenarios = buildScenarios(manifest);

    const bundle: ReducerBundleLike = {
      async initialize() {
        return {};
      },
      projectSeatsDynamic() {
        throw new Error("projectSeatsDynamic exploded");
      },
    };

    const failures = await driveReducerBundleThroughScenarios({
      manifest,
      bundle,
      scenarios,
    });

    expect(failures).toHaveLength(1);
    const failure = failures[0]!;
    expect(failure.phase).toBe("PROJECT_SEATS");
    expect(failure.headline).toContain("projectSeatsDynamic exploded");
  });

  test("records a PROJECT_SEATS failure when projectSeatsDynamic() omits a seat", async () => {
    const manifest = manifestWith({
      players: { minPlayers: 2, maxPlayers: 2, optimalPlayers: 2 },
    });
    const scenarios = buildScenarios(manifest);

    const bundle: ReducerBundleLike = {
      async initialize() {
        return {};
      },
      projectSeatsDynamic({ playerIds }) {
        const seats: Record<string, { view: unknown }> = {};
        for (const pid of playerIds) {
          if (pid === "player-2") continue;
          seats[pid] = { view: {} };
        }
        return { seats };
      },
    };

    const failures = await driveReducerBundleThroughScenarios({
      manifest,
      bundle,
      scenarios,
    });

    expect(failures).toHaveLength(1);
    const failure = failures[0]!;
    expect(failure.phase).toBe("PROJECT_SEATS");
    expect(failure.playerId).toBe("player-2");
    expect(failure.headline).toContain("player-2");
  });

  test("returns an empty array when there are no scenarios to drive", async () => {
    const bundle: ReducerBundleLike = {
      async initialize() {
        throw new Error("should not be called");
      },
      projectSeatsDynamic() {
        throw new Error("should not be called");
      },
    };

    const failures = await driveReducerBundleThroughScenarios({
      manifest: BASE_MANIFEST,
      bundle,
      scenarios: [] as ReducerBundleSmokeScenario[],
    });

    expect(failures).toEqual([]);
  });
});
