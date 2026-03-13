import { expect, mock, test } from "bun:test";

mock.module("../build-target.js", () => ({
  IS_PUBLISHED_BUILD: true,
}));

const { shouldUseRemoteTestRuntime } = await import(
  "../services/testing/runtime-mode.ts"
);

test("published builds default test commands to the remote runtime", () => {
  expect(shouldUseRemoteTestRuntime(undefined)).toBe(true);
  expect(shouldUseRemoteTestRuntime("local")).toBe(true);
});
