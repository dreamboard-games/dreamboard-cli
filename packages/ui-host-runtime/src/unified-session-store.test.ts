import { describe, expect, test } from "bun:test";
import {
  createUnifiedSessionStore,
  type SSEManagerLike,
} from "./unified-session-store.ts";

type AnyHandler = (message: any) => void;

class FakeSSEManager implements SSEManagerLike {
  private anyHandlers = new Set<AnyHandler>();
  private eventHandlers = new Map<string, Set<(payload?: unknown) => void>>();

  connect(_sessionId: string, _options?: { source?: string }): void {
    this.emitLifecycle("connected");
  }

  disconnect(): void {
    this.emitLifecycle("disconnected");
  }

  on(eventType: string, handler: (payload?: unknown) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    const handlers = this.eventHandlers.get(eventType);
    handlers?.add(handler);
    return () => {
      handlers?.delete(handler);
    };
  }

  onAnyMessage(handler: AnyHandler): () => void {
    this.anyHandlers.add(handler);
    return () => {
      this.anyHandlers.delete(handler);
    };
  }

  emit(message: any): void {
    for (const handler of this.anyHandlers) {
      handler(message);
    }
  }

  emitError(error: unknown): void {
    const handlers = this.eventHandlers.get("error");
    handlers?.forEach((handler) => handler(error));
  }

  private emitLifecycle(eventType: string, payload?: unknown): void {
    const handlers = this.eventHandlers.get(eventType);
    handlers?.forEach((handler) => handler(payload));
  }
}

function createAction(actionType: string) {
  return {
    actionType,
    displayName: actionType,
    parameters: [],
  };
}

function createPrompt(id: string, to: string) {
  return {
    id,
    promptId: "judge-placement",
    to,
    title: "Judge placement",
    options: [
      { id: "ring-1", label: "Ring 1" },
      { id: "discard", label: "Discard" },
    ],
  };
}

function createWindow(id: string, addressedTo: string[]) {
  return {
    id,
    windowId: "review-window",
    closePolicy: "manual",
    addressedTo,
    payload: JSON.stringify({ window: id }),
  };
}

