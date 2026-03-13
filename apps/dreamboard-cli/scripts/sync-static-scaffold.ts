import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";

type StaticEntry = {
  sourcePath: string;
  targetPath: string;
  checksumSha256: string;
  category: "cli-static";
  content: string;
};

type MutableEntry = Omit<StaticEntry, "checksumSha256">;

type OwnershipPattern = {
  prefix: string;
  suffix: string;
};

type ScaffoldingOwnershipConfig = {
  version: number;
  allowedPaths: {
    rootFiles: string[];
    directoryPrefixes: string[];
  };
  dynamic: {
    generatedFiles: string[];
    seedFiles: string[];
    seedFilePatterns: OwnershipPattern[];
  };
  cliStatic: {
    exactFiles: string[];
    directoryPrefixes: string[];
  };
  preservedUserFiles: string[];
};

const SHARED_DEPENDENCIES = `
"react": "^19.2.0",
"react-dom": "^19.2.0",
"framer-motion": "^12.23.24",
"motion-dom": "^12.23.23",
"motion-utils": "^12.23.6",
"lucide-react": "^0.562.0",
"clsx": "^2.1.1",
"vaul": "^1.1.2",
"zod": "^4.1.5",
"@use-gesture/react": "^10.3.1",
"@use-gesture/core": "^10.3.1"
`.trim();

const SHARED_DEV_DEPENDENCIES = `
"typescript": "^5.9.2",
"@types/react": "^19.0.0",
"@types/react-dom": "^19.0.0",
"csstype": "^3.1.3"
`.trim();

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
);
const cliStaticTemplateRoot = path.join(
  repoRoot,
  "apps",
  "dreamboard-cli",
  "src",
  "scaffold",
  "templates",
  "static",
);
const jsTemplateRoot = path.join(
  repoRoot,
  "packages",
  "js-template-resources",
  "src",
  "main",
  "resources",
  "template",
  "src",
);
const jsTypesRoot = path.join(
  repoRoot,
  "packages",
  "js-template-resources",
  "src",
  "main",
  "resources",
  "types",
);
const uiSdkRoot = path.join(repoRoot, "packages", "ui-sdk", "src");
const apiClientTypesFilePath = path.join(
  repoRoot,
  "packages",
  "api-client",
  "src",
  "types.gen.ts",
);
const ownershipPath = path.join(
  repoRoot,
  "packages",
  "sdk-types",
  "scaffolding",
  "ownership.json",
);

const outputTsPath = path.join(
  repoRoot,
  "apps",
  "dreamboard-cli",
  "src",
  "scaffold",
  "static",
  "static-files.generated.ts",
);
const outputManifestPath = path.join(
  repoRoot,
  "apps",
  "dreamboard-cli",
  "src",
  "scaffold",
  "static",
  "manifest.json",
);

function prependIndent(text: string, indent: string): string {
  return text
    .split("\n")
    .map((line) => `${indent}${line}`)
    .join("\n");
}

async function walkFiles(rootDir: string): Promise<string[]> {
  const files: string[] = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    if (!currentDir) continue;

    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  files.sort((a, b) => a.localeCompare(b));
  return files;
}

function toPosixRelative(fullPath: string, rootDir: string): string {
  return path.relative(rootDir, fullPath).replaceAll("\\", "/");
}

async function readTemplate(relativePath: string): Promise<string> {
  const templatePath = path.join(cliStaticTemplateRoot, relativePath);
  return readFile(templatePath, "utf8");
}

function renderTemplate(
  content: string,
  params: Record<string, string>,
): string {
  let rendered = content;
  for (const [key, value] of Object.entries(params)) {
    rendered = rendered.replaceAll(`{{{${key}}}}`, value);
    rendered = rendered.replaceAll(`{{${key}}}`, value);
  }
  return rendered;
}

function transformSdkImports(content: string): string {
  return content.replace(
    /from ['"](\.[^'"]+)\.js['"]/g,
    (_match, importPath) => {
      return `from '${importPath}'`;
    },
  );
}

