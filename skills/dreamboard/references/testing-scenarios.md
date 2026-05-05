# Scenarios

Define reducer-native test scenarios with actions, prompts, effects, and assertions.

A scenario starts from a generated base, submits reducer interactions, and
asserts the resulting phase, view, and interaction descriptors.

Scenarios live under `test/scenarios/*.scenario.ts`.

## Basic scenario

```ts
import { defineScenario } from "../testing-types";

export default defineScenario({
  id: "setup-place",
  description: "Seat 0 places a settlement and road during setup",
  from: "initial-turn",
  phase: "setup",
  when: async ({ game, seat }) => {
    await game.submit(seat(0), "placeSetupSettlement", {
      vertexId: "hex-vertex:-1,-1,2",
    });
    await game.submit(seat(0), "placeSetupRoad", {
      edgeId: "hex-edge:-1,-1,2::-2,-2,4",
    });
  },
  then: ({ expect, state, view, seat }) => {
    expect(state()).toBe("setup");
    expect(view(seat(0)).buildingsByVertexId["hex-vertex:-1,-1,2"]).toBeDefined();
  },
});
```

Fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | Yes | Unique scenario id. |
| `description` | No | Short human-readable summary. |
| `from` | Yes | Base id to start from. |
| `runners` | No | Defaults to `["reducer"]`. Public tests normally omit it. |
| `phase` | No | Expected phase after `when`. Also narrows `view` in `then` when possible. |
| `stage` | No | Expected stage after `when`, constrained by phase. |
| `when` | Yes | Async action flow. |
| `then` | Yes | Assertions. |

## Submit interactions

Use `game.submit(playerId, interactionId, params)`:

```ts
await game.submit(seat(1), "placeThingCard", {
  cardId: "a-diamond",
  ringId: "ring-1",
});
```

The `interactionId` is the generated interaction id, not the phase-qualified UI
key. Params are typed from the generated UI contract.

Prompts use the same submit path:

```ts
await game.submit(seat(0), "judgePlacement", {
  decision: "ring-1",
});
```

There is no separate prompt-response API in the current reducer-native test
contract. If a player can submit it, model it as an interaction.

## Phase and stage checks

Use `phase` when the scenario should end in a known phase:

```ts
export default defineScenario({
  id: "reject-non-knower-cannot-judge",
  from: "after-first-placement",
  phase: "judgeRings",
  when: async ({ game, seat, expect }) => {
    await expect(() =>
      game.submit(seat(1), "judgePlacement", { decision: "ring-1" }),
    ).toRejectWith({ errorCode: "prompt-not-owned" });
  },
  then: ({ state, expect }) => {
    expect(state()).toBe("judgeRings");
  },
});
```

The runner checks `phase` after `when` and before `then`. If the reducer reached
a different phase, the scenario fails before assertions run.

Use `stage` the same way for phase stages:

```ts
export default defineScenario({
  id: "main-stage-after-roll",
  from: "after-setup",
  phase: "playerTurn",
  stage: "main",
  when: async ({ game, seat }) => {
    await game.submit(seat(0), "rollDice");
  },
  then: ({ state, expect }) => {
    expect(state()).toBe("playerTurn");
  },
});
```

## Rejection scenarios

Illegal submissions should be tested directly:

```ts
await expect(() =>
  game.submit(seat(1), "placeThingCard", {
    cardId: "a-diamond",
    ringId: "ring-1",
  }),
).toRejectWith({ errorCode: "NOT_YOUR_TURN" });
```

Then assert the game remained in the expected state:

```ts
then: ({ state, interactions, expect, seat }) => {
  expect(state()).toBe("placeThing");
  expect(interactions(seat(1))).not.toHaveInteraction("judgePlacement");
};
```

## Scenario shape

Keep `when` focused on the action being exercised. Keep assertions in `then`.
If a setup flow is required by many scenarios, move it into a base.

Good scenario ids are stable and behavior-oriented:

- `smoke-initial-turn`
- `setup-place`
- `trade-full-lifecycle`
- `reject-out-of-turn-placement`
- `reject-non-knower-cannot-judge`

Avoid ids that describe implementation details or temporary bugs.
