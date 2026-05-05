# Bases

Define reusable starting states for scenario tests.

A base is a deterministic starting state for scenarios. It chooses the seed,
player count, optional setup profile, and setup actions that produce a reusable
checkpoint.

Bases live under `test/bases/*.base.ts` and are generated into
`test/generated/base-states.generated.ts` by `dreamboard test generate`.

## Basic base

```ts
import { defineBase } from "../testing-types";

export default defineBase({
  id: "initial-turn",
  seed: 1337,
  players: 4,
  setup: async () => undefined,
});
```

Fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | Yes | Stable base id used by scenarios. |
| `seed` | Yes unless inherited | Reducer seed for deterministic randomness. |
| `players` | Yes unless inherited | Number of seats in the generated base. |
| `setupProfileId` | No | Manifest setup profile to use before setup actions. |
| `extends` | No | Parent base id to hydrate before this setup runs. |
| `setup` | Yes | Async function that prepares the checkpoint. |

A base without `extends` must declare both `seed` and `players`.

## Setup actions

Use `game.submit` with generated interaction ids and typed params:

```ts
export default defineBase({
  id: "after-first-placement",
  extends: "initial-turn",
  setup: async ({ game, seat }) => {
    await game.submit(seat(1), "placeThingCard", {
      cardId: "a-diamond",
      ringId: "ring-1",
    });
  },
});
```

`game.submit` runs the same validation and reducer dispatch path as a scenario
action. If setup fails, generation fails.

## Seat helpers

Use `seat(index)` for stable player references:

```ts
const firstPlayer = seat(0);
const secondPlayer = seat(1);
```

`seat(index)` throws if the base has fewer players than requested. Prefer it to
literal ids because player id literals are generated from the workspace
manifest and player count.

## Setup profiles

Use `setupProfileId` when the manifest has named setup profiles:

```ts
export default defineBase({
  id: "standard-opening",
  seed: 2026,
  players: 4,
  setupProfileId: "standard",
  setup: async () => undefined,
});
```

When a base extends another base, the setup profile is inherited unless the
child declares one. A child base cannot change the effective seed, player count,
or setup profile from its generated parent artifact. If it does, the fingerprint
check fails and you should model that as a separate root base.

## Inherited bases

Use `extends` to avoid rebuilding expensive checkpoints in every scenario:

```ts
export default defineBase({
  id: "after-setup",
  seed: 1337,
  players: 4,
  setup: async ({ game, seat }) => {
    for (const step of SETUP_ORDER) {
      await game.submit(seat(step.seat), "placeSetupMarker", {
        vertexId: step.vertex,
      });
      await game.submit(seat(step.seat), "placeSetupPath", {
        edgeId: step.edge,
      });
    }
  },
});
```

```ts
export default defineBase({
  id: "pending-trade",
  extends: "after-setup",
  setup: async ({ game, seat }) => {
    await game.submit(seat(0), "rollDice");
    await game.submit(seat(0), "offerTrade", {
      targetPlayerId: seat(1),
      give: { brick: 1 },
      receive: { wool: 1 },
    });
  },
});
```

Generation hydrates the parent snapshot, runs the child setup, and fingerprints
the parent. If the parent changes, children become stale and must be
regenerated.

## What belongs in a base

Good base setup:

- opening state
- post-setup state
- pending prompt state shared by several scenarios
- late-game state that would be noisy to replay inline

Poor base setup:

- a one-off action used by only one scenario
- assertions
- full playthroughs that hide the rule being tested
- local mutation of generated state files

Assertions belong in scenarios. Bases create state; scenarios prove behavior.
