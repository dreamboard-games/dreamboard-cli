import type {
  PlayerGameplaySnapshot,
  SeatAssignment,
} from "@dreamboard/api-client";
import type { ReducerBundleContract } from "@dreamboard/reducer-contract/bundle";
import type * as Wire from "@dreamboard/reducer-contract/wire";
import type { PluginStateSnapshot } from "@dreamboard/ui-sdk/reducer";
import type {
  PluginSessionState,
  RuntimeAPI,
  SubmissionError,
  ValidationResult,
} from "@dreamboard/ui-sdk";
import {
  createUnifiedSessionStore,
  type SSEManagerLike,
} from "@dreamboard/ui-host-runtime/runtime";

type ReducerState = Record<string, unknown>;
type ReducerStaticProjection = Wire.BoardStaticProjection;
type ReducerBundleLike = Pick<
  ReducerBundleContract,
  "projectSeatsDynamic" | "projectStatic" | "validateInput" | "dispatch"
>;

type BaseStateArtifact = {
  snapshot: ReducerState;
  fingerprint: {
    players: number;
  };
};

export type CreateTestRuntimeOptions = {
  baseId: string;
  baseStates: Record<string, BaseStateArtifact>;
  bundle: ReducerBundleLike;
  phase?: string;
  playerIds?: readonly string[];
  sessionId?: string;
  userId?: string | null;
  gameId?: string;
  displayNameByPlayerId?: Record<string, string>;
};

export type CreatedTestRuntime = {
  runtime: RuntimeAPI & {
    getSnapshot(): PluginStateSnapshot;
    subscribeToState(
      listener: (state: PluginStateSnapshot) => void,
    ): () => void;
    _subscribeToSessionState(
      listener: (state: PluginSessionState) => void,
    ): () => void;
  };
  getSnapshot(): PluginStateSnapshot;
  players(): readonly string[];
  seat(index: number): string;
  submit(
    playerId: string,
    interactionId: string,
    params?: unknown,
  ): Promise<void>;
  validate(
    playerId: string,
    interactionId: string,
    params?: unknown,
  ): Promise<ValidationResult>;
  setControllingPlayer(playerId: string): void;
};

function cloneState<T>(value: T): T {
  return structuredClone(value);
}

function createSubmissionError(
  errorCode: string | undefined,
  message: string | undefined,
): SubmissionError {
  const error = new Error(message ?? "Interaction rejected") as SubmissionError;
  error.name = "SubmissionError";
  error.errorCode = errorCode;
  return error;
}

function readFlowState(state: ReducerState): {
  currentPhase: string | null;
  activePlayers: string[];
} {
  const flow = ((
    state.domain as
      | { flow?: { currentPhase?: string; activePlayers?: string[] } }
      | undefined
  )?.flow ?? {}) as {
    currentPhase?: string;
    activePlayers?: string[];
  };
  return {
    currentPhase: flow.currentPhase ?? null,
    activePlayers: Array.isArray(flow.activePlayers) ? flow.activePlayers : [],
  };
}

function buildSeatAssignments(
  playerIds: readonly string[],
  userId: string | null,
  displayNameByPlayerId: Record<string, string> | undefined,
): SeatAssignment[] {
  return playerIds.map((playerId) => ({
    playerId,
    controllerUserId: userId ?? undefined,
    displayName: displayNameByPlayerId?.[playerId] ?? playerId,
  }));
}

function resolvePlayerIds(options: {
  baseState: BaseStateArtifact;
  explicitPlayerIds?: readonly string[];
}): string[] {
  if (options.explicitPlayerIds && options.explicitPlayerIds.length > 0) {
    return [...options.explicitPlayerIds];
  }
  return Array.from(
    { length: options.baseState.fingerprint.players },
    (_, index) => `player-${index + 1}`,
  );
}

