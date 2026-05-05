import { createInterface } from "node:readline";
import {
  describePlayerAction,
  getPlayerActionTargets,
  listPlayerActions,
  submitPlayerAction,
  validatePlayerAction,
  type GameMessage,
  type PlayerGameplaySnapshot,
} from "@dreamboard/api-client";
import { toApiProblem } from "../../utils/errors.js";
import { subscribeToCliSessionEvents } from "../../utils/session-event-stream.js";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

type JsonObject = { [key: string]: JsonValue };
type RequestId = string | number;

type JoinRequest = {
  id?: unknown;
  method?: unknown;
  params?: unknown;
};

type JoinProtocolError = {
  code: string;
  message: string;
  details?: JsonObject;
};

type JoinSuccessEnvelope = {
  id: RequestId;
  result: JsonValue;
};

type JoinErrorEnvelope = {
  id: RequestId | null;
  error: JoinProtocolError;
};

type JoinEventEnvelope = {
  type: "event";
  event: JsonObject;
};

type JoinStreamErrorEnvelope = {
  type: "error";
  error: JoinProtocolError;
};

type ProtocolEnvelope =
  | JoinSuccessEnvelope
  | JoinErrorEnvelope
  | JoinEventEnvelope
  | JoinStreamErrorEnvelope;

type SubscribeToEvents = typeof subscribeToCliSessionEvents;
type ListPlayerActions = typeof listPlayerActions;
type DescribePlayerAction = typeof describePlayerAction;
type GetPlayerActionTargets = typeof getPlayerActionTargets;
type ValidatePlayerAction = typeof validatePlayerAction;
type SubmitPlayerAction = typeof submitPlayerAction;

export type JoinJsonlSessionOptions = {
  sessionId: string;
  playerId: string;
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
  errorOutput?: NodeJS.WritableStream;
  subscribeToEvents?: SubscribeToEvents;
  listPlayerActions?: ListPlayerActions;
  describePlayerAction?: DescribePlayerAction;
  getPlayerActionTargets?: GetPlayerActionTargets;
  validatePlayerAction?: ValidatePlayerAction;
  submitPlayerAction?: SubmitPlayerAction;
  signal?: AbortSignal;
};

class JsonlWriter {
  private writeChain: Promise<void> = Promise.resolve();

  constructor(private readonly output: NodeJS.WritableStream) {}

  write(envelope: ProtocolEnvelope): Promise<void> {
    this.writeChain = this.writeChain.then(
      () =>
        new Promise<void>((resolve, reject) => {
          const line = `${JSON.stringify(normalizeEnvelopeForJsonl(envelope))}\n`;
          const flushed = this.output.write(line, (error?: Error | null) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
          if (!flushed) {
            this.output.once("error", reject);
          }
        }),
    );
    return this.writeChain;
  }
}

function normalizeEnvelopeForJsonl(
  envelope: ProtocolEnvelope,
): ProtocolEnvelope {
  if ("event" in envelope) {
    return {
      ...envelope,
      event: normalizeProtocolValue(envelope.event) as JsonObject,
    };
  }
  if ("result" in envelope) {
    return {
      ...envelope,
      result: normalizeProtocolValue(envelope.result),
    };
  }
  return envelope;
}

function normalizeProtocolValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeProtocolValue(entry));
  }
  if (!isJsonObject(value)) {
    return value;
  }

  const normalized: JsonObject = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key === "gameplay" && isJsonObject(entry)) {
      normalized[key] = normalizeGameplaySnapshotForJsonl(entry);
      continue;
    }
    normalized[key] = normalizeProtocolValue(entry);
  }
  return normalized;
}

function normalizeGameplaySnapshotForJsonl(gameplay: JsonObject): JsonObject {
  const normalized: JsonObject = {};
  for (const [key, value] of Object.entries(gameplay)) {
    if (
      (key === "view" || key === "boardStatic") &&
      typeof value === "string"
    ) {
      normalized[key] = parseJsonField(key, value);
      continue;
    }
    normalized[key] = normalizeProtocolValue(value);
  }
  return normalized;
}

