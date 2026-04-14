import type { z } from "zod";
import type {
  AnySchema,
  RuntimeParams,
  RuntimeTableRecord,
  SchemaLike,
  SelectorFn,
} from "./table";
import type {
  GeneratedManifestContractLike,
  InitContext,
  ManifestContract,
  ReducerManifestContract,
  SetupProfileDefinition,
  StateDefinition,
} from "./manifest";
import type {
  ExactManifestContractOf,
  HiddenSchemaOfContract,
  ManifestContractOf,
  ManifestOf,
  PhaseNameOfContract,
  PlayerIdOfTable,
  PrivateSchemaOfContract,
  PublicSchemaOfContract,
  RuntimeSetupSelection,
  TableOfManifest,
} from "./extract";
import type {
  AnyPromptSpec,
  PromptIdOf,
  PromptResponseOf,
  ReducerGameState,
  ReducerSessionState,
  ReducerResultLike,
  RuntimePhaseState,
} from "./runtime";
import type {
  ActionMap,
  ActionSpec,
  ContinuationMap,
  PhaseDefinition,
  PromptMap,
  SystemArgs,
  ViewDefinition,
  WindowMap,
} from "./spec";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ReducerGameContract<
  Table extends RuntimeTableRecord,
  Manifest extends ReducerManifestContract<
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
> = {
  manifest: Manifest;
  state: StateDefinition<Table, PublicSchema, PrivateSchema, HiddenSchema>;
  /* eslint-enable @typescript-eslint/no-explicit-any */
};

export type ReducerStateForConfig<
  Table extends RuntimeTableRecord,
  PublicSchema extends SchemaLike<object>,
  PrivateSchema extends SchemaLike<object>,
  HiddenSchema extends SchemaLike<object>,
  PhaseName extends string,
  Setup extends RuntimeSetupSelection = RuntimeSetupSelection,
> = ReducerGameState<
  Table,
  z.infer<PublicSchema>,
  z.infer<PrivateSchema>,
  z.infer<HiddenSchema>,
  RuntimePhaseState,
  PhaseName,
  Setup
>;

export type ReducerSessionForConfig<
  Table extends RuntimeTableRecord,
  PublicSchema extends SchemaLike<object>,
  PrivateSchema extends SchemaLike<object>,
  HiddenSchema extends SchemaLike<object>,
  PhaseName extends string,
  Setup extends RuntimeSetupSelection = RuntimeSetupSelection,
> = ReducerSessionState<
  ReducerStateForConfig<
    Table,
    PublicSchema,
    PrivateSchema,
    HiddenSchema,
    PhaseName,
    Setup
  >,
  Setup
>;

export type BaseGameStateOfContract<Contract> = ReducerGameState<
  TableOfManifest<ManifestContractOf<Contract>>,
  z.infer<PublicSchemaOfContract<Contract>>,
  z.infer<PrivateSchemaOfContract<Contract>>,
  z.infer<HiddenSchemaOfContract<Contract>>,
  RuntimePhaseState,
  PhaseNameOfContract<Contract>,
  RuntimeSetupSelection<ManifestContractOf<Contract>>
>;

export type BaseGameSessionOfContract<Contract> = ReducerSessionState<
  BaseGameStateOfContract<Contract>,
  RuntimeSetupSelection<ManifestContractOf<Contract>>
>;

