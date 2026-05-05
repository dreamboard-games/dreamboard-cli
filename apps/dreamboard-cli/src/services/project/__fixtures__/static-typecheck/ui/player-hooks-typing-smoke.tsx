import type { PlayerId } from "@dreamboard/manifest-contract";
import {
  useActivePlayers,
  usePlayerInfo,
  usePlayerTurnOrder,
  usePluginSession,
} from "@dreamboard/ui-sdk";

export function PlayerHooksTypingSmoke() {
  const activePlayers = useActivePlayers();
  const turnOrder = usePlayerTurnOrder();
  const { controllingPlayerId, controllablePlayerIds } = usePluginSession();
  const players = usePlayerInfo();

  const activePlayerId: PlayerId | undefined = activePlayers[0];
  const turnOrderPlayerId: PlayerId | undefined = turnOrder[0];
  const controllablePlayerId: PlayerId | undefined = controllablePlayerIds[0];
  const controllingPlayerName =
    controllingPlayerId == null ? null : players.get(controllingPlayerId)?.name;

  void [
    activePlayerId,
    turnOrderPlayerId,
    controllablePlayerId,
    controllingPlayerName,
  ];

  return null;
}
