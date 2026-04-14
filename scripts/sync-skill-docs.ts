import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = path.join(repoRoot, "docs");
const publicSkillRoot = path.join(repoRoot, "skills", "dreamboard");

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
    sourcePath: "reference/tiled-board-topology.mdx",
    docsHref: "/docs/reference/tiled-board-topology",
    outputName: "tiled-board-topology.md",
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
  const fieldRe = /<ParamField\s+([^>]*?)>\s*([\s\S]*?)\s*<\/ParamField>/gu;
  let match: RegExpExecArray | null;

  while ((match = fieldRe.exec(snippetContent)) !== null) {
    const attrs = match[1] ?? "";
    const description = (match[2] ?? "").trim();
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
  if (rows.length === 0) {
    return "";
  }

  return [
    "| Prop | Type | Required | Description |",
    "| --- | --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| \`${row.path}\` | \`${row.type}\` | ${row.required ? "Yes" : "No"} | ${row.description} |`,
    ),
  ].join("\n");
}

async function inlineSnippets(body: string): Promise<string> {
  const snippetMap = new Map<string, string>();
  const stripped = body.replace(
    SNIPPET_IMPORT_RE,
    (_, name: string, snippetPath: string) => {
      snippetMap.set(name, path.join(repoRoot, snippetPath));
      return "";
    },
  );

  if (snippetMap.size === 0) {
    return body;
  }

  let result = stripped;

  for (const [name, filePath] of snippetMap) {
    const tag = new RegExp(`<${name}\\s*/>`, "gu");
    try {
      const snippetContent = await readFile(filePath, "utf8");
      const rows = parseParamFields(snippetContent);
      result = result.replace(
        tag,
        rows.length > 0 ? renderPropsTable(rows) : snippetContent.trim(),
      );
    } catch {
      result = result.replace(tag, "");
    }
  }

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
    title ?? doc.outputName.replace(/\.md$/u, "").replace(/-/gu, " ");
  const processedBody = await inlineSnippets(body);

  const parts = [
    "{/* Generated by scripts/sync-skill-docs.ts. */}",
    `{/* Source: docs/${doc.sourcePath} */}`,
    "",
    `# ${resolvedTitle}`,
  ];

  if (description) {
    parts.push("", description);
  }

  parts.push("", rewriteDocLinks(processedBody), "");
  return parts.join("\n");
}

async function main(): Promise<void> {
  const referencesRoot = path.join(publicSkillRoot, "references");
  await mkdir(referencesRoot, { recursive: true });

  for (const doc of DOCS_TO_COPY) {
    const sourcePath = path.join(docsRoot, doc.sourcePath);
    const outputPath = path.join(referencesRoot, doc.outputName);
    const source = await readFile(sourcePath, "utf8");
    const rendered = await renderReference(doc, source);
    await writeFile(outputPath, rendered, "utf8");
  }

  process.stdout.write("Synced skill docs into skills/dreamboard/references/.\n");
}

main().catch((error) => {
  process.stderr.write(`${error}\n`);
  process.exitCode = 1;
});
