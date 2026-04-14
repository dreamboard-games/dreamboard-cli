import { describe, expect, test } from "bun:test";
import { z } from "zod";
import {
  createReducerBundle,
  defineAction,
  defineContinuation,
  defineGame,
  defineGameContract,
  definePhase,
  definePrompt,
  definePromptContinuation,
  defineView,
  defineWindowContinuation,
  type RuntimeTableRecord,
} from "../reducer";

function createTable(playerIds = ["player-1", "player-2"]): RuntimeTableRecord {
  return {
    playerOrder: [...playerIds],
    zones: {
      shared: {},
      perPlayer: {},
      visibility: {},
    },
    decks: {},
    hands: {},
    handVisibility: {},
    cards: {},
    pieces: {},
    componentLocations: {},
    ownerOfCard: {},
    visibility: {},
    resources: {},
    boards: {
      byId: {},
      hex: {},
      network: {},
      square: {},
      track: {},
    },
    dice: {
      "die-1": {
        id: "die-1",
        dieTypeId: "d6",
        dieName: "Test die",
        sides: 6,
        value: null,
        properties: {},
      },
    },
  };
}

function createManifestContract() {
  const phaseNames = ["takeTurn"] as const;
  const playerIds = ["player-1", "player-2"] as const;
  const dieIds = ["die-1"] as const;

  return {
    literals: {
      playerIds,
      phaseNames,
      setupOptionIds: [] as const,
      setupProfileIds: [] as const,
      cardSetIds: [] as const,
      cardTypes: [] as const,
      deckIds: [] as const,
      handIds: [] as const,
      sharedZoneIds: [] as const,
      playerZoneIds: [] as const,
      zoneIds: [] as const,
      cardIds: [] as const,
      resourceIds: [] as const,
      pieceTypeIds: [] as const,
      pieceIds: [] as const,
      dieTypeIds: ["d6"] as const,
      dieIds,
      boardBaseIds: [] as const,
      boardIds: [] as const,
      boardContainerIds: [] as const,
      tileIds: [] as const,
      tileTypeIds: [] as const,
      edgeIds: [] as const,
      vertexIds: [] as const,
      portIds: [] as const,
      portTypeIds: [] as const,
      spaceIds: [] as const,
      spaceTypeIds: [] as const,
      handVisibilityById: {} as const,
      zoneVisibilityById: {} as const,
      cardSetIdByCardId: {},
      cardTypeByCardId: {},
      cardSetIdsBySharedZoneId: {},
      cardSetIdsByPlayerZoneId: {},
    },
    ids: {
      playerId: z.enum(playerIds),
      phaseName: z.enum(phaseNames),
      setupOptionId: z.string(),
      setupProfileId: z.string(),
      cardSetId: z.string(),
      cardType: z.string(),
      cardId: z.string(),
      deckId: z.string(),
      handId: z.string(),
      sharedZoneId: z.string(),
      playerZoneId: z.string(),
      zoneId: z.string(),
      resourceId: z.string(),
      dieId: z.enum(dieIds),
      boardId: z.string(),
      boardBaseId: z.string(),
      boardContainerId: z.string(),
      tileId: z.string(),
      tileTypeId: z.string(),
      edgeId: z.string(),
      edgeTypeId: z.string(),
      vertexId: z.string(),
      vertexTypeId: z.string(),
      portId: z.string(),
      portTypeId: z.string(),
      spaceId: z.string(),
      spaceTypeId: z.string(),
      pieceId: z.string(),
      pieceTypeId: z.string(),
    },
    defaults: {
      zones: () => ({
        shared: {},
        perPlayer: {},
        visibility: {},
      }),
      decks: () => ({}),
      hands: () => ({}),
      handVisibility: () => ({}),
      ownerOfCard: () => ({}),
      visibility: () => ({}),
      resources: () => ({}),
    },
    setupOptionsById: {},
    setupProfilesById: {},
    tableSchema: z.custom<RuntimeTableRecord>(),
    runtimeSchema: z.any(),
    createGameStateSchema: () => z.any(),
  };
}