function checksumSha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function normalizePath(pathValue: string): string {
  return pathValue.replaceAll("\\", "/").replace(/^\.\//, "");
}

function isDynamicOwned(
  targetPath: string,
  ownership: ScaffoldingOwnershipConfig,
): boolean {
  const normalized = normalizePath(targetPath);
  if (ownership.dynamic.generatedFiles.includes(normalized)) return true;
  if (ownership.dynamic.seedFiles.includes(normalized)) return true;
  return ownership.dynamic.seedFilePatterns.some(
    (pattern) =>
      normalized.startsWith(pattern.prefix) &&
      normalized.endsWith(pattern.suffix),
  );
}

function isCliStaticOwned(
  targetPath: string,
  ownership: ScaffoldingOwnershipConfig,
): boolean {
  const normalized = normalizePath(targetPath);
  if (ownership.cliStatic.exactFiles.includes(normalized)) return true;
  return ownership.cliStatic.directoryPrefixes.some((prefix) =>
    normalized.startsWith(prefix),
  );
}

async function loadOwnershipConfig(): Promise<ScaffoldingOwnershipConfig> {
  const raw = await readFile(ownershipPath, "utf8");
  return JSON.parse(raw) as ScaffoldingOwnershipConfig;
}

function validateAgainstOwnership(
  entries: StaticEntry[],
  ownership: ScaffoldingOwnershipConfig,
): void {
  const invalidStaticPaths = entries
    .map((entry) => entry.targetPath)
    .filter((targetPath) => !isCliStaticOwned(targetPath, ownership));
  if (invalidStaticPaths.length > 0) {
    throw new Error(
      [
        "Found static scaffold files not owned by cliStatic in ownership.json:",
        ...invalidStaticPaths.sort().map((pathValue) => `  - ${pathValue}`),
      ].join("\n"),
    );
  }

  const dynamicOverlaps = entries
    .map((entry) => entry.targetPath)
    .filter((targetPath) => isDynamicOwned(targetPath, ownership));
  if (dynamicOverlaps.length > 0) {
    throw new Error(
      [
        "Found static scaffold files that overlap dynamic ownership:",
        ...dynamicOverlaps.sort().map((pathValue) => `  - ${pathValue}`),
      ].join("\n"),
    );
  }

  const entryPathSet = new Set(entries.map((entry) => entry.targetPath));
  const missingExactFiles = ownership.cliStatic.exactFiles.filter(
    (targetPath) => !entryPathSet.has(targetPath),
  );
  if (missingExactFiles.length > 0) {
    throw new Error(
      [
        "ownership.json declares cliStatic exact files not present in generated static scaffold:",
        ...missingExactFiles.sort().map((pathValue) => `  - ${pathValue}`),
      ].join("\n"),
    );
  }
}

function extractTypeBlock(lines: string[], typeName: string): string | null {
  const declRegex = new RegExp(`^export type ${typeName}\\b`);
  const idx = lines.findIndex((line) => declRegex.test(line));
  if (idx === -1) return null;

  let blockStart = idx;
  let j = idx - 1;
  while (j >= 0 && lines[j]?.trim().length === 0) j--;
  if (j >= 0 && lines[j]?.trimStart().startsWith("*/")) {
    while (j >= 0 && !lines[j]?.trimStart().startsWith("/**")) j--;
    if (j >= 0 && lines[j]?.trimStart().startsWith("/**")) {
      blockStart = j;
    }
  }

  if (lines[idx]?.trimEnd().endsWith(";")) {
    return lines.slice(blockStart, idx + 1).join("\n");
  }

  let depth = 0;
  let endIdx = idx;
  for (let i = idx; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const opens = (line.match(/[({]/g) ?? []).length;
    const closes = (line.match(/[)}]/g) ?? []).length;
    depth += opens - closes;
    if (i > idx && depth === 0) {
      endIdx = i;
      break;
    }
  }

  return lines.slice(blockStart, endIdx + 1).join("\n");
}

function stripUnsupportedFields(
  block: string,
  typesToStrip: Set<string>,
): string {
  const lines = block.split("\n");
  const remove = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const trimmed = line.trimStart();
    const isFieldLine =
      line.startsWith("    ") &&
      line.trimEnd().endsWith(";") &&
      !trimmed.startsWith("*") &&
      !trimmed.startsWith("/");

    if (!isFieldLine) continue;
    if (!Array.from(typesToStrip).some((typeName) => line.includes(typeName))) {
      continue;
    }

    remove.add(i);

    let k = i - 1;
    while (k >= 0 && (lines[k] ?? "").trim().length === 0) k--;
    if (k >= 0 && (lines[k] ?? "").trimStart().startsWith("*/")) {
      const closeIndex = k;
      while (k >= 0 && !(lines[k] ?? "").trimStart().startsWith("/**")) k--;
      if (k >= 0) {
        for (let n = k; n <= closeIndex; n++) remove.add(n);
      }
    }
  }

  return lines.filter((_, idx) => !remove.has(idx)).join("\n");
}

