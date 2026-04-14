import type { z } from "zod";
import type {
  AnySchema,
  NonEmptyReadonlyArray,
  RuntimeParams,
  RuntimePayload,
  RuntimeTableRecord,
  SchemaLike,
  SelectorFn,
} from "./table";
import type { ManifestContract, ReducerManifestContract } from "./manifest";
import type {
  PhaseNameOfState,
  PlayerIdOfState,
  PlayerIdOfTable,
  TableOfState,
  SetupSelectionOfManifest,
} from "./extract";
import type {
  AnyContinuationToken,
  AnyPromptSpec,
  ContinuationToken,
  PromptInstanceId,
  ReducerAccept,
  ReducerEffects,
  ReducerReject,
  ReducerResultLike,
  ReducerRuntimeEffectForState,
  ReducerRuntimeStateForState,
  RuntimePromptInstance,
  RuntimeWindowInstance,
  WindowInstanceId,
} from "./runtime";

// --- Continuation Input Types ---

export type ContinuationSourceKind = "shared" | "prompt" | "window";

export type PromptContinuationInput<
  DataSchema extends AnySchema,
  ResponseSchema extends AnySchema,
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  BoundPromptId extends string = string,
> = {
  source: "prompt";
  data: z.infer<DataSchema>;
  response: z.infer<ResponseSchema>;
  playerId?: PlayerIdOfState<State>;
  promptId: PromptInstanceId<BoundPromptId>;
};

export type WindowContinuationInput<
  DataSchema extends AnySchema,
  ResponseSchema extends AnySchema,
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  WindowId extends string = string,
> = {
  source: "window";
  data: z.infer<DataSchema>;
  response: z.infer<ResponseSchema>;
  playerId?: PlayerIdOfState<State>;
  windowId: WindowInstanceId<WindowId>;
  actionType: string;
  params: RuntimeParams;
};

export type SharedContinuationInput<
  DataSchema extends AnySchema,
  ResponseSchema extends AnySchema,
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
> = {
  source: "shared";
  data: z.infer<DataSchema>;
  response: z.infer<ResponseSchema>;
  event: string;
  payload: RuntimePayload;
};

export type ContinuationInput<
  DataSchema extends AnySchema,
  ResponseSchema extends AnySchema,
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  BoundPromptId extends string = string,
> =
  | SharedContinuationInput<DataSchema, ResponseSchema, State>
  | PromptContinuationInput<DataSchema, ResponseSchema, State, BoundPromptId>
  | WindowContinuationInput<DataSchema, ResponseSchema, State>;

export type ContinuationInputForSource<
  DataSchema extends AnySchema,
  ResponseSchema extends AnySchema,
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Source extends ContinuationSourceKind,
  BoundPromptId extends string | undefined = undefined,
> = Source extends "prompt"
  ? PromptContinuationInput<
      DataSchema,
      ResponseSchema,
      State,
      Extract<BoundPromptId, string>
    >
  : Source extends "window"
    ? WindowContinuationInput<DataSchema, ResponseSchema, State>
    : SharedContinuationInput<DataSchema, ResponseSchema, State>;

// --- Context Types ---

export type PhaseEnterContext = {
  event: "initialize" | "transition";
};

type BivariantCallback<Args, Result> = {
  bivarianceHack(args: Args): Result;
}["bivarianceHack"];

export type ActionContext<
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Manifest extends ManifestContract<TableOfState<State>>,
> = {
  currentPhase: PhaseNameOfState<State>;
  manifest: Manifest;
  playerOrder: PlayerIdOfState<State>[];
  activePlayers: PlayerIdOfState<State>[];
  runtime: ReducerRuntimeStateForState<State>;
  promptByInstanceId: <PromptId extends string>(
    promptId: PromptInstanceId<PromptId>,
  ) => RuntimePromptInstance<PlayerIdOfState<State>, PromptId> | null;
  setup: SetupSelectionOfManifest<Manifest> | null;
  windowByInstanceId: <WindowId extends string>(
    windowId: WindowInstanceId<WindowId>,
  ) => RuntimeWindowInstance<PlayerIdOfState<State>, WindowId> | null;
};

export type ValidationIssue = {
  errorCode: string;
  message?: string;
};

export type RuntimeHelpers<
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
> = {
  accept: (
    state: State,
    effects?: ReducerRuntimeEffectForState<State>[],
  ) => ReducerAccept<State>;
  reject: (errorCode: string, message?: string) => ReducerReject;
  effects: ReducerEffects<State>;
};

