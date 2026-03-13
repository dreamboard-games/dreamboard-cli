import path from "node:path";
import { appendFile } from "node:fs/promises";
import { defineCommand } from "citty";
import consola from "consola";
import {
  createSession,
  getSessionStatus,
  submitAction,
  startGame,
  subscribeToSessionEvents,
  type GameMessage,
  type SessionStatus,
  type YourTurnMessage,
} from "@dreamboard/api-client";
import { CONFIG_FLAG_ARGS, SCREENSHOT_CAPTURE_ARGS } from "../command-args.js";
import type { RunCommandArgs } from "../flags.js";
import type { ApiScenarioStep, ProjectConfig, UiStep } from "../types.js";
import { DEFAULT_TURN_DELAY_MS, PROJECT_DIR_NAME } from "../constants.js";
import { resolveProjectContext } from "../config/resolve.js";
import { parseRunCommandArgs, parsePlayerCountFlags } from "../flags.js";
import {
  ensureDir,
  exists,
  readJsonFile,
  writeJsonFile,
  writeTextFile,
} from "../utils/fs.js";
import { resolveCompiledResultForRun } from "../services/workflows/resolve-run-result.js";
import {
  isTurnEvent,
  runUiSteps,
  resolvePlayerCount,
  buildBrowserAuthInitScript,
  waitForGameReady,
} from "../ui/playwright-runner.js";
import { formatApiError } from "../utils/errors.js";
import { parsePositiveInt, sleep } from "../utils/strings.js";

type RunUntil = "YOUR_TURN" | "GAME_ENDED" | "ANY";
type ObserveEvents = "turns" | "all";
type ScenarioDriver = "api" | "ui";
const DEFAULT_NO_EVENT_TIMEOUT_MS = 10_000;
const DEFAULT_RUN_SEED = 1337;
const MIN_KOTLIN_LONG = -9_223_372_036_854_775_808n;
const MAX_KOTLIN_LONG = 9_223_372_036_854_775_807n;
const MIN_SAFE_SEED = BigInt(Number.MIN_SAFE_INTEGER);
const MAX_SAFE_SEED = BigInt(Number.MAX_SAFE_INTEGER);
type RunExitReason =
  | "until_reached"
  | "timeout"
  | "max_events"
  | "scenario_completed"
  | "scenario_rejected"
  | "stream_closed";

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

type PersistedYourTurnContext = {
  sessionId: string;
  shortCode: string;
  eventId: string | null;
  observedAt: string;
  controllablePlayerIds: string[];
  activePlayers: string[];
  eligiblePlayerIds: string[];
  turnNumber: number;
  message: YourTurnMessage;
};

type ObserveResult = {
  eventCount: number;
  exitReason: RunExitReason;
  stopDetail: string;
  stopEventType?: GameMessage["type"];
  stopEventId?: string;
  gameStatePhase?: string;
  lastEventId: string | undefined;
  controllablePlayerIds: string[];
  yourTurnCount: number;
};

type ScenarioEventStreamState = {
  eventCount: number;
  gameStatePhase?: string;
  lastEventId: string | undefined;
  controllablePlayerIds: string[];
  yourTurnCount: number;
};

type ScenarioEventStream = {
  waitForYourTurnContext: (
    timeoutMs: number,
  ) => Promise<PersistedYourTurnContext>;
  waitForTurns: (turns: number) => Promise<void>;
  waitForActionOutcome: (expected: {
    playerId: string;
    actionType: string;
    timeoutMs: number;
  }) => Promise<ScenarioActionOutcome>;
  getState: () => ScenarioEventStreamState;
  close: () => void;
};

type ScenarioActionOutcome =
  | {
      kind: "executed";
      eventId: string | null;
      playerId: string;
      actionType: string;
    }
  | {
      kind: "rejected";
      eventId: string | null;
      reason: string;
      errorCode?: string;
      targetPlayer?: string;
    };

type RunCommandRuntime = {
  isEmbeddedHarness: boolean;
  playBaseUrl: string | null;
  harnessBaseUrl: string | null;
  sessionRuntime: {
    gameId: string;
    compiledResultId: string;
  } | null;
  cleanup: () => Promise<void>;
};

class ScenarioActionRejectedError extends Error {
  readonly stepIndex: number;
  readonly stepPlayerId: string;
  readonly stepActionType: string;

  constructor(options: {
    stepIndex: number;
    stepPlayerId: string;
    stepActionType: string;
    reason: string;
  }) {
    super(
      `Scenario rejected at step ${options.stepIndex + 1} (player=${options.stepPlayerId}, action=${options.stepActionType}): ${options.reason}`,
    );
    this.name = "ScenarioActionRejectedError";
    this.stepIndex = options.stepIndex;
    this.stepPlayerId = options.stepPlayerId;
    this.stepActionType = options.stepActionType;
  }
}

type RunSummary = {
  startedAt: string;
  finishedAt: string;
  sessionId: string;
  shortCode: string;
  scenario: string | null;
  command: {
    resume: boolean;
    newSession: boolean;
    seed: number;
    until: RunUntil;
    observeEvents: ObserveEvents;
    scenarioDriver: ScenarioDriver;
    timeoutMs?: number;
    maxEvents?: number;
    screenshot: boolean;
    headless: boolean;
  };
  exitReason: RunExitReason;
  stopDetail: string;
  seed: number;
  gameStatePhase?: string;
  eventCount: number;
};

