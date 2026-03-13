import { getGameBySlug, type Game } from "@dreamboard/api-client";
import { formatApiError } from "../../utils/errors.js";

/**
 * Look up a game by slug, returning null only for genuine 404s.
 * Other errors (auth, network, 5xx) are thrown so callers don't
 * silently proceed as if the game doesn't exist.
 */
export async function tryGetGameBySlug(
  slug: string,
  opts?: { includeDeleted?: boolean },
): Promise<Game | null> {
  const { data, error, response } = await getGameBySlug({
    path: { slug },
    query: { includeDeleted: opts?.includeDeleted },
  });
  if (error) {
    if (response?.status === 404) {
      return null;
    }
    throw new Error(
      formatApiError(
        error,
        response,
        `Failed to look up game by slug '${slug}'`,
      ),
    );
  }
  return data ?? null;
}
