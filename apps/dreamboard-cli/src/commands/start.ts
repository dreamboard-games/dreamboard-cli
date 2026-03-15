import path from "node:path";
import { defineCommand } from "citty";
import consola from "consola";
import { createSession, startGame } from "@dreamboard/api-client";
import { CONFIG_FLAG_ARGS } from "../command-args.js";
import { PROJECT_DIR_NAME } from "../constants.js";
import { resolveProjectContext } from "../config/resolve.js";
import { parseStartCommandArgs } from "../flags.js";
import { ensureDir, writeJsonFile } from "../utils/fs.js";
import { resolveCompiledResultForRun } from "../services/workflows/resolve-run-result.js";
import { resolvePlayerCount } from "../ui/playwright-runner.js";
import { formatApiError } from "../utils/errors.js";
import { openBrowser } from "../auth/auth-server.js";

type PersistedRunSession = {
  sessionId: string;
  shortCode: string;
  gameId: string;
  seed?: number;
  compiledResultId?: string;
  createdAt: string;
  lastEventId?: string;
  controllablePlayerIds: string[];
  yourTurnCount: number;
};

const DEFAULT_RUN_SEED = 1337;
const MIN_KOTLIN_LONG = -9_223_372_036_854_775_808n;
const MAX_KOTLIN_LONG = 9_223_372_036_854_775_807n;
const MIN_SAFE_SEED = BigInt(Number.MIN_SAFE_INTEGER);
const MAX_SAFE_SEED = BigInt(Number.MAX_SAFE_INTEGER);

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

    const persistedSession: PersistedRunSession = {
      sessionId: session.sessionId,
      shortCode: startedSession.shortCode,
      gameId: session.gameId,
      seed,
      compiledResultId: latestCompiledResult.id,
      createdAt: new Date().toISOString(),
      controllablePlayerIds: [],
      yourTurnCount: 0,
    };
    await writeJsonFile(sessionFilePath, persistedSession);

    const playUrl = `${config.webBaseUrl.replace(/\/$/, "")}/play/${startedSession.shortCode}`;
    consola.success(`Started session ${startedSession.shortCode}.`);
    consola.info(`Session saved: ${sessionFilePath}`);
    consola.info(`Opening browser: ${playUrl}`);
    consola.info(`If the browser does not open, visit: ${playUrl}`);
    openBrowser(playUrl);
  },
});

function parseRunSeed(rawSeed: string | undefined): number {
  const value = rawSeed?.trim();
  if (!value) {
    return DEFAULT_RUN_SEED;
  }
  if (!/^-?\d+$/.test(value)) {
    throw new Error("seed must be an integer");
  }

  const parsed = BigInt(value);
  if (parsed < MIN_KOTLIN_LONG || parsed > MAX_KOTLIN_LONG) {
    throw new Error("seed must be within signed 64-bit integer range");
  }
  if (parsed < MIN_SAFE_SEED || parsed > MAX_SAFE_SEED) {
    throw new Error(
      `seed must be within JavaScript safe integer range (${Number.MIN_SAFE_INTEGER}..${Number.MAX_SAFE_INTEGER})`,
    );
  }

  return Number(parsed);
}
