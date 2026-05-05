import { PassThrough } from "node:stream";
import { beforeEach, expect, mock, test } from "bun:test";
import type {
  GameMessage,
  InteractionDescriptor,
  PlayerGameplaySnapshot,
} from "@dreamboard/api-client";
import { runJoinJsonlSession } from "./jsonl-bot-session.js";

function createLineCollector(stream: PassThrough) {
  const lines: unknown[] = [];
  let buffer = "";
  const waiters: Array<() => void> = [];

  stream.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    while (buffer.includes("\n")) {
      const index = buffer.indexOf("\n");
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);
      if (line.trim()) {
        lines.push(JSON.parse(line));
      }
    }
    while (waiters.length > 0) {
      waiters.shift()?.();
    }
  });

  return {
    async waitFor(predicate: (line: unknown) => boolean): Promise<unknown> {
      while (true) {
        const match = lines.find(predicate);
        if (match) {
          return match;
        }
        await new Promise<void>((resolve) => waiters.push(resolve));
      }
    },
  };
}

function createEventQueue() {
  const events: GameMessage[] = [];
  const waiters: Array<() => void> = [];
  let closed = false;

  return {
    push(event: GameMessage) {
      events.push(event);
      waiters.shift()?.();
    },
    close() {
      closed = true;
      waiters.shift()?.();
    },
    async *stream() {
      while (!closed || events.length > 0) {
        const event = events.shift();
        if (event) {
          yield event;
          continue;
        }
        await new Promise<void>((resolve) => waiters.push(resolve));
      }
    },
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function makeGameplay(version: number): PlayerGameplaySnapshot {
  return {
    version,
    actionSetVersion: `${version}:abc`,
    playerId: "player-1",
    activePlayers: ["player-1"],
    currentPhase: "playerTurn",
    currentStage: "main",
    stageSeats: ["player-1"],
    view: JSON.stringify({ hand: [], score: version }),
    availableInteractions: [],
    zones: {},
    boardStatic: JSON.stringify({ boardId: "island", version }),
    boardStaticHash: `static-${version}`,
  };
}

function makeAction(interactionId = "buildRoad"): InteractionDescriptor {
  return {
    phaseName: "playerTurn",
    interactionKey: `playerTurn.${interactionId}`,
    interactionId,
    surface: "board-edge",
    kind: "action",
    label: "Build road",
    inputs: [
      {
        key: "edgeId",
        kind: "board-edge",
        domain: {
          type: "target",
          targetKind: "edge",
          boardId: "island",
          eligibleTargets: ["edge-1"],
        },
      },
    ],
    available: true,
  };
}

function bootstrap(version = 1): GameMessage {
  return {
    type: "gameplay.bootstrap",
    gameplay: makeGameplay(version),
  } as GameMessage;
}

let listPlayerActionsMock: ReturnType<typeof mock>;
let describePlayerActionMock: ReturnType<typeof mock>;
let getPlayerActionTargetsMock: ReturnType<typeof mock>;
let validatePlayerActionMock: ReturnType<typeof mock>;
let submitPlayerActionMock: ReturnType<typeof mock>;

beforeEach(() => {
  listPlayerActionsMock = mock(async () => ({
    data: {
      version: 1,
      actionSetVersion: "1:abc",
      actions: [makeAction()],
    },
  }));
  describePlayerActionMock = mock(async () => ({
    data: {
      version: 1,
      actionSetVersion: "1:abc",
      action: makeAction(),
    },
  }));
  getPlayerActionTargetsMock = mock(async () => ({
    data: {
      version: 1,
      actionSetVersion: "1:abc",
      interactionId: "buildRoad",
      inputKey: "edgeId",
      domain: {
        type: "target",
        targetKind: "edge",
        boardId: "island",
        eligibleTargets: ["edge-1"],
      },
    },
  }));
  validatePlayerActionMock = mock(async () => ({
    data: {
      valid: true,
      version: 1,
      actionSetVersion: "1:abc",
    },
  }));
  submitPlayerActionMock = mock(async () => ({
    data: {
      accepted: true,
      version: 2,
      actionSetVersion: "2:def",
      gameplay: makeGameplay(2),
    },
  }));
});

async function startHarness(events = [bootstrap()]) {
  const input = new PassThrough();
  const output = new PassThrough();
  const errorOutput = new PassThrough();
  const collector = createLineCollector(output);
  const queue = createEventQueue();
  const disconnect = mock(async () => {});
  const subscribeToEvents = mock(async () => ({
    stream: queue.stream(),
    disconnect,
  }));
  const run = runJoinJsonlSession({
    sessionId: "session-1",
    playerId: "player-1",
    input,
    output,
    errorOutput,
    subscribeToEvents,
    listPlayerActions: listPlayerActionsMock as never,
    describePlayerAction: describePlayerActionMock as never,
    getPlayerActionTargets: getPlayerActionTargetsMock as never,
    validatePlayerAction: validatePlayerActionMock as never,
    submitPlayerAction: submitPlayerActionMock as never,
  });

  for (const event of events) {
    queue.push(event);
  }

  return { input, collector, queue, run, subscribeToEvents, disconnect };
}

test("actions.list requires a scoped gameplay bootstrap before calling action endpoints", async () => {
  const { input, collector, queue, run } = await startHarness([]);

  input.write(JSON.stringify({ id: "1", method: "actions.list" }) + "\n");

  await expect(
    collector.waitFor((line) => (line as { id?: unknown }).id === "1"),
  ).resolves.toMatchObject({
    id: "1",
    error: { code: "NOT_READY" },
  });
  expect(listPlayerActionsMock).not.toHaveBeenCalled();

  input.end();
  queue.close();
  await run;
});

test("emits a JSONL stream error when gameplay SSE cannot bootstrap", async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  const errorOutput = new PassThrough();
  const collector = createLineCollector(output);
  const subscribeToEvents = mock(
    async (options: { onSseError?: (error: unknown) => void }) => {
      options.onSseError?.(new Error("SSE failed: 404 Not Found"));
      return {
        stream: (async function* () {})(),
        disconnect: mock(async () => {}),
      };
    },
  );

  const run = runJoinJsonlSession({
    sessionId: "missing-session",
    playerId: "player-1",
    input,
    output,
    errorOutput,
    subscribeToEvents: subscribeToEvents as never,
    listPlayerActions: listPlayerActionsMock as never,
    describePlayerAction: describePlayerActionMock as never,
    getPlayerActionTargets: getPlayerActionTargetsMock as never,
    validatePlayerAction: validatePlayerActionMock as never,
    submitPlayerAction: submitPlayerActionMock as never,
  });

  await expect(
    collector.waitFor((line) => (line as { type?: unknown }).type === "error"),
  ).resolves.toMatchObject({
    type: "error",
    error: {
      code: "EVENT_STREAM_ERROR",
      message: "SSE failed: 404 Not Found",
    },
  });

  expect(subscribeToEvents).toHaveBeenCalledWith(
    expect.objectContaining({
      sseDefaultRetryDelay: 250,
      sseMaxRetryAttempts: 1,
    }),
  );

  await run;
});

test("actions methods call server-authored action endpoints", async () => {
  const { input, collector, queue, run } = await startHarness();
  await expect(
    collector.waitFor((line) => (line as { type?: unknown }).type === "event"),
  ).resolves.toMatchObject({
    type: "event",
    event: {
      type: "gameplay.bootstrap",
      gameplay: {
        playerId: "player-1",
        version: 1,
        view: { hand: [], score: 1 },
        boardStatic: { boardId: "island", version: 1 },
      },
    },
  });

  input.write(JSON.stringify({ id: "list", method: "actions.list" }) + "\n");
  input.write(
    JSON.stringify({
      id: "describe",
      method: "actions.describe",
      params: { interactionId: "buildRoad" },
    }) + "\n",
  );
  input.write(
    JSON.stringify({
      id: "targets",
      method: "actions.targets",
      params: { interactionId: "buildRoad", inputKey: "edgeId" },
    }) + "\n",
  );

  await expect(
    collector.waitFor((line) => (line as { id?: unknown }).id === "list"),
  ).resolves.toMatchObject({
    id: "list",
    result: {
      version: 1,
      actionSetVersion: "1:abc",
      actions: [
        {
          interactionId: "buildRoad",
          inputs: [
            {
              key: "edgeId",
              domain: {
                type: "target",
                targetKind: "edge",
                eligibleTargets: ["edge-1"],
              },
            },
          ],
        },
      ],
    },
  });
  await expect(
    collector.waitFor((line) => (line as { id?: unknown }).id === "describe"),
  ).resolves.toMatchObject({
    id: "describe",
    result: {
      version: 1,
      actionSetVersion: "1:abc",
      action: {
        interactionId: "buildRoad",
        inputs: [
          {
            key: "edgeId",
            domain: {
              type: "target",
              targetKind: "edge",
              eligibleTargets: ["edge-1"],
            },
          },
        ],
      },
    },
  });
  await expect(
    collector.waitFor((line) => (line as { id?: unknown }).id === "targets"),
  ).resolves.toMatchObject({
    id: "targets",
    result: {
      version: 1,
      actionSetVersion: "1:abc",
      interactionId: "buildRoad",
      inputKey: "edgeId",
      domain: {
        type: "target",
        targetKind: "edge",
        boardId: "island",
        eligibleTargets: ["edge-1"],
      },
    },
  });

  expect(listPlayerActionsMock).toHaveBeenCalledWith({
    path: { sessionId: "session-1", playerId: "player-1" },
  });
  expect(describePlayerActionMock).toHaveBeenCalledWith({
    path: {
      sessionId: "session-1",
      playerId: "player-1",
      interactionId: "buildRoad",
    },
  });
  expect(getPlayerActionTargetsMock).toHaveBeenCalledWith({
    path: {
      sessionId: "session-1",
      playerId: "player-1",
      interactionId: "buildRoad",
      inputKey: "edgeId",
    },
  });

  input.end();
  queue.close();
  await run;
});

test("actions methods reject legacy nested params input payloads", async () => {
  const { input, collector, queue, run } = await startHarness();
  await collector.waitFor(
    (line) => (line as { type?: unknown }).type === "event",
  );

  input.write(
    JSON.stringify({
      id: "legacy",
      method: "actions.validate",
      params: {
        interactionId: "buildRoad",
        expectedVersion: 1,
        actionSetVersion: "1:abc",
        params: { edgeId: "edge-1" },
      },
    }) + "\n",
  );

  await expect(
    collector.waitFor((line) => (line as { id?: unknown }).id === "legacy"),
  ).resolves.toMatchObject({
    id: "legacy",
    error: { code: "INVALID_PARAMS" },
  });
  expect(validatePlayerActionMock).not.toHaveBeenCalled();

  input.end();
  queue.close();
  await run;
});

test("actions.validate and actions.submit send normalized collector-shaped inputs", async () => {
  const { input, collector, queue, run } = await startHarness();
  await collector.waitFor(
    (line) => (line as { type?: unknown }).type === "event",
  );

  const params = {
    interactionId: "buildRoad",
    expectedVersion: 1,
    actionSetVersion: "1:abc",
    inputs: { edgeId: "edge-1" },
  };
  input.write(
    JSON.stringify({ id: "validate", method: "actions.validate", params }) +
      "\n",
  );
  input.write(
    JSON.stringify({ id: "submit", method: "actions.submit", params }) + "\n",
  );

  const validateResponse = await collector.waitFor(
    (line) => (line as { id?: unknown }).id === "validate",
  );
  const submitResponse = await collector.waitFor(
    (line) => (line as { id?: unknown }).id === "submit",
  );

  const expectedRequest = {
    path: {
      sessionId: "session-1",
      playerId: "player-1",
      interactionId: "buildRoad",
    },
    body: {
      expectedVersion: 1,
      actionSetVersion: "1:abc",
      inputs: { edgeId: "edge-1" },
    },
  };
  expect(validatePlayerActionMock).toHaveBeenCalledWith(expectedRequest);
  expect(submitPlayerActionMock).toHaveBeenCalledWith(expectedRequest);
  expect(validateResponse).toMatchObject({
    id: "validate",
    result: { valid: true, version: 1, actionSetVersion: "1:abc" },
  });
  expect(submitResponse).toMatchObject({
    id: "submit",
    result: {
      accepted: true,
      version: 2,
      actionSetVersion: "2:def",
      gameplay: {
        playerId: "player-1",
        version: 2,
        view: { hand: [], score: 2 },
        boardStatic: { boardId: "island", version: 2 },
      },
    },
  });

  input.end();
  queue.close();
  await run;
});

test("framing rejects malformed, missing id, and duplicate in-flight ids", async () => {
  const deferred = createDeferred<{
    data: { valid: boolean; version: number; actionSetVersion: string };
  }>();
  validatePlayerActionMock = mock(async () => deferred.promise);
  const { input, collector, queue, run } = await startHarness();
  await collector.waitFor(
    (line) => (line as { type?: unknown }).type === "event",
  );

  input.write("{oops\n");
  input.write(JSON.stringify({ method: "actions.list" }) + "\n");
  input.write(
    JSON.stringify({
      id: "same",
      method: "actions.validate",
      params: {
        interactionId: "buildRoad",
        expectedVersion: 1,
        actionSetVersion: "1:abc",
        inputs: { edgeId: "edge-1" },
      },
    }) + "\n",
  );
  input.write(JSON.stringify({ id: "same", method: "actions.list" }) + "\n");

  await expect(
    collector.waitFor(
      (line) =>
        (line as { error?: { code?: string } }).error?.code === "INVALID_JSON",
    ),
  ).resolves.toMatchObject({ id: null });
  await expect(
    collector.waitFor(
      (line) =>
        (line as { error?: { code?: string } }).error?.code === "MISSING_ID",
    ),
  ).resolves.toMatchObject({ id: null });
  await expect(
    collector.waitFor((line) => {
      const value = line as { id?: unknown; error?: { code?: string } };
      return (
        value.id === "same" && value.error?.code === "DUPLICATE_IN_FLIGHT_ID"
      );
    }),
  ).resolves.toMatchObject({
    id: "same",
    error: { code: "DUPLICATE_IN_FLIGHT_ID" },
  });

  deferred.resolve({
    data: { valid: true, version: 1, actionSetVersion: "1:abc" },
  });
  await collector.waitFor((line) => {
    const value = line as { id?: unknown; result?: unknown };
    return value.id === "same" && Boolean(value.result);
  });

  input.end();
  queue.close();
  await run;
});

test("gameplay events interleave with request responses and disconnect on shutdown", async () => {
  const deferred = createDeferred<{
    data: { valid: boolean; version: number; actionSetVersion: string };
  }>();
  validatePlayerActionMock = mock(async () => deferred.promise);
  const { input, collector, queue, run, disconnect } = await startHarness();
  await collector.waitFor(
    (line) => (line as { type?: unknown }).type === "event",
  );

  input.write(
    JSON.stringify({
      id: "validate",
      method: "actions.validate",
      params: {
        interactionId: "buildRoad",
        expectedVersion: 1,
        actionSetVersion: "1:abc",
        inputs: { edgeId: "edge-1" },
      },
    }) + "\n",
  );
  queue.push({
    type: "gameplay.updated",
    gameplay: makeGameplay(2),
  } as GameMessage);

  await expect(
    collector.waitFor((line) => {
      const value = line as {
        type?: unknown;
        event?: { type?: string; gameplay?: { version?: number } };
      };
      return value.type === "event" && value.event?.gameplay?.version === 2;
    }),
  ).resolves.toMatchObject({
    type: "event",
    event: {
      type: "gameplay.updated",
      gameplay: { playerId: "player-1", version: 2 },
    },
  });

  deferred.resolve({
    data: { valid: false, version: 2, actionSetVersion: "2:def" },
  });
  await expect(
    collector.waitFor((line) => (line as { id?: unknown }).id === "validate"),
  ).resolves.toMatchObject({
    id: "validate",
    result: { valid: false, version: 2, actionSetVersion: "2:def" },
  });

  input.end();
  queue.close();
  await run;
  expect(disconnect).toHaveBeenCalled();
});
