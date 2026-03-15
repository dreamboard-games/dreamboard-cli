import type {
  CreateSourceRevisionRequest,
  SourceChangeOperation,
} from "./types.gen.js";

const BUNDLED_SOURCE_REVISION_BYTE_THRESHOLD = 256 * 1024;

export type SourceRevisionTransportPlan = {
  request: CreateSourceRevisionRequest;
  serializedJson: string;
  byteLength: number;
  upsertCount: number;
  useBundle: boolean;
};

function countUpserts(changes: SourceChangeOperation[]): number {
  return changes.filter((change) => change.kind === "upsert").length;
}

export function planSourceRevisionTransport(
  request: CreateSourceRevisionRequest,
): SourceRevisionTransportPlan {
  const serializedJson = JSON.stringify(request);
  const byteLength = new TextEncoder().encode(serializedJson).byteLength;

  return {
    request,
    serializedJson,
    byteLength,
    upsertCount: countUpserts(request.changes),
    useBundle: byteLength >= BUNDLED_SOURCE_REVISION_BYTE_THRESHOLD,
  };
}
