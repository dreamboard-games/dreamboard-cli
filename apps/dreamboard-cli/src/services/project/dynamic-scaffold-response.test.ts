import { describe, expect, test } from "bun:test";
import { validateDynamicScaffoldResponse } from "./dynamic-scaffold-response.js";

const validScaffoldResponse = {
  generatedFiles: {
    "shared/manifest.ts": "manifest",
    "app/generated/guards.ts": "guards",
    "app/index.ts": "index",
  },
  seedFiles: {
    "shared/ui-args.ts": "ui-args",
    "ui/App.tsx": "app",
    "app/phases/setup.ts": "phase",
  },
};

describe("validateDynamicScaffoldResponse", () => {
  test("accepts valid generated, exact seed, and phase seed files", () => {
    expect(validateDynamicScaffoldResponse(validScaffoldResponse)).toEqual({
      generatedFiles: validScaffoldResponse.generatedFiles,
      seedFiles: validScaffoldResponse.seedFiles,
      allFiles: {
        ...validScaffoldResponse.generatedFiles,
        ...validScaffoldResponse.seedFiles,
      },
    });
  });

  test("rejects unexpected generated paths", () => {
    expect(() =>
      validateDynamicScaffoldResponse({
        generatedFiles: {
          "shared/not-allowed.ts": "nope",
        },
        seedFiles: {},
      }),
    ).toThrow("generatedFiles");
  });

  test("rejects unexpected seed paths", () => {
    expect(() =>
      validateDynamicScaffoldResponse({
        generatedFiles: {},
        seedFiles: {
          "shared/not-allowed.ts": "nope",
        },
      }),
    ).toThrow("seedFiles");
  });

  test("rejects invalid phase file shapes", () => {
    expect(() =>
      validateDynamicScaffoldResponse({
        generatedFiles: {},
        seedFiles: {
          "app/phases/setup.tsx": "nope",
        },
      }),
    ).toThrow("seedFiles");
  });

  test("rejects absolute paths", () => {
    expect(() =>
      validateDynamicScaffoldResponse({
        generatedFiles: {
          "/tmp/manifest.ts": "nope",
        },
        seedFiles: {},
      }),
    ).toThrow("must be relative");
  });

  test("rejects path traversal", () => {
    expect(() =>
      validateDynamicScaffoldResponse({
        generatedFiles: {},
        seedFiles: {
          "app/../shared/ui-args.ts": "nope",
        },
      }),
    ).toThrow("not normalized");
  });

  test("rejects backslash variants", () => {
    expect(() =>
      validateDynamicScaffoldResponse({
        generatedFiles: {},
        seedFiles: {
          "app\\phases\\setup.ts": "nope",
        },
      }),
    ).toThrow("forward slashes");
  });

  test("rejects non-string payload values", () => {
    expect(() =>
      validateDynamicScaffoldResponse({
        generatedFiles: {
          "shared/manifest.ts": null,
        },
        seedFiles: {},
      }),
    ).toThrow("must be a string");
  });
});
