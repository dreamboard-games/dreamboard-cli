import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePublicSkillRoot } from "./public-skill-utils.ts";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repoRoot = path.resolve(packageRoot, "..", "..");
const docsRoot = path.join(repoRoot, "docs");

const DOCS_TO_COPY = [
  {
    sourcePath: "quickstart.mdx",
    docsHref: "/docs/quickstart",
    outputName: "quickstart.md",
  },
  {
    sourcePath: "tutorials/building-your-first-game.mdx",
    docsHref: "/docs/tutorials/building-your-first-game",
    outputName: "building-your-first-game.md",
  },
  {
    sourcePath: "reference/cli.mdx",
    docsHref: "/docs/reference/cli",
    outputName: "cli.md",
  },
  {
    sourcePath: "reference/rule-authoring.mdx",
    docsHref: "/docs/reference/rule-authoring",
    outputName: "rule-authoring.md",
  },
  {
    sourcePath: "reference/manifest-authoring.mdx",
    docsHref: "/docs/reference/manifest-authoring",
    outputName: "manifest-authoring.md",
  },
  {
    sourcePath: "reference/reducer.mdx",
    docsHref: "/docs/reference/reducer",
    outputName: "reducer.md",
  },
  {
    sourcePath: "reference/ui-library.mdx",
    docsHref: "/docs/reference/ui-library",
    outputName: "ui-library.md",
  },
  {
    sourcePath: "reference/testing.mdx",
    docsHref: "/docs/reference/testing",
    outputName: "testing.md",
  },
] as const;

type ManagedDoc = (typeof DOCS_TO_COPY)[number];

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, "").trim();
}

function parseFrontmatter(source: string): {
  title: string | null;
  description: string | null;
  body: string;
} {
  const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---\n*/u);
  if (!frontmatterMatch) {
    return {
      title: null,
      description: null,
      body: source.trim(),
    };
  }

  const frontmatter = frontmatterMatch[1] ?? "";
  const titleMatch = frontmatter.match(/^title:\s*(.+)$/mu);
  const descriptionMatch = frontmatter.match(/^description:\s*(.+)$/mu);

  return {
    title: titleMatch ? stripQuotes(titleMatch[1] ?? "") : null,
    description: descriptionMatch ? stripQuotes(descriptionMatch[1] ?? "") : null,
    body: source.slice(frontmatterMatch[0].length).trim(),
  };
}

// ---------------------------------------------------------------------------
// Snippet inlining — resolves Mintlify snippet imports into markdown tables
// ---------------------------------------------------------------------------

/** Matches: import SomeName from '/snippets/path/to/file.mdx' */
const SNIPPET_IMPORT_RE =
  /^import\s+(\w+)\s+from\s+'(\/snippets\/[^']+\.mdx)'\s*\n?/gmu;

interface PropRow {
  path: string;
  type: string;
  required: boolean;
  description: string;
}

function parseParamFields(snippetContent: string): PropRow[] {
  const rows: PropRow[] = [];
  // Matches <ParamField ...attrs...>description</ParamField>
  const fieldRe =
    /<ParamField\s+([^>]*?)>\s*([\s\S]*?)\s*<\/ParamField>/gu;
  let m: RegExpExecArray | null;

  while ((m = fieldRe.exec(snippetContent)) !== null) {
    const attrs = m[1] ?? "";
    const description = (m[2] ?? "").trim();
    const propPath = attrs.match(/\bpath="([^"]+)"/u)?.[1];
    const type = attrs.match(/\btype="([^"]+)"/u)?.[1];
    const required = /\brequired\b/u.test(attrs);
    if (propPath && type) {
      rows.push({ path: propPath, type, required, description });
    }
  }

  return rows;
}

function renderPropsTable(rows: PropRow[]): string {
  if (rows.length === 0) return "";
  const lines = [
    "| Prop | Type | Required | Description |",
    "| --- | --- | --- | --- |",
    ...rows.map(
      (r) =>
        `| \`${r.path}\` | \`${r.type}\` | ${r.required ? "Yes" : "No"} | ${r.description} |`,
    ),
  ];
  return lines.join("\n");
}

/**
 * Strips MDX snippet imports from `body` and replaces the corresponding
 * `<ComponentName />` usage tags with inlined markdown prop tables.
 */
async function inlineSnippets(body: string, repoRoot: string): Promise<string> {
  const snippetMap = new Map<string, string>(); // component name → file path

  // Collect imports and strip them from the body
  const stripped = body.replace(SNIPPET_IMPORT_RE, (_, name: string, snipPath: string) => {
    snippetMap.set(name, path.join(repoRoot, snipPath));
    return "";
  });

  if (snippetMap.size === 0) return body;

  let result = stripped;

  for (const [name, filePath] of snippetMap) {
    const tag = new RegExp(`<${name}\\s*/>`, "gu");
    try {
      const snippetContent = await readFile(filePath, "utf8");
      const rows = parseParamFields(snippetContent);
      result = result.replace(tag, renderPropsTable(rows));
    } catch {
      // Snippet file missing — remove the tag silently
      result = result.replace(tag, "");
    }
  }

  // Collapse any runs of blank lines left behind by stripped imports
  return result.replace(/\n{3,}/gu, "\n\n").trim();
}

function rewriteDocLinks(markdown: string): string {
  let output = markdown;

  for (const doc of DOCS_TO_COPY) {
    const replacement = `./${doc.outputName}`;
    const docsUrls = [
      doc.docsHref,
      `https://dreamboard.games${doc.docsHref}`,
    ];

    for (const docsUrl of docsUrls) {
      output = output.replaceAll(`](${docsUrl})`, `](${replacement})`);
    }
  }

  return output;
}

async function renderReference(doc: ManagedDoc, source: string): Promise<string> {
  const { title, description, body } = parseFrontmatter(source);
  const resolvedTitle =
    title ??
    doc.outputName.replace(/\.md$/u, "").replace(/-/gu, " ");

  // Resolve any Mintlify snippet imports into inlined markdown tables
  const processedBody = await inlineSnippets(body, repoRoot);

  const parts = [
    "<!-- Generated by apps/dreamboard-cli/scripts/sync-skill-docs.ts. -->",
    `<!-- Source: docs/${doc.sourcePath} -->`,
    "",
    `# ${resolvedTitle}`,
  ];

  if (description) {
    parts.push("", description);
  }

  parts.push("", rewriteDocLinks(processedBody), "");

  return parts.join("\n");
}

async function main() {
  const publicSkillRoot = await resolvePublicSkillRoot();
  const referencesRoot = path.join(publicSkillRoot, "references");

  try {
    await readFile(path.join(docsRoot, "reference", "reducer.mdx"), "utf8");
  } catch {
    process.stdout.write("Skipped skill docs sync because repo docs were not found.\n");
    return;
  }

  await mkdir(referencesRoot, { recursive: true });

  for (const doc of DOCS_TO_COPY) {
    const sourcePath = path.join(docsRoot, doc.sourcePath);
    const outputPath = path.join(referencesRoot, doc.outputName);
    const source = await readFile(sourcePath, "utf8");
    const rendered = await renderReference(doc, source);
    await writeFile(outputPath, rendered, "utf8");
  }

  process.stdout.write("Synced skill docs into references/.\n");
}

await main();
