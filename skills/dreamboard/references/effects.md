# Effects

Use defineEffect and fx.effect for engine-side dice rolls and shared-zone shuffles.

Effects are engine-side cues. They are for runtime work the pure reducer should not perform itself, such as rolling a die or shuffling a shared zone.

Effects are authored with `defineEffect`, registered on a phase, and dispatched with `fx.effect`.

## Shuffle a shared zone

```ts
const shuffleDeck = defineEffect<GameContract>()({
  type: "shuffleSharedZone",
  id: "shuffle-deck",
});

export const shufflePhase = definePhase<GameContract>()({
  kind: "auto",
  state: z.object({}),
  initialState: () => ({}),
  effects: {
    shuffleDeck,
  },
  stages: {
    shuffle: definePhaseStage<GameContract, typeof phaseState>()({
      allow: [],
      onEnter({ state, accept, fx }) {
        return accept(state, [
          fx.effect(shuffleDeck, { zoneId: "draw" }),
          fx.transition("deal"),
        ]);
      },
    }),
  },
});
```

After the runtime shuffles the zone, later reducer code can deal deterministically from the top with `ops.dealCardsToPlayerZone`.

## Roll a die with a continuation

Use `reduce` on an effect when the reducer needs the engine result.

```ts
const rollProduction = defineEffect<GameContract>()({
  type: "rollDie",
  id: "roll-production",
  context: z.object({
    reason: z.string(),
  }),
  reduce({ state, input, accept, ops }) {
    return accept(
      pipe(
        state,
        ops.patchPublicState({
          lastRoll: input.response.value,
          lastRollReason: input.data.reason,
        }),
      ),
    );
  },
});
```

Dispatch it from a reducer callback:

```ts
return accept(state, [
  fx.effect(rollProduction, {
    dieId: "production-die",
    context: { reason: "turn-start" },
  }),
]);
```

The `context` is author data captured when the effect is queued. `input.response` is the engine result.

## Effects are not prompts

Use effects for engine work:

- `rollDie`
- `shuffleSharedZone`

Use [Interactions](./interactions.md) with `promptInput` for addressed player requests. Prompts are player submissions; effects are runtime instructions.

## Effects and rngInput

`rngInput.d6(2)` is different from `defineEffect({ type: "rollDie" })`.

| Primitive | Use when |
| --- | --- |
| `rngInput.*` | Randomness is sampled as part of one player interaction submit. |
| `defineEffect` + `fx.effect` | Randomness or shuffling should be queued as a runtime instruction, often from an auto phase or with a continuation. |

Prefer the simpler `rngInput.*` when the random value is only needed inside the same interaction's `reduce`.