function parseJsonField(field: string, value: string): JsonValue {
  try {
    return JSON.parse(value) as JsonValue;
  } catch (error) {
    throw protocolError(
      "INVALID_GAMEPLAY_JSON",
      `Gameplay field '${field}' was not valid JSON: ${formatUnknown(error)}`,
    );
  }
}

export async function runJoinJsonlSession(
  options: JoinJsonlSessionOptions,
): Promise<void> {
  const input = options.input ?? process.stdin;
  const writer = new JsonlWriter(options.output ?? process.stdout);
  const errorOutput = options.errorOutput ?? process.stderr;
  const abortController = new AbortController();
  const inFlightIds = new Set<RequestId>();
  const pendingRequests = new Set<Promise<void>>();
  const state = new JoinBotState(options.playerId);
  const subscribe = options.subscribeToEvents ?? subscribeToCliSessionEvents;
  const listActions = options.listPlayerActions ?? listPlayerActions;
  const describeAction = options.describePlayerAction ?? describePlayerAction;
  const getActionTargets =
    options.getPlayerActionTargets ?? getPlayerActionTargets;
  const validateAction = options.validatePlayerAction ?? validatePlayerAction;
  const submitAction = options.submitPlayerAction ?? submitPlayerAction;

  const rl = createInterface({
    input,
    crlfDelay: Infinity,
    terminal: false,
  });
  const abort = () => {
    abortController.abort();
    rl.close();
  };

  const eventPump = pumpSessionEvents({
    sessionId: options.sessionId,
    playerId: options.playerId,
    writer,
    state,
    subscribe,
    signal: abortController.signal,
    errorOutput,
  })
    .catch((error) => {
      errorOutput.write(
        `dreamboard join event pump failed: ${formatUnknown(error)}\n`,
      );
    })
    .finally(() => {
      if (!abortController.signal.aborted) {
        abort();
      }
    });
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) {
    abort();
  }

  try {
    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      let parsed: JoinRequest;
      try {
        parsed = JSON.parse(trimmed) as JoinRequest;
      } catch (error) {
        void writer.write({
          id: null,
          error: protocolError(
            "INVALID_JSON",
            error instanceof Error ? error.message : "Invalid JSON line.",
          ),
        });
        continue;
      }

      const requestId = parseRequestId(parsed.id);
      if (!requestId.ok) {
        void writer.write({
          id: null,
          error: requestId.error,
        });
        continue;
      }

      if (inFlightIds.has(requestId.value)) {
        void writer.write({
          id: requestId.value,
          error: protocolError(
            "DUPLICATE_IN_FLIGHT_ID",
            `Request id '${String(requestId.value)}' is already in flight.`,
          ),
        });
        continue;
      }

      inFlightIds.add(requestId.value);
      const requestPromise = handleRequest({
        request: parsed,
        requestId: requestId.value,
        sessionId: options.sessionId,
        playerId: options.playerId,
        state,
        listActions,
        describeAction,
        getActionTargets,
        validateAction,
        submitAction,
      })
        .then((result) =>
          writer.write({
            id: requestId.value,
            result,
          }),
        )
        .catch((error) =>
          writer.write({
            id: requestId.value,
            error: coerceProtocolError(error),
          }),
        )
        .finally(() => {
          inFlightIds.delete(requestId.value);
          pendingRequests.delete(requestPromise);
        });
      pendingRequests.add(requestPromise);
    }

    await Promise.all([...pendingRequests]);
  } finally {
    rl.close();
    abortController.abort();
    options.signal?.removeEventListener("abort", abort);
    void eventPump;
  }
}

async function pumpSessionEvents(options: {
  sessionId: string;
  playerId: string;
  writer: JsonlWriter;
  state: JoinBotState;
  subscribe: SubscribeToEvents;
  signal: AbortSignal;
  errorOutput: NodeJS.WritableStream;
}): Promise<void> {
  try {
    let lastSseError: unknown;
    const subscription = await options.subscribe({
      sessionId: options.sessionId,
      playerId: options.playerId,
      signal: options.signal,
      clientSource: "dreamboard-join",
      onSseError: (error) => {
        lastSseError = error;
      },
      sseDefaultRetryDelay: 250,
      sseMaxRetryAttempts: 1,
    });
    const { stream } = subscription;

    try {
      for await (const event of stream) {
        if (!event) {
          continue;
        }
        options.state.applyEvent(event);
        await options.writer.write({
          type: "event",
          event: event as unknown as JsonObject,
        });
      }
      if (!options.signal.aborted) {
        throw (
          lastSseError ??
          new Error(
            "Gameplay event stream closed before the join session ended.",
          )
        );
      }
    } finally {
      await subscription.disconnect?.().catch(() => {});
    }
  } catch (error) {
    if (options.signal.aborted) {
      return;
    }
    options.errorOutput.write(
      `dreamboard join event stream failed: ${formatUnknown(error)}\n`,
    );
    await options.writer.write({
      type: "error",
      error: protocolError("EVENT_STREAM_ERROR", formatUnknown(error)),
    });
  }
}