export default defineCommand({
  meta: {
    name: "run",
    description:
      "Run the game, observe SSE turn events, and optionally execute scenario steps or capture screenshots",
  },
  args: {
    scenario: { type: "string", description: "Run scenario steps from JSON" },
    seed: {
      type: "string",
      description: "Deterministic RNG seed for new sessions (defaults to 1337)",
    },
    players: { type: "string", description: "Number of seats to create" },
    "player-count": {
      type: "string",
      description: "Number of seats to create (alias)",
    },
    headless: { type: "boolean", description: "Run headless", default: true },
    resume: {
      type: "boolean",
      description: "Reuse last run session if active",
      default: true,
    },
    "new-session": {
      type: "boolean",
      description: "Ignore cached session and create a new one",
      default: false,
    },
    until: {
      type: "string",
      description: "Stop condition: YOUR_TURN | GAME_ENDED | ANY",
      default: "YOUR_TURN",
    },
    "observe-events": {
      type: "string",
      description: "Persist observed events: turns | all",
      default: "turns",
    },
    "scenario-driver": {
      type: "string",
      description:
        "Scenario execution driver: api (default) uses submitAction, ui uses Playwright input events",
      default: "api",
    },
    "timeout-ms": {
      type: "string",
      description:
        "Abort observe loop after no events are received for timeout milliseconds (default: 10000)",
    },
    "max-events": {
      type: "string",
      description: "Abort observe loop after processing this many events",
    },
    screenshot: {
      type: "boolean",
      description:
        "Capture a Playwright screenshot (launches browser only when this or --scenario-driver ui is provided)",
      default: false,
    },
    ...SCREENSHOT_CAPTURE_ARGS,
    ...CONFIG_FLAG_ARGS,
  },
  async run({ args }) {
    const startedAt = new Date().toISOString();
    const parsedArgs = parseRunCommandArgs(args);
    const useEmbeddedHarness = shouldUseEmbeddedHarness();
    const { projectRoot, projectConfig, config } = await resolveProjectContext(
      parsedArgs,
      { requireAuth: !useEmbeddedHarness },
    );
    const runtime = await resolveRunCommandRuntime({
      useEmbeddedHarness,
      projectRoot,
      projectConfig,
      webBaseUrl: config.webBaseUrl,
      parsedArgs,
    });

    const runDir = path.join(projectRoot, PROJECT_DIR_NAME, "run");
    await ensureDir(runDir);
    const sessionFilePath = path.join(runDir, "session.json");
    const eventsFilePath = path.join(runDir, "events.ndjson");
    const yourTurnFilePath = path.join(runDir, "latest-your-turn.json");
    const summaryFilePath = path.join(runDir, "last-run-summary.json");

    const shouldResume =
      !runtime.isEmbeddedHarness &&
      parsedArgs.resume &&
      !parsedArgs["new-session"];
    const until = parsedArgs.until as RunUntil;
    const observeEvents = parsedArgs["observe-events"] as ObserveEvents;
    const scenarioDriver = parsedArgs["scenario-driver"] as ScenarioDriver;
    const timeoutMs =
      parseOptionalPositiveInt(parsedArgs["timeout-ms"], "timeout-ms") ??
      DEFAULT_NO_EVENT_TIMEOUT_MS;
    const maxEvents = parseOptionalPositiveInt(
      parsedArgs["max-events"],
      "max-events",
    );
    const requestedSeed = parseRunSeed(parsedArgs.seed);

    try {
      let persistedSession: PersistedRunSession | null = null;
      if (shouldResume) {
        persistedSession = await loadPersistedSession(sessionFilePath);
      }

      let runSession = persistedSession
        ? await tryResumeSession(persistedSession)
        : null;
      const resumedExistingSession = Boolean(
        persistedSession &&
          runSession &&
          runSession.sessionId === persistedSession.sessionId,
      );
      if (!runSession) {
        runSession = await createAndStartSession(
          projectRoot,
          projectConfig,
          parsedArgs,
          requestedSeed,
          runtime.sessionRuntime,
        );
      }
      const seed = runSession.seed ?? requestedSeed;
      if (!resumedExistingSession) {
        // Start a fresh event log whenever this run is not continuing the same session.
        await writeTextFile(eventsFilePath, "");
      }

      const playUrl = runtime.playBaseUrl
        ? `${runtime.playBaseUrl.replace(/\/$/, "")}/play/${runSession.shortCode}`
        : null;
      await writeJsonFile(sessionFilePath, runSession);

      const scenarioPath = parsedArgs.scenario ?? null;
      const shouldCaptureScreenshot = parsedArgs.screenshot;
      const screenshotDelayMs = shouldCaptureScreenshot
        ? (parseOptionalPositiveInt(parsedArgs.delay, "delay") ?? 3000)
        : undefined;
      const screenshotWidth = shouldCaptureScreenshot
        ? (parseOptionalPositiveInt(parsedArgs.width, "width") ?? 390)
        : undefined;
      const screenshotHeight = shouldCaptureScreenshot
        ? (parseOptionalPositiveInt(parsedArgs.height, "height") ?? 844)
        : undefined;
      const requiresPlaywright = Boolean(
        shouldCaptureScreenshot || (scenarioPath && scenarioDriver === "ui"),
      );

      let browser: import("playwright").Browser | null = null;
      let page: import("playwright").Page | null = null;
      let eventCount = 0;
      let exitReason: RunExitReason = "stream_closed";
      let stopDetail = "SSE stream closed before any stop condition was met.";
      let gameStatePhase: string | undefined;

      try {
        if (requiresPlaywright) {
          if (!playUrl) {
            throw new Error(
              "Playwright-backed run modes are unavailable when DREAMBOARD_EMBEDDED_HARNESS is enabled.",
            );
          }

          const { chromium } = await import("playwright");
          browser = await chromium.launch({ headless: parsedArgs.headless });
          const context = await browser.newContext(
            shouldCaptureScreenshot && screenshotWidth && screenshotHeight
              ? {
                  viewport: {
                    width: screenshotWidth,
                    height: screenshotHeight,
                  },
                  deviceScaleFactor: 2,
                }
              : undefined,
          );

          const initScript = await buildBrowserAuthInitScript(config);
          if (initScript) {
            await context.addInitScript({ content: initScript });
          }

          page = await context.newPage();
          await page.goto(playUrl, { waitUntil: "domcontentloaded" });
          await waitForGameReady(page);
        }

        if (scenarioPath) {
          const scenario =
            await readJsonFile<Record<string, unknown>>(scenarioPath);
          if (!Array.isArray(scenario.steps)) {
            throw new Error("Scenario JSON must include a 'steps' array.");
          }

          const scenarioEventStream = await startScenarioEventStream({
            yourTurnFilePath,
            sessionId: runSession.sessionId,
            shortCode: runSession.shortCode,
            observeEvents,
            eventsFilePath,
            persisted: runSession,
          });
          let scenarioRejectedError: ScenarioActionRejectedError | null = null;
          try {
            const existingContext =
              await loadOptionalYourTurnContext(yourTurnFilePath);
            let latestTurnContext: PersistedYourTurnContext;
            if (
              existingContext &&
              existingContext.sessionId === runSession.sessionId
            ) {
              latestTurnContext = existingContext;
            } else {
              consola.info(
                "No current YOUR_TURN context for this session. Observing SSE until first YOUR_TURN before executing scenario.",
              );
              latestTurnContext =
                await scenarioEventStream.waitForYourTurnContext(timeoutMs);
            }
            gameStatePhase = latestTurnContext.message.gameState.currentState;

            if (scenarioDriver === "ui") {
              if (!page) {
                throw new Error(
                  "UI scenario execution requires Playwright page context, but browser was not initialized.",
                );
              }
              const outputDir = path.join(
                projectRoot,
                PROJECT_DIR_NAME,
                "screenshots",
              );
              await ensureDir(outputDir);

              const scenarioSteps = parseUiScenarioSteps(scenario.steps);
              const stepsToRun = scenarioSteps;
              validateScenarioPlayersForRun(
                stepsToRun,
                latestTurnContext,
                scenarioDriver,
              );
              await runUiSteps(page, stepsToRun, outputDir, {
                waitForTurns: scenarioEventStream.waitForTurns,
                close: () => {
                  // Owned by run command scope.
                },
              });
            } else {
              const scenarioSteps = parseApiScenarioSteps(scenario.steps);
              const stepsToRun = scenarioSteps;
              validateScenarioPlayersForRun(
                stepsToRun,
                latestTurnContext,
                scenarioDriver,
              );
              await runApiSteps(
                runSession.sessionId,
                stepsToRun,
                scenarioEventStream.waitForTurns,
                scenarioEventStream.waitForActionOutcome,
                timeoutMs,
              );
            }
          } catch (error) {
            if (error instanceof ScenarioActionRejectedError) {
              scenarioRejectedError = error;
            } else {
              throw error;
            }
          } finally {
            scenarioEventStream.close();
          }
          const scenarioState = scenarioEventStream.getState();
          runSession.lastEventId = scenarioState.lastEventId;
          runSession.controllablePlayerIds =
            scenarioState.controllablePlayerIds;
          runSession.yourTurnCount = scenarioState.yourTurnCount;
          eventCount = scenarioState.eventCount;
          gameStatePhase = scenarioState.gameStatePhase ?? gameStatePhase;
          if (scenarioRejectedError) {
            exitReason = "scenario_rejected";
            stopDetail = scenarioRejectedError.message;
            process.exitCode = 1;
          } else {
            exitReason = "scenario_completed";
            stopDetail = `Scenario execution completed (${scenarioDriver}, steps=${scenario.steps.length}).`;
          }
        } else {
          const observeResult = await observeSessionEvents({
            sessionId: runSession.sessionId,
            shortCode: runSession.shortCode,
            until,
            observeEvents,
            timeoutMs,
            maxEvents,
            eventsFilePath,
            yourTurnFilePath,
            persisted: runSession,
          });
          runSession.lastEventId = observeResult.lastEventId;
          runSession.controllablePlayerIds =
            observeResult.controllablePlayerIds;
          runSession.yourTurnCount = observeResult.yourTurnCount;
          eventCount = observeResult.eventCount;
          exitReason = observeResult.exitReason;
          stopDetail = observeResult.stopDetail;
          gameStatePhase = observeResult.gameStatePhase;
        }

        if (shouldCaptureScreenshot) {
          if (!page) {
            throw new Error(
              "Screenshot capture requires Playwright page context, but browser was not initialized.",
            );
          }
          const outputDir = path.join(
            projectRoot,
            PROJECT_DIR_NAME,
            "screenshots",
          );
          await ensureDir(outputDir);
          const screenshotPath =
            parsedArgs.output ?? path.join(outputDir, `run-${Date.now()}.png`);
          if (screenshotDelayMs && screenshotDelayMs > 0) {
            await sleep(screenshotDelayMs);
          }
          await page.screenshot({ path: screenshotPath });
          consola.info(`Saved screenshot: ${screenshotPath}`);
        }

        await writeJsonFile(sessionFilePath, runSession);
        const finishedAt = new Date().toISOString();
        const summary: RunSummary = {
          startedAt,
          finishedAt,
          sessionId: runSession.sessionId,
          shortCode: runSession.shortCode,
          scenario: scenarioPath,
          command: {
            resume: shouldResume,
            newSession: parsedArgs["new-session"],
            seed,
            until,
            observeEvents,
            scenarioDriver,
            timeoutMs,
            maxEvents,
            screenshot: shouldCaptureScreenshot,
            headless: parsedArgs.headless,
          },
          exitReason,
          stopDetail,
          seed,
          gameStatePhase,
          eventCount,
        };
        await writeJsonFile(summaryFilePath, summary);

        if (playUrl) {
          consola.success(`Session running at ${playUrl}`);
        } else {
          consola.success(
            `Session running on embedded harness backend ${runtime.harnessBaseUrl ?? "(unknown)"} (shortCode=${runSession.shortCode}).`,
          );
        }
        if (scenarioPath) {
          if (exitReason === "scenario_completed") {
            consola.success(`Executed scenario steps from ${scenarioPath}`);
          } else {
            consola.warn(`Scenario execution stopped: ${stopDetail}`);
          }
        } else {
          consola.success(
            `Observed ${eventCount} events and exited with '${exitReason}'.`,
          );
          if (exitReason === "timeout" && eventCount === 0) {
            consola.warn(
              `No messages received from SSE for ${timeoutMs}ms. Exiting run.`,
            );
          }
        }
        consola.info(`Stop reason: ${exitReason}`);
        consola.info(`Stop detail: ${stopDetail}`);
        consola.info(`Seed: ${seed}`);
        consola.info(
          `Relevant config: seed=${seed}, until=${until}, observeEvents=${observeEvents}, scenarioDriver=${scenarioDriver}, timeoutMs=${timeoutMs ?? "none"}, maxEvents=${maxEvents ?? "none"}, screenshot=${shouldCaptureScreenshot}, resume=${shouldResume}, newSession=${parsedArgs["new-session"]}`,
        );
        consola.info(`Run artifacts: ${runDir}`);
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    } finally {
      await runtime.cleanup();
    }
  },
});

async function loadPersistedSession(
  sessionFilePath: string,
): Promise<PersistedRunSession | null> {
  if (!(await exists(sessionFilePath))) {
    return null;
  }
  const value = await readJsonFile<PersistedRunSession>(sessionFilePath);
  if (!value.sessionId || !value.shortCode || !value.gameId) {
    return null;
  }
  return {
    ...value,
    seed:
      typeof value.seed === "number" && Number.isSafeInteger(value.seed)
        ? value.seed
        : undefined,
    lastEventId: normalizeReplayCursorId(value.lastEventId),
    controllablePlayerIds: Array.isArray(value.controllablePlayerIds)
      ? value.controllablePlayerIds
      : [],
    yourTurnCount:
      typeof value.yourTurnCount === "number" &&
      Number.isFinite(value.yourTurnCount)
        ? Math.max(0, Math.floor(value.yourTurnCount))
        : 0,
  };
}

async function tryResumeSession(
  cached: PersistedRunSession,
): Promise<PersistedRunSession | null> {
  const { data: status } = await getSessionStatus({
    path: { sessionId: cached.sessionId },
  });
  if (!status || status.status === "ended") {
    return null;
  }

  const readyStatus = await ensureGameplay(status);
  return {
    ...cached,
    shortCode: readyStatus.shortCode,
    gameId: readyStatus.gameId,
    controllablePlayerIds: cached.controllablePlayerIds ?? [],
    yourTurnCount: cached.yourTurnCount ?? 0,
  };
}

async function createAndStartSession(
  projectRoot: string,
  projectConfig: ProjectConfig,
  parsedArgs: RunCommandArgs,
  seed: number,
  runtimeSession?: {
    gameId: string;
    compiledResultId: string;
  } | null,
): Promise<PersistedRunSession> {
  const latestCompiledResult = runtimeSession
    ? null
    : await resolveCompiledResultForRun(projectRoot, projectConfig);
  const playerFlags = parsePlayerCountFlags(parsedArgs);
  const playerCount = await resolvePlayerCount(projectRoot, playerFlags);
  const gameId = runtimeSession?.gameId ?? projectConfig.gameId;
  const compiledResultId =
    runtimeSession?.compiledResultId ?? latestCompiledResult?.id;
  if (!compiledResultId) {
    throw new Error("Failed to resolve a compiled result for this run.");
  }

  const {
    data: session,
    error: sessionError,
    response: sessionResponse,
  } = await createSession({
    path: { gameId },
    body: {
      compiledResultId,
      seed,
      playerCount,
      autoAssignSeats: true,
    },
  });
  if (sessionError || !session) {
    throw new Error(
      formatApiError(sessionError, sessionResponse, "Failed to create session"),
    );
  }

  const {
    data: startData,
    error: startError,
    response: startResponse,
  } = await startGame({
    path: { sessionId: session.sessionId },
  });
  if (startError || !startData) {
    throw new Error(
      formatApiError(startError, startResponse, "Failed to start game"),
    );
  }

  return {
    sessionId: session.sessionId,
    shortCode: startData.shortCode,
    gameId: session.gameId,
    seed,
    compiledResultId,
    createdAt: new Date().toISOString(),
    controllablePlayerIds: [],
    yourTurnCount: 0,
  };
}

function shouldUseEmbeddedHarness(): boolean {
  const flag = process.env.DREAMBOARD_EMBEDDED_HARNESS;
  return flag === "1" || flag === "true";
}

async function resolveRunCommandRuntime(options: {
  useEmbeddedHarness: boolean;
  projectRoot: string;
  projectConfig: ProjectConfig;
  webBaseUrl: string;
  parsedArgs: RunCommandArgs;
}): Promise<RunCommandRuntime> {
  if (!options.useEmbeddedHarness) {
    return {
      isEmbeddedHarness: false,
      playBaseUrl: options.webBaseUrl,
      harnessBaseUrl: null,
      sessionRuntime: null,
      cleanup: async () => undefined,
    };
  }

  if (options.parsedArgs.screenshot) {
    throw new Error(
      "DREAMBOARD_EMBEDDED_HARNESS does not support --screenshot. Use smoke:web against the local web app instead.",
    );
  }

  if (options.parsedArgs["scenario-driver"] === "ui") {
    throw new Error(
      "DREAMBOARD_EMBEDDED_HARNESS does not support --scenario-driver ui. Use smoke:web for browser-driven scenarios.",
    );
  }

  const harness = await startEmbeddedRunHarness({
    projectRoot: options.projectRoot,
    projectConfig: options.projectConfig,
  });
  return {
    isEmbeddedHarness: true,
    playBaseUrl: null,
    harnessBaseUrl: harness.baseUrl,
    sessionRuntime: {
      gameId: harness.gameId,
      compiledResultId: harness.compiledResultId,
    },
    cleanup: harness.stop,
  };
}

async function startEmbeddedRunHarness(options: {
  projectRoot: string;
  projectConfig: ProjectConfig;
}): Promise<{
  gameId: string;
  compiledResultId: string;
  baseUrl: string;
  stop: () => Promise<void>;
}> {
  if (typeof Bun === "undefined") {
    throw new Error(
      "Local embedded harness requires Bun from a source checkout. Run `bun run dist/index.js run ... --env local`, or use a local backend/web stack instead.",
    );
  }

  const module = await import("../services/testing/embedded-harness.js");
  return module.startEmbeddedHarnessSession(options);
}

async function ensureGameplay(status: SessionStatus): Promise<SessionStatus> {
  if (status.phase !== "lobby") {
    return status;
  }

  const {
    data: startData,
    error: startError,
    response: startResponse,
  } = await startGame({
    path: { sessionId: status.sessionId },
  });
  if (startError || !startData) {
    throw new Error(
      formatApiError(startError, startResponse, "Failed to start resumed game"),
    );
  }

  return {
    ...status,
    shortCode: startData.shortCode,
    phase: "gameplay",
  };
}

async function loadOptionalYourTurnContext(
  yourTurnFilePath: string,
): Promise<PersistedYourTurnContext | null> {
  if (!(await exists(yourTurnFilePath))) {
    return null;
  }
  return readJsonFile<PersistedYourTurnContext>(yourTurnFilePath);
}

async function startScenarioEventStream(options: {
  yourTurnFilePath: string;
  sessionId: string;
  shortCode: string;
  observeEvents: ObserveEvents;
  eventsFilePath: string;
  persisted: PersistedRunSession;
}): Promise<ScenarioEventStream> {
  const abortController = new AbortController();
  const eventIdByMessage = new WeakMap<object, string>();
  let closingRequested = false;
  let streamClosed = false;
  let streamError: Error | null = null;

  let lastReplayCursorId = normalizeReplayCursorId(
    options.persisted.lastEventId,
  );
  let controllablePlayerIds = [...options.persisted.controllablePlayerIds];
  let yourTurnCount = options.persisted.yourTurnCount;
  let eventCount = 0;
  let gameStatePhase: string | undefined;
  let turnProgressCount = 0;
  let latestYourTurnContext: PersistedYourTurnContext | null = null;

  const yourTurnWaiters: Array<{
    resolve: (context: PersistedYourTurnContext) => void;
    reject: (error: Error) => void;
    timeoutHandle: ReturnType<typeof setTimeout>;
  }> = [];
  const turnWaiters: Array<{
    target: number;
    resolve: () => void;
    timeoutHandle: ReturnType<typeof setTimeout>;
  }> = [];
  const actionWaiters: Array<{
    expectedPlayerId: string;
    expectedActionType: string;
    resolve: (outcome: ScenarioActionOutcome) => void;
    reject: (error: Error) => void;
    timeoutHandle: ReturnType<typeof setTimeout>;
  }> = [];
  const actionOutcomeBacklog: ScenarioActionOutcome[] = [];

  const actionOutcomeMatchesExpectation = (
    outcome: ScenarioActionOutcome,
    expectedPlayerId: string,
    expectedActionType: string,
  ): boolean => {
    if (outcome.kind === "executed") {
      return (
        expectedPlayerId === outcome.playerId &&
        expectedActionType === outcome.actionType
      );
    }
    return !outcome.targetPlayer || expectedPlayerId === outcome.targetPlayer;
  };

  const resolveTurnWaiters = () => {
    const remaining: typeof turnWaiters = [];
    for (const waiter of turnWaiters) {
      if (turnProgressCount >= waiter.target) {
        clearTimeout(waiter.timeoutHandle);
        waiter.resolve();
      } else {
        remaining.push(waiter);
      }
    }
    turnWaiters.length = 0;
    turnWaiters.push(...remaining);
  };

  const resolveYourTurnWaiters = (context: PersistedYourTurnContext) => {
    for (const waiter of yourTurnWaiters) {
      clearTimeout(waiter.timeoutHandle);
      waiter.resolve(context);
    }
    yourTurnWaiters.length = 0;
  };

  const rejectYourTurnWaiters = (error: Error) => {
    for (const waiter of yourTurnWaiters) {
      clearTimeout(waiter.timeoutHandle);
      waiter.reject(error);
    }
    yourTurnWaiters.length = 0;
  };

  const resolvePendingTurnWaiters = () => {
    for (const waiter of turnWaiters) {
      clearTimeout(waiter.timeoutHandle);
      waiter.resolve();
    }
    turnWaiters.length = 0;
  };

  const resolveActionWaiter = (outcome: ScenarioActionOutcome) => {
    const index = actionWaiters.findIndex((waiter) => {
      return actionOutcomeMatchesExpectation(
        outcome,
        waiter.expectedPlayerId,
        waiter.expectedActionType,
      );
    });
    if (index < 0) {
      actionOutcomeBacklog.push(outcome);
      return;
    }
    const [waiter] = actionWaiters.splice(index, 1);
    clearTimeout(waiter.timeoutHandle);
    waiter.resolve(outcome);
  };

  const rejectActionWaiters = (error: Error) => {
    for (const waiter of actionWaiters) {
      clearTimeout(waiter.timeoutHandle);
      waiter.reject(error);
    }
    actionWaiters.length = 0;
  };

  const lastMessageId = parseEventIdAsNumber(lastReplayCursorId);
  const { stream } = await subscribeToSessionEvents({
    path: { sessionId: options.sessionId },
    query: lastMessageId ? { lastMessageId } : undefined,
    signal: abortController.signal,
    onSseEvent: (sseEvent) => {
      if (
        typeof sseEvent.data === "object" &&
        sseEvent.data !== null &&
        typeof sseEvent.id === "string"
      ) {
        eventIdByMessage.set(sseEvent.data as object, sseEvent.id);
      }
      const replayableId = normalizeReplayCursorId(sseEvent.id);
      if (replayableId) {
        lastReplayCursorId = replayableId;
      }
    },
  });

  void (async () => {
    try {
      for await (const event of stream as AsyncGenerator<GameMessage>) {
        if (!event) {
          continue;
        }
        const eventId =
          eventIdByMessage.get(event as unknown as object) ?? null;
        const observedGameStatePhase = extractGameStatePhase(event);
        if (observedGameStatePhase) {
          gameStatePhase = observedGameStatePhase;
        }
        if (event.type === "GAME_STARTED") {
          controllablePlayerIds = [...event.controllablePlayerIds];
        }
        if (eventId === "bootstrap") {
          consola.info(
            `[SSE] type=${event.type} id=bootstrap (ignored for replay/persistence)`,
          );
          continue;
        }

        eventCount += 1;
        const observedAt = new Date().toISOString();
        if (shouldPersistObservedEvent(options.observeEvents, event)) {
          const eventRecord = {
            observedAt,
            sessionId: options.sessionId,
            eventId,
            type: event.type,
            message: event,
          };
          await appendFile(
            options.eventsFilePath,
            `${JSON.stringify(eventRecord)}\n`,
          );
        }

        if (event.type === "YOUR_TURN") {
          yourTurnCount += 1;
          const eligiblePlayerIds = controllablePlayerIds.filter((playerId) =>
            event.activePlayers.includes(playerId),
          );
          const turnContext: PersistedYourTurnContext = {
            sessionId: options.sessionId,
            shortCode: options.shortCode,
            eventId,
            observedAt,
            controllablePlayerIds: [...controllablePlayerIds],
            activePlayers: [...event.activePlayers],
            eligiblePlayerIds,
            turnNumber: yourTurnCount,
            message: event,
          };
          latestYourTurnContext = turnContext;
          await writeJsonFile(options.yourTurnFilePath, turnContext);
          consola.info(
            `[SSE] type=YOUR_TURN id=${eventId ?? "none"} turn=${yourTurnCount} active=${event.activePlayers.length} eligible=${eligiblePlayerIds.length}`,
          );
          resolveYourTurnWaiters(turnContext);
        } else if (event.type === "ACTION_REJECTED") {
          const rejectionDetails = [
            `reason=${shortenForLog(event.reason)}`,
            event.errorCode ? `errorCode=${event.errorCode}` : null,
            event.targetPlayer ? `targetPlayer=${event.targetPlayer}` : null,
          ]
            .filter((value): value is string => Boolean(value))
            .join(" ");
          consola.warn(
            `[SSE] type=ACTION_REJECTED id=${eventId ?? "none"} ${rejectionDetails}`,
          );
          resolveActionWaiter({
            kind: "rejected",
            eventId,
            reason: event.reason,
            errorCode: event.errorCode,
            targetPlayer: event.targetPlayer,
          });
        } else if (event.type === "ACTION_EXECUTED") {
          consola.info(
            `[SSE] type=ACTION_EXECUTED id=${eventId ?? "none"} player=${event.playerId} action=${event.action.actionType}`,
          );
          resolveActionWaiter({
            kind: "executed",
            eventId,
            playerId: event.playerId,
            actionType: event.action.actionType,
          });
        } else {
          consola.info(`[SSE] type=${event.type} id=${eventId ?? "none"}`);
        }

        if (isTurnEvent(event.type)) {
          turnProgressCount += 1;
          resolveTurnWaiters();
        }
      }
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          error.name === "AbortError" &&
          closingRequested
        )
      ) {
        streamError = error instanceof Error ? error : new Error(String(error));
      }
    } finally {
      streamClosed = true;
      rejectYourTurnWaiters(
        streamError ??
          new Error(
            "SSE stream closed before required scenario events were received.",
          ),
      );
      resolvePendingTurnWaiters();
      rejectActionWaiters(
        streamError ??
          new Error(
            "SSE stream closed before scenario action result was received.",
          ),
      );
    }
  })();

  return {
    waitForYourTurnContext: async (timeoutMs: number) => {
      if (latestYourTurnContext) {
        return latestYourTurnContext;
      }
      if (streamClosed) {
        throw (
          streamError ??
          new Error("SSE stream closed before YOUR_TURN was received.")
        );
      }
      return new Promise<PersistedYourTurnContext>((resolve, reject) => {
        const timeoutHandle = setTimeout(() => {
          const index = yourTurnWaiters.findIndex(
            (waiter) => waiter.timeoutHandle === timeoutHandle,
          );
          if (index >= 0) {
            yourTurnWaiters.splice(index, 1);
          }
          reject(
            new Error(
              `No YOUR_TURN received after ${timeoutMs}ms while preparing scenario execution.`,
            ),
          );
        }, timeoutMs);
        yourTurnWaiters.push({
          resolve,
          reject,
          timeoutHandle,
        });
      });
    },
    waitForTurns: async (turns: number) => {
      if (turns <= 0) {
        return;
      }
      if (streamClosed) {
        await new Promise((resolve) => {
          setTimeout(resolve, turns * DEFAULT_TURN_DELAY_MS);
        });
        return;
      }
      const target = turnProgressCount + turns;
      if (turnProgressCount >= target) {
        return;
      }
      await new Promise<void>((resolve) => {
        const timeoutHandle = setTimeout(
          () => {
            const index = turnWaiters.findIndex(
              (waiter) => waiter.timeoutHandle === timeoutHandle,
            );
            if (index >= 0) {
              turnWaiters.splice(index, 1);
            }
            resolve();
          },
          Math.max(1000, turns * DEFAULT_TURN_DELAY_MS),
        );
        turnWaiters.push({
          target,
          resolve,
          timeoutHandle,
        });
      });
    },
    waitForActionOutcome: async (expected) => {
      const backlogIndex = actionOutcomeBacklog.findIndex((outcome) =>
        actionOutcomeMatchesExpectation(
          outcome,
          expected.playerId,
          expected.actionType,
        ),
      );
      if (backlogIndex >= 0) {
        const [outcome] = actionOutcomeBacklog.splice(backlogIndex, 1);
        return outcome;
      }
      if (streamClosed) {
        throw (
          streamError ??
          new Error("SSE stream closed before action result was received.")
        );
      }
      return new Promise<ScenarioActionOutcome>((resolve, reject) => {
        const timeoutHandle = setTimeout(() => {
          const index = actionWaiters.findIndex(
            (waiter) => waiter.timeoutHandle === timeoutHandle,
          );
          if (index >= 0) {
            actionWaiters.splice(index, 1);
          }
          reject(
            new Error(
              `Timed out after ${expected.timeoutMs}ms waiting for action result (player=${expected.playerId}, action=${expected.actionType}).`,
            ),
          );
        }, expected.timeoutMs);
        actionWaiters.push({
          expectedPlayerId: expected.playerId,
          expectedActionType: expected.actionType,
          resolve,
          reject,
          timeoutHandle,
        });
      });
    },
    getState: () => ({
      eventCount,
      gameStatePhase,
      lastEventId: lastReplayCursorId,
      controllablePlayerIds,
      yourTurnCount,
    }),
    close: () => {
      if (closingRequested || streamClosed) {
        return;
      }
      closingRequested = true;
      abortController.abort();
    },
  };
}

