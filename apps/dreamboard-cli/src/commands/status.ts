import { defineCommand } from "citty";
import consola from "consola";
import { getGame } from "@dreamboard/api-client";
import { CONFIG_FLAG_ARGS } from "../command-args.js";
import { resolveProjectContext, configureClient } from "../config/resolve.js";
import { parseStatusCommandArgs } from "../flags.js";
import { getLocalDiff } from "../services/project/local-files.js";
import {
  findCompiledResultsForAuthoringState,
  getAuthoringHeadSdk,
} from "../services/api/index.js";
import {
  getProjectAuthoringState,
  getProjectCompileState,
  getProjectPendingAuthoringSync,
} from "../services/project/project-state.js";

export default defineCommand({
  meta: { name: "status", description: "Show local vs remote status" },
  args: {
    json: {
      type: "boolean",
      description: "Print machine-readable status JSON",
      default: false,
    },
    ...CONFIG_FLAG_ARGS,
  },
  async run({ args }) {
    const parsedArgs = parseStatusCommandArgs(args);
    const { projectRoot, projectConfig, config } = await resolveProjectContext(
      parsedArgs,
      { requireAuth: false },
    );

    const diff = await getLocalDiff(projectRoot);
    const localAuthoring = getProjectAuthoringState(projectConfig);
    const pendingSync = getProjectPendingAuthoringSync(projectConfig);
    const localCompile = getProjectCompileState(projectConfig);
    let remoteHeadId: string | null = null;
    let authoredRelation:
      | "in_sync"
      | "ahead"
      | "behind"
      | "diverged"
      | "pending_finalize"
      | "unknown" = "unknown";
    let compileRelation:
      | "successful"
      | "failed"
      | "never_compiled"
      | "stale_success" = "never_compiled";
    let completionLights: {
      rules: unknown;
      manifest: unknown;
      phases: unknown;
      ui: unknown;
    } | null = null;

    if (config.authToken) {
      await configureClient(config);
      const remoteHead = await getAuthoringHeadSdk(projectConfig.gameId);
      remoteHeadId = remoteHead?.authoringStateId ?? null;

      const { data: game } = await getGame({
        path: { gameId: projectConfig.gameId },
      });
      if (game) {
        completionLights = game.completionLights;
      }

      const hasLocalDiff =
        diff.modified.length > 0 ||
        diff.added.length > 0 ||
        diff.deleted.length > 0;
      if (pendingSync) {
        authoredRelation = "pending_finalize";
      } else if (!localAuthoring.authoringStateId) {
        authoredRelation = "unknown";
      } else if (remoteHeadId === null) {
        authoredRelation = hasLocalDiff ? "ahead" : "unknown";
      } else if (remoteHeadId === localAuthoring.authoringStateId) {
        authoredRelation = hasLocalDiff ? "ahead" : "in_sync";
      } else {
        authoredRelation = hasLocalDiff ? "diverged" : "behind";
      }

      if (remoteHeadId) {
        const remoteResults = await findCompiledResultsForAuthoringState({
          gameId: projectConfig.gameId,
          authoringStateId: remoteHeadId,
        });
        const latestAttempt = remoteResults[0] ?? null;

        if (latestAttempt?.success) {
          compileRelation = "successful";
        } else if (latestAttempt && !latestAttempt.success) {
          compileRelation = "failed";
        } else if (
          localCompile.latestSuccessful &&
          localCompile.latestSuccessful.authoringStateId !== remoteHeadId
        ) {
          compileRelation = "stale_success";
        } else {
          compileRelation = "never_compiled";
        }
      }
    }

    if (parsedArgs.json) {
      console.log(
        JSON.stringify(
          {
            gameId: projectConfig.gameId,
            slug: projectConfig.slug,
            authoring: {
              localAuthoringStateId: localAuthoring.authoringStateId ?? null,
              remoteAuthoringStateId: remoteHeadId,
              relation: authoredRelation,
              pendingSync: pendingSync ?? null,
            },
            compile: {
              relation: compileRelation,
              latestAttempt: localCompile.latestAttempt ?? null,
              latestSuccessful: localCompile.latestSuccessful ?? null,
            },
            authenticated: Boolean(config.authToken),
            localDiff: {
              modified: diff.modified.length,
              added: diff.added.length,
              deleted: diff.deleted.length,
            },
            localDiffPaths: diff,
            completionLights,
          },
          null,
          2,
        ),
      );
      return;
    }

    consola.info(
      `Local changes: ${diff.modified.length} modified, ${diff.added.length} added, ${diff.deleted.length} deleted`,
    );
    if (diff.modified.length > 0)
      consola.log(`Modified: ${diff.modified.join(", ")}`);
    if (diff.added.length > 0) consola.log(`Added: ${diff.added.join(", ")}`);
    if (diff.deleted.length > 0)
      consola.log(`Deleted: ${diff.deleted.join(", ")}`);

    if (completionLights) {
      const lightSummary = [
        `rules:${completionLights.rules}`,
        `manifest:${completionLights.manifest}`,
        `phases:${completionLights.phases}`,
        `ui:${completionLights.ui}`,
      ].join("  ");
      consola.info(`Completion lights: ${lightSummary}`);
    }

    if (!config.authToken) {
      consola.warn("Remote status unavailable (no auth token).");
      return;
    }

    consola.info(
      `Authored state: ${authoredRelation} (local=${localAuthoring.authoringStateId ?? "unknown"}, remote=${remoteHeadId ?? "none"})`,
    );
    if (pendingSync) {
      consola.warn(
        `Previous sync is still being finalized (${pendingSync.phase}). Run 'dreamboard sync' again to finish updating local scaffold files.`,
      );
    }
    consola.info(`Compile state: ${compileRelation}`);
    if (compileRelation === "failed") {
      consola.warn(
        "Latest compile for the current authored state failed. Fix diagnostics and run 'dreamboard compile' again.",
      );
    }
    if (authoredRelation === "behind" || authoredRelation === "diverged") {
      consola.warn(
        "Remote authored changes are available. Run 'dreamboard pull' to reconcile them into this workspace.",
      );
    }
  },
});