class JoinBotState {
  private hasBootstrap = false;

  constructor(readonly playerId: string) {}

  applyEvent(event: GameMessage): void {
    switch (event.type) {
      case "gameplay.bootstrap": {
        this.assertScopedGameplay(event.gameplay);
        this.hasBootstrap = true;
        break;
      }
      case "gameplay.updated":
      case "gameplay.resynced":
        this.assertScopedGameplay(event.gameplay);
        break;
    }
  }

  applyGameplay(gameplay: PlayerGameplaySnapshot | undefined): void {
    if (gameplay) {
      this.assertScopedGameplay(gameplay);
    }
  }

  assertReady(): void {
    if (!this.hasBootstrap) {
      throw protocolError(
        "NOT_READY",
        "No gameplay bootstrap is available yet. Wait for gameplay.bootstrap.",
      );
    }
  }

  private assertScopedGameplay(
    gameplay: PlayerGameplaySnapshot | null | undefined,
  ): void {
    if (!gameplay) {
      return;
    }
    if (gameplay.playerId !== this.playerId) {
      throw protocolError(
        "PLAYER_SCOPE_MISMATCH",
        `Received gameplay for '${gameplay.playerId}' while joined as '${this.playerId}'.`,
      );
    }
  }
}

async function handleRequest(options: {
  request: JoinRequest;
  requestId: RequestId;
  sessionId: string;
  playerId: string;
  state: JoinBotState;
  listActions: ListPlayerActions;
  describeAction: DescribePlayerAction;
  getActionTargets: GetPlayerActionTargets;
  validateAction: ValidatePlayerAction;
  submitAction: SubmitPlayerAction;
}): Promise<JsonValue> {
  if (typeof options.request.method !== "string") {
    throw protocolError("INVALID_REQUEST", "Request method must be a string.");
  }
  if (options.request.method.startsWith("actions.")) {
    options.state.assertReady();
  }

  switch (options.request.method) {
    case "actions.list": {
      const { data, error, response } = await options.listActions({
        path: { sessionId: options.sessionId, playerId: options.playerId },
      });
      if (error || !data) {
        throw apiProtocolError(error, response, "Failed to list actions.");
      }
      return data as unknown as JsonValue;
    }
    case "actions.describe": {
      const params = requireObjectParams(options.request.params);
      const { data, error, response } = await options.describeAction({
        path: {
          sessionId: options.sessionId,
          playerId: options.playerId,
          interactionId: requireString(params, "interactionId"),
        },
      });
      if (error || !data) {
        throw apiProtocolError(error, response, "Failed to describe action.");
      }
      return data as unknown as JsonValue;
    }
    case "actions.targets": {
      const params = requireObjectParams(options.request.params);
      const { data, error, response } = await options.getActionTargets({
        path: {
          sessionId: options.sessionId,
          playerId: options.playerId,
          interactionId: requireString(params, "interactionId"),
          inputKey: requireString(params, "inputKey"),
        },
      });
      if (error || !data) {
        throw apiProtocolError(
          error,
          response,
          "Failed to get action targets.",
        );
      }
      return data as unknown as JsonValue;
    }
    case "actions.validate": {
      const params = parseInputRequestParams(
        options.request.params,
        options.playerId,
      );
      const { data, error, response } = await options.validateAction({
        path: {
          sessionId: options.sessionId,
          playerId: options.playerId,
          interactionId: params.interactionId,
        },
        body: {
          expectedVersion: params.expectedVersion,
          actionSetVersion: params.actionSetVersion,
          inputs: params.inputs,
        },
      });
      if (error || !data) {
        throw apiProtocolError(
          error,
          response,
          "Failed to validate interaction.",
        );
      }
      return data as unknown as JsonValue;
    }
    case "actions.submit": {
      const params = parseInputRequestParams(
        options.request.params,
        options.playerId,
      );
      const { data, error, response } = await options.submitAction({
        path: {
          sessionId: options.sessionId,
          playerId: options.playerId,
          interactionId: params.interactionId,
        },
        body: {
          expectedVersion: params.expectedVersion,
          actionSetVersion: params.actionSetVersion,
          inputs: params.inputs,
        },
      });
      if (error || !data) {
        throw apiProtocolError(
          error,
          response,
          "Failed to submit interaction.",
        );
      }
      options.state.applyGameplay(data.gameplay);
      return data as unknown as JsonValue;
    }
    default:
      throw protocolError(
        "UNKNOWN_METHOD",
        `Unknown method '${options.request.method}'.`,
      );
  }
}

