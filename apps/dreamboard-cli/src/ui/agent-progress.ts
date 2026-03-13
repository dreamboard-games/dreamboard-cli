import type { AgentProgressEvent } from "@dreamboard/api-client";
import { streamConversation } from "@dreamboard/api-client";
import type { RenderState } from "../types.js";

export async function streamJobProgress(
  conversationId: string,
  signal: AbortSignal,
): Promise<{ cancelled: boolean }> {
  console.log("Streaming job progress (Ctrl+C to cancel)...");

  const { stream } = await streamConversation({
    path: { conversationId },
    signal,
  });

  let cancelled = false;
  const state: RenderState = {
    buffers: new Map<string, string>(),
    opened: new Set<string>(),
  };

  try {
    for await (const event of stream) {
      if (!event || typeof event.type !== "string") continue;

      const result = renderAgentProgress(event as AgentProgressEvent, state);

      if (event.type === "jobCancelled") {
        cancelled = true;
        break;
      }
      if (event.type === "jobComplete") {
        break;
      }
      if (event.type === "error" && result?.fatal) {
        break;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // Stream was cancelled
    } else {
      throw error;
    }
  }

  if (state.opened.size > 0) {
    process.stdout.write("\n");
  }

  return { cancelled };
}

export function renderAgentProgress(
  event: AgentProgressEvent,
  state: RenderState,
): { fatal?: boolean } {
  switch (event.type) {
    case "userMessage": {
      const content = typeof event.content === "string" ? event.content : "";
      if (content) {
        process.stdout.write(`\n[user] ${content}\n`);
      }
      break;
    }
    case "utterance": {
      const utterance =
        typeof event.utterance === "string" ? event.utterance : "";
      const messageId =
        typeof event.messageId === "string" ? event.messageId : "utterance";
      streamTextDelta(
        state,
        messageId,
        utterance,
        event.agentName as string | undefined,
        "assistant",
      );
      break;
    }
    case "reasoning": {
      // Skip verbose reasoning output in CLI
      break;
    }
    case "toolCall": {
      const toolName =
        typeof event.toolName === "string" ? event.toolName : "unknown";
      process.stdout.write(`\n[tool] ${toolName}\n`);
      break;
    }
    case "toolExecutionError": {
      const toolName =
        typeof event.toolName === "string" ? event.toolName : "unknown";
      const message =
        typeof event.errorMessage === "string"
          ? event.errorMessage
          : "Unknown error";
      process.stdout.write(`\n[tool-error] ${toolName}: ${message}\n`);
      break;
    }
    case "error": {
      const message =
        typeof event.message === "string" ? event.message : "Unknown error";
      process.stdout.write(`\n[error] ${message}\n`);
      return { fatal: true };
    }
    case "streamComplete": {
      process.stdout.write("\n");
      break;
    }
    case "jobComplete": {
      const success = event.success === true;
      const createdRuleId =
        typeof event.createdRuleId === "string" ? event.createdRuleId : null;
      const createdManifestId =
        typeof event.createdManifestId === "string"
          ? event.createdManifestId
          : null;
      process.stdout.write(
        `\n[job] ${success ? "Complete" : "Failed"}` +
          (createdRuleId ? ` rule=${createdRuleId}` : "") +
          (createdManifestId ? ` manifest=${createdManifestId}` : "") +
          "\n",
      );
      break;
    }
    case "jobCancelled": {
      process.stdout.write("\n[job] Cancelled\n");
      break;
    }
    default:
      break;
  }
  return {};
}

export function streamTextDelta(
  state: RenderState,
  messageId: string,
  text: string,
  agentName: string | undefined,
  label: string,
) {
  const previous = state.buffers.get(messageId) ?? "";
  const next = text ?? "";
  if (next.length === 0) {
    return;
  }

  if (!state.opened.has(messageId)) {
    const prefix = agentName ? `[${label}:${agentName}] ` : `[${label}] `;
    process.stdout.write(`\n${prefix}`);
    state.opened.add(messageId);
  }

  if (next.startsWith(previous)) {
    const delta = next.slice(previous.length);
    if (delta.length > 0) {
      process.stdout.write(delta);
    }
  } else {
    process.stdout.write(`\n${next}`);
  }

  state.buffers.set(messageId, next);
}
