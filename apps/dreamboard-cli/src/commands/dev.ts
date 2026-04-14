import path from "node:path";
import { defineCommand } from "citty";
import {
  createSession,
  getSessionStatus,
  type CompiledResult,
} from "@dreamboard/api-client";
import consola from "consola";
import { CONFIG_FLAG_ARGS } from "../command-args.js";
import { PROJECT_DIR_NAME } from "../constants.js";
import { configureClient, resolveProjectContext } from "../config/resolve.js";
import { parseDevCommandArgs, parsePlayerCountFlags } from "../flags.js";
import type { ProjectConfig } from "../types.js";
import { ensureDir, exists, readJsonFile, writeJsonFile } from "../utils/fs.js";
import {
  createPersistedDevSession,
  parseDevSeed,
  type PersistedDevSession,
} from "../utils/dev-session.js";
import { resolvePlayerCount } from "../utils/player-count.js";
import { toDreamboardApiError } from "../utils/errors.js";
import { openBrowser } from "../auth/auth-server.js";
import { startDreamboardDevServer } from "../dev-host/start-dev-server.js";
import { runDevPreflight } from "../services/workflows/dev-preflight.js";
import { resolveSetupProfileIdForSession } from "../services/workflows/resolve-setup-profile.js";

type DevResumeResult = {
  session: PersistedDevSession | null;
  reason: string | null;
};

