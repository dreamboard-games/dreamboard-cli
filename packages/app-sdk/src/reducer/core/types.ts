import type {
  ReducerRuntimeEffectForState,
  ScheduledSystemInput,
} from "../model";
import type { TrustedRuntimeInput } from "../ingress/types";

export type DispatchTraceEntry<
  State,
  PlayerId extends string = string,
  Input extends TrustedRuntimeInput<PlayerId> = TrustedRuntimeInput<PlayerId>,
> =
  | {
      type: "acceptedClientInput";
      input: Input;
    }
  | {
      type: "dispatchedSystemInput";
      input: Extract<Input, { kind: "system" }>;
    }
  | {
      type: "scheduledSystemInput";
      input: NonNullable<
        State extends { runtime: infer RuntimeState }
          ? RuntimeState extends { pendingSystemInputs?: infer Pending }
            ? Pending extends readonly ScheduledSystemInput[]
              ? Pending[number]
              : ScheduledSystemInput
            : ScheduledSystemInput
          : ScheduledSystemInput
      >;
    }
  | {
      type: "appliedEffect";
      effect: ReducerRuntimeEffectForState<State>;
    }
  | {
      type: "promptLifecycle";
      action: string;
      promptId: string;
      playerId?: PlayerId | null;
    }
  | {
      type: "windowLifecycle";
      action: string;
      windowId: string;
      playerId?: PlayerId | null;
    }
  | {
      type: "rngConsumption";
      operation: string;
      traceEntry: string;
    };

export type TrustedReducerDispatchResult<State, PlayerId extends string> =
  | {
      type: "reject";
      errorCode: string;
      message?: string;
    }
  | {
      type: "accept";
      state: State;
      trace: DispatchTraceEntry<State, PlayerId>[];
    };

export type TrustedEffectApplicationResult<
  State,
  PlayerId extends string,
  Input extends TrustedRuntimeInput<PlayerId> = TrustedRuntimeInput<PlayerId>,
> = {
  state: State;
  queuedInputs: Input[];
  queuedEffects: ReducerRuntimeEffectForState<State>[];
  trace: DispatchTraceEntry<State, PlayerId, Input>[];
};

export type TrustedReducerEngine<State, PlayerId extends string> = {
  dispatch: (
    state: State,
    input: TrustedRuntimeInput<PlayerId>,
  ) => TrustedReducerDispatchResult<State, PlayerId>;
  drainEffects: (
    state: State,
    effects: ReducerRuntimeEffectForState<State>[],
  ) => State;
};

export type { TrustedRuntimeInput };