export type PhaseEnterArgs<
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Manifest extends ManifestContract<TableOfState<State>>,
> = ActionContext<State, Manifest> &
  RuntimeHelpers<State> &
  PhaseEnterContext & {
    state: State;
  };

export type ActionAvailabilityArgs<
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Manifest extends ManifestContract<TableOfState<State>>,
> = ActionContext<State, Manifest> &
  RuntimeHelpers<State> & {
    state: State;
    input: { playerId: PlayerIdOfState<State> };
  };

export type ActionReduceInput<
  ParamsSchema extends SchemaLike<RuntimeParams>,
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
> = {
  playerId: PlayerIdOfState<State>;
  params: z.infer<ParamsSchema>;
};

export type ActionValidateArgs<
  ParamsSchema extends SchemaLike<RuntimeParams>,
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Manifest extends ManifestContract<TableOfState<State>>,
> = ActionContext<State, Manifest> &
  RuntimeHelpers<State> & {
    state: State;
    input: ActionReduceInput<ParamsSchema, State>;
  };

export type SystemArgs<
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Manifest extends ManifestContract<TableOfState<State>>,
> = ActionContext<State, Manifest> &
  RuntimeHelpers<State> & {
    state: State;
    input: { payload?: RuntimePayload; event: string };
  };

export type ContinuationReduceArgs<
  DataSchema extends AnySchema,
  ResponseSchema extends AnySchema,
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Manifest extends ManifestContract<TableOfState<State>>,
  Source extends ContinuationSourceKind = "shared",
  BoundPromptId extends string | undefined = undefined,
> = ActionContext<State, Manifest> &
  RuntimeHelpers<State> & {
    state: State;
    input: ContinuationInputForSource<
      DataSchema,
      ResponseSchema,
      State,
      Source,
      BoundPromptId
    >;
  };

export type ScopedPhaseState<
  State extends {
    table: RuntimeTableRecord;
    flow: { currentPhase: string };
    phase: object;
  },
  PhaseState extends object,
> = State & { phase: PhaseState };

// --- Continuation Callables ---

export type ContinuationCallable<
  DataSchema extends AnySchema,
  ResponseSchema extends AnySchema,
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Manifest extends ManifestContract<TableOfState<State>>,
  ContinuationId extends string = string,
  Source extends ContinuationSourceKind = "shared",
  BoundPromptId extends string | undefined = undefined,
> = ((
  data: z.infer<DataSchema>,
) => ContinuationToken<
  z.infer<DataSchema>,
  ContinuationId,
  z.infer<ResponseSchema>,
  BoundPromptId
>) & {
  id: ContinuationId;
  source: Source;
  dataSchema: DataSchema;
  responseSchema: ResponseSchema;
  boundPromptId?: BoundPromptId;
  reduce: BivariantCallback<
    ContinuationReduceArgs<
      DataSchema,
      ResponseSchema,
      State,
      Manifest,
      Source,
      BoundPromptId
    >,
    ReducerResultLike<State>
  >;
};

export type AnyContinuationCallable<
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Manifest extends ManifestContract<TableOfState<State>>,
> = {
  (data: never): AnyContinuationToken;
  id: string;
  source: ContinuationSourceKind;
  dataSchema: AnySchema;
  responseSchema: AnySchema;
  boundPromptId?: string;
  reduce: (args: any) => ReducerResultLike<State>;
};

export type PromptContinuationCallable<
  DataSchema extends AnySchema,
  ResponseSchema extends AnySchema,
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Manifest extends ManifestContract<TableOfState<State>>,
  ContinuationId extends string = string,
  BoundPromptId extends string = string,
> = ContinuationCallable<
  DataSchema,
  ResponseSchema,
  State,
  Manifest,
  ContinuationId,
  "prompt",
  BoundPromptId
>;

export type WindowContinuationCallable<
  DataSchema extends AnySchema,
  ResponseSchema extends AnySchema,
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Manifest extends ManifestContract<TableOfState<State>>,
  ContinuationId extends string = string,
> = ContinuationCallable<
  DataSchema,
  ResponseSchema,
  State,
  Manifest,
  ContinuationId,
  "window"
>;

export type SharedContinuationCallable<
  DataSchema extends AnySchema,
  ResponseSchema extends AnySchema,
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Manifest extends ManifestContract<TableOfState<State>>,
  ContinuationId extends string = string,
