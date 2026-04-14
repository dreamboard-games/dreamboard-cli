import {
  findManifests,
  getManifest,
  saveManifest,
} from "@dreamboard/api-client";
import type { GameTopologyManifest } from "@dreamboard/sdk-types";
import { toDreamboardApiError } from "../../utils/errors.js";

export async function saveManifestSdk(
  gameId: string,
  manifest: GameTopologyManifest,
  ruleId: string,
): Promise<{ manifestId: string; contentHash: string }> {
  const { data, error, response } = await saveManifest({
    path: { gameId },
    body: {
      manifest,
      ruleId,
    },
  });
  if (error || !data) {
    throw toDreamboardApiError(error, response, "Failed to save manifest");
  }
  return { manifestId: data.manifestId, contentHash: data.contentHash };
}

/**
 * Fetch the latest manifest ID for a game without creating a new version.
 * Returns null if no manifest exists yet.
 */
export async function getLatestManifestIdSdk(
  gameId: string,
  ruleId: string,
): Promise<string | null> {
  const { data, error, response } = await findManifests({
    path: { gameId },
    query: { ruleId, limit: 1 },
  });
  if (error || !data) {
    throw toDreamboardApiError(
      error,
      response,
      "Failed to get latest manifest",
    );
  }
  return data.currentManifestId ?? null;
}

/**
 * Fetch the contentHash of a manifest from the server.
 * The hash is computed server-side (SHA-256 of canonical JSON), so comparing
 * two values returned by this function is always reliable.
 * Returns null if the manifest does not exist.
 */
export async function getManifestSdk(
  manifestId: string,
): Promise<{ contentHash: string } | null> {
  const { data, error, response } = await getManifest({
    path: { manifestId },
  });
  if (error) {
    throw toDreamboardApiError(error, response, "Failed to fetch manifest");
  }
  if (!data) return null;
  return { contentHash: data.contentHash };
}

/**
 * Returns true if the server's current manifest differs from the last push.
 *
 * Both hashes are produced by the backend (SHA-256 of canonical JSON), so
 * there is no cross-language serialisation risk.
 *
 * - `manifestId`: the server-side ID of the manifest to check.
 * - `storedContentHash`: the hash returned by the server after the last
 *   `saveManifest` call, stored in project config as `manifestContentHash`.
 *
 * Returns true (treat as changed) when no manifestId or stored hash is known.
 */
export async function isManifestDifferentFromServer(
  manifestId: string | null | undefined,
  storedContentHash: string | null | undefined,
): Promise<boolean> {
  if (!manifestId || !storedContentHash) return true;
  const server = await getManifestSdk(manifestId);
  if (!server) return true;
  return storedContentHash !== server.contentHash;
}
