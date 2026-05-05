import { beforeEach, expect, mock, test } from "bun:test";

// Wire the Supabase client + credential-store dependencies BEFORE
// importing the coordinator so that its module-level imports resolve to
// our in-memory fakes.
type StoredSnapshot = { accessToken?: string; refreshToken?: string } | null;
let storedSnapshot: StoredSnapshot = null;

const setSession = mock(async () => ({
  data: {
    session: {
      access_token: "rotated-access-token",
      refresh_token: "rotated-refresh-token",
    },
  },
  error: null,
}));
const createSupabaseClient = mock(() => ({
  auth: {
    setSession,
  },
}));

mock.module("@supabase/supabase-js", () => ({
  createClient: createSupabaseClient,
}));

async function backendRead() {
  return storedSnapshot;
}
async function backendWriteFull(creds: {
  accessToken: string;
  refreshToken: string;
}) {
  storedSnapshot = {
    accessToken: creds.accessToken,
    refreshToken: creds.refreshToken,
  };
}
async function backendWriteAccessOnly(accessToken: string) {
  storedSnapshot = { accessToken };
}
async function backendClear() {
  storedSnapshot = null;
}

type LockOps = {
  backendName: "file";
  read: typeof backendRead;
  writeFull: typeof backendWriteFull;
  writeAccessOnly: typeof backendWriteAccessOnly;
  clear: typeof backendClear;
};

// withCredentialLock is emulated by a simple mutex so we can assert
// serialization behavior for parallel refresh attempts.
let lockHolder: Promise<unknown> = Promise.resolve();
async function fakeWithCredentialLock<T>(fn: (ops: LockOps) => Promise<T>) {
  const chain = lockHolder.then(() =>
    fn({
      backendName: "file",
      read: backendRead,
      writeFull: backendWriteFull,
      writeAccessOnly: backendWriteAccessOnly,
      clear: backendClear,
    }),
  );
  lockHolder = chain.catch(() => undefined);
  return chain;
}
const withCredentialLock = mock(fakeWithCredentialLock);

mock.module("../config/credential-store.js", () => ({
  withCredentialLock,
}));

const {
  DEFAULT_REFRESH_WINDOW_MS,
  _resetRefreshCoordinatorForTests,
  ensureFreshAccessToken,
  getAccessTokenExpiry,
} = await import("./refresh-coordinator.ts");
const { PermanentRefreshError } = await import("./refresh-error.ts");

function createJwt(expSecondsFromNow: number): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
    }),
  ).toString("base64url");
  return `${header}.${payload}.signature`;
}

const REFRESH_CONTEXT = {
  supabaseUrl: "https://supabase.example",
  supabaseAnonKey: "anon-key",
};

beforeEach(() => {
  storedSnapshot = null;
  lockHolder = Promise.resolve();
  _resetRefreshCoordinatorForTests();
  setSession.mockClear();
  createSupabaseClient.mockClear();
  withCredentialLock.mockClear();
  setSession.mockImplementation(async () => ({
    data: {
      session: {
        access_token: "rotated-access-token",
        refresh_token: "rotated-refresh-token",
      },
    },
    error: null,
  }));
  createSupabaseClient.mockImplementation(() => ({
    auth: {
      setSession,
    },
  }));
});

test("returns missing when there is no stored session", async () => {
  const result = await ensureFreshAccessToken(REFRESH_CONTEXT);
  expect(result.kind).toBe("missing");
  expect(setSession).not.toHaveBeenCalled();
});

test("returns missing when only an access-only session is on disk", async () => {
  storedSnapshot = { accessToken: createJwt(3600) };
  const result = await ensureFreshAccessToken(REFRESH_CONTEXT);
  expect(result.kind).toBe("missing");
  expect(setSession).not.toHaveBeenCalled();
});

test("returns unchanged when the access token has plenty of life left", async () => {
  storedSnapshot = {
    accessToken: createJwt(3600),
    refreshToken: "refresh-token",
  };
  const result = await ensureFreshAccessToken(REFRESH_CONTEXT);
  expect(result.kind).toBe("unchanged");
  if (result.kind === "unchanged") {
    expect(result.credentials.accessToken).toBe(storedSnapshot!.accessToken!);
  }
  expect(setSession).not.toHaveBeenCalled();
});

test("rotates and persists when the access token is within the refresh window", async () => {
  const expiring = createJwt(60);
  storedSnapshot = {
    accessToken: expiring,
    refreshToken: "refresh-token",
  };
  const result = await ensureFreshAccessToken(REFRESH_CONTEXT);
  expect(result.kind).toBe("rotated");
  if (result.kind === "rotated") {
    expect(result.credentials).toEqual({
      accessToken: "rotated-access-token",
      refreshToken: "rotated-refresh-token",
    });
  }
  expect(setSession).toHaveBeenCalledWith({
    access_token: expiring,
    refresh_token: "refresh-token",
  });
  expect(storedSnapshot).toEqual({
    accessToken: "rotated-access-token",
    refreshToken: "rotated-refresh-token",
  });
});

