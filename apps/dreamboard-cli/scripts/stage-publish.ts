import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPublishedPackageFiles } from "../src/publish/stage-publish-layout.js";
import {
  assertPublicSkillScriptsArePublishable,
  IGNORED_PUBLIC_SKILL_ENTRY_NAMES,
  resolvePublicSkillRoot,
} from "./public-skill-utils.ts";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const stageRoot = path.join(packageRoot, ".publish", "package");
const sourcePackage = JSON.parse(
  await readFile(path.join(packageRoot, "package.json"), "utf8"),
) as {
  version: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  description?: string;
  repository?: string | { type?: string; url?: string };
  homepage?: string;
  bugs?: string | { url?: string };
  license?: string;
};
const sdkDependencyRanges = Object.fromEntries(
  await Promise.all(
    [
      [
        "@dreamboard/app-sdk",
        path.join(
          packageRoot,
          "..",
          "..",
          "packages",
          "app-sdk",
          "package.json",
        ),
      ],
      [
        "@dreamboard/sdk-types",
        path.join(
          packageRoot,
          "..",
          "..",
          "packages",
          "sdk-types",
          "package.json",
        ),
      ],
      [
        "@dreamboard/ui-sdk",
        path.join(
          packageRoot,
          "..",
          "..",
          "packages",
          "ui-sdk",
          "package.json",
        ),
      ],
    ].map(async ([packageName, packageJsonPath]) => {
      const packageJson = JSON.parse(
        await readFile(packageJsonPath, "utf8"),
      ) as { version?: string };
      return [packageName, `^${packageJson.version?.trim() ?? ""}`];
    }),
  ),
);
const packagedDependencies = Object.fromEntries(
  Object.entries(sourcePackage.dependencies ?? {}).filter(
    ([packageName]) => !packageName.startsWith("@dreamboard/"),
  ),
);
if (sourcePackage.devDependencies?.playwright) {
  packagedDependencies.playwright = sourcePackage.devDependencies.playwright;
}

const repositoryUrl =
  typeof sourcePackage.repository === "string"
    ? sourcePackage.repository
    : (sourcePackage.repository?.url ??
      process.env.DREAMBOARD_PUBLIC_REPOSITORY_URL);
const homepageUrl =
  sourcePackage.homepage ?? process.env.DREAMBOARD_PUBLIC_HOMEPAGE;
const bugsUrl =
  typeof sourcePackage.bugs === "string"
    ? sourcePackage.bugs
    : (sourcePackage.bugs?.url ?? process.env.DREAMBOARD_PUBLIC_BUGS_URL);
const publicSkillRoot = await resolvePublicSkillRoot();
await assertPublicSkillScriptsArePublishable(publicSkillRoot);

const packageJson: Record<string, unknown> = {
  name: "dreamboard",
  version: sourcePackage.version,
  description:
    sourcePackage.description ??
    "Design board games with AI and turn ideas into playable digital prototypes.",
  type: "module",
  bin: {
    dreamboard: "dist/index.js",
  },
  files: getPublishedPackageFiles(Boolean(publicSkillRoot)),
  keywords: sourcePackage.keywords ?? [
    "dreamboard",
    "cli",
    "game-dev",
    "board-game",
    "multiplayer",
  ],
  engines: {
    node: ">=20",
  },
  publishConfig: {
    access: "public",
  },
  dependencies: packagedDependencies,
  dreamboardSdkDependencyRanges: sdkDependencyRanges,
  license:
    sourcePackage.license ??
    process.env.DREAMBOARD_PUBLIC_LICENSE ??
    "UNLICENSED",
};

if (repositoryUrl) {
  packageJson.repository = {
    type: "git",
    url: repositoryUrl,
  };
}

if (homepageUrl) {
  packageJson.homepage = homepageUrl;
}

if (bugsUrl) {
  packageJson.bugs = {
    url: bugsUrl,
  };
}

async function pruneTransientSkillArtifacts(rootDir: string) {
  const entries = await readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name);
    if (IGNORED_PUBLIC_SKILL_ENTRY_NAMES.has(entry.name)) {
      await rm(entryPath, { recursive: true, force: true });
      continue;
    }
    if (entry.isDirectory()) {
      await pruneTransientSkillArtifacts(entryPath);
    }
  }
}

await rm(stageRoot, { recursive: true, force: true });
await mkdir(stageRoot, { recursive: true });
await cp(path.join(packageRoot, "dist"), path.join(stageRoot, "dist"), {
  recursive: true,
  force: true,
});
await cp(
  path.join(packageRoot, "README.md"),
  path.join(stageRoot, "README.md"),
  { force: true },
);
if (publicSkillRoot) {
  await mkdir(path.join(stageRoot, "skills"), { recursive: true });
  const stagedSkillRoot = path.join(stageRoot, "skills", "dreamboard");
  await cp(publicSkillRoot, stagedSkillRoot, {
    recursive: true,
    force: true,
  });
  await pruneTransientSkillArtifacts(stagedSkillRoot);
}
await writeFile(
  path.join(stageRoot, "package.json"),
  `${JSON.stringify(packageJson, null, 2)}\n`,
  "utf8",
);
