import { defineCommand } from "citty";
import consola from "consola";
import { type SourceChangeMode } from "@dreamboard/api-client";
import {
  mapUpsertBlobContentsByContentHash,
  materializeSourceChangeOperations,
  type SourceContentChangeOperation,
} from "@dreamboard/api-client/source-revisions";
import { CONFIG_FLAG_ARGS } from "../command-args.js";
import { MANIFEST_FILE, RULE_FILE } from "../constants.js";
import { resolveProjectContext } from "../config/resolve.js";
import { updateProjectState } from "../config/project-config.js";
import { parseSyncCommandArgs } from "../flags.js";
import {
  collectLocalFiles,
  getLocalDiff,
  isAllowedGamePath,
  loadManifest,
  loadRule,
  writeSnapshot,
} from "../services/project/local-files.js";
import {
  assertCliStaticScaffoldComplete,
  scaffoldStaticWorkspace,
} from "../services/project/static-scaffold.js";
import {
  createAuthoringStateSdk,
  createSourceRevisionSdk,
  getAuthoringHeadSdk,
  getLatestManifestIdSdk,
  getLatestRuleIdSdk,
  isManifestDifferentFromServer,
  saveManifestSdk,
  saveRuleSdk,
  uploadSourceBlobsSdk,
} from "../services/api/index.js";
import { getProblemContextValue, isProblemType } from "../utils/errors.js";
import { CLI_PROBLEM_TYPES } from "../utils/problem-types.js";
import {
  clearProjectPendingAuthoringSync,
  finalizeProjectPendingAuthoringSync,
  getProjectAuthoringState,
  getProjectLocalMaintainerRegistry,
  getProjectPendingAuthoringSync,
  setProjectPendingAuthoringSync,
  updateProjectAuthoringState,
  updateProjectLocalMaintainerRegistry,
} from "../services/project/project-state.js";
import type { ProjectConfig, ProjectPendingAuthoringSync } from "../types.js";
import { isDynamicGeneratedPath } from "../services/project/scaffold-ownership.js";
import { applyWorkspaceCodegen } from "../services/project/workspace-codegen.js";
import {
  didLocalMaintainerSnapshotChange,
  ensureLocalMaintainerSnapshot,
} from "../services/project/local-maintainer-registry.js";
import { reconcileWorkspaceDependencies } from "../services/project/workspace-dependencies.js";

function isSourceRevisionPath(filePath: string): boolean {
  return (
    filePath !== RULE_FILE &&
    isAllowedGamePath(filePath) &&
    !isDynamicGeneratedPath(filePath)
  );
}

function shouldAlwaysUpsertSourcePath(filePath: string): boolean {
  return filePath === ".npmrc";
}

function buildSourceChanges(options: {
  mode: SourceChangeMode;
  localFiles: Record<string, string>;
  diff: { modified: string[]; added: string[]; deleted: string[] };
}): SourceContentChangeOperation[] {
  const { mode, localFiles, diff } = options;

  if (mode === "replace") {
    return Object.entries(localFiles)
      .filter(
        ([filePath]) =>
          isSourceRevisionPath(filePath) ||
          shouldAlwaysUpsertSourcePath(filePath),
      )
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([path, content]) => ({
        kind: "upsert",
        path,
        content,
      }));
  }

  const changesByPath = new Map<string, SourceContentChangeOperation>();

  for (const filePath of [...diff.modified, ...diff.added]
    .filter(isSourceRevisionPath)
    .sort()) {
    const content = localFiles[filePath];
    if (content !== undefined) {
      changesByPath.set(filePath, { kind: "upsert", path: filePath, content });
    }
  }

  for (const filePath of diff.deleted.filter(isSourceRevisionPath).sort()) {
    changesByPath.set(filePath, { kind: "delete", path: filePath });
  }

  for (const [filePath, content] of Object.entries(localFiles)
    .filter(([filePath]) => shouldAlwaysUpsertSourcePath(filePath))
    .sort(([left], [right]) => left.localeCompare(right))) {
    changesByPath.set(filePath, {
      kind: "upsert",
      path: filePath,
      content,
    });
  }

  return Array.from(changesByPath.values()).sort((left, right) =>
    left.path.localeCompare(right.path),
  );
}