// Stub SSE manager for the in-memory store. `createTestRuntime` never
// connects to a live backend; updates are delivered through
// `applyGameplaySnapshotLocal(...)` instead.
function createStubSseManager(): SSEManagerLike {
  return {
    connect: () => undefined,
    disconnect: () => undefined,
    on: () => () => undefined,
    onAnyMessage: () => () => undefined,
  };
}

function buildGameplaySnapshot(options: {
  state: ReducerState;
  bundle: ReducerBundleLike;
  staticProjection: ReducerStaticProjection | null;
  playerId: string;
  version: number;
  expectedPhase: string | undefined;
  baseId: string;
}): PlayerGameplaySnapshot {
  const projection = options.bundle.projectSeatsDynamic({
    state: options.state,
    playerIds: [options.playerId],
  });

  const flow = readFlowState(options.state);
  if (options.expectedPhase && flow.currentPhase !== options.expectedPhase) {
    throw new Error(
      `Expected base '${options.baseId}' to be in phase '${options.expectedPhase}', received '${
        flow.currentPhase ?? "null"
      }'.`,
    );
  }

  const seats = projection.seats ?? {};
  const seat = seats[options.playerId];

  return {
    version: options.version,
    actionSetVersion: `${options.version}:test`,
    playerId: options.playerId,
    activePlayers: flow.activePlayers,
    currentPhase: flow.currentPhase ?? "",
    currentStage: projection.currentStage ?? "",
    stageSeats: projection.stageSeats ?? [],
    view: JSON.stringify(seat?.view ?? null),
    availableInteractions:
      (seat?.availableInteractions as PlayerGameplaySnapshot["availableInteractions"]) ??
      [],
    zones: (seat?.zones as PlayerGameplaySnapshot["zones"]) ?? {},
    boardStatic: options.staticProjection
      ? JSON.stringify(options.staticProjection.view)
      : undefined,
    boardStaticHash: options.staticProjection?.hash,
  };
}

