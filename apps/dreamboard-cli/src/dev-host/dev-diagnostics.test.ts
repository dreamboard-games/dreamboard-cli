import { describe, expect, test } from "bun:test";

import {
  formatConsoleArgs,
  resolveDevDiagnosticsLevel,
  shouldRelayDevLog,
  stringifyForRelay,
} from "./dev-diagnostics.js";

describe("resolveDevDiagnosticsLevel", () => {
  test("uses verbose diagnostics when debug is enabled", () => {
    expect(resolveDevDiagnosticsLevel(true)).toBe("verbose");
  });

  test("uses errors-only diagnostics by default", () => {
    expect(resolveDevDiagnosticsLevel(false)).toBe("errors");
  });
});

describe("shouldRelayDevLog", () => {
  test("relays all logs in verbose mode", () => {
    expect(
      shouldRelayDevLog("verbose", {
        source: "plugin",
        level: "log",
        message: "rendered",
      }),
    ).toBe(true);
  });

  test("keeps info logs quiet in errors-only mode", () => {
    expect(
      shouldRelayDevLog("errors", {
        source: "host",
        level: "info",
        message: "connected",
      }),
    ).toBe(false);
  });

  test("still relays warnings and errors in errors-only mode", () => {
    expect(
      shouldRelayDevLog("errors", {
        source: "sse",
        level: "warn",
        message: "retrying",
      }),
    ).toBe(true);
    expect(
      shouldRelayDevLog("errors", {
        source: "sse",
        level: "error",
        message: "failed",
      }),
    ).toBe(true);
  });
});

describe("stringifyForRelay", () => {
  test("returns strings unchanged", () => {
    expect(stringifyForRelay("plain text")).toBe("plain text");
  });

  test("formats errors with their stack or message", () => {
    expect(stringifyForRelay(new Error("boom"))).toContain("boom");
  });

  test("serializes plain objects as JSON", () => {
    expect(stringifyForRelay({ ok: true, count: 2 })).toBe(
      JSON.stringify({ ok: true, count: 2 }),
    );
  });

  test("falls back to String for non-serializable values", () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;

    expect(stringifyForRelay(circular)).toBe("[object Object]");
  });
});

describe("formatConsoleArgs", () => {
  test("joins formatted console args into a single relay string", () => {
    const formatted = formatConsoleArgs([
      "render",
      { syncId: 4 },
      new Error("boom"),
    ]);

    expect(formatted).toContain('render {"syncId":4}');
    expect(formatted).toContain("boom");
  });
});