function isFirstSyncSourceRevisionConflict(error: unknown): boolean {
  return (
    isProblemType(error, CLI_PROBLEM_TYPES.SOURCE_REVISION_DRIFT) &&
    !getProblemContextValue(error, "receivedBaseSourceRevisionId")
  );
}

function formatFirstSyncSourceRevisionConflict(
  gameId: string,
  error: unknown,
): string {
  const expectedHead = getProblemContextValue(
    error,
    "expectedHeadSourceRevisionId",
  );
  const remoteHeadDescription = expectedHead
    ? `remote source revision ${expectedHead}`
    : "a remote source revision";

  return [
    `First sync could not be completed because the server already has ${remoteHeadDescription} for this game, but this workspace has no authored base yet.`,
    "This usually means a previous sync uploaded source files but did not finish creating the authored head.",
    "If `dreamboard pull --force` in a clean workspace finds a remote authored state, use that to recover.",
    "If `dreamboard pull` reports that the remote has no authored state, this game needs backend repair before `dreamboard sync` can continue.",
    `Game ID: ${gameId}.`,
  ].join(" ");
}

function isMissingSourceRevisionDuringSync(
  error: unknown,
  sourceRevisionId: string,
): boolean {
  return (
    isProblemType(error, CLI_PROBLEM_TYPES.SOURCE_REVISION_NOT_FOUND) &&
    getProblemContextValue(error, "sourceRevisionId") === sourceRevisionId
  );
}

function formatMissingSourceRevisionDuringSync(options: {
  gameId: string;
  sourceRevisionId: string;
}): string {
  return [
    `Sync could not finish because the backend no longer has source revision ${options.sourceRevisionId} for game ${options.gameId}.`,
    "This usually means a previous sync uploaded source files but never finished creating the authored head.",
    "Run `dreamboard sync --force` to recreate the remote source revision from your current local files.",
    "If that still fails and `dreamboard pull --force` in a clean workspace cannot find a remote authored state, this game needs backend repair before sync can continue.",
  ].join(" ");
}

async function persistProjectConfig(options: {
  projectRoot: string;
  projectConfig: ProjectConfig;
}): Promise<ProjectConfig> {
  await updateProjectState(options.projectRoot, options.projectConfig);
  return options.projectConfig;
}

async function persistPendingSyncCheckpoint(options: {
  projectRoot: string;
  projectConfig: ProjectConfig;
  pendingSync: ProjectPendingAuthoringSync;
}): Promise<ProjectConfig> {
  return persistProjectConfig({
    projectRoot: options.projectRoot,
    projectConfig: setProjectPendingAuthoringSync(
      options.projectConfig,
      options.pendingSync,
    ),
  });
}

async function persistFinalizedAuthoringState(options: {
  projectRoot: string;
  projectConfig: ProjectConfig;
}): Promise<ProjectConfig> {
  return persistProjectConfig({
    projectRoot: options.projectRoot,
    projectConfig: finalizeProjectPendingAuthoringSync(options.projectConfig),
  });
}

async function clearPendingSyncCheckpoint(options: {
  projectRoot: string;
  projectConfig: ProjectConfig;
}): Promise<ProjectConfig> {
  return persistProjectConfig({
    projectRoot: options.projectRoot,
    projectConfig: clearProjectPendingAuthoringSync(options.projectConfig),
  });
}

function doesRemoteHeadMatchPendingSync(
  remoteHead: {
    authoringStateId?: string;
    sourceRevisionId?: string;
    sourceTreeHash?: string;
    manifestId?: string;
    manifestContentHash?: string;
    ruleId?: string;
  } | null,
  pendingSync: ProjectPendingAuthoringSync,
): boolean {
  return (
    remoteHead?.sourceRevisionId === pendingSync.sourceRevisionId &&
    remoteHead.sourceTreeHash === pendingSync.sourceTreeHash &&
    remoteHead.manifestId === pendingSync.manifestId &&
    remoteHead.manifestContentHash === pendingSync.manifestContentHash &&
    remoteHead.ruleId === pendingSync.ruleId
  );
}

