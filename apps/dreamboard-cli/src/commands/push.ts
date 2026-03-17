import { defineCommand } from "citty";
import consola from "consola";
import {
  getLatestCompiledResult,
  type CreateSourceRevisionRequest,
  type SourceChangeOperation,
  type SourceChangeMode,
} from "@dreamboard/api-client";
import { CONFIG_FLAG_ARGS } from "../command-args.js";
import { MANIFEST_FILE, RULE_FILE } from "../constants.js";
import { resolveProjectContext } from "../config/resolve.js";
import { parsePushCommandArgs } from "../flags.js";
import {
  getLocalDiff,
  collectLocalFiles,
  isAllowedGamePath,
  loadManifest,
  loadRule,
  writeSnapshot,
} from "../services/project/local-files.js";
import { assertCliStaticScaffoldComplete } from "../services/project/static-scaffold.js";
import {
  createCompiledResultSdk,
  createSourceRevisionSdk,
  saveManifestSdk,
  saveRuleSdk,
  getLatestRuleIdSdk,
  findLatestSuccessfulCompiledResult,
  waitForCompiledResultJobSdk,
} from "../services/api";
import { updateProjectState } from "../config/project-config.js";
import { planSourceRevisionTransport } from "@dreamboard/api-client/source-revisions";
import { runLocalTypecheck } from "../services/project/local-typecheck.js";

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
  const upsertPaths = [...diff.modified, ...diff.added]
    .filter(isSourcePath)
    .sort((left, right) => left.localeCompare(right));

  for (const path of upsertPaths) {
    const content = localFiles[path];
    if (content === undefined) {
      continue;
    }
    changes.push({
      kind: "upsert",
      path,
      content,
    });
  }

  for (const path of diff.deleted.filter(isSourcePath).sort()) {
    changes.push({
      kind: "delete",
      path,
    });
  }

  return changes;
}

function formatCompileJobProgressMessage(job: {
  status: string;
  phase?: string;
  queuePosition?: number;
  message?: string;
}): string {
  const phase = job.phase ? ` [${job.phase}]` : "";
  const detail = job.message ? ` ${job.message}` : "";
  if (job.status === "PENDING") {
    const queue =
      typeof job.queuePosition === "number"
        ? ` (queue ${job.queuePosition + 1})`
        : "";
    return `Compile queued${queue}${phase}${detail}`.trim();
  }
  if (job.status === "RUNNING") {
    return `Compile running${phase}${detail}`.trim();
  }
  if (job.status === "FAILED") {
    return `Compile failed${phase}${detail}`.trim();
  }
  return `Compile ${job.status.toLowerCase()}${phase}${detail}`.trim();
}

