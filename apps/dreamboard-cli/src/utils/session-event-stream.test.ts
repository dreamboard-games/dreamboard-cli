import { beforeEach, expect, mock, test } from "bun:test";

const subscribeToSessionEvents = mock(async () => ({
  stream: new ReadableStream(),
}));

mock.module("@dreamboard/api-client", () => ({
  subscribeToSessionEvents,
}));

const { subscribeToCliSessionEvents } = await import(
  "./session-event-stream.ts"
);

beforeEach(() => {
  subscribeToSessionEvents.mockClear();
});

test("reuses a stable CLI client id across reconnect attempts", async () => {
  const signal = new AbortController().signal;

  await subscribeToCliSessionEvents({
    sessionId: "session-1",
    signal,
    clientSource: "dreamboard-test",
  });
  await subscribeToCliSessionEvents({
    sessionId: "session-1",
    signal,
    clientSource: "dreamboard-test",
  });

  const calls = subscribeToSessionEvents.mock.calls as Array<
    [
      {
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
  expect(secondCall?.query.clientId).toBe(firstCall?.query.clientId);
  expect(secondCall?.query.connectionAttemptId).not.toBe(
    firstCall?.query.connectionAttemptId,
  );
});
