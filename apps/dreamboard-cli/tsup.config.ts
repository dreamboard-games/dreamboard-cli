import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  splitting: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  define: {
    __DREAMBOARD_BUILD_CHANNEL__: JSON.stringify(
      process.env.DREAMBOARD_BUILD_CHANNEL ?? "development",
    ),
  },
  noExternal: [
    "@dreamboard/api-client",
    "@dreamboard/app-sdk",
    "@dreamboard/reducer-contract",
    "@dreamboard/sdk-types",
    "@dreamboard/testing",
    "@dreamboard/workspace-codegen",
    "@supabase/supabase-js",
    "citty",
    "consola",
    "picocolors",
    "zod",
  ],
  external: [
    "playwright",
    "playwright-core",
    "chromium-bidi",
    "electron",
    // Optional native dependency: must stay external so tsup does not
    // try to bundle the platform-specific .node binary. Loaded via
    // dynamic `import()` in `config/keychain-backend.ts`, which
    // gracefully degrades when the package is absent.
    "@napi-rs/keyring",
  ],
});
