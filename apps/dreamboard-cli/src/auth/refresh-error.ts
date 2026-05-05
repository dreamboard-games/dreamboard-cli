/**
 * Classification of Supabase `setSession` errors for the refresh path.
 *
 * The previous `isInvalidRefreshTokenMessage` helper returned a boolean
 * and was used to decide whether to wipe the stored refresh token. That
 * classification was too aggressive: Supabase returns "refresh token
 * not found / reuse / expired" strings for genuinely transient reasons
 * (clock skew on a laptop lid-open, momentary 5xx retried internally,
 * benign rotation races when two CLI processes hit the endpoint within
 * a few ms). In those cases wiping disk state made the bug worse: the
 * user now had to re-login even though the refresh token was still
 * valid on the server.
 *
 * We keep the classification narrow and default ambiguous cases to
 * `transient` so the CLI retains the stored refresh token and the
 * user's next retry has a chance to succeed.
 */

export type RefreshErrorKind =
  /** Supabase indicated the refresh token is permanently invalid. */
  | "permanent_invalid"
  /** Network / DNS / timeout. Retryable. */
  | "network"
  /** Anything else. Treated as transient; disk state preserved. */
  | "transient";

export type RefreshErrorClassification = {
  readonly kind: RefreshErrorKind;
  readonly message: string;
};

export class PermanentRefreshError extends Error {
  readonly kind = "permanent_invalid" as const;
  constructor(message: string) {
    super(message);
    this.name = "PermanentRefreshError";
  }
}

const NETWORK_HINTS = [
  "fetch failed",
  "network request failed",
  "getaddrinfo",
  "enotfound",
  "econnrefused",
  "econnreset",
  "etimedout",
  "socket hang up",
  "und_err",
];

// Supabase refresh errors we treat as permanent: the server has
// authoritatively stated that this refresh token will never work again.
// Note: this list is intentionally narrow. "invalid" by itself is too
// broad - 5xx responses sometimes include that word.
const PERMANENT_INVALID_HINTS = [
  "refresh token not found",
  "refresh token is invalid",
  "refresh token has been revoked",
  "refresh token already used",
  "refresh token reuse",
  "refresh_token_already_used",
  "invalid_grant",
];

export function classifyRefreshError(
  error: unknown,
): RefreshErrorClassification {
  const message = extractMessage(error);
  const normalized = message.toLowerCase();

  for (const hint of PERMANENT_INVALID_HINTS) {
    if (normalized.includes(hint)) {
      return { kind: "permanent_invalid", message };
    }
  }

  for (const hint of NETWORK_HINTS) {
    if (normalized.includes(hint)) {
      return { kind: "network", message };
    }
  }

  return { kind: "transient", message };
}

function extractMessage(error: unknown): string {
  if (error === null || error === undefined) return "";
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const candidate = (error as { message?: unknown }).message;
    if (typeof candidate === "string") return candidate;
  }
  return String(error);
}
