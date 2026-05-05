import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "neutral",
  target: "node20",
  outDir: "dist",
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  // `@dreamboard/ui-host-runtime` is intentionally private (source-only)
  // yet `createTestRuntime` must reuse its unified session store so the
  // canonical `getPluginSnapshot()` projection and
  // `applyGameplaySnapshotLocal(...)` reducer are the same code paths
  // running in the host app. Bundle the runtime subpath into this
  // package so downstream workspaces that install `@dreamboard/testing`
  // do not need the private package on npm.
  noExternal: ["@dreamboard/ui-host-runtime"],
  external: [
    "@dreamboard/api-client",
    "@dreamboard/app-sdk",
    "@dreamboard/ui-sdk",
    "zustand",
  ],
});