async function generateGameMessageTypes(): Promise<string> {
  const source = await readFile(apiClientTypesFilePath, "utf8");
  const lines = source.split(/\r?\n/);
  const typeNames = [
    "GameMessageType",
    "GameMessage",
    "GameStartedMessage",
    "YourTurnMessage",
    "ActionExecutedMessage",
    "ActionRejectedMessage",
    "TurnChangedMessage",
    "GameEndedMessage",
    "StateUpdateMessage",
    "StateChangedMessage",
    "AvailableActionsMessage",
    "ErrorMessage",
    "LobbyUpdateMessage",
    "HistoryEntrySummary",
    "HistoryUpdatedMessage",
    "HistoryRestoredMessage",
  ];
  const typesToStrip = new Set([
    "SimpleGameState",
    "GameAction",
    "ActionDefinition",
    "SeatAssignment",
  ]);

  const blocks: string[] = [];
  for (const typeName of typeNames) {
    const block = extractTypeBlock(lines, typeName);
    if (!block) {
      throw new Error(
        `Could not extract '${typeName}' from ${toPosixRelative(apiClientTypesFilePath, repoRoot)}`,
      );
    }
    blocks.push(stripUnsupportedFields(block, typesToStrip));
  }

  return `${[
    "/**",
    " * Framework-defined SSE event message types.",
    " * Generated from @dreamboard/api-client — do not edit.",
    " *",
    " * Note: Fields referencing SimpleGameState are omitted here; access the current",
    " * game state via AssertContext.gameState instead.",
    " */",
    "",
    ...blocks,
  ].join("\n")}\n`;
}

async function buildStaticEntries(): Promise<StaticEntry[]> {
  const entries = new Map<string, MutableEntry>();

  const setEntry = (entry: MutableEntry): void => {
    entries.set(entry.targetPath, entry);
  };

  const templateFiles = await walkFiles(jsTemplateRoot);
  for (const fullPath of templateFiles) {
    const relative = toPosixRelative(fullPath, jsTemplateRoot);
    if (!(relative.endsWith(".ts") || relative.endsWith(".d.ts"))) continue;
    if (relative === "index.ts") continue;

    const targetPath = `app/${relative}`;

    const content = await readFile(fullPath, "utf8");
    setEntry({
      sourcePath: `packages/js-template-resources/src/main/resources/template/src/${relative}`,
      targetPath,
      category: "cli-static",
      content,
    });
  }

  const typesImports = await readTemplate("app/types-imports.ts.mustache");
  const appTypes = entries.get("app/sdk/types.d.ts");
  if (!appTypes) {
    throw new Error("Expected template app/sdk/types.d.ts to exist");
  }
  appTypes.content = `${appTypes.content}\n${typesImports.trimEnd()}\n`;
  appTypes.sourcePath =
    "packages/js-template-resources/src/main/resources/template/src/sdk/types.d.ts + apps/dreamboard-cli/src/scaffold/templates/static/app/types-imports.ts.mustache";

  const phaseHandlerPath = path.join(jsTypesRoot, "phase-handler.d.ts");
  setEntry({
    sourcePath:
      "packages/js-template-resources/src/main/resources/types/phase-handler.d.ts",
    targetPath: "app/sdk/phaseHandlers.ts",
    category: "cli-static",
    content: await readFile(phaseHandlerPath, "utf8"),
  });

  setEntry({
    sourcePath:
      "apps/dreamboard-cli/src/scaffold/templates/static/app/tsconfig.json.mustache",
    targetPath: "app/tsconfig.json",
    category: "cli-static",
    content: await readTemplate("app/tsconfig.json.mustache"),
  });

  setEntry({
    sourcePath:
      "apps/dreamboard-cli/src/scaffold/templates/static/ui/index.tsx.mustache",
    targetPath: "ui/index.tsx",
    category: "cli-static",
    content: await readTemplate("ui/index.tsx.mustache"),
  });

  setEntry({
    sourcePath:
      "apps/dreamboard-cli/src/scaffold/templates/static/ui/tsconfig.json.mustache",
    targetPath: "ui/tsconfig.json",
    category: "cli-static",
    content: await readTemplate("ui/tsconfig.json.mustache"),
  });

  const uiPackageTemplate = await readTemplate("ui/package.json.mustache");
  setEntry({
    sourcePath:
      "apps/dreamboard-cli/src/scaffold/templates/static/ui/package.json.mustache",
    targetPath: "ui/package.json",
    category: "cli-static",
    content: renderTemplate(uiPackageTemplate, {
      deps: prependIndent(SHARED_DEPENDENCIES, "    "),
      devDeps: prependIndent(SHARED_DEV_DEPENDENCIES, "    "),
    }),
  });

  const rootPackageTemplate = await readTemplate("root/package.json.mustache");
  setEntry({
    sourcePath:
      "apps/dreamboard-cli/src/scaffold/templates/static/root/package.json.mustache",
    targetPath: "package.json",
    category: "cli-static",
    content: renderTemplate(rootPackageTemplate, {
      deps: prependIndent(SHARED_DEPENDENCIES, "    "),
      devDeps: prependIndent(SHARED_DEV_DEPENDENCIES, "    "),
    }),
  });

  setEntry({
    sourcePath:
      "apps/dreamboard-cli/src/scaffold/templates/static/shared/index.ts.mustache",
    targetPath: "shared/index.ts",
    category: "cli-static",
    content: await readTemplate("shared/index.ts.mustache"),
  });

  const gameMessageContent = await generateGameMessageTypes();
  setEntry({
    sourcePath: "packages/api-client/src/types.gen.ts",
    targetPath: "shared/game-message.d.ts",
    category: "cli-static",
    content: gameMessageContent,
  });

  const sdkFiles = await walkFiles(uiSdkRoot);
  for (const fullPath of sdkFiles) {
    const relative = toPosixRelative(fullPath, uiSdkRoot);
    if (!(relative.endsWith(".ts") || relative.endsWith(".tsx"))) continue;
    if (relative === "manifest.ts" || relative === "ui-args.ts") continue;
    if (relative.includes("__fixtures__")) continue;

    const rawContent = await readFile(fullPath, "utf8");
    const transformedContent = transformSdkImports(rawContent);

    setEntry({
      sourcePath: `packages/ui-sdk/src/${relative}`,
      targetPath: `ui/sdk/${relative}`,
      category: "cli-static",
      content: transformedContent,
    });
  }

  for (const fileName of ["ui-sdk-components.d.ts", "ui-sdk-hooks.d.ts"]) {
    const fullPath = path.join(jsTypesRoot, fileName);
    setEntry({
      sourcePath: `packages/js-template-resources/src/main/resources/types/${fileName}`,
      targetPath: `ui/sdk/types/${fileName}`,
      category: "cli-static",
      content: await readFile(fullPath, "utf8"),
    });
  }

  const staticEntries: StaticEntry[] = Array.from(entries.values())
    .map((entry) => ({
      ...entry,
      checksumSha256: checksumSha256(entry.content),
    }))
    .sort((a, b) => a.targetPath.localeCompare(b.targetPath));

  return staticEntries;
}

