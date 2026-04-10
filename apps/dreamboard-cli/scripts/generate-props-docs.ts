/**
 * Generates Mintlify <ParamField> snippet files from @dreamboard/ui-sdk component
 * TypeScript interfaces.
 *
 * Output: snippets/props/<component>-props.mdx at the repo root.
 * Run:    pnpm docs:gen-props
 *
 * The script uses the TypeScript compiler API to parse AST nodes only (no full
 * type-checking), so it requires no extra dependencies beyond the typescript
 * package already present in the workspace.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repoRoot = path.resolve(packageRoot, "..", "..");
const uiSdkSrc = path.join(repoRoot, "packages/ui-sdk/src");
const snippetsRoot = path.join(repoRoot, "snippets/props");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface ComponentConfig {
  /** Path relative to packages/ui-sdk/src */
  sourceFile: string;
  interfaceName: string;
  /** Output file name without .mdx extension */
  outputName: string;
}

// ---------------------------------------------------------------------------
// Component manifest
// ---------------------------------------------------------------------------

const COMPONENTS: ComponentConfig[] = [
  // Presentational
  { sourceFile: "components/Card.tsx", interfaceName: "CardProps", outputName: "card-props" },
  { sourceFile: "components/Hand.tsx", interfaceName: "HandProps", outputName: "hand-props" },
  { sourceFile: "components/PlayArea.tsx", interfaceName: "PlayAreaProps", outputName: "play-area-props" },
  { sourceFile: "components/ActionButton.tsx", interfaceName: "ActionButtonProps", outputName: "action-button-props" },
  { sourceFile: "components/ActionPanel.tsx", interfaceName: "ActionPanelProps", outputName: "action-panel-props" },
  { sourceFile: "components/ActionPanel.tsx", interfaceName: "ActionGroupProps", outputName: "action-group-props" },
  { sourceFile: "components/PlayerInfo.tsx", interfaceName: "PlayerInfoProps", outputName: "player-info-props" },
  { sourceFile: "components/DiceRoller.tsx", interfaceName: "DiceRollerProps", outputName: "dice-roller-props" },
  { sourceFile: "components/PhaseIndicator.tsx", interfaceName: "PhaseIndicatorProps", outputName: "phase-indicator-props" },
  { sourceFile: "components/GameEndDisplay.tsx", interfaceName: "GameEndDisplayProps", outputName: "game-end-display-props" },
  // Board primitives
  { sourceFile: "components/board/TrackBoard.tsx", interfaceName: "TrackBoardProps", outputName: "track-board-props" },
  { sourceFile: "components/board/SquareGrid.tsx", interfaceName: "SquareGridProps", outputName: "square-grid-props" },
  { sourceFile: "components/board/HexGrid.tsx", interfaceName: "HexGridProps", outputName: "hex-grid-props" },
  { sourceFile: "components/board/NetworkGraph.tsx", interfaceName: "NetworkGraphProps", outputName: "network-graph-props" },
  { sourceFile: "components/board/ZoneMap.tsx", interfaceName: "ZoneMapProps", outputName: "zone-map-props" },
  { sourceFile: "components/board/SlotSystem.tsx", interfaceName: "SlotSystemProps", outputName: "slot-system-props" },
];

// ---------------------------------------------------------------------------
// TypeScript AST extraction
// ---------------------------------------------------------------------------

function extractProps(filePath: string, interfaceName: string): PropInfo[] {
  // noResolve skips module resolution — we only need the AST, not type info.
  const program = ts.createProgram([filePath], {
    target: ts.ScriptTarget.ESNext,
    jsx: ts.JsxEmit.ReactJSX,
    noResolve: true,
    skipLibCheck: true,
    strict: false,
  });

  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) throw new Error(`Could not open: ${filePath}`);

  const props: PropInfo[] = [];

  function visit(node: ts.Node): void {
    if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
      for (const member of node.members) {
        if (!ts.isPropertySignature(member) || !ts.isIdentifier(member.name)) {
          continue;
        }

        const name = member.name.text;
        const required = !member.questionToken;

        // Use raw source text so the type reads exactly as the author wrote it.
        // Normalize newlines/indentation from multi-line types into one line
        // and tidy whitespace around parentheses and commas.
        const type = member.type
          ? member.type
              .getText(sourceFile)
              .replace(/\s+/g, " ")
              .replace(/\(\s+/g, "(")
              .replace(/,\s*\)/g, ")")
              .replace(/\s+\)/g, ")")
              .replace(/,\s+/g, ", ")
              .trim()
          : "unknown";

        // Extract JSDoc from the token's full text (includes leading trivia).
        const jsdocMatch = member
          .getFullText(sourceFile)
          .match(/\/\*\*\s*([\s\S]*?)\s*\*\//);

        const description = jsdocMatch
          ? (jsdocMatch[1] ?? "")
              .split("\n")
              .map((line: string) => line.replace(/^\s*\*\s?/, "").trim())
              .filter((line: string) => line.length > 0 && !line.startsWith("@"))
              .join(" ")
              .trim()
          : "";

        props.push({ name, type, required, description });
      }
      // Found our interface — no need to walk deeper.
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return props;
}

// ---------------------------------------------------------------------------
// Snippet rendering
// ---------------------------------------------------------------------------

/**
 * Sanitise a TypeScript type string for use inside a JSX string attribute.
 * Double-quotes that appear within the type (e.g. `"aria-hidden"`) would
 * prematurely close the attribute value, so we swap them for single quotes.
 */
function sanitiseType(type: string): string {
  return type.replace(/"/g, "'");
}

function renderSnippet(props: PropInfo[], sourceRelPath: string): string {
  const header =
    `{/* Generated from ${sourceRelPath} */}\n` +
    `{/* Run \`pnpm docs:gen-props\` to regenerate. Do not edit directly. */}`;

  const fields = props.map((prop) => {
    const typeSafe = sanitiseType(prop.type);
    const attrParts = [`path="${prop.name}"`, `type="${typeSafe}"`];
    if (prop.required) attrParts.push("required");
    const body = prop.description || `\`${prop.name}\` value`;
    return `<ParamField ${attrParts.join(" ")}>\n  ${body}\n</ParamField>`;
  });

  return [header, "", ...fields, ""].join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  await mkdir(snippetsRoot, { recursive: true });

  let generated = 0;

  for (const config of COMPONENTS) {
    const filePath = path.join(uiSdkSrc, config.sourceFile);
    let props: PropInfo[];

    try {
      props = extractProps(filePath, config.interfaceName);
    } catch (err) {
      process.stderr.write(`Error processing ${config.sourceFile}: ${err}\n`);
      continue;
    }

    if (props.length === 0) {
      process.stderr.write(
        `Warning: no props found for ${config.interfaceName} in ${config.sourceFile}\n`,
      );
      continue;
    }

    const sourceRelPath = `packages/ui-sdk/src/${config.sourceFile}`;
    const snippet = renderSnippet(props, sourceRelPath);
    const outputPath = path.join(snippetsRoot, `${config.outputName}.mdx`);
    await writeFile(outputPath, snippet, "utf8");

    process.stdout.write(
      `  ${config.interfaceName.padEnd(26)} → snippets/props/${config.outputName}.mdx\n`,
    );
    generated++;
  }

  process.stdout.write(`\nGenerated ${generated} snippet files in snippets/props/\n`);
}

await main();
