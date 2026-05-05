# Derived values

Use defineDerived for reusable, memoized pure computations over reducer state and table queries.

Derived values are pure computations over one state snapshot. They are useful for expensive or repeated calculations: longest route, area majority, winner selection, eligible scoring sets, or aggregate card/resource summaries.

```ts
export const winnerOf = defineDerived<GameContract>()({
  name: "winnerOf",
  compute: ({ state, q }) => {
    const players = q.player.order();
    const scores = players.map((playerId) => ({
      playerId,
      score: state.publicState.scores[playerId] ?? 0,
    }));
    return scores.toSorted((a, b) => b.score - a.score)[0]?.playerId ?? null;
  },
});
```

Read it from reducer callbacks or views through injected `derived`:

```ts
reduce({ state, derived, accept, ops }) {
  const winnerPlayerId = derived(winnerOf);
  return accept(pipe(state, ops.patchPublicState({ winnerPlayerId })));
}
```

## Cache lifetime

Derived values are memoized by definition identity for one state snapshot. Each engine tick and each view projection gets a fresh resolver.

That means:

- repeated reads of the same derived value in one callback are cheap
- derived values should be pure
- cache lifetime does not cross reducer steps
- derived values can depend on other derived values through `derived(...)`

Cyclic derived dependencies throw a readable error.

## Do not cache mirrors in publicState

Avoid this pattern:

```ts
publicState: {
  scoreByPlayerId: ...
}
```

if the value can be recomputed from board occupancy, card locations, resources, or other source facts. Store the source facts and derive the aggregate.

Use state for mutable facts. Use `defineDerived` for computed meaning.
