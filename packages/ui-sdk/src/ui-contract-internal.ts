/** Internal placeholder UI contract types for building @dreamboard/ui-sdk. */
export type ViewName = string;

export type GameView = Record<string, unknown>;

export type InferView<_Name extends ViewName> = GameView;

export type ActionName = string;

export type ActionParams<_Name extends ActionName> = Record<string, unknown>;
export type ActionArgs<_Name extends ActionName> =
  | []
  | [Record<string, unknown>];
export type PhaseName = string;
export type ActionNameForPhase<_Phase extends PhaseName> = ActionName;
export type ActionParamsForPhase<
  _Phase extends PhaseName,
  _Name extends ActionNameForPhase<_Phase>,
> = Record<string, unknown>;
export type ActionArgsForPhase<
  _Phase extends PhaseName,
  _Name extends ActionNameForPhase<_Phase>,
> = [] | [Record<string, unknown>];
export type ActionCommandForPhase<_Phase extends PhaseName> =
  | { type: string }
  | { type: string; params?: Record<string, unknown> };
export type PhaseCommands<_Phase extends PhaseName> = Record<
  string,
  (...args: [] | [Record<string, unknown>]) => {
    type: string;
    params?: Record<string, unknown>;
  }
>;

export type PromptId = string;

export type PromptResponse<_Name extends PromptId> = unknown;
export type PromptInstanceId<_Name extends PromptId> = string;

export type WindowId = string;
export type WindowInstanceId<_Name extends WindowId> = string;

export type WindowActionName<_Name extends WindowId> = string;

export type WindowActionParams<
  _Name extends WindowId,
  _Action extends WindowActionName<_Name>,
> = Record<string, unknown> | undefined;
export type WindowActionArgs<
  _Name extends WindowId,
  _Action extends WindowActionName<_Name>,
> = [] | [Record<string, unknown>];
export type WindowActionCommand<_Name extends WindowId> =
  | { type: string }
  | { type: string; params?: Record<string, unknown> };
export type WindowCommands<_Name extends WindowId> = Record<
  string,
  (...args: [] | [Record<string, unknown>]) => {
    type: string;
    params?: Record<string, unknown>;
  }
>;

function createCommand(type: string) {
  return (...args: [] | [Record<string, unknown>]) => {
    const params = args[0];
    return typeof params === "undefined" ? { type } : { type, params };
  };
}

function createCommandNamespace() {
  return new Proxy(Object.create(null), {
    get(_target, prop) {
      if (typeof prop !== "string") {
        return undefined;
      }
      return createCommand(prop);
    },
    has(_target, prop) {
      return typeof prop === "string";
    },
  });
}

export const phaseCommands = new Proxy(Object.create(null), {
  get(_target, prop) {
    if (typeof prop !== "string") {
      return undefined;
    }
    return createCommandNamespace();
  },
}) as Record<string, PhaseCommands<string>>;

export const windowCommands = new Proxy(Object.create(null), {
  get(_target, prop) {
    if (typeof prop !== "string") {
      return undefined;
    }
    return createCommandNamespace();
  },
}) as Record<string, WindowCommands<string>>;
