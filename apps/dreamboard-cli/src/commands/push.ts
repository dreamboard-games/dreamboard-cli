import { defineCommand } from "citty";
import consola from "consola";
import {
  getGameSources,
  getLatestCompiledResult,
  recompileGame,
} from "@dreamboard/api-client";
import { CONFIG_FLAG_ARGS } from "../command-args.js";
import { MANIFEST_FILE, RULE_FILE } from "../constants.js";
import { resolveProjectContext } from "../config/resolve.js";
import { parsePushCommandArgs } from "../flags.js";
import {
  getLocalDiff,
  collectLocalFiles,
  isAllowedGamePath,
  isLibraryPath,
  loadManifest,
  loadRule,
  writeSnapshot,
} from "../services/project/local-files.js";
import { PRESERVED_USER_FILES } from "../services/project/scaffold-ownership.js";
import { assertCliStaticScaffoldComplete } from "../services/project/static-scaffold.js";
import {
  saveManifestSdk,
  saveRuleSdk,
  getLatestRuleIdSdk,
  findLatestSuccessfulCompiledResult,
} from "../services/api/index.js";
import { uploadFileOverrides } from "../services/storage/supabase-storage.js";
import { updateProjectState } from "../config/project-config.js";
import { formatApiError } from "../utils/errors.js";

/** Update the known server file list after an incremental push. */
function mergeServerUserFiles(
  previous: string[],
  added: string[],
  deleted: string[],
): string[] {
  const deletedSet = new Set(deleted);
  const result = new Set(previous.filter((p) => !deletedSet.has(p)));
  for (const p of added) result.add(p);
  return [...result].sort();
}

