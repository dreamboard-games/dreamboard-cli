import type { z } from "zod";
import type {
  AnySchema,
  Brand,
  NonEmptyReadonlyArray,
  RuntimePayload,
  RuntimeTableRecord,
  StringKeyOf,
} from "./table";
import type {
  CardIdOfState,
  CardIdOfTable,
  DealCardsToPlayerZoneArgsForState,
  DealCardsToPlayerZoneEffectForState,
  DeckIdOfState,
  DeckIdOfTable,
  HandIdOfState,
  HandIdOfTable,
  PhaseNameOfState,
  PlayerIdOfState,
  PlayerIdOfTable,
  RuntimeSetupSelection,
  TableOfState,
} from "./extract";

// --- Continuation Tokens ---

export type ContinuationToken<
  Data = RuntimePayload,
  ContinuationId extends string = string,
  Response = RuntimePayload,
  BoundPromptId extends string | undefined = undefined,
> = {
  id: ContinuationId;
  data: Data;
  readonly __responseType?: Response;
  readonly __promptId?: BoundPromptId;
};

export type ContinuationResponseOf<Token> =
  Token extends ContinuationToken<any, string, infer Response, any>
    ? Response
    : never;

export type ContinuationPromptIdOf<Token> =
  Token extends ContinuationToken<any, string, any, infer PromptId>
    ? PromptId
    : never;

export type AnyContinuationToken = ContinuationToken<
  RuntimePayload,
  string,
  RuntimePayload,
  string | undefined
>;

export type SharedContinuationToken<
  Data = RuntimePayload,
  ContinuationId extends string = string,
  Response = RuntimePayload,
> = ContinuationToken<Data, ContinuationId, Response, undefined>;

// --- Prompt Specs ---

export type PromptSpecBase<
  PromptId extends string,
  ResponseSchema extends AnySchema,
> = {
  id: PromptId;
  title?: string;
  responseSchema: ResponseSchema;
};

export type PromptSpec<
  ResponseSchema extends AnySchema,
  PromptId extends string = string,
> = PromptSpecBase<PromptId, ResponseSchema>;

export type ChoiceOption<OptionId extends string = string> = {
  id: OptionId;
  label: string;
};

export type ChoicePromptSpec<
  Options extends NonEmptyReadonlyArray<ChoiceOption>,
  ResponseSchema extends AnySchema,
  PromptId extends string = string,
> = PromptSpecBase<PromptId, ResponseSchema> & {
  options: Options;
};

export type AnyPromptSpec =
  | PromptSpec<AnySchema, string>
  | ChoicePromptSpec<NonEmptyReadonlyArray<ChoiceOption>, AnySchema, string>;

export type PromptIdOf<Prompt extends AnyPromptSpec> = Prompt["id"];
export type PromptResponseOf<Prompt extends AnyPromptSpec> = z.infer<
  Prompt["responseSchema"]
>;
export type ChoiceOptionsOfPrompt<Prompt extends AnyPromptSpec> =
  Prompt extends ChoicePromptSpec<infer Options, AnySchema, string>
    ? Options
    : never;
export type PromptOptionIdOf<Prompt extends AnyPromptSpec> =
  ChoiceOptionsOfPrompt<Prompt>[number]["id"];
export type PromptOptionsOf<Prompt extends AnyPromptSpec> =
  Prompt extends ChoicePromptSpec<infer Options, AnySchema, string>
    ? ReadonlyArray<RuntimePromptOption<Extract<Options[number]["id"], string>>>
    : never;
export type PromptResumeFor<
  Prompt extends AnyPromptSpec,
  Resume extends ContinuationToken<any, string, any, string | undefined>,
> = [PromptResponseOf<Prompt>] extends [ContinuationResponseOf<Resume>]
  ? [ContinuationResponseOf<Resume>] extends [PromptResponseOf<Prompt>]
    ? [ContinuationPromptIdOf<Resume>] extends [undefined]
      ? Resume
      : [ContinuationPromptIdOf<Resume>] extends [PromptIdOf<Prompt>]
        ? [PromptIdOf<Prompt>] extends [ContinuationPromptIdOf<Resume>]
          ? Resume
          : never
        : never
    : never
  : never;
export type OpenPromptOptions<
  Prompt extends AnyPromptSpec,
  To extends string,
  Resume extends ContinuationToken<any, string, any, string | undefined>,
> = {
  to: To;
  resume: PromptResumeFor<Prompt, Resume>;
  title?: string;
  payload?: RuntimePayload;
} & (Prompt extends ChoicePromptSpec<infer _Options, AnySchema, string>
  ? {
      options?: PromptOptionsOf<Prompt>;
    }
  : {
      options?: never;
    });
export type OpenPromptEffect<
  Prompt extends AnyPromptSpec,
  To extends string,
  Resume extends ContinuationToken<any, string, any, string | undefined>,
> = {
  type: "openPrompt";
  prompt: PromptIdOf<Prompt>;
  to: To;
  title?: string;
  payload?: RuntimePayload;
  resume: PromptResumeFor<Prompt, Resume>;
} & (Prompt extends ChoicePromptSpec<infer _Options, AnySchema, string>
  ? {
      options?: PromptOptionsOf<Prompt>;
    }
  : {});
