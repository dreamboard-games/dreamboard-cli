import path from "node:path";
import { defineCommand } from "citty";
import consola from "consola";
import { createGame, deleteGame } from "@dreamboard/api-client";
import type { GameTopologyManifest } from "@dreamboard/sdk-types";
import {
  resolveConfig,
  requireAuth,
  configureClient,
} from "../config/resolve.js";
import { IS_PUBLISHED_BUILD } from "../build-target.js";
import { ENVIRONMENT_CONFIGS } from "../constants.js";
import { parseNewCommandArgs } from "../flags.js";
import { loadGlobalConfig } from "../config/global-config.js";
import { normalizeSlug, titleFromSlug } from "../utils/strings.js";
import { ensureDir, writeTextFile } from "../utils/fs.js";
import { CONFIG_FLAG_ARGS } from "../command-args.js";
import {
  tryGetGameBySlug,
  getLatestRuleIdSdk,
  saveManifestSdk,
} from "../services/api/index.js";
import {
  writeManifest,
  writeRule,
  writeSnapshot,
} from "../services/project/local-files.js";
import { updateProjectState } from "../config/project-config.js";
import { scaffoldStaticWorkspace } from "../services/project/static-scaffold.js";
import { updateProjectAuthoringState } from "../services/project/project-state.js";
import { isProblemType, toDreamboardApiError } from "../utils/errors.js";
import { CLI_PROBLEM_TYPES } from "../utils/problem-types.js";
import { applyWorkspaceCodegen } from "../services/project/workspace-codegen.js";
import { installWorkspaceDependencies } from "../services/project/workspace-dependencies.js";

export default defineCommand({
  meta: {
    name: "new",
    description: "Create a new game and scaffold a local workspace",
  },
  args: {
    slug: { type: "positional", description: "Game slug", required: true },
    description: {
      type: "string",
      description: "Short description of the game to create",
      required: true,
    },
    force: {
      type: "boolean",
      description: "Delete existing game with the same slug before creating",
      default: false,
    },
    ...CONFIG_FLAG_ARGS,
  },
  async run({ args }) {
    const parsedArgs = parseNewCommandArgs(args);
    const slugInput = parsedArgs.slug;
    const description = parsedArgs.description.trim();

    const normalizedSlug = normalizeSlug(slugInput);
    if (!normalizedSlug) {
      throw new Error("Slug must contain at least one alphanumeric character.");
    }
    if (normalizedSlug !== slugInput) {
      consola.info(`Normalized slug to '${normalizedSlug}'.`);
    }

    const config = resolveConfig(await loadGlobalConfig(), parsedArgs);
    requireAuth(config);
    await configureClient(config);

    if (parsedArgs.force) {
      const existing = await tryGetGameBySlug(normalizedSlug, {
        includeDeleted: true,
      });
      if (existing) {
        consola.warn(`Deleting existing game '${normalizedSlug}' (--force)...`);
        const { error: deleteError, response: deleteResponse } =
          await deleteGame({ path: { gameId: existing.id } });
        if (
          deleteError &&
          !isProblemType(
            toDreamboardApiError(
              deleteError,
              deleteResponse,
              `Failed to delete existing game '${normalizedSlug}'`,
            ),
            CLI_PROBLEM_TYPES.RESOURCE_NOT_FOUND,
          )
        ) {
          throw toDreamboardApiError(
            deleteError,
            deleteResponse,
            `Failed to delete existing game '${normalizedSlug}'`,
          );
        }
      }
    }

    const {
      data: game,
      error: createError,
      response: createResponse,
    } = await createGame({
      body: {
        name: titleFromSlug(normalizedSlug),
        slug: normalizedSlug,
        description,
        ruleText: "",
      },
    });
    if (createError || !game) {
      const apiError = toDreamboardApiError(
        createError,
        createResponse,
        "Failed to create game",
      );
      if (isProblemType(apiError, CLI_PROBLEM_TYPES.GAME_SLUG_CONFLICT)) {
        throw new Error(
          `Game with slug '${normalizedSlug}' already exists. Use --force to delete and recreate it, or choose a different slug.`,
        );
      }
      throw apiError;
    }

    try {
      const ruleId = await getLatestRuleIdSdk(game.id);

      const blankManifest: GameTopologyManifest = {
        players: {
          minPlayers: 2,
          maxPlayers: 4,
          optimalPlayers: 4,
        },
        cardSets: [],
        zones: [],
        boardTemplates: [],
        boards: [],
        pieceTypes: [],
        pieceSeeds: [],
        dieTypes: [],
        dieSeeds: [],
        resources: [],
        setupOptions: [],
        setupProfiles: [],
      };

      consola.start("Saving initial manifest...");
      const { manifestId, contentHash } = await saveManifestSdk(
        game.id,
        blankManifest,
        ruleId,
      );

      consola.start("Scaffolding local workspace...");

      const targetDir = path.resolve(process.cwd(), normalizedSlug);
      await ensureDir(targetDir);
      await writeManifest(targetDir, blankManifest);
      await writeRule(targetDir, "");

      await scaffoldStaticWorkspace(targetDir, "new");
      await applyWorkspaceCodegen({
        projectRoot: targetDir,
        manifest: blankManifest,
      });
      const localApiBaseUrl =
        ENVIRONMENT_CONFIGS.local?.apiBaseUrl ?? "http://localhost:8080";
      await installWorkspaceDependencies(targetDir, {
        localSdkPackageFallback:
          !IS_PUBLISHED_BUILD && config.apiBaseUrl === localApiBaseUrl,
      });

      await updateProjectState(
        targetDir,
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
            manifestContentHash: contentHash,
          },
        ),
      );
      await writeSnapshot(targetDir);

      await writeTextFile(path.join(targetDir, "feedback.md"), "");

      consola.success(`Created new game in ${targetDir}`);
      consola.info(
        "Next: edit your files, then run 'dreamboard sync' followed by 'dreamboard compile'.",
      );
    } catch (err) {
      consola.warn(`Creation failed, deleting game '${normalizedSlug}'...`);
      await deleteGame({ path: { gameId: game.id } });
      throw err;
    }
  },
});