/* eslint-disable @typescript-eslint/no-explicit-any */
export type PhaseMapOf<Contract> = {
  [Name in PhaseNameOfContract<Contract>]: PhaseDefinition<
    SchemaLike<object>,
    BaseGameStateOfContract<Contract>,
    ManifestContractOf<Contract>,
    ActionMap<any, ManifestContractOf<Contract>>,
    PromptMap,
    ContinuationMap<any, ManifestContractOf<Contract>>,
    WindowMap
  >;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export type AnyPhaseDefinitionForContract<Contract> =
  PhaseMapOf<Contract>[PhaseNameOfContract<Contract>];

/* eslint-disable @typescript-eslint/no-explicit-any */
export type PhaseStateMapOfDefinitions<
  Definitions extends Record<
    string,
    PhaseDefinition<
      SchemaLike<object>,
      any,
      any,
      ActionMap<any, any>,
      PromptMap,
      ContinuationMap<any, any>,
      WindowMap
    >
  >,
> = Partial<{
  [Name in keyof Definitions &
    string]: Definitions[Name] extends PhaseDefinition<
    infer PhaseStateSchema,
    infer _State,
    infer _Manifest
  >
    ? z.infer<PhaseStateSchema>
    : never;
}>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-explicit-any */
export type PhaseStateOfDefinitions<
  Definitions extends Record<
    string,
    PhaseDefinition<
      SchemaLike<object>,
      any,
      any,
      ActionMap<any, any>,
      PromptMap,
      ContinuationMap<any, any>,
      WindowMap
    >
  >,
> = {
  [Name in keyof Definitions &
    string]: Definitions[Name] extends PhaseDefinition<
    infer PhaseStateSchema,
    infer _State,
    infer _Manifest
  >
    ? z.infer<PhaseStateSchema>
    : never;
}[keyof Definitions & string];
/* eslint-enable @typescript-eslint/no-explicit-any */

export type ResolvedGameStateOf<
  Contract,
  Definitions extends PhaseMapOf<Contract>,
> = {
  [Name in keyof Definitions & string]: ReducerGameState<
    TableOfManifest<ManifestContractOf<Contract>>,
    z.infer<PublicSchemaOfContract<Contract>>,
    z.infer<PrivateSchemaOfContract<Contract>>,
    z.infer<HiddenSchemaOfContract<Contract>>,
    Definitions[Name] extends PhaseDefinition<
      infer PhaseStateSchema,
      infer _State,
      infer _Manifest
    >
      ? z.infer<PhaseStateSchema>
      : never,
    PhaseNameOfContract<Contract>,
    RuntimeSetupSelection<ManifestContractOf<Contract>>
  > & {
    flow: ReducerGameState<
      TableOfManifest<ManifestContractOf<Contract>>,
      z.infer<PublicSchemaOfContract<Contract>>,
      z.infer<PrivateSchemaOfContract<Contract>>,
      z.infer<HiddenSchemaOfContract<Contract>>,
      PhaseStateOfDefinitions<Definitions>,
      PhaseNameOfContract<Contract>,
      RuntimeSetupSelection<ManifestContractOf<Contract>>
    >["flow"] & {
      currentPhase: Name;
    };
  };
}[keyof Definitions & string];

export type ResolvedGameSessionOf<
  Contract,
  Definitions extends PhaseMapOf<Contract>,
> = ReducerSessionState<
  ResolvedGameStateOf<Contract, Definitions>,
  RuntimeSetupSelection<ManifestContractOf<Contract>>
>;

export type ViewMapOf<Contract> = Record<
  string,
  ViewDefinition<
    AnySchema,
    BaseGameStateOfContract<Contract>,
    ManifestContractOf<Contract>
  >
>;

type PhasesOfDefinition<Definition> = Definition extends {
  phases: infer Definitions extends Record<string, unknown>;
}
  ? Definitions
  : never;

export type ViewsOfDefinition<Definition> = Definition extends {
  views?: infer Views;
}
  ? NonNullable<Views>
  : never;

type NonNeverKeys<Registry> = {
  [Key in keyof Registry]-?: [Registry[Key]] extends [never] ? never : Key;
}[keyof Registry];

export type ViewNamesOfDefinition<Definition> = NonNeverKeys<
  ViewsOfDefinition<Definition>
> &
  string;

export type ViewDefinitionByName<
  Definition,
  ViewName extends ViewNamesOfDefinition<Definition>,
> = ViewsOfDefinition<Definition>[ViewName];

export type ViewOfDefinition<
  Definition,
  ViewName extends ViewNamesOfDefinition<Definition>,
> =
  ViewDefinitionByName<Definition, ViewName> extends ViewDefinition<
    infer ViewSchema,
    infer _State,
    infer _Manifest
  >
    ? z.infer<ViewSchema>
    : never;

export type PhaseNamesOfDefinition<Definition> =
  keyof PhasesOfDefinition<Definition> & string;

export type PhaseDefinitionByName<
  Definition,
  PhaseName extends PhaseNamesOfDefinition<Definition>,
> = PhaseName extends keyof PhasesOfDefinition<Definition> & string
  ? PhasesOfDefinition<Definition>[PhaseName]
  : never;

type ActionRegistriesOfDefinition<Definition> =
  PhasesOfDefinition<Definition>[keyof PhasesOfDefinition<Definition> &
    string] extends {
    actions?: infer Actions;
  }
    ? NonNullable<Actions>
    : never;

export type ActionNamesOfDefinition<Definition> =
  ActionRegistriesOfDefinition<Definition> extends infer Actions
    ? Actions extends Record<string, unknown>
      ? NonNeverKeys<Actions> & string
      : never
    : never;

export type ActionSpecByName<
  Definition,
  ActionName extends ActionNamesOfDefinition<Definition>,
> =
  ActionRegistriesOfDefinition<Definition> extends infer Actions
    ? Actions extends Record<string, unknown>
      ? ActionName extends keyof Actions
        ? [Actions[ActionName]] extends [never]
          ? never
          : Actions[ActionName]
        : never
      : never
    : never;

export type ActionParamsOfDefinition<
  Definition,
  ActionName extends ActionNamesOfDefinition<Definition>,
> =
  ActionSpecByName<Definition, ActionName> extends {
    params: infer ParamsSchema;
  }
    ? ParamsSchema extends SchemaLike<RuntimeParams>
      ? z.infer<ParamsSchema>
      : never
    : never;

type ActionRegistryOfDefinitionPhase<
  Definition,
  PhaseName extends PhaseNamesOfDefinition<Definition>,
> =
  PhaseDefinitionByName<Definition, PhaseName> extends {
    actions?: infer Actions;
  }
    ? NonNullable<Actions>
    : Record<string, never>;

export type ActionNamesOfDefinitionPhase<
  Definition,
  PhaseName extends PhaseNamesOfDefinition<Definition>,
> =
  ActionRegistryOfDefinitionPhase<Definition, PhaseName> extends infer Actions
    ? Actions extends Record<string, unknown>
      ? NonNeverKeys<Actions> & string
      : never
    : never;

export type ActionSpecByNameOfDefinitionPhase<
  Definition,
  PhaseName extends PhaseNamesOfDefinition<Definition>,
  ActionName extends ActionNamesOfDefinitionPhase<Definition, PhaseName>,
> =
  ActionRegistryOfDefinitionPhase<Definition, PhaseName> extends infer Actions
    ? Actions extends Record<string, unknown>
      ? ActionName extends keyof Actions
        ? [Actions[ActionName]] extends [never]
          ? never
          : Actions[ActionName]
        : never
      : never
    : never;

export type ActionParamsOfDefinitionPhase<
  Definition,
  PhaseName extends PhaseNamesOfDefinition<Definition>,
  ActionName extends ActionNamesOfDefinitionPhase<Definition, PhaseName>,
> =
  ActionSpecByNameOfDefinitionPhase<Definition, PhaseName, ActionName> extends {
    params: infer ParamsSchema;
  }
    ? ParamsSchema extends SchemaLike<RuntimeParams>
      ? z.infer<ParamsSchema>
      : never
    : never;

type PromptRegistriesOfDefinition<Definition> =
  PhasesOfDefinition<Definition>[keyof PhasesOfDefinition<Definition> &
    string] extends {
    prompts?: infer Prompts;
  }
    ? NonNullable<Prompts>
    : never;

export type PromptsOfDefinition<Definition> =
  PromptRegistriesOfDefinition<Definition> extends infer Prompts
    ? Prompts extends PromptMap
      ? Prompts[keyof Prompts]
      : never
    : never;

export type PromptIdsOfDefinition<Definition> =
  PromptsOfDefinition<Definition> extends infer Prompt
    ? Prompt extends AnyPromptSpec
      ? PromptIdOf<Prompt>
      : never
    : never;

export type PromptByIdOfDefinition<
  Definition,
  PromptId extends PromptIdsOfDefinition<Definition>,
> = Extract<PromptsOfDefinition<Definition>, { id: PromptId }>;

export type PromptResponseOfDefinition<
  Definition,
  PromptId extends PromptIdsOfDefinition<Definition>,
> =
  PromptByIdOfDefinition<Definition, PromptId> extends infer Prompt
    ? Prompt extends AnyPromptSpec
      ? PromptResponseOf<Prompt>
      : never
    : never;

type ContinuationsOfDefinition<Definition> =
  PhasesOfDefinition<Definition>[keyof PhasesOfDefinition<Definition> &
    string] extends {
    continuations?: infer Continuations;
  }
    ? Continuations extends Record<string, unknown>
      ? Continuations[keyof Continuations & string]
      : never
    : never;

type WindowResponsesOfDefinition<Definition> =
  ContinuationsOfDefinition<Definition> extends infer Continuation
    ? Continuation extends {
        source: "window";
        responseSchema: infer ResponseSchema;
      }
      ? ResponseSchema extends AnySchema
        ? z.infer<ResponseSchema>
        : never
      : never
    : never;

export type WindowIdsOfDefinition<Definition> =
  WindowResponsesOfDefinition<Definition> extends { windowId: infer WindowId }
    ? Extract<WindowId, string>
    : never;

type WindowResponseByWindowId<
  Definition,
  WindowId extends WindowIdsOfDefinition<Definition>,
> = Extract<WindowResponsesOfDefinition<Definition>, { windowId: WindowId }>;

export type WindowActionNamesOfDefinition<
  Definition,
  WindowId extends WindowIdsOfDefinition<Definition>,
> =
  WindowResponseByWindowId<Definition, WindowId> extends {
    actionType: infer ActionType;
  }
    ? Extract<ActionType, string>
    : never;

export type WindowActionParamsOfDefinition<
  Definition,
  WindowId extends WindowIdsOfDefinition<Definition>,
  ActionName extends WindowActionNamesOfDefinition<Definition, WindowId>,
> =
  Extract<
    WindowResponseByWindowId<Definition, WindowId>,
    { actionType: ActionName }
  > extends { params: infer Params }
    ? Params
    : undefined;

/* eslint-disable @typescript-eslint/no-explicit-any */
export type GameStateOf<Source> =
  Source extends ReducerGameDefinition<
    infer Contract,
    infer Definitions,
    infer _Views
  >
    ? ResolvedGameStateOf<Contract, Definitions>
    : Source extends ReducerGameContract<any, any, any, any, any>
      ? BaseGameStateOfContract<Source>
      : never;
/* eslint-enable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-explicit-any */
export type ReducerGameContractLike = {
  manifest: any;
  state: StateDefinition<
    RuntimeTableRecord,
    SchemaLike<object>,
    SchemaLike<object>,
    SchemaLike<object>
  >;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

type InitialStateContextOf<Contract extends ReducerGameContractLike> =
  InitContext<
    TableOfManifest<ManifestOf<Contract>>,
    ExactManifestContractOf<Contract>
  >;

export type InitialStateCallbacks<Contract extends ReducerGameContractLike> = {
  public?: (
    ctx: InitialStateContextOf<Contract>,
  ) => z.infer<PublicSchemaOfContract<Contract>>;
  private?: (
    ctx: InitialStateContextOf<Contract> & {
      playerId: PlayerIdOfTable<TableOfManifest<ManifestOf<Contract>>>;
    },
  ) => z.infer<PrivateSchemaOfContract<Contract>>;
  hidden?: (
    ctx: InitialStateContextOf<Contract>,
  ) => z.infer<HiddenSchemaOfContract<Contract>>;
};

export type ReducerGameDefinition<
  Contract extends ReducerGameContractLike,
  Definitions extends PhaseMapOf<Contract>,
  Views extends ViewMapOf<Contract> = Record<string, never>,
> = {
  contract: Contract;
  initial?: InitialStateCallbacks<NoInfer<Contract>>;
  initialPhase?: keyof Definitions & string;
  setupProfiles?: Record<
    string,
    SetupProfileDefinition<
      keyof Definitions & string,
      ExactManifestContractOf<Contract>
    >
  >;
  phases: Definitions;
  views?: Views;
  root?: {
    system?: Record<
      string,
      (
        args: SystemArgs<
          BaseGameStateOfContract<Contract>,
          ManifestContractOf<Contract>
        >,
      ) => ReducerResultLike<BaseGameStateOfContract<Contract>>
    >;
    selectors?: Record<string, SelectorFn>;
  };
};

export type AnyReducerGameDefinition = ReducerGameDefinition<
  ReducerGameContractLike,
  PhaseMapOf<ReducerGameContractLike>,
  ViewMapOf<ReducerGameContractLike>
>;
