import { getGameBySlug, type Game } from "@dreamboard/api-client";
import { toApiProblem, toDreamboardApiError } from "../../utils/errors.js";
import { CLI_PROBLEM_TYPES } from "../../utils/problem-types.js";

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
    const problem = toApiProblem(
      error,
      response,
      `Failed to look up game by slug '${slug}'`,
    );
    if (problem.type === CLI_PROBLEM_TYPES.RESOURCE_NOT_FOUND) {
      return null;
    }
    throw toDreamboardApiError(
      error,
      response,
      `Failed to look up game by slug '${slug}'`,
    );
  }
  return data ?? null;
}