export default defineCommand({
  meta: {
    name: "dev",
    description:
      "Start a local iframe host for the current project while gameplay stays on the backend",
  },
  args: {
    seed: {
      type: "string",
      description: "Deterministic RNG seed for new sessions (defaults to 1337)",
    },
    "setup-profile": {
      type: "string",
      description:
        "Named setup profile to use when the manifest defines curated setup presets",
    },
    players: {
      type: "string",
      description: "Number of seats to create",
    },
    "player-count": {
      type: "string",
      description: "Number of seats to create (alias)",
    },
    debug: {
      type: "boolean",
      description:
        "Print browser/runtime logs and full SSE payloads in the terminal",
      default: false,
    },
    resume: {
      type: "string",
      description: "Resume a specific existing backend session by session id",
    },
    "new-session": {
      type: "boolean",
      description:
        "Deprecated alias for the default behavior of creating a fresh session",
      default: false,
    },
    open: {
      type: "boolean",
      description: "Open the local dev host in the browser",
      default: false,
    },
    port: {
      type: "string",
      description: "Preferred local Vite port (defaults to 5173)",
    },
    ...CONFIG_FLAG_ARGS,
  },
  async run({ args }) {
    const parsedArgs = parseDevCommandArgs(args);
    const { projectRoot, projectConfig, config } = await resolveProjectContext(
      parsedArgs,
      { requireAuth: false },
    );
    await configureClient(config);

    const preflight = await runDevPreflight({
      projectRoot,
      projectConfig,
    });
    for (const warning of preflight.warnings) {
      consola.warn(warning);
    }

    const devDir = path.join(projectRoot, PROJECT_DIR_NAME, "dev");
    await ensureDir(devDir);
    const sessionFilePath = path.join(devDir, "session.json");

    const requestedResumeSessionId = parsedArgs.resume?.trim() || null;
    if (requestedResumeSessionId && parsedArgs["new-session"]) {
      throw new Error("Cannot combine --resume with --new-session.");
    }
    const requestedSeed = parseDevSeed(parsedArgs.seed);
    const selectedSetupProfileId = await resolveSetupProfileIdForSession({
      projectRoot,
      requestedSetupProfileId: parsedArgs["setup-profile"],
    });
    const resolvedPlayerCount = await resolvePlayerCount(
      projectRoot,
      parsePlayerCountFlags(parsedArgs),
    );
    const persistedSession = requestedResumeSessionId
      ? await loadPersistedSession(sessionFilePath)
      : null;

    const resumeResult = requestedResumeSessionId
      ? await tryResumeSession(
          {
            sessionId: requestedResumeSessionId,
            cachedSession:
              persistedSession?.sessionId === requestedResumeSessionId
                ? persistedSession
                : null,
          },
          projectConfig.gameId,
          preflight.compiledResult.id,
          selectedSetupProfileId,
        )
      : { session: null, reason: null };

    if (requestedResumeSessionId && resumeResult.reason) {
      consola.warn(
        `Ignoring requested dev session ${requestedResumeSessionId}: ${resumeResult.reason}`,
      );
    }

    let runSession = resumeResult.session;
    const resumedExistingSession = Boolean(
      requestedResumeSessionId &&
        runSession &&
        runSession.sessionId === requestedResumeSessionId,
    );

    if (!runSession) {
      runSession = await createDevSession({
        projectRoot,
        projectConfig,
        playerCount: resolvedPlayerCount,
        seed: requestedSeed,
        compiledResult: preflight.compiledResult,
        setupProfileId: selectedSetupProfileId,
      });
    }

    await writeJsonFile(sessionFilePath, runSession);

    const preferredPort =
      typeof parsedArgs.port === "string" && parsedArgs.port.trim().length > 0
        ? Number.parseInt(parsedArgs.port, 10)
        : undefined;
    if (
      preferredPort !== undefined &&
      (!Number.isFinite(preferredPort) || preferredPort <= 0)
    ) {
      throw new Error("Invalid --port value. Expected a positive integer.");
    }

    const devServer = await startDreamboardDevServer({
      projectRoot,
      sessionFilePath,
      port: preferredPort,
      runtimeConfig: {
        apiBaseUrl: config.apiBaseUrl,
        authToken: config.authToken ?? null,
        userId: extractUserIdFromJwt(config.authToken ?? null),
        sessionId: runSession.sessionId,
        shortCode: runSession.shortCode,
        gameId: runSession.gameId,
        seed: runSession.seed ?? null,
        compiledResultId: preflight.compiledResult.id,
        setupProfileId: runSession.setupProfileId ?? null,
        playerCount: resolvedPlayerCount,
        debug: parsedArgs.debug,
        slug: projectConfig.slug,
        autoStartGame: !resumedExistingSession,
      },
    });

    consola.success(`Dreamboard dev host ready at ${devServer.url}`);
    consola.info(
      resumedExistingSession
        ? `Reusing session ${runSession.shortCode} (${runSession.sessionId}).`
        : `Created session ${runSession.shortCode} (${runSession.sessionId}).`,
    );
    consola.info(`Backend session id: ${runSession.sessionId}`);
    consola.info(
      `RNG seed: ${runSession.seed ?? "unknown"}${parsedArgs.seed ? " (from --seed)." : " (default 1337; change it in the dev host or pass --seed)."}`,
    );
    consola.info(
      parsedArgs.debug
        ? "Verbose dev logging enabled via --debug."
        : "Verbose browser and SSE logging is off by default. Pass --debug to enable it.",
    );
    consola.info(
      "UI edits will hot-reload in the iframe. Rule, manifest, and app changes still require sync/compile.",
    );
    console.log(`\nOpen Dreamboard dev host:\n${devServer.url}\n`);

    if (parsedArgs.open) {
      openBrowser(devServer.url);
    }

    await waitForTermination(async () => {
      await devServer.close();
    });
  },
});

async function loadPersistedSession(
  sessionFilePath: string,
): Promise<PersistedDevSession | null> {
  if (!(await exists(sessionFilePath))) {
    return null;
  }
  const value = await readJsonFile<PersistedDevSession>(sessionFilePath);
  if (!value.sessionId || !value.shortCode || !value.gameId) {
    return null;
  }
  return {
    ...value,
    seed:
      typeof value.seed === "number" && Number.isSafeInteger(value.seed)
        ? value.seed
        : undefined,
    controllablePlayerIds: Array.isArray(value.controllablePlayerIds)
      ? value.controllablePlayerIds
      : [],
    yourTurnCount:
      typeof value.yourTurnCount === "number" &&
      Number.isFinite(value.yourTurnCount)
        ? Math.max(0, Math.floor(value.yourTurnCount))
        : 0,
    setupProfileId:
      typeof value.setupProfileId === "string" &&
      value.setupProfileId.length > 0
        ? value.setupProfileId
        : undefined,
  };
}

