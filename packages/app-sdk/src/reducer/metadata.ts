import { z } from "zod";
import type {
  ActionMap,
  ActionSpec,
  AnyContinuationCallable,
  AnyPromptSpec,
  AnySchema,
  BaseGameStateOfContract,
  ContinuationMap,
  ManifestContract,
  ManifestContractOf,
  PhaseDefinition,
  PhaseMapOf,
  PromptMap,
  ReducerGameContractLike,
  ReducerGameDefinition,
  RuntimeTableRecord,
  RuntimeParams,
  SchemaLike,
  TableOfState,
  ViewMapOf,
  WindowMap,
} from "./model";

type ActionDefinitionMetadata = {
  actionType: string;
  displayName: string;
  description?: string;
  parameters: Array<{
    name: string;
    type:
      | "cardId"
      | "cardType"
      | "deckId"
      | "playerId"
      | "string"
      | "number"
      | "boolean"
      | "zoneId"
      | "tokenId"
      | "tileId"
      | "edgeId"
      | "vertexId"
      | "spaceId"
      | "pieceId"
      | "resourceId";
    required?: boolean;
    array?: boolean;
    minLength?: number;
    maxLength?: number;
    cardSetId?: string;
    description?: string;
  }>;
  errorCodes?: string[];
};

export type ReducerMetadataCollection<
  State extends {
    table: RuntimeTableRecord;
    flow: { currentPhase: string };
    phase: object;
  },
  Manifest extends ManifestContract<TableOfState<State>>,
> = {
  phaseEntries: Array<
    [
      string,
      PhaseDefinition<
        SchemaLike<object>,
        State,
        Manifest,
        ActionMap<State, Manifest>,
        PromptMap,
        ContinuationMap<State, Manifest>,
        WindowMap
      >,
    ]
  >;
  promptMap: Map<string, AnyPromptSpec>;
  continuationMap: Map<string, AnyContinuationCallable<State, Manifest>>;
  windowMap: Map<string, { id: string }>;
  actionMetadataByPhase: Map<string, Record<string, ActionDefinitionMetadata>>;
  actions: ActionDefinitionMetadata[];
  prompts: Record<string, { id: string }>;
  views: Record<string, { id: string }>;
  windows: Record<string, { id: string }>;
  continuations: Record<string, { id: string }>;
  metadata: {
    phaseNames: string[];
    views: string[];
    actionsByPhase: Record<string, string[]>;
  };
};

function nextDisplayName(actionType: string): string {
  return actionType
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getParamShape(schema: AnySchema): Record<string, AnySchema> {
  if (!(schema instanceof z.ZodObject)) {
    return {};
  }
  return schema.shape;
}

function unwrapSchema(schema: AnySchema): {
  schema: AnySchema;
  required: boolean;
  array: boolean;
  minLength?: number;
  maxLength?: number;
} {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    const inner = unwrapSchema(schema.unwrap() as AnySchema);
    return { ...inner, required: false };
  }
  if (schema instanceof z.ZodArray) {
    const inner = unwrapSchema(schema.element as AnySchema);
    return {
      ...inner,
      required: true,
      array: true,
    };
  }
  return {
    schema,
    required: true,
    array: false,
  };
}

function detectParameterType(
  schema: AnySchema,
  manifest: ManifestContract<RuntimeTableRecord>,
): ActionDefinitionMetadata["parameters"][number]["type"] {
  for (const [key, value] of Object.entries(manifest.ids)) {
    if (value === schema) {
      switch (key) {
        case "cardId":
          return "cardId";
        case "cardType":
          return "cardType";
        case "deckId":
          return "deckId";
        case "playerId":
          return "playerId";
        case "zoneId":
          return "zoneId";
        case "tokenId":
          return "tokenId";
        case "tileId":
          return "tileId";
        case "edgeId":
          return "edgeId";
        case "vertexId":
          return "vertexId";
        case "spaceId":
          return "spaceId";
        case "pieceId":
          return "pieceId";
        case "resourceId":
          return "resourceId";
        default:
          break;
      }
    }
  }

  if (
    schema instanceof z.ZodString ||
    schema instanceof z.ZodLiteral ||
    schema instanceof z.ZodEnum
  ) {
    return "string";
  }
  if (schema instanceof z.ZodNumber) {
    return "number";
  }
  if (schema instanceof z.ZodBoolean) {
    return "boolean";
  }

  return "string";
}

