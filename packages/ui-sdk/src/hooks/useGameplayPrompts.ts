import { usePluginState } from "../context/PluginStateContext.js";
import type { PromptId } from "@dreamboard/ui-contract";
import type {
  AnyGameplayPromptInstance,
  GameplayPromptInstance,
} from "../types/reducer-state.js";
import type { GameplayPromptInstance as RuntimeGameplayPromptInstance } from "../types/plugin-state.js";

function hasPromptId<Name extends PromptId>(
  prompt: RuntimeGameplayPromptInstance,
  promptId: Name,
): prompt is GameplayPromptInstance<Name> {
  return prompt.promptId === promptId;
}

/**
 * Hook to access active gameplay prompts for the controlling seat.
 */
export function useGameplayPrompts(): readonly AnyGameplayPromptInstance[];
export function useGameplayPrompts<Name extends PromptId>(
  promptId: Name,
): ReadonlyArray<GameplayPromptInstance<Name>>;
export function useGameplayPrompts<Name extends PromptId>(
  promptId?: Name,
):
  | readonly AnyGameplayPromptInstance[]
  | ReadonlyArray<GameplayPromptInstance<Name>> {
  const prompts = usePluginState(
    (state) => state.gameplay.prompts,
  ) as readonly RuntimeGameplayPromptInstance[];

  if (!promptId) {
    return prompts as readonly AnyGameplayPromptInstance[];
  }

  return prompts.filter((prompt) => hasPromptId(prompt, promptId));
}
