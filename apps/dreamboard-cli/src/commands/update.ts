import path from "node:path";
import { defineCommand } from "citty";
import consola from "consola";
import { scaffoldGameSourcesV3 } from "@dreamboard/api-client";
import { CONFIG_FLAG_ARGS } from "../command-args.js";
import { MANIFEST_FILE, RULE_FILE } from "../constants.js";
import { resolveProjectContext } from "../config/resolve.js";
import { parseUpdateCommandArgs } from "../flags.js";
import { updateProjectState } from "../config/project-config.js";
import {
  collectLocalFiles,
  getLocalDiff,
  loadManifest,
  loadRule,
  writeScaffoldFiles,
  writeManifest,
  writeSnapshotFromFiles,
} from "../services/project/local-files.js";
import { ensureDir, readTextFileIfExists, writeTextFile } from "../utils/fs.js";
import {
  getLatestManifestIdSdk,
  isManifestDifferentFromServer,
  saveManifestSdk,
  saveRuleSdk,
  getLatestRuleIdSdk,
} from "../services/api/index.js";
import {
  collectModifiedStaticSdkFiles,
  scaffoldStaticWorkspace,
} from "../services/project/static-scaffold.js";
import { validateDynamicScaffoldResponse } from "../services/project/dynamic-scaffold-response.js";
import {
  buildRemoteAlignedSnapshotFiles,
  fetchLatestRemoteSources,
  reconcileRemoteChangesIntoWorkspace,
} from "../services/project/sync.js";
import { formatApiError } from "../utils/errors.js";
import { confirmPrompt } from "../utils/prompts.js";
import { mergeUiArgsContent } from "../utils/ui-args-merge.js";

const UI_ARGS_PATH = "shared/ui-args.ts";

function getManifestPhasePaths(
  manifest: Awaited<ReturnType<typeof loadManifest>>,
): Set<string> {
  return new Set(
    (manifest.stateMachine?.states ?? []).map(
      (state) => `app/phases/${state.name}.ts`,
    ),
  );
}

function findStalePhaseFiles(
  localFiles: Record<string, string>,
  expectedPhasePaths: Set<string>,
): string[] {
  return Object.keys(localFiles)
    .filter((relativePath) => relativePath.startsWith("app/phases/"))
    .filter((relativePath) => relativePath.endsWith(".ts"))
    .filter((relativePath) => !expectedPhasePaths.has(relativePath))
    .sort();
}

async function mergeUiArgsFileIfNeeded(
  projectRoot: string,
  files: Record<string, string | null>,
): Promise<void> {
  const incomingUiArgs = files[UI_ARGS_PATH];
  if (incomingUiArgs === null || incomingUiArgs === undefined) return;

  const localPath = path.join(projectRoot, UI_ARGS_PATH);
  const localUiArgs = await readTextFileIfExists(localPath);

  if (localUiArgs === null) return;
  if (localUiArgs.trim().length === 0) return;
  if (localUiArgs === incomingUiArgs) return;

  const mergeResult = mergeUiArgsContent(localUiArgs, incomingUiArgs);
  files[UI_ARGS_PATH] = mergeResult.content;

  await ensureDir(path.dirname(localPath));
  await writeTextFile(localPath, mergeResult.content);

  if (mergeResult.conflicted) {
    throw new Error(
      `Failed to update generated blocks in ${UI_ARGS_PATH}: ${mergeResult.reason ?? "unknown merge error"}`,
    );
  }

  if (mergeResult.regenerated) {
    consola.warn(
      `${UI_ARGS_PATH} did not contain generated markers. Replaced with scaffold template and preserved sections were reset.`,
    );
  }

  if (
    mergeResult.addedInterfaces.length > 0 ||
    mergeResult.addedPhases.length > 0
  ) {
    const additions: string[] = [];
    if (mergeResult.addedInterfaces.length > 0) {
      additions.push(`${mergeResult.addedInterfaces.length} interface(s)`);
    }
    if (mergeResult.addedPhases.length > 0) {
      additions.push(`${mergeResult.addedPhases.length} phase mapping(s)`);
    }
    consola.info(
      `Merged ${UI_ARGS_PATH}: added ${additions.join(" and ")} from scaffold.`,
    );
  } else {
    consola.info(`Merged ${UI_ARGS_PATH}: kept local custom definitions.`);
  }
}

