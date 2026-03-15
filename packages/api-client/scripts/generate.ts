import { cp, mkdir } from "node:fs/promises";
import path from "node:path";

const packageRoot = path.resolve(import.meta.dir, "..");

const command = Bun.spawn(["pnpm", "exec", "openapi-ts"], {
  cwd: packageRoot,
  stdout: "inherit",
  stderr: "inherit",
});

const exitCode = await command.exited;
if (exitCode !== 0) {
  process.exit(exitCode);
}

const targetDir = path.join(packageRoot, "src", "core");
await mkdir(targetDir, { recursive: true });
await cp(
  path.join(packageRoot, "serverSentEvents.ts"),
  path.join(targetDir, "serverSentEvents.gen.ts"),
  { force: true },
);

await Bun.write(
  path.join(packageRoot, "src", "storage-paths.ts"),
  `/**
 * Storage path constants shared between frontend and backend.
 * These mirror the values in the Kotlin StoragePathUtils.
 */

/**
 * Storage bucket for compiled scripts (game logic and UI bundles)
 */
export const STORAGE_BUCKET = "scripts";

/**
 * Directory name for source files
 */
export const SOURCE_DIR = "src";

/**
 * Directory name for compiled output
 */
export const DIST_DIR = "dist";
`,
);

await Bun.write(
  path.join(packageRoot, "src", "source-revisions.ts"),
  `import type {
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
`,
);