export default defineCommand({
  meta: {
    name: "push",
    description: "Push local changes to server (recompile)",
  },
  args: {
    force: {
      type: "boolean",
      description: "Override conflicts",
      default: false,
    },
    debug: {
      type: "boolean",
      description: "Print debug details including recompile payload",
      default: false,
    },
    ...CONFIG_FLAG_ARGS,
  },
  async run({ args }) {
    const parsedArgs = parsePushCommandArgs(args);
    const debug = parsedArgs.debug;
    const { projectRoot, projectConfig, config } =
      await resolveProjectContext(parsedArgs);
    let currentProjectConfig = projectConfig;
    const knownBaseResultId =
      currentProjectConfig.remoteBaseResultId ?? currentProjectConfig.resultId;

    const diff = await getLocalDiff(projectRoot);
    const hasChanges =
      diff.modified.length > 0 ||
      diff.added.length > 0 ||
      diff.deleted.length > 0;
    const latestSuccessfulCompiledResult =
      await findLatestSuccessfulCompiledResult(currentProjectConfig.gameId);
    const hasCurrentSuccessfulResult =
      latestSuccessfulCompiledResult?.id !== undefined &&
      latestSuccessfulCompiledResult.id === knownBaseResultId;
    if (!hasChanges && !parsedArgs.force && hasCurrentSuccessfulResult) {
      consola.info("No local changes to push.");
      return;
    }

    await assertCliStaticScaffoldComplete(projectRoot, diff.deleted);

    const { data: latest } = await getLatestCompiledResult({
      path: { gameId: currentProjectConfig.gameId },
    });
    let latestCompiledResultId = latest?.id;
    if (
      knownBaseResultId &&
      latest?.id &&
      latest.id !== knownBaseResultId &&
      !parsedArgs.force
    ) {
      throw new Error(
        "Remote drift detected. Run 'dreamboard update --pull' to reconcile before pushing, or use --force to replace remote state.",
      );
    }

    const ruleChanged =
      diff.modified.includes(RULE_FILE) || diff.added.includes(RULE_FILE);
    const manifestChanged =
      diff.modified.includes(MANIFEST_FILE) ||
      diff.added.includes(MANIFEST_FILE);
    let manifestId = currentProjectConfig.manifestId;
    let manifestContentHash = currentProjectConfig.manifestContentHash;
    let ruleId = currentProjectConfig.ruleId;

    if (ruleChanged) {
      const ruleText = await loadRule(projectRoot);
      const saved = await saveRuleSdk(currentProjectConfig.gameId, ruleText);
      ruleId = saved.ruleId;
    }

    if (manifestChanged) {
      if (!ruleId) {
        ruleId = await getLatestRuleIdSdk(currentProjectConfig.gameId);
      }
      const saved = await saveManifestSdk(
        currentProjectConfig.gameId,
        await loadManifest(projectRoot),
        ruleId,
      );
      manifestId = saved.manifestId;
      manifestContentHash = saved.contentHash;
    }

    if (!latestCompiledResultId) {
      if (!manifestId) {
        throw new Error("Cannot compile initial result: missing manifestId.");
      }
      if (!ruleId) {
        ruleId = await getLatestRuleIdSdk(currentProjectConfig.gameId);
      }
      consola.info(
        "No compiled result found. Performing initial full-source compile.",
      );
    }

    const metaFiles = new Set([MANIFEST_FILE, RULE_FILE]);
    const forceFullSync = parsedArgs.force || !hasCurrentSuccessfulResult;
    const includeLibraries = forceFullSync;
    const isPushPath = (p: string) =>
      !metaFiles.has(p) &&
      isAllowedGamePath(p) &&
      (includeLibraries || PRESERVED_USER_FILES.has(p) || !isLibraryPath(p));

    // When --force, upload ALL local user files to fully replace the server VFS.
    // A normal push only sends the diff — if the snapshot is in sync, diff is
    // empty and stale server files are left untouched, causing phantom errors.
    const localFiles = await collectLocalFiles(projectRoot);
    const localPushFiles = Object.fromEntries(
      Object.entries(localFiles).filter(([filePath]) => isPushPath(filePath)),
    );
    const overridePaths = forceFullSync
      ? Object.keys(localPushFiles)
      : diff.modified.concat(diff.added).filter(isPushPath);

    const overrides = await uploadFileOverrides(
      config,
      projectRoot,
      currentProjectConfig.gameId,
      overridePaths,
    );

    // When --force, also delete any server-side user files that no longer exist
    // locally. This catches stale files that predate the current snapshot and
    // would not appear in diff.deleted.
    const localPushFileSet = new Set(Object.keys(localPushFiles));
    let deletedPaths: string[];
    if (forceFullSync) {
      const cachedServerPaths = currentProjectConfig.serverUserFiles ?? [];
      let knownServerPaths = cachedServerPaths;
      if (latestCompiledResultId) {
        const { data: sourceResponse } = await getGameSources({
          path: { gameId: currentProjectConfig.gameId },
          query: { resultId: latestCompiledResultId },
        });
        const remoteFiles =
          (sourceResponse as { files?: Record<string, string> } | undefined)
            ?.files ??
          (
            sourceResponse as
              | { sourceFiles?: Record<string, string> }
              | undefined
          )?.sourceFiles ??
          {};
        const remoteServerPaths = Object.keys(remoteFiles).filter(
          (p) => isAllowedGamePath(p) && !metaFiles.has(p),
        );
        // In force mode prefer server truth over cached state so we can delete
        // stale files that were never tracked locally (e.g. older generated files).
        knownServerPaths = remoteServerPaths;
      }

      if (debug) {
        consola.info(
          `[push --debug] force sync path discovery: cachedServerPaths=${cachedServerPaths.length}, knownServerPaths=${knownServerPaths.length}, localPushFiles=${localPushFileSet.size}`,
        );
      }

      deletedPaths = knownServerPaths.filter(
        (p) => !localPushFileSet.has(p) && isAllowedGamePath(p),
      );
    } else {
      deletedPaths = diff.deleted.filter(isPushPath);
    }

    if (debug) {
      consola.info(
        `[push --debug] computed sets: overrides=${overridePaths.length}, deleted=${deletedPaths.length}`,
      );
      if (deletedPaths.length > 0) {
        consola.info(
          `[push --debug] deletedPaths:\n${deletedPaths.map((p) => `  - ${p}`).join("\n")}`,
        );
      }
    }

    const recompileBody = {
      fileOverrides: overrides,
      deletedPaths,
      ...(knownBaseResultId ? { resultId: knownBaseResultId } : {}),
      ...(manifestId ? { manifestId } : {}),
      ...(ruleId ? { ruleId } : {}),
    };

    if (debug) {
      consola.info(
        `[push --debug] recompile request payload:\n${JSON.stringify(recompileBody, null, 2)}`,
      );
    }

    const {
      data: response,
      error: recompileError,
      response: recompileResponse,
    } = await recompileGame({
      path: { gameId: currentProjectConfig.gameId },
      body: recompileBody,
    });

    // Always update local state if we got a result ID back, even on compilation errors.
    // The backend saves a result record for failed compilations too, so we must stay in sync
    // to avoid "Remote has newer changes" on the next push.
    if (response?.result) {
      await updateProjectState(projectRoot, {
        ...currentProjectConfig,
        resultId: response.result.id,
        remoteBaseResultId: response.result.id,
        sourceKey: response.result.sourceKey ?? currentProjectConfig.sourceKey,
        manifestId: manifestId ?? currentProjectConfig.manifestId,
        manifestContentHash:
          manifestContentHash ?? currentProjectConfig.manifestContentHash,
        ruleId: ruleId ?? currentProjectConfig.ruleId,
        // Track which user files are now on the server so --force can compute
        // the correct deletedPaths on the next run.
        serverUserFiles: forceFullSync
          ? overridePaths
          : mergeServerUserFiles(
              currentProjectConfig.serverUserFiles ?? [],
              overridePaths,
              deletedPaths,
            ),
      });
    }

    if (recompileError || !response?.result) {
      throw new Error(
        formatApiError(
          recompileError,
          recompileResponse,
          "Failed to recompile",
        ),
      );
    }

    if (!response.result.success) {
      await writeSnapshot(projectRoot);
      const diagnostics = response.result.diagnostics ?? [];
      if (diagnostics.length > 0) {
        consola.error(
          `Compilation failed with ${diagnostics.length} diagnostic(s):\n`,
        );
        for (const diagnostic of diagnostics) {
          if (diagnostic.type === "file") {
            consola.log(
              `  ${diagnostic.file}:${diagnostic.line}:${diagnostic.column}  ${diagnostic.message}`,
            );
          } else {
            const contextFile = diagnostic.context?.file
              ? ` (${diagnostic.context.file})`
              : "";
            consola.log(
              `  [${diagnostic.category}]${contextFile} ${diagnostic.message}`,
            );
            if (diagnostic.context?.details) {
              consola.log(`    ${diagnostic.context.details}`);
            }
          }
        }
        consola.log("");
      }
      throw new Error("Compilation failed. Fix diagnostics and push again.");
    }

    await writeSnapshot(projectRoot);
    consola.success("Push complete.");
  },
});
