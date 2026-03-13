import type { ErrorResponse } from "@dreamboard/api-client";

/**
 * Utilities for extracting clean, human-readable error messages from API responses.
 *
 * The generated openapi-ts client returns errors in different shapes:
 * - JSON object with `message` field: { message: "..." }
 * - JSON object with `message` and `errors` fields: { message: "...", errors: [...] }
 * - Raw string (when the response body isn't JSON)
 * - undefined/null (when there's no error body)
 *
 * This module normalises all of those into a single clean string.
 */

type ApiClientError =
  | ErrorResponse
  | Error
  | string
  | Record<string, unknown>
  | null
  | undefined;

function isErrorResponse(value: unknown): value is ErrorResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.message === "string" &&
    (obj.errors === undefined ||
      (Array.isArray(obj.errors) &&
        obj.errors.every((entry) => typeof entry === "string")))
  );
}

/**
 * Extract a clean error message from the error object returned by the generated API client.
 */
export function extractApiError(
  error: ApiClientError,
  fallback: string,
): string {
  if (!error) return fallback;

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === "string") {
    return error.trim() || fallback;
  }

  if (isErrorResponse(error)) {
    if (error.errors?.length) {
      return `${error.message} (${error.errors.join("; ")})`;
    }
    return error.message;
  }

  // JSON object – look for a `message` field (the standard ErrorResponse shape)
  if (typeof error === "object") {
    const obj = error;
    const message = typeof obj.message === "string" ? obj.message : undefined;
    const errors = Array.isArray(obj.errors) ? obj.errors : undefined;

    if (message && errors?.length) {
      return `${message} (${errors.join("; ")})`;
    }
    if (message) {
      return message;
    }
    // Fallback: try to serialise the object for debugging
    try {
      return JSON.stringify(error);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

/**
 * Build a rich error message that includes the HTTP status code when available.
 *
 * @param error    – the `error` field from the generated client response
 * @param response – the `response` field (a `Response` object) from the generated client,
 *                   or undefined if the call failed at the network level
 * @param fallback – message to use when nothing useful can be extracted
 */
export function formatApiError(
  error: ApiClientError,
  response: { status?: number; statusText?: string } | undefined,
  fallback: string,
): string {
  const message = extractApiError(error, fallback);

  if (response?.status) {
    return `${message} (HTTP ${response.status})`;
  }

  return message;
}

/**
 * Format a caught error into a concise one-liner suitable for CLI stderr output.
 * Strips stack traces, ANSI codes, and runtime source-code previews.
 */
export function formatCliError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