export default defineCommand({
  meta: {
    name: "push",
    description: "Push local changes to the server",
  },
  args: {
    force: {
      type: "boolean",
      description: "Replace the full authored source tree",
      default: false,
    },
    debug: {
      type: "boolean",
      description: "Print debug details including source revision payloads",
      default: false,
    },
    "skip-local-check": {
      type: "boolean",
      description:
        "Skip the best-effort local typecheck before remote mutations",
      default: false,
    },
    ...CONFIG_FLAG_ARGS,
  },
  async run({ args }) {
    const parsedArgs = parsePushCommandArgs(args);
    const debug = parsedArgs.debug;
    const { projectRoot, projectConfig } =
      await resolveProjectContext(parsedArgs);
    let currentProjectConfig = projectConfig;
    const persistProjectProgress = async (
      overrides: Partial<typeof currentProjectConfig> = {},
    ) => {
      currentProjectConfig = {
        ...currentProjectConfig,
        ruleId,
        manifestId,
        manifestContentHash,
        sourceRevisionId,
        sourceTreeHash,
        ...overrides,
      };
      await updateProjectState(projectRoot, currentProjectConfig);
    };
    const knownBaseResultId = currentProjectConfig.resultId;

    const diff = await getLocalDiff(projectRoot);
    const sourceDiffHasChanges =
      diff.modified.some(isSourcePath) ||
      diff.added.some(isSourcePath) ||
      diff.deleted.some(isSourcePath);
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
    if (latest?.id && !knownBaseResultId) {
      throw new Error(
        `Remote base is unknown. Latest remote result=${latest.id}. Run 'dreamboard update --pull' to reconcile before pushing.`,
      );
    }
    if (knownBaseResultId && latest?.id && latest.id !== knownBaseResultId) {
      throw new Error(
        `Remote drift detected. Local base=${knownBaseResultId}, remote latest=${latest.id}. Run 'dreamboard update --pull' to reconcile before pushing.`,
      );
    }

    if (!parsedArgs["skip-local-check"]) {
      consola.start("Running local typecheck...");
      const typecheckResult = await runLocalTypecheck(projectRoot);
      if (typecheckResult.skipped) {
        if (typecheckResult.output) {
          consola.warn(typecheckResult.output);
        }
      } else if (!typecheckResult.success) {
        if (typecheckResult.output) {
          consola.error(typecheckResult.output);
        }
        throw new Error(
          "Local typecheck failed. Fix the diagnostics or re-run with --skip-local-check.",
        );
      } else {
        consola.success("Local typecheck passed.");
      }
    }

    const ruleChanged =
      diff.modified.includes(RULE_FILE) || diff.added.includes(RULE_FILE);
    const manifestChanged =
      diff.modified.includes(MANIFEST_FILE) ||
      diff.added.includes(MANIFEST_FILE);
    let manifestId = currentProjectConfig.manifestId;
    let manifestContentHash = currentProjectConfig.manifestContentHash;
    let ruleId = currentProjectConfig.ruleId;
    let sourceRevisionId =
      currentProjectConfig.sourceRevisionId ?? latest?.sourceRevisionId;
    let sourceTreeHash = currentProjectConfig.sourceTreeHash;

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

    if (!latest?.id) {
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

    const localFiles = await collectLocalFiles(projectRoot);
    const sourceChangeMode: SourceChangeMode =
      parsedArgs.force || !sourceRevisionId ? "replace" : "incremental";
    const sourceChanges = buildSourceChanges({
      mode: sourceChangeMode,
      localFiles,
      diff,
    });

    if (debug) {
      const transportPreview = planSourceRevisionTransport({
        ...(sourceRevisionId ? { baseSourceRevisionId: sourceRevisionId } : {}),
        mode: sourceChangeMode,
        changes: sourceChanges,
      });
      consola.info(
        `[push --debug] source changes=${sourceChanges.length}, upserts=${transportPreview.upsertCount}, bytes=${transportPreview.byteLength}, transport=${transportPreview.useBundle ? "gzip-bundle" : "inline-json"}`,
      );
      if (sourceChanges.length > 0) {
        consola.info(
          `[push --debug] source paths:\n${sourceChanges.map((change) => `  - ${change.kind} ${change.path}`).join("\n")}`,
        );
      }
    }

    if (sourceChanges.length > 0 || !sourceRevisionId) {
      const sourceRevisionRequest: CreateSourceRevisionRequest = {
        ...(sourceRevisionId ? { baseSourceRevisionId: sourceRevisionId } : {}),
        mode: sourceChangeMode,
        changes: sourceChanges,
      };
      const sourceRevision = await createSourceRevisionSdk(
        currentProjectConfig.gameId,
        sourceRevisionRequest,
      );
      sourceRevisionId = sourceRevision.id;
      sourceTreeHash = sourceRevision.treeHash;
    } else if (debug && !sourceDiffHasChanges) {
      consola.info(
        `[push --debug] reusing existing source revision ${sourceRevisionId}`,
      );
    }

    if (!sourceRevisionId) {
      throw new Error("Cannot compile without a source revision.");
    }
    if (!manifestId) {
      throw new Error("Cannot compile without a manifest.");
    }
    if (!ruleId) {
      ruleId = await getLatestRuleIdSdk(currentProjectConfig.gameId);
    }

    // Checkpoint any remote authoring progress before compilation. If the
    // compile request throws after saving a rule, manifest, or source
    // revision, the next push should reuse those remote IDs instead of
    // replaying from stale local state.
    const shouldCheckpointPrecompileState =
      manifestId !== currentProjectConfig.manifestId ||
      manifestContentHash !== currentProjectConfig.manifestContentHash ||
      ruleId !== currentProjectConfig.ruleId ||
      sourceRevisionId !== currentProjectConfig.sourceRevisionId ||
      sourceTreeHash !== currentProjectConfig.sourceTreeHash;
    if (shouldCheckpointPrecompileState) {
      await persistProjectProgress();
    }

    const compileJob = await createCompiledResultSdk({
      gameId: currentProjectConfig.gameId,
      sourceRevisionId,
      manifestId,
      ruleId,
    });
    if (debug) {
      consola.info(`[push --debug] compile job=${compileJob.jobId}`);
    }
    const { compiledResult } = await waitForCompiledResultJobSdk({
      gameId: currentProjectConfig.gameId,
      jobId: compileJob.jobId,
      onProgress: (job) => {
        consola.info(formatCompileJobProgressMessage(job));
      },
    });

    await persistProjectProgress({
      resultId: compiledResult.id,
      sourceRevisionId: compiledResult.sourceRevisionId,
    });

    if (!compiledResult.success) {
      await writeSnapshot(projectRoot);
      const diagnostics = compiledResult.diagnostics ?? [];
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
