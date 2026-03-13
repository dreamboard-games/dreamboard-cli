import { useMemo } from "react";
import { usePluginSession } from "../context/PluginSessionContext.js";
import { useGameState } from "./useGameState.js";
import type { PlayerId, ResourceId } from "@dreamboard/manifest";

/**
 * Resource amounts for a player.
 * Keys are ResourceId types (game-specific), values are the amounts.
 */
export type PlayerResources = Record<ResourceId, number>;

/**
 * Hook to get the current player's resources.
 *
 * Returns a record of resource IDs to amounts for the player
 * currently being controlled by this user.
 *
 * @returns Record of resource amounts for the current player
 *
 * @example
 * ```tsx
 * const resources = useMyResources();
 * console.log(resources.brick); // 3
 * console.log(resources.wool);  // 2
 * ```
 */
export function useMyResources(): PlayerResources {
  const { controllingPlayerId } = usePluginSession();
  const gameState = useGameState();

  return useMemo(() => {
    if (!controllingPlayerId) {
      // Return empty resources if no player is being controlled
      return {} as PlayerResources;
    }

    const playerResources =
      gameState.playerResources[controllingPlayerId as PlayerId];

    if (!playerResources) {
      // Return empty resources if player has no resources yet
      return {} as PlayerResources;
    }

    return playerResources as PlayerResources;
  }, [controllingPlayerId, gameState.playerResources]);
}

/**
 * Hook to get a specific player's resources.
 *
 * @param playerId The player ID to get resources for
 * @returns Record of resource amounts for the specified player
 *
 * @example
 * ```tsx
 * const player1Resources = usePlayerResources('player-1');
 * console.log(player1Resources.grain); // 4
 * ```
 */
export function usePlayerResources(playerId: PlayerId): PlayerResources {
  const gameState = useGameState();

  return useMemo(() => {
    const playerResources = gameState.playerResources[playerId];

    if (!playerResources) {
      return {} as PlayerResources;
    }

    return playerResources as PlayerResources;
  }, [playerId, gameState.playerResources]);
}

/**
 * Hook to get all players' resources.
 *
 * @returns Record mapping player IDs to their resource amounts
 *
 * @example
 * ```tsx
 * const allResources = useAllPlayerResources();
 * console.log(allResources['player-1'].brick); // 2
 * console.log(allResources['player-2'].ore);   // 1
 * ```
 */
export function useAllPlayerResources(): Record<PlayerId, PlayerResources> {
  const gameState = useGameState();

  return useMemo(() => {
    return gameState.playerResources as Record<PlayerId, PlayerResources>;
  }, [gameState.playerResources]);
}
