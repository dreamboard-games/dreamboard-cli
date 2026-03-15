import path from "node:path";
import { defineCommand } from "citty";
import consola from "consola";
import {
  createGame,
  deleteGame,
  scaffoldGameSourcesV3,
} from "@dreamboard/api-client";
import type { BoardManifest } from "@dreamboard/sdk-types";
import {
  resolveConfig,
  requireAuth,
  configureClient,
} from "../config/resolve.js";
import { parseNewCommandArgs } from "../flags.js";
import { loadGlobalConfig } from "../config/global-config.js";
import { normalizeSlug, titleFromSlug } from "../utils/strings.js";
import { ensureDir, installSkillFile, writeTextFile } from "../utils/fs.js";
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
  writeScaffoldFiles,
} from "../services/project/local-files.js";
import { validateDynamicScaffoldResponse } from "../services/project/dynamic-scaffold-response.js";
import { updateProjectState } from "../config/project-config.js";
import { scaffoldStaticWorkspace } from "../services/project/static-scaffold.js";
import { formatApiError } from "../utils/errors.js";

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
        if (deleteError && deleteResponse?.status !== 404) {
          throw new Error(
            formatApiError(
              deleteError,
              deleteResponse,
              `Failed to delete existing game '${normalizedSlug}'`,
            ),
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
      if (createResponse?.status === 409) {
        throw new Error(
          `Game with slug '${normalizedSlug}' already exists. Use --force to delete and recreate it, or choose a different slug.`,
        );
      }
      throw new Error(
        formatApiError(createError, createResponse, "Failed to create game"),
      );
    }

    try {
      const ruleId = await getLatestRuleIdSdk(game.id);

      const blankManifest: BoardManifest = {
        cardSets: [],
        decks: [],
        dice: [],
        playerHandDefinitions: [],
        playerConfig: {
          minPlayers: 2,
          maxPlayers: 4,
          optimalPlayers: 4,
        },
        variableSchema: {
          globalVariableSchema: { properties: {} },
          playerVariableSchema: { properties: {} },
        },
        availableActions: [],
        stateMachine: {
          initialState: "setup",
          states: [
            {
              name: "setup",
              type: "AUTO",
              description: "Initial setup phase",
              transitions: [],
              availableActions: [],
            },
          ],
        },
      };

      consola.start("Saving initial manifest...");
      const { manifestId, contentHash } = await saveManifestSdk(
        game.id,
        blankManifest,
        ruleId,
      );

      consola.start("Scaffolding dynamic and static sources...");
      const {
        data: dynamicScaffold,
        error: dynamicError,
        response: dynamicResponse,
      } = await scaffoldGameSourcesV3({
        path: { gameId: game.id },
        body: {
          manifestId,
          ruleId,
          mode: "new",
          seedMissingOnly: true,
        },
      });
      if (dynamicError || !dynamicScaffold) {
        throw new Error(
          formatApiError(
            dynamicError,
            dynamicResponse,
            "Failed to scaffold dynamic sources",
          ),
        );
      }

      const targetDir = path.resolve(process.cwd(), normalizedSlug);
      await ensureDir(targetDir);

      const scaffoldFiles =
        validateDynamicScaffoldResponse(dynamicScaffold).allFiles;

      await writeScaffoldFiles(targetDir, scaffoldFiles);
      await writeManifest(targetDir, blankManifest);
      await writeRule(targetDir, "");

      await scaffoldStaticWorkspace(targetDir, "new", { updateSdk: true });

      await updateProjectState(targetDir, {
        gameId: game.id,
        slug: normalizedSlug,
        ruleId,
        manifestId,
        manifestContentHash: contentHash,
        apiBaseUrl: config.apiBaseUrl,
        webBaseUrl: config.webBaseUrl,
      });
      await writeSnapshot(targetDir);

      await installSkillFile(targetDir);
      await writeTextFile(path.join(targetDir, "feedback.md"), "");

      consola.success(`Created new game in ${targetDir}`);
      consola.info(
        "Next: edit manifest.json, then run 'dreamboard update' to scaffold.",
      );
    } catch (err) {
      consola.warn(`Creation failed, deleting game '${normalizedSlug}'...`);
      await deleteGame({ path: { gameId: game.id } });
      throw err;
    }
  },
});
