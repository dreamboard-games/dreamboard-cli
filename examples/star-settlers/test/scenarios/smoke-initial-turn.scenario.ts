import { defineScenario } from "../testing-types";

export default defineScenario({
  id: "smoke-initial-turn",
  description:
    "Sanity check that the Star Settlers workspace boots into its initial phase.",
  from: "initial-turn",
  when: async () => undefined,
  then: ({ expect, players, interactions, state }) => {
    const playerIds = players();
    expect(playerIds.length).toBeGreaterThanOrEqual(1);
    expect(state()).toBe("setup");
    for (const playerId of playerIds) {
      // No inbox-surfaced prompt-kind interactions should be pending for
      // any seat at the opening of setup.
      expect(
        interactions(playerId).filter((d) => d.surface === "inbox"),
      ).toEqual([]);
    }
  },
});
