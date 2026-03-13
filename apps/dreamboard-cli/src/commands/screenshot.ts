import path from "node:path";
import { defineCommand } from "citty";
import consola from "consola";
import {
  createSession,
  getSessionByShortCode,
  startGame,
  submitAction,
} from "@dreamboard/api-client";
import { resolveProjectContext } from "../config/resolve.js";
import { parseConfigFlags } from "../flags.js";
import { DEFAULT_TURN_DELAY_MS, PROJECT_DIR_NAME } from "../constants.js";
import { ensureDir, readJsonFile, writeJsonFile } from "../utils/fs.js";
import { resolveCompiledResultForRun } from "../services/workflows/resolve-run-result.js";
import {
  buildBrowserAuthInitScript,
  resolvePlayerCount,
  waitForGameReady,
} from "../ui/playwright-runner.js";
import { formatApiError } from "../utils/errors.js";
import { sleep } from "../utils/strings.js";
import { parsePlayerCountFlags } from "../flags.js";
import type { ApiScenarioStep } from "../types.js";

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
    name: "screenshot",
    description: "Capture a screenshot of the running game in the browser",
  },
  args: {
    env: {
      type: "string",
      description: "Environment to target (local, dev, prod)",
    },
    token: {
      type: "string",
      description: "Auth token (overrides stored credentials)",
    },
    scenario: {
      type: "string",
      description: "Optional scenario JSON file to execute before capture",
    },
    seed: {
      type: "string",
      description: "Deterministic RNG seed for the fresh session",
    },
    players: {
      type: "string",
      description: "Number of seats to create",
    },
    "player-count": {
      type: "string",
      description: "Number of seats to create (alias)",
    },
    headless: {
      type: "boolean",
      description: "Run browser in headless mode (default: true)",
      default: true,
    },
    delay: {
      type: "string",
      description:
        "Milliseconds to wait after the game loads before capturing (default: 3000)",
      default: "3000",
    },
    output: {
      type: "string",
      description:
        "Output file path (default: .dreamboard/screenshots/screenshot-<timestamp>.png)",
    },
    width: {
      type: "string",
      description: "Viewport width in pixels (default: 390)",
      default: "390",
    },
    height: {
      type: "string",
      description: "Viewport height in pixels (default: 844)",
      default: "844",
    },
  },
  async run({ args }) {
    const { projectRoot, projectConfig, config } = await resolveProjectContext(
      parseConfigFlags(args),
    );

    const runDir = path.join(projectRoot, PROJECT_DIR_NAME, "run");
    const sessionFilePath = path.join(runDir, "session.json");
    await ensureDir(runDir);

    const seed = parseRunSeed(args.seed);
    const latest = await resolveCompiledResultForRun(
      projectRoot,
      projectConfig,
    );
    const playerFlags = parsePlayerCountFlags(args);
    const playerCount = await resolvePlayerCount(projectRoot, playerFlags);

    const {
      data: createdSession,
      error: createSessionError,
      response: createSessionResponse,
    } = await createSession({
      path: { gameId: projectConfig.gameId },
      body: {
        compiledResultId: latest.id,
        seed,
        playerCount,
        autoAssignSeats: true,
      },
    });
    if (createSessionError || !createdSession) {
      throw new Error(
        formatApiError(
          createSessionError,
          createSessionResponse,
          "Failed to create session for screenshot",
        ),
      );
    }

    const {
      data: startedSession,
      error: startSessionError,
      response: startSessionResponse,
    } = await startGame({
      path: { sessionId: createdSession.sessionId },
    });
    if (startSessionError || !startedSession) {
      throw new Error(
        formatApiError(
          startSessionError,
          startSessionResponse,
          "Failed to start session for screenshot",
        ),
      );
    }

    const session: PersistedRunSession = {
      sessionId: createdSession.sessionId,
      shortCode: startedSession.shortCode,
      gameId: createdSession.gameId,
      seed,
      compiledResultId: latest.id,
      createdAt: new Date().toISOString(),
      controllablePlayerIds: [],
      yourTurnCount: 0,
    };
    await writeJsonFile(sessionFilePath, session);

    if (args.scenario) {
      const scenario = await readJsonFile<Record<string, unknown>>(
        args.scenario,
      );
      if (!Array.isArray(scenario.steps)) {
        throw new Error("Scenario JSON must include a 'steps' array.");
      }

      const steps = parseApiScenarioSteps(scenario.steps);
      for (const [index, step] of steps.entries()) {
        const { error, response } = await submitAction({
          path: { sessionId: session.sessionId },
          body: {
            playerId: step.playerId,
            actionType: step.actionType,
            parameters: JSON.stringify(step.parameters ?? {}),
            uiBundleVersion: "1.0.0",
          },
        });
        if (error) {
          throw new Error(
            formatApiError(
              error,
              response,
              `Scenario step ${index + 1} failed (${step.actionType})`,
            ),
          );
        }

        const turns = typeof step.turns === "number" ? step.turns : 1;
        if (turns > 0) {
          await sleep(Math.max(0, turns) * DEFAULT_TURN_DELAY_MS);
        }
      }
    }

    const playUrl = `${config.webBaseUrl.replace(/\/$/, "")}/play/${session.shortCode}`;
    consola.info(`Opening: ${playUrl}`);

    const { error: sessionLookupError, response: sessionLookupResponse } =
      await getSessionByShortCode({
        path: { shortCode: session.shortCode },
      });
    if (sessionLookupError) {
      throw new Error(
        formatApiError(
          sessionLookupError,
          sessionLookupResponse,
          `Session lookup failed for code '${session.shortCode}'`,
        ),
      );
    }

    const delayMs = Math.max(0, parseInt(args.delay ?? "3000", 10) || 3000);
    const viewportWidth = Math.max(1, parseInt(args.width ?? "390", 10) || 390);
    const viewportHeight = Math.max(
      1,
      parseInt(args.height ?? "844", 10) || 844,
    );

    const outputDir = path.join(projectRoot, PROJECT_DIR_NAME, "screenshots");
    await ensureDir(outputDir);
    const outputPath =
      args.output ?? path.join(outputDir, `screenshot-${Date.now()}.png`);

    // Preflight: verify the web UI host is reachable before launching a browser.
    // Without this check, Playwright throws a cryptic ERR_CONNECTION_REFUSED.
    try {
      await fetch(config.webBaseUrl, { signal: AbortSignal.timeout(3000) });
    } catch {
      const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(
        config.webBaseUrl,
      );
      const hint = isLocal
        ? ` Start it with: pnpm --filter web dev`
        : ` Check that the web service is running and reachable.`;
      throw new Error(`Web UI not reachable at ${config.webBaseUrl}.${hint}`);
    }

    const { chromium } = await import("playwright");
    const browser = await chromium.launch({
      headless: args.headless !== false,
    });

    try {
      const context = await browser.newContext({
        viewport: { width: viewportWidth, height: viewportHeight },
        deviceScaleFactor: 2,
      });

      const initScript = await buildBrowserAuthInitScript(config);
      if (initScript) {
        await context.addInitScript({ content: initScript });
      }

      const page = await context.newPage();
      const response = await page.goto(playUrl, {
        waitUntil: "domcontentloaded",
      });
      if (response && !response.ok()) {
        throw new Error(
          `Failed to open play page ${playUrl} (HTTP ${response.status()})`,
        );
      }
      await waitForGameReady(page);

      if (delayMs > 0) {
        await sleep(delayMs);
      }

      await page.screenshot({ path: outputPath });
      consola.success(`Screenshot saved: ${outputPath}`);
    } finally {
      await browser.close();
    }
  },
});

function parseApiScenarioSteps(rawSteps: unknown[]): ApiScenarioStep[] {
  const steps: ApiScenarioStep[] = [];
  for (const [index, rawStep] of rawSteps.entries()) {
    if (!rawStep || typeof rawStep !== "object") {
      throw new Error(`Scenario step ${index} is not an object.`);
    }

    const playerId = (rawStep as { playerId?: unknown }).playerId;
    const actionType = (rawStep as { actionType?: unknown }).actionType;
    if (typeof playerId !== "string" || playerId.length === 0) {
      throw new Error(
        `Scenario step ${index} has invalid 'playerId'; expected non-empty string.`,
      );
    }
    if (typeof actionType !== "string" || actionType.length === 0) {
      throw new Error(
        `Scenario step ${index} has invalid 'actionType'; expected non-empty string.`,
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
