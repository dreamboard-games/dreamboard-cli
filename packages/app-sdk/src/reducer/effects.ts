import type {
  AnyPromptSpec,
  AnySchema,
  ChoiceOption,
  ChoicePromptSpec,
  ContinuationToken,
  NonEmptyReadonlyArray,
  OpenPromptEffect,
  OpenPromptOptions,
  PromptSpec,
  ReducerEffects,
  RuntimePayload,
  RuntimePromptOption,
  RuntimeTableRecord,
} from "./model";

function openPromptEffect<
  PromptId extends string,
  ResponseSchema extends AnySchema,
  To extends string,
  Resume extends ContinuationToken<any, string, any, string | undefined>,
>(
  prompt: PromptSpec<ResponseSchema, PromptId>,
  options: OpenPromptOptions<PromptSpec<ResponseSchema, PromptId>, To, Resume>,
): OpenPromptEffect<PromptSpec<ResponseSchema, PromptId>, To, Resume>;
function openPromptEffect<
  Options extends NonEmptyReadonlyArray<ChoiceOption<string>>,
  ResponseSchema extends AnySchema,
  PromptId extends string,
  To extends string,
  Resume extends ContinuationToken<any, string, any, string | undefined>,
>(
  prompt: ChoicePromptSpec<Options, ResponseSchema, PromptId>,
  options: OpenPromptOptions<
    ChoicePromptSpec<Options, ResponseSchema, PromptId>,
    To,
    Resume
  >,
): OpenPromptEffect<
  ChoicePromptSpec<Options, ResponseSchema, PromptId>,
  To,
  Resume
>;
function openPromptEffect(
  prompt: AnyPromptSpec,
  options: {
    to: string;
    resume: ContinuationToken<any, string, any, string | undefined>;
    title?: string;
    payload?: RuntimePayload;
    options?: ReadonlyArray<RuntimePromptOption>;
  },
) {
  const baseEffect = {
    type: "openPrompt" as const,
    prompt: prompt.id,
    to: options.to,
    title: options.title ?? prompt.title,
    payload: options.payload,
    resume: options.resume,
  };

  if ("options" in prompt) {
    return {
      ...baseEffect,
      options: options.options ?? [...prompt.options],
    };
  }

  return baseEffect;
}

export function createReducerEffects<
  State extends { table: RuntimeTableRecord },
>(): ReducerEffects<State> {
  return {
    transition(to) {
      return { type: "transition", to };
    },
    openPrompt: openPromptEffect,
    closePrompt(promptId) {
      return {
        type: "closePrompt",
        promptId,
      };
    },
    openWindow(window, options = {}) {
      return {
        type: "openWindow",
        window: window.id,
        closePolicy: options.closePolicy ?? { type: "manual" },
        addressedTo: options.addressedTo,
        payload: options.payload,
        resume: options.resume,
      };
    },
    closeWindow(windowId) {
      return {
        type: "closeWindow",
        windowId,
      };
    },
    rollDie(dieId) {
      return {
        type: "rollDie",
        dieId,
      };
    },
    shuffleSharedZone(zoneId) {
      return {
        type: "shuffleSharedZone",
        zoneId,
      };
    },
    dealCardsToPlayerZone(...args) {
      const [fromZoneId, playerId, toZoneId, count] = args;
      return {
        type: "dealCardsToPlayerZone",
        fromZoneId,
        playerId,
        toZoneId,
        count,
      };
    },
    sample(from, sampleId, resume, count) {
      return {
        type: "sample",
        from,
        sampleId,
        count,
        resume,
      };
    },
    randomInt(min, max, randomIntId, resume) {
      return {
        type: "randomInt",
        min,
        max,
        randomIntId,
        resume,
      };
    },
    dispatchSystem(event, payload) {
      return {
        type: "dispatchSystem",
        event,
        payload,
      };
    },
    scheduleTiming(timing, event, payload) {
      return {
        type: "scheduleTiming",
        timing,
        event,
        payload,
      };
    },
  };
}