describe("createUnifiedSessionStore", () => {
  test("SESSION_BOOTSTRAP produces a gameplay snapshot for the controlling player", () => {
    const manager = new FakeSSEManager();
    const store = createUnifiedSessionStore({
      createSseManager: () => manager,
    });

    store.getState().setGameplay(
      {
        sessionId: "session-1",
        shortCode: "swift-falcon-73",
        gameId: "game-1",
      },
      {
        controllablePlayerIds: [],
        controllingPlayerId: "",
        seatViewsByPlayerId: {},
      },
    );
    store.getState().connect("session-1");

    manager.emit({
      type: "SESSION_BOOTSTRAP",
      phase: "gameplay",
      lobby: {
        seats: [
          {
            playerId: "player-1",
            controllerUserId: "user-1",
            displayName: "Player 1",
            playerColor: "#ff0000",
            isHost: true,
          },
          {
            playerId: "player-2",
            controllerUserId: "user-1",
            displayName: "Player 2",
            playerColor: "#00ff00",
            isHost: false,
          },
        ],
        canStart: false,
        hostUserId: "user-1",
      },
      gameplay: {
        version: 7,
        currentPhase: "placeThing",
        controllablePlayerIds: ["player-1", "player-2"],
        activePlayers: ["player-1"],
        seatViewsByPlayerId: {
          "player-1": JSON.stringify({
            currentPhase: "placeThing",
            marker: "player-1",
          }),
          "player-2": JSON.stringify({
            currentPhase: "placeThing",
            marker: "player-2",
          }),
        },
        availableActions: [
          { playerId: "player-1", actions: [createAction("placeThing")] },
          { playerId: "player-2", actions: [createAction("judgeWrong")] },
        ],
        prompts: [createPrompt("prompt-player-1", "player-1")],
        windows: [
          createWindow("window-shared", []),
          createWindow("window-player-2", ["player-2"]),
        ],
      },
      history: {
        entries: [
          {
            id: "entry-1",
            version: 1,
            timestamp: "2026-03-20T00:00:00Z",
            description: "Game started",
            isCurrent: true,
          },
        ],
        currentIndex: 0,
        canGoBack: false,
        canGoForward: false,
      },
    });

    const snapshot = store.getState().getPluginSnapshot();
    expect(snapshot.session.controllingPlayerId).toBe("player-1");
    expect(snapshot.view).toEqual({
      currentPhase: "placeThing",
      marker: "player-1",
    });
    expect(
      snapshot.gameplay.availableActions.map((action) => action.actionType),
    ).toEqual(["placeThing"]);
    expect(snapshot.gameplay.currentPhase).toBe("placeThing");
    expect(snapshot.gameplay.prompts.map((prompt) => prompt.id)).toEqual([
      "prompt-player-1",
    ]);
    expect(snapshot.gameplay.windows.map((window) => window.id)).toEqual([
      "window-shared",
    ]);
    expect(snapshot.gameplay.windows[0]).toMatchObject({
      id: "window-shared",
      addressedTo: [],
      payload: JSON.stringify({ window: "window-shared" }),
    });
    expect(store.getState().history?.entries).toHaveLength(1);
  });

  test("SESSION_BOOTSTRAP falls back to seat ownership when controllable players are empty", () => {
    const manager = new FakeSSEManager();
    const store = createUnifiedSessionStore({
      createSseManager: () => manager,
    });

    store.getState().setGameplay(
      {
        sessionId: "session-1",
        shortCode: "swift-falcon-73",
        gameId: "game-1",
      },
      {
        controllablePlayerIds: ["player-1", "player-2"],
        controllingPlayerId: "player-1",
        seatViewsByPlayerId: {},
      },
    );
    store.getState().connect("session-1", "user-1");

    manager.emit({
      type: "SESSION_BOOTSTRAP",
      phase: "gameplay",
      lobby: {
        seats: [
          {
            playerId: "player-1",
            controllerUserId: "user-1",
            displayName: "Player 1",
            playerColor: "#ff0000",
            isHost: true,
          },
          {
            playerId: "player-2",
            controllerUserId: "user-1",
            displayName: "Player 2",
            playerColor: "#00ff00",
            isHost: false,
          },
        ],
        canStart: false,
        hostUserId: "user-1",
      },
      gameplay: {
        version: 3,
        currentPhase: "placeThing",
        controllablePlayerIds: [],
        activePlayers: ["player-1"],
        seatViewsByPlayerId: {
          "player-1": JSON.stringify({ currentPhase: "placeThing" }),
          "player-2": JSON.stringify({ currentPhase: "judgeRings" }),
        },
        availableActions: [],
        prompts: [],
        windows: [],
      },
    });

    const snapshot = store.getState().getPluginSnapshot();
    expect(snapshot.session.controllablePlayerIds).toEqual([
      "player-1",
      "player-2",
    ]);
    expect(snapshot.session.controllingPlayerId).toBe("player-1");
    expect(snapshot.gameplay.currentPhase).toBe("placeThing");
  });

  test("SESSION_BOOTSTRAP can fall back to all seats when userId is missing", () => {
    const manager = new FakeSSEManager();
    const store = createUnifiedSessionStore({
      createSseManager: () => manager,
      fallbackToAllSeatsWhenUserIdMissing: true,
    });

    store.getState().setGameplay(
      {
        sessionId: "session-1",
        shortCode: "swift-falcon-73",
        gameId: "game-1",
      },
      {
        controllablePlayerIds: [],
        controllingPlayerId: "",
        seatViewsByPlayerId: {},
      },
    );
    store.getState().connect("session-1", null);

    manager.emit({
      type: "SESSION_BOOTSTRAP",
      phase: "gameplay",
      lobby: {
        seats: [
          {
            playerId: "player-1",
            controllerUserId: "user-1",
            displayName: "Player 1",
            playerColor: "#ff0000",
            isHost: true,
          },
          {
            playerId: "player-2",
            controllerUserId: "user-1",
            displayName: "Player 2",
            playerColor: "#00ff00",
            isHost: false,
          },
        ],
        canStart: false,
        hostUserId: "user-1",
      },
      gameplay: {
        version: 3,
        currentPhase: "placeThing",
        controllablePlayerIds: [],
        activePlayers: ["player-1"],
        seatViewsByPlayerId: {
          "player-1": JSON.stringify({ currentPhase: "placeThing" }),
          "player-2": JSON.stringify({ currentPhase: "judgeRings" }),
        },
        availableActions: [],
        prompts: [],
        windows: [],
      },
    });

    const snapshot = store.getState().getPluginSnapshot();
    expect(snapshot.session.controllablePlayerIds).toEqual([
      "player-1",
      "player-2",
    ]);
    expect(snapshot.session.controllingPlayerId).toBe("player-1");
    expect(snapshot.view).toEqual({ currentPhase: "placeThing" });
  });

  test("gameplay snapshots retain lobby data for authored player hooks", () => {
    const manager = new FakeSSEManager();
    const store = createUnifiedSessionStore({
      createSseManager: () => manager,
    });

    store.getState().setGameplay(
      {
        sessionId: "session-1",
        shortCode: "swift-falcon-73",
        gameId: "game-1",
      },
      {
        controllablePlayerIds: [],
        controllingPlayerId: "",
        seatViewsByPlayerId: {},
      },
      {
        seats: [
          {
            playerId: "player-1",
            controllerUserId: "user-1",
            displayName: "Player 1",
            playerColor: "#ff0000",
            isHost: true,
          },
          {
            playerId: "player-2",
            controllerUserId: "user-1",
            displayName: "Player 2",
            playerColor: "#00ff00",
            isHost: false,
          },
        ],
        canStart: false,
        hostUserId: "user-1",
      },
    );
    store.getState().connect("session-1", "user-1");

    manager.emit({
      type: "SESSION_BOOTSTRAP",
      phase: "gameplay",
      lobby: {
        seats: [
          {
            playerId: "player-1",
            controllerUserId: "user-1",
            displayName: "Player 1",
            playerColor: "#ff0000",
            isHost: true,
          },
          {
            playerId: "player-2",
            controllerUserId: "user-1",
            displayName: "Player 2",
            playerColor: "#00ff00",
            isHost: false,
          },
        ],
        canStart: false,
        hostUserId: "user-1",
      },
      gameplay: {
        version: 4,
        currentPhase: "placeThing",
        controllablePlayerIds: ["player-1", "player-2"],
        activePlayers: ["player-1"],
        seatViewsByPlayerId: {
          "player-1": JSON.stringify({ currentPhase: "placeThing" }),
          "player-2": JSON.stringify({ currentPhase: "judgeRings" }),
        },
        availableActions: [],
        prompts: [],
        windows: [],
      },
    });

    const snapshot = store.getState().getPluginSnapshot();
    expect(snapshot.lobby).not.toBeNull();
    expect(snapshot.lobby?.seats.map((seat) => seat.playerId)).toEqual([
      "player-1",
      "player-2",
    ]);
    expect(snapshot.session.controllingPlayerId).toBe("player-1");
  });

  test("STATE_CHANGED refreshes the reducer gameplay phase", () => {
    const manager = new FakeSSEManager();
    const store = createUnifiedSessionStore({
      createSseManager: () => manager,
    });

    store.getState().setGameplay(
      {
        sessionId: "session-1",
        shortCode: "swift-falcon-73",
        gameId: "game-1",
      },
      {
        controllablePlayerIds: ["player-1"],
        controllingPlayerId: "player-1",
        seatViewsByPlayerId: {},
        availableActions: [],
        prompts: [],
        windows: [],
      },
    );
    store.getState().connect("session-1");

    manager.emit({
      type: "STATE_CHANGED",
      newState: "judge",
    });

    expect(store.getState().gameplay.currentPhase).toBe("judge");
    expect(store.getState().notifications).toHaveLength(1);
    expect(store.getState().notifications[0]?.type).toBe("STATE_CHANGED");
  });

  test("YOUR_TURN queues notification and host feedback without raw state mirroring", () => {
    const manager = new FakeSSEManager();
    const store = createUnifiedSessionStore({
      createSseManager: () => manager,
    });

    store.getState().setGameplay(
      {
        sessionId: "session-1",
        shortCode: "swift-falcon-73",
        gameId: "game-1",
      },
      {
        controllablePlayerIds: ["player-1"],
        controllingPlayerId: "player-1",
        seatViewsByPlayerId: {},
        availableActions: [],
        prompts: [],
        windows: [],
      },
    );
    store.getState().connect("session-1");

    manager.emit({
      type: "YOUR_TURN",
      toUser: "user-1",
      availableActions: [],
      activePlayers: ["player-1"],
    });

    expect(store.getState().notifications).toHaveLength(1);
    expect(store.getState().notifications[0]?.type).toBe("YOUR_TURN");
    expect(store.getState().hostFeedback).toHaveLength(1);
    expect(store.getState().hostFeedback[0]).toMatchObject({
      type: "YOUR_TURN",
      payload: {
        type: "YOUR_TURN",
        activePlayers: ["player-1"],
      },
    });
  });

  test("connection-limit SSE failures are surfaced as a connection error", () => {
    const manager = new FakeSSEManager();
    const store = createUnifiedSessionStore({
      createSseManager: () => manager,
    });

    store.getState().connect("session-1", "user-1", { source: "play-page" });
    manager.emitError(new Error("SSE failed: 429 Too Many Requests"));

    expect(store.getState().connectionError).toContain(
      "Too many live connections",
    );
    expect(store.getState().isConnected).toBe(false);
  });

  test("lobby snapshots derive the controlling player from assigned seats", () => {
    const manager = new FakeSSEManager();
    const store = createUnifiedSessionStore({
      createSseManager: () => manager,
    });

    store.getState().setLobby(
      {
        sessionId: "session-1",
        shortCode: "swift-falcon-73",
        gameId: "game-1",
      },
      {
        seats: [
          {
            playerId: "player-1",
            controllerUserId: "user-1",
            displayName: "Player 1",
            playerColor: "#ff0000",
            isHost: true,
          },
          {
            playerId: "player-2",
            controllerUserId: "user-1",
            displayName: "Player 2",
            playerColor: "#00ff00",
            isHost: false,
          },
        ],
        canStart: true,
        hostUserId: "user-1",
      },
    );
    store.getState().connect("session-1", "user-1");

    manager.emit({
      type: "SESSION_BOOTSTRAP",
      phase: "lobby",
      lobby: {
        seats: [
          {
            playerId: "player-1",
            controllerUserId: "user-1",
            displayName: "Player 1",
            playerColor: "#ff0000",
            isHost: true,
          },
          {
            playerId: "player-2",
            controllerUserId: "user-1",
            displayName: "Player 2",
            playerColor: "#00ff00",
            isHost: false,
          },
        ],
        canStart: true,
        hostUserId: "user-1",
      },
    });

    const snapshot = store.getState().getPluginSnapshot();
    expect(snapshot.session.controllablePlayerIds).toEqual([
      "player-1",
      "player-2",
    ]);
    expect(snapshot.session.controllingPlayerId).toBe("player-1");
  });

  test("notifications are ephemeral across reset and session snapshot reconnect", () => {
    const firstManager = new FakeSSEManager();
    const secondManager = new FakeSSEManager();
    let managerCount = 0;

    const store = createUnifiedSessionStore({
      createSseManager: () => {
        managerCount += 1;
        return managerCount === 1 ? firstManager : secondManager;
      },
    });

    store.getState().setGameplay(
      {
        sessionId: "session-1",
        shortCode: "swift-falcon-73",
        gameId: "game-1",
      },
      {
        controllablePlayerIds: ["player-1"],
        controllingPlayerId: "player-1",
        seatViewsByPlayerId: {},
        availableActions: [],
        prompts: [],
        windows: [],
      },
    );
    store.getState().connect("session-1", "user-1");

    firstManager.emit({
      type: "ACTION_REJECTED",
      reason: "Out of turn",
    });

    expect(store.getState().notifications).toHaveLength(1);
    expect(store.getState().hostFeedback).toHaveLength(1);

    store.getState().reset();
    store.getState().setGameplay(
      {
        sessionId: "session-1",
        shortCode: "swift-falcon-73",
        gameId: "game-1",
      },
      {
        controllablePlayerIds: [],
        controllingPlayerId: "",
        seatViewsByPlayerId: {},
      },
    );
    store.getState().connect("session-1", "user-1");

    secondManager.emit({
      type: "SESSION_BOOTSTRAP",
      phase: "gameplay",
      lobby: {
        seats: [
          {
            playerId: "player-1",
            controllerUserId: "user-1",
            displayName: "Player 1",
            playerColor: "#ff0000",
            isHost: true,
          },
        ],
        canStart: false,
        hostUserId: "user-1",
      },
      gameplay: {
        version: 4,
        currentPhase: "placeThing",
        controllablePlayerIds: ["player-1"],
        activePlayers: ["player-1"],
        seatViewsByPlayerId: {
          "player-1": JSON.stringify({ currentPhase: "placeThing" }),
        },
        availableActions: [],
        prompts: [],
        windows: [],
      },
    });

    expect(store.getState().notifications).toHaveLength(0);
    expect(store.getState().hostFeedback).toHaveLength(0);
    expect(store.getState().gameplay.currentPhase).toBe("placeThing");
  });

  test("host-only feedback stays outside plugin snapshots", () => {
    const manager = new FakeSSEManager();
    const store = createUnifiedSessionStore({
      createSseManager: () => manager,
    });

    store.getState().setGameplay(
      {
        sessionId: "session-1",
        shortCode: "swift-falcon-73",
        gameId: "game-1",
      },
      {
        controllablePlayerIds: ["player-1"],
        controllingPlayerId: "player-1",
        seatViewsByPlayerId: {},
        availableActions: [],
        prompts: [],
        windows: [],
      },
    );
    store.getState().connect("session-1", "user-1");

    manager.emit({
      type: "ACTION_REJECTED",
      reason: "Out of turn",
      targetPlayer: "player-2",
    });

    const snapshot = store.getState().getPluginSnapshot() as Record<
      string,
      unknown
    >;
    expect(store.getState().hostFeedback).toHaveLength(1);
    expect(snapshot.notifications).toBeDefined();
    expect("hostFeedback" in snapshot).toBe(false);
  });

  test("enqueueActionRejected adds platform feedback without waiting for SSE", () => {
    const manager = new FakeSSEManager();
    const store = createUnifiedSessionStore({
      createSseManager: () => manager,
    });

    store.getState().setGameplay(
      {
        sessionId: "session-1",
        shortCode: "swift-falcon-73",
        gameId: "game-1",
      },
      {
        controllablePlayerIds: ["player-1"],
        controllingPlayerId: "player-1",
        seatViewsByPlayerId: {},
        availableActions: [],
        prompts: [],
        windows: [],
      },
    );

    store
      .getState()
      .enqueueActionRejected("You cannot afford that wonder.", "player-1");

    expect(store.getState().notifications).toHaveLength(1);
    expect(store.getState().notifications[0]).toMatchObject({
      type: "ACTION_REJECTED",
      payload: {
        type: "ACTION_REJECTED",
        reason: "You cannot afford that wonder.",
        targetPlayer: "player-1",
      },
    });
    expect(store.getState().hostFeedback).toHaveLength(1);
    expect(store.getState().hostFeedback[0]).toMatchObject({
      type: "ACTION_REJECTED",
      payload: {
        type: "ACTION_REJECTED",
        reason: "You cannot afford that wonder.",
        targetPlayer: "player-1",
      },
    });
  });

  test("switchPlayer swaps the cached seat view and seat-scoped transport data locally", () => {
    const manager = new FakeSSEManager();
    const store = createUnifiedSessionStore({
      createSseManager: () => manager,
    });

    store.getState().setGameplay(
      {
        sessionId: "session-1",
        shortCode: "swift-falcon-73",
        gameId: "game-1",
      },
      {
        controllablePlayerIds: ["player-1", "player-2"],
        controllingPlayerId: "player-1",
        seatViewsByPlayerId: {},
      },
    );
    store.getState().connect("session-1", "user-1");

    manager.emit({
      type: "SESSION_BOOTSTRAP",
      phase: "gameplay",
      lobby: {
        seats: [
          {
            playerId: "player-1",
            controllerUserId: "user-1",
            displayName: "Player 1",
            playerColor: "#ff0000",
            isHost: true,
          },
          {
            playerId: "player-2",
            controllerUserId: "user-1",
            displayName: "Player 2",
            playerColor: "#00ff00",
            isHost: false,
          },
        ],
        canStart: false,
        hostUserId: "user-1",
      },
      gameplay: {
        version: 5,
        currentPhase: "placeThing",
        controllablePlayerIds: ["player-1", "player-2"],
        activePlayers: ["player-1"],
        seatViewsByPlayerId: {
          "player-1": JSON.stringify({
            currentPhase: "placeThing",
            marker: "player-1",
          }),
          "player-2": JSON.stringify({
            currentPhase: "judgeRings",
            marker: "player-2",
          }),
        },
        availableActions: [
          { playerId: "player-1", actions: [createAction("placeThing")] },
          { playerId: "player-2", actions: [createAction("judgeWrong")] },
        ],
        prompts: [
          createPrompt("prompt-player-1", "player-1"),
          createPrompt("prompt-player-2", "player-2"),
        ],
        windows: [
          createWindow("window-shared", []),
          createWindow("window-player-2", ["player-2"]),
        ],
      },
    });

    store.getState().switchPlayer("player-2");

    const snapshot = store.getState().getPluginSnapshot();
    expect(snapshot.session.controllingPlayerId).toBe("player-2");
    expect(snapshot.view).toEqual({
      currentPhase: "judgeRings",
      marker: "player-2",
    });
    expect(
      snapshot.gameplay.availableActions.map((action) => action.actionType),
    ).toEqual(["judgeWrong"]);
    expect(snapshot.gameplay.currentPhase).toBe("placeThing");
    expect(snapshot.gameplay.prompts.map((prompt) => prompt.id)).toEqual([
      "prompt-player-2",
    ]);
    expect(snapshot.gameplay.windows.map((window) => window.id)).toEqual([
      "window-shared",
      "window-player-2",
    ]);
  });

  test("getPluginSnapshot tolerates partial gameplay state during initial session snapshot", () => {
    const manager = new FakeSSEManager();
    const store = createUnifiedSessionStore({
      createSseManager: () => manager,
    });

    store.getState().setGameplay(
      {
        sessionId: "session-1",
        shortCode: "swift-falcon-73",
        gameId: "game-1",
      },
      {
        controllablePlayerIds: ["player-1"],
        controllingPlayerId: "player-1",
      } as never,
      {
        seats: [
          {
            playerId: "player-1",
            controllerUserId: "user-1",
            displayName: "Player 1",
            playerColor: "#ff0000",
            isHost: true,
          },
        ],
        canStart: false,
        hostUserId: "user-1",
      },
    );

    const snapshot = store.getState().getPluginSnapshot();
    expect(snapshot.session.controllingPlayerId).toBe("player-1");
    expect(snapshot.view).toBeNull();
    expect(snapshot.gameplay.availableActions).toEqual([]);
    expect(snapshot.gameplay.prompts).toEqual([]);
    expect(snapshot.gameplay.windows).toEqual([]);
  });
});