// Reuses `packages/ui-host-runtime`'s unified session store so the
// `getPluginSnapshot()` projection and `applyGameplaySnapshotLocal(...)`
// reducer running inside workspace tests are the same code paths
// running inside the host app. Prevents snapshot-shape drift between
// host plugin UI and authored UI tests.
export function createTestRuntime(
  options: CreateTestRuntimeOptions,
): CreatedTestRuntime {
  const baseState = options.baseStates[options.baseId];
  if (!baseState) {
    throw new Error(`Unknown test base '${options.baseId}'.`);
  }

  let currentState = cloneState(baseState.snapshot);
  const playerIds = resolvePlayerIds({
    baseState,
    explicitPlayerIds: options.playerIds,
  });
  const userId = options.userId ?? "test-user";
  const sessionId = options.sessionId ?? "test-session";
  const gameId = options.gameId ?? "test-game";
  const seats = buildSeatAssignments(
    playerIds,
    userId,
    options.displayNameByPlayerId,
  );
  const identity = {
    sessionId,
    shortCode: sessionId,
    gameId,
  };

  const storeApi = createUnifiedSessionStore({
    createSseManager: createStubSseManager,
    // Test runtimes keep `userId` present so the unified store derives
    // controllable player ids from seat assignments whenever the
    // incoming snapshot omits `controllablePlayerIds`.
    fallbackToAllSeatsWhenUserIdMissing: false,
  });

  // The store defaults `userId` to null; test sessions have a userId.
  storeApi.setState({ userId });

  storeApi.getState().setLobby(identity, {
    seats,
    canStart: true,
    hostUserId: userId,
  });

  let version = 0;
  let currentPlayerId = playerIds[0] ?? "";
  const staticProjection = options.bundle.projectStatic?.() ?? null;

  const applyCurrentState = (): void => {
    version += 1;
    const snapshot = buildGameplaySnapshot({
      state: currentState,
      bundle: options.bundle,
      staticProjection,
      playerId: currentPlayerId,
      version,
      expectedPhase: version === 1 ? options.phase : undefined,
      baseId: options.baseId,
    });
    storeApi.getState().applyGameplaySnapshotLocal(snapshot);
  };

  applyCurrentState();

  const stateListeners = new Set<(state: PluginStateSnapshot) => void>();
  const sessionListeners = new Set<(state: PluginSessionState) => void>();

  let lastPluginSnapshot = storeApi.getState().getPluginSnapshot();
  let lastSessionState: PluginSessionState = {
    ...lastPluginSnapshot.session,
    status: "ready",
  };

  storeApi.subscribe((state, previous) => {
    const nextPluginSnapshot = state.getPluginSnapshot();
    if (nextPluginSnapshot !== lastPluginSnapshot) {
      lastPluginSnapshot = nextPluginSnapshot;
      for (const listener of stateListeners) {
        listener(nextPluginSnapshot);
      }
    }
    const controllingPlayerChanged =
      state.gameplay.controllingPlayerId !==
      previous.gameplay.controllingPlayerId;
    const controllableIdsChanged =
      state.gameplay.controllablePlayerIds !==
      previous.gameplay.controllablePlayerIds;
    if (controllingPlayerChanged || controllableIdsChanged) {
      lastSessionState = {
        ...nextPluginSnapshot.session,
        status: "ready",
      };
      for (const listener of sessionListeners) {
        listener(lastSessionState);
      }
    }
  });

  const validate = async (
    playerId: string,
    interactionId: string,
    params: unknown = {},
  ): Promise<ValidationResult> => {
    const result = await options.bundle.validateInput({
      state: currentState as Wire.JsonValue,
      input: {
        kind: "interaction",
        playerId,
        interactionId,
        params: params as Wire.JsonValue,
      },
    });
    return {
      valid: result.valid,
      errorCode: result.errorCode,
      message: result.message,
    };
  };

  const submit = async (
    playerId: string,
    interactionId: string,
    params: unknown = {},
  ): Promise<void> => {
    const validation = await validate(playerId, interactionId, params);
    if (!validation.valid) {
      throw createSubmissionError(validation.errorCode, validation.message);
    }
    const result = await options.bundle.dispatch({
      state: currentState as Wire.JsonValue,
      input: {
        kind: "interaction",
        playerId,
        interactionId,
        params: params as Wire.JsonValue,
      },
    });
    if (result.kind === "reject") {
      throw createSubmissionError(result.errorCode, result.message);
    }
    currentState = cloneState(result.state as ReducerState);
    applyCurrentState();
  };

  const setControllingPlayer = (playerId: string): void => {
    if (!playerIds.includes(playerId)) {
      throw new Error(`Unknown controlling player '${playerId}'.`);
    }
    currentPlayerId = playerId;
    storeApi.getState().switchPlayer(playerId);
    applyCurrentState();
  };

  const runtime = {
    validateInteraction: validate,
    submitInteraction: submit,
    getSessionState: (): PluginSessionState => ({ ...lastSessionState }),
    disconnect: () => undefined,
    switchPlayer: (playerId: string) => {
      setControllingPlayer(playerId);
    },
    getSnapshot: (): PluginStateSnapshot => lastPluginSnapshot,
    subscribeToState: (listener: (state: PluginStateSnapshot) => void) => {
      stateListeners.add(listener);
      return () => {
        stateListeners.delete(listener);
      };
    },
    _subscribeToSessionState: (
      listener: (state: PluginSessionState) => void,
    ) => {
      sessionListeners.add(listener);
      return () => {
        sessionListeners.delete(listener);
      };
    },
  };

  return {
    runtime,
    getSnapshot: () => lastPluginSnapshot,
    players: () => [...playerIds],
    seat: (index: number) => {
      if (!Number.isInteger(index) || index < 0 || index >= playerIds.length) {
        throw new Error(
          `seat(${index}) is out of range; base '${options.baseId}' has ${playerIds.length} player(s).`,
        );
      }
      return playerIds[index]!;
    },
    submit,
    validate,
    setControllingPlayer,
  };
}