export type ChoiceOptionIdTuple<
  Options extends NonEmptyReadonlyArray<ChoiceOption>,
> = {
  [Index in keyof Options]: Options[Index] extends ChoiceOption<infer OptionId>
    ? OptionId
    : never;
};

// --- Runtime Flow & State ---

export type RuntimePhaseState = object;
export type RuntimePhaseStateMap<PhaseName extends string> = RuntimePhaseState;

export type FlowState<PhaseName extends string, PlayerId extends string> = {
  currentPhase: PhaseName;
  turn: number;
  round: number;
  activePlayers: PlayerId[];
};

export type RuntimePromptOption<OptionId extends string = string> = {
  id: OptionId;
  label: string;
};

export type PromptInstanceId<PromptId extends string = string> = Brand<
  string,
  `PromptInstance:${PromptId}`
>;
export type WindowInstanceId<WindowId extends string = string> = Brand<
  string,
  `WindowInstance:${WindowId}`
>;

export type RuntimePromptInstance<
  PlayerId extends string = string,
  PromptId extends string = string,
  OptionId extends string = string,
> = {
  id: PromptInstanceId<PromptId>;
  promptId: PromptId;
  to: PlayerId;
  title?: string;
  payload?: RuntimePayload;
  options?: ReadonlyArray<RuntimePromptOption<OptionId>>;
  resume: AnyContinuationToken;
};

export type RuntimeWindowClosePolicy =
  | { type: "allPassInSequence" }
  | { type: "allResponded" }
  | { type: "firstValidAction" }
  | { type: "manual" };

export type RuntimeWindowInstance<
  PlayerId extends string = string,
  WindowId extends string = string,
> = {
  id: WindowInstanceId<WindowId>;
  windowId: WindowId;
  closePolicy: RuntimeWindowClosePolicy;
  addressedTo?: PlayerId[];
  payload?: RuntimePayload;
  resume?: AnyContinuationToken;
  respondedPlayerIds?: PlayerId[];
  passedPlayerIds?: PlayerId[];
};

export type RuntimeRngState = {
  seed?: number | null;
  cursor: number;
  trace: string[];
};

// --- Effects ---

export type ScheduledSystemInput = {
  timing: string;
  event: string;
  payload?: RuntimePayload;
};

export type ReducerRuntimeEffect<
  PhaseName extends string,
  PlayerId extends string,
  DeckId extends string,
  HandId extends string,
  CardId extends string,
> =
  | { type: "transition"; to: PhaseName }
  | {
      type: "openPrompt";
      prompt: string;
      to: PlayerId;
      title?: string;
      payload?: RuntimePayload;
      options?: ReadonlyArray<RuntimePromptOption>;
      resume: AnyContinuationToken;
    }
  | { type: "closePrompt"; promptId: string }
  | {
      type: "openWindow";
      window: string;
      closePolicy?: RuntimeWindowClosePolicy;
      addressedTo?: readonly PlayerId[];
      payload?: RuntimePayload;
      resume?: AnyContinuationToken;
    }
  | { type: "closeWindow"; windowId: string }
  | { type: "rollDie"; dieId: string }
  | { type: "shuffleSharedZone"; zoneId: DeckId }
  | {
      type: "dealCardsToPlayerZone";
      fromZoneId: DeckId;
      playerId: PlayerId;
      toZoneId: HandId;
      count: number;
    }
  | {
      type: "sample";
      from: readonly CardId[];
      sampleId: string;
      count?: number;
      resume: AnyContinuationToken;
    }
  | {
      type: "randomInt";
      min: number;
      max: number;
      randomIntId: string;
      resume: AnyContinuationToken;
    }
  | { type: "dispatchSystem"; event: string; payload?: RuntimePayload }
  | {
      type: "scheduleTiming";
      timing: string;
      event: string;
      payload?: RuntimePayload;
    };

export type ReducerRuntimeEffectForState<State> = ReducerRuntimeEffect<
  PhaseNameOfState<State>,
  PlayerIdOfState<State>,
  DeckIdOfState<State>,
  HandIdOfState<State>,
  CardIdOfState<State>
>;

