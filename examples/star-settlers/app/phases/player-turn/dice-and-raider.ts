import { z } from "zod";
import {
  boardInput,
  defineInteraction,
  rngInput,
  pipe,
} from "@dreamboard/app-sdk/reducer";
import {
  countsByIdSchema,
  playerTurnPhaseStateSchema,
  type GameContract,
  type GameState,
} from "../../game-contract";
import {
  TERRAIN_RESOURCE,
  coloniesByVertexId,
  raiderSpaceId,
  type Ops,
  type Q,
} from "../../reducer-support";
import { raiderSpaceTarget } from "../../eligibility";
import {
  literals,
  type PlayerId,
  type SpaceId,
} from "../../../shared/manifest-contract";
import {
  ownedResourceMapDomain,
  raiderSeizeTargetInput,
  toRaiderSeizePlayerId,
} from "./inputs";

// Exported param schema used by unit tests and shared with the interaction
// `inputs` declaration.
export const discardCardsParamsSchema = z.object({
  toDiscard: countsByIdSchema,
});

// ── Roll Dice ────────────────────────────────────────────────────────────────
// Engine-authoritative dice: `rngInput.d6(2)` samples both dice on submit
// inside the trusted reducer bundle, so clients cannot influence the roll.
// The resulting `values` flows into `input.params.dice.values`.

export const rollDice = defineInteraction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  surface: "panel",
  label: "Roll dice",
  step: "roll",
  emphasis: "primary",
  icon: "🎲",
  visibility: "all",
  presentation: {
    mode: "dialog",
    dialog: {
      title: "Roll dice",
      description: "Roll to start your turn.",
      dismissBehavior: { type: "none" },
    },
  },
  inputs: {
    dice: rngInput.d6(2),
  },
  // Actor authorization (NOT_YOUR_TURN) is enforced by the bundle — no
  // per-interaction `state.flow.activePlayers.includes(...)` check needed.
  // `validate` stays focused on the interaction's own business rules.
  validate({ state }) {
    if (state.phase.diceRolled) {
      return {
        errorCode: "ALREADY_ROLLED",
        message: "Already rolled this turn.",
      };
    }
    return null;
  },
  reduce({ state, input, accept, ops, q }) {
    const [d1, d2] = input.params.dice.values;
    const diceValues: [number, number] = [d1!, d2!];
    const sum = diceValues[0] + diceValues[1];

    if (sum === 7) {
      const discardPending: PlayerId[] = [];
      for (const pid of q.player.order()) {
        if (q.player.resourceTotal(pid) > 7) discardPending.push(pid);
      }
      return accept(
        pipe(
          state,
          ops.patchPhaseState({
            diceRolled: true,
            diceValues,
            step: discardPending.length > 0 ? "discard" : "raider",
            raiderPending: true,
            discardPending,
          }),
        ),
      );
    }

    // Resource production: each land tile whose number token matches the
    // dice sum (and is not blocked by the raider) yields one resource per
    // outpost and two per hub on its incident vertices.
    const grantOps: Array<ReturnType<typeof ops.addResources>> = [];
    const raiderSpace = raiderSpaceId(q);
    const buildings = coloniesByVertexId(state, q);
    for (const spaceId of literals.spaceIds) {
      if (spaceId === raiderSpace) continue;
      const terrain = state.publicState.terrainBySpaceId[spaceId];
      const numberToken =
        state.publicState.numberTokenBySpaceId[spaceId] ?? null;
      if (numberToken !== sum) continue;
      const resource = terrain ? TERRAIN_RESOURCE[terrain] : null;
      if (!resource) continue;

      for (const vertexId of q.board.spaceVertices("sector", spaceId)) {
        const building = buildings[vertexId];
        if (!building) continue;
        const amount = building.kind === "hub" ? 2 : 1;
        grantOps.push(
          ops.addResources({
            playerId: building.ownerId,
            amounts: { [resource]: amount },
          }),
        );
      }
    }

    return accept(
      pipe(
        state,
        ops.patchPhaseState({ step: "main", diceRolled: true, diceValues }),
        ...grantOps,
      ),
    );
  },
});

// ── Discard ──────────────────────────────────────────────────────────────────

