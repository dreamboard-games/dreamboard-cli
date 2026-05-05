# Runtime assertions

Use generated scenario context helpers and matchers.

`defineScenario` callbacks receive a typed context. Use that context to submit
interactions, read projected views, inspect interaction descriptors, and assert
behavior.

## Context helpers

| Helper | Available in | Meaning |
| --- | --- | --- |
| `game.start()` | Base setup, `when`, `then` | Starts the game. Usually handled by the harness before scenario setup. |
| `game.submit(playerId, interactionId, params?)` | Base setup, `when`, `then` | Validates and dispatches an interaction. |
| `players()` | Base setup, `when`, `then` | Ordered player ids for the current base. |
| `seat(index)` | Base setup, `when`, `then` | Player id at a seat index; throws when out of range. |
| `state()` | `when`, `then` | Current phase name. |
| `view(playerId)` | `when`, `then` | Reducer-projected `GameView` for a player. |
| `interactions(playerId)` | `when`, `then` | Current interaction descriptors for a player. |
| `expect(value)` | `when`, `then` | Built-in assertion API. |

`state()` is the phase name, not the raw reducer state. Assert game-specific
state through `view(playerId)` or through projected descriptors.

## View assertions

Use `view(playerId)` for player-facing state:

```ts
then: ({ view, expect, seat }) => {
  const p1View = view(seat(0));
  expect(p1View.resources.brick).toBe(2);
  expect(p1View.pathsByEdgeId["edge-a"]).toBeDefined();
};
```

When a scenario declares `phase`, generated types narrow `view` in `then` when
the workspace view has phase-tagged variants.

## Interaction assertions

Use `interactions(playerId)` to check what the UI would be allowed to render:

```ts
then: ({ interactions, expect, seat }) => {
  expect(interactions(seat(0))).toHaveInteraction("judgePlacement", {
    kind: "prompt",
    surface: "inbox",
  });

  expect(interactions(seat(1))).not.toHaveInteraction("judgePlacement");
};
```

Descriptor matchers are better than ad hoc descriptor shape checks because they
state the rule being tested: present, absent, active, or gated.

## Matchers

Value matchers:

| Matcher | Purpose |
| --- | --- |
| `toBe(expected)` | Strict equality. |
| `toEqual(expected)` | Deep equality. |
| `toMatchObject(partial)` | Deep partial object match. |
| `toBeDefined()` | Value is not `undefined`. |
| `toBeUndefined()` | Value is `undefined`. |
| `toBeNull()` | Value is `null`. |
| `toContain(expected)` | Array or string contains value. |
| `toContainEqual(expected)` | Array contains a deeply equal value. |
| `toHaveLength(n)` | Value has exact `length`. |
| `toBeGreaterThanOrEqual(n)` | Numeric lower-bound check. |
| `toThrow(predicate?)` | Synchronous throw assertion. |
| `toMatchSnapshot(filename?)` | Scenario snapshot assertion. |

Async rejection matcher:

```ts
await expect(() =>
  game.submit(seat(1), "judgePlacement", { decision: "ring-1" }),
).toRejectWith({
  errorCode: "prompt-not-owned",
  message: /prompt/i,
});
```

Descriptor matchers:

| Matcher | Purpose |
| --- | --- |
| `toHaveInteraction(id, opts?)` | Descriptor array contains an interaction. |
| `not.toHaveInteraction(id)` | Descriptor array does not contain an interaction. |
| `toBeGatedBy(reason, opts?)` | Descriptor is unavailable with the expected reason. |
| `toBeActiveFor(playerId, opts?)` | Descriptor targets the player and is available. |

`toBeGatedBy` and `toBeActiveFor` can operate on a descriptor array when you pass
`opts.interactionId`, or on a single descriptor.

## Snapshot assertions

Use snapshots for large projected objects that are intentionally stable:

```ts
then: ({ view, expect, seat }) => {
  expect(view(seat(0)).market).toMatchSnapshot("market");
};
```

Snapshots are written under `test/generated/snapshots/`. When an existing
snapshot differs, the runner fails and tells you to rerun with
`--update-snapshots`.

Do not snapshot noisy values unless the noise is the point of the test. Prefer
targeted matchers for a specific rule.

## Assertion guidelines

- Assert public behavior: phase, view, available interactions, and rejection
  codes.
- Do not assert raw reducer internals unless the view intentionally exposes the
  same fact.
- Use descriptor matchers for actor, prompt, and availability rules.
- Use `toRejectWith` for validation and reducer rejection paths.
- Keep the assertion close to the rule the scenario name promises.
