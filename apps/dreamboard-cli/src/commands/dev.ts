import path from "node:path";
import { defineCommand } from "citty";
import {
  createSession,
  getSessionBootstrap,
  type CompiledResult,
} from "@dreamboard/api-client";
import consola from "consola";
import { CONFIG_FLAG_ARGS } from "../command-args.js";
import { PROJECT_DIR_NAME } from "../constants.js";
import { configureClient, resolveProjectContext } from "../config/resolve.js";
import { parseDevCommandArgs, parsePlayerCountFlags } from "../flags.js";
import type { ProjectConfig } from "../types.js";
import { ensureDir, writeJsonFile } from "../utils/fs.js";
import {
  createPersistedDevSession,
  parseDevSeed,
} from "../utils/dev-session.js";
import { resolvePlayerCount } from "../utils/player-count.js";
import { toDreamboardApiError } from "../utils/errors.js";
import { openBrowser } from "../auth/auth-server.js";
import { startDreamboardDevServer } from "../dev-host/start-dev-server.js";
import { createSessionFromScenario } from "../services/testing/reducer-native-test-harness.js";
import { runDevPreflight } from "../services/workflows/dev-preflight.js";
import { resolveSetupProfileSelectionForSession } from "../services/workflows/resolve-setup-profile.js";

type DevResumeResult = {
  session: DevRunSession | null;
  reason: string | null;
};

type DevRunSession = {
  sessionId: string;
  shortCode: string;
  gameId: string;
  seed?: number;
  setupProfileId?: string;
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
    "from-scenario": {
      type: "string",
      description:
        "Create a backend session by replaying a typed test scenario to its post-when state",
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
    const requestedScenarioId = parsedArgs["from-scenario"]?.trim() || null;
    if (requestedResumeSessionId && parsedArgs["new-session"]) {
      throw new Error("Cannot combine --resume with --new-session.");
    }
    if (requestedResumeSessionId && requestedScenarioId) {
      throw new Error("Cannot combine --resume with --from-scenario.");
    }
    if (
      requestedScenarioId &&
      (parsedArgs.seed ||
        parsedArgs["setup-profile"] ||
        parsedArgs.players ||
        parsedArgs["player-count"])
    ) {
      throw new Error(
        "--from-scenario materializes the scenario's authored seed, setup profile, and player count. Remove --seed, --setup-profile, and player-count overrides.",
      );
    }

    const requestedSeed = requestedScenarioId
      ? null
      : parseDevSeed(parsedArgs.seed);
    const selectedSetupProfile = requestedScenarioId
      ? null
      : await resolveSetupProfileSelectionForSession({
          projectRoot,
          requestedSetupProfileId: parsedArgs["setup-profile"],
        });
    let selectedSetupProfileId = selectedSetupProfile?.id ?? null;
    let resolvedPlayerCount = requestedScenarioId
      ? 0
      : await resolvePlayerCount(
          projectRoot,
          parsePlayerCountFlags(parsedArgs),
        );
    const resumeResult = requestedResumeSessionId
      ? await tryResumeSession(
          { sessionId: requestedResumeSessionId },
          projectConfig.gameId,
          selectedSetupProfileId,
        )
      : { session: null, reason: null };

    if (requestedResumeSessionId && resumeResult.reason) {
      consola.warn(
        `Ignoring requested dev session ${requestedResumeSessionId}: ${resumeResult.reason}`,
      );
    }

    let runSession = resumeResult.session;
    let scenarioSeededSession = false;
    const resumedExistingSession = Boolean(
      requestedResumeSessionId &&
        runSession &&
        runSession.sessionId === requestedResumeSessionId,
    );

    if (requestedScenarioId) {
      const seededScenario = await createSessionFromScenario({
        projectRoot,
        scenarioId: requestedScenarioId,
        compiledResultId: preflight.compiledResult.id,
        gameId: projectConfig.gameId,
        debug: parsedArgs.debug,
      });
      scenarioSeededSession = true;
      selectedSetupProfileId = seededScenario.setupProfileId;
      resolvedPlayerCount = seededScenario.playerCount;
      runSession = {
        sessionId: seededScenario.sessionId,
        shortCode: seededScenario.shortCode,
        gameId: seededScenario.gameId,
        seed: seededScenario.seed,
        setupProfileId: seededScenario.setupProfileId ?? undefined,
      };
    } else if (!runSession) {
      runSession = await createDevSession({
        projectRoot,
        projectConfig,
        playerCount: resolvedPlayerCount,
        seed: requestedSeed ?? 1337,
        compiledResult: preflight.compiledResult,
        setupProfileId: selectedSetupProfileId,
      });
    }

    await writeJsonFile(
      sessionFilePath,
      createPersistedDevSession({ sessionId: runSession.sessionId }),
    );

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
      config,
      runtimeConfig: {
        apiBaseUrl: config.apiBaseUrl,
        userId: extractUserIdFromJwt(config.authToken ?? null),
        gameId: runSession.gameId,
        compiledResultId: preflight.compiledResult.id,
        setupProfileId: runSession.setupProfileId ?? null,
        playerCount: resolvedPlayerCount,
        debug: parsedArgs.debug,
        slug: projectConfig.slug,
        autoStartGame: !resumedExistingSession && !scenarioSeededSession,
        initialSession: {
          sessionId: runSession.sessionId,
          shortCode: runSession.shortCode,
          gameId: runSession.gameId,
          seed: runSession.seed ?? null,
        },
      },
    });

    consola.success(`Dreamboard dev host ready at ${devServer.url}`);
    consola.info(
      scenarioSeededSession
        ? `Seeded session ${runSession.shortCode} (${runSession.sessionId}) from scenario ${requestedScenarioId}.`
        : resumedExistingSession
          ? `Reusing session ${runSession.shortCode} (${runSession.sessionId}).`
          : `Created session ${runSession.shortCode} (${runSession.sessionId}).`,
    );
    consola.info(`Backend session id: ${runSession.sessionId}`);
    consola.info(
      `RNG seed: ${runSession.seed ?? "unknown"}${parsedArgs.seed ? " (from --seed)." : " (default 1337; change it in the dev host or pass --seed)."}`,
    );
    if (selectedSetupProfile?.source === "implicit-single") {
      consola.info(
        `Using setup profile ${selectedSetupProfileId} (${selectedSetupProfile.name ?? selectedSetupProfileId}) because it is the only declared manifest profile.`,
      );
    }
    if (selectedSetupProfile?.source === "implicit-first") {
      consola.info(
        `Using setup profile ${selectedSetupProfileId} (${selectedSetupProfile.name ?? selectedSetupProfileId}) because it is the first declared manifest profile.`,
      );
    }
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

