import { defineScenario } from "../testing-types";

type ResourceId = "alloy" | "water" | "carbon" | "crystal" | "fiber";
type ResourceCounts = Record<ResourceId, number>;

const RESOURCES = ["alloy", "water", "carbon", "crystal", "fiber"] as const;
const TECH_CARD_COST: ResourceCounts = {
  alloy: 0,
  water: 1,
  carbon: 0,
  crystal: 1,
  fiber: 1,
};
const ROBBER_TARGET_SPACE_ID = "h-0-0";

function canAffordTechCard(resources: ResourceCounts): boolean {
  return RESOURCES.every(
    (resource) => resources[resource] >= TECH_CARD_COST[resource],
  );
}

function missingTechCardResource(resources: ResourceCounts): ResourceId | null {
  return (
    RESOURCES.find(
      (resource) => resources[resource] < TECH_CARD_COST[resource],
    ) ?? null
  );
}

function bankTradeGiveResource(
  resources: ResourceCounts,
  bankRates: Readonly<Record<ResourceId, number>>,
): ResourceId | null {
  return (
    RESOURCES.find((resource) => {
      const rate = bankRates[resource];
      const keepForTechCard = TECH_CARD_COST[resource];
      return resources[resource] - keepForTechCard >= rate;
    }) ?? null
  );
}

function discardPayload(
  resources: ResourceCounts,
  required: number,
): Partial<ResourceCounts> {
  const toDiscard: Partial<ResourceCounts> = {};
  let remaining = required;

  for (const resource of RESOURCES) {
    if (remaining === 0) break;
    const amount = Math.min(resources[resource], remaining);
    if (amount > 0) {
      toDiscard[resource] = amount;
      remaining -= amount;
    }
  }

  return toDiscard;
}

export default defineScenario({
  id: "buy-tech-card",
  description:
    "Materializes a live state immediately after the active player buys a tech card",
  from: "after-setup",
  when: async ({ game, view, seat }) => {
    const seats = [seat(0), seat(1), seat(2), seat(3)] as const;

    for (let turn = 0; turn < 80; turn++) {
      const playerId = seats[turn % seats.length];

      await game.submit(playerId, "rollDice", {});

      const rolledView = view(playerId) as {
        diceValues: readonly [number, number] | null;
        raiderSpaceId: string;
      };
      const diceSum =
        rolledView.diceValues?.[0] != null && rolledView.diceValues?.[1] != null
          ? rolledView.diceValues[0] + rolledView.diceValues[1]
          : null;

      if (diceSum === 7) {
        for (const discardPlayerId of seats) {
          const discardView = view(discardPlayerId) as {
            myDiscardRequired: number;
            myResources: ResourceCounts;
          };
          if (discardView.myDiscardRequired > 0) {
            await game.submit(discardPlayerId, "discardCards", {
              toDiscard: discardPayload(
                discardView.myResources,
                discardView.myDiscardRequired,
              ),
            });
          }
        }

        await game.submit(playerId, "moveRaider", {
          spaceId:
            rolledView.raiderSpaceId === ROBBER_TARGET_SPACE_ID
              ? "h-1-0"
              : ROBBER_TARGET_SPACE_ID,
          stealFromPlayerId: "__none",
        });
      }

      for (let trade = 0; trade < 3; trade++) {
        const currentView = view(playerId) as {
          myResources: ResourceCounts;
          myBankTradeRates: Readonly<Record<ResourceId, number>>;
        };
        if (canAffordTechCard(currentView.myResources)) {
          break;
        }

        const receiveResource = missingTechCardResource(currentView.myResources);
        const giveResource = bankTradeGiveResource(
          currentView.myResources,
          currentView.myBankTradeRates,
        );
        if (!receiveResource || !giveResource) {
          break;
        }

        await game.submit(playerId, "tradeWithBank", {
          giveResource,
          receiveResource,
        });
      }

      const currentView = view(playerId) as { myResources: ResourceCounts };
      if (canAffordTechCard(currentView.myResources)) {
        await game.submit(playerId, "buyTechCard", {});
        return;
      }

      await game.submit(playerId, "endTurn", {});
    }

    throw new Error(
      "Unable to reach a tech-card purchase within 80 turns.",
    );
  },
  then: ({ expect, state, view, seat }) => {
    expect(state()).toBe("playerTurn");

    const seats = [seat(0), seat(1), seat(2), seat(3)] as const;
    const buyerView = seats
      .map(
        (playerId) =>
          view(playerId) as {
            myTechCardCount: number;
            myTechCardIds: readonly string[];
          },
      )
      .find((playerView) => playerView.myTechCardCount > 0);

    expect(buyerView).toBeDefined();
    expect(buyerView!.myTechCardCount).toBe(1);
    expect(buyerView!.myTechCardIds.length).toBe(1);
  },
});
