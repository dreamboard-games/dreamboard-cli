import path from "node:path";
import { test, expect } from "bun:test";
import type { GameTopologyManifest } from "@dreamboard/sdk-types";
import { createReducerBundle } from "../reducer";
import { createIngressRuntimeCodec } from "./ingress/runtime-codec";

test("mixed board tables preserve explicit edges, vertices, and relations during reducer initialization", async () => {
  const projectRoot = path.resolve(
    import.meta.dir,
    "../../../../sdk-ergonomics-lab",
  );
  const codegenRoot = path.resolve(
    import.meta.dir,
    "../../../../packages/workspace-codegen/src/index.ts",
  );
  const manifestModule = await import(path.join(projectRoot, "manifest.ts"));
  const gameModule = await import(path.join(projectRoot, "app", "game.ts"));
  const { materializeManifestTable } = await import(codegenRoot);

  const playerIds = ["player-1", "player-2"];
  const bundle = createReducerBundle(gameModule.default as never);
  const table = materializeManifestTable({
    manifest: manifestModule.default,
    playerIds,
    shuffleItems: <Value>(values: readonly Value[]) => [...values],
  });

  await expect(
    bundle.initialize({
      table: table as never,
      playerIds,
      rngSeed: 1n,
      setup: { profileId: "river-draft" } as never,
    }),
  ).resolves.toBeDefined();
});

test("materializeManifestTable rejects player-scoped seed homes without ownerId", async () => {
  const codegenRoot = path.resolve(
    import.meta.dir,
    "../../../../packages/workspace-codegen/src/index.ts",
  );
  const { materializeManifestTable } = await import(codegenRoot);

  const manifest = {
    players: {
      minPlayers: 2,
      maxPlayers: 2,
      optimalPlayers: 2,
    },
    cardSets: [],
    zones: [
      {
        id: "main-hand",
        name: "Main Hand",
        scope: "perPlayer",
      },
    ],
    boardTemplates: [],
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
          zoneId: "main-hand",
        },
      },
    ],
    resources: [],
    setupOptions: [],
    setupProfiles: [],
  } satisfies GameTopologyManifest;

  expect(() =>
    materializeManifestTable({
      manifest,
      playerIds: ["player-1", "player-2"],
      shuffleItems: <Value>(values: readonly Value[]) => [...values],
    }),
  ).toThrow(
    "manifest.pieceSeeds[0].home.boardId: Piece seed 'worker-a' requires ownerId because board 'player-mat' has scope 'perPlayer'. Add ownerId to resolve the player-scoped destination.",
  );
});

test("ingress runtime codec rejects tiled boards that omit explicit topology", async () => {
  const projectRoot = path.resolve(
    import.meta.dir,
    "../../../../sdk-ergonomics-lab",
  );
  const codegenRoot = path.resolve(
    import.meta.dir,
    "../../../../packages/workspace-codegen/src/index.ts",
  );
  const manifestModule = await import(path.join(projectRoot, "manifest.ts"));
  const gameModule = await import(path.join(projectRoot, "app", "game.ts"));
  const { materializeManifestTable } = await import(codegenRoot);

  const playerIds = ["player-1", "player-2"];
  const codec = createIngressRuntimeCodec(gameModule.default as never);
  const table = materializeManifestTable({
    manifest: manifestModule.default,
    playerIds,
    shuffleItems: <Value>(values: readonly Value[]) => [...values],
  });
  const [hexBoardId] = Object.keys(table.boards.hex);
  if (!hexBoardId) {
    throw new Error(
      "Expected sdk-ergonomics-lab to materialize at least one hex board.",
    );
  }

  const sparseTable = structuredClone(table);
  delete sparseTable.boards.byId[hexBoardId]?.edges;
  delete sparseTable.boards.hex[hexBoardId]?.edges;

  expect(() =>
    codec.parseInitialTable(sparseTable as never, playerIds),
  ).toThrow(
    `Board '${hexBoardId}' with layout 'hex' requires explicit edges in the runtime table.`,
  );
});