> = ContinuationCallable<
  DataSchema,
  ResponseSchema,
  State,
  Manifest,
  ContinuationId,
  "shared"
>;

// --- Action Specs ---

export type ActionSpec<
  ParamsSchema extends SchemaLike<RuntimeParams>,
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Manifest extends ManifestContract<TableOfState<State>>,
> = {
  params: ParamsSchema;
  displayName?: string;
  description?: string;
  errorCodes?: readonly string[];
  available?: BivariantCallback<
    ActionAvailabilityArgs<State, Manifest>,
    boolean
  >;
  validate?: BivariantCallback<
    ActionValidateArgs<ParamsSchema, State, Manifest>,
    ValidationIssue | null | undefined
  >;
  reduce: BivariantCallback<
    ActionValidateArgs<ParamsSchema, State, Manifest>,
    ReducerResultLike<State>
  >;
};

export type ActionMap<
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Manifest extends ManifestContract<TableOfState<State>>,
> = Record<string, ActionSpec<SchemaLike<RuntimeParams>, State, Manifest>>;

export type PromptMap = Record<string, AnyPromptSpec>;
export type ContinuationMap<
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Manifest extends ManifestContract<TableOfState<State>>,
> = Record<string, AnyContinuationCallable<State, Manifest>>;
export type WindowMap = Record<string, { id?: string }>;
export type ActionNamesOfPhase<Phase> = Phase extends {
  actions?: infer Actions extends Record<string, unknown>;
}
  ? keyof Actions & string
  : never;
export type PromptRegistryOfPhase<Phase> = Phase extends {
  prompts?: infer Prompts extends PromptMap;
}
  ? Prompts
  : Record<string, never>;
export type ContinuationRegistryOfPhase<Phase> = Phase extends {
  continuations?: infer Continuations extends Record<string, unknown>;
}
  ? Continuations
  : Record<string, never>;
export type WindowRegistryOfPhase<Phase> = Phase extends {
  windows?: infer Windows extends WindowMap;
}
  ? Windows
  : Record<string, never>;

// --- Phase & View Definitions ---

export type PhaseDefinition<
  PhaseStateSchema extends SchemaLike<object>,
  State extends {
    table: RuntimeTableRecord;
    flow: { currentPhase: string };
    phase: object;
  },
  Manifest extends ManifestContract<TableOfState<State>>,
  Actions extends ActionMap<
    ScopedPhaseState<State, z.infer<PhaseStateSchema>>,
    Manifest
  > = Record<string, never>,
  Prompts extends PromptMap = Record<string, never>,
  Continuations extends ContinuationMap<
    ScopedPhaseState<State, z.infer<PhaseStateSchema>>,
    Manifest
  > = Record<string, never>,
  Windows extends WindowMap = Record<string, never>,
> = {
  name?: string;
  kind?: "auto" | "player";
  state: PhaseStateSchema;
  initialState?: (ctx: {
    manifest: Manifest;
    state: State;
    playerIds: PlayerIdOfState<State>[];
    setup: SetupSelectionOfManifest<Manifest> | null;
  }) => z.infer<PhaseStateSchema>;
  enter?: (
    args: PhaseEnterArgs<
      ScopedPhaseState<State, z.infer<PhaseStateSchema>>,
      Manifest
    >,
  ) => ReducerResultLike<
    ScopedPhaseState<State, z.infer<PhaseStateSchema>>
  > | void;
  actions?: Actions;
  prompts?: Prompts;
  continuations?: Continuations;
  windows?: Windows;
  system?: Record<
    string,
    (
      args: SystemArgs<
        ScopedPhaseState<State, z.infer<PhaseStateSchema>>,
        Manifest
      >,
    ) => ReducerResultLike<ScopedPhaseState<State, z.infer<PhaseStateSchema>>>
  >;
  selectors?: Record<string, SelectorFn>;
};

export type ViewDefinition<
  ViewSchema extends AnySchema,
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Manifest extends ManifestContract<TableOfState<State>>,
> = {
  schema: ViewSchema;
  project: (
    args: ActionContext<State, Manifest> &
      RuntimeHelpers<State> & {
        state: State;
        playerId: PlayerIdOfState<State>;
        runtime: State extends {
          runtime: infer RuntimeStateValue;
        }
          ? RuntimeStateValue
          : never;
      },
  ) => z.infer<ViewSchema>;
};
