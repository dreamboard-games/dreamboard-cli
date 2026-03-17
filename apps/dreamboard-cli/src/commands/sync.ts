import { defineCommand } from "citty";
import consola from "consola";
import {
  scaffoldGameSourcesV3,
  type SourceChangeMode,
  type SourceChangeOperation,
} from "@dreamboard/api-client";
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
  writeScaffoldFiles,
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
} from "../services/api/index.js";
import { formatApiError } from "../utils/errors.js";
import { validateDynamicScaffoldResponse } from "../services/project/dynamic-scaffold-response.js";
import {
  getProjectAuthoringState,
  updateProjectAuthoringState,
} from "../services/project/project-state.js";

function isSourcePath(filePath: string): boolean {
  return (
    filePath !== MANIFEST_FILE &&
    filePath !== RULE_FILE &&
    isAllowedGamePath(filePath)
  );
}

function buildSourceChanges(options: {
  mode: SourceChangeMode;
  localFiles: Record<string, string>;
  diff: { modified: string[]; added: string[]; deleted: string[] };
}): SourceChangeOperation[] {
  const { mode, localFiles, diff } = options;

  if (mode === "replace") {
    return Object.entries(localFiles)
      .filter(([filePath]) => isSourcePath(filePath))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([path, content]) => ({
        kind: "upsert",
        path,
        content,
      }));
  }

  const changes: SourceChangeOperation[] = [];

  for (const filePath of [...diff.modified, ...diff.added]
    .filter(isSourcePath)
    .sort()) {
    const content = localFiles[filePath];
    if (content !== undefined) {
      changes.push({ kind: "upsert", path: filePath, content });
    }
  }

  for (const filePath of diff.deleted.filter(isSourcePath).sort()) {
    changes.push({ kind: "delete", path: filePath });
  }

  return changes;
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
    "update-sdk": {
      type: "boolean",
      description: "Refresh bundled SDK files while scaffolding",
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
    const { projectRoot, projectConfig } =
      await resolveProjectContext(parsedArgs);

    const localDiff = await getLocalDiff(projectRoot);
    await assertCliStaticScaffoldComplete(projectRoot, localDiff.deleted);

    const localAuthoring = getProjectAuthoringState(projectConfig);
    const remoteHead = await getAuthoringHeadSdk(projectConfig.gameId);
    const remoteHeadId = remoteHead?.authoringStateId;
    const localHeadId = localAuthoring.authoringStateId;

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
    if (!hasChanges && localHeadId != null && remoteHeadId === localHeadId) {
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
      if (!ruleId) {
        ruleId = await getLatestRuleIdSdk(projectConfig.gameId);
      }
      const saved = await saveManifestSdk(
        projectConfig.gameId,
        await loadManifest(projectRoot),
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
      const sourceRevision = await createSourceRevisionSdk(
        projectConfig.gameId,
        {
          ...(sourceRevisionId
            ? { baseSourceRevisionId: sourceRevisionId }
            : {}),
          mode,
          changes: sourceChanges,
        },
      );
      sourceRevisionId = sourceRevision.id;
      sourceTreeHash = sourceRevision.treeHash;
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

    const authoringState = await createAuthoringStateSdk(projectConfig.gameId, {
      ...(remoteHeadId ? { baseAuthoringStateId: remoteHeadId } : {}),
      sourceRevisionId,
      sourceTreeHash,
      manifestId,
      manifestContentHash,
      ruleId,
    });

    const {
      data: dynamicScaffold,
      error: dynamicError,
      response: dynamicResponse,
    } = await scaffoldGameSourcesV3({
      path: { gameId: projectConfig.gameId },
      body: {
        manifestId,
        ruleId,
        mode: "update",
        seedMissingOnly: true,
      },
    });
    if (dynamicError || !dynamicScaffold) {
      throw new Error(
        formatApiError(
          dynamicError,
          dynamicResponse,
          "Failed to scaffold dynamic files after sync",
        ),
      );
    }

    await writeScaffoldFiles(
      projectRoot,
      validateDynamicScaffoldResponse(dynamicScaffold).allFiles,
    );
    await scaffoldStaticWorkspace(projectRoot, "update", {
      updateSdk: parsedArgs["update-sdk"],
    });

    await updateProjectState(
      projectRoot,
      updateProjectAuthoringState(projectConfig, {
        authoringStateId: authoringState.authoringStateId,
        sourceRevisionId: authoringState.sourceRevisionId,
        sourceTreeHash: authoringState.sourceTreeHash,
        manifestId: authoringState.manifestId,
        manifestContentHash: authoringState.manifestContentHash,
        ruleId: authoringState.ruleId,
      }),
    );
    await writeSnapshot(projectRoot);

    consola.success(
      `Synced authored state ${authoringState.authoringStateId}. Run 'dreamboard compile' when you're ready.`,
    );
  },
});
