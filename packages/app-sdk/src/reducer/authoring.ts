import { z } from "zod";
import type {
  ActionMap,
  ActionSpec,
  AnySchema,
  BaseGameStateOfContract,
  ChoiceOption,
  ChoicePromptSpec,
  ChoiceOptionIdTuple,
  ContinuationCallable,
  GeneratedManifestContractLike,
  InitialStateCallbacks,
  ManifestContractOf,
  NonEmptyReadonlyArray,
  PromptMap,
  PromptSpec,
  PromptIdOf,
  ReducerGameContract,
  ReducerGameDefinition,
  ReducerManifestContract,
  ManifestContract,
  RuntimeParams,
  SetupProfileDefinition,
  RuntimeTableRecord,
  SchemaLike,
  ScopedPhaseState,
  SharedContinuationCallable,
  TableOfState,
  ViewDefinition,
  PhaseDefinition,
  StateDefinition,
  PhaseMapOf,
  ViewMapOf,
  ContinuationMap,
  PromptContinuationCallable,
  WindowMap,
  WindowContinuationCallable,
  ContinuationSourceKind,
} from "./model";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyReducerGameContract = {
  manifest: any;
  state: StateDefinition<
    RuntimeTableRecord,
    SchemaLike<object>,
    SchemaLike<object>,
    SchemaLike<object>
  >;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const UNBOUND_CONTINUATION_ID = "__dreamboard_unbound_continuation__";

export type ReducerActionSpec<
  Contract extends AnyReducerGameContract,
  ParamsSchema extends SchemaLike<RuntimeParams>,
> = ActionSpec<
  ParamsSchema,
  BaseGameStateOfContract<Contract>,
  ManifestContractOf<Contract>
>;

export type ReducerPhaseDefinition<
  Contract extends AnyReducerGameContract,
  PhaseStateSchema extends SchemaLike<object>,
> = PhaseDefinition<
  PhaseStateSchema,
  BaseGameStateOfContract<Contract>,
  ManifestContractOf<Contract>
>;

export type ReducerViewDefinition<
  Contract extends AnyReducerGameContract,
  ViewSchema extends AnySchema,
> = ViewDefinition<
  ViewSchema,
  BaseGameStateOfContract<Contract>,
  ManifestContractOf<Contract>
>;

export type ReducerContinuationDefinition<
  Contract extends AnyReducerGameContract,
  DataSchema extends AnySchema,
  ResponseSchema extends AnySchema,
> = ContinuationCallable<
  DataSchema,
  ResponseSchema,
  BaseGameStateOfContract<Contract>,
  ManifestContractOf<Contract>
>;

type ContinuationDefinitionInput<
  Contract extends AnyReducerGameContract,
  DataSchema extends AnySchema,
  ResponseSchema extends AnySchema,
> = {
  data: DataSchema;
  response: ResponseSchema;
  reduce: SharedContinuationCallable<
    DataSchema,
    ResponseSchema,
    BaseGameStateOfContract<Contract>,
    ManifestContractOf<Contract>
  >["reduce"];
};

type PromptContinuationDefinitionInput<
  Contract extends AnyReducerGameContract,
  Prompt extends PromptSpec<AnySchema, string>,
  DataSchema extends AnySchema,
> = {
  prompt: Prompt;
  data: DataSchema;
  reduce: PromptContinuationCallable<
    DataSchema,
    Prompt["responseSchema"],
    BaseGameStateOfContract<Contract>,
    ManifestContractOf<Contract>,
    string,
    PromptIdOf<Prompt>
  >["reduce"];
};

type WindowContinuationDefinitionInput<
  Contract extends AnyReducerGameContract,
  DataSchema extends AnySchema,
  ResponseSchema extends AnySchema,
> = {
  data: DataSchema;
  response: ResponseSchema;
  reduce: WindowContinuationCallable<
    DataSchema,
    ResponseSchema,
    BaseGameStateOfContract<Contract>,
    ManifestContractOf<Contract>
  >["reduce"];
};

function createContinuationCallable<
  DataSchema extends AnySchema,
  ResponseSchema extends AnySchema,
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Manifest extends ManifestContract<TableOfState<State>>,
  Source extends ContinuationSourceKind,
  BoundPromptId extends string | undefined = undefined,
>(definition: {
  data: DataSchema;
  response: ResponseSchema;
  source: Source;
  boundPromptId?: BoundPromptId;
  reduce: ContinuationCallable<
    DataSchema,
    ResponseSchema,
    State,
    Manifest,
    string,
    Source,
    BoundPromptId
  >["reduce"];
}): ContinuationCallable<
  DataSchema,
  ResponseSchema,
  State,
  Manifest,
  string,
  Source,
  BoundPromptId
> {
  const continuation = ((data: z.infer<DataSchema>) => {
    if (continuation.id === UNBOUND_CONTINUATION_ID) {
      throw new Error(
        "Continuation must be registered under phase.continuations before it can be resumed.",
      );
    }
    return {
      id: continuation.id,
      data,
    };
  }) as ContinuationCallable<
    DataSchema,
    ResponseSchema,
    State,
    Manifest,
    string,
    Source,
    BoundPromptId
  >;
  continuation.id = UNBOUND_CONTINUATION_ID;
  continuation.source = definition.source;
  continuation.dataSchema = definition.data;
  continuation.responseSchema = definition.response;
  continuation.reduce = definition.reduce;
  if (definition.boundPromptId != null) {
    continuation.boundPromptId = definition.boundPromptId;
  }
  return continuation;
}

export function defineGameContract<
  Table extends RuntimeTableRecord,
  const Manifest extends ReducerManifestContract<
    Table,
    string,
    string,
    string,
    string,
    string
  >,
  PublicSchema extends SchemaLike<object>,
  PrivateSchema extends SchemaLike<object>,
  HiddenSchema extends SchemaLike<object>,
>(
  definition: ReducerGameContract<
    Table,
    Manifest,
    PublicSchema,
    PrivateSchema,
    HiddenSchema
  >,
): ReducerGameContract<
  Table,
  Manifest,
  PublicSchema,
  PrivateSchema,
  HiddenSchema
> {
  return definition;
}

export function defineGame<
  const Contract extends AnyReducerGameContract,
  Definitions extends PhaseMapOf<Contract>,
  Views extends ViewMapOf<Contract> = Record<string, never>,
>(
  definition: { contract: Contract } & Omit<
    ReducerGameDefinition<NoInfer<Contract>, Definitions, Views>,
    "contract"
  >,
): ReducerGameDefinition<Contract, Definitions, Views> {
  return definition;
}

type ExactRecord<
  Keys extends string,
  Value,
  Candidate extends Record<string, Value>,
> = Candidate &
  Record<Exclude<Keys, keyof Candidate>, never> &
  Record<Exclude<keyof Candidate, Keys>, never>;

export function defineSetupProfiles<SetupProfileId extends string>() {
  return <
    const Profiles extends Record<string, SetupProfileDefinition<string>>,
  >(
    profiles: ExactRecord<
      SetupProfileId,
      SetupProfileDefinition<string>,
      Profiles
    >,
  ) => profiles;
}

export function defineSetupProfilesFor<
  const Manifest extends GeneratedManifestContractLike,
>(_manifest: Manifest) {
  return <SetupProfileId extends string>() =>
    <
      const Profiles extends Record<
        string,
        SetupProfileDefinition<string, Manifest>
      >,
    >(
      profiles: ExactRecord<
        SetupProfileId,
        SetupProfileDefinition<string, Manifest>,
        Profiles
      >,
    ) =>
      profiles;
}

export function definePhase<Contract extends AnyReducerGameContract>() {
  return <
    PhaseStateSchema extends SchemaLike<object>,
    Actions extends ActionMap<
      ScopedPhaseState<
        BaseGameStateOfContract<Contract>,
        z.infer<PhaseStateSchema>
      >,
      ManifestContractOf<Contract>
    > = Record<string, never>,
    Prompts extends PromptMap = Record<string, never>,
    Continuations extends ContinuationMap<
      ScopedPhaseState<
        BaseGameStateOfContract<Contract>,
        z.infer<PhaseStateSchema>
      >,
      ManifestContractOf<Contract>
    > = Record<string, never>,
    Windows extends WindowMap = Record<string, never>,
  >(
    definition: PhaseDefinition<
      PhaseStateSchema,
      BaseGameStateOfContract<Contract>,
      ManifestContractOf<Contract>,
      Actions,
      Prompts,
      Continuations,
      Windows
    >,
  ): PhaseDefinition<
    PhaseStateSchema,
    BaseGameStateOfContract<Contract>,
    ManifestContractOf<Contract>,
    Actions,
    Prompts,
    Continuations,
    Windows
  > => {
    for (const [continuationKey, continuation] of Object.entries(
      definition.continuations ?? {},
    )) {
      if (!continuation.id || continuation.id === UNBOUND_CONTINUATION_ID) {
        continuation.id = continuationKey;
      }
    }
    for (const [windowKey, window] of Object.entries(
      definition.windows ?? {},
    )) {
      if (!window.id) {
        window.id = windowKey;
      }
    }
    return definition;
  };
}

export function defineAction<Contract extends AnyReducerGameContract>() {
  return <ParamsSchema extends SchemaLike<RuntimeParams>>(
    definition: ActionSpec<
      ParamsSchema,
      BaseGameStateOfContract<Contract>,
      ManifestContractOf<Contract>
    >,
  ): ActionSpec<ParamsSchema, any, ManifestContractOf<Contract>> =>
    definition as ActionSpec<ParamsSchema, any, ManifestContractOf<Contract>>;
}

export function definePrompt<Contract extends AnyReducerGameContract>() {
  return <PromptId extends string, ResponseSchema extends AnySchema>(
    definition: PromptSpec<ResponseSchema, PromptId>,
  ): PromptSpec<ResponseSchema, PromptId> => definition;
}

export function defineChoicePrompt<Contract extends AnyReducerGameContract>() {
  return <
    const Options extends NonEmptyReadonlyArray<ChoiceOption<string>>,
    PromptId extends string,
  >(definition: {
    id: PromptId;
    title?: string;
    options: Options;
  }): ChoicePromptSpec<Options, z.ZodType<Options[number]["id"]>, PromptId> => {
    const optionIds = definition.options.map(
      (option) => option.id,
    ) as ChoiceOptionIdTuple<Options>;

    return {
      ...definition,
      responseSchema: z.enum(optionIds),
    };
  };
}

export function defineContinuation<Contract extends AnyReducerGameContract>() {
  return function defineCurriedContinuation<
    DataSchema extends AnySchema,
    ResponseSchema extends AnySchema,
  >(
    definition: ContinuationDefinitionInput<
      Contract,
      DataSchema,
      ResponseSchema
    >,
  ): ContinuationCallable<
    DataSchema,
    ResponseSchema,
    any,
    ManifestContractOf<Contract>,
    string,
    "shared"
  > {
    return createContinuationCallable<
      DataSchema,
      ResponseSchema,
      BaseGameStateOfContract<Contract>,
      ManifestContractOf<Contract>,
      "shared"
    >({
      data: definition.data,
      response: definition.response,
      source: "shared",
      reduce: definition.reduce,
    }) as ContinuationCallable<
      DataSchema,
      ResponseSchema,
      any,
      ManifestContractOf<Contract>,
      string,
      "shared"
    >;
  };
}

export function definePromptContinuation<
  Contract extends AnyReducerGameContract,
>() {
  return function defineCurriedPromptContinuation<
    Prompt extends PromptSpec<AnySchema, string>,
    DataSchema extends AnySchema,
  >(
    definition: PromptContinuationDefinitionInput<Contract, Prompt, DataSchema>,
  ): ContinuationCallable<
    DataSchema,
    Prompt["responseSchema"],
    any,
    ManifestContractOf<Contract>,
    string,
    "prompt",
    PromptIdOf<Prompt>
  > {
    return createContinuationCallable<
      DataSchema,
      Prompt["responseSchema"],
      BaseGameStateOfContract<Contract>,
      ManifestContractOf<Contract>,
      "prompt",
      PromptIdOf<Prompt>
    >({
      data: definition.data,
      response: definition.prompt.responseSchema,
      source: "prompt",
      boundPromptId: definition.prompt.id,
      reduce: definition.reduce,
    }) as ContinuationCallable<
      DataSchema,
      Prompt["responseSchema"],
      any,
      ManifestContractOf<Contract>,
      string,
      "prompt",
      PromptIdOf<Prompt>
    >;
  };
}

export function defineWindowContinuation<
  Contract extends AnyReducerGameContract,
>() {
  return function defineCurriedWindowContinuation<
    DataSchema extends AnySchema,
    ResponseSchema extends AnySchema,
  >(
    definition: WindowContinuationDefinitionInput<
      Contract,
      DataSchema,
      ResponseSchema
    >,
  ): ContinuationCallable<
    DataSchema,
    ResponseSchema,
    any,
    ManifestContractOf<Contract>,
    string,
    "window"
  > {
    return createContinuationCallable<
      DataSchema,
      ResponseSchema,
      BaseGameStateOfContract<Contract>,
      ManifestContractOf<Contract>,
      "window"
    >({
      data: definition.data,
      response: definition.response,
      source: "window",
      reduce: definition.reduce,
    }) as ContinuationCallable<
      DataSchema,
      ResponseSchema,
      any,
      ManifestContractOf<Contract>,
      string,
      "window"
    >;
  };
}

export function defineView<Contract extends AnyReducerGameContract>() {
  return <ViewSchema extends AnySchema>(
    definition: ViewDefinition<
      ViewSchema,
      BaseGameStateOfContract<Contract>,
      ManifestContractOf<Contract>
    >,
  ): ViewDefinition<
    ViewSchema,
    BaseGameStateOfContract<Contract>,
    ManifestContractOf<Contract>
  > => definition;
}

export type {
  GameStateOf,
  InitialStateCallbacks,
  ManifestOf,
  PhaseMapOf,
  ReducerGameContract,
  ReducerGameDefinition,
} from "./model";
