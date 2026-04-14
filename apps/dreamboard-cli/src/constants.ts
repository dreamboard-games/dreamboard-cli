import type { EnvironmentConfig } from "./types.js";

export const DEFAULT_API_BASE_URL = "https://api.dreamboard.games";
export const DEFAULT_WEB_BASE_URL = "https://dreamboard.games";
export const PROD_SUPABASE_URL = "https://upsjrgzihskmqporuaye.supabase.co";
export const PROD_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwc2pyZ3ppaHNrbXFwb3J1YXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTM1MjQsImV4cCI6MjA3NTY2OTUyNH0.9IZZ9Jmtqk4OzhQnkU7pApVx-IfdNjAt55ZKjOBjBB4";

export const PROJECT_DIR_NAME = ".dreamboard";

// Predefined environment configurations
export const ENVIRONMENT_CONFIGS: Record<string, EnvironmentConfig> = {
  local: {
    apiBaseUrl: "http://localhost:8080",
    webBaseUrl: "http://localhost:5173",
    supabaseUrl: "http://127.0.0.1:54321",
    supabaseAnonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
  },
  dev: {
    apiBaseUrl: "https://dev-dreamboard.fly.dev",
    webBaseUrl: "https://dev.dreamboard.games",
    supabaseUrl: "https://dev-supabase.dreamboard.games",
    supabaseAnonKey: process.env.SUPABASE_DEV_ANON_KEY || "",
  },
  prod: {
    apiBaseUrl: "https://api.dreamboard.games",
    webBaseUrl: "https://dreamboard.games",
    supabaseUrl: PROD_SUPABASE_URL,
    supabaseAnonKey: PROD_SUPABASE_ANON_KEY,
  },
};
export const PROJECT_CONFIG_FILE = "project.json";
export const SNAPSHOT_FILE = "snapshot.json";
export const MANIFEST_FILE = "manifest.ts";
export const GENERATED_DIR_NAME = "generated";
export const MATERIALIZED_MANIFEST_FILE = `${PROJECT_DIR_NAME}/${GENERATED_DIR_NAME}/manifest.json`;
export const MANIFEST_TYPECHECK_CONFIG_FILE = "manifest.tsconfig.json";
export const RULE_FILE = "rule.md";
export const DEFAULT_LOGIN_TIMEOUT_MS = 5 * 60 * 1000;
export const DEFAULT_TURN_DELAY_MS = 250;

export const LOCAL_IGNORE_DIRS = new Set([
  ".dreamboard",
  ".git",
  "node_modules",
  "dist",
]);
