import os from "node:os";
import path from "node:path";
import type { ResolvedConfig } from "../types.js";

/**
 * Browser test runner helpers shared with reducer-native-test-harness (browser runner).
 * Screenshot / JSON scenario navigation helpers lived in the deleted `run` command.
 */
export function configurePlaywrightBrowsersPath(): void {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) {
    return;
  }

  const runtimeHome = process.env.HOME;
  let realHome: string;
  try {
    realHome = os.userInfo().homedir;
  } catch {
    return;
  }

  if (!runtimeHome || path.resolve(runtimeHome) === path.resolve(realHome)) {
    return;
  }

  const browserCachePath =
    process.platform === "darwin"
      ? path.join(realHome, "Library", "Caches", "ms-playwright")
      : process.platform === "win32"
        ? path.join(realHome, "AppData", "Local", "ms-playwright")
        : path.join(realHome, ".cache", "ms-playwright");

  process.env.PLAYWRIGHT_BROWSERS_PATH = browserCachePath;
}

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

export async function waitForGameReady(
  page: import("playwright").Page,
  timeoutMs = 60000,
): Promise<void> {
  await page.waitForSelector('iframe[title="Game UI Plugin"]', {
    timeout: timeoutMs,
  });
}
