import { defineCommand } from "citty";
import consola from "consola";
import { updateProjectState } from "../config/project-config.js";
import { resolveProjectContext } from "../config/resolve.js";
import { parsePullCommandArgs } from "../flags.js";
import {
  buildRemoteAlignedSnapshotFiles,
  fetchLatestRemoteSources,
  pullIntoDirectory,
  reconcileRemoteChangesIntoWorkspace,
} from "../services/project/sync.js";
import {
  collectLocalFiles,
  getLocalDiff,
  loadManifest,
  writeSnapshotFromFiles,
} from "../services/project/local-files.js";
import {
  getProjectAuthoringState,
  updateProjectAuthoringState,
} from "../services/project/project-state.js";
import { applyWorkspaceCodegen } from "../services/project/workspace-codegen.js";

export default defineCommand({
  meta: {
    name: "pull",
    description: "Reconcile remote authored changes into the current project",
  },
  args: {
    force: {
      type: "boolean",
      description: "Override conflicts",
      default: false,
    },
    env: { type: "string", description: "Environment: local | dev | prod" },
    token: { type: "string", description: "Auth token (Supabase JWT)" },
  },
  async run({ args }) {
    const parsedArgs = parsePullCommandArgs(args);
    const { projectRoot, projectConfig, config } =
      await resolveProjectContext(parsedArgs);
    const localAuthoring = getProjectAuthoringState(projectConfig);
    const latestRemote = await fetchLatestRemoteSources(projectConfig.gameId);

    if (localAuthoring.pendingSync && !parsedArgs.force) {
      throw new Error(
        "This workspace is still finalizing a previous sync. Run 'dreamboard sync' again to finish it, or use 'dreamboard pull --force' to replace local files with remote state.",
      );
    }

    if (!latestRemote) {
      consola.info("Remote has no authored state yet.");
      return;
    }

    if (!localAuthoring.authoringStateId) {
      if (!parsedArgs.force) {
        throw new Error(
          `This workspace has no authored base. Use 'dreamboard pull --force' to replace local files with remote authored state ${latestRemote.authoringStateId}.`,
        );
      }
      await pullIntoDirectory(config, projectRoot, projectConfig);
      consola.success("Pulled remote authored state into the workspace.");
      return;
    }

    if (localAuthoring.authoringStateId === latestRemote.authoringStateId) {
      consola.info("Remote authored state already matches this workspace.");
      return;
    }

    if (parsedArgs.force) {
      await pullIntoDirectory(config, projectRoot, projectConfig);
      consola.success(
        "Replaced local files with the current remote authored state.",
      );
      return;
    }

    const reconcileResult = await reconcileRemoteChangesIntoWorkspace({
      projectRoot,
      projectConfig,
      baseAuthoringStateId: localAuthoring.authoringStateId,
      latestAuthoringStateId: latestRemote.authoringStateId,
    });

    if (reconcileResult.conflicts.length > 0) {
      for (const filePath of reconcileResult.conflicts) {
        consola.error(`Conflict: ${filePath}`);
      }
      throw new Error(
        `Remote reconciliation wrote conflict markers to ${reconcileResult.conflicts.length} file(s). Resolve them and rerun 'dreamboard pull'.`,
      );
    }

    await updateProjectState(
      projectRoot,
      updateProjectAuthoringState(projectConfig, {
        authoringStateId: reconcileResult.latest.authoringStateId,
        sourceRevisionId: reconcileResult.latest.sourceRevisionId,
        sourceTreeHash: reconcileResult.latest.treeHash,
        manifestId:
          reconcileResult.latest.manifestId ??
          projectConfig.authoring?.manifestId,
        manifestContentHash:
          reconcileResult.latest.manifestContentHash ??
          projectConfig.authoring?.manifestContentHash,
        ruleId:
          reconcileResult.latest.ruleId ?? projectConfig.authoring?.ruleId,
      }),
    );

    await applyWorkspaceCodegen({
      projectRoot,
      manifest: await loadManifest(projectRoot),
    });

    const reconciledLocalFiles = await collectLocalFiles(projectRoot);
    await writeSnapshotFromFiles(
      projectRoot,
      buildRemoteAlignedSnapshotFiles({
        localFiles: reconciledLocalFiles,
        remoteUserFiles: reconcileResult.remoteUserFiles,
      }),
    );

    const localDiff = await getLocalDiff(projectRoot);
    if (
      localDiff.modified.length === 0 &&
      localDiff.added.length === 0 &&
      localDiff.deleted.length === 0
    ) {
      consola.success("Pulled remote authored changes.");
      return;
    }

    consola.success(
      "Pulled remote authored changes. Local edits were preserved where possible.",
    );
  },
});
