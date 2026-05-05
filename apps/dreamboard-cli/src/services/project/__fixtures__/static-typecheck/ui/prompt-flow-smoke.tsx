import { useInteractionHandle, useSeatInbox } from "@dreamboard/ui-sdk";
import type { InteractionDescriptor } from "@dreamboard/ui-sdk";

const MISSING: InteractionDescriptor = {
  phaseName: "__missing__",
  interactionKey: "__missing__.__missing__",
  interactionId: "__missing__",
  surface: "inbox",
  kind: "action",
  label: "Missing",
  inputs: [],
  available: false,
};

export function PromptFlowSmoke() {
  const inbox = useSeatInbox();
  const inboxItems = inbox.bySurface.inbox ?? [];
  const chooseBonus: InteractionDescriptor =
    inboxItems.find((p) => p.interactionId === "chooseBonus") ?? MISSING;
  const writeNote: InteractionDescriptor =
    inboxItems.find((p) => p.interactionId === "writeNote") ?? MISSING;
  const chooseHandle = useInteractionHandle(chooseBonus);
  const writeHandle = useInteractionHandle(writeNote);

  void chooseHandle.available;
  void chooseHandle.submit({ choice: "energy" });
  void writeHandle.available;
  void writeHandle.submit({ note: "typed response" });

  return null;
}
