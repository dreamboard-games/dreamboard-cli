import { gzipSync } from "node:zlib";
import {
  createCompiledResult,
  createSourceRevision,
  createSourceRevisionBundle,
  type CreateSourceRevisionRequest,
  type CreateCompiledResultResponse,
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

export async function createCompiledResultSdk(options: {
  gameId: string;
  sourceRevisionId: string;
  manifestId: string;
  ruleId: string;
}): Promise<CreateCompiledResultResponse> {
  const { gameId, sourceRevisionId, manifestId, ruleId } = options;
  const { data, error, response } = await createCompiledResult({
    path: { gameId },
    body: {
      sourceRevisionId,
      manifestId,
      ruleId,
    },
  });

  if (error || !data) {
    throw new Error(
      formatApiError(error, response, "Failed to create compile job"),
    );
  }

  return data;
}
