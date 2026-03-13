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
 * Storage bucket for user code edits (uploaded from code editor)
 */
export const CODE_EDITS_BUCKET = "code-edits";

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