function parseUiScenarioSteps(rawSteps: unknown[]): UiStep[] {
  const steps: UiStep[] = [];
  for (const [index, rawStep] of rawSteps.entries()) {
    if (typeof rawStep !== "object" || rawStep === null) {
      throw new Error(`Scenario step ${index} must be an object.`);
    }
    const playerId = (rawStep as { playerId?: unknown }).playerId;
    if (typeof playerId !== "string" || playerId.trim().length === 0) {
      throw new Error(
        `Scenario step ${index} is missing required 'playerId' (non-empty string).`,
      );
    }

    steps.push(rawStep as UiStep);
  }

  return steps;
}

function parseApiScenarioSteps(rawSteps: unknown[]): ApiScenarioStep[] {
  const steps: ApiScenarioStep[] = [];
  for (const [index, rawStep] of rawSteps.entries()) {
    if (typeof rawStep !== "object" || rawStep === null) {
      throw new Error(`Scenario step ${index} must be an object.`);
    }
    const playerId = (rawStep as { playerId?: unknown }).playerId;
    if (typeof playerId !== "string" || playerId.trim().length === 0) {
      throw new Error(
        `Scenario step ${index} is missing required 'playerId' (non-empty string).`,
      );
    }
    const actionType = (rawStep as { actionType?: unknown }).actionType;
    if (typeof actionType !== "string" || actionType.trim().length === 0) {
      throw new Error(
        `Scenario step ${index} is missing required 'actionType' (non-empty string).`,
      );
    }

    const parameters = (rawStep as { parameters?: unknown }).parameters;
    if (
      parameters !== undefined &&
      (typeof parameters !== "object" || parameters === null)
    ) {
      throw new Error(
        `Scenario step ${index} has invalid 'parameters'; expected object if provided.`,
      );
    }

    const turns = (rawStep as { turns?: unknown }).turns;
    if (turns !== undefined && typeof turns !== "number") {
      throw new Error(
        `Scenario step ${index} has invalid 'turns'; expected number if provided.`,
      );
    }

    steps.push({
      playerId,
      actionType,
      parameters: (parameters as Record<string, unknown> | undefined) ?? {},
      turns: typeof turns === "number" ? turns : undefined,
    });
  }
  return steps;
}

