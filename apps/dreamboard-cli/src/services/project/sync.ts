import { unlink } from "node:fs/promises";
import path from "node:path";
import {
  getGameSources,
  getLatestCompiledResult,
  type BoardManifest,
} from "@dreamboard/api-client";
import { MANIFEST_FILE, RULE_FILE } from "../../constants.js";
import type { ProjectConfig, ResolvedConfig } from "../../types.js";
import { updateProjectState } from "../../config/project-config.js";
import { formatApiError } from "../../utils/errors.js";
import { exists, writeTextFile } from "../../utils/fs.js";
import {
  collectLocalFiles,
  removeExtraneousFiles,
  writeManifest,
  writeRule,
  writeSnapshot,
  writeSourceFiles,
} from "./local-files.js";
import { isAllowedGamePath, isLibraryPath } from "./scaffold-ownership.js";

const META_FILES = new Set([MANIFEST_FILE, RULE_FILE]);

export type RemoteProjectSources = {
  resultId: string;
  files: Record<string, string>;
  sourceKey?: string;
  manifestId?: string;
  manifest?: BoardManifest;
  ruleId?: string;
  ruleText?: string;
};

export type RemoteReconcileResult = {
  latest: RemoteProjectSources;
  remoteUserFiles: Record<string, string>;
  serverUserFiles: string[];
  written: string[];
  deleted: string[];
  conflicts: string[];
};

function normalizeRemoteFiles(
  response:
    | {
        files?: Record<string, string>;
        sourceFiles?: Record<string, string>;
      }
    | undefined,
): Record<string, string> {
  return response?.files ?? response?.sourceFiles ?? {};
}

