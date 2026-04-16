import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "bun:test";
import {
  didLocalMaintainerSnapshotChange,
  getLocalMaintainerNpmrcContent,
  isLocalMaintainerRegistryEnabled,
  isLocalMaintainerRegistryUrl,
  readWorkspaceLocalMaintainerRegistryFromPackageJson,
} from "./local-maintainer-registry-shared.js";

test("readWorkspaceLocalMaintainerRegistryFromPackageJson infers local snapshot metadata from workspace package versions", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-local-maint-"));

  try {
    await writeFile(
      path.join(tempRoot, "package.json"),
      `${JSON.stringify(
        {
          dependencies: {
            "@dreamboard/app-sdk": "0.0.40-local.abc",
            "@dreamboard/ui-sdk": "0.0.40-local.abc",
          },
          devDependencies: {
            "@dreamboard/sdk-types": "0.1.0-local.abc",
          },
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    const result = await readWorkspaceLocalMaintainerRegistryFromPackageJson(
      tempRoot,
      "http://127.0.0.1:9999",
    );

    expect(result).not.toBeNull();
    expect(result?.registryUrl).toBe("http://127.0.0.1:9999");
    expect(result?.packages["@dreamboard/app-sdk"]).toBe("0.0.40-local.abc");
    expect(result?.packages["@dreamboard/ui-sdk"]).toBe("0.0.40-local.abc");
    expect(result?.packages["@dreamboard/sdk-types"]).toBe("0.1.0-local.abc");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("readWorkspaceLocalMaintainerRegistryFromPackageJson returns null for non-local package graphs", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "db-local-maint-"));

  try {
    await writeFile(
      path.join(tempRoot, "package.json"),
      `${JSON.stringify(
        {
          dependencies: {
            "@dreamboard/app-sdk": "^0.0.40",
            "@dreamboard/ui-sdk": "^0.0.40",
          },
          devDependencies: {
            "@dreamboard/sdk-types": "^0.1.0",
          },
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    await expect(
      readWorkspaceLocalMaintainerRegistryFromPackageJson(tempRoot),
    ).resolves.toBeNull();
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("local maintainer helper utilities preserve local registry semantics", () => {
  expect(
    getLocalMaintainerNpmrcContent({
      registryUrl: "http://127.0.0.1:9999",
      snapshotId: "snapshot",
      fingerprint: "fingerprint",
      publishedAt: "2026-01-01T00:00:00.000Z",
      packages: {
        "@dreamboard/api-client": "0.1.0-local.1",
        "@dreamboard/app-sdk": "0.0.40-local.1",
        "@dreamboard/sdk-types": "0.1.0-local.1",
        "@dreamboard/ui-sdk": "0.0.40-local.1",
      },
    }),
  ).toBe("@dreamboard:registry=http://127.0.0.1:9999\n");
  expect(
    didLocalMaintainerSnapshotChange(
      { snapshotId: "a" } as { snapshotId: string },
      { snapshotId: "b" } as { snapshotId: string },
    ),
  ).toBe(true);
  expect(
    didLocalMaintainerSnapshotChange(
      { snapshotId: "a" } as { snapshotId: string },
      { snapshotId: "a" } as { snapshotId: string },
    ),
  ).toBe(false);
  expect(
    isLocalMaintainerRegistryUrl(
      "@dreamboard:registry=http://127.0.0.1:4873\n",
    ),
  ).toBe(true);
  expect(
    isLocalMaintainerRegistryUrl(
      "@dreamboard:registry=https://registry.npmjs.org\n",
    ),
  ).toBe(false);
  expect(isLocalMaintainerRegistryEnabled("http://localhost:8080")).toBe(true);
  expect(isLocalMaintainerRegistryEnabled("http://127.0.0.1:8080")).toBe(true);
  expect(isLocalMaintainerRegistryEnabled("http://127.0.0.1:8081")).toBe(true);
  expect(isLocalMaintainerRegistryEnabled("https://api.dreamboard.games")).toBe(
    false,
  );
});
