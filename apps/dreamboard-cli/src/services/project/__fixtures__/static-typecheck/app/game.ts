import { z } from "zod";
import {
  defineGame,
  definePhase,
  defineInteraction,
  choiceTarget,
  promptInput,
} from "@dreamboard/app-sdk/reducer";
import { gameContract } from "./game-contract";

const setupPhaseStateSchema = z.object({});

const bonusChoiceTarget = choiceTarget
  .options([
    { id: "energy", label: "Energy" },
    { id: "steel", label: "Steel" },
  ] as const)
  .build();

const chooseBonus = defineInteraction<
  typeof gameContract,
  typeof setupPhaseStateSchema
>()({
  surface: "inbox",
  label: "Choose bonus",
  title: "Choose bonus",
  inputs: {
    choice: promptInput({
      schema: z.enum(["energy", "steel"]),
      target: bonusChoiceTarget,
    }),
  },
  to: ({ state }) => state.publicState.currentPlayerId,
  reduce({ state, accept }) {
    return accept(state);
  },
});

const writeNote = defineInteraction<
  typeof gameContract,
  typeof setupPhaseStateSchema
>()({
  surface: "inbox",
  label: "Write note",
  title: "Write note",
  inputs: {
    note: promptInput({ schema: z.string() }),
  },
  to: ({ state }) => state.publicState.currentPlayerId,
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
      state: setupPhaseStateSchema,
      initialState: () => ({}),
      interactions: {
        chooseBonus,
        writeNote,
      },
    }),
  },
  views: {},
});
