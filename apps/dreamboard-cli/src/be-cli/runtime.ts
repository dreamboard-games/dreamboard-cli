import path from "node:path";
import {
  configureClient,
  requireAuth,
  resolveConfig,
} from "../config/resolve.js";
import { loadGlobalConfig } from "../config/global-config.js";
import { parseConfigFlags } from "../flags.js";
import { readJsonFile, writeJsonFile } from "../utils/fs.js";
import type {
  BeCliEnvelope,
  BeCliErrorInfo,
  BeCliOperationDefinition,
} from "./types.js";

function camelFromKebab(value: string): string {
  return value.replace(/-([a-z])/g, (_, letter: string) =>
    letter.toUpperCase(),
  );
}

function getArg(args: Record<string, unknown>, name: string): unknown {
  return args[name] ?? args[camelFromKebab(name)];
}

function getOptionalString(
  args: Record<string, unknown>,
  name: string,
): string | undefined {
  const value = getArg(args, name);
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function getOptionalStringArray(
  args: Record<string, unknown>,
  name: string,
): string[] {
  const value = getArg(args, name);
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return [value.trim()];
  }
  return [];
}

function getOptionalInteger(
  args: Record<string, unknown>,
  name: string,
): number | undefined {
  const value = getOptionalString(args, name);
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(
      `Expected --${name} to be an integer, received '${value}'.`,
    );
  }
  return parsed;
}

function normalizeApiError(
  error: unknown,
  status: number | null,
): BeCliErrorInfo {
  if (error && typeof error === "object") {
    const message =
      "message" in error && typeof error.message === "string"
        ? error.message
        : status !== null
          ? `Backend request failed with HTTP ${status}.`
          : "Backend request failed.";
    return {
      kind: "api",
      message,
      details: error,
    };
  }

  return {
    kind: "api",
    message:
      status !== null
        ? `Backend request failed with HTTP ${status}.`
        : "Backend request failed.",
    details: error ?? null,
  };
}

function normalizeCliError(error: unknown): BeCliErrorInfo {
  if (error instanceof Error) {
    return {
      kind: "cli",
      message: error.message,
    };
  }
  return {
    kind: "cli",
    message: String(error),
  };
}

function evaluateAssertions(
  envelope: BeCliEnvelope,
  assertions: string[],
  env: NodeJS.ProcessEnv,
): BeCliErrorInfo | null {
  for (const expression of assertions) {
    try {
      const predicate = new Function(
        "response",
        "env",
        `return (${expression});`,
      ) as (response: BeCliEnvelope, env: NodeJS.ProcessEnv) => unknown;

      if (!predicate(envelope, env)) {
        return {
          kind: "assertion",
          message: `Assertion failed: ${expression}`,
        };
      }
    } catch (error) {
      return {
        kind: "assertion",
        message: `Assertion threw: ${expression}`,
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }
  return null;
}

function formatEnvelope(
  envelope: BeCliEnvelope,
  format: string | undefined,
): string {
  return format === "pretty"
    ? JSON.stringify(envelope, null, 2)
    : JSON.stringify(envelope);
}

async function resolveBody(
  operation: BeCliOperationDefinition,
  args: Record<string, unknown>,
  deps: BeCliDependencies,
): Promise<unknown> {
  const bodyFile = getOptionalString(args, "body-file");
  const bodyMode = operation.bodyFileMode ?? "forbidden";

  if (bodyMode === "required" && !bodyFile) {
    throw new Error(
      `Operation ${operation.resource}.${operation.action} requires --body-file.`,
    );
  }

  if (bodyMode === "forbidden" && bodyFile) {
    throw new Error(
      `Operation ${operation.resource}.${operation.action} does not accept --body-file.`,
    );
  }

  if (!bodyFile) {
    return undefined;
  }

  const bodyPath = path.resolve(deps.cwd(), bodyFile);
  return deps.readJsonFile(bodyPath);
}

async function configureApiClient(
  operation: BeCliOperationDefinition,
  args: Record<string, unknown>,
  deps: BeCliDependencies,
): Promise<void> {
  const configFlags = parseConfigFlags({
    env: getOptionalString(args, "env"),
    token: getOptionalString(args, "token"),
  });
  const config = deps.resolveConfig(await deps.loadGlobalConfig(), configFlags);
  const baseUrlOverride = getOptionalString(args, "base-url");
  if (baseUrlOverride) {
    config.apiBaseUrl = baseUrlOverride;
  }

  if (operation.requiresAuth !== false) {
    deps.requireAuth(config);
  }

  await deps.configureClient(config);
}

export type BeCliDependencies = {
  loadGlobalConfig: typeof loadGlobalConfig;
  resolveConfig: typeof resolveConfig;
  configureClient: typeof configureClient;
  requireAuth: typeof requireAuth;
  readJsonFile: typeof readJsonFile;
  writeJsonFile: typeof writeJsonFile;
  cwd: () => string;
  env: () => NodeJS.ProcessEnv;
};

export const DEFAULT_BE_CLI_DEPENDENCIES: BeCliDependencies = {
  loadGlobalConfig,
  resolveConfig,
  configureClient,
  requireAuth,
  readJsonFile,
  writeJsonFile,
  cwd: () => process.cwd(),
  env: () => process.env,
};

export async function executeBeCliOperation(
  operation: BeCliOperationDefinition,
  args: Record<string, unknown>,
  deps: BeCliDependencies = DEFAULT_BE_CLI_DEPENDENCIES,
): Promise<BeCliEnvelope> {
  const operationName = `${operation.resource}.${operation.action}`;
  const expectedStatus = getOptionalInteger(args, "expect-status");
  const assertions = getOptionalStringArray(args, "assert");
  let envelope: BeCliEnvelope;

  try {
    await configureApiClient(operation, args, deps);
    const body = await resolveBody(operation, args, deps);
    const request = operation.buildRequest({ args, body });
    const result = await operation.invoke(request);
    const status = result.response?.status ?? null;
    const apiError = result.error
      ? normalizeApiError(result.error, status)
      : null;
    const matchesStatus =
      expectedStatus !== undefined
        ? status === expectedStatus
        : result.response
          ? result.response.ok
          : result.error === undefined;

    envelope = {
      ok: matchesStatus,
      operation: operationName,
      status,
      data: result.data ?? null,
      error: apiError,
    };

    const assertionFailure = evaluateAssertions(
      envelope,
      assertions,
      deps.env(),
    );
    if (assertionFailure) {
      envelope = {
        ...envelope,
        ok: false,
        error: assertionFailure,
      };
    } else if (expectedStatus !== undefined && envelope.ok && apiError) {
      envelope = {
        ...envelope,
        ok: true,
      };
    }
  } catch (error) {
    envelope = {
      ok: false,
      operation: operationName,
      status: null,
      data: null,
      error: normalizeCliError(error),
    };
  }

  const writePath = getOptionalString(args, "write");
  if (writePath) {
    await deps.writeJsonFile(path.resolve(deps.cwd(), writePath), envelope);
  }

  return envelope;
}

export function renderBeCliEnvelope(
  envelope: BeCliEnvelope,
  format: string | undefined,
): string {
  return formatEnvelope(envelope, format);
}
