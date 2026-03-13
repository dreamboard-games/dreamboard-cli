import path from "node:path";
import { subscribeToSessionEvents } from "@dreamboard/api-client";
import type { BoardManifest } from "@dreamboard/sdk-types";
import type { UiStep, TurnTracker, ResolvedConfig } from "../types.js";
import type { PlayerCountFlags } from "../flags.js";
import { DEFAULT_TURN_DELAY_MS } from "../constants.js";
import { sleep } from "../utils/strings.js";
import { parsePositiveInt } from "../utils/strings.js";
import { loadManifest } from "../services/project/local-files.js";

export async function runUiSteps(
  page: import("playwright").Page,
  steps: UiStep[],
  outputDir: string,
  turnTracker: TurnTracker,
): Promise<void> {
  let stepIndex = 0;
  for (const step of steps) {
    const buttons = step.buttons ?? [];
    if (typeof step.mouse_x === "number" && typeof step.mouse_y === "number") {
      await page.mouse.move(step.mouse_x, step.mouse_y);
    }

    for (const button of buttons) {
      if (button === "left_mouse_button") {
        if (
          typeof step.mouse_x === "number" &&
          typeof step.mouse_y === "number"
        ) {
          await page.mouse.click(step.mouse_x, step.mouse_y, {
            button: "left",
          });
        } else {
          await page.mouse.down({ button: "left" });
          await page.mouse.up({ button: "left" });
        }
        continue;
      }
      if (button === "right_mouse_button") {
        if (
          typeof step.mouse_x === "number" &&
          typeof step.mouse_y === "number"
        ) {
          await page.mouse.click(step.mouse_x, step.mouse_y, {
            button: "right",
          });
        } else {
          await page.mouse.down({ button: "right" });
          await page.mouse.up({ button: "right" });
        }
        continue;
      }
      await page.keyboard.press(mapKeyName(button));
    }

    const turns = typeof step.turns === "number" ? step.turns : 1;
    await turnTracker.waitForTurns(Math.max(0, Math.floor(turns)));

    await page.screenshot({
      path: path.join(outputDir, `step-${stepIndex}.png`),
    });
    stepIndex++;
  }
}

export function mapKeyName(name: string): string {
  switch (name) {
    case "up":
      return "ArrowUp";
    case "down":
      return "ArrowDown";
    case "left":
      return "ArrowLeft";
    case "right":
      return "ArrowRight";
    case "space":
      return "Space";
    case "enter":
      return "Enter";
    default:
      return name;
  }
}

export async function startTurnTracker(
  sessionId: string,
): Promise<TurnTracker> {
  const abortController = new AbortController();
  let active = true;
  let turnCount = 0;
  const waiters: Array<{
    target: number;
    resolve: () => void;
    reject: (error: Error) => void;
  }> = [];

  const flushWaiters = () => {
    const remaining: typeof waiters = [];
    for (const waiter of waiters) {
      if (turnCount >= waiter.target) {
        waiter.resolve();
      } else {
        remaining.push(waiter);
      }
    }
    waiters.length = 0;
    waiters.push(...remaining);
  };

  const trackTurns = async () => {
    try {
      await listenToSessionEvents(
        sessionId,
        abortController.signal,
        (eventType) => {
          if (!eventType) return;
          if (isTurnEvent(eventType)) {
            turnCount += 1;
            flushWaiters();
          }
        },
      );
    } catch {
      // fallthrough to cleanup
    } finally {
      active = false;
      for (const waiter of waiters) {
        waiter.resolve();
      }
      waiters.length = 0;
    }
  };

  void trackTurns();

  return {
    waitForTurns: async (turns: number) => {
      if (turns <= 0) return;
      if (!active) {
        await sleep(turns * DEFAULT_TURN_DELAY_MS);
        return;
      }

      const target = turnCount + turns;
      await new Promise<void>((resolve, reject) => {
        waiters.push({ target, resolve, reject });
        setTimeout(
          () => {
            if (turnCount < target) {
              active = false;
              resolve();
            }
          },
          Math.max(1000, turns * DEFAULT_TURN_DELAY_MS),
        );
      });
    },
    close: () => {
      active = false;
      abortController.abort();
    },
  };
}

