import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repoRoot = path.resolve(packageRoot, "..", "..");
const sourceRepoRoot =
  process.env.DREAMBOARD_SOURCE_REPO_ROOT ?? "/Users/kevintang/code/exp";
const snippetsRoot = path.join(repoRoot, "snippets", "examples");

type SnippetConfig = {
  sourcePath: string;
  snippetId: string;
  outputName: string;
  language: string;
};

const SNIPPETS: readonly SnippetConfig[] = [
  {
    sourcePath: "examples/board-contract-lab/app/docs-snippets.ts",
    snippetId: "manifest-card-sets",
    outputName: "manifest-card-sets.mdx",
    language: "ts",
  },
  {
    sourcePath: "examples/board-contract-lab/app/docs-snippets.ts",
    snippetId: "manifest-setup-metadata",
    outputName: "manifest-setup-metadata.mdx",
    language: "ts",
  },
  {
    sourcePath: "examples/board-contract-lab/app/setup-profiles.ts",
    snippetId: "reducer-setup-bootstrap",
    outputName: "reducer-setup-bootstrap.mdx",
    language: "ts",
  },
  {
    sourcePath: "examples/board-contract-lab/app/authoring-benchmark-typing-smoke.ts",
    snippetId: "tiled-board-helpers",
    outputName: "tiled-board-helpers.mdx",
    language: "ts",
  },
] as const;

function extractSnippet(source: string, snippetId: string): string {
  const startMarker = `docs-snippet:start ${snippetId}`;
  const endMarker = `docs-snippet:end ${snippetId}`;
  const startIndex = source.indexOf(startMarker);
  const endIndex = source.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error(`Missing snippet markers for '${snippetId}'.`);
  }

  const snippetBody = source
    .slice(source.indexOf("\n", startIndex) + 1, endIndex)
    .replace(/\n\s*\/\/\s*docs-snippet:[^\n]*/gu, "\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trimEnd();

  const lines = snippetBody.split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const minIndent = nonEmptyLines.reduce((current, line) => {
    const indent = line.match(/^\s*/u)?.[0].length ?? 0;
    return Math.min(current, indent);
  }, Number.POSITIVE_INFINITY);

  return lines
    .map((line) => line.slice(Number.isFinite(minIndent) ? minIndent : 0))
    .join("\n")
    .trim();
}

async function main() {
  await mkdir(snippetsRoot, { recursive: true });

  for (const snippet of SNIPPETS) {
    const sourcePath = path.join(sourceRepoRoot, snippet.sourcePath);
    const source = await readFile(sourcePath, "utf8");
    const extracted = extractSnippet(source, snippet.snippetId);
    const output = [
      `{/* Generated from ${snippet.sourcePath} (${snippet.snippetId}) */}`,
      "",
      `\`\`\`${snippet.language}`,
      extracted,
      "```",
      "",
    ].join("\n");
    await writeFile(path.join(snippetsRoot, snippet.outputName), output, "utf8");
  }

  process.stdout.write(`Generated ${SNIPPETS.length} example snippets.\n`);
}

await main();