async function tryResumeSession(
  requested: {
    sessionId: string;
  },
  currentGameId: string,
  setupProfileId: string | null,
): Promise<DevResumeResult> {
  const { data: bootstrap, error } = await getSessionBootstrap({
    path: { sessionId: requested.sessionId },
  });
  if (error || !bootstrap) {
    return {
      session: null,
      reason: "backend could not confirm that the session is still active",
    };
  }
  const session = bootstrap.session;
  if (session.gameId !== currentGameId) {
    return {
      session: null,
      reason: "session belongs to a different game",
    };
  }
  if ((session.setupProfileId ?? null) !== setupProfileId) {
    return {
      session: null,
      reason: `setup profile changed from ${session.setupProfileId ?? "none"} to ${setupProfileId ?? "none"}`,
    };
  }
  if (session.status === "ended" || session.phase === "ended") {
    return {
      session: null,
      reason: "session has already ended",
    };
  }

  return {
    session: {
      sessionId: session.sessionId,
      shortCode: session.shortCode,
      gameId: session.gameId,
      setupProfileId: session.setupProfileId ?? undefined,
    },
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
}): Promise<DevRunSession> {
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

  return {
    sessionId: session.sessionId,
    shortCode: session.shortCode,
    gameId: session.gameId,
    seed: options.seed,
    setupProfileId: options.setupProfileId ?? undefined,
  };
}

type TerminationOptions = {
  exitAfterShutdown?: boolean;
  exitProcess?: (code: number) => void;
};

export async function waitForTermination(
  close: () => Promise<void>,
  options: TerminationOptions = {},
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let shuttingDown = false;
    const exitAfterShutdown = options.exitAfterShutdown ?? true;
    const exitProcess = options.exitProcess ?? ((code) => process.exit(code));

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
          if (exitAfterShutdown) {
            exitProcess(0);
          }
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