function formatPendingSyncConflict(options: {
  remoteHeadId: string;
  pendingSync: ProjectPendingAuthoringSync;
}): string {
  return `Remote authored state has moved to ${options.remoteHeadId} while this workspace was still finalizing a previous sync (${options.pendingSync.phase}). Run 'dreamboard pull' before syncing local changes.`;
}

async function finalizeLocalSync(options: {
  projectRoot: string;
  projectConfig: ProjectConfig;
}): Promise<ProjectConfig> {
  const { projectRoot, projectConfig } = options;
  await scaffoldStaticWorkspace(projectRoot, "update", {
    localMaintainerRegistry: getProjectLocalMaintainerRegistry(projectConfig),
  });
  await applyWorkspaceCodegen({
    projectRoot,
    manifest: await loadManifest(projectRoot),
  });

  const finalizedProjectConfig = await persistFinalizedAuthoringState({
    projectRoot,
    projectConfig,
  });
  await writeSnapshot(projectRoot);
  return finalizedProjectConfig;
}

export default defineCommand({
  meta: {
    name: "sync",
    description:
      "Upload authored changes and advance the remote authoring head",
  },
  args: {
    force: {
      type: "boolean",
      description: "Replace the full authored source tree",
      default: false,
    },
    yes: {
      type: "boolean",
      alias: "y",
      description: "Reserved for non-interactive scaffold flows",
      default: false,
    },
    ...CONFIG_FLAG_ARGS,
  },
  async run({ args }) {
    const parsedArgs = parseSyncCommandArgs(args);
    const { projectRoot, projectConfig, config } =
      await resolveProjectContext(parsedArgs);
    let nextProjectConfig = projectConfig;
    const localMaintainerRegistry = await ensureLocalMaintainerSnapshot(
      config.apiBaseUrl,
    );
    const localMaintainerSnapshotChanged = didLocalMaintainerSnapshotChange(
      getProjectLocalMaintainerRegistry(projectConfig),
      localMaintainerRegistry,
    );
    if (localMaintainerRegistry) {
      nextProjectConfig = updateProjectLocalMaintainerRegistry(
        nextProjectConfig,
        localMaintainerRegistry,
      );
    }

    await scaffoldStaticWorkspace(projectRoot, "update", {
      localMaintainerRegistry,
    });
    await applyWorkspaceCodegen({
      projectRoot,
      manifest: await loadManifest(projectRoot),
    });
    const dependencyState = await reconcileWorkspaceDependencies(projectRoot);
    if (
      dependencyState.packageManagerNormalized ||
      dependencyState.lockfileGenerated ||
      dependencyState.installed ||
      localMaintainerSnapshotChanged
    ) {
      consola.info("Workspace dependencies reconciled.");
    }

    const localDiff = await getLocalDiff(projectRoot);
    await assertCliStaticScaffoldComplete(projectRoot, localDiff.deleted);

    const localAuthoring = getProjectAuthoringState(nextProjectConfig);
    let pendingSync = getProjectPendingAuthoringSync(nextProjectConfig);
    const remoteHead = await getAuthoringHeadSdk(nextProjectConfig.gameId);
    const remoteHeadId = remoteHead?.authoringStateId;
    const localHeadId = localAuthoring.authoringStateId;

    if (pendingSync) {
      if (
        parsedArgs.force &&
        pendingSync.phase === "source_revision_created" &&
        (!remoteHeadId || remoteHeadId === localHeadId)
      ) {
        nextProjectConfig = await clearPendingSyncCheckpoint({
          projectRoot,
          projectConfig: nextProjectConfig,
        });
        pendingSync = undefined;
      }
    }

    if (pendingSync) {
      if (pendingSync.phase === "source_revision_created") {
        if (
          !pendingSync.manifestId ||
          !pendingSync.manifestContentHash ||
          !pendingSync.ruleId
        ) {
          throw new Error(
            "Previous sync checkpoint is incomplete. Run 'dreamboard pull --force' into a clean workspace or ask for backend help.",
          );
        }
        if (remoteHeadId) {
          if (!doesRemoteHeadMatchPendingSync(remoteHead, pendingSync)) {
            throw new Error(
              formatPendingSyncConflict({
                remoteHeadId,
                pendingSync,
              }),
            );
          }

          pendingSync = {
            ...pendingSync,
            phase: "authoring_state_created",
            authoringStateId: remoteHead.authoringStateId,
          };
          nextProjectConfig = await persistPendingSyncCheckpoint({
            projectRoot,
            projectConfig: nextProjectConfig,
            pendingSync,
          });
        } else {
          let resumedAuthoringState;
          try {
            resumedAuthoringState = await createAuthoringStateSdk(
              nextProjectConfig.gameId,
              {
                sourceRevisionId: pendingSync.sourceRevisionId,
                sourceTreeHash: pendingSync.sourceTreeHash,
                manifestId: pendingSync.manifestId,
                manifestContentHash: pendingSync.manifestContentHash,
                ruleId: pendingSync.ruleId,
              },
            );
          } catch (error) {
            if (
              isMissingSourceRevisionDuringSync(
                error,
                pendingSync.sourceRevisionId,
              )
            ) {
              throw new Error(
                formatMissingSourceRevisionDuringSync({
                  gameId: nextProjectConfig.gameId,
                  sourceRevisionId: pendingSync.sourceRevisionId,
                }),
              );
            }
            throw error;
          }
          pendingSync = {
            ...pendingSync,
            phase: "authoring_state_created",
            authoringStateId: resumedAuthoringState.authoringStateId,
          };
          nextProjectConfig = await persistPendingSyncCheckpoint({
            projectRoot,
            projectConfig: nextProjectConfig,
            pendingSync,
          });
        }
      } else if (!remoteHeadId) {
        throw new Error(
          "Previous sync created a remote authored checkpoint, but the remote authored head is no longer available. Run 'dreamboard pull --force' into a clean workspace or ask for backend help.",
        );
      } else if (remoteHeadId !== pendingSync.authoringStateId) {
        throw new Error(
          formatPendingSyncConflict({
            remoteHeadId,
            pendingSync,
          }),
        );
      }

      if (
        !pendingSync.authoringStateId ||
        !pendingSync.manifestId ||
        !pendingSync.ruleId
      ) {
        throw new Error(
          "Previous sync checkpoint is incomplete. Run 'dreamboard pull --force' into a clean workspace or ask for backend help.",
        );
      }

      nextProjectConfig = await finalizeLocalSync({
        projectRoot,
        projectConfig: nextProjectConfig,
      });

      consola.success(
        `Synced authored state ${pendingSync.authoringStateId}. Run 'dreamboard compile' when you're ready.`,
      );
      return;
    }

    if (remoteHeadId && localHeadId && remoteHeadId !== localHeadId) {
      throw new Error(
        `Remote authored state has moved to ${remoteHeadId}. Run 'dreamboard pull' before syncing local changes.`,
      );
    }

    if (remoteHeadId && !localHeadId) {
      throw new Error(
        `This workspace has no authored base but the remote head is ${remoteHeadId}. Re-clone or run 'dreamboard pull --force' into a clean workspace.`,
      );
    }

    const hasChanges =
      localDiff.modified.length > 0 ||
      localDiff.added.length > 0 ||
      localDiff.deleted.length > 0;
    if (
      !hasChanges &&
      !parsedArgs.force &&
      localHeadId != null &&
      remoteHeadId === localHeadId &&
      !pendingSync
    ) {
      consola.info("No local authored changes to sync.");
      return;
    }

    const ruleChanged =
      localDiff.modified.includes(RULE_FILE) ||
      localDiff.added.includes(RULE_FILE);
    const manifestChanged =
      localDiff.modified.includes(MANIFEST_FILE) ||
      localDiff.added.includes(MANIFEST_FILE);

    let ruleId = localAuthoring.ruleId ?? remoteHead?.ruleId ?? undefined;
    let manifestId =
      localAuthoring.manifestId ?? remoteHead?.manifestId ?? undefined;
    let manifestContentHash =
      localAuthoring.manifestContentHash ??
      remoteHead?.manifestContentHash ??
      undefined;
    let sourceRevisionId =
      remoteHead?.sourceRevisionId ?? localAuthoring.sourceRevisionId;
    let sourceTreeHash =
      remoteHead?.sourceTreeHash ?? localAuthoring.sourceTreeHash;

    if (ruleChanged) {
      ruleId = (
        await saveRuleSdk(projectConfig.gameId, await loadRule(projectRoot))
      ).ruleId;
    }

    const manifestNeedsSave =
      manifestChanged ||
      !manifestId ||
      (await isManifestDifferentFromServer(manifestId, manifestContentHash));
    if (manifestNeedsSave) {
      const manifest = await loadManifest(projectRoot);
      if (!ruleId) {
        ruleId = await getLatestRuleIdSdk(projectConfig.gameId);
      }
      const saved = await saveManifestSdk(
        projectConfig.gameId,
        manifest,
        ruleId,
      );
      manifestId = saved.manifestId;
      manifestContentHash = saved.contentHash;
    }

    const localFiles = await collectLocalFiles(projectRoot);
    const mode: SourceChangeMode =
      parsedArgs.force || !sourceRevisionId ? "replace" : "incremental";
    const sourceChanges = buildSourceChanges({
      mode,
      localFiles,
      diff: localDiff,
    });
    if (sourceChanges.length > 0 || !sourceRevisionId) {
      const { changes } =
        await materializeSourceChangeOperations(sourceChanges);
      const uploadBlobs = mapUpsertBlobContentsByContentHash(
        sourceChanges,
        changes,
      );

      await uploadSourceBlobsSdk(
        projectConfig.gameId,
        Array.from(uploadBlobs.values()),
      );
      let sourceRevision;
      try {
        sourceRevision = await createSourceRevisionSdk(
          nextProjectConfig.gameId,
          {
            ...(sourceRevisionId
              ? { baseSourceRevisionId: sourceRevisionId }
              : {}),
            mode,
            changes,
          },
        );
      } catch (error) {
        if (
          !remoteHeadId &&
          !localHeadId &&
          !sourceRevisionId &&
          isFirstSyncSourceRevisionConflict(error)
        ) {
          throw new Error(
            formatFirstSyncSourceRevisionConflict(projectConfig.gameId, error),
          );
        }
        throw error;
      }
      sourceRevisionId = sourceRevision.id;
      sourceTreeHash = sourceRevision.treeHash;
      nextProjectConfig = await persistPendingSyncCheckpoint({
        projectRoot,
        projectConfig: nextProjectConfig,
        pendingSync: {
          phase: "source_revision_created",
          sourceRevisionId,
          sourceTreeHash,
          manifestId,
          manifestContentHash,
          ruleId,
        },
      });
    }

    if (!ruleId) {
      ruleId = await getLatestRuleIdSdk(projectConfig.gameId);
    }
    if (!manifestId) {
      manifestId =
        (await getLatestManifestIdSdk(projectConfig.gameId, ruleId)) ??
        undefined;
    }
    if (
      !manifestId ||
      !manifestContentHash ||
      !sourceRevisionId ||
      !sourceTreeHash
    ) {
      throw new Error("Sync could not resolve a complete authored state.");
    }

    let authoringState;
    try {
      authoringState = await createAuthoringStateSdk(nextProjectConfig.gameId, {
        ...(remoteHeadId ? { baseAuthoringStateId: remoteHeadId } : {}),
        sourceRevisionId,
        sourceTreeHash,
        manifestId,
        manifestContentHash,
        ruleId,
      });
    } catch (error) {
      if (isMissingSourceRevisionDuringSync(error, sourceRevisionId)) {
        throw new Error(
          formatMissingSourceRevisionDuringSync({
            gameId: nextProjectConfig.gameId,
            sourceRevisionId,
          }),
        );
      }
      throw error;
    }
    nextProjectConfig = await persistPendingSyncCheckpoint({
      projectRoot,
      projectConfig: nextProjectConfig,
      pendingSync: {
        phase: "authoring_state_created",
        authoringStateId: authoringState.authoringStateId,
        sourceRevisionId: authoringState.sourceRevisionId,
        sourceTreeHash: authoringState.sourceTreeHash,
        manifestId: authoringState.manifestId,
        manifestContentHash: authoringState.manifestContentHash,
        ruleId: authoringState.ruleId,
      },
    });
    nextProjectConfig = await finalizeLocalSync({
      projectRoot,
      projectConfig: nextProjectConfig,
    });

    consola.success(
      `Synced authored state ${authoringState.authoringStateId}. Run 'dreamboard compile' when you're ready.`,
    );
  },
});
