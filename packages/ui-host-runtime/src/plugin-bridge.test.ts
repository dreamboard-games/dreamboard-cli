import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { PluginBridge } from "./plugin-bridge.ts";

const originalWindow = (globalThis as { window?: unknown }).window;

function createIframe(contentWindow: MessagePort): HTMLIFrameElement {
  return {
    contentWindow,
    src: "/plugin.html",
  } as HTMLIFrameElement;
}

describe("PluginBridge", () => {
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

  test("accepts ready messages from a same-origin dev iframe", () => {
    const { port1 } = new MessageChannel();
    const iframe = createIframe(port1);

    const bridge = new PluginBridge(iframe, "*");
    let ready = false;
    bridge.onPluginMessage("ready", () => {
      ready = true;
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "http://localhost:5174",
        data: { type: "ready" },
        source: port1,
      }),
    );

    expect(ready).toBe(true);
    bridge.disconnect();
  });

  test("still accepts ready messages from a sandboxed null-origin iframe", () => {
    const { port1 } = new MessageChannel();
    const iframe = createIframe(port1);

    const bridge = new PluginBridge(iframe, "*");
    let ready = false;
    bridge.onPluginMessage("ready", () => {
      ready = true;
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "null",
        data: { type: "ready" },
        source: port1,
      }),
    );

    expect(ready).toBe(true);
    bridge.disconnect();
  });

  test("ignores matching-origin messages from a different source window", () => {
    const { port1 } = new MessageChannel();
    const { port1: otherPort } = new MessageChannel();
    const iframe = createIframe(port1);

    const bridge = new PluginBridge(iframe, "*");
    let ready = false;
    bridge.onPluginMessage("ready", () => {
      ready = true;
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "http://localhost:5174",
        data: { type: "ready" },
        source: otherPort,
      }),
    );

    expect(ready).toBe(false);
    bridge.disconnect();
  });
});