test("treats ambiguous Supabase errors as transient without touching disk", async () => {
  storedSnapshot = {
    accessToken: createJwt(60),
    refreshToken: "refresh-token",
  };
  const originalSnapshot = { ...storedSnapshot };
  setSession.mockImplementation(async () => ({
    data: { session: null },
    error: { message: "Temporarily unavailable" },
  }));
  const result = await ensureFreshAccessToken(REFRESH_CONTEXT);
  expect(result.kind).toBe("transient_failure");
  if (result.kind === "transient_failure") {
    expect(result.credentials.refreshToken).toBe("refresh-token");
    expect(result.message).toBe("Temporarily unavailable");
  }
  expect(storedSnapshot).toEqual(originalSnapshot);
});

test("treats a thrown Supabase network error as transient without touching disk", async () => {
  storedSnapshot = {
    accessToken: createJwt(60),
    refreshToken: "refresh-token",
  };
  const originalSnapshot = { ...storedSnapshot };
  setSession.mockImplementation(async () => {
    throw new Error("fetch failed");
  });
  const result = await ensureFreshAccessToken(REFRESH_CONTEXT);
  expect(result.kind).toBe("transient_failure");
  expect(storedSnapshot).toEqual(originalSnapshot);
});

test("throws PermanentRefreshError on known permanent Supabase errors without wiping disk", async () => {
  storedSnapshot = {
    accessToken: createJwt(60),
    refreshToken: "stale-refresh",
  };
  const originalSnapshot = { ...storedSnapshot };
  setSession.mockImplementation(async () => ({
    data: { session: null },
    error: { message: "Invalid Refresh Token: Refresh Token Not Found" },
  }));
  await expect(ensureFreshAccessToken(REFRESH_CONTEXT)).rejects.toBeInstanceOf(
    PermanentRefreshError,
  );
  expect(storedSnapshot).toEqual(originalSnapshot);
});

test("in-process single-flight deduplicates concurrent refresh calls", async () => {
  storedSnapshot = {
    accessToken: createJwt(60),
    refreshToken: "refresh-token",
  };
  const results = await Promise.all([
    ensureFreshAccessToken(REFRESH_CONTEXT),
    ensureFreshAccessToken(REFRESH_CONTEXT),
    ensureFreshAccessToken(REFRESH_CONTEXT),
  ]);
  // All callers saw the same result and only one Supabase round trip
  // was made.
  expect(setSession).toHaveBeenCalledTimes(1);
  const kinds = new Set(results.map((r) => r.kind));
  expect(kinds).toEqual(new Set(["rotated"]));
});

test("re-reads credentials inside the lock after another process rotated them", async () => {
  const initialSnapshot = {
    accessToken: createJwt(60),
    refreshToken: "stale-refresh",
  };
  storedSnapshot = initialSnapshot;

  let firstCall = true;
  const originalBackendRead = backendRead;
  const readSpy = mock(async () => {
    if (firstCall) {
      firstCall = false;
      // Simulate a sibling process rotating the session while we were
      // waiting for the lock.
      storedSnapshot = {
        accessToken: createJwt(3600),
        refreshToken: "fresh-refresh",
      };
      return storedSnapshot;
    }
    return originalBackendRead();
  });
  // Reinstall the mock backend with the read spy so the coordinator
  // sees the race through the lock handle.
  withCredentialLock.mockImplementation(async (fn: any) =>
    fn({
      backendName: "file" as const,
      read: readSpy,
      writeFull: backendWriteFull,
      writeAccessOnly: backendWriteAccessOnly,
      clear: backendClear,
    }),
  );

  const result = await ensureFreshAccessToken(REFRESH_CONTEXT);
  expect(result.kind).toBe("unchanged");
  if (result.kind === "unchanged") {
    expect(result.credentials.refreshToken).toBe("fresh-refresh");
  }
  expect(setSession).not.toHaveBeenCalled();
});

test("getAccessTokenExpiry returns null for non-JWT access tokens", () => {
  expect(getAccessTokenExpiry(undefined)).toBeNull();
  expect(getAccessTokenExpiry("")).toBeNull();
  expect(getAccessTokenExpiry("opaque-token")).toBeNull();
  expect(getAccessTokenExpiry("a.b")).toBeNull();
});

test("DEFAULT_REFRESH_WINDOW_MS is five minutes", () => {
  expect(DEFAULT_REFRESH_WINDOW_MS).toBe(5 * 60 * 1000);
});
