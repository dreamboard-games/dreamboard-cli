import type { ProblemDetails, ProblemViolation } from "@dreamboard/api-client";
import { zProblemDetails } from "@dreamboard/api-client/zod.gen";
import { CLI_PROBLEM_TYPES } from "./problem-types.js";
import type { CliProblemType } from "./problem-types.js";

type ApiClientError =
  | ProblemDetails
  | Error
  | string
  | Record<string, unknown>
  | null
  | undefined;

type ApiProblem = Omit<ProblemDetails, "type"> & {
  type: CliProblemType | (string & {});
};

type ResponseLike = {
  status?: number;
  statusText?: string;
  headers?: {
    get?: (name: string) => string | null | undefined;
  };
};

function isProblemViolationArray(value: unknown): value is ProblemViolation[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as { message?: unknown }).message === "string",
    )
  );
}

export function isProblemDetails(value: unknown): value is ProblemDetails {
  return zProblemDetails.safeParse(value).success;
}

function coerceViolations(value: unknown): ProblemViolation[] | undefined {
  if (isProblemViolationArray(value)) {
    return value;
  }

  if (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === "string")
  ) {
    return value.map((message) => ({ message }));
  }

  return undefined;
}

function getRequestId(response?: ResponseLike): string | undefined {
  return (
    response?.headers?.get?.("X-Correlation-ID") ??
    response?.headers?.get?.("x-correlation-id") ??
    undefined
  );
}

export function toApiProblem(
  error: ApiClientError,
  response: ResponseLike | undefined,
  fallback: string,
): ApiProblem {
  if (isProblemDetails(error)) {
    return {
      ...error,
      status: error.status || response?.status || 0,
      requestId: error.requestId ?? getRequestId(response),
    };
  }

  if (error instanceof Error) {
    return {
      type: CLI_PROBLEM_TYPES.TRANSPORT_ERROR,
      title: response?.statusText || "API error",
      status: response?.status ?? 0,
      detail: error.message || fallback,
      requestId: getRequestId(response),
    };
  }

  if (error && typeof error === "object") {
    const obj = error as Record<string, unknown>;
    const detail =
      typeof obj.detail === "string"
        ? obj.detail
        : typeof obj.message === "string"
          ? obj.message
          : undefined;
    const title =
      typeof obj.title === "string"
        ? obj.title
        : response?.statusText || "API error";
    const violations =
      coerceViolations(obj.violations) ?? coerceViolations(obj.errors);

    if (detail) {
      return {
        type:
          typeof obj.type === "string"
            ? obj.type
            : CLI_PROBLEM_TYPES.UNKNOWN_API_ERROR,
        title,
        status:
          typeof obj.status === "number" ? obj.status : (response?.status ?? 0),
        detail,
        requestId:
          typeof obj.requestId === "string"
            ? obj.requestId
            : getRequestId(response),
        retryable:
          typeof obj.retryable === "boolean" ? obj.retryable : undefined,
        context:
          typeof obj.context === "object" && obj.context !== null
            ? (obj.context as Record<string, string>)
            : undefined,
        violations,
        timestamp:
          typeof obj.timestamp === "string" ? obj.timestamp : undefined,
        instance: typeof obj.instance === "string" ? obj.instance : undefined,
      };
    }
  }

  const detail =
    typeof error === "string" ? error.trim() || fallback : fallback;

  return {
    type: CLI_PROBLEM_TYPES.UNKNOWN_API_ERROR,
    title: response?.statusText || "API error",
    status: response?.status ?? 0,
    detail,
    requestId: getRequestId(response),
  };
}

function formatProblem(problem: ApiProblem): string {
  const base = problem.detail || problem.title;
  const violations =
    problem.violations && problem.violations.length > 0
      ? ` (${problem.violations.map((entry) => entry.message).join("; ")})`
      : "";
  const statusSuffix =
    problem.status && problem.status > 0 ? ` (HTTP ${problem.status})` : "";
  return `${base}${violations}${statusSuffix}`;
}

export class DreamboardApiError extends Error {
  readonly problem: ApiProblem;
  readonly status: number;
  readonly requestId?: string;
  readonly retryable?: boolean;

  constructor(problem: ApiProblem, cause?: unknown) {
    super(formatProblem(problem), { cause });
    this.name = "DreamboardApiError";
    this.problem = problem;
    this.status = problem.status;
    this.requestId = problem.requestId;
    this.retryable = problem.retryable;
  }
}

export function toDreamboardApiError(
  error: ApiClientError,
  response: ResponseLike | undefined,
  fallback: string,
): DreamboardApiError {
  return new DreamboardApiError(toApiProblem(error, response, fallback), error);
}

export function formatApiError(
  error: ApiClientError,
  response: ResponseLike | undefined,
  fallback: string,
): string {
  return formatProblem(toApiProblem(error, response, fallback));
}

export function isDreamboardApiError(
  error: unknown,
): error is DreamboardApiError {
  return error instanceof DreamboardApiError;
}

export function isProblemType(error: unknown, ...types: string[]): boolean {
  return isDreamboardApiError(error) && types.includes(error.problem.type);
}

export function getProblemContext(
  error: unknown,
): Record<string, string> | undefined {
  return isDreamboardApiError(error) ? error.problem.context : undefined;
}

export function getProblemContextValue(
  error: unknown,
  key: string,
): string | undefined {
  return getProblemContext(error)?.[key];
}

export function formatCliError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