function validateScenarioPlayersForRun(
  steps: Array<{ playerId: string }>,
  latestTurnContext: PersistedYourTurnContext,
  scenarioDriver: ScenarioDriver,
): void {
  if (steps.length === 0) {
    throw new Error("Scenario has no steps to execute.");
  }
  const firstPlayerId = steps[0]?.playerId;
  if (!latestTurnContext.eligiblePlayerIds.includes(firstPlayerId)) {
    throw new Error(
      `Scenario step playerId '${firstPlayerId}' is not eligible for the current turn. Eligible players: ${latestTurnContext.eligiblePlayerIds.join(", ") || "(none)"}`,
    );
  }

  const controllable = new Set(latestTurnContext.controllablePlayerIds);
  for (const [index, step] of steps.entries()) {
    if (!controllable.has(step.playerId)) {
      throw new Error(
        `Scenario step ${index} has playerId '${step.playerId}', but controllable players are: ${latestTurnContext.controllablePlayerIds.join(", ") || "(none)"}.`,
      );
    }
  }

  // UI-driver scenarios currently run in a single browser context without
  // explicit player-context switching between steps.
  if (scenarioDriver === "ui") {
    for (const [index, step] of steps.entries()) {
      if (step.playerId !== firstPlayerId) {
        throw new Error(
          `UI scenario step ${index} has playerId '${step.playerId}', but UI driver only supports one acting player per run ('${firstPlayerId}'). Use --scenario-driver api for mixed-player scenarios.`,
        );
      }
    }
  }
}

