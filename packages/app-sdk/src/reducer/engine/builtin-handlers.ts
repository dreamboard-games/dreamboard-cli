/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  assertCardAllowedInZone,
  cloneRuntimeTable,
  ensureArray,
} from "../table-ops";
import { nextRandomInt } from "../rng";
import type {
  PromptInstanceId,
  ReducerRuntimeEffectForState,
  RuntimePromptInstance,
  RuntimeWindowInstance,
  WindowInstanceId,
} from "../model";
import type {
  DispatchTraceEntry,
  TrustedEffectApplicationResult,
  TrustedRuntimeInput,
} from "../core/types";

export function createBuiltinEffectHandlers<
  Session extends {
    domain: {
      table: any;
      flow: { currentPhase: string };
    };
    runtime: {
      prompts: RuntimePromptInstance<any>[];
      windows: RuntimeWindowInstance<any>[];
      nextInstanceId?: number;
      rng: any;
      pendingSystemInputs?: any[];
      lastTransition?: { from: string; to: string };
    };
  },
  PlayerId extends string,
  Input extends TrustedRuntimeInput<PlayerId>,
  PhaseName extends string,
>({
  initializePhaseResult,
}: {
  initializePhaseResult: (
    state: Session,
    phaseName: PhaseName,
  ) => {
    state: Session;
    effects: ReducerRuntimeEffectForState<Session["domain"]>[];
  };
}) {
  function closePromptInternal(
    state: Session,
    promptId: string,
  ): {
    state: Session;
    trace: DispatchTraceEntry<Session, PlayerId, Input>[];
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
          playerId: existing.to as PlayerId,
        },
      ],
    };
  }

  function applyWindowBookkeeping(
    state: Session,
    input: Extract<Input, { kind: "windowAction" }>,
  ): {
    state: Session;
    trace: DispatchTraceEntry<Session, PlayerId, Input>[];
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
    state: Session,
    effect: ReducerRuntimeEffectForState<Session["domain"]>,
  ): TrustedEffectApplicationResult<Session, PlayerId, Input> {
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
        const die = state.domain.table.dice[effect.dieId];
        if (!die) {
          throw new Error(`Cannot roll unknown die '${effect.dieId}'.`);
        }
        if (!Number.isInteger(die.sides) || die.sides <= 0) {
          throw new Error(
            `Cannot roll die '${effect.dieId}' with invalid sides '${die.sides}'.`,
          );
        }
        const nextTable = cloneRuntimeTable(state.domain.table);
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
            domain: {
              ...state.domain,
              table: nextTable,
            },
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
        const nextTable = cloneRuntimeTable(state.domain.table) as any;
        const deckCards = [
          ...ensureArray(nextTable.decks[effect.zoneId as any]),
        ];
        let nextRng = state.runtime.rng;
        const trace: DispatchTraceEntry<Session, PlayerId, Input>[] = [];
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
        nextTable.decks[effect.zoneId as any] = deckCards;
        nextTable.zones.shared[effect.zoneId as any] = [...deckCards];
        for (const [index, cardId] of deckCards.entries()) {
          const currentLocation = nextTable.componentLocations[cardId as any];
          nextTable.componentLocations[cardId as any] =
            currentLocation?.type === "InDeck" ||
            currentLocation?.type === "InZone"
              ? {
                  ...currentLocation,
                  type: "InDeck",
                  deckId: effect.zoneId as any,
                  playedBy: currentLocation.playedBy ?? null,
                  position: index,
                }
              : {
                  type: "InDeck",
                  deckId: effect.zoneId as any,
                  playedBy: null,
                  position: index,
                };
        }
        return {
          state: {
            ...state,
            domain: {
              ...state.domain,
              table: nextTable,
            },
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
        const nextTable = cloneRuntimeTable(state.domain.table) as any;
        const publicHands = new Set(
          Object.entries(nextTable.handVisibility)
            .filter(([, mode]) => mode === "all" || mode === "public")
            .map(([handId]) => handId),
        );

        for (let index = 0; index < effect.count; index += 1) {
          const nextCard = ensureArray(
            nextTable.decks[effect.fromZoneId as any],
          )[0];
          if (!nextCard) {
            break;
          }
          nextTable.decks[effect.fromZoneId as any] = ensureArray(
            nextTable.decks[effect.fromZoneId as any],
          ).slice(1);
          nextTable.zones.shared[effect.fromZoneId as any] = [
            ...ensureArray(nextTable.decks[effect.fromZoneId as any]),
          ];
          const handByPlayer = {
            ...(nextTable.hands[effect.toZoneId as any] ?? {}),
          };
          const nextHand = [
            ...ensureArray(handByPlayer[effect.playerId as any]),
            nextCard,
          ];
          assertCardAllowedInZone(
            nextTable,
            effect.toZoneId as any,
            nextCard as string,
          );
          handByPlayer[effect.playerId as any] = nextHand;
          nextTable.hands[effect.toZoneId as any] = handByPlayer;
          const zoneByPlayer = {
            ...(nextTable.zones.perPlayer[effect.toZoneId as any] ?? {}),
          };
          zoneByPlayer[effect.playerId as any] = [...nextHand];
          nextTable.zones.perPlayer[effect.toZoneId as any] = zoneByPlayer;
          nextTable.componentLocations[nextCard as any] = {
            type: "InHand",
            handId: effect.toZoneId as any,
            playerId: effect.playerId as any,
            position: nextHand.length - 1,
          };
          nextTable.ownerOfCard[nextCard as any] = effect.playerId;
          nextTable.visibility[nextCard as any] = publicHands.has(
            effect.toZoneId as string,
          )
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
            domain: {
              ...state.domain,
              table: nextTable,
            },
          },
          queuedInputs: [],
          queuedEffects: [],
          trace: [],
        };
      }
      case "sample": {
        const remaining = [...effect.from];
        const samples: string[] = [];
        let nextRng = state.runtime.rng;
        const trace: DispatchTraceEntry<Session, PlayerId, Input>[] = [];
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
            } as unknown as Input,
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
            } as unknown as Input,
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
            } as unknown as Input,
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
              } as any,
            },
          ],
        };
      case "transition": {
        const initialized = initializePhaseResult(
          {
            ...state,
            domain: {
              ...state.domain,
              flow: {
                ...state.domain.flow,
                currentPhase: effect.to,
              },
            },
            runtime: {
              ...state.runtime,
              lastTransition: {
                from: state.domain.flow.currentPhase,
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

  return {
    applyEffect,
    applyWindowBookkeeping,
    closePromptInternal,
  };
}
