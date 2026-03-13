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
    "@dreamboard/sdk-types",
    "@supabase/supabase-js",
    "citty",
    "consola",
    "picocolors",
    "zod",
  ],
  external: ["playwright", "playwright-core", "chromium-bidi", "electron"],
});
