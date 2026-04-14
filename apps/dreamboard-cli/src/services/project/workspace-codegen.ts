import type { GameTopologyManifest } from "@dreamboard/sdk-types";
import {
  generateAuthoritativeFiles,
  generateSeedFiles,
  isFrameworkOwnedSetupProfilesSeed,
} from "@dreamboard/workspace-codegen";
import { readTextFileIfExists, writeTextFile } from "../../utils/fs.js";

export interface WorkspaceCodegenWriteResult {
  written: string[];
  skipped: string[];
  merged: string[];
}

export async function applyWorkspaceCodegen(options: {
  projectRoot: string;
  manifest: GameTopologyManifest;
}): Promise<WorkspaceCodegenWriteResult> {
  const { projectRoot, manifest } = options;
  const authoritativeFiles = generateAuthoritativeFiles(manifest);
  const seedFiles = generateSeedFiles(manifest);

  const written: string[] = [];
  const skipped: string[] = [];
  const merged: string[] = [];

  for (const [relativePath, content] of Object.entries(authoritativeFiles)) {
    const filePath = `${projectRoot}/${relativePath}`;
    const existingContent = await readTextFileIfExists(filePath);
    await writeTextFile(filePath, content);
    if (existingContent !== content) {
      written.push(relativePath);
    }
  }

  for (const [relativePath, content] of Object.entries(seedFiles)) {
    const filePath = `${projectRoot}/${relativePath}`;
    const existingContent = await readTextFileIfExists(filePath);
    const shouldRefreshFrameworkSeed =
      relativePath === "app/setup-profiles.ts" &&
      isFrameworkOwnedSetupProfilesSeed(existingContent);

    if (shouldRefreshFrameworkSeed) {
      await writeTextFile(filePath, content);
      if (existingContent !== content) {
        written.push(relativePath);
      }
      continue;
    }

    const hasExistingContent =
      existingContent !== null && existingContent.trim().length > 0;
    if (hasExistingContent) {
      skipped.push(relativePath);
      continue;
    }

    await writeTextFile(filePath, content);
    written.push(relativePath);
  }

  written.sort();
  skipped.sort();
  merged.sort();
  return { written, skipped, merged };
}