async function tryResumeSession(
  requested: {
    sessionId: string;
    cachedSession: PersistedDevSession | null;
  },
  currentGameId: string,
  compiledResultId: string,
  setupProfileId: string | null,
): Promise<DevResumeResult> {
  const cached = requested.cachedSession;
  if (cached) {
    if (
      cached.compiledResultId &&
      cached.compiledResultId !== compiledResultId
    ) {
      return {
        session: null,
        reason: `compiled result changed from ${cached.compiledResultId} to ${compiledResultId}`,
      };
    }
    if ((cached.setupProfileId ?? null) !== setupProfileId) {
      return {
        session: null,
        reason: `setup profile changed from ${cached.setupProfileId ?? "none"} to ${setupProfileId ?? "none"}`,
      };
    }
  }

  const { data: status, error } = await getSessionStatus({
    path: { sessionId: requested.sessionId },
  });
  if (error || !status) {
    return {
      session: null,
      reason: "backend could not confirm that the session is still active",
    };
  }
  if (status.gameId !== currentGameId) {
    return {
      session: null,
      reason: "session belongs to a different game",
    };
  }
  if ((status.setupProfileId ?? null) !== setupProfileId) {
    return {
      session: null,
      reason: `setup profile changed from ${status.setupProfileId ?? "none"} to ${setupProfileId ?? "none"}`,
    };
  }
  if (status.status === "ended" || status.phase === "ended") {
    return {
      session: null,
      reason: "session has already ended",
    };
  }

  return {
    session: cached
      ? {
          ...cached,
          shortCode: status.shortCode,
          gameId: status.gameId,
          setupProfileId: status.setupProfileId ?? undefined,
          controllablePlayerIds: cached.controllablePlayerIds ?? [],
          yourTurnCount: cached.yourTurnCount ?? 0,
        }
      : createPersistedDevSession({
          sessionId: status.sessionId,
          shortCode: status.shortCode,
          gameId: status.gameId,
          setupProfileId: status.setupProfileId ?? undefined,
        }),
    reason: null,
  };
}

async function createDevSession(options: {
  projectRoot: string;
  projectConfig: ProjectConfig;
  playerCount: number;
  seed: number;
  compiledResult: CompiledResult;
  setupProfileId: string | null;
}): Promise<PersistedDevSession> {
  const {
    data: session,
    error: sessionError,
    response: sessionResponse,
  } = await createSession({
    path: { gameId: options.projectConfig.gameId },
    body: {
      compiledResultId: options.compiledResult.id,
      seed: options.seed,
      playerCount: options.playerCount,
      autoAssignSeats: true,
      setupProfileId: options.setupProfileId ?? undefined,
    },
  });
  if (sessionError || !session) {
    throw toDreamboardApiError(
      sessionError,
      sessionResponse,
      "Failed to create session",
    );
  }

  return createPersistedDevSession({
    sessionId: session.sessionId,
    shortCode: session.shortCode,
    gameId: session.gameId,
    seed: options.seed,
    compiledResultId: options.compiledResult.id,
    setupProfileId: options.setupProfileId ?? undefined,
  });
}

async function waitForTermination(close: () => Promise<void>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let shuttingDown = false;

    const cleanupListeners = () => {
      process.off("SIGINT", handleSigint);
      process.off("SIGTERM", handleSigterm);
    };

    const shutdown = (signal: string) => {
      if (shuttingDown) {
        return;
      }
      shuttingDown = true;
      cleanupListeners();
      void close()
        .then(() => {
          consola.info(`Stopped local dev host (${signal}).`);
          resolve();
        })
        .catch(reject);
    };

    const handleSigint = () => shutdown("SIGINT");
    const handleSigterm = () => shutdown("SIGTERM");

    process.on("SIGINT", handleSigint);
    process.on("SIGTERM", handleSigterm);
  });
}

function extractUserIdFromJwt(token: string | null): string | null {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1]!, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