function parseRequestId(
  value: unknown,
): { ok: true; value: RequestId } | { ok: false; error: JoinProtocolError } {
  if (typeof value === "string" && value.length > 0) {
    return { ok: true, value };
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return { ok: true, value };
  }
  return {
    ok: false,
    error: protocolError(
      "MISSING_ID",
      "Every JSONL request must include a string or numeric id.",
    ),
  };
}

function requireObjectParams(params: unknown): JsonObject {
  if (params === undefined) {
    return {};
  }
  if (isJsonObject(params)) {
    return params;
  }
  throw protocolError("INVALID_PARAMS", "Request params must be an object.");
}

function parseInputRequestParams(
  rawParams: unknown,
  defaultPlayerId: string,
): {
  interactionId: string;
  expectedVersion: number;
  actionSetVersion: string;
  inputs: JsonObject;
} {
  const params = requireObjectParams(rawParams);
  const requestPlayerId = params.playerId;
  if (requestPlayerId !== undefined && requestPlayerId !== defaultPlayerId) {
    throw protocolError(
      "PLAYER_MISMATCH",
      `This join session is scoped to player '${defaultPlayerId}'.`,
    );
  }
  const expectedVersion = params.expectedVersion;
  if (
    typeof expectedVersion !== "number" ||
    !Number.isFinite(expectedVersion)
  ) {
    throw protocolError(
      "INVALID_PARAMS",
      "actions.validate and actions.submit require numeric expectedVersion.",
    );
  }
  const interactionParams = params.params;
  if (interactionParams !== undefined) {
    throw protocolError(
      "INVALID_PARAMS",
      "Use 'inputs' for action input payloads; 'params.params' is no longer supported.",
    );
  }
  const inputs = params.inputs;
  if (inputs !== undefined && !isJsonObject(inputs)) {
    throw protocolError(
      "INVALID_PARAMS",
      "Action inputs must be an object when provided.",
    );
  }
  return {
    interactionId: requireString(params, "interactionId"),
    expectedVersion,
    actionSetVersion: requireString(params, "actionSetVersion"),
    inputs: inputs ?? {},
  };
}

function requireString(params: JsonObject, key: string): string {
  const value = params[key];
  if (typeof value !== "string" || value.length === 0) {
    throw protocolError("INVALID_PARAMS", `Param '${key}' must be a string.`);
  }
  return value;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function protocolError(
  code: string,
  message: string,
  details?: JsonObject,
): JoinProtocolError {
  return { code, message, ...(details ? { details } : {}) };
}

function apiProtocolError(
  error: unknown,
  response: unknown,
  fallback: string,
): JoinProtocolError {
  const problem = toApiProblem(error as never, response as never, fallback);
  return protocolError(problem.type, problem.detail || problem.title, {
    status: problem.status,
    title: problem.title,
    detail: problem.detail,
    requestId: problem.requestId ?? null,
    retryable: problem.retryable ?? null,
  } as JsonObject);
}

function coerceProtocolError(error: unknown): JoinProtocolError {
  if (
    error &&
    typeof error === "object" &&
    typeof (error as { code?: unknown }).code === "string" &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return error as JoinProtocolError;
  }
  return protocolError("INTERNAL_ERROR", formatUnknown(error));
}

function formatUnknown(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
