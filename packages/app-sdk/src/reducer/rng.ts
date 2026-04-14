import type { RuntimeRngState } from "./model";

/**
 * Deterministic LCG-based random integer generator for reducer-native games.
 *
 * Returns a value in [0, bound) and an updated RNG state. The same seed +
 * cursor combination always produces the same output, enabling deterministic
 * replay of game sessions.
 */
export function nextRandomInt(
  bound: number,
  rng: RuntimeRngState,
): [number, RuntimeRngState] {
  if (bound <= 0) {
    throw new Error("Random bound must be positive.");
  }
  const seed = rng.seed ?? 1;
  const raw = (seed * 1103515245 + 12345 + rng.cursor) & 0x7fffffff;
  const value = raw % bound;
  return [
    value,
    {
      ...rng,
      cursor: rng.cursor + 1,
      trace: [
        ...rng.trace,
        `cursor=${rng.cursor};bound=${bound};value=${value}`,
      ],
    },
  ];
}