export const discardCards = defineInteraction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  // Surfaced as "blocker" so the default `<GameShell>` mounts it as a
  // modal overlay the moment the raider forces a discard, preempting
  // every normal panel action until the player submits.
  surface: "blocker",
  label: "Discard",
  step: "discard",
  inputs: {
    toDiscard: ownedResourceMapDomain(),
  },
  // Addressee-authorized. The `to` selector lets every listed seat submit
  // regardless of whose turn it is, which models an after-7 forced discard
  // without special active-player handling.
  to: ({ state }) => state.phase.discardPending,
  validate({ state, input, q }) {
    if (!state.phase.discardPending.includes(input.playerId)) {
      return {
        errorCode: "NOT_REQUIRED_TO_DISCARD",
        message: "You don't need to discard.",
      };
    }
    const required = Math.floor(q.player.resourceTotal(input.playerId) / 2);
    const given = Object.values(input.params.toDiscard).reduce<number>(
      (a, b) => a + (b ?? 0),
      0,
    );
    if (given !== required) {
      return {
        errorCode: "WRONG_DISCARD_COUNT",
        message: `Must discard exactly ${required} cards.`,
      };
    }
    if (!q.player.canAfford(input.playerId, input.params.toDiscard)) {
      const missing = q.player.missingResources(
        input.playerId,
        input.params.toDiscard,
      );
      const [res] = Object.keys(missing);
      return {
        errorCode: "INSUFFICIENT_RESOURCES",
        message: `Not enough ${res ?? "resources"}.`,
      };
    }
    return null;
  },
  reduce({ state, input, accept, ops }) {
    const discardPending = state.phase.discardPending.filter(
      (p) => p !== input.playerId,
    );
    return accept(
      pipe(
        state,
        ops.spendResources({
          playerId: input.playerId,
          amounts: input.params.toDiscard,
        }),
        ops.patchPhaseState({
          step: discardPending.length === 0 ? "raider" : "discard",
          discardPending,
        }),
      ),
    );
  },
});

// ── Move Raider ──────────────────────────────────────────────────────────────

export const moveRaider = defineInteraction<
  GameContract,
  typeof playerTurnPhaseStateSchema
>()({
  surface: "board-space",
  label: "Move raider",
  step: "raider",
  inputs: {
    spaceId: boardInput.space<GameState, SpaceId>({
      target: raiderSpaceTarget,
    }),
    stealFromPlayerId: raiderSeizeTargetInput(),
  },
  validate({ state, input }) {
    if (!state.phase.raiderPending) {
      return {
        errorCode: "ROBBER_NOT_PENDING",
        message: "No raider move required.",
      };
    }
    if (state.phase.discardPending.length > 0) {
      return {
        errorCode: "WAITING_FOR_DISCARDS",
        message: "Waiting for discards.",
      };
    }
    return null;
  },
  reduce({ state, input, accept, ops, q }) {
    return accept(
      pipe(
        state,
        ...stealOneCardOp(
          ops,
          q,
          toRaiderSeizePlayerId(input.params.stealFromPlayerId),
          input.playerId,
        ),
        ops.moveComponentToSpace({
          componentId: "raider",
          boardId: "sector",
          spaceId: input.params.spaceId,
        }),
        ops.patchPhaseState({ step: "main", raiderPending: false }),
      ),
    );
  },
});

/**
 * Build the transfer op for Star Settlers simplified steal rule. The real board
 * game steals a random card; this fixture chooses the first available
 * resource in manifest order so reducer tests stay deterministic. Returns an
 * empty array when the victim has no resources (still a legal move — it just
 * yields no seize).
 */
export function stealOneCardOp(
  ops: Ops,
  q: Q,
  victim: PlayerId | null,
  thief: PlayerId,
): ReadonlyArray<ReturnType<Ops["transferResources"]>> {
  if (!victim) return [];
  const victimResources = q.player.resources(victim);
  const stolen = literals.resourceIds.find(
    (resourceId) => (victimResources[resourceId] ?? 0) > 0,
  );
  if (!stolen) return [];
  return [
    ops.transferResources({
      fromPlayerId: victim,
      toPlayerId: thief,
      amounts: { [stolen]: 1 },
    }),
  ];
}
