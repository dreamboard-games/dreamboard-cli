import type {
  ReducerReject,
  ReducerResult,
  ReducerResultLike,
  ReducerRuntimeEffectForState,
  ReducerValidationResult,
} from "../model";

export function acceptReducerResult<State>(
  state: State,
  effects: ReducerRuntimeEffectForState<State>[] = [],
): ReducerResult<State> {
  return {
    type: "accept",
    state,
    effects,
  };
}

export function rejectReducerResult(
  errorCode: string,
  message?: string,
): ReducerReject {
  return {
    type: "reject",
    errorCode,
    message,
  };
}

export function normalizeReducerResult<State>(
  result: ReducerResultLike<State> | void,
  fallbackState: State,
): ReducerResult<State> {
  if (result == null) {
    return acceptReducerResult(fallbackState);
  }
  if (typeof result === "object" && "type" in result) {
    return result;
  }
  if (typeof result === "object" && "state" in result) {
    return acceptReducerResult(result.state, result.effects ?? []);
  }
  return acceptReducerResult(fallbackState);
}

export function rejectValidation(
  errorCode: string,
  message?: string,
): ReducerValidationResult {
  return {
    valid: false,
    errorCode,
    message,
  };
}