describe("runtime-owned reducer effects", () => {
  test("bundle getView returns a plain view synchronously", async () => {
    const contract = defineGameContract({
      manifest: createManifestContract(),
      state: {
        public: z.object({
          counter: z.number().int(),
        }),
        private: z.object({}),
        hidden: z.object({
          secret: z.string(),
        }),
      },
    });

    const game = defineGame({
      contract,
      initial: {
        public: () => ({
          counter: 3,
        }),
        private: () => ({}),
        hidden: () => ({
          secret: "eel",
        }),
      },
      initialPhase: "takeTurn",
      phases: {
        takeTurn: definePhase<typeof contract>()({
          kind: "player",
          state: z.object({}),
          initialState: () => ({}),
        }),
      },
      views: {
        player: defineView<typeof contract>()({
          schema: z.object({
            counter: z.number(),
            secret: z.string(),
          }),
          project({ state }) {
            return {
              counter: state.publicState.counter,
              secret: state.hiddenState.secret,
            };
          },
        }),
      },
    });

    const bundle = createReducerBundle(game);
    const session = await bundle.initialize({
      table: createTable(),
      playerIds: ["player-1", "player-2"],
    });

    const view = bundle.getView({
      state: session,
      playerId: "player-1",
    });

    expect(view).toEqual({
      counter: 3,
      secret: "eel",
    });
    expect(typeof (view as { then?: unknown }).then).toBe("undefined");
  });

  test("bundle outputs Kotlin-compatible discriminators for reducer results and dispatch traces", async () => {
    const contract = defineGameContract({
      manifest: createManifestContract(),
      state: {
        public: z.object({
          pingCount: z.number().int(),
        }),
        private: z.object({}),
        hidden: z.object({}),
      },
    });
    const reviewWindow = { id: "review-window" } as const;

    const game = defineGame({
      contract,
      initial: {
        public: () => ({
          pingCount: 0,
        }),
        private: () => ({}),
        hidden: () => ({}),
      },
      initialPhase: "takeTurn",
      phases: {
        takeTurn: definePhase<typeof contract>()({
          kind: "player",
          state: z.object({}),
          initialState: () => ({}),
          windows: {
            reviewWindow,
          },
          actions: {
            openReview: defineAction<typeof contract>()({
              params: z.object({}),
              reduce({ state, accept, effects }) {
                return accept(state, [
                  effects.openWindow(reviewWindow, {
                    addressedTo: ["player-1", "player-2"],
                    closePolicy: { type: "allResponded" },
                    payload: {
                      phase: "review",
                    },
                  }),
                ]);
              },
            }),
            dispatchPing: defineAction<typeof contract>()({
              params: z.object({}),
              reduce({ state, input, accept, effects }) {
                return accept(state, [
                  effects.dispatchSystem("ping", {
                    source: input.playerId,
                  }),
                ]);
              },
            }),
            schedulePing: defineAction<typeof contract>()({
              params: z.object({}),
              reduce({ state, input, accept, effects }) {
                return accept(state, [
                  effects.scheduleTiming("after-turn", "ping", {
                    source: input.playerId,
                  }),
                ]);
              },
            }),
          },
          system: {
            ping({ state, accept }) {
              return accept({
                ...state,
                publicState: {
                  ...state.publicState,
                  pingCount: state.publicState.pingCount + 1,
                },
              });
            },
          },
        }),
      },
    });

    const bundle = createReducerBundle(game);
    const initial = await bundle.initialize({
      table: createTable(),
      playerIds: ["player-1", "player-2"],
      rngSeed: 23,
    });

    const reduced = await bundle.reduce({
      state: initial,
      input: {
        kind: "action",
        playerId: "player-1",
        actionType: "openReview",
        params: {},
      },
    });

    expect(reduced).toMatchObject({
      type: "accept",
      kind: "accept",
    });
    if (reduced.type !== "accept") {
      throw new Error("Expected openReview reduce result to be accepted.");
    }
    expect(reduced.effects).toEqual([
      expect.objectContaining({
        type: "openWindow",
        kind: "openWindow",
        window: "review-window",
        closePolicy: expect.objectContaining({
          type: "allResponded",
          kind: "allResponded",
        }),
      }),
    ]);

    const dispatched = await bundle.dispatch({
      state: initial,
      input: {
        kind: "action",
        playerId: "player-1",
        actionType: "dispatchPing",
        params: {},
      },
    });

    expect(dispatched).toMatchObject({
      type: "accept",
      kind: "accept",
    });
    if (dispatched.type !== "accept") {
      throw new Error("Expected dispatchPing to be accepted.");
    }
    expect(dispatched.trace).toEqual([
      expect.objectContaining({
        type: "acceptedClientInput",
        kind: "acceptedClientInput",
        input: expect.objectContaining({
          kind: "action",
        }),
      }),
      expect.objectContaining({
        type: "appliedEffect",
        kind: "appliedEffect",
        effect: expect.objectContaining({
          type: "dispatchSystem",
          kind: "dispatchSystem",
        }),
      }),
      expect.objectContaining({
        type: "dispatchedSystemInput",
        kind: "dispatchedSystemInput",
        input: expect.objectContaining({
          kind: "system",
        }),
      }),
    ]);

    const scheduled = await bundle.dispatch({
      state: initial,
      input: {
        kind: "action",
        playerId: "player-1",
        actionType: "schedulePing",
        params: {},
      },
    });

    expect(scheduled).toMatchObject({
      type: "accept",
      kind: "accept",
    });
    if (scheduled.type !== "accept") {
      throw new Error("Expected schedulePing to be accepted.");
    }
    expect(scheduled.trace).toEqual([
      expect.objectContaining({
        type: "acceptedClientInput",
        kind: "acceptedClientInput",
      }),
      expect.objectContaining({
        type: "appliedEffect",
        kind: "appliedEffect",
        effect: expect.objectContaining({
          type: "scheduleTiming",
          kind: "scheduleTiming",
        }),
      }),
      expect.objectContaining({
        type: "scheduledSystemInput",
        kind: "scheduledSystemInput",
      }),
    ]);

    const rejected = await bundle.dispatch({
      state: initial,
      input: {
        kind: "action",
        playerId: "player-1",
        actionType: "unknownAction",
        params: {},
      },
    });

    expect(rejected).toMatchObject({
      type: "reject",
      kind: "reject",
      errorCode: "unsupported-action",
    });
  });

  test("reduce and dispatch enforce action availability and reducer validation", async () => {
    const contract = defineGameContract({
      manifest: createManifestContract(),
      state: {
        public: z.object({
          lockedRan: z.boolean(),
          invalidRan: z.boolean(),
        }),
        private: z.object({}),
        hidden: z.object({}),
      },
    });

    const game = defineGame({
      contract,
      initial: {
        public: () => ({
          lockedRan: false,
          invalidRan: false,
        }),
        private: () => ({}),
        hidden: () => ({}),
      },
      initialPhase: "takeTurn",
      phases: {
        takeTurn: definePhase<typeof contract>()({
          kind: "player",
          state: z.object({}),
          initialState: () => ({}),
          actions: {
            locked: defineAction<typeof contract>()({
              params: z.object({}),
              available: () => false,
              reduce({ state, accept }) {
                return accept({
                  ...state,
                  publicState: {
                    ...state.publicState,
                    lockedRan: true,
                  },
                });
              },
            }),
            invalid: defineAction<typeof contract>()({
              params: z.object({}),
              validate() {
                return {
                  errorCode: "invalid-move",
                  message: "Nope.",
                };
              },
              reduce({ state, accept }) {
                return accept({
                  ...state,
                  publicState: {
                    ...state.publicState,
                    invalidRan: true,
                  },
                });
              },
            }),
          },
        }),
      },
    });

    const bundle = createReducerBundle(game);
    const initial = await bundle.initialize({
      table: createTable(),
      playerIds: ["player-1", "player-2"],
    });

    expect(
      await bundle.validateInput({
        state: initial,
        input: {
          kind: "action",
          playerId: "player-1",
          actionType: "locked",
          params: {},
        },
      }),
    ).toEqual({
      valid: false,
      errorCode: "action-unavailable",
      message: "Action 'locked' is currently unavailable.",
    });

    expect(
      await bundle.reduce({
        state: initial,
        input: {
          kind: "action",
          playerId: "player-1",
          actionType: "locked",
          params: {},
        },
      }),
    ).toMatchObject({
      type: "reject",
      errorCode: "action-unavailable",
    });

    expect(
      await bundle.dispatch({
        state: initial,
        input: {
          kind: "action",
          playerId: "player-1",
          actionType: "invalid",
          params: {},
        },
      }),
    ).toMatchObject({
      type: "reject",
      errorCode: "invalid-move",
      message: "Nope.",
    });
  });

  test("prompt responses and window actions enforce ownership inside the bundle", async () => {
    const contract = defineGameContract({
      manifest: createManifestContract(),
      state: {
        public: z.object({
          promptResponder: z.string().nullable(),
          windowResponder: z.string().nullable(),
        }),
        private: z.object({}),
        hidden: z.object({}),
      },
    });
    const confirmationPrompt = definePrompt<typeof contract>()({
      id: "confirm-prompt",
      responseSchema: z.object({
        ok: z.boolean(),
      }),
    });
    const resolvePrompt = definePromptContinuation<typeof contract>()({
      prompt: confirmationPrompt,
      data: z.object({}),
      reduce({ state, input, accept }) {
        return accept({
          ...state,
          publicState: {
            ...state.publicState,
            promptResponder: input.playerId ?? null,
          },
        });
      },
    });
    const resolveWindow = defineWindowContinuation<typeof contract>()({
      data: z.object({}),
      response: z.object({
        actionType: z.literal("confirm"),
        params: z.object({
          ok: z.boolean(),
        }),
        windowId: z.string(),
      }),
      reduce({ state, input, accept }) {
        return accept({
          ...state,
          publicState: {
            ...state.publicState,
            windowResponder: input.playerId ?? null,
          },
        });
      },
    });
    const reviewWindow = { id: "review-window" } as const;

    const game = defineGame({
      contract,
      initial: {
        public: () => ({
          promptResponder: null,
          windowResponder: null,
        }),
        private: () => ({}),
        hidden: () => ({}),
      },
      initialPhase: "takeTurn",
      phases: {
        takeTurn: definePhase<typeof contract>()({
          kind: "player",
          state: z.object({}),
          initialState: () => ({}),
          prompts: {
            confirmationPrompt,
          },
          continuations: {
            resolvePrompt,
            resolveWindow,
          },
          windows: {
            reviewWindow,
          },
          actions: {
            openPromptForPlayerOne: defineAction<typeof contract>()({
              params: z.object({}),
              reduce({ state, accept, effects }) {
                return accept(state, [
                  effects.openPrompt(confirmationPrompt, {
                    to: "player-1",
                    resume: resolvePrompt({}),
                  }),
                ]);
              },
            }),
            openWindowForPlayerOne: defineAction<typeof contract>()({
              params: z.object({}),
              reduce({ state, accept, effects }) {
                return accept(state, [
                  effects.openWindow(reviewWindow, {
                    addressedTo: ["player-1"],
                    resume: resolveWindow({}),
                  }),
                ]);
              },
            }),
          },
        }),
      },
    });

    const bundle = createReducerBundle(game);
    const initial = await bundle.initialize({
      table: createTable(),
      playerIds: ["player-1", "player-2"],
    });

    const openedPrompt = await bundle.dispatch({
      state: initial,
      input: {
        kind: "action",
        playerId: "player-1",
        actionType: "openPromptForPlayerOne",
        params: {},
      },
    });
    expect(openedPrompt.type).toBe("accept");
    if (openedPrompt.type !== "accept") {
      throw new Error("Expected openPromptForPlayerOne to be accepted.");
    }
    const promptId = openedPrompt.state.runtime.prompts[0]?.id;
    expect(promptId).toBeDefined();

    expect(
      await bundle.validateInput({
        state: openedPrompt.state,
        input: {
          kind: "promptResponse",
          playerId: "player-2",
          promptId: promptId!,
          response: { ok: true },
        },
      }),
    ).toEqual({
      valid: false,
      errorCode: "prompt-not-owned",
      message: `Prompt '${promptId!}' is not owned by 'player-2'.`,
    });

    expect(
      await bundle.dispatch({
        state: openedPrompt.state,
        input: {
          kind: "promptResponse",
          playerId: "player-2",
          promptId: promptId!,
          response: { ok: true },
        },
      }),
    ).toMatchObject({
      type: "reject",
      errorCode: "prompt-not-owned",
    });

    const openedWindow = await bundle.dispatch({
      state: initial,
      input: {
        kind: "action",
        playerId: "player-1",
        actionType: "openWindowForPlayerOne",
        params: {},
      },
    });
    expect(openedWindow.type).toBe("accept");
    if (openedWindow.type !== "accept") {
      throw new Error("Expected openWindowForPlayerOne to be accepted.");
    }
    const windowId = openedWindow.state.runtime.windows[0]?.id;
    expect(windowId).toBeDefined();

    expect(
      await bundle.validateInput({
        state: openedWindow.state,
        input: {
          kind: "windowAction",
          playerId: "player-2",
          windowId: windowId!,
          actionType: "confirm",
          params: { ok: true },
        },
      }),
    ).toEqual({
      valid: false,
      errorCode: "window-not-owned",
      message: `Window '${windowId!}' is not addressed to 'player-2'.`,
    });

    expect(
      await bundle.dispatch({
        state: openedWindow.state,
        input: {
          kind: "windowAction",
          playerId: "player-2",
          windowId: windowId!,
          actionType: "confirm",
          params: { ok: true },
        },
      }),
    ).toMatchObject({
      type: "reject",
      errorCode: "window-not-owned",
    });
  });

  test("effects.rollDie consumes seeded RNG and updates the die value", async () => {
    const contract = defineGameContract({
      manifest: createManifestContract(),
      state: {
        public: z.object({}),
        private: z.object({}),
        hidden: z.object({}),
      },
    });

    const game = defineGame({
      contract,
      initialPhase: "takeTurn",
      phases: {
        takeTurn: definePhase<typeof contract>()({
          kind: "player",
          state: z.object({}),
          initialState: () => ({}),
          actions: {
            rollVisibleDie: defineAction<typeof contract>()({
              params: z.object({}),
              reduce({ state, accept, effects }) {
                return accept(state, [effects.rollDie("die-1")]);
              },
            }),
          },
        }),
      },
    });

    const bundle = createReducerBundle(game);
    const initialA = await bundle.initialize({
      table: createTable(),
      playerIds: ["player-1", "player-2"],
      rngSeed: 42,
    });
    const initialB = await bundle.initialize({
      table: createTable(),
      playerIds: ["player-1", "player-2"],
      rngSeed: 42,
    });

    const resultA = await bundle.dispatch({
      state: initialA,
      input: {
        kind: "action",
        playerId: "player-1",
        actionType: "rollVisibleDie",
        params: {},
      },
    });
    const resultB = await bundle.dispatch({
      state: initialB,
      input: {
        kind: "action",
        playerId: "player-1",
        actionType: "rollVisibleDie",
        params: {},
      },
    });

    expect(resultA.type).toBe("accept");
    expect(resultB.type).toBe("accept");
    if (resultA.type !== "accept" || resultB.type !== "accept") {
      throw new Error("Expected rollVisibleDie to be accepted.");
    }

    const firstRoll = resultA.state.domain.table.dice["die-1"]?.value;
    expect([1, 2, 3, 4, 5, 6]).toContain(firstRoll);
    expect(resultA.state.domain.table.dice["die-1"]?.value).toBe(
      resultB.state.domain.table.dice["die-1"]?.value,
    );
    expect(resultA.state.runtime.rng.cursor).toBe(1);
    expect(resultA.state.runtime.rng.trace).toHaveLength(1);
  });

  test("effects.randomInt resumes shared continuations with runtime-sampled values", async () => {
    const manifest = createManifestContract();
    const contract = defineGameContract({
      manifest,
      state: {
        public: z.object({
          randomIntId: z.string().nullable(),
          rolledValue: z.number().int().nullable(),
          source: z.enum(["shared", "prompt", "window"]).nullable(),
          label: z.string().nullable(),
        }),
        private: z.object({}),
        hidden: z.object({}),
      },
    });

    const resolveRandomInt = defineContinuation<typeof contract>()({
      data: z.object({
        label: z.string(),
      }),
      response: z.object({
        randomIntId: z.string(),
        value: z.number().int(),
      }),
      reduce({ state, input, accept }) {
        return accept({
          ...state,
          publicState: {
            ...state.publicState,
            randomIntId: input.response.randomIntId,
            rolledValue: input.response.value,
            source: input.source,
            label: input.data.label,
          },
        });
      },
    });

    const game = defineGame({
      contract,
      initial: {
        public: () => ({
          randomIntId: null,
          rolledValue: null,
          source: null,
          label: null,
        }),
        private: () => ({}),
        hidden: () => ({}),
      },
      initialPhase: "takeTurn",
      phases: {
        takeTurn: definePhase<typeof contract>()({
          kind: "player",
          state: z.object({}),
          initialState: () => ({}),
          continuations: {
            resolveRandomInt,
          },
          actions: {
            chooseBonus: defineAction<typeof contract>()({
              params: z.object({}),
              reduce({ state, accept, effects }) {
                return accept(state, [
                  effects.randomInt(
                    2,
                    5,
                    "bonus-roll",
                    resolveRandomInt({
                      label: "bonus",
                    }),
                  ),
                ]);
              },
            }),
          },
        }),
      },
    });

    const bundle = createReducerBundle(game);
    const initial = await bundle.initialize({
      table: createTable(),
      playerIds: ["player-1", "player-2"],
      rngSeed: 17,
    });

    const result = await bundle.dispatch({
      state: initial,
      input: {
        kind: "action",
        playerId: "player-1",
        actionType: "chooseBonus",
        params: {},
      },
    });

    expect(result.type).toBe("accept");
    if (result.type !== "accept") {
      throw new Error("Expected chooseBonus to be accepted.");
    }

    expect(result.state.domain.publicState.randomIntId).toBe("bonus-roll");
    expect(result.state.domain.publicState.source).toBe("shared");
    expect(result.state.domain.publicState.label).toBe("bonus");
    expect([2, 3, 4, 5]).toContain(result.state.domain.publicState.rolledValue);
    expect(result.state.runtime.rng.cursor).toBe(1);
    expect(result.state.runtime.rng.trace).toHaveLength(1);
  });
});