export type ReducerEffects<State extends { table: RuntimeTableRecord }> = {
  transition: <To extends PhaseNameOfState<State>>(
    to: To,
  ) => Extract<ReducerRuntimeEffectForState<State>, { type: "transition" }> & {
    to: To;
  };
  openPrompt: <
    Prompt extends AnyPromptSpec,
    To extends PlayerIdOfState<State>,
    Resume extends ContinuationToken<any, string, any, string | undefined>,
  >(
    prompt: Prompt,
    options: OpenPromptOptions<Prompt, To, Resume>,
  ) => OpenPromptEffect<Prompt, To, Resume>;
  closePrompt: <PromptId extends string>(
    promptId: PromptInstanceId<PromptId>,
  ) => {
    type: "closePrompt";
    promptId: PromptInstanceId<PromptId>;
  };
  openWindow: <
    Window extends { id: string },
    AddressedTo extends readonly PlayerIdOfState<State>[] | undefined,
  >(
    window: Window,
    options?: {
      closePolicy?: RuntimeWindowClosePolicy;
      addressedTo?: AddressedTo;
      payload?: RuntimePayload;
      resume?: AnyContinuationToken;
    },
  ) => {
    type: "openWindow";
    window: Window["id"];
    closePolicy?: RuntimeWindowClosePolicy;
    addressedTo?: AddressedTo;
    payload?: RuntimePayload;
    resume?: AnyContinuationToken;
  };
  closeWindow: <WindowId extends string>(
    windowId: WindowInstanceId<WindowId>,
  ) => {
    type: "closeWindow";
    windowId: WindowInstanceId<WindowId>;
  };
  rollDie: <DieId extends StringKeyOf<TableOfState<State>["dice"]>>(
    dieId: DieId,
  ) => {
    type: "rollDie";
    dieId: DieId;
  };
  shuffleSharedZone: <ZoneId extends DeckIdOfState<State>>(
    zoneId: ZoneId,
  ) => {
    type: "shuffleSharedZone";
    zoneId: ZoneId;
  };
  dealCardsToPlayerZone: (
    ...args: DealCardsToPlayerZoneArgsForState<State>
  ) => DealCardsToPlayerZoneEffectForState<State>;
  sample: <
    SampleId extends string,
    Resume extends SharedContinuationToken<any, string, any>,
  >(
    from: readonly CardIdOfState<State>[],
    sampleId: SampleId,
    resume: Resume,
    count?: number,
  ) => {
    type: "sample";
    from: readonly CardIdOfState<State>[];
    sampleId: SampleId;
    count?: number;
    resume: Resume;
  };
  randomInt: <
    RandomIntId extends string,
    Resume extends SharedContinuationToken<any, string, any>,
  >(
    min: number,
    max: number,
    randomIntId: RandomIntId,
    resume: Resume,
  ) => {
    type: "randomInt";
    min: number;
    max: number;
    randomIntId: RandomIntId;
    resume: Resume;
  };
  dispatchSystem: <Event extends string>(
    event: Event,
    payload?: RuntimePayload,
  ) => {
    type: "dispatchSystem";
    event: Event;
    payload?: RuntimePayload;
  };
  scheduleTiming: <Timing extends string, Event extends string>(
    timing: Timing,
    event: Event,
    payload?: RuntimePayload,
  ) => {
    type: "scheduleTiming";
    timing: Timing;
    event: Event;
    payload?: RuntimePayload;
  };
};

// --- Composite State ---

export type RuntimeState<
  PhaseName extends string,
  PlayerId extends string,
  DeckId extends string,
  HandId extends string,
  CardId extends string,
  Setup extends RuntimeSetupSelection = RuntimeSetupSelection,
> = {
  prompts: RuntimePromptInstance<PlayerId>[];
  windows: RuntimeWindowInstance<PlayerId>[];
  effectQueue: ReducerRuntimeEffect<
    PhaseName,
    PlayerId,
    DeckId,
    HandId,
    CardId
  >[];
  rng: RuntimeRngState;
  setup: Setup | null;
  lastTransition?: {
    from: PhaseName;
    to: PhaseName;
  };
  pendingSystemInputs?: ScheduledSystemInput[];
  nextInstanceId?: number;
};

export type ReducerRuntimeStateForState<
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Setup extends RuntimeSetupSelection = RuntimeSetupSelection,
> = RuntimeState<
  PhaseNameOfState<State>,
  PlayerIdOfState<State>,
  DeckIdOfState<State>,
  HandIdOfState<State>,
  CardIdOfState<State>,
  Setup
>;

export type ReducerGameState<
  Table extends RuntimeTableRecord,
  PublicState extends object,
  PrivateState extends object,
  HiddenState extends object,
  PhaseState extends RuntimePhaseState,
  PhaseName extends string,
  Setup extends RuntimeSetupSelection = RuntimeSetupSelection,
> = {
  table: Table;
  publicState: PublicState;
  privateState: Record<PlayerIdOfTable<Table>, PrivateState>;
  hiddenState: HiddenState;
  flow: FlowState<PhaseName, PlayerIdOfTable<Table>>;
  phase: PhaseState;
};

export type ReducerSessionState<
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Setup extends RuntimeSetupSelection = RuntimeSetupSelection,
> = {
  domain: State;
  runtime: ReducerRuntimeStateForState<State, Setup>;
};

// --- Results ---

export type ReducerValidationResult =
  | { valid: true }
  | { valid: false; errorCode: string; message?: string };

export type ReducerReject = {
  type: "reject";
  errorCode: string;
  message?: string;
};

export type ReducerAccept<State> = {
  type: "accept";
  state: State;
  effects?: ReducerRuntimeEffectForState<State>[];
};

export type ReducerResult<State> = ReducerAccept<State> | ReducerReject;

export type ReducerResultLike<State> =
  | ReducerResult<State>
  | {
      state: State;
      effects?: ReducerRuntimeEffectForState<State>[];
    };
