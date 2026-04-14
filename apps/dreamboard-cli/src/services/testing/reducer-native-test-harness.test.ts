import { expect, test } from "bun:test";

import { assertDispatchResultWireContract } from "./reducer-native-test-harness.js";

test("accept dispatch results require kind discriminators throughout trace payloads", () => {
  expect(() =>
    assertDispatchResultWireContract({
      type: "accept",
      kind: "accept",
      trace: [
        {
          type: "acceptedClientInput",
          kind: "acceptedClientInput",
          input: { kind: "action" },
        },
        {
          type: "appliedEffect",
          kind: "appliedEffect",
          effect: {
            type: "openWindow",
            kind: "openWindow",
            closePolicy: {
              type: "manual",
              kind: "manual",
            },
          },
        },
      ],
    }),
  ).not.toThrow();
});

test("missing top-level dispatch result kind fails with a backend-like contract error", () => {
  expect(() =>
    assertDispatchResultWireContract({
      type: "accept",
      trace: [],
    }),
  ).toThrow("DispatchResult must include kind='accept'");
});

test("missing nested effect kind fails with a precise payload path", () => {
  expect(() =>
    assertDispatchResultWireContract({
      type: "accept",
      kind: "accept",
      trace: [
        {
          type: "appliedEffect",
          kind: "appliedEffect",
          effect: {
            type: "dispatchSystem",
          },
        },
      ],
    }),
  ).toThrow(
    "DispatchResult.accept.trace[0].effect must include kind='dispatchSystem'",
  );
});
