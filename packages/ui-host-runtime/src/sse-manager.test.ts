import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { ServerSentEventsResult } from "@dreamboard/api-client";
import { client } from "@dreamboard/api-client/client.gen";
import { SSEManager } from "./sse-manager.ts";

function createEmptyStream<T>(): ServerSentEventsResult<T>["stream"] {
  return (async function* () {})();
}

function createErrorStream<T>(
  onStart: () => void,
): ServerSentEventsResult<T>["stream"] {
  return {
    [Symbol.asyncIterator]() {
      let started = false;
      return {
        next: async () => {
          if (!started) {
            started = true;
            onStart();
          }

          return {
            done: true,
            value: undefined,
          };
        },
      };
    },
  } as ServerSentEventsResult<T>["stream"];
}

const noopLogger = {
  error: () => {},
  log: () => {},
  warn: () => {},
};

describe("SSEManager", () => {
  const originalPost = client.post;
  const originalSseGet = client.sse.get;

  beforeEach(() => {
    client.post = (async () => ({ data: undefined })) as typeof client.post;
  });

  afterEach(() => {
    client.post = originalPost;
    client.sse.get = originalSseGet;
  });

  test("connect subscribes without replay query parameters", async () => {
    let receivedQuery: unknown;

    client.sse.get = (async (options) => {
      receivedQuery = options.query;
      return { stream: createEmptyStream() };
    }) as typeof client.sse.get;

    const manager = new SSEManager({
      clientId: "tab-1",
      logger: noopLogger,
    });

    await manager.connect("session-1");

    expect(receivedQuery).toMatchObject({
      clientId: "tab-1",
    });
  });

  test("connect emits an error for fatal subscribe failures", async () => {
    const errors: unknown[] = [];
    let connected = false;

    client.sse.get = (async (options) => ({
      stream: createErrorStream(() => {
        options.onSseError?.(new Error("SSE failed: 429 Too Many Requests"));
      }),
    })) as typeof client.sse.get;

    const manager = new SSEManager({
      clientId: "tab-1",
      logger: noopLogger,
    });

    manager.on("connected", () => {
      connected = true;
    });
    manager.on("error", (error) => {
      errors.push(error);
    });

    await manager.connect("session-1");

    expect(connected).toBe(false);
    expect(manager.isStreamConnected()).toBe(false);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(Error);
    expect((errors[0] as Error).message).toContain("429");
  });
});
