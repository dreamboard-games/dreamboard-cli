import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = path.join(repoRoot, "docs");
const publicSkillRoot = path.join(repoRoot, "skills", "dreamboard");

interface ManagedDoc {
  sourcePath: string;
  docsHref: string;
  aliases?: readonly string[];
  outputName: string;
}

const DOCS_TO_COPY: readonly ManagedDoc[] = [
  {
    sourcePath: "index.mdx",
    docsHref: "/docs",
    outputName: "index.md",
  },
  {
    sourcePath: "start/quickstart.mdx",
    docsHref: "/docs/start/quickstart",
    aliases: ["/docs/quickstart", "/quickstart"],
    outputName: "quickstart.md",
  },
  {
    sourcePath: "start/workspace-layout.mdx",
    docsHref: "/docs/start/workspace-layout",
    outputName: "workspace-layout.md",
  },
  {
    sourcePath: "start/core-concepts.mdx",
    docsHref: "/docs/start/core-concepts",
    aliases: ["/docs/concepts", "/concepts"],
    outputName: "core-concepts.md",
  },
  {
    sourcePath: "start/authoring-lifecycle.mdx",
    docsHref: "/docs/start/authoring-lifecycle",
    outputName: "authoring-lifecycle.md",
  },
  {
    sourcePath: "reference/cli.mdx",
    docsHref: "/docs/reference/cli",
    aliases: ["/reference/cli"],
    outputName: "cli.md",
  },
  {
    sourcePath: "reference/rule-authoring.mdx",
    docsHref: "/docs/reference/rule-authoring",
    aliases: ["/reference/rule-authoring"],
    outputName: "rule-authoring.md",
  },
  {
    sourcePath: "authoring/manifest.mdx",
    docsHref: "/docs/authoring/manifest",
    aliases: [
      "/docs/reference/manifest-authoring",
      "/reference/manifest-authoring",
    ],
    outputName: "manifest.md",
  },
  {
    sourcePath: "authoring/manifest-fields.mdx",
    docsHref: "/docs/authoring/manifest-fields",
    outputName: "manifest-fields.md",
  },
  {
    sourcePath: "authoring/boards-and-topology.mdx",
    docsHref: "/docs/authoring/boards-and-topology",
    outputName: "boards-and-topology.md",
  },
  {
    sourcePath: "authoring/game-contract.mdx",
    docsHref: "/docs/authoring/game-contract",
    aliases: ["/docs/reference/reducer", "/reference/reducer"],
    outputName: "game-contract.md",
  },
  {
    sourcePath: "authoring/game-definition.mdx",
    docsHref: "/docs/authoring/game-definition",
    outputName: "game-definition.md",
  },
  {
    sourcePath: "authoring/phases.mdx",
    docsHref: "/docs/authoring/phases",
    outputName: "phases.md",
  },
  {
    sourcePath: "authoring/interactions.mdx",
    docsHref: "/docs/authoring/interactions",
    outputName: "interactions.md",
  },
  {
    sourcePath: "authoring/card-actions.mdx",
    docsHref: "/docs/authoring/card-actions",
    outputName: "card-actions.md",
  },
  {
    sourcePath: "authoring/effects.mdx",
    docsHref: "/docs/authoring/effects",
    outputName: "effects.md",
  },
  {
    sourcePath: "authoring/views.mdx",
    docsHref: "/docs/authoring/views",
    outputName: "views.md",
  },
  {
    sourcePath: "authoring/static-views.mdx",
    docsHref: "/docs/authoring/static-views",
    outputName: "static-views.md",
  },
  {
    sourcePath: "authoring/derived-values.mdx",
    docsHref: "/docs/authoring/derived-values",
    outputName: "derived-values.md",
  },
  {
    sourcePath: "authoring/stages-and-zones.mdx",
    docsHref: "/docs/authoring/stages-and-zones",
    outputName: "stages-and-zones.md",
  },
  {
    sourcePath: "authoring/inputs-and-targets.mdx",
    docsHref: "/docs/authoring/inputs-and-targets",
    outputName: "inputs-and-targets.md",
  },
  {
    sourcePath: "authoring/setup-bootstrap.mdx",
    docsHref: "/docs/authoring/setup-bootstrap",
    outputName: "setup-bootstrap.md",
  },
  {
    sourcePath: "authoring/table-queries-and-ops.mdx",
    docsHref: "/docs/authoring/table-queries-and-ops",
    outputName: "table-queries-and-ops.md",
  },
  {
    sourcePath: "reference/board-topology.mdx",
    docsHref: "/docs/reference/board-topology",
    aliases: [
      "/reference/board-topology",
      "/reference/tiled-board-topology",
      "/docs/reference/tiled-board-topology",
    ],
    outputName: "board-topology.md",
  },
  {
    sourcePath: "ui/architecture.mdx",
    docsHref: "/docs/ui/architecture",
    aliases: [
      "/docs/reference/game-interface",
      "/docs/reference/ui-sdk",
      "/docs/reference/ui-library",
      "/reference/game-interface",
      "/reference/ui-sdk",
      "/reference/ui-library",
    ],
    outputName: "ui-architecture.md",
  },
  {
    sourcePath: "ui/game-shell.mdx",
    docsHref: "/docs/ui/game-shell",
    outputName: "game-shell.md",
  },
  {
    sourcePath: "ui/board-surfaces.mdx",
    docsHref: "/docs/ui/board-surfaces",
    outputName: "board-surfaces.md",
  },
  {
    sourcePath: "ui/hand-surfaces.mdx",
    docsHref: "/docs/ui/hand-surfaces",
    outputName: "hand-surfaces.md",
  },
  {
    sourcePath: "ui/prompts-and-choices.mdx",
    docsHref: "/docs/ui/prompts-and-choices",
    outputName: "prompts-and-choices.md",
  },
  {
    sourcePath: "ui/custom-renderers.mdx",
    docsHref: "/docs/ui/custom-renderers",
    outputName: "custom-renderers.md",
  },
  {
    sourcePath: "ui/components.mdx",
    docsHref: "/docs/ui/components",
    outputName: "ui-components.md",
  },
  {
    sourcePath: "testing/index.mdx",
    docsHref: "/docs/testing",
    aliases: ["/docs/reference/testing", "/reference/testing"],
    outputName: "testing.md",
  },
  {
    sourcePath: "testing/bases.mdx",
    docsHref: "/docs/testing/bases",
    outputName: "testing-bases.md",
  },
  {
    sourcePath: "testing/scenarios.mdx",
    docsHref: "/docs/testing/scenarios",
    outputName: "testing-scenarios.md",
  },
  {
    sourcePath: "testing/runtime-assertions.mdx",
    docsHref: "/docs/testing/runtime-assertions",
    outputName: "testing-runtime-assertions.md",
  },
  {
    sourcePath: "testing/ui-tests.mdx",
    docsHref: "/docs/testing/ui-tests",
    outputName: "testing-ui-tests.md",
  },
  {
    sourcePath: "testing/generated-contracts.mdx",
    docsHref: "/docs/testing/generated-contracts",
    outputName: "testing-generated-contracts.md",
  },
  {
    sourcePath: "reference/package-surfaces.mdx",
    docsHref: "/docs/reference/package-surfaces",
    outputName: "package-surfaces.md",
  },
];

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