async function runApiSteps(
  sessionId: string,
  steps: ApiScenarioStep[],
  waitForTurns: (turns: number) => Promise<void>,
  waitForActionOutcome: (expected: {
    playerId: string;
    actionType: string;
    timeoutMs: number;
  }) => Promise<ScenarioActionOutcome>,
  timeoutMs: number,
): Promise<void> {
  for (const [index, step] of steps.entries()) {
    consola.info(
      `[SCENARIO] step ${index + 1}/${steps.length} submit player=${step.playerId} action=${step.actionType}`,
    );
    const { error, response } = await submitAction({
      path: { sessionId },
      body: {
        playerId: step.playerId,
        actionType: step.actionType,
        parameters: JSON.stringify(step.parameters ?? {}),
        // Web runtime currently uses a static version token.
        uiBundleVersion: "1.0.0",
      },
    });
    if (error) {
      throw new ScenarioActionRejectedError({
        stepIndex: index,
        stepPlayerId: step.playerId,
        stepActionType: step.actionType,
        reason: formatApiError(
          error,
          response,
          `Scenario action step ${index} failed (${step.actionType})`,
        ),
      });
    }

    const actionOutcome = await waitForActionOutcome({
      playerId: step.playerId,
      actionType: step.actionType,
      timeoutMs,
    });
    if (actionOutcome.kind === "rejected") {
      const detailParts = [
        actionOutcome.reason,
        actionOutcome.errorCode ? `errorCode=${actionOutcome.errorCode}` : null,
        actionOutcome.targetPlayer
          ? `targetPlayer=${actionOutcome.targetPlayer}`
          : null,
      ].filter((value): value is string => Boolean(value));
      throw new ScenarioActionRejectedError({
        stepIndex: index,
        stepPlayerId: step.playerId,
        stepActionType: step.actionType,
        reason: detailParts.join(" | "),
      });
    }

    const turns = typeof step.turns === "number" ? step.turns : 1;
    await waitForTurns(Math.max(0, Math.floor(turns)));
  }
}