export function isTurnEvent(eventType: string): boolean {
  return (
    eventType === "HISTORY_UPDATED" ||
    eventType === "TURN_CHANGED" ||
    eventType === "ACTION_EXECUTED"
  );
}

export async function listenToSessionEvents(
  sessionId: string,
  signal: AbortSignal,
  onEvent: (eventType: string | null) => void,
): Promise<void> {
  const { stream } = await subscribeToSessionEvents({
    path: { sessionId },
    signal,
  });

  try {
    for await (const event of stream) {
      if (!event) continue;
      const eventType = (event as { type?: string }).type ?? null;
      onEvent(eventType);
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // Stream was cancelled
    } else {
      throw error;
    }
  }
}

export async function resolvePlayerCount(
  projectRoot: string,
  flags: PlayerCountFlags,
): Promise<number> {
  const rawPlayers = flags.players ?? flags["player-count"];
  if (rawPlayers !== undefined) {
    return parsePositiveInt(rawPlayers, "players");
  }

  const manifest = await loadManifest(projectRoot);
  const minPlayers = manifest.playerConfig?.minPlayers;
  if (typeof minPlayers !== "number" || !Number.isFinite(minPlayers)) {
    throw new Error(
      "manifest.json is missing playerConfig.minPlayers. Provide --players <count> instead.",
    );
  }

  return Math.max(1, Math.floor(minPlayers));
}

/**
 * Builds a browser init script that injects Supabase auth session into localStorage
 * before the page JS runs. This ensures the app picks up the session on first load.
 *
 * supabase-js v2 uses the key `sb-{hostname[0]}-auth-token` (where hostname[0] is the
 * first segment of the Supabase URL hostname, e.g. "127" for "127.0.0.1").
 *
 * Returns null if no auth token is available.
 */
export async function buildBrowserAuthInitScript(
  config: ResolvedConfig,
): Promise<string | null> {
  if (!config.authToken) return null;

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return `(function(){localStorage.setItem('supabase_token',${JSON.stringify(config.authToken)});})();`;
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

    let sessionData: Record<string, unknown> | null = null;

    if (config.refreshToken) {
      const { data } = await supabase.auth.setSession({
        access_token: config.authToken,
        refresh_token: config.refreshToken,
      });
      if (data.session) {
        config.authToken = data.session.access_token;
        sessionData = {
          access_token: data.session.access_token,
          token_type: data.session.token_type ?? "bearer",
          expires_in: data.session.expires_in,
          expires_at: data.session.expires_at,
          refresh_token: data.session.refresh_token,
          user: data.session.user,
        };
      }
    }

    if (!sessionData) {
      const { data: userData } = await supabase.auth.getUser(config.authToken);
      if (userData?.user) {
        const parts = config.authToken.split(".");
        let expiresAt: number | undefined;
        if (parts.length === 3) {
          try {
            const payload = JSON.parse(atob(parts[1]!));
            expiresAt = payload.exp;
          } catch {
            // ignore decode errors
          }
        }
        sessionData = {
          access_token: config.authToken,
          token_type: "bearer",
          expires_in: expiresAt
            ? expiresAt - Math.floor(Date.now() / 1000)
            : 3600,
          expires_at: expiresAt,
          refresh_token: "",
          user: userData.user,
        };
      }
    }

    if (!sessionData) return null;

    const storageKey = `sb-${new URL(config.supabaseUrl).hostname.split(".")[0]}-auth-token`;
    const sessionJson = JSON.stringify(sessionData);
    const accessToken = String(sessionData.access_token ?? config.authToken);

    return `(function(){localStorage.setItem(${JSON.stringify(storageKey)},${JSON.stringify(sessionJson)});localStorage.setItem('supabase_token',${JSON.stringify(accessToken)});})();`;
  } catch {
    return `(function(){localStorage.setItem('supabase_token',${JSON.stringify(config.authToken)});})();`;
  }
}

/**
 * Waits for the game UI iframe to appear, indicating the game is fully loaded.
 * Uses iframe detection instead of `networkidle` because SSE connections keep
 * the network active indefinitely.
 */
export async function waitForGameReady(
  page: import("playwright").Page,
  timeoutMs = 15000,
): Promise<void> {
  await page.waitForSelector('iframe[title="Game UI Plugin"]', {
    timeout: timeoutMs,
  });
}
