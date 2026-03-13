import { useMemo } from "react";
import { PlayerId } from "@dreamboard/manifest";
import { useLobby } from "./useLobby.js";
import type { Player } from "./useMe.js";

export function usePlayerInfo(): Map<PlayerId, Player> {
  const lobby = useLobby();

  return useMemo(() => {
    if (!lobby) {
      return new Map();
    }

    const playerMap = new Map<PlayerId, Player>();

    for (const seat of lobby.seats) {
      const playerId = seat.playerId as PlayerId;
      playerMap.set(playerId, {
        playerId,
        name: seat.displayName,
        isHost: seat.isHost,
        color: seat.playerColor,
      });
    }

    return playerMap;
  }, [lobby]);
}