async function observeSessionEvents(options: {
  sessionId: string;
  shortCode: string;
  until: RunUntil;
  observeEvents: ObserveEvents;
  timeoutMs?: number;
  maxEvents?: number;
  eventsFilePath: string;
  yourTurnFilePath: string;
  persisted: PersistedRunSession;
}): Promise<ObserveResult> {
  const abortController = new AbortController();
  const eventIdByMessage = new WeakMap<object, string>();
  let timedOut = false;
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const resetNoEventTimeout = () => {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
    if (!options.timeoutMs) {
      return;
    }
    timeoutHandle = setTimeout(() => {
      timedOut = true;
      abortController.abort();
    }, options.timeoutMs);
  };
  resetNoEventTimeout();

  let eventCount = 0;
  let exitReason: RunExitReason = "stream_closed";
  let stopDetail =
    "SSE stream closed by server/client before stop condition was met.";
  let stopEventType: GameMessage["type"] | undefined;
  let stopEventId: string | undefined;
  let gameStatePhase: string | undefined;
  let lastReplayCursorId = normalizeReplayCursorId(
    options.persisted.lastEventId,
  );
  let controllablePlayerIds = [...options.persisted.controllablePlayerIds];
  let yourTurnCount = options.persisted.yourTurnCount;

  const lastMessageId = parseEventIdAsNumber(lastReplayCursorId);
  const { stream } = await subscribeToSessionEvents({
    path: { sessionId: options.sessionId },
    query: lastMessageId ? { lastMessageId } : undefined,
    signal: abortController.signal,
    onSseEvent: (sseEvent) => {
      if (
        typeof sseEvent.data === "object" &&
        sseEvent.data !== null &&
        typeof sseEvent.id === "string"
      ) {
        eventIdByMessage.set(sseEvent.data as object, sseEvent.id);
      }

      const replayableId = normalizeReplayCursorId(sseEvent.id);
      if (replayableId) {
        lastReplayCursorId = replayableId;
      }
    },
  });

  try {
    for await (const event of stream as AsyncGenerator<GameMessage>) {
      if (!event) {
        continue;
      }
      const eventId = eventIdByMessage.get(event as unknown as object) ?? null;
      const observedGameStatePhase = extractGameStatePhase(event);
      if (observedGameStatePhase) {
        gameStatePhase = observedGameStatePhase;
      }

      if (event.type === "GAME_STARTED") {
        controllablePlayerIds = [...event.controllablePlayerIds];
      }
      if (eventId === "bootstrap") {
        consola.info(
          `[SSE] type=${event.type} id=bootstrap (ignored for replay/persistence)`,
        );
        // Bootstrap is expected on each reconnect and is not part of replay cursors
        // or actionable event logs.
        continue;
      }

      eventCount += 1;
      resetNoEventTimeout();
      const observedAt = new Date().toISOString();
      if (shouldPersistObservedEvent(options.observeEvents, event)) {
        const eventRecord = {
          observedAt,
          sessionId: options.sessionId,
          eventId,
          type: event.type,
          message: event,
        };
        await appendFile(
          options.eventsFilePath,
          `${JSON.stringify(eventRecord)}\n`,
        );
      }

      if (event.type === "YOUR_TURN") {
        yourTurnCount += 1;
        const eligiblePlayerIds = controllablePlayerIds.filter((playerId) =>
          event.activePlayers.includes(playerId),
        );
        consola.info(
          `[SSE] type=YOUR_TURN id=${eventId ?? "none"} turn=${yourTurnCount} active=${event.activePlayers.length} eligible=${eligiblePlayerIds.length}`,
        );
        const turnContext: PersistedYourTurnContext = {
          sessionId: options.sessionId,
          shortCode: options.shortCode,
          eventId,
          observedAt,
          controllablePlayerIds: [...controllablePlayerIds],
          activePlayers: [...event.activePlayers],
          eligiblePlayerIds,
          turnNumber: yourTurnCount,
          message: event,
        };
        await writeJsonFile(options.yourTurnFilePath, turnContext);
      } else if (event.type === "ACTION_REJECTED") {
        const rejectionDetails = [
          `reason=${shortenForLog(event.reason)}`,
          event.errorCode ? `errorCode=${event.errorCode}` : null,
          event.targetPlayer ? `targetPlayer=${event.targetPlayer}` : null,
        ]
          .filter((value): value is string => Boolean(value))
          .join(" ");
        consola.warn(
          `[SSE] type=ACTION_REJECTED id=${eventId ?? "none"} ${rejectionDetails}`,
        );
      } else {
        consola.info(`[SSE] type=${event.type} id=${eventId ?? "none"}`);
      }

      if (shouldStopOnEvent(options.until, event)) {
        exitReason = "until_reached";
        stopEventType = event.type;
        stopEventId = normalizeReplayCursorId(eventId ?? undefined);
        stopDetail = `Reached until=${options.until} on event=${event.type}${eventId ? ` (eventId=${eventId})` : ""}.`;
        break;
      }

      if (options.maxEvents && eventCount >= options.maxEvents) {
        exitReason = "max_events";
        stopEventType = event.type;
        stopEventId = normalizeReplayCursorId(eventId ?? undefined);
        stopDetail = `Reached max-events threshold (${options.maxEvents}).`;
        break;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError" && timedOut) {
      exitReason = "timeout";
      stopDetail = `No events received for ${options.timeoutMs}ms.`;
    } else {
      throw error;
    }
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
    abortController.abort();
  }

  if (exitReason === "stream_closed") {
    if (eventCount === 0) {
      stopDetail = options.timeoutMs
        ? `SSE stream closed with no non-bootstrap events received (configured inactivity timeout: ${options.timeoutMs}ms).`
        : "SSE stream closed with no non-bootstrap events received.";
    } else {
      stopDetail = `SSE stream closed after ${eventCount} observed event(s).`;
    }
  }

  return {
    eventCount,
    exitReason,
    stopDetail,
    stopEventType,
    stopEventId,
    gameStatePhase,
    lastEventId: lastReplayCursorId,
    controllablePlayerIds,
    yourTurnCount,
  };
}

function parseOptionalPositiveInt(
  value: string | undefined,
  label: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  return parsePositiveInt(value, label);
}

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

function shortenForLog(value: string, maxLength = 120): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
}

