/**
 * Child-process worker for the cross-process credential-lock test.
 *
 * Each worker takes the credential lock, reads the current on-disk
 * access token, appends its `WORKER_SUFFIX` to it, and writes the
 * result back. If the lock primitive is correctly serializing access
 * across processes, the final file's access token will contain every
 * worker's suffix exactly once and in a consistent order (no lost
 * updates, no torn writes).
 *
 * HOME is set by the test harness so this worker mutates an isolated
 * tmpdir, not the real `~/.dreamboard`.
 */

import {
  _resetCredentialStoreForTests,
  fileCredentialBackend,
  setCredentialBackendResolver,
  withCredentialLock,
} from "../credential-store.ts";

const suffix = process.env.WORKER_SUFFIX;
if (!suffix) {
  throw new Error("credential-lock-worker requires WORKER_SUFFIX");
}

_resetCredentialStoreForTests();
setCredentialBackendResolver(() => fileCredentialBackend);

await withCredentialLock(async (ops) => {
  const snapshot = await ops.read();
  const currentAccess = snapshot?.accessToken ?? "rotation";
  const currentRefresh = snapshot?.refreshToken ?? "refresh-seed";

  // Hold the lock long enough that the other workers queue behind us.
  // If the lock is not enforced, any of them can read/modify/write in
  // this window and we will observe a lost update on the access token.
  const holdMs = 20 + Math.floor(Math.random() * 30);
  await new Promise((resolve) => setTimeout(resolve, holdMs));

  await ops.writeFull({
    accessToken: `${currentAccess}-${suffix}`,
    refreshToken: currentRefresh,
  });
});
