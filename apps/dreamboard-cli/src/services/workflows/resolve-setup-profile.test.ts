import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "bun:test";

const RESOLVE_SETUP_PROFILE_MODULE_PATH = path.resolve(
  import.meta.dir,
  "resolve-setup-profile.ts",
);

const VALID_MANIFEST_BASE = {
  cardSets: [],
  zones: [],
  boardTemplates: [],
  boards: [],
  pieceTypes: [],
  pieceSeeds: [],
  dieTypes: [],
  dieSeeds: [],
  players: {
    minPlayers: 2,
    maxPlayers: 4,
    optimalPlayers: 2,
  },
  resources: [],
  setupOptions: [],
  setupProfiles: [],
} as const;

function renderManifestSource(manifest: Record<string, unknown>): string {
  return [
    'import { defineTopologyManifest } from "@dreamboard/sdk-types";',
    "",
    "export default defineTopologyManifest(",
    `${JSON.stringify(manifest, null, 2)}`,
    ");",
    "",
  ].join("\n");
}

async function withTempProject(
  manifest: Record<string, unknown>,
  run: (projectRoot: string) => Promise<void>,
): Promise<void> {
  const projectRoot = await mkdtemp(
    path.join(os.tmpdir(), "db-setup-profile-"),
  );

  try {
    await Bun.write(
      path.join(projectRoot, "manifest.ts"),
      renderManifestSource(manifest),
    );
    await run(projectRoot);
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
}

function runResolveSetupProfile(
  projectRoot: string,
  requestedSetupProfileId?: string,
): {
  exitCode: number;
  stdout: string;
  stderr: string;
} {
  const result = Bun.spawnSync({
    cmd: [
      process.execPath,
      "--eval",
      `
        import { resolveSetupProfileIdForSession } from ${JSON.stringify(
          RESOLVE_SETUP_PROFILE_MODULE_PATH,
        )};

        const projectRoot = process.argv[1];
        const requestedSetupProfileId =
          process.argv[2] && process.argv[2] !== "__undefined__"
            ? process.argv[2]
            : undefined;

        try {
          const setupProfileId = await resolveSetupProfileIdForSession({
            projectRoot,
            requestedSetupProfileId,
          });
          console.log(JSON.stringify(setupProfileId));
        } catch (error) {
          console.error(error instanceof Error ? error.message : String(error));
          process.exit(1);
        }
      `,
      projectRoot,
      requestedSetupProfileId ?? "__undefined__",
    ],
    cwd: path.resolve(import.meta.dir, "../../../../.."),
    stdout: "pipe",
    stderr: "pipe",
  });

  return {
    exitCode: result.exitCode,
    stdout: new TextDecoder().decode(result.stdout).trim(),
    stderr: new TextDecoder().decode(result.stderr).trim(),
  };
}

describe("resolveSetupProfileIdForSession", () => {
  test("returns null when the manifest defines no setup profiles", async () => {
    await withTempProject(VALID_MANIFEST_BASE, async (projectRoot) => {
      const result = runResolveSetupProfile(projectRoot);

      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toBeNull();
    });
  });

  test("implicitly selects the only setup profile when none is requested", async () => {
    await withTempProject(
      {
        ...VALID_MANIFEST_BASE,
        setupProfiles: [{ id: "default-setup", name: "Default Setup" }],
      },
      async (projectRoot) => {
        const result = runResolveSetupProfile(projectRoot);

        expect(result.exitCode).toBe(0);
        expect(JSON.parse(result.stdout)).toBe("default-setup");
      },
    );
  });

  test("implicitly selects the first declared setup profile when multiple profiles exist", async () => {
    await withTempProject(
      {
        ...VALID_MANIFEST_BASE,
        setupProfiles: [
          { id: "base-profile", name: "Base Profile" },
          { id: "draft-profile", name: "Draft Profile" },
        ],
      },
      async (projectRoot) => {
        const result = runResolveSetupProfile(projectRoot);

        expect(result.exitCode).toBe(0);
        expect(JSON.parse(result.stdout)).toBe("base-profile");
      },
    );
  });

  test("returns the requested setup profile when it exists", async () => {
    await withTempProject(
      {
        ...VALID_MANIFEST_BASE,
        setupProfiles: [
          { id: "base-profile", name: "Base Profile" },
          { id: "draft-profile", name: "Draft Profile" },
        ],
      },
      async (projectRoot) => {
        const result = runResolveSetupProfile(projectRoot, "draft-profile");

        expect(result.exitCode).toBe(0);
        expect(JSON.parse(result.stdout)).toBe("draft-profile");
      },
    );
  });

  test("rejects unknown requested setup profiles", async () => {
    await withTempProject(
      {
        ...VALID_MANIFEST_BASE,
        setupProfiles: [{ id: "base-profile", name: "Base Profile" }],
      },
      async (projectRoot) => {
        const result = runResolveSetupProfile(projectRoot, "draft-profile");

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          "Unknown setup profile 'draft-profile'. Expected one of: base-profile.",
        );
      },
    );
  });
});
