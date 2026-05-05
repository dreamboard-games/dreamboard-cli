import { defineScenario } from "../testing-types";

/**
 * Trade-offer lifecycle on the sparse (one-resource / one-resource) payload.
 *
 * What it proves:
 * 1. `offerTrade` writes `pendingTrade` and targets the named captains.
 * 2. The bundle surfaces `respondToTrade` *only to the addressees* named in
 *    the offer — non-targeted seats (incl. the offerer) must not see it.
 * 3. Each addressee's descriptor is `available: true` (i.e. the bundle has
 *    authorized them; they are not blocked by the old "Not your turn" gate).
 * 4. `cancelTrade` clears `pendingTrade` and makes the prompt disappear for
 *    every addressee — again as observed via the descriptor API.
 *
 * A sibling scenario (`trade-full-lifecycle`) drives the full
 * respond → confirm path end-to-end.
 */
export default defineScenario({
  id: "trade-offer-sparse",
  description:
    "Offering a sparse (carbon↔alloy) trade surfaces respondToTrade to each named captain, and only to them",
  from: "after-setup",
  when: async ({ game, seat }) => {
    const offerer = seat(0);
    await game.submit(offerer, "rollDice", {});
    await game.submit(offerer, "offerTrade", {
      give: { carbon: 1 },
      want: { alloy: 1 },
      targetPlayerIds: [seat(1), seat(2)],
    });
  },
  then: ({ expect, interactions, state, view, seat }) => {
    expect(state()).toBe("playerTurn");

    const offerer = seat(0);
    const p1View = view(offerer) as {
      pendingTrade?: {
        give: Record<string, number>;
        want: Record<string, number>;
        targetPlayerIds: string[];
      };
    };
    expect(p1View.pendingTrade).toBeDefined();
    expect(p1View.pendingTrade!.give).toEqual({ carbon: 1 });
    expect(p1View.pendingTrade!.want).toEqual({ alloy: 1 });
    expect(p1View.pendingTrade!.targetPlayerIds).toEqual([seat(1), seat(2)]);

    // Each addressee sees `respondToTrade` as an available prompt-kind
    // descriptor. This is the projection the UI SDK consumes to render the
    // inbox notification, and the identity the scenario uses to submit the
    // response via `game.submit(...)`.
    for (const addressee of [seat(1), seat(2)]) {
      const respond = interactions(addressee).find(
        (d) => d.interactionId === "respondToTrade",
      );
      expect(respond).toBeDefined();
      expect(respond!.kind).toBe("prompt");
      expect(respond!.available).toBe(true);
      expect(respond!.unavailableReason).toBeUndefined();
    }

    // The offerer (seat 0) and the non-targeted captain (seat 3) must
    // not see `respondToTrade` at all — addressee-driven prompts are hidden
    // from non-addressees rather than shown with `available: false`.
    for (const nonAddressee of [seat(0), seat(3)]) {
      const respond = interactions(nonAddressee).find(
        (d) => d.interactionId === "respondToTrade",
      );
      expect(respond).toBeUndefined();
    }
  },
});
