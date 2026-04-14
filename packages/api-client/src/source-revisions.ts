import { createSourceBlobUploadSession } from "./sdk.gen.js";
import type {
  SourceBlobUploadDescriptor,
  SourceBlobUploadTarget,
  SourceChangeOperation,
} from "./types.gen.js";

export type SourceContentChangeOperation =
  | {
      kind: "upsert";
      path: string;
      content: string;
    }
  | {
      kind: "delete";
      path: string;
    };

const textEncoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const normalizedBytes = new Uint8Array(bytes.byteLength);
  normalizedBytes.set(bytes);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    normalizedBytes.buffer,
  );
  return bytesToHex(new Uint8Array(digest));
}

function getUtf8ByteSize(content: string): number {
  return textEncoder.encode(content).byteLength;
}

async function computeSourceContentHash(content: string): Promise<string> {
  return sha256Hex(textEncoder.encode(content));
}

async function describeSourceBlob(
  content: string,
): Promise<SourceBlobUploadDescriptor> {
  return {
    contentHash: await computeSourceContentHash(content),
    byteSize: getUtf8ByteSize(content),
  };
}

export async function materializeSourceChangeOperations(
  changes: Iterable<SourceContentChangeOperation>,
): Promise<{
  blobs: SourceBlobUploadDescriptor[];
  changes: SourceChangeOperation[];
}> {
  const blobsByHash = new Map<string, SourceBlobUploadDescriptor>();
  const materialized = await Promise.all(
    Array.from(changes, async (change): Promise<SourceChangeOperation> => {
      if (change.kind === "delete") {
        return change;
      }

      const blob = await describeSourceBlob(change.content);
      const existing = blobsByHash.get(blob.contentHash);
      if (!existing) {
        blobsByHash.set(blob.contentHash, blob);
      }

      return {
        kind: "upsert",
        path: change.path,
        contentHash: blob.contentHash,
        byteSize: blob.byteSize,
      };
    }),
  );

  return {
    blobs: Array.from(blobsByHash.values()).sort((left, right) =>
      left.contentHash.localeCompare(right.contentHash),
    ),
    changes: materialized,
  };
}

export type SourceBlobUploadInput = SourceBlobUploadDescriptor & {
  content: string;
};

export function mapUpsertBlobContentsByContentHash(
  localChanges: readonly SourceContentChangeOperation[],
  materializedChanges: readonly SourceChangeOperation[],
): Map<string, SourceBlobUploadInput> {
  const uploadBlobs = new Map<string, SourceBlobUploadInput>();
  const length = Math.min(localChanges.length, materializedChanges.length);
  for (let index = 0; index < length; index += 1) {
    const localChange = localChanges[index];
    const materializedChange = materializedChanges[index];
    if (
      localChange?.kind !== "upsert" ||
      materializedChange?.kind !== "upsert"
    ) {
      continue;
    }

    uploadBlobs.set(materializedChange.contentHash, {
      contentHash: materializedChange.contentHash,
      byteSize: materializedChange.byteSize,
      content: localChange.content,
    });
  }

  return uploadBlobs;
}

async function uploadSourceBlob(
  uploadTarget: SourceBlobUploadTarget,
  content: string,
): Promise<void> {
  const response = await fetch(uploadTarget.url, {
    method: uploadTarget.method,
    headers: uploadTarget.headers,
    body: textEncoder.encode(content),
  });

  if (response.ok) {
    return;
  }

  const details = await response.text().catch(() => "");
  const suffix = details.trim().length > 0 ? `: ${details.trim()}` : "";
  throw new Error(
    `Failed to upload source blob (HTTP ${response.status}${suffix})`,
  );
}

export class SourceBlobSessionRequestError extends Error {
  readonly apiError: unknown;
  readonly response: Response | undefined;

  constructor(
    message: string,
    apiError: unknown,
    response: Response | undefined,
  ) {
    super(message);
    this.name = "SourceBlobSessionRequestError";
    this.apiError = apiError;
    this.response = response;
  }
}

export async function uploadGameSourceBlobs(options: {
  gameId: string;
  blobs: SourceBlobUploadInput[];
}): Promise<void> {
  const { gameId, blobs } = options;
  const uniqueBlobs = new Map<string, SourceBlobUploadInput>();
  for (const blob of blobs) {
    const existing = uniqueBlobs.get(blob.contentHash);
    if (!existing) {
      uniqueBlobs.set(blob.contentHash, blob);
      continue;
    }

    if (existing.byteSize !== blob.byteSize) {
      throw new Error(
        `Source blob ${blob.contentHash} has conflicting byte sizes.`,
      );
    }
  }

  if (uniqueBlobs.size === 0) {
    return;
  }

  const { data, error, response } = await createSourceBlobUploadSession({
    path: { gameId },
    body: {
      blobs: Array.from(uniqueBlobs.values(), ({ contentHash, byteSize }) => ({
        contentHash,
        byteSize,
      })),
    },
  });

  if (error || !data) {
    throw new SourceBlobSessionRequestError(
      "Failed to create source blob upload session",
      error,
      response,
    );
  }

  for (const upload of data.uploads) {
    if (upload.status !== "upload_required") {
      continue;
    }

    const blob = uniqueBlobs.get(upload.contentHash);
    if (!blob) {
      throw new Error(
        `Upload session referenced unknown source blob ${upload.contentHash}.`,
      );
    }
    if (!upload.uploadTarget) {
      throw new Error(
        `Upload target missing for source blob ${upload.contentHash}.`,
      );
    }

    await uploadSourceBlob(upload.uploadTarget, blob.content);
  }
}
