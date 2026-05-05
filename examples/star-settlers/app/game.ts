import {
  defineGame,
  type ReducerGameDefinition,
} from "@dreamboard/app-sdk/reducer";
import {
  boardHelpers,
  records,
  type EdgeId,
} from "../shared/manifest-contract";
import { boardStatic } from "./board-static";
import {
  gameContract,
  type GameContract,
  type PortType,
  type Terrain,
} from "./game-contract";
import { phases } from "./phases";
import setupProfiles from "./setup-profiles";
import { playerView } from "./player-view";

// Standard Star Settlers terrain distribution (19 tiles)
const STAR_SETTLERS_TERRAINS = [
  "carbonCloud",
  "carbonCloud",
  "carbonCloud",
  "carbonCloud",
  "alloyField",
  "alloyField",
  "alloyField",
  "waterWorld",
  "waterWorld",
  "waterWorld",
  "waterWorld",
  "fiberGrove",
  "fiberGrove",
  "fiberGrove",
  "fiberGrove",
  "crystalBelt",
  "crystalBelt",
  "crystalBelt",
  "deadZone",
] as const satisfies readonly Exclude<Terrain, "deepSpace">[];

// Standard Star Settlers number tokens (18 tiles, one per non-deadZone hex)
const STAR_SETTLERS_TOKENS = [
  2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12,
];
const STAR_SETTLERS_PORT_TYPES: readonly PortType[] = [
  "alloy",
  "fiber",
  "crystal",
  "water",
  "carbon",
  "3:1",
  "3:1",
  "3:1",
  "3:1",
];
const PORT_SHUFFLE_SEED = 0x70a7;
const SECTOR = "sector" as const;
const SPACE_KINDS = boardHelpers.spaceKinds(SECTOR);

const HARBOR_EDGE_IDS: readonly EdgeId[] = boardHelpers
  .authoredHexEdges(SECTOR)
  .filter((edge) => edge.typeId === "relay")
  .sort((left, right) => {
    const leftIndex = left.fields.relayIndex ?? 0;
    const rightIndex = right.fields.relayIndex ?? 0;
    return leftIndex - rightIndex;
  })
  .map((edge) => boardHelpers.resolveHexEdgeId(SECTOR, edge.ref));

if (HARBOR_EDGE_IDS.length !== STAR_SETTLERS_PORT_TYPES.length) {
  throw new Error(
    `Expected ${STAR_SETTLERS_PORT_TYPES.length} relay slots, found ${HARBOR_EDGE_IDS.length}.`,
  );
}

// Deterministic Fisher-Yates shuffle using a linear congruential generator
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

const views = {
  player: playerView,
};

const game: ReducerGameDefinition<GameContract, typeof phases, typeof views> =
  defineGame({
    contract: gameContract,
    initial: {
      public: ({ playerIds, rngSeed }) => {
        // Per-player book-keeping used by derived helpers (fleet command,
        // hidden INF). Resources themselves live in `table.resources`, which
        // the SDK auto-seeds to zero from the manifest's `resourceIds`.
        const patrolsDeployed: Record<string, number> = {};
        const relicCacheCards: Record<string, number> = {};
        for (const pid of playerIds) {
          patrolsDeployed[pid] = 0;
          relicCacheCards[pid] = 0;
        }

        // Shuffle terrain, number tokens, and visible relay assignments using
        // the session seed. Relay locations are static manifest edge metadata;
        // the assigned port types are game state.
        const seed = rngSeed ?? 42;
        const shuffledTerrains = seededShuffle([...STAR_SETTLERS_TERRAINS], seed);
        const shuffledTokens = seededShuffle(
          [...STAR_SETTLERS_TOKENS],
          seed ^ 0xdeadbeef,
        );
        const shuffledPorts = seededShuffle(
          [...STAR_SETTLERS_PORT_TYPES],
          seed ^ PORT_SHUFFLE_SEED,
        );

        const numberTokenBySpaceId = records.spaceIds<number | null>(null);

        let terrainIdx = 0;
        let tokenIdx = 0;
        const terrainBySpaceId = records.spaceIds<Terrain>((spaceId) => {
          if (SPACE_KINDS[spaceId] === "deepSpace") {
            return "deepSpace";
          }
          const terrain = shuffledTerrains[terrainIdx];
          if (terrain === undefined) {
            throw new Error(
              `Missing shuffled terrain for land space '${spaceId}'. Expected ${STAR_SETTLERS_TERRAINS.length} terrain assignments.`,
            );
          }
          terrainIdx++;
          if (terrain === "deadZone") {
            numberTokenBySpaceId[spaceId] = null;
          } else {
            const numberToken = shuffledTokens[tokenIdx];
            if (numberToken === undefined) {
              throw new Error(
                `Missing shuffled number token for ${terrain} land space '${spaceId}'. Expected ${STAR_SETTLERS_TOKENS.length} number tokens.`,
              );
            }
            tokenIdx++;
            numberTokenBySpaceId[spaceId] = numberToken;
          }
          return terrain;
        });
        if (terrainIdx !== shuffledTerrains.length) {
          throw new Error(
            `Expected to assign all ${shuffledTerrains.length} shuffled terrains, assigned ${terrainIdx}.`,
          );
        }
        if (tokenIdx !== shuffledTokens.length) {
          throw new Error(
            `Expected to assign all ${shuffledTokens.length} shuffled number tokens, assigned ${tokenIdx}.`,
          );
        }
        const portsByEdgeId: Record<string, PortType> = {};
        for (let i = 0; i < HARBOR_EDGE_IDS.length; i++) {
          const edgeId = HARBOR_EDGE_IDS[i]!;
          const portType = shuffledPorts[i];
          if (!portType) {
            throw new Error(
              `Missing shuffled port type for relay edge '${edgeId}'.`,
            );
          }
          portsByEdgeId[edgeId] = portType;
        }

        return {
          terrainBySpaceId,
          numberTokenBySpaceId,
          portsByEdgeId,
          patrolsDeployed,
          relicCacheCards,
        };
      },
      private: () => ({}),
      hidden: () => ({}),
    },
    initialPhase: "setup",
    setupProfiles,
    phases,
    views,
    staticView: boardStatic,
  });

export default game;