function toActionDefinition<
  State extends { table: RuntimeTableRecord; flow: { currentPhase: string } },
  Manifest extends ManifestContract<TableOfState<State>>,
>(
  actionType: string,
  action: ActionSpec<SchemaLike<RuntimeParams>, State, Manifest>,
  manifest: Manifest,
): ActionDefinitionMetadata {
  const paramsShape = getParamShape(action.params);
  const parameters = Object.entries(paramsShape).map(([name, rawSchema]) => {
    const normalized = unwrapSchema(rawSchema);
    return {
      name,
      type: detectParameterType(normalized.schema, manifest),
      required: normalized.required,
      array: normalized.array,
      minLength: normalized.minLength,
      maxLength: normalized.maxLength,
    };
  });

  return {
    actionType,
    displayName: action.displayName ?? nextDisplayName(actionType),
    description: action.description,
    parameters,
    errorCodes: action.errorCodes ? [...action.errorCodes] : undefined,
  };
}

export function collectReducerMetadata<
  Contract extends ReducerGameContractLike,
  Definitions extends PhaseMapOf<Contract>,
  Views extends ViewMapOf<Contract>,
>(
  definition: ReducerGameDefinition<Contract, Definitions, Views>,
): ReducerMetadataCollection<
  BaseGameStateOfContract<Contract>,
  ManifestContractOf<Contract>
> {
  type State = BaseGameStateOfContract<Contract>;
  type Manifest = ManifestContractOf<Contract>;

  const phaseEntries = Object.entries(definition.phases) as Array<
    [
      keyof Definitions & string,
      PhaseDefinition<
        SchemaLike<object>,
        State,
        Manifest,
        ActionMap<State, Manifest>,
        PromptMap,
        ContinuationMap<State, Manifest>,
        WindowMap
      >,
    ]
  >;
  const promptMap = new Map<string, AnyPromptSpec>();
  const continuationMap = new Map<
    string,
    AnyContinuationCallable<State, Manifest>
  >();
  const windowMap = new Map<string, { id: string }>();
  const actionMetadataByPhase = new Map<
    string,
    Record<string, ActionDefinitionMetadata>
  >();

  for (const [phaseName, phase] of phaseEntries) {
    const actionDefinitions: Record<string, ActionDefinitionMetadata> = {};
    for (const [actionName, action] of Object.entries(phase.actions ?? {})) {
      actionDefinitions[actionName] = toActionDefinition(
        actionName,
        action,
        definition.contract.manifest,
      );
    }
    actionMetadataByPhase.set(phaseName, actionDefinitions);

    for (const [promptKey, prompt] of Object.entries(phase.prompts ?? {})) {
      promptMap.set(prompt.id ?? promptKey, prompt);
    }
    for (const [continuationKey, continuation] of Object.entries(
      phase.continuations ?? {},
    )) {
      const resolvedId = continuation.id ?? continuationKey;
      continuationMap.set(
        resolvedId,
        continuation as AnyContinuationCallable<State, Manifest>,
      );
    }
    for (const [windowKey, window] of Object.entries(phase.windows ?? {})) {
      windowMap.set(window.id ?? windowKey, {
        id: window.id ?? windowKey,
      });
    }
  }

  return {
    phaseEntries,
    promptMap,
    continuationMap,
    windowMap,
    actionMetadataByPhase,
    actions: phaseEntries.flatMap(([phaseName]) =>
      Object.values(actionMetadataByPhase.get(phaseName) ?? {}),
    ),
    prompts: Object.fromEntries(
      Array.from(promptMap.values()).map((prompt) => [
        prompt.id,
        { id: prompt.id },
      ]),
    ),
    views: Object.fromEntries(
      Object.keys(definition.views ?? {}).map((viewId) => [
        viewId,
        { id: viewId },
      ]),
    ),
    windows: Object.fromEntries(
      Array.from(windowMap.values()).map((window) => [
        window.id,
        { id: window.id },
      ]),
    ),
    continuations: Object.fromEntries(
      Array.from(continuationMap.entries()).map(([id]) => [id, { id }]),
    ),
    metadata: {
      phaseNames: phaseEntries.map(([phaseName]) => phaseName),
      views: Object.keys(definition.views ?? {}),
      actionsByPhase: Object.fromEntries(
        phaseEntries.map(([phaseName]) => [
          phaseName,
          Object.keys(actionMetadataByPhase.get(phaseName) ?? {}),
        ]),
      ),
    },
  };
}
