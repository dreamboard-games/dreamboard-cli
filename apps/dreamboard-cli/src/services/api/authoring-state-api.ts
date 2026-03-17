import {
  createAuthoringState,
  getAuthoringHead,
  type AuthoringState,
  type CreateAuthoringStateRequest,
} from "@dreamboard/api-client";
import { formatApiError } from "../../utils/errors.js";

export async function getAuthoringHeadSdk(
  gameId: string,
): Promise<AuthoringState | null> {
  const { data, error, response } = await getAuthoringHead({
    path: { gameId },
  });
  if (response?.status === 404) {
    return null;
  }
  if (error || !data) {
    throw new Error(
      formatApiError(error, response, "Failed to fetch authoring head"),
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
    throw new Error(
      formatApiError(error, response, "Failed to create authoring state"),
    );
  }
  return data;
}