function manifestToText(manifest: BoardManifest | undefined): string | null {
  if (!manifest) return null;
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function isMergeablePath(filePath: string): boolean {
  if (META_FILES.has(filePath)) return true;
  return isAllowedGamePath(filePath) && !isLibraryPath(filePath);
}

function isMergeableUserPath(filePath: string): boolean {
  return (
    !META_FILES.has(filePath) &&
    isAllowedGamePath(filePath) &&
    !isLibraryPath(filePath)
  );
}

function listServerUserFiles(files: Record<string, string>): string[] {
  return Object.keys(files)
    .filter(
      (filePath) => isAllowedGamePath(filePath) && !META_FILES.has(filePath),
    )
    .sort();
}

function buildMergeableRemoteFiles(
  sources: RemoteProjectSources,
): Record<string, string> {
  const files: Record<string, string> = {};

  for (const [filePath, content] of Object.entries(sources.files)) {
    if (isMergeablePath(filePath)) {
      files[filePath] = content;
    }
  }

  const manifestText = manifestToText(sources.manifest);
  if (manifestText !== null) {
    files[MANIFEST_FILE] = manifestText;
  }

  if (typeof sources.ruleText === "string") {
    files[RULE_FILE] = sources.ruleText;
  }

  return files;
}

function formatConflictSection(content: string | null): string {
  if (content === null) return "";
  return content.endsWith("\n") ? content : `${content}\n`;
}

function buildConflictContent(
  localContent: string | null,
  remoteContent: string | null,
): string {
  return [
    "<<<<<<< LOCAL",
    formatConflictSection(localContent),
    "=======",
    formatConflictSection(remoteContent),
    ">>>>>>> REMOTE",
    "",
  ].join("\n");
}

function mergeFileContent(options: {
  baseContent: string | null;
  localContent: string | null;
  remoteContent: string | null;
}): { content: string | null; conflicted: boolean } {
  const { baseContent, localContent, remoteContent } = options;

  if (localContent === remoteContent) {
    return { content: localContent, conflicted: false };
  }

  if (baseContent === localContent) {
    return { content: remoteContent, conflicted: false };
  }

  if (baseContent === remoteContent) {
    return { content: localContent, conflicted: false };
  }

  if (baseContent === null) {
    if (localContent === null) {
      return { content: remoteContent, conflicted: false };
    }
    if (remoteContent === null) {
      return { content: localContent, conflicted: false };
    }
    return {
      content: buildConflictContent(localContent, remoteContent),
      conflicted: true,
    };
  }

  if (localContent === null) {
    if (remoteContent === null) {
      return { content: null, conflicted: false };
    }
    return {
      content: buildConflictContent(null, remoteContent),
      conflicted: true,
    };
  }

  if (remoteContent === null) {
    return {
      content: buildConflictContent(localContent, null),
      conflicted: true,
    };
  }

  return {
    content: buildConflictContent(localContent, remoteContent),
    conflicted: true,
  };
}

async function fetchRemoteSources(
  gameId: string,
  resultId: string,
): Promise<RemoteProjectSources> {
  const {
    data: sources,
    error: sourcesError,
    response: sourcesResponse,
  } = await getGameSources({
    path: { gameId },
    query: { resultId },
  });

  if (sourcesError || !sources) {
    throw new Error(
      formatApiError(sourcesError, sourcesResponse, "Failed to get sources"),
    );
  }

  return {
    resultId,
    files: normalizeRemoteFiles(sources),
    sourceKey: sources.sourceKey,
    manifestId: sources.manifestId,
    manifest: sources.manifest,
    ruleId: sources.ruleId,
    ruleText: sources.ruleText,
  };
}

export async function fetchLatestRemoteSources(
  gameId: string,
): Promise<RemoteProjectSources | null> {
  const { data: latest } = await getLatestCompiledResult({
    path: { gameId },
  });

  if (!latest?.id) {
    return null;
  }

  return fetchRemoteSources(gameId, latest.id);
}

export async function pullIntoDirectory(
  config: ResolvedConfig,
  targetDir: string,
  projectConfig: ProjectConfig,
): Promise<void> {
  void config;

  const latest = await fetchLatestRemoteSources(projectConfig.gameId);
  if (!latest) {
    throw new Error("No compiled results found for this game.");
  }

  await writeSourceFiles(targetDir, latest.files);
  await removeExtraneousFiles(targetDir, new Set(Object.keys(latest.files)));

  if (latest.manifest) {
    await writeManifest(targetDir, latest.manifest);
  }

  if (latest.ruleText) {
    await writeRule(targetDir, latest.ruleText);
  }

  await updateProjectState(targetDir, {
    ...projectConfig,
    resultId: latest.resultId,
    remoteBaseResultId: latest.resultId,
    manifestId: latest.manifestId ?? projectConfig.manifestId,
    ruleId: latest.ruleId ?? projectConfig.ruleId,
    sourceKey: latest.sourceKey ?? projectConfig.sourceKey,
    serverUserFiles: listServerUserFiles(latest.files),
  });

  await writeSnapshot(targetDir);
}

export async function reconcileRemoteChangesIntoWorkspace(options: {
  projectRoot: string;
  projectConfig: ProjectConfig;
  baseResultId: string;
  latestResultId: string;
}): Promise<RemoteReconcileResult> {
  const { projectRoot, projectConfig, baseResultId, latestResultId } = options;
  const [base, latest, localFiles] = await Promise.all([
    fetchRemoteSources(projectConfig.gameId, baseResultId),
    fetchRemoteSources(projectConfig.gameId, latestResultId),
    collectLocalFiles(projectRoot),
  ]);

  const baseFiles = buildMergeableRemoteFiles(base);
  const latestFiles = buildMergeableRemoteFiles(latest);
  const localMergeableFiles = Object.fromEntries(
    Object.entries(localFiles).filter(([filePath]) =>
      isMergeablePath(filePath),
    ),
  );

  const candidatePaths = new Set<string>([
    ...Object.keys(baseFiles),
    ...Object.keys(latestFiles),
    ...Object.keys(localMergeableFiles),
  ]);

  const written: string[] = [];
  const deleted: string[] = [];
  const conflicts: string[] = [];

  for (const filePath of [...candidatePaths].sort()) {
    const mergeResult = mergeFileContent({
      baseContent: baseFiles[filePath] ?? null,
      localContent: localMergeableFiles[filePath] ?? null,
      remoteContent: latestFiles[filePath] ?? null,
    });

    const absolutePath = path.join(projectRoot, filePath);
    if (mergeResult.content === null) {
      if (await exists(absolutePath)) {
        await unlink(absolutePath);
        deleted.push(filePath);
      }
      continue;
    }

    await writeTextFile(absolutePath, mergeResult.content);
    written.push(filePath);

    if (mergeResult.conflicted) {
      conflicts.push(filePath);
    }
  }

  return {
    latest,
    remoteUserFiles: Object.fromEntries(
      Object.entries(latest.files).filter(([filePath]) =>
        isMergeableUserPath(filePath),
      ),
    ),
    serverUserFiles: listServerUserFiles(latest.files),
    written,
    deleted,
    conflicts,
  };
}

export function buildRemoteAlignedSnapshotFiles(options: {
  localFiles: Record<string, string>;
  remoteUserFiles: Record<string, string>;
}): Record<string, string> {
  return {
    ...options.localFiles,
    ...options.remoteUserFiles,
  };
}
