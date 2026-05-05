/**
 * Single-flight, lock-aware coordinator for Supabase session refreshes.
 *
 * Replaces the ad-hoc refresh logic that used to live in
 * `config/resolve.ts` and was responsible for the refresh-token-wipe
 * bug. Guarantees:
 *
 * - In-process single-flight: concurrent call sites within the same
 *   CLI process share a single `setSession` call.
 * - Cross-process serialization via `withCredentialLock`: two CLI
 *   invocations (e.g. `sync` + `compile`) cannot both rotate Supabase
 *   refresh tokens and clobber each other on disk.
 * - Read-modify-write happens INSIDE the lock: we re-read credentials
 *   after acquiring the lock, because another process may already have
 *   rotated them.
 * - No disk mutation on transient or network errors. The stored refresh
 *   token is only overwritten on a successful rotation.
 * - Permanent-invalid errors throw `PermanentRefreshError`. The stored
 *   refresh token is left in place so the user can still inspect state
 *   with `dreamboard auth status`. `dreamboard login` is the only path
 *   that should replace it, via `setCredentials`.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  type Credentials,
  type CredentialLockOps,
  type StoredSessionSnapshot,
  withCredentialLock,
} from "../config/credential-store.js";
import {
  PermanentRefreshError,
  classifyRefreshError,
} from "./refresh-error.js";

export type RefreshContext = {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
  /**
   * How close to access-token expiry (in ms) we should proactively
   * rotate. Keeping a conservative window avoids doing a network round
   * trip on every command while still catching "about to expire".
   */
  readonly refreshWindowMs?: number;
};

export const DEFAULT_REFRESH_WINDOW_MS = 5 * 60 * 1000;

export type RefreshResult =
  /** Existing credentials are fresh; no rotation performed. */
  | { readonly kind: "unchanged"; readonly credentials: Credentials }
  /** Credentials were rotated and persisted. */
  | { readonly kind: "rotated"; readonly credentials: Credentials }
  /**
   * Credentials are expiring/expired but Supabase returned a transient
   * error. We did NOT modify disk state; caller can decide whether to
   * proceed with the stale access token or bail.
   */
  | {
      readonly kind: "transient_failure";
      readonly credentials: Credentials;
      readonly message: string;
    }
  /** No credentials available to refresh. */
  | { readonly kind: "missing"; readonly credentials: null };

let inflight: Promise<RefreshResult> | null = null;

export async function ensureFreshAccessToken(
  context: RefreshContext,
): Promise<RefreshResult> {
  if (inflight) return inflight;
  inflight = runRefresh(context).finally(() => {
    inflight = null;
  });
  return inflight;
}

async function runRefresh(context: RefreshContext): Promise<RefreshResult> {
  return withCredentialLock(async (ops) => {
    const existing = await ops.read();
    const refreshable = toRefreshable(existing);
    if (!refreshable) {
      return { kind: "missing", credentials: null };
    }

    const shouldRefresh = isAccessTokenExpiringSoon(
      refreshable.accessToken,
      context.refreshWindowMs ?? DEFAULT_REFRESH_WINDOW_MS,
    );
    if (!shouldRefresh) {
      return { kind: "unchanged", credentials: refreshable };
    }

    return attemptRotation(context, refreshable, ops);
  });
}

function toRefreshable(
  snapshot: StoredSessionSnapshot | null,
): Credentials | null {
  if (!snapshot) return null;
  if (!snapshot.accessToken || !snapshot.refreshToken) return null;
  return {
    accessToken: snapshot.accessToken,
    refreshToken: snapshot.refreshToken,
  };
}

async function attemptRotation(
  context: RefreshContext,
  existing: Credentials,
  ops: CredentialLockOps,
): Promise<RefreshResult> {
  const supabase = createSupabaseClient(
    context.supabaseUrl,
    context.supabaseAnonKey,
  );

  let data: {
    session: {
      access_token?: string;
      refresh_token?: string | null;
    } | null;
  };
  let error: { message?: string } | null;
  try {
    const result = await supabase.auth.setSession({
      access_token: existing.accessToken,
      refresh_token: existing.refreshToken,
    });
    data = result.data;
    error = result.error;
  } catch (thrown) {
    // Supabase SDK threw (network/abort). Classify and decide.
    const classification = classifyRefreshError(thrown);
    if (classification.kind === "permanent_invalid") {
      throw new PermanentRefreshError(classification.message);
    }
    return {
      kind: "transient_failure",
      credentials: existing,
      message: classification.message,
    };
  }

  if (error) {
    const classification = classifyRefreshError(error);
    if (classification.kind === "permanent_invalid") {
      throw new PermanentRefreshError(classification.message);
    }
    return {
      kind: "transient_failure",
      credentials: existing,
      message: classification.message,
    };
  }

  const session = data.session;
  const rotatedAccessToken = session?.access_token;
  if (!rotatedAccessToken) {
    // Supabase returned success but no session. Treat as transient so
    // we do not touch disk on an ambiguous response.
    return {
      kind: "transient_failure",
      credentials: existing,
      message: "Supabase returned no session on refresh",
    };
  }

  const rotated: Credentials = {
    accessToken: rotatedAccessToken,
    refreshToken: session?.refresh_token ?? existing.refreshToken,
  };
  await ops.writeFull(rotated);
  return { kind: "rotated", credentials: rotated };
}

function isAccessTokenExpiringSoon(
  accessToken: string,
  refreshWindowMs: number,
): boolean {
  const expiry = getAccessTokenExpiry(accessToken);
  if (!expiry) {
    // If we cannot parse the expiry, assume it is ok. A refresh attempt
    // for an opaque/non-JWT access token would fail anyway.
    return false;
  }
  return expiry.getTime() - Date.now() <= refreshWindowMs;
}

export function getAccessTokenExpiry(
  accessToken: string | undefined,
): Date | null {
  if (!accessToken) return null;
  const parts = accessToken.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1]!, "base64url").toString("utf8"),
    ) as { exp?: unknown };
    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
      return null;
    }
    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
}

/** Test-only reset. */
export function _resetRefreshCoordinatorForTests(): void {
  inflight = null;
}