function parseEventIdAsNumber(eventId: string | undefined): number | undefined {
  if (!eventId) {
    return undefined;
  }
  const parsed = Number.parseInt(eventId, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

function normalizeReplayCursorId(
  eventId: string | undefined,
): string | undefined {
  const parsed = parseEventIdAsNumber(eventId);
  return parsed ? String(parsed) : undefined;
}

function shouldStopOnEvent(until: RunUntil, event: GameMessage): boolean {
  switch (until) {
    case "ANY":
      return true;
    case "GAME_ENDED":
      return event.type === "GAME_ENDED";
    case "YOUR_TURN":
      return event.type === "YOUR_TURN" || event.type === "GAME_ENDED";
  }
}

function shouldPersistObservedEvent(
  observeEvents: ObserveEvents,
  event: GameMessage,
): boolean {
  if (observeEvents === "all") {
    return true;
  }
  return event.type === "YOUR_TURN" || event.type === "ACTION_REJECTED";
}

function extractGameStatePhase(event: GameMessage): string | undefined {
  switch (event.type) {
    case "GAME_STARTED":
    case "YOUR_TURN":
    case "STATE_UPDATE":
    case "HISTORY_RESTORED":
      return event.gameState.currentState;
    case "ACTION_EXECUTED":
      return event.newState.currentState;
    default:
      return undefined;
  }
}
