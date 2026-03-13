import type { PlayerId } from "@dreamboard/manifest";
import type { PhaseTrackingApi } from "./phaseHandlers";

export function createPhaseTrackingApi(
  expectedPlayers: PlayerId[],
  actedPlayers: PlayerId[],
): PhaseTrackingApi {
  const actedSet = new Set(actedPlayers);
  return {
    getExpectedPlayers: () => [...expectedPlayers],
    getPlayersWhoActed: () => [...actedPlayers],
    hasPlayerActed: (pid: PlayerId) => actedSet.has(pid),
    getPlayersStillWaiting: () =>
      expectedPlayers.filter((p) => !actedSet.has(p)),
    haveAllExpectedPlayersActed: () =>
      expectedPlayers.length > 0 &&
      expectedPlayers.every((p) => actedSet.has(p)),
  };
}
