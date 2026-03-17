import { gzipSync } from "node:zlib";
import {
  createSourceRevision,
  createSourceRevisionBundle,
  type CreateSourceRevisionRequest,
  queueCompiledResultJob,
  type QueueCompiledResultJobResponse,
  type SourceRevision,
} from "@dreamboard/api-client";
import { planSourceRevisionTransport } from "@dreamboard/api-client/source-revisions";
import { formatApiError } from "../../utils/errors.js";

export async function createSourceRevisionSdk(
  gameId: string,
  request: CreateSourceRevisionRequest,
): Promise<SourceRevision> {
  const transport = planSourceRevisionTransport(request);
  const response = transport.useBundle
    ? await createSourceRevisionBundle({
        path: { gameId },
        body: new Blob([gzipSync(transport.serializedJson)], {
          type: "application/gzip",
        }),
      })
    : await createSourceRevision({
        path: { gameId },
        body: transport.request,
      });

  if (response.error || !response.data) {
    throw new Error(
      formatApiError(
        response.error,
        response.response,
        "Failed to create source revision",
      ),
    );
  }

  return response.data;
}

export async function queueCompiledResultJobSdk(options: {
  gameId: string;
  authoringStateId: string;
}): Promise<QueueCompiledResultJobResponse> {
  const { gameId, authoringStateId } = options;
  const { data, error, response } = await queueCompiledResultJob({
    path: { gameId },
    body: {
      authoringStateId,
    },
  });

  if (error || !data) {
    throw new Error(
      formatApiError(error, response, "Failed to create compile job"),
    );
  }

  return data;
}
