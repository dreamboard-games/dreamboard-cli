import path from "node:path";
import { defineCommand } from "citty";
import consola from "consola";
import {
  getGameBySlug,
  getLatestGameRule,
  getManifest,
  findManifests,
} from "@dreamboard/api-client";
import {
  resolveConfig,
  requireAuth,
  configureClient,
} from "../config/resolve.js";
import { parseCloneCommandArgs } from "../flags.js";
import { loadGlobalConfig } from "../config/global-config.js";
import { normalizeSlug } from "../utils/strings.js";
import { ensureDir } from "../utils/fs.js";
import { CONFIG_FLAG_ARGS } from "../command-args.js";
import {
  findCompiledResultsForAuthoringState,
  getAuthoringHeadSdk,
  getLatestRuleIdSdk,
} from "../services/api/index.js";
import {
  writeManifest,
  writeRule,
  writeSnapshot,
} from "../services/project/local-files.js";
import { updateProjectState } from "../config/project-config.js";
import { scaffoldStaticWorkspace } from "../services/project/static-scaffold.js";
import { pullIntoDirectory } from "../services/project/sync.js";
import {
  setLatestCompileAttempt,
  updateProjectLocalMaintainerRegistry,
  updateProjectAuthoringState,
} from "../services/project/project-state.js";
import { toDreamboardApiError } from "../utils/errors.js";
import { applyWorkspaceCodegen } from "../services/project/workspace-codegen.js";
import {
  ensureLocalMaintainerSnapshot,
  readWorkspaceLocalMaintainerRegistry,
} from "../services/project/local-maintainer-registry.js";
import { installWorkspaceDependencies } from "../services/project/workspace-dependencies.js";

export default defineCommand({
  meta: { name: "clone", description: "Clone an existing game by slug" },
  args: {
    slug: { type: "positional", description: "Game slug", required: true },
    ...CONFIG_FLAG_ARGS,
  },
  async run({ args }) {
    const parsedArgs = parseCloneCommandArgs(args);
    const slugInput = parsedArgs.slug;

    const normalizedSlug = normalizeSlug(slugInput);
    if (!normalizedSlug) {
      throw new Error("Slug must contain at least one alphanumeric character.");
    }

    const config = resolveConfig(await loadGlobalConfig(), parsedArgs);
    requireAuth(config);
    await configureClient(config);
    const localMaintainerRegistry = await ensureLocalMaintainerSnapshot(
      config.apiBaseUrl,
    );

    const {
      data: game,
      error,
      response,
    } = await getGameBySlug({
      path: { slug: normalizedSlug },
    });
    if (error || !game) {
      throw toDreamboardApiError(
        error,
        response,
        `Game '${normalizedSlug}' not found`,
      );
    }

    const authoringHead = await getAuthoringHeadSdk(game.id);

    const targetDir = path.resolve(process.cwd(), normalizedSlug);
    await ensureDir(targetDir);

    if (!authoringHead?.authoringStateId) {
      consola.info("No remote authored state found. Scaffolding sources...");

      const ruleId = await getLatestRuleIdSdk(game.id);
      const { data: manifestsResponse } = await findManifests({
        path: { gameId: game.id },
        query: { ruleId },
      });
      const manifestId = manifestsResponse?.currentManifestId;
      if (!manifestId) {
        throw new Error(
          "No manifest found for this game. Create one first with 'dreamboard new'.",
        );
      }

      const { data: manifestResponse, error: manifestError } =
        await getManifest({
          path: { manifestId },
        });
      if (manifestError || !manifestResponse) {
        throw new Error("Failed to fetch latest manifest content for clone.");
      }

      const { data: latestRuleResponse, error: latestRuleError } =
        await getLatestGameRule({
          path: { gameId: game.id },
        });
      if (latestRuleError || !latestRuleResponse) {
        throw new Error("Failed to fetch latest rule content for clone.");
      }

      await writeManifest(targetDir, manifestResponse.manifest);
      await writeRule(targetDir, latestRuleResponse.ruleText);
      await scaffoldStaticWorkspace(targetDir, "update", {
        localMaintainerRegistry,
      });
      await applyWorkspaceCodegen({
        projectRoot: targetDir,
        manifest: manifestResponse.manifest,
      });
      await installWorkspaceDependencies(targetDir);
      await updateProjectState(
        targetDir,
        updateProjectLocalMaintainerRegistry(
          updateProjectAuthoringState(
            {
              gameId: game.id,
              slug: normalizedSlug,
              apiBaseUrl: config.apiBaseUrl,
              webBaseUrl: config.webBaseUrl,
            },
            {
              ruleId,
              manifestId,
              manifestContentHash: manifestResponse.contentHash,
            },
          ),
          localMaintainerRegistry ?? undefined,
        ),
      );
      await writeSnapshot(targetDir);
    } else {
      const pulledProjectConfig = await pullIntoDirectory(config, targetDir, {
        gameId: game.id,
        slug: normalizedSlug,
        apiBaseUrl: config.apiBaseUrl,
        webBaseUrl: config.webBaseUrl,
      });
      const fallbackRegistryUrl = localMaintainerRegistry?.registryUrl;
      const workspaceLocalMaintainerRegistry =
        localMaintainerRegistry ??
        (await readWorkspaceLocalMaintainerRegistry(
          targetDir,
          fallbackRegistryUrl,
        ));
      await scaffoldStaticWorkspace(targetDir, "update", {
        localMaintainerRegistry: workspaceLocalMaintainerRegistry,
      });
      if (workspaceLocalMaintainerRegistry) {
        await installWorkspaceDependencies(targetDir);
      }
      await updateProjectState(
        targetDir,
        updateProjectLocalMaintainerRegistry(
          pulledProjectConfig,
          workspaceLocalMaintainerRegistry ?? undefined,
        ),
      );

      const remoteResults = await findCompiledResultsForAuthoringState({
        gameId: game.id,
        authoringStateId: authoringHead.authoringStateId,
      });
      const latestSuccess = remoteResults.find(
        (result: { success: boolean }) => result.success,
      );
      if (latestSuccess) {
        const configWithLatestCompileAttempt = setLatestCompileAttempt(
          pulledProjectConfig,
          {
            resultId: latestSuccess.id,
            authoringStateId: latestSuccess.authoringStateId,
            status: "successful",
          },
        );
        await updateProjectState(
          targetDir,
          updateProjectLocalMaintainerRegistry(
            configWithLatestCompileAttempt,
            workspaceLocalMaintainerRegistry ?? undefined,
          ),
        );
      }
    }

    consola.success(`Cloned ${normalizedSlug} into ${targetDir}`);
  },
});
