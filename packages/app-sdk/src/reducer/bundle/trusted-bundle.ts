import { collectReducerMetadata } from "../metadata";
import { createReducerEffects } from "../effects";
import {
  assertCardAllowedInZone,
  cloneRuntimeTable,
  ensureArray,
} from "../table-ops";
import { nextRandomInt } from "../rng";
import { formatIssue, safeParseOrThrow } from "../parse-utils";
import type {
  BaseGameSessionOfContract,
  ActionMap,
  ActionContext,
  AnyPromptSpec,
  BaseGameStateOfContract,
  ContinuationMap,
  ExactManifestContractOf,
  ManifestContractOf,
  PhaseDefinition,
  PhaseMapOf,
  PhaseNamesOfDefinition,
  PlayerIdOfState,
  PromptMap,
  ReducerGameContractLike,
  ReducerGameDefinition,
  ReducerReject,
  ReducerResult,
  ReducerResultLike,
  ReducerRuntimeEffectForState,
  ReducerValidationResult,
  PromptInstanceId,
  RuntimeSetupSelection,
  RuntimeParams,
  RuntimePromptInstance,
  SchemaLike,
  RuntimeWindowInstance,
  ViewMapOf,
  WindowMap,
  WindowInstanceId,
} from "../model";
import type { DispatchTraceEntry, TrustedRuntimeInput } from "../core/types";
import { createReducerEffectEngine } from "../engine/effect-engine";

function acceptResult<State>(
  state: State,
  effects: ReducerRuntimeEffectForState<State>[] = [],
) {
  return {
    type: "accept" as const,
    state,
    effects,
  };
}

function rejectResult(errorCode: string, message?: string): ReducerReject {
  return {
    type: "reject",
    errorCode,
    message,
  };
}

function normalizeResult<State>(
  result: ReducerResultLike<State> | void,
  fallbackState: State,
): ReducerResult<State> {
  if (result == null) {
    return acceptResult(fallbackState);
  }
  if (typeof result === "object" && "type" in result) {
    return result;
  }
  if (typeof result === "object" && "state" in result) {
    return acceptResult(result.state, result.effects ?? []);
  }
  return acceptResult(fallbackState);
}

function makeValidationError(
  errorCode: string,
  message?: string,
): ReducerValidationResult {
  return {
    valid: false,
    errorCode,
    message,
  };
}

export function createTrustedReducerBundle<
  Contract extends ReducerGameContractLike,
  Definitions extends PhaseMapOf<Contract>,
  Views extends ViewMapOf<Contract>,
