import { defineScenario } from "../testing-types";

const SAME_DEEP_SPACE_NON_ENDPOINT_VERTEX_ID = "hex-vertex:1,7,-8";

export default defineScenario({
  id: "relay-nearby-vertex-no-rate",
  description:
    "An outpost near a relay deepSpace tile but off the relay edge does not get a port rate",
  from: "initial-turn",
  when: async ({ game, seat }) => {
    await game.submit(seat(0), "placeSetupOutpost", {
      vertexId: SAME_DEEP_SPACE_NON_ENDPOINT_VERTEX_ID,
    });
  },
  then: ({ expect, view, seat }) => {
    expect(view(seat(0)).myBankTradeRates).toEqual({
      alloy: 4,
      water: 4,
      carbon: 4,
      crystal: 4,
      fiber: 4,
    });
  },
});
