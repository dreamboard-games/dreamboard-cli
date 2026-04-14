import type { ReducerRuntimeEffectForState } from "../model";

export function withKind<T extends { type: string }>(
  value: T,
): T & { kind: T["type"] } {
  return {
    ...value,
    kind: value.type,
  };
}

export function serializeWindowClosePolicy<T extends { type: string }>(
  policy: T,
) {
  return withKind(policy);
}

export function serializeEffect<State>(
  effect: ReducerRuntimeEffectForState<State>,
) {
  if (effect.type === "openWindow") {
    return withKind({
      ...effect,
      closePolicy: serializeWindowClosePolicy(
        effect.closePolicy ?? { type: "manual" as const },
      ),
    });
  }
  return withKind(effect);
}
