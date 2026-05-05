import { randomUUID } from "node:crypto";
import {
  disconnectPlayerGameplayEvents,
  subscribeToPlayerGameplayEvents,
} from "@dreamboard/api-client";

const cliSessionEventClientId = `dreamboard-cli-${randomUUID()}`;

export async function subscribeToCliSessionEvents(options: {
  sessionId: string;
  signal: AbortSignal;
  clientSource: string;
  playerId: string;
  onSseError?: (error: unknown) => void;
  sseMaxRetryAttempts?: number;
  sseDefaultRetryDelay?: number;
}) {
  const connectionAttemptId = randomUUID();
  const response = await subscribeToPlayerGameplayEvents({
    path: { sessionId: options.sessionId, playerId: options.playerId },
    query: {
      clientId: cliSessionEventClientId,
      connectionAttemptId,
      clientSource: options.clientSource,
    },
    onSseError: options.onSseError,
    sseDefaultRetryDelay: options.sseDefaultRetryDelay,
    sseMaxRetryAttempts: options.sseMaxRetryAttempts,
    signal: options.signal,
  });
  return {
    ...response,
    disconnect: () =>
      disconnectPlayerGameplayEvents({
        path: { sessionId: options.sessionId, playerId: options.playerId },
        query: {
          clientId: cliSessionEventClientId,
          connectionAttemptId,
        },
      }),
  };
}