async function writeOutputs(entries: StaticEntry[]): Promise<void> {
  const manifestEntries = entries.map((entry) => ({
    sourcePath: entry.sourcePath,
    targetPath: entry.targetPath,
    checksumSha256: entry.checksumSha256,
    category: entry.category,
  }));

  const generatedTs = `/**
 * Generated by apps/dreamboard-cli/scripts/sync-static-scaffold.ts.
 * Do not edit this file manually.
 */

export interface StaticScaffoldFile {
  sourcePath: string;
  targetPath: string;
  checksumSha256: string;
  category: "cli-static";
  content: string;
}

export const STATIC_SCAFFOLD_FILES: ReadonlyArray<StaticScaffoldFile> = ${JSON.stringify(entries, null, 2)};

export const STATIC_SCAFFOLD_FILES_BY_PATH: Readonly<Record<string, StaticScaffoldFile>> = Object.freeze(
  Object.fromEntries(STATIC_SCAFFOLD_FILES.map((entry) => [entry.targetPath, entry])) as Record<string, StaticScaffoldFile>,
);
`;

  const prettierConfig = await resolveConfig(outputTsPath);
  const formattedGeneratedTs = await format(generatedTs, {
    ...prettierConfig,
    filepath: outputTsPath,
  });

  await mkdir(path.dirname(outputTsPath), { recursive: true });
  await writeFile(outputTsPath, formattedGeneratedTs, "utf8");
  await writeFile(
    outputManifestPath,
    `${JSON.stringify(manifestEntries, null, 2)}\n`,
    "utf8",
  );
}

async function main(): Promise<void> {
  const ownership = await loadOwnershipConfig();
  const entries = await buildStaticEntries();
  validateAgainstOwnership(entries, ownership);
  await writeOutputs(entries);
  console.log(`Synced ${entries.length} static scaffold files.`);
}

await main();
