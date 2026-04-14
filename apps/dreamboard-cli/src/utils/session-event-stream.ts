import { randomUUID } from "node:crypto";
import { subscribeToSessionEvents } from "@dreamboard/api-client";

const cliSessionEventClientId = `dreamboard-cli-${randomUUID()}`;

export async function subscribeToCliSessionEvents(options: {
  sessionId: string;
  signal: AbortSignal;
  clientSource: string;
}) {
  return subscribeToSessionEvents({
    path: { sessionId: options.sessionId },
    query: {
      clientId: cliSessionEventClientId,
      connectionAttemptId: randomUUID(),
      clientSource: options.clientSource,
    },
    signal: options.signal,
  });
}
