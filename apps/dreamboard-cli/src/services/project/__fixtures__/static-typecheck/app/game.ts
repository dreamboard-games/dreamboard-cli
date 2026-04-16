import { z } from "zod";
import {
  defineAction,
  defineChoiceFlow,
  defineGame,
  definePhase,
  definePrompt,
  definePromptFlow,
} from "@dreamboard/app-sdk/reducer";
import { gameContract } from "./game-contract";

const chooseBonusFlow = defineChoiceFlow<typeof gameContract>()({
  id: "choose-bonus",
  title: "Choose bonus",
  options: [
    { id: "energy", label: "Energy" },
    { id: "steel", label: "Steel" },
  ] as const,
  data: z.object({
    source: z.string(),
  }),
  reduce({ state, accept }) {
    return accept(state);
  },
});

const writeNotePrompt = definePrompt<typeof gameContract>()({
  id: "write-note",
  title: "Write note",
  responseSchema: z.object({
    note: z.string(),
  }),
});

const writeNoteFlow = definePromptFlow<typeof gameContract>()({
  prompt: writeNotePrompt,
  data: z.object({
    source: z.string(),
  }),
  reduce({ state, accept }) {
    return accept(state);
  },
});

export default defineGame({
  contract: gameContract,
  initial: {
    public: () => ({}),
    private: () => ({}),
    hidden: () => ({}),
  },
  initialPhase: "prompt-phase",
  phases: {
    "prompt-phase": definePhase<typeof gameContract>()({
      kind: "player",
      state: z.object({}),
      initialState: () => ({}),
      promptFlows: {
        chooseBonusFlow,
        writeNoteFlow,
      },
      actions: {
        openChoice: defineAction<typeof gameContract>()({
          params: z.object({}),
          reduce({ state, accept, effects }) {
            return accept(state, [
              chooseBonusFlow.open(effects, {
                to: "player-1",
                data: { source: "smoke" },
              }),
            ]);
          },
        }),
      },
    }),
  },
  views: {},
});
