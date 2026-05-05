import { beforeEach, expect, mock, test } from "bun:test";

const subscribeToPlayerGameplayEvents = mock(async () => ({
  stream: new ReadableStream(),
}));
const disconnectPlayerGameplayEvents = mock(async () => ({}));
const listPlayerActions = mock();
const describePlayerAction = mock();
const getPlayerActionTargets = mock();
const validatePlayerAction = mock();
const submitPlayerAction = mock();

mock.module("@dreamboard/api-client", () => ({
  describePlayerAction,
  disconnectPlayerGameplayEvents,
  getPlayerActionTargets,
  listPlayerActions,
  submitPlayerAction,
  subscribeToPlayerGameplayEvents,
  validatePlayerAction,
}));

const { subscribeToCliSessionEvents } = await import(
  "./session-event-stream.ts"
);

beforeEach(() => {
  subscribeToPlayerGameplayEvents.mockClear();
  disconnectPlayerGameplayEvents.mockClear();
});

test("reuses a stable CLI client id across reconnect attempts", async () => {
  const signal = new AbortController().signal;

  await subscribeToCliSessionEvents({
    sessionId: "session-1",
    signal,
    clientSource: "dreamboard-test",
    playerId: "player-1",
    sseDefaultRetryDelay: 250,
    sseMaxRetryAttempts: 1,
  });
  await subscribeToCliSessionEvents({
    sessionId: "session-1",
    signal,
    clientSource: "dreamboard-test",
    playerId: "player-1",
  });

  const calls = subscribeToPlayerGameplayEvents.mock.calls as Array<
    [
      {
        path: {
          sessionId: string;
          playerId: string;
        };
        query: {
          clientId: string;
          connectionAttemptId: string;
          clientSource: string;
        };
      },
    ]
  >;
  const firstCall = calls[0]?.[0];
  const secondCall = calls[1]?.[0];

  expect(firstCall?.query.clientId).toMatch(/^dreamboard-cli-/);
  expect(firstCall?.path).toEqual({
    sessionId: "session-1",
    playerId: "player-1",
  });
  expect(firstCall).toEqual(
    expect.objectContaining({
      sseDefaultRetryDelay: 250,
      sseMaxRetryAttempts: 1,
    }),
  );
  expect(secondCall?.query.clientId).toBe(firstCall?.query.clientId);
  expect(secondCall?.query.connectionAttemptId).not.toBe(
    firstCall?.query.connectionAttemptId,
  );
});

test("disconnects the same scoped gameplay stream", async () => {
  const signal = new AbortController().signal;

  const subscription = await subscribeToCliSessionEvents({
    sessionId: "session-1",
    signal,
    clientSource: "dreamboard-test",
    playerId: "player-2",
  });
  await subscription.disconnect();

  expect(disconnectPlayerGameplayEvents).toHaveBeenCalledWith({
    path: {
      sessionId: "session-1",
      playerId: "player-2",
    },
    query: {
      clientId: expect.stringMatching(/^dreamboard-cli-/),
      connectionAttemptId: expect.any(String),
    },
  });
});