>(definition: ReducerGameDefinition<Contract, Definitions, Views>) {
  type Definition = ReducerGameDefinition<Contract, Definitions, Views>;
  type DefContract = Contract;
  type DomainState = BaseGameStateOfContract<Contract>;
  type SessionState = BaseGameSessionOfContract<Contract>;
  type State = DomainState & {
    runtime: SessionState["runtime"];
  };
  type Manifest = ManifestContractOf<DefContract>;
  type ExactManifest = ExactManifestContractOf<DefContract>;
  type PhaseName = PhaseNamesOfDefinition<Definition>;
  type PlayerId = PlayerIdOfState<DomainState>;
  type ReducerInput = TrustedRuntimeInput<PlayerId>;

  function toDomainState(state: State): DomainState {
    const { runtime: _runtime, ...domain } = state as State & {
      runtime: SessionState["runtime"];
    };
    return domain as DomainState;
  }

  function toCombinedState(session: SessionState): State {
    return {
      ...session.domain,
      runtime: session.runtime,
    } as State;
  }

  function toSessionState(state: State): SessionState {
    return {
      domain: toDomainState(state),
      runtime: state.runtime,
    } as SessionState;
  }

  const metadata = collectReducerMetadata(definition);
  const phaseEntries = metadata.phaseEntries as Array<
    [PhaseName, PhaseDefinition<SchemaLike<object>, DomainState, Manifest>]
  >;
  const defaultInitialPhase = (definition.initialPhase ??
    phaseEntries[0]?.[0]) as PhaseName | undefined;
  if (!defaultInitialPhase) {
    throw new Error("Reducer-native games must define at least one phase.");
  }

  const manifestSetupProfilesById =
    definition.contract.manifest.setupProfilesById;
  const manifestSetupProfileIds = Object.keys(manifestSetupProfilesById).sort();
  const reducerSetupProfiles = definition.setupProfiles ?? {};
  const reducerSetupProfileIds = Object.keys(reducerSetupProfiles).sort();
  if (
    manifestSetupProfileIds.length !== reducerSetupProfileIds.length ||
    manifestSetupProfileIds.some(
      (profileId, index) => reducerSetupProfileIds[index] !== profileId,
    )
  ) {
    throw new Error(
      `Reducer setupProfiles must exactly match manifest setupProfiles. Manifest=[${manifestSetupProfileIds.join(", ")}], reducer=[${reducerSetupProfileIds.join(", ")}].`,
    );
  }

  const promptMap = metadata.promptMap as Map<string, AnyPromptSpec>;
  const continuationMap = metadata.continuationMap as Map<
    string,
    ContinuationMap<DomainState, Manifest>[string]
  >;
  const actionMetadataByPhase = metadata.actionMetadataByPhase as Map<
    PhaseName,
    Record<string, (typeof metadata.actions)[number]>
  >;

  const runtimeHelpers = {
    accept: acceptResult<DomainState>,
    reject: rejectResult,
    effects: createReducerEffects<DomainState>(),
  };

  function buildContext(state: State): ActionContext<DomainState, Manifest> {
    return {
      currentPhase: state.flow.currentPhase as ActionContext<
        DomainState,
        Manifest
      >["currentPhase"],
      manifest: definition.contract.manifest,
      playerOrder: [...state.table.playerOrder] as PlayerId[],
      activePlayers: [...state.flow.activePlayers] as PlayerId[],
      runtime: state.runtime,
      setup: (state.runtime.setup
        ? {
            profileId: state.runtime.setup.profileId,
            optionValues: {
              ...state.runtime.setup.optionValues,
            },
          }
        : null) as ActionContext<State, Manifest>["setup"],
      promptByInstanceId<PromptId extends string>(
        promptId: PromptInstanceId<PromptId>,
      ) {
        return (
          (state.runtime.prompts.find(
            (prompt: RuntimePromptInstance<PlayerId>) => prompt.id === promptId,
          ) as RuntimePromptInstance<PlayerId, PromptId> | undefined) ?? null
        );
      },
      windowByInstanceId<WindowId extends string>(
        windowId: WindowInstanceId<WindowId>,
      ) {
        return (
          (state.runtime.windows.find(
            (window: RuntimeWindowInstance<PlayerId>) => window.id === windowId,
          ) as RuntimeWindowInstance<PlayerId, WindowId> | undefined) ?? null
        );
      },
    };
  }

  function buildRuntimeArgs<Extra extends object>(state: State, extra: Extra) {
    return {
      ...buildContext(state),
      ...runtimeHelpers,
      runtime: state.runtime,
      ...extra,
    };
  }

  function phaseByName(
    phaseName: PhaseName,
  ): PhaseDefinition<
    SchemaLike<object>,
    DomainState,
    Manifest,
    ActionMap<DomainState, Manifest>,
    PromptMap,
    ContinuationMap<DomainState, Manifest>,
    WindowMap
  > {
    const phase = definition.phases[phaseName];
    if (!phase) {
      throw new Error(`Unknown reducer phase '${phaseName}'.`);
    }
    return phase;
  }

  function phaseFor(
    state: State,
  ): PhaseDefinition<
    SchemaLike<object>,
    DomainState,
    Manifest,
    ActionMap<DomainState, Manifest>,
    PromptMap,
    ContinuationMap<DomainState, Manifest>,
    WindowMap
  > {
    return phaseByName(state.flow.currentPhase as PhaseName);
  }

  function resolveSelectedSetup(
    setup: RuntimeSetupSelection<Manifest> | null | undefined,
  ): State["runtime"]["setup"] {
    if (!setup) {
      return null;
    }
    const manifestProfile = manifestSetupProfilesById[setup.profileId];
    if (!manifestProfile) {
      throw new Error(`Unknown setup profile '${setup.profileId}'.`);
    }
    return {
      profileId: setup.profileId,
      optionValues: {
        ...(manifestProfile.optionValues ?? {}),
        ...(setup.optionValues ?? {}),
      },
    };
  }

  function resolveInitialPhase(setup: State["runtime"]["setup"]): PhaseName {
    const setupProfile = setup ? reducerSetupProfiles[setup.profileId] : null;
    const resolvedPhase = (setupProfile?.initialPhase ??
      defaultInitialPhase ??
      phaseEntries[0]?.[0]) as PhaseName | undefined;
    if (!resolvedPhase) {
      throw new Error("Reducer-native games must define at least one phase.");
    }
    if (!definition.phases[resolvedPhase]) {
      throw new Error(`Unknown initial phase '${resolvedPhase}'.`);
    }
    return resolvedPhase;
  }

  function initPhaseState(
    state: State,
    phaseName: PhaseName,
    playerIds: PlayerId[],
  ): State {
    const phase = phaseByName(phaseName);
    const phaseState = phase.initialState
      ? phase.initialState({
          manifest: definition.contract.manifest,
          state,
          playerIds,
          setup: state.runtime.setup,
        })
      : safeParseOrThrow(phase.state, {}, `phase:${phaseName}:initialState`);
    return {
      ...state,
      phase: safeParseOrThrow(phase.state, phaseState, `phase:${phaseName}`),
      flow: {
        ...state.flow,
        currentPhase: phaseName,
      },
    };
  }

  function initializePhaseResult(
    state: State,
    phaseName: PhaseName,
  ): {
    state: State;
    effects: ReducerRuntimeEffectForState<State>[];
  } {
    const playerIds = buildContext(state).playerOrder;
    const workingState = initPhaseState(state, phaseName, playerIds);
    const phase = phaseByName(phaseName);
    if (!phase.enter) {
      return {
        state: workingState,
        effects: [],
      };
    }
    const entered = normalizeResult(
      phase.enter(
        buildRuntimeArgs(workingState, {
          event: "transition" as const,
          state: toDomainState(workingState),
        }),
      ),
      toDomainState(workingState),
    );
    if (entered.type === "reject") {
      throw new Error(
        entered.message ??
          `Reducer phase '${phaseName}' rejected during phase initialization.`,
      );
    }
    return {
      state: {
        ...entered.state,
        runtime: workingState.runtime,
      } as State,
      effects: entered.effects ?? [],
    };
  }

  function initializePhaseInternal(state: State, phaseName: PhaseName): State {
    const initialized = initializePhaseResult(state, phaseName);
    return effectEngine.drainEffects(initialized.state, initialized.effects);
  }

  function closePromptInternal(
    state: State,
    promptId: string,
  ): {
    state: State;
    trace: DispatchTraceEntry<State, PlayerId, ReducerInput>[];
  } {
    const existing = state.runtime.prompts.find(
      (prompt) => prompt.id === promptId,
    );
    if (!existing) {
      return {
        state,
        trace: [],
      };
    }
    return {
      state: {
        ...state,
        runtime: {
          ...state.runtime,
          prompts: state.runtime.prompts.filter(
            (prompt) => prompt.id !== promptId,
          ),
        },
      },
      trace: [
        {
          type: "promptLifecycle",
          action: "closed",
          promptId,
          playerId: existing.to,
        },
      ],
    };
  }

  function applyWindowBookkeeping(
    state: State,
    input: Extract<ReducerInput, { kind: "windowAction" }>,
  ): {
    state: State;
    trace: DispatchTraceEntry<State, PlayerId, ReducerInput>[];
  } {
    const window = state.runtime.windows.find(
      (candidate) => candidate.id === input.windowId,
    );
    if (!window) {
      return {
        state,
        trace: [],
      };
    }

    const updatedWindow =
      window.closePolicy.type === "allResponded" ||
      window.closePolicy.type === "firstValidAction"
        ? {
            ...window,
            respondedPlayerIds: Array.from(
              new Set([...(window.respondedPlayerIds ?? []), input.playerId]),
            ),
          }
        : window.closePolicy.type === "allPassInSequence"
          ? {
              ...window,
              passedPlayerIds:
                input.actionType === "pass"
                  ? [...(window.passedPlayerIds ?? []), input.playerId]
                  : [],
            }
          : window;

    const addressedTo = updatedWindow.addressedTo ?? [];
    const respondedPlayerIds = updatedWindow.respondedPlayerIds ?? [];
    const passedPlayerIds = updatedWindow.passedPlayerIds ?? [];

    const shouldClose =
      updatedWindow.closePolicy.type === "allResponded"
        ? addressedTo.length > 0 &&
          addressedTo.every((playerId) => respondedPlayerIds.includes(playerId))
        : updatedWindow.closePolicy.type === "firstValidAction"
          ? input.actionType !== "pass"
          : updatedWindow.closePolicy.type === "allPassInSequence"
            ? addressedTo.length > 0 &&
              passedPlayerIds.length === addressedTo.length &&
              passedPlayerIds.every(
                (playerId, index) => playerId === addressedTo[index],
              )
            : false;

    if (!shouldClose) {
      return {
        state: {
          ...state,
          runtime: {
            ...state.runtime,
            windows: state.runtime.windows.map((existingWindow) =>
              existingWindow.id === input.windowId
                ? updatedWindow
                : existingWindow,
            ),
          },
        },
        trace: [],
      };
    }

    return {
      state: {
        ...state,
        runtime: {
          ...state.runtime,
          windows: state.runtime.windows.filter(
            (existingWindow) => existingWindow.id !== input.windowId,
          ),
        },
      },
      trace: [
        {
          type: "windowLifecycle",
          action: "closed",
          windowId: updatedWindow.id,
          playerId: input.playerId,
        },
      ],
    };
  }

  function applyEffect(
    state: State,
    effect: ReducerRuntimeEffectForState<State>,
  ): {
    state: State;
    queuedInputs: ReducerInput[];
    queuedEffects: ReducerRuntimeEffectForState<State>[];
    trace: DispatchTraceEntry<State, PlayerId, ReducerInput>[];
  } {
    switch (effect.type) {
      case "openPrompt": {
        const nextInstanceId = state.runtime.nextInstanceId ?? 1;
        const promptId = `rt-${nextInstanceId}` as PromptInstanceId;
        return {
          state: {
            ...state,
            runtime: {
              ...state.runtime,
              prompts: [
                ...state.runtime.prompts,
                {
                  id: promptId,
                  promptId: effect.prompt,
                  to: effect.to,
                  title: effect.title,
                  payload: effect.payload,
                  options: effect.options,
                  resume: effect.resume,
                },
              ],
              nextInstanceId: nextInstanceId + 1,
            },
          },
          queuedInputs: [],
          queuedEffects: [],
          trace: [
            {
              type: "promptLifecycle",
              action: "opened",
              promptId,
              playerId: effect.to,
            },
          ],
        };
      }
      case "closePrompt":
        return {
          ...closePromptInternal(state, effect.promptId),
          queuedInputs: [],
          queuedEffects: [],
        };
      case "openWindow": {
        const nextInstanceId = state.runtime.nextInstanceId ?? 1;
        const windowId = `rt-${nextInstanceId}` as WindowInstanceId;
        return {
          state: {
            ...state,
            runtime: {
              ...state.runtime,
              windows: [
                ...state.runtime.windows,
                {
                  id: windowId,
                  windowId: effect.window,
                  closePolicy: effect.closePolicy ?? { type: "manual" },
                  addressedTo: effect.addressedTo
                    ? [...effect.addressedTo]
                    : [],
                  payload: effect.payload,
                  resume: effect.resume,
                  respondedPlayerIds: [],
                  passedPlayerIds: [],
                },
              ],
              nextInstanceId: nextInstanceId + 1,
            },
          },
          queuedInputs: [],
          queuedEffects: [],
          trace: [
            {
              type: "windowLifecycle",
              action: "opened",
              windowId,
            },
          ],
        };
      }
      case "closeWindow": {
        const existing = state.runtime.windows.find(
          (window) => window.id === effect.windowId,
        );
        return {
          state: {
            ...state,
            runtime: {
              ...state.runtime,
              windows: state.runtime.windows.filter(
                (window) => window.id !== effect.windowId,
              ),
            },
          },
          queuedInputs: [],
          queuedEffects: [],
          trace: existing
            ? [
                {
                  type: "windowLifecycle",
                  action: "closed",
                  windowId: effect.windowId,
                },
              ]
            : [],
        };
      }
      case "rollDie": {
        const die = state.table.dice[effect.dieId];
        if (!die) {
          throw new Error(`Cannot roll unknown die '${effect.dieId}'.`);
        }
        if (!Number.isInteger(die.sides) || die.sides <= 0) {
          throw new Error(
            `Cannot roll die '${effect.dieId}' with invalid sides '${die.sides}'.`,
          );
        }
        const nextTable = cloneRuntimeTable(state.table);
        const [rollOffset, nextRng] = nextRandomInt(
          die.sides,
          state.runtime.rng,
        );
        nextTable.dice[effect.dieId] = {
          ...die,
          value: rollOffset + 1,
        };
        return {
          state: {
            ...state,
            table: nextTable,
            runtime: {
              ...state.runtime,
              rng: nextRng,
            },
          },
          queuedInputs: [],
          queuedEffects: [],
          trace: [
            {
              type: "rngConsumption",
              operation: "rollDie",
              traceEntry: nextRng.trace[nextRng.trace.length - 1] ?? "",
            },
          ],
        };
      }
      case "shuffleSharedZone": {
        const nextTable = cloneRuntimeTable(state.table);
        const deckCards = [...ensureArray(nextTable.decks[effect.zoneId])];
        let nextRng = state.runtime.rng;
        const trace: DispatchTraceEntry<State, PlayerId, ReducerInput>[] = [];
        for (
          let lastIndex = deckCards.length - 1;
          lastIndex > 0;
          lastIndex -= 1
        ) {
          const [swapIndex, updatedRng] = nextRandomInt(lastIndex + 1, nextRng);
          trace.push({
            type: "rngConsumption",
            operation: "shuffleSharedZone",
            traceEntry: updatedRng.trace[updatedRng.trace.length - 1] ?? "",
          });
          nextRng = updatedRng;
          const current = deckCards[lastIndex]!;
          deckCards[lastIndex] = deckCards[swapIndex]!;
          deckCards[swapIndex] = current;
        }
        nextTable.decks[effect.zoneId] = deckCards;
        nextTable.zones.shared[effect.zoneId] = [...deckCards];
        for (const [index, cardId] of deckCards.entries()) {
          const currentLocation = nextTable.componentLocations[cardId];
          nextTable.componentLocations[cardId] =
            currentLocation?.type === "InDeck" ||
            currentLocation?.type === "InZone"
              ? {
                  ...currentLocation,
                  type: "InDeck",
                  deckId: effect.zoneId,
                  playedBy: currentLocation.playedBy ?? null,
                  position: index,
                }
              : {
                  type: "InDeck",
                  deckId: effect.zoneId,
                  playedBy: null,
                  position: index,
                };
        }
        return {
          state: {
            ...state,
            table: nextTable,
            runtime: {
              ...state.runtime,
              rng: nextRng,
            },
          },
          queuedInputs: [],
          queuedEffects: [],
          trace,
        };
      }
      case "dealCardsToPlayerZone": {
        const nextTable = cloneRuntimeTable(state.table);
        const publicHands = new Set(
          Object.entries(nextTable.handVisibility)
            .filter(([, mode]) => mode === "all" || mode === "public")
            .map(([handId]) => handId),
        );

        for (let index = 0; index < effect.count; index += 1) {
          const nextCard = ensureArray(nextTable.decks[effect.fromZoneId])[0];
          if (!nextCard) {
            break;
          }
          nextTable.decks[effect.fromZoneId] = ensureArray(
            nextTable.decks[effect.fromZoneId],
          ).slice(1);
          nextTable.zones.shared[effect.fromZoneId] = [
            ...ensureArray(nextTable.decks[effect.fromZoneId]),
          ];
          const handByPlayer = { ...(nextTable.hands[effect.toZoneId] ?? {}) };
          const nextHand = [
            ...ensureArray(handByPlayer[effect.playerId]),
            nextCard,
          ];
          assertCardAllowedInZone(nextTable, effect.toZoneId, nextCard);
          handByPlayer[effect.playerId] = nextHand;
          nextTable.hands[effect.toZoneId] = handByPlayer;
          const zoneByPlayer = {
            ...(nextTable.zones.perPlayer[effect.toZoneId] ?? {}),
          };
          zoneByPlayer[effect.playerId] = [...nextHand];
          nextTable.zones.perPlayer[effect.toZoneId] = zoneByPlayer;
          nextTable.componentLocations[nextCard] = {
            type: "InHand",
            handId: effect.toZoneId,
            playerId: effect.playerId,
            position: nextHand.length - 1,
          };
          nextTable.ownerOfCard[nextCard] = effect.playerId;
          nextTable.visibility[nextCard] = publicHands.has(effect.toZoneId)
            ? {
                faceUp: true,
              }
            : {
                faceUp: false,
                visibleTo: [effect.playerId],
              };
        }
        return {
          state: {
            ...state,
            table: nextTable,
          },
          queuedInputs: [],
          queuedEffects: [],
          trace: [],
        };
      }
      case "sample": {
        const remaining = [...effect.from];
        const samples: State["runtime"]["effectQueue"][number] extends {
          type: "sample";
          from: readonly (infer SampleCardId)[];
        }
          ? SampleCardId[]
          : string[] = [];
        let nextRng = state.runtime.rng;
        const trace: DispatchTraceEntry<State, PlayerId, ReducerInput>[] = [];
        const count = effect.count ?? 1;
        for (
          let index = 0;
          index < Math.min(count, remaining.length);
          index += 1
        ) {
          const [selectedIndex, updatedRng] = nextRandomInt(
            remaining.length,
            nextRng,
          );
          trace.push({
            type: "rngConsumption",
            operation: "sample",
            traceEntry: updatedRng.trace[updatedRng.trace.length - 1] ?? "",
          });
          nextRng = updatedRng;
          samples.push(remaining.splice(selectedIndex, 1)[0]!);
        }
        return {
          state: {
            ...state,
            runtime: {
              ...state.runtime,
              rng: nextRng,
            },
          },
          queuedInputs: [
            {
              kind: "system",
              event: effect.resume.id,
              payload: {
                continuation: effect.resume.data,
                sampleId: effect.sampleId,
                samples,
              },
            },
          ],
          queuedEffects: [],
          trace,
        };
      }
      case "randomInt": {
        if (!Number.isInteger(effect.min) || !Number.isInteger(effect.max)) {
          throw new Error("effects.randomInt(...) requires integer bounds.");
        }
        if (effect.max < effect.min) {
          throw new Error(
            `effects.randomInt(...) received max < min (${effect.max} < ${effect.min}).`,
          );
        }
        const [offset, nextRng] = nextRandomInt(
          effect.max - effect.min + 1,
          state.runtime.rng,
        );
        const value = effect.min + offset;
        return {
          state: {
            ...state,
            runtime: {
              ...state.runtime,
              rng: nextRng,
            },
          },
          queuedInputs: [
            {
              kind: "system",
              event: effect.resume.id,
              payload: {
                continuation: effect.resume.data,
                randomIntId: effect.randomIntId,
                value,
              },
            },
          ],
          queuedEffects: [],
          trace: [
            {
              type: "rngConsumption",
              operation: "randomInt",
              traceEntry: nextRng.trace[nextRng.trace.length - 1] ?? "",
            },
          ],
        };
      }
      case "dispatchSystem":
        return {
          state,
          queuedInputs: [
            {
              kind: "system",
              event: effect.event,
              payload: effect.payload ?? {},
            },
          ],
          queuedEffects: [],
          trace: [],
        };
      case "scheduleTiming":
        return {
          state: {
            ...state,
            runtime: {
              ...state.runtime,
              pendingSystemInputs: [
                ...(state.runtime.pendingSystemInputs ?? []),
                {
                  timing: effect.timing,
                  event: effect.event,
                  payload: effect.payload ?? {},
                },
              ],
            },
          },
          queuedInputs: [],
          queuedEffects: [],
          trace: [
            {
              type: "scheduledSystemInput",
              input: {
                timing: effect.timing,
                event: effect.event,
                payload: effect.payload ?? {},
              },
            },
          ],
        };
      case "transition": {
        const initialized = initializePhaseResult(
          {
            ...state,
            flow: {
              ...state.flow,
              currentPhase: effect.to as PhaseName,
            },
            runtime: {
              ...state.runtime,
              lastTransition: {
                from: state.flow.currentPhase,
                to: effect.to,
              },
            },
          },
          effect.to as PhaseName,
        );
        return {
          state: initialized.state,
          queuedInputs: [],
          queuedEffects: initialized.effects,
          trace: [],
        };
      }
      default: {
        const _exhaustive: never = effect;
        throw new Error(
          `Unknown effect type: ${(_exhaustive as { type: string }).type}`,
        );
      }
    }
  }

  function validateActionInput(
    state: State,
    input: Extract<ReducerInput, { kind: "action" }>,
  ): ReducerValidationResult {
    const phase = phaseFor(state);
    const actions = phase.actions as
      | ActionMap<DomainState, Manifest>
      | undefined;
    const action = actions?.[input.actionType];
    if (!action) {
      return makeValidationError(
        "unsupported-action",
        `Action '${input.actionType}' is not available in phase '${state.flow.currentPhase}'.`,
      );
    }

    const parsedParams = action.params.safeParse(input.params);
    if (!parsedParams.success) {
      return makeValidationError(
        "invalid-action-params",
        parsedParams.error.issues
          .map((issue: { path: PropertyKey[]; message: string }) =>
            formatIssue("params", issue),
          )
          .join("; "),
      );
    }

    if (
      action.available &&
      !action.available(
        buildRuntimeArgs(state, {
          state: toDomainState(state),
          input: { playerId: input.playerId },
        }),
      )
    ) {
      return makeValidationError(
        "action-unavailable",
        `Action '${input.actionType}' is currently unavailable.`,
      );
    }

    const validation = action.validate?.(
      buildRuntimeArgs(state, {
        state: toDomainState(state),
        input: {
          playerId: input.playerId,
          actionType: input.actionType,
          params: parsedParams.data,
        },
      }),
    );
    if (validation) {
      return makeValidationError(validation.errorCode, validation.message);
    }
    return { valid: true };
  }

  function validatePromptResponseInput(
    state: State,
    input: Extract<ReducerInput, { kind: "promptResponse" }>,
  ): ReducerValidationResult {
    const prompt = state.runtime.prompts.find(
      (candidate) => candidate.id === input.promptId,
    );
    if (!prompt) {
      return makeValidationError(
        "prompt-not-found",
        `Prompt '${input.promptId}' does not exist.`,
      );
    }
    if (prompt.to !== input.playerId) {
      return makeValidationError(
        "prompt-not-owned",
        `Prompt '${input.promptId}' is not owned by '${input.playerId}'.`,
      );
    }
    const continuation = continuationMap.get(prompt.resume.id);
    const responseSchema =
      promptMap.get(prompt.promptId)?.responseSchema ??
      continuation?.responseSchema;
    if (!responseSchema) {
      return makeValidationError(
        "missing-continuation",
        `Prompt '${prompt.promptId}' has no response schema.`,
      );
    }
    const parsedResponse = responseSchema.safeParse(input.response);
    if (!parsedResponse.success) {
      return makeValidationError(
        "invalid-prompt-response",
        parsedResponse.error.issues
          .map((issue) => formatIssue("response", issue))
          .join("; "),
      );
    }
    return { valid: true };
  }

  function validateWindowActionInput(
    state: State,
    input: Extract<ReducerInput, { kind: "windowAction" }>,
  ): ReducerValidationResult {
    const window = state.runtime.windows.find(
      (candidate) => candidate.id === input.windowId,
    );
    if (!window) {
      return makeValidationError(
        "window-not-found",
        `Window '${input.windowId}' does not exist.`,
      );
    }
    if (
      (window.addressedTo?.length ?? 0) > 0 &&
      !window.addressedTo?.includes(input.playerId)
    ) {
      return makeValidationError(
        "window-not-owned",
        `Window '${input.windowId}' is not addressed to '${input.playerId}'.`,
      );
    }
    const continuation = window.resume
      ? continuationMap.get(window.resume.id)
      : null;
    if (!continuation || !window.resume) {
      return makeValidationError(
        "unsupported-window-action",
        "Window has no continuation.",
      );
    }
    const parsedResponse = continuation.responseSchema.safeParse({
      actionType: input.actionType,
      params: input.params,
      windowId: input.windowId,
    });
    if (!parsedResponse.success) {
      return makeValidationError(
        "invalid-window-action",
        parsedResponse.error.issues
          .map((issue) => formatIssue("params", issue))
          .join("; "),
      );
    }
    return { valid: true };
  }

  function validateClientInput(
    state: State,
    input: ReducerInput,
  ): ReducerValidationResult {
    if (input.kind === "action") {
      return validateActionInput(state, input);
    }
    if (input.kind === "promptResponse") {
      return validatePromptResponseInput(state, input);
    }
    if (input.kind === "windowAction") {
      return validateWindowActionInput(state, input);
    }
    return { valid: true };
  }

  function reduceInternal(
    state: State,
    input: ReducerInput,
  ): ReducerResult<DomainState> {
    const ctx = buildContext(state);
    const phase = phaseFor(state);

    if (input.kind === "action") {
      const actions = phase.actions as
        | ActionMap<DomainState, Manifest>
        | undefined;
      const action = actions?.[input.actionType];
      if (!action) {
        return rejectResult(
          "unsupported-action",
          `Action '${input.actionType}' is not available in phase '${state.flow.currentPhase}'.`,
        );
      }
      const parsedParams = safeParseOrThrow(
        action.params,
        input.params,
        `action:${input.actionType}:params`,
      );
      return normalizeResult(
        action.reduce(
          buildRuntimeArgs(state, {
            ...ctx,
            state: toDomainState(state),
            input: {
              playerId: input.playerId,
              actionType: input.actionType,
              params: parsedParams,
            },
          }),
        ),
        toDomainState(state),
      );
    }

    if (input.kind === "promptResponse") {
      const promptInstance = ctx.promptByInstanceId(
        input.promptId as PromptInstanceId,
      );
      if (!promptInstance) {
        return rejectResult(
          "prompt-not-found",
          `Prompt '${input.promptId}' does not exist.`,
        );
      }
      const continuation = continuationMap.get(promptInstance.resume.id);
      if (!continuation) {
        return rejectResult(
          "missing-continuation",
          `Continuation '${promptInstance.resume.id}' was not registered.`,
        );
      }
      const responseSchema =
        promptMap.get(promptInstance.promptId)?.responseSchema ??
        continuation.responseSchema;
      const parsedData = safeParseOrThrow(
        continuation.dataSchema,
        promptInstance.resume.data ?? {},
        `continuation:${continuation.id}:data`,
      );
      const parsedResponse = safeParseOrThrow(
        responseSchema,
        input.response,
        `continuation:${continuation.id}:response`,
      );
      return normalizeResult(
        continuation.reduce(
          buildRuntimeArgs(state, {
            ...ctx,
            state: toDomainState(state),
            input: {
              source: "prompt",
              data: parsedData,
              response: parsedResponse,
              playerId: input.playerId,
              promptId: input.promptId,
            },
          }),
        ),
        toDomainState(state),
      );
    }

    if (input.kind === "windowAction") {
      const windowInstance = ctx.windowByInstanceId(
        input.windowId as WindowInstanceId,
      );
      const continuation = windowInstance?.resume
        ? continuationMap.get(windowInstance.resume.id)
        : null;
      if (!continuation || !windowInstance?.resume) {
        return rejectResult(
          "unsupported-window-action",
          "Window has no continuation.",
        );
      }
      const parsedData = safeParseOrThrow(
        continuation.dataSchema,
        windowInstance.resume.data ?? {},
        `continuation:${continuation.id}:data`,
      );
      const parsedResponse = safeParseOrThrow(
        continuation.responseSchema,
        {
          actionType: input.actionType,
          params: input.params,
          windowId: input.windowId,
        },
        `continuation:${continuation.id}:response`,
      );
      return normalizeResult(
        continuation.reduce(
          buildRuntimeArgs(state, {
            ...ctx,
            state: toDomainState(state),
            input: {
              source: "window",
              data: parsedData,
              response: parsedResponse,
              playerId: input.playerId,
              windowId: input.windowId,
              actionType: input.actionType,
              params: input.params as RuntimeParams,
            },
          }),
        ),
        toDomainState(state),
      );
    }

    const sharedContinuation =
      input.kind === "system" &&
      input.payload &&
      typeof input.payload === "object"
        ? continuationMap.get(input.event)
        : null;
    if (sharedContinuation && input.kind === "system") {
      const payload =
        input.payload && typeof input.payload === "object" ? input.payload : {};
      const parsedData = safeParseOrThrow(
        sharedContinuation.dataSchema,
        (payload as Record<string, unknown>).continuation ?? {},
        `continuation:${sharedContinuation.id}:data`,
      );
      const parsedResponse = safeParseOrThrow(
        sharedContinuation.responseSchema,
        payload,
        `continuation:${sharedContinuation.id}:response`,
      );
      return normalizeResult(
        sharedContinuation.reduce(
          buildRuntimeArgs(state, {
            ...ctx,
            state: toDomainState(state),
            input: {
              source: "shared" as const,
              data: parsedData,
              response: parsedResponse,
              event: input.event,
              payload,
            },
          }),
        ),
        toDomainState(state),
      );
    }

    const phaseSystem = phase.system?.[input.event];
    if (phaseSystem) {
      return normalizeResult(
        phaseSystem(
          buildRuntimeArgs(state, {
            ...ctx,
            state: toDomainState(state),
            input,
          }),
        ),
        toDomainState(state),
      );
    }
    const rootSystem = definition.root?.system?.[input.event] as
      | ((
          args: ReturnType<
            typeof buildRuntimeArgs<{ state: DomainState; input: ReducerInput }>
          >,
        ) => ReducerResultLike<DomainState>)
      | undefined;
    if (rootSystem) {
      return normalizeResult(
        rootSystem(
          buildRuntimeArgs(state, {
            ...ctx,
            state: toDomainState(state),
            input,
          }),
        ),
        toDomainState(state),
      );
    }

    return acceptResult(toDomainState(state));
  }

  const effectEngine = createReducerEffectEngine<State, PlayerId, ReducerInput>(
    {
      reduce(state, input) {
        const result = reduceInternal(state, input);
        if (result.type === "reject") {
          return result;
        }
        return {
          type: "accept" as const,
          state: {
            ...result.state,
            runtime: state.runtime,
          } as State,
          effects: result.effects ?? [],
        };
      },
      applyEffect,
      afterInput(state, input) {
        if (input.kind === "promptResponse") {
          return closePromptInternal(state, input.promptId);
        }
        if (input.kind === "windowAction") {
          return applyWindowBookkeeping(state, input);
        }
        return {
          state,
          trace: [],
        };
      },
    },
  );

  return {
    actions: metadata.actions,
    prompts: metadata.prompts,
    views: metadata.views,
    windows: metadata.windows,
    continuations: metadata.continuations,
    metadata: metadata.metadata,
    async initialize({
      table,
      playerIds,
      rngSeed,
      setup,
    }: {
      table: State["table"];
      playerIds: PlayerId[];
      rngSeed?: number | null;
      setup?: RuntimeSetupSelection<Manifest> | null;
    }) {
      const parsedTable = safeParseOrThrow(
        definition.contract.manifest.tableSchema,
        table,
        "table",
      ) as State["table"];
      const selectedSetup = resolveSelectedSetup(setup);
      const initialSetup =
        selectedSetup as RuntimeSetupSelection<ExactManifest> | null;
      const initialPhase = resolveInitialPhase(selectedSetup);
      const initialState: State = {
        table: parsedTable,
        publicState: safeParseOrThrow(
          definition.contract.state.public,
          definition.initial?.public?.({
            manifest: definition.contract.manifest,
            table: parsedTable,
            playerIds,
            rngSeed,
            setup: initialSetup,
          }) ?? {},
          "publicState",
        ) as State["publicState"],
        privateState: Object.fromEntries(
          playerIds.map((playerId) => [
            playerId,
            safeParseOrThrow(
              definition.contract.state.private,
              definition.initial?.private?.({
                manifest: definition.contract.manifest,
                table: parsedTable,
                playerIds,
                playerId,
                rngSeed,
                setup: initialSetup,
              }) ?? {},
              `privateState:${playerId}`,
            ),
          ]),
        ) as State["privateState"],
        hiddenState: safeParseOrThrow(
          definition.contract.state.hidden,
          definition.initial?.hidden?.({
            manifest: definition.contract.manifest,
            table: parsedTable,
            playerIds,
            rngSeed,
            setup: initialSetup,
          }) ?? {},
          "hiddenState",
        ) as State["hiddenState"],
        flow: {
          currentPhase: initialPhase,
          turn: 0,
          round: 0,
          activePlayers: [],
        },
        phase: {} as State["phase"],
        runtime: {
          prompts: [],
          windows: [],
          effectQueue: [],
          rng: {
            seed: rngSeed ?? null,
            cursor: 0,
            trace: [],
          },
          setup: selectedSetup,
          pendingSystemInputs: [],
          nextInstanceId: 1,
        } as State["runtime"],
      };

      let workingState = initPhaseState(initialState, initialPhase, playerIds);
      const initialPhaseDef = phaseByName(initialPhase);
      if (initialPhaseDef.enter) {
        const entered = normalizeResult(
          initialPhaseDef.enter(
            buildRuntimeArgs(workingState, {
              event: "initialize" as const,
              state: toDomainState(workingState),
            }),
          ),
          toDomainState(workingState),
        );
        if (entered.type === "reject") {
          throw new Error(
            entered.message ??
              `Reducer phase '${initialPhase}' rejected during initialization.`,
          );
        }
        workingState = effectEngine.drainEffects(
          {
            ...entered.state,
            runtime: workingState.runtime,
          } as State,
          entered.effects ?? [],
        );
      }

      return toSessionState(workingState);
    },
    async initializePhase({
      state,
      to,
    }: {
      state: SessionState;
      to: PhaseName;
    }) {
      return toSessionState(
        initializePhaseInternal(toCombinedState(state), to),
      );
    },
    async validateInput({
      state,
      input,
    }: {
      state: SessionState;
      input: ReducerInput;
    }) {
      return validateClientInput(toCombinedState(state), input);
    },
    async reduce({
      state,
      input,
    }: {
      state: SessionState;
      input: ReducerInput;
    }) {
      const combinedState = toCombinedState(state);
      const validation = validateClientInput(combinedState, input);
      if (!validation.valid) {
        const invalidValidation = validation as Exclude<
          ReducerValidationResult,
          { valid: true }
        >;
        return rejectResult(
          invalidValidation.errorCode,
          invalidValidation.message,
        );
      }
      const result = reduceInternal(combinedState, input);
      if (result.type === "reject") {
        return result;
      }
      return {
        type: "accept" as const,
        state: toSessionState({
          ...result.state,
          runtime: combinedState.runtime,
        } as State),
        effects: result.effects ?? [],
      };
    },
    async dispatch({
      state,
      input,
    }: {
      state: SessionState;
      input: ReducerInput;
    }) {
      const combinedState = toCombinedState(state);
      const validation = validateClientInput(combinedState, input);
      if (!validation.valid) {
        const invalidValidation = validation as Exclude<
          ReducerValidationResult,
          { valid: true }
        >;
        return rejectResult(
          invalidValidation.errorCode,
          invalidValidation.message,
        );
      }
      const result = effectEngine.dispatch(combinedState, input);
      if (result.type === "reject") {
        return result;
      }
      return {
        type: "accept" as const,
        state: toSessionState(result.state),
        trace: result.trace,
      };
    },
    getAvailableActions({
      state,
      playerId,
    }: {
      state: SessionState;
      playerId: PlayerId;
    }) {
      const combinedState = toCombinedState(state);
      if (!combinedState.flow.activePlayers.includes(playerId)) {
        return [];
      }
      const phaseName = combinedState.flow.currentPhase as PhaseName;
      const phase = phaseByName(phaseName);
      const actions = phase.actions as
        | ActionMap<DomainState, Manifest>
        | undefined;
      const phaseActionMetadata = actionMetadataByPhase.get(phaseName) ?? {};
      return Object.entries(actions ?? {})
        .filter(([, action]) =>
          action.available
            ? action.available(
                buildRuntimeArgs(combinedState, {
                  state: toDomainState(combinedState),
                  input: { playerId },
                }),
              )
            : true,
        )
        .map(([actionName]) => phaseActionMetadata[actionName]);
    },
    getView({
      state,
      playerId,
      viewId = "player",
    }: {
      state: SessionState;
      playerId: PlayerId;
      viewId?: string;
    }) {
      const combinedState = toCombinedState(state);
      const views = definition.views;
      const view = views?.[viewId as keyof typeof views];
      if (!view) {
        return null;
      }
      const viewArgs = {
        ...buildContext(combinedState),
        ...runtimeHelpers,
        state: toDomainState(combinedState),
        playerId,
      } as Parameters<typeof view.project>[0];
      return safeParseOrThrow(
        view.schema,
        view.project(viewArgs),
        `view:${viewId}`,
      );
    },
  };
}
