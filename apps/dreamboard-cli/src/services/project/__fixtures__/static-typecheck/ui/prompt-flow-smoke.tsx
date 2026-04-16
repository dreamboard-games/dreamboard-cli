import type { PromptResponse } from "@dreamboard/ui-contract";
import { useChoicePrompt, usePrompt } from "@dreamboard/ui-sdk";

export function PromptFlowSmoke() {
  const choice = useChoicePrompt("choose-bonus");
  const note = usePrompt("write-note");

  const choiceResponse: PromptResponse<"choose-bonus"> = "energy";
  const noteResponse: PromptResponse<"write-note"> = {
    note: "typed response",
  };

  void choice.isOpen;
  void choice.options;
  void choice.choose(choiceResponse);
  void note.isOpen;
  void note.respond(noteResponse);

  return null;
}
