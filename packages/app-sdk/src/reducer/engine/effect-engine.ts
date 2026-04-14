/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReducerRuntimeEffectForState } from "../model";
import type {
  DispatchTraceEntry,
  TrustedReducerDispatchResult,
  TrustedRuntimeInput,
} from "../core/types";

export function createReducerEffectEngine<
  State,
  PlayerId extends string,
  Input extends TrustedRuntimeInput<PlayerId>,
>({
  reduce,
  applyEffect,
  afterInput,
}: {
  reduce: (
    state: State,
    input: Input,
  ) =>
    | { type: "reject"; errorCode: string; message?: string }
    | {
        type: "accept";
        state: State;
        effects?: ReducerRuntimeEffectForState<State>[];
      };
  applyEffect: (
    state: State,
    effect: ReducerRuntimeEffectForState<State>,
  ) => {
    state: State;
    queuedInputs: Input[];
    queuedEffects: ReducerRuntimeEffectForState<State>[];
    trace: DispatchTraceEntry<State, PlayerId, Input>[];
  };
  afterInput?: (
    state: State,
    input: Input,
  ) => {
    state: State;
    trace: DispatchTraceEntry<State, PlayerId, Input>[];
  };
}) {
  function drainEffects(
    state: State,
    effectsToDrain: ReducerRuntimeEffectForState<State>[],
  ): State {
    let workingState = state;
    const effectQueue = [...effectsToDrain];
    const systemQueue: Input[] = [];

    while (effectQueue.length > 0 || systemQueue.length > 0) {
      while (effectQueue.length > 0) {
        const effect = effectQueue.shift()!;
        const applied = applyEffect(workingState, effect);
        workingState = applied.state;
        if (applied.queuedEffects.length > 0) {
          effectQueue.unshift(...applied.queuedEffects);
        }
        systemQueue.push(...applied.queuedInputs);
      }

      while (systemQueue.length > 0) {
        const input = systemQueue.shift()!;
        const result = reduce(workingState, input);
        if (result.type === "reject") {
          throw new Error(
            result.message ??
              `Reducer rejected internal input '${input.kind}'.`,
          );
        }
        workingState = result.state;
        effectQueue.push(...(result.effects ?? []));
      }
    }

    return workingState;
  }

  function dispatch(
    state: State,
    input: Input,
  ): TrustedReducerDispatchResult<State, PlayerId> {
    let workingState = state;
    const pendingInputs: Input[] = [input];
    const trace: DispatchTraceEntry<State, PlayerId, Input>[] = [
      {
        type: "acceptedClientInput",
        input,
      },
    ];

    while (pendingInputs.length > 0) {
      const pendingInput = pendingInputs.shift()!;
      const result = reduce(workingState, pendingInput);
      if (result.type === "reject") {
        if (pendingInput === input) {
          return result;
        }
        throw new Error(
          result.message ??
            `Reducer rejected internal input '${pendingInput.kind}'.`,
        );
      }

      workingState = result.state;

      if (afterInput) {
        const afterInputResult = afterInput(workingState, pendingInput);
        workingState = afterInputResult.state;
        trace.push(...afterInputResult.trace);
      }

      const effectQueue = [...(result.effects ?? [])];
      const systemQueue: Input[] = [];
      while (effectQueue.length > 0 || systemQueue.length > 0) {
        while (effectQueue.length > 0) {
          const effect = effectQueue.shift()!;
          trace.push({
            type: "appliedEffect",
            effect,
          });
          const applied = applyEffect(workingState, effect);
          workingState = applied.state;
          trace.push(...applied.trace);
          if (applied.queuedEffects.length > 0) {
            effectQueue.unshift(...applied.queuedEffects);
          }
          for (const queuedInput of applied.queuedInputs) {
            if (queuedInput.kind === "system") {
              trace.push({
                type: "dispatchedSystemInput",
                input: queuedInput as Extract<Input, { kind: "system" }>,
              });
            }
          }
          systemQueue.push(...applied.queuedInputs);
        }

        while (systemQueue.length > 0) {
          pendingInputs.push(systemQueue.shift()!);
        }
      }
    }

    return {
      type: "accept",
      state: workingState,
      trace,
    };
  }

  return {
    dispatch,
    drainEffects,
  };
}
