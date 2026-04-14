import {
  createAuthoringState,
  getAuthoringHead,
  type AuthoringState,
  type CreateAuthoringStateRequest,
} from "@dreamboard/api-client";
import { toApiProblem, toDreamboardApiError } from "../../utils/errors.js";
import { CLI_PROBLEM_TYPES } from "../../utils/problem-types.js";

export async function getAuthoringHeadSdk(
  gameId: string,
): Promise<AuthoringState | null> {
  const { data, error, response } = await getAuthoringHead({
    path: { gameId },
  });
  if (
    error &&
    toApiProblem(error, response, "Failed to fetch authoring head").type ===
      CLI_PROBLEM_TYPES.RESOURCE_NOT_FOUND
  ) {
    return null;
  }
  if (error || !data) {
    throw toDreamboardApiError(
      error,
      response,
      "Failed to fetch authoring head",
    );
  }
  return data;
}

export async function createAuthoringStateSdk(
  gameId: string,
  request: CreateAuthoringStateRequest,
): Promise<AuthoringState> {
  const { data, error, response } = await createAuthoringState({
    path: { gameId },
    body: request,
  });
  if (error || !data) {
    throw toDreamboardApiError(
      error,
      response,
      "Failed to create authoring state",
    );
  }
  return data;
}
