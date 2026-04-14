import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { PluginStateSnapshot } from "@dreamboard/ui-sdk/reducer";
import { PluginSessionGateway } from "./plugin-session-gateway.ts";

const originalWindow = (globalThis as { window?: unknown }).window;

function createIframe(contentWindow: MessagePort): HTMLIFrameElement {
  return {
    contentWindow,
    src: "/plugin.html",
  } as HTMLIFrameElement;
}

function createSnapshot(syncId: number): PluginStateSnapshot {
  return {
    view: null,
    gameplay: {
      currentPhase: null,
      availableActions: [],
      prompts: [],
      windows: [],
    },
    lobby: {
      seats: [],
      canStart: true,
      hostUserId: "host-user",
    },
    notifications: [],
    session: {
      sessionId: "session-1",
      controllablePlayerIds: ["player-1"],
      controllingPlayerId: "player-1",
      userId: "user-1",
    },
    history: null,
    syncId,
  };
}

describe("PluginSessionGateway", () => {
  beforeEach(() => {
    const fakeWindow = new EventTarget() as EventTarget & {
      location: { href: string };
    };
    fakeWindow.location = {
      href: "http://localhost:5174/index.html",
    };
    (globalThis as { window?: unknown }).window = fakeWindow;
  });

  afterEach(() => {
    const globalWithWindow = globalThis as { window?: unknown };
    if (originalWindow === undefined) {
      delete globalWithWindow.window;
    } else {
      globalWithWindow.window = originalWindow;
    }
  });

  test("sends the first state-sync even when syncId is 0", async () => {
    const postedMessages: Array<Record<string, unknown>> = [];
    const { port1 } = new MessageChannel();
    Object.assign(port1, {
      postMessage: (message: Record<string, unknown>) => {
        postedMessages.push(message);
      },
    });
    const iframe = createIframe(port1);

    const gateway = new PluginSessionGateway({
      iframe,
      sessionId: "session-1",
      controllablePlayerIds: ["player-1"],
      controllingPlayerId: "player-1",
      userId: "user-1",
      onReady: () => {},
      onError: () => {},
      onAction: () => {},
      onPromptResponse: () => {},
      onWindowAction: () => {},
      onValidateAction: async () => ({ valid: true }),
    });

    gateway.connect();

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "http://localhost:5174",
        data: { type: "ready" },
        source: port1,
      }),
    );

    gateway.attachStore({
      getStateSnapshot: () => createSnapshot(0),
      subscribe: () => () => {},
      onStateAck: () => {},
      markNotificationRead: () => {},
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const stateSyncMessages = postedMessages.filter(
      (message) => message.type === "state-sync",
    );

    expect(stateSyncMessages).toHaveLength(1);
    expect(stateSyncMessages[0]?.syncId).toBe(0);

    gateway.disconnect();
  });

  test("retries init until the plugin acknowledges ready", async () => {
    const postedMessages: Array<Record<string, unknown>> = [];
    const { port1 } = new MessageChannel();
    Object.assign(port1, {
      postMessage: (message: Record<string, unknown>) => {
        postedMessages.push(message);
      },
    });
    const iframe = createIframe(port1);

    const gateway = new PluginSessionGateway({
      iframe,
      sessionId: "session-1",
      controllablePlayerIds: ["player-1"],
      controllingPlayerId: "player-1",
      userId: "user-1",
      onReady: () => {},
      onError: () => {},
      onAction: () => {},
      onPromptResponse: () => {},
      onWindowAction: () => {},
      onValidateAction: async () => ({ valid: true }),
    });

    gateway.connect();

    await new Promise((resolve) => setTimeout(resolve, 325));

    const initMessages = postedMessages.filter(
      (message) => message.type === "init",
    );

    expect(initMessages.length).toBeGreaterThanOrEqual(2);

    gateway.disconnect();
  });

  test("logs async action handler failures instead of dropping them", async () => {
    const postedMessages: Array<Record<string, unknown>> = [];
    const { port1 } = new MessageChannel();
    Object.assign(port1, {
      postMessage: (message: Record<string, unknown>) => {
        postedMessages.push(message);
      },
    });
    const iframe = createIframe(port1);
    const logger = {
      log: mock(() => undefined),
      warn: mock(() => undefined),
      error: mock(() => undefined),
    };

    const gateway = new PluginSessionGateway({
      iframe,
      sessionId: "session-1",
      controllablePlayerIds: ["player-1"],
      controllingPlayerId: "player-1",
      userId: "user-1",
      onReady: () => {},
      onError: () => {},
      onAction: async () => {
        throw new Error("submit failed");
      },
      onPromptResponse: () => {},
      onWindowAction: () => {},
      onValidateAction: async () => ({ valid: true }),
      logger,
    });

    gateway.connect();

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "http://localhost:5174",
        data: {
          type: "action",
          messageId: "submit-1",
          playerId: "player-1",
          actionType: "takeTurn",
          params: {},
        },
        source: port1,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(logger.error).toHaveBeenCalledWith(
      "[Gateway] Action submission error:",
      expect.any(Error),
    );
    expect(postedMessages).toContainEqual({
      type: "submit-result",
      messageId: "submit-1",
      accepted: false,
      message: "submit failed",
    });

    gateway.disconnect();
  });

  test("forwards window action messages to the host handler", async () => {
    const postedMessages: Array<Record<string, unknown>> = [];
    const { port1 } = new MessageChannel();
    Object.assign(port1, {
      postMessage: (message: Record<string, unknown>) => {
        postedMessages.push(message);
      },
    });
    const iframe = createIframe(port1);
    const onWindowAction = mock(() => undefined);

    const gateway = new PluginSessionGateway({
      iframe,
      sessionId: "session-1",
      controllablePlayerIds: ["player-1"],
      controllingPlayerId: "player-1",
      userId: "user-1",
      onReady: () => {},
      onError: () => {},
      onAction: () => {},
      onPromptResponse: () => {},
      onWindowAction,
      onValidateAction: async () => ({ valid: true }),
    });

    gateway.connect();

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "http://localhost:5174",
        data: {
          type: "window-action",
          messageId: "submit-2",
          playerId: "player-1",
          windowId: "review-window",
          actionType: "confirm",
          params: { approved: true },
        },
        source: port1,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onWindowAction).toHaveBeenCalledWith(
      "player-1",
      "review-window",
      "confirm",
      { approved: true },
    );
    expect(postedMessages).toContainEqual({
      type: "submit-result",
      messageId: "submit-2",
      accepted: true,
    });

    gateway.disconnect();
  });
});
