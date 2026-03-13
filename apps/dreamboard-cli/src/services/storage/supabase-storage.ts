import path from "node:path";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { ResolvedConfig } from "../../types.js";
import { CODE_EDITS_BUCKET } from "../../constants.js";
import { getUserIdFromToken } from "../../utils/crypto.js";
import { readTextFile } from "../../utils/fs.js";

const MAX_CONCURRENT_UPLOADS = 5;

export function createSupabase(config: ResolvedConfig) {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error("Supabase config missing.");
  }
  return createSupabaseClient(config.supabaseUrl, config.supabaseAnonKey, {
    global: {
      headers: config.authToken
        ? { Authorization: `Bearer ${config.authToken}` }
        : {},
    },
  });
}

export async function uploadFileOverrides(
  config: ResolvedConfig,
  rootDir: string,
  gameId: string,
  paths: string[],
): Promise<Array<{ path: string; storageKey: string }>> {
  if (paths.length === 0) return [];
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error(
      "Missing Supabase config. Run 'dreamboard login' to authenticate, or set DREAMBOARD_SUPABASE_URL and DREAMBOARD_SUPABASE_ANON_KEY.",
    );
  }
  if (!config.authToken) {
    throw new Error(
      "Missing auth token for Supabase upload. Run 'dreamboard login' to authenticate.",
    );
  }

  const supabase = createSupabase(config);
  const userId = getUserIdFromToken(config.authToken);
  const basePath = `${userId}/${gameId}/${Date.now()}`;
  const overrides: Array<{ path: string; storageKey: string }> = [];

  for (let i = 0; i < paths.length; i += MAX_CONCURRENT_UPLOADS) {
    const batch = paths.slice(i, i + MAX_CONCURRENT_UPLOADS);
    const results = await Promise.all(
      batch.map(async (relativePath) => {
        const content = await readTextFile(path.join(rootDir, relativePath));
        const storageKey = `${basePath}/${relativePath}`;

        const { error } = await supabase.storage
          .from(CODE_EDITS_BUCKET)
          .upload(storageKey, content, {
            contentType: "text/plain",
            upsert: true,
          });
        if (error) {
          throw new Error(`Failed to upload ${storageKey}: ${error.message}`);
        }

        return { path: relativePath, storageKey };
      }),
    );
    overrides.push(...results);
  }

  return overrides;
}