const MDX_IMPORT_RE =
  /^import\s+(\w+)\s+from\s+["']([^"']+\.mdx)["'];?\s*\n?/gmu;

interface PropRow {
  path: string;
  type: string;
  required: boolean;
  description: string;
}

function parseParamFields(snippetContent: string): PropRow[] {
  const rows: PropRow[] = [];
  const fieldRe =
    /<ParamField\s+((?:[^>"']|"[^"]*"|'[^']*')*)>\s*([\s\S]*?)\s*<\/ParamField>/gu;
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

  const escapeCell = (value: string): string =>
    value.replace(/\|/gu, "\\|").replace(/\s*\n+\s*/gu, " ").trim();

  return [
    "| Prop | Type | Required | Description |",
    "| --- | --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| \`${escapeCell(row.path)}\` | \`${escapeCell(row.type)}\` | ${row.required ? "Yes" : "No"} | ${escapeCell(row.description)} |`,
    ),
  ].join("\n");
}

function resolveImportedMdxPath(
  importedPath: string,
  sourcePath: string,
): string {
  if (importedPath.startsWith("/")) {
    return path.join(repoRoot, importedPath);
  }

  return path.resolve(path.dirname(sourcePath), importedPath);
}

async function inlineSnippets(
  body: string,
  sourcePath: string,
): Promise<string> {
  const snippetMap = new Map<string, string>();
  const stripped = body.replace(
    MDX_IMPORT_RE,
    (_, name: string, importedPath: string) => {
      snippetMap.set(name, resolveImportedMdxPath(importedPath, sourcePath));
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
      ...(doc.aliases ?? []),
      ...(doc.aliases ?? []).map(
        (alias) => `https://dreamboard.games${alias}`,
      ),
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
  const processedBody = await inlineSnippets(
    body,
    path.join(docsRoot, doc.sourcePath),
  );

  const parts = [`# ${resolvedTitle}`];

  if (description) {
    parts.push("", description);
  }

  parts.push("", rewriteDocLinks(processedBody), "");
  return parts.join("\n");
}

async function main(): Promise<void> {
  const referencesRoot = path.join(publicSkillRoot, "references");
  await mkdir(referencesRoot, { recursive: true });
  const managedOutputs = new Set(DOCS_TO_COPY.map((doc) => doc.outputName));

  for (const entry of await readdir(referencesRoot, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }
    if (!managedOutputs.has(entry.name)) {
      await unlink(path.join(referencesRoot, entry.name));
    }
  }

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
