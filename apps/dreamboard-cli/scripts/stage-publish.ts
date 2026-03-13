import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repoRoot = path.resolve(packageRoot, "..", "..");
const stageRoot = path.join(packageRoot, ".publish", "package");
const publicSkillRoot = path.join(repoRoot, "skills", "dreamboard");
const sourcePackage = JSON.parse(
  await readFile(path.join(packageRoot, "package.json"), "utf8"),
) as {
  version: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  description?: string;
  repository?: string | { type?: string; url?: string };
  homepage?: string;
  bugs?: string | { url?: string };
  license?: string;
};

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
  files: ["dist", "README.md", "skills"],
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
  dependencies: {
    esbuild: sourcePackage.dependencies?.esbuild ?? "^0.25.1",
    playwright: sourcePackage.dependencies?.playwright ?? "^1.50.1",
  },
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
await mkdir(path.join(stageRoot, "skills"), { recursive: true });
await cp(publicSkillRoot, path.join(stageRoot, "skills", "dreamboard"), {
  recursive: true,
  force: true,
});
await writeFile(
  path.join(stageRoot, "package.json"),
  `${JSON.stringify(packageJson, null, 2)}\n`,
  "utf8",
);