export default defineCommand({
  meta: {
    name: "update",
    description: "Push manifest/rule changes and regenerate scaffolded files",
  },
  args: {
    "update-sdk": {
      type: "boolean",
      description: "Update SDK",
      default: false,
    },
    yes: {
      type: "boolean",
      alias: "y",
      description:
        "Non-interactive confirmation: allow overwriting locally modified SDK files",
      default: false,
    },
    pull: {
      type: "boolean",
      description:
        "Reconcile remote changes into this workspace before continuing",
      default: false,
    },
    ...CONFIG_FLAG_ARGS,
  },
  async run({ args }) {
    const parsedArgs = parseUpdateCommandArgs(args);
    const { projectRoot, projectConfig } =
      await resolveProjectContext(parsedArgs);
    let currentProjectConfig = projectConfig;
    let remoteSnapshotUserFiles: Record<string, string> | null = null;

    const localBaseResultId =
      currentProjectConfig.remoteBaseResultId ?? currentProjectConfig.resultId;
    const latestRemote = await fetchLatestRemoteSources(
      currentProjectConfig.gameId,
    );

    if (latestRemote?.resultId) {
      const remoteDrift =
        !localBaseResultId || latestRemote.resultId !== localBaseResultId;

      if (remoteDrift && !parsedArgs.pull) {
        if (!localBaseResultId) {
          throw new Error(
            `Remote base is unknown. Latest remote result=${latestRemote.resultId}. Run 'dreamboard update --pull' to reconcile this workspace before continuing.`,
          );
        }

        throw new Error(
          `Remote drift detected. Local base=${localBaseResultId}, remote latest=${latestRemote.resultId}. Run 'dreamboard update --pull' to reconcile remote changes into this workspace before continuing.`,
        );
      }

      if (remoteDrift && parsedArgs.pull) {
        if (!localBaseResultId) {
          throw new Error(
            `Remote base is unknown. Latest remote result=${latestRemote.resultId}. Re-clone the project or seed a known base result before running 'dreamboard update --pull'.`,
          );
        }

        const reconcileResult = await reconcileRemoteChangesIntoWorkspace({
          projectRoot,
          projectConfig: currentProjectConfig,
          baseResultId: localBaseResultId,
          latestResultId: latestRemote.resultId,
        });

        if (reconcileResult.written.length > 0) {
          consola.info(
            `Pulled remote changes into ${reconcileResult.written.length} file(s).`,
          );
        }
        if (reconcileResult.deleted.length > 0) {
          consola.info(
            `Applied ${reconcileResult.deleted.length} remote deletion(s).`,
          );
        }
        if (reconcileResult.conflicts.length > 0) {
          for (const filePath of reconcileResult.conflicts) {
            consola.error(`Conflict: ${filePath}`);
          }
          throw new Error(
            `Remote reconciliation wrote conflict markers to ${reconcileResult.conflicts.length} file(s). Resolve them and rerun 'dreamboard update'.`,
          );
        }

        currentProjectConfig = {
          ...currentProjectConfig,
          manifestId:
            reconcileResult.latest.manifestId ??
            currentProjectConfig.manifestId,
          manifestContentHash: undefined,
          ruleId: reconcileResult.latest.ruleId ?? currentProjectConfig.ruleId,
          sourceKey:
            reconcileResult.latest.sourceKey ?? currentProjectConfig.sourceKey,
          remoteBaseResultId: reconcileResult.latest.resultId,
          serverUserFiles: reconcileResult.serverUserFiles,
        };
        remoteSnapshotUserFiles = reconcileResult.remoteUserFiles;
        consola.success(
          `Reconciled remote changes from ${localBaseResultId} to ${reconcileResult.latest.resultId}.`,
        );
      } else if (parsedArgs.pull) {
        consola.info("Remote already matches the local base.");
      }
    } else if (parsedArgs.pull) {
      consola.info(
        "Remote has no compiled result yet. Continuing local update.",
      );
    }

    // ── Phase 1: Push local changes to the server ────────────────────────────

    const diff = await getLocalDiff(projectRoot);
    const ruleChanged =
      diff.modified.includes(RULE_FILE) || diff.added.includes(RULE_FILE);
    const manifestLocallyChanged =
      diff.modified.includes(MANIFEST_FILE) ||
      diff.added.includes(MANIFEST_FILE);

    let ruleId = currentProjectConfig.ruleId;
    let manifestId = currentProjectConfig.manifestId;
    let manifestContentHash = currentProjectConfig.manifestContentHash;

    const localManifest = await loadManifest(projectRoot);

    // A manifest push is needed when:
    //  1. The local file changed relative to the snapshot (local diff), OR
    //  2. The server's hash diverged from the last push (e.g. another client
    //     pushed a new version). Both hashes come from the backend so there is
    //     no cross-language serialisation risk.
    const manifestChanged =
      manifestLocallyChanged ||
      (await isManifestDifferentFromServer(manifestId, manifestContentHash));

    if (!ruleChanged && !manifestChanged) {
      consola.info("No changes detected — regenerating scaffolded files.");
    }

    if (ruleChanged) {
      const ruleText = await loadRule(projectRoot);
      const saved = await saveRuleSdk(currentProjectConfig.gameId, ruleText);
      ruleId = saved.ruleId;
      consola.success("Rule pushed.");
    }

    if (manifestChanged) {
      if (!ruleId) {
        ruleId = await getLatestRuleIdSdk(currentProjectConfig.gameId);
      }
      const saved = await saveManifestSdk(
        currentProjectConfig.gameId,
        localManifest,
        ruleId,
      );
      manifestId = saved.manifestId;
      manifestContentHash = saved.contentHash;
      consola.success("Manifest pushed.");
    }

    if (!manifestId) {
      if (!ruleId) {
        ruleId = await getLatestRuleIdSdk(currentProjectConfig.gameId);
      }
      manifestId =
        (await getLatestManifestIdSdk(currentProjectConfig.gameId, ruleId)) ??
        undefined;
      if (!manifestId) {
        // No manifest exists on the server yet — push the local one to bootstrap
        const saved = await saveManifestSdk(
          currentProjectConfig.gameId,
          localManifest,
          ruleId,
        );
        manifestId = saved.manifestId;
        manifestContentHash = saved.contentHash;
        consola.success("Manifest pushed (initial).");
      }
    }

    // ── Phase 2: Fetch fresh dynamic files from the server ───────────────────

    const {
      data: dynamicScaffoldResponse,
      error: dynamicScaffoldError,
      response: dynamicScaffoldHttpResponse,
    } = await scaffoldGameSourcesV3({
      path: { gameId: currentProjectConfig.gameId },
      body: {
        manifestId,
        ruleId,
        mode: "update",
        seedMissingOnly: true,
      },
    });
    if (dynamicScaffoldError || !dynamicScaffoldResponse) {
      throw new Error(
        formatApiError(
          dynamicScaffoldError,
          dynamicScaffoldHttpResponse,
          "Failed to scaffold dynamic files",
        ),
      );
    }

    const scaffoldFiles: Record<string, string | null> =
      validateDynamicScaffoldResponse(dynamicScaffoldResponse).allFiles;

    await mergeUiArgsFileIfNeeded(projectRoot, scaffoldFiles);

    if (parsedArgs["update-sdk"]) {
      const modifiedSdkFiles = await collectModifiedStaticSdkFiles(projectRoot);

      if (modifiedSdkFiles.length > 0) {
        consola.warn(
          `--update-sdk will overwrite ${modifiedSdkFiles.length} locally modified SDK file(s):`,
        );
        for (const file of modifiedSdkFiles) {
          consola.log(`  ! ${file}`);
        }

        if (parsedArgs.yes) {
          consola.info("Proceeding because --yes was provided.");
        } else {
          if (!process.stdin.isTTY || !process.stdout.isTTY) {
            throw new Error(
              "Refusing to overwrite modified SDK files in non-interactive mode without --yes.",
            );
          }

          const confirmed = await confirmPrompt(
            "Continue and overwrite these SDK files?",
          );
          if (!confirmed) {
            throw new Error("Update cancelled. No SDK files were overwritten.");
          }
        }
      }
    }

    const { written, skipped } = await writeScaffoldFiles(
      projectRoot,
      scaffoldFiles,
    );

    await scaffoldStaticWorkspace(projectRoot, "update", {
      updateSdk: parsedArgs["update-sdk"],
    });

    await writeManifest(projectRoot, localManifest);

    await updateProjectState(projectRoot, {
      ...currentProjectConfig,
      manifestId,
      manifestContentHash,
      ruleId: ruleId ?? currentProjectConfig.ruleId,
      resultId: undefined,
    });

    if (written.length > 0) {
      consola.success(`Written ${written.length} file(s):`);
      for (const file of written) {
        consola.log(`  + ${file}`);
      }
    }

    if (skipped.length > 0) {
      consola.info(
        `Skipped ${skipped.length} file(s) (already exist with content):`,
      );
      for (const file of skipped) {
        consola.log(`  ~ ${file}`);
      }
    }

    if (written.length === 0 && skipped.length === 0) {
      consola.info("All files already up to date.");
    }

    const localFiles = await collectLocalFiles(projectRoot);
    await writeSnapshotFromFiles(
      projectRoot,
      remoteSnapshotUserFiles
        ? buildRemoteAlignedSnapshotFiles({
            localFiles,
            remoteUserFiles: remoteSnapshotUserFiles,
          })
        : localFiles,
    );

    const stalePhaseFiles = findStalePhaseFiles(
      localFiles,
      getManifestPhasePaths(localManifest),
    );
    if (stalePhaseFiles.length > 0) {
      consola.warn(
        `Found ${stalePhaseFiles.length} stale phase file(s) that no longer match manifest states:`,
      );
      for (const file of stalePhaseFiles) {
        consola.log(`  - ${file}`);
      }
      consola.info(
        "Delete or rename these files if they are obsolete, then re-run typecheck.",
      );
    }

    consola.success("Update complete.");
  },
});
