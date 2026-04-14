import { describe, expect, test } from "bun:test";

import { toApiProblem } from "./errors.js";
import { CLI_PROBLEM_TYPES } from "./problem-types.js";

describe("toApiProblem", () => {
  test("classifies Error instances as transport errors", () => {
    const problem = toApiProblem(
      new TypeError("Failed to fetch"),
      undefined,
      "Fallback message",
    );

    expect(problem).toMatchObject({
      type: CLI_PROBLEM_TYPES.TRANSPORT_ERROR,
      detail: "Failed to fetch",
      status: 0,
      title: "API error",
    });
  });

  test("preserves structured problem payloads from plain objects", () => {
    const problem = toApiProblem(
      {
        type: "VALIDATION_ERROR",
        title: "Validation failed",
        status: 400,
        detail: "Bad input",
      },
      undefined,
      "Fallback message",
    );

    expect(problem).toMatchObject({
      type: "VALIDATION_ERROR",
      title: "Validation failed",
      status: 400,
      detail: "Bad input",
    });
  });
});
