import { defineScenario } from "../testing-types";

/**
 * Cross-cutting authorization regression. Enumerates every phase-kind
 * interaction surfaced by the SDK bundle and asserts the descriptor-level
 * authorization invariants every SDK game relies on.
 *
 * What this covers:
 *
 * 1. "Interactions WITHOUT a `to` selector are gated by active-player."
 *    In the `playerTurn` phase the only active player is seat 0. So for
 *    every non-active seat and every non-addressee-driven interaction
 *    (e.g. `rollDice`, `endTurn`, `offerTrade`), the descriptor must have
 *    `available: false` with `unavailableReason === "Not your turn"`.
 *
 * 2. "Interactions WITH a `to` selector are addressee-driven and hidden
 *    from non-addressees." Both prompt-kind (`respondToTrade`) and
 *    action-kind (`discardCards`) work this way: the descriptor list of
 *    a non-addressee must NOT include them. For `respondToTrade` this is
 *    how the trade inbox avoids false positives; for `discardCards` it's
 *    how the forced-discard blocker stays scoped to the seats that must
 *    discard. Before the unification these two paths disagreed — only
 *    prompt-kind was suppressed, action-kind leaked to non-addressees
 *    with a misleading "Not your turn" reason.
 *
 * 3. "An offer opens the prompt; closing it re-hides it." Before the
 *    offer NO seat sees `respondToTrade` (`to` resolves to empty). After
 *    the offer the descriptor appears for exactly the named addressees
 *    with `available: true` (this is the NOT_YOUR_TURN bug the SDK fix
 *    addressed). A companion scenario, `trade-full-lifecycle`, confirms
 *    the descriptor disappears again once `pendingTrade` clears.
 */
export default defineScenario({
  id: "every-action-authorization",
  description:
    "Every phase interaction's descriptor reports the correct authorization for each seat",
  from: "after-setup",
  when: async ({ game, view, seat }) => {
    const offerer = seat(0);
    await game.submit(offerer, "rollDice", {});

    // Offer a trade we know is feasible at this seed — probing resources
    // dynamically in case setup grants change in the future.
    const p1Resources = (
      view(offerer) as { myResources: Record<string, number> }
    ).myResources;
    const giveResource = Object.entries(p1Resources).find(
      ([, count]) => count > 0,
    )?.[0];
    if (!giveResource) {
      throw new Error(
        "after-setup did not grant seat 0 any resources; cannot exercise trade authorization.",
      );
    }

    await game.submit(offerer, "offerTrade", {
      give: { [giveResource]: 1 },
      want: { alloy: 1 },
      targetPlayerIds: [seat(1), seat(2)],
    });
  },
  then: ({ expect, interactions, seat }) => {
    const allSeats = [seat(0), seat(1), seat(2), seat(3)] as const;
    const activePlayer = seat(0);
    const addressees = new Set<string>([seat(1), seat(2)]);

    // Walk every descriptor for every seat and cross-check the expected
    // authorization decision.
    //
    // Terminology (authored in `@dreamboard/app-sdk`):
    //   - "active-player gated" — no `to` selector. Gated by the current
    //     turn's active player. Non-active players see the descriptor
    //     marked `available: false, unavailableReason: "Not your turn"`.
    //   - "addressee-driven" — has a `to` selector, regardless of `kind`.
    //     Only the addressees see the descriptor at all. Non-addressees
    //     (INCL. the active player, if they are not in the addressee
    //     set) see nothing. In this scenario `respondToTrade` is
    //     addressee-driven with `{seat1, seat2}` as addressees.
    //     `discardCards` is also addressee-driven but its addressee set
    //     is empty (no one rolled a 7), so it is hidden from everyone.
    for (const currentSeat of allSeats) {
      const descriptors = interactions(currentSeat);

      for (const descriptor of descriptors) {
        if (descriptor.interactionId === "respondToTrade") {
          // Addressee-driven prompt: visible ONLY to seats 1 and 2, with
          // `available: true`.
          expect(descriptor.kind).toBe("prompt");
          expect(addressees.has(currentSeat)).toBe(true);
          expect(descriptor.available).toBe(true);
          continue;
        }

        if (descriptor.interactionId === "discardCards") {
          // Addressee-driven action with an empty addressee set — the
          // descriptor must be suppressed for every seat. If we see one
          // the closed-prompt fix has regressed.
          throw new Error(
            `Seat ${currentSeat} received a discardCards descriptor but no one needs to discard — ` +
              `addressee-driven interactions with an empty \`to:\` set must be hidden.`,
          );
        }

        // Everything else is active-player gated (no `to` selector).
        // The active seat may or may not be available depending on the
        // author's `available` predicate, but it must never be gated by
        // "Not your turn". Non-active seats must be uniformly blocked
        // by "Not your turn".
        expect(descriptor.kind).toBe("action");
        if (currentSeat === activePlayer) {
          if (
            descriptor.available === false &&
            descriptor.unavailableReason === "Not your turn"
          ) {
            throw new Error(
              `Active player ${currentSeat} sees ${descriptor.interactionId} gated by "Not your turn" — ` +
                `active-player-gated interactions must never block the active player.`,
            );
          }
        } else {
          expect(descriptor.available).toBe(false);
          expect(descriptor.unavailableReason).toBe("Not your turn");
        }
      }

      // Coverage check: addressees see `respondToTrade`, non-addressees
      // do NOT see it. Symmetric to the per-descriptor walk above — the
      // two together lock down the descriptor set as a whole.
      const respond = descriptors.find(
        (d) => d.interactionId === "respondToTrade",
      );
      if (addressees.has(currentSeat)) {
        expect(respond).toBeDefined();
      } else {
        expect(respond).toBeUndefined();
      }

      // Coverage check: `discardCards` is addressee-driven via
      // `to: state.phase.discardPending`, and at this snapshot nobody
      // has rolled a 7, so the selector resolves to `[]`. Every seat —
      // including the active player — must have it hidden.
      const discard = descriptors.find(
        (d) => d.interactionId === "discardCards",
      );
      expect(discard).toBeUndefined();
    }

    const activeDescriptors = interactions(activePlayer);
    const offerTrade = activeDescriptors.find(
      (d) => d.interactionId === "offerTrade",
    );
    expect(
      offerTrade?.inputs.find((input) => input.key === "targetPlayerIds")
        ?.domain.type,
    ).toBe("choiceList");

    const confirmTrade = activeDescriptors.find(
      (d) => d.interactionId === "confirmTrade",
    );
    expect(
      confirmTrade?.inputs.find((input) => input.key === "partnerId")?.domain
        .type,
    ).toBe("choice");
  },
});
