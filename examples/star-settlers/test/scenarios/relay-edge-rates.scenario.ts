import { defineScenario } from "../testing-types";
import {
  boardHelpers,
  literals,
  type ResourceId,
} from "../../shared/manifest-contract";

const RELAY_EDGE_ID = boardHelpers.resolveHexEdgeId("sector", {
  spaces: ["h-2-11", "o-16"],
});
const RELAY_ENDPOINT_VERTEX_ID = "hex-vertex:2,5,-7";

function expectRatesForPort(
  expect: (actual: unknown) => {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
  },
  rates: Readonly<Record<ResourceId, number>>,
  portType: string,
) {
  if (portType === "3:1") {
    expect(rates).toEqual({
      alloy: 3,
      water: 3,
      carbon: 3,
      crystal: 3,
      fiber: 3,
    });
    return;
  }

  for (const resourceId of literals.resourceIds) {
    expect(rates[resourceId]).toBe(resourceId === portType ? 2 : 4);
  }
}

export default defineScenario({
  id: "relay-edge-rates",
  description:
    "Relay trades are granted by explicit relay edge endpoints, not nearby deepSpace vertices",
  from: "initial-turn",
  when: async ({ game, seat }) => {
    await game.submit(seat(0), "placeSetupOutpost", {
      vertexId: RELAY_ENDPOINT_VERTEX_ID,
    });
  },
  then: ({ expect, view, seat }) => {
    const playerView = view(seat(0));
    const portType = playerView.portsByEdgeId[RELAY_EDGE_ID];
    expect(portType != null).toBe(true);
    expectRatesForPort(expect, playerView.myBankTradeRates, portType!);
  },
});
