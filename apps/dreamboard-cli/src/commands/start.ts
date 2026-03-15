import path from "node:path";
import { defineCommand } from "citty";
import consola from "consola";
import { createSession, startGame } from "@dreamboard/api-client";
import { CONFIG_FLAG_ARGS } from "../command-args.js";
import { PROJECT_DIR_NAME } from "../constants.js";
import { resolveProjectContext } from "../config/resolve.js";
import { parseStartCommandArgs } from "../flags.js";
import { ensureDir, writeJsonFile } from "../utils/fs.js";
import {
  createPersistedRunSession,
  parseRunSeed,
} from "../utils/run-session.js";
import { resolveCompiledResultForRun } from "../services/workflows/resolve-run-result.js";
import { resolvePlayerCount } from "../ui/playwright-runner.js";
import { formatApiError } from "../utils/errors.js";
import { openBrowser } from "../auth/auth-server.js";

export default defineCommand({
  meta: {
    name: "start",
    description:
      "Start a fresh game session for the current project and open it in the browser",
  },
  args: {
    seed: {
      type: "string",
      description:
        "Deterministic RNG seed for the fresh session (defaults to 1337)",
    },
    players: {
      type: "string",
      description:
        "Number of seats to create (defaults to manifest.json minPlayers)",
    },
    ...CONFIG_FLAG_ARGS,
  },
  async run({ args }) {
    const parsedArgs = parseStartCommandArgs(args);
    const { projectRoot, projectConfig, config } =
      await resolveProjectContext(parsedArgs);

    const seed = parseRunSeed(parsedArgs.seed);
    const latestCompiledResult = await resolveCompiledResultForRun(
      projectRoot,
      projectConfig,
    );
    const playerCount = await resolvePlayerCount(projectRoot, {
      players: parsedArgs.players,
    });

    const {
      data: session,
      error: sessionError,
      response: sessionResponse,
    } = await createSession({
      path: { gameId: projectConfig.gameId },
      body: {
        compiledResultId: latestCompiledResult.id,
        seed,
        playerCount,
        autoAssignSeats: true,
      },
    });
    if (sessionError || !session) {
      throw new Error(
        formatApiError(
          sessionError,
          sessionResponse,
          "Failed to create session",
        ),
      );
    }

    const {
      data: startedSession,
      error: startError,
      response: startResponse,
    } = await startGame({
      path: { sessionId: session.sessionId },
    });
    if (startError || !startedSession) {
      throw new Error(
        formatApiError(startError, startResponse, "Failed to start game"),
      );
    }

    const runDir = path.join(projectRoot, PROJECT_DIR_NAME, "run");
    const sessionFilePath = path.join(runDir, "session.json");
    await ensureDir(runDir);

    const persistedSession = createPersistedRunSession({
      sessionId: session.sessionId,
      shortCode: startedSession.shortCode,
      gameId: session.gameId,
      seed,
      compiledResultId: latestCompiledResult.id,
    });
    await writeJsonFile(sessionFilePath, persistedSession);

    const playUrl = `${config.webBaseUrl.replace(/\/$/, "")}/play/${startedSession.shortCode}`;
    consola.success(`Started session ${startedSession.shortCode}.`);
    consola.info(`Session saved: ${sessionFilePath}`);
    consola.info(`Opening browser: ${playUrl}`);
    consola.info(`If the browser does not open, visit: ${playUrl}`);
    openBrowser(playUrl);
  },
});
