import { defineCommand } from "citty";
import consola from "consola";
import { getGame, getLatestCompiledResult } from "@dreamboard/api-client";
import { CONFIG_FLAG_ARGS } from "../command-args.js";
import { resolveProjectContext, configureClient } from "../config/resolve.js";
import { parseStatusCommandArgs } from "../flags.js";
import { getLocalDiff } from "../services/project/local-files.js";

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
    const localBaseResultId =
      projectConfig.remoteBaseResultId ?? projectConfig.resultId;
    let latestRemoteResultId: string | null = null;
    let completionLights: {
      rules: boolean;
      manifest: boolean;
      phases: boolean;
      ui: boolean;
    } | null = null;

    if (config.authToken) {
      await configureClient(config);
      const { data: latest } = await getLatestCompiledResult({
        path: { gameId: projectConfig.gameId },
      });
      latestRemoteResultId = latest?.id ?? null;

      const { data: game } = await getGame({
        path: { gameId: projectConfig.gameId },
      });
      if (game) {
        completionLights = game.completionLights;
      }
    }

    const remoteDrift =
      latestRemoteResultId !== null &&
      localBaseResultId !== undefined &&
      latestRemoteResultId !== localBaseResultId;

    if (parsedArgs.json) {
      console.log(
        JSON.stringify(
          {
            gameId: projectConfig.gameId,
            slug: projectConfig.slug,
            localBaseResultId: localBaseResultId ?? null,
            latestRemoteResultId,
            remoteDrift,
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

    if (latestRemoteResultId === null) {
      consola.info("Remote has no compiled results yet.");
      return;
    }

    if (!localBaseResultId) {
      consola.warn(
        `Remote base is unknown. Latest remote result: ${latestRemoteResultId}. Run 'dreamboard update --pull' to reconcile this workspace.`,
      );
      return;
    }

    if (remoteDrift) {
      consola.warn(
        `Remote drift detected: local base=${localBaseResultId}, remote latest=${latestRemoteResultId}. Run 'dreamboard update --pull' to reconcile.`,
      );
      return;
    }

    consola.info("Remote is up to date with local base.");
  },
});
