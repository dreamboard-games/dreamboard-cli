import { expect, test } from "bun:test";

import {
  NO_REDUCER_NATIVE_BASES_FOUND_ERROR,
  NO_REDUCER_NATIVE_SCENARIOS_FOUND_ERROR,
  REDUCER_NATIVE_TEST_WORKSPACE_ERROR,
  resolveRequestedRunner,
} from "./test.js";

test("reducer-native workspace guidance is explicit about the hard cut", () => {
  expect(REDUCER_NATIVE_TEST_WORKSPACE_ERROR).toContain(
    "reducer-native workspace",
  );
  expect(REDUCER_NATIVE_TEST_WORKSPACE_ERROR).toContain("test/bases/*.base.ts");
  expect(REDUCER_NATIVE_TEST_WORKSPACE_ERROR).toContain(
    "Legacy test/base-scenarios.json workspaces are no longer supported.",
  );
});

test("missing reducer-native generated inputs have targeted error messages", () => {
  expect(NO_REDUCER_NATIVE_BASES_FOUND_ERROR).toBe(
    "No bases found under test/bases/*.base.ts",
  );
  expect(NO_REDUCER_NATIVE_SCENARIOS_FOUND_ERROR).toBe(
    "No scenarios found under test/scenarios/*.scenario.ts",
  );
});

test("resolveRequestedRunner accepts supported values and rejects invalid ones", () => {
  expect(resolveRequestedRunner(undefined)).toBeUndefined();
  expect(resolveRequestedRunner("")).toBeUndefined();
  expect(resolveRequestedRunner("reducer")).toBe("reducer");
  expect(resolveRequestedRunner("embedded")).toBe("embedded");
  expect(resolveRequestedRunner("browser")).toBe("browser");
  expect(() => resolveRequestedRunner("remote")).toThrow(
    "Unsupported test runner",
  );
});
