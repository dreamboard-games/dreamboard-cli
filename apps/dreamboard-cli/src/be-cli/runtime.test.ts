import { expect, test } from "bun:test";
import type { GlobalConfig, ResolvedConfig } from "../types.js";
import { executeBeCliOperation } from "./runtime.js";
import type { BeCliDependencies } from "./runtime.js";
import type { BeCliOperationDefinition } from "./types.js";

function createDeps(
  overrides: Partial<BeCliDependencies> = {},
): BeCliDependencies {
  return {
    loadGlobalConfig: async (): Promise<GlobalConfig> => ({}),
    resolveConfig: (): ResolvedConfig => ({
      apiBaseUrl: "http://127.0.0.1:8080",
      webBaseUrl: "http://127.0.0.1:5173",
      supabaseUrl: "http://127.0.0.1:54321",
      supabaseAnonKey: "anon-key",
      authToken: "token",
      refreshToken: undefined,
    }),
    configureClient: async () => undefined,
    requireAuth: () => undefined,
    readJsonFile: async () => ({}),
    writeJsonFile: async () => undefined,
    cwd: () => "/tmp",
    env: () => ({ EXPECTED: "42" }),
    ...overrides,
  };
}

const testOperation: BeCliOperationDefinition = {
  resource: "tests",
  action: "run",
  description: "Run a test operation.",
  bodyFileMode: "forbidden",
  buildRequest: () => ({}),
  invoke: async () => ({
    data: { answer: 42, phase: "LOBBY" },
    response: new Response(JSON.stringify({ answer: 42 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  }),
};

test("executeBeCliOperation configures auth-aware operations", async () => {
  let requireAuthCalled = false;
  let configuredBaseUrl = "";

  const envelope = await executeBeCliOperation(
    testOperation,
    {
      env: "local",
      token: "override-token",
      "base-url": "http://127.0.0.1:9999",
    },
    createDeps({
      requireAuth: () => {
        requireAuthCalled = true;
      },
      configureClient: async (config) => {
        configuredBaseUrl = config.apiBaseUrl;
      },
    }),
  );

  expect(envelope.ok).toBe(true);
  expect(requireAuthCalled).toBe(true);
  expect(configuredBaseUrl).toBe("http://127.0.0.1:9999");
});

test("executeBeCliOperation reads JSON bodies from --body-file", async () => {
  const bodyOperation: BeCliOperationDefinition = {
    resource: "games",
    action: "create",
    description: "Create a game.",
    bodyFileMode: "required",
    buildRequest: ({ body }) => ({ body }),
    invoke: async (request) => ({
      data: request.body,
      response: new Response(JSON.stringify(request.body), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    }),
  };

  const envelope = await executeBeCliOperation(
    bodyOperation,
    {
      "body-file": "game.json",
    },
    createDeps({
      readJsonFile: async () => ({
        slug: "test-game",
        name: "Test Game",
      }),
    }),
  );

  expect(envelope.ok).toBe(true);
  expect(envelope.data).toEqual({
    slug: "test-game",
    name: "Test Game",
  });
});

test("executeBeCliOperation allows expected non-2xx statuses", async () => {
  const missingOperation: BeCliOperationDefinition = {
    resource: "results",
    action: "latest",
    description: "Fetch the latest result.",
    buildRequest: () => ({}),
    invoke: async () => ({
      error: { message: "Not found" },
      response: new Response(JSON.stringify({ message: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    }),
  };

  const envelope = await executeBeCliOperation(
    missingOperation,
    {
      "expect-status": "404",
    },
    createDeps(),
  );

  expect(envelope.ok).toBe(true);
  expect(envelope.status).toBe(404);
  expect(envelope.error?.kind).toBe("api");
});

test("executeBeCliOperation evaluates repeated assertions", async () => {
  const envelope = await executeBeCliOperation(
    testOperation,
    {
      assert: [
        "response.status === 200",
        "response.data.answer === Number(env.EXPECTED)",
      ],
    },
    createDeps(),
  );

  expect(envelope.ok).toBe(true);
});

test("executeBeCliOperation returns a stable envelope on assertion failure", async () => {
  const envelope = await executeBeCliOperation(
    testOperation,
    {
      assert: ["response.data.phase === 'RUNNING'"],
    },
    createDeps(),
  );

  expect(envelope).toEqual({
    ok: false,
    operation: "tests.run",
    status: 200,
    data: {
      answer: 42,
      phase: "LOBBY",
    },
    error: {
      kind: "assertion",
      message: "Assertion failed: response.data.phase === 'RUNNING'",
    },
  });
});
