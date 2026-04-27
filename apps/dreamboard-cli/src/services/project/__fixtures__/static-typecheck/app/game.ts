import { z } from "zod";
import {
  defineAction,
  defineFlow,
  defineGame,
  definePhase,
} from "@dreamboard/app-sdk/reducer";
import { gameContract } from "./game-contract";

const chooseBonusFlow = defineFlow<typeof gameContract>()({
  type: "choicePrompt",
  id: "choose-bonus",
  title: "Choose bonus",
  options: [
    { id: "energy", label: "Energy" },
    { id: "steel", label: "Steel" },
  ] as const,
  context: z.object({
    source: z.string(),
  }),
  reduce({ state, accept }) {
    return accept(state);
  },
});

const writeNoteFlow = defineFlow<typeof gameContract>()({
  type: "prompt",
  id: "write-note",
  title: "Write note",
  responseSchema: z.object({
    note: z.string(),
  }),
  context: z.object({
    source: z.string(),
  }),
  reduce({ state, accept }) {
    return accept(state);
  },
});

export default defineGame({
  contract: gameContract,
  initial: {
    public: ({ playerIds }) => ({
      currentPlayerId: playerIds[0] ?? null,
      notesByPlayerId: {},
    }),
    private: () => ({}),
    hidden: () => ({}),
  },
  initialPhase: "setup",
  phases: {
    setup: definePhase<typeof gameContract>()({
      kind: "player",
      state: z.object({}),
      initialState: () => ({}),
      flows: {
        chooseBonusFlow,
        writeNoteFlow,
      },
      actions: {
        openChoice: defineAction<typeof gameContract>()({
          params: z.object({}),
          reduce({ state, accept, fx }) {
            return accept(state, [
              fx.open(chooseBonusFlow, {
                to: "player-1",
                context: { source: "smoke" },
              }),
            ]);
          },
        }),
      },
    }),
  },
  views: {},
});
