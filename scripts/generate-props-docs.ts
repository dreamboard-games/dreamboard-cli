import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uiSdkSrc = path.join(repoRoot, "packages/ui-sdk/src");
const snippetsRoot = path.join(repoRoot, "snippets/props");

interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface ComponentConfig {
  sourceFile: string;
  interfaceName: string;
  outputName: string;
}

const COMPONENTS: ComponentConfig[] = [
  {
    sourceFile: "components/Card.tsx",
    interfaceName: "CardProps",
    outputName: "card-props",
  },
  {
    sourceFile: "components/Hand.tsx",
    interfaceName: "HandProps",
    outputName: "hand-props",
  },
  {
    sourceFile: "components/PlayArea.tsx",
    interfaceName: "PlayAreaProps",
    outputName: "play-area-props",
  },
  {
    sourceFile: "components/ActionButton.tsx",
    interfaceName: "ActionButtonProps",
    outputName: "action-button-props",
  },
  {
    sourceFile: "components/ActionPanel.tsx",
    interfaceName: "ActionPanelProps",
    outputName: "action-panel-props",
  },
  {
    sourceFile: "components/ActionPanel.tsx",
    interfaceName: "ActionGroupProps",
    outputName: "action-group-props",
  },
  {
    sourceFile: "components/PlayerInfo.tsx",
    interfaceName: "PlayerInfoProps",
    outputName: "player-info-props",
  },
  {
    sourceFile: "components/DiceRoller.tsx",
    interfaceName: "DiceRollerProps",
    outputName: "dice-roller-props",
  },
  {
    sourceFile: "components/PhaseIndicator.tsx",
    interfaceName: "PhaseIndicatorProps",
    outputName: "phase-indicator-props",
  },
  {
    sourceFile: "components/GameEndDisplay.tsx",
    interfaceName: "GameEndDisplayProps",
    outputName: "game-end-display-props",
  },
  {
    sourceFile: "components/board/TrackBoard.tsx",
    interfaceName: "TrackBoardProps",
    outputName: "track-board-props",
  },
  {
    sourceFile: "components/board/SquareGrid.tsx",
    interfaceName: "SquareGridProps",
    outputName: "square-grid-props",
  },
  {
    sourceFile: "components/board/HexGrid.tsx",
    interfaceName: "HexGridProps",
    outputName: "hex-grid-props",
  },
  {
    sourceFile: "components/board/NetworkGraph.tsx",
    interfaceName: "NetworkGraphProps",
    outputName: "network-graph-props",
  },
  {
    sourceFile: "components/board/ZoneMap.tsx",
    interfaceName: "ZoneMapProps",
    outputName: "zone-map-props",
  },
  {
    sourceFile: "components/board/SlotSystem.tsx",
    interfaceName: "SlotSystemProps",
    outputName: "slot-system-props",
  },
];

function extractProps(filePath: string, interfaceName: string): PropInfo[] {
  const program = ts.createProgram([filePath], {
    target: ts.ScriptTarget.ESNext,
    jsx: ts.JsxEmit.ReactJSX,
    noResolve: true,
    skipLibCheck: true,
    strict: false,
  });

  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) {
    throw new Error(`Could not open: ${filePath}`);
  }

  const props: PropInfo[] = [];

  function visit(node: ts.Node): void {
    if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
      for (const member of node.members) {
        if (!ts.isPropertySignature(member) || !ts.isIdentifier(member.name)) {
          continue;
        }

        const name = member.name.text;
        const required = !member.questionToken;
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
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return props;
}

function sanitiseType(type: string): string {
  return type.replace(/"/g, "'");
}

function renderSnippet(props: PropInfo[], sourceRelPath: string): string {
  const header =
    `{/* Generated from ${sourceRelPath} */}\n` +
    "{/* Run `pnpm docs:gen-props` to regenerate. Do not edit directly. */}";

  const fields = props.map((prop) => {
    const typeSafe = sanitiseType(prop.type);
    const attrParts = [`path="${prop.name}"`, `type="${typeSafe}"`];
    if (prop.required) {
      attrParts.push("required");
    }
    const body = prop.description || `\`${prop.name}\` value`;
    return `<ParamField ${attrParts.join(" ")}>\n  ${body}\n</ParamField>`;
  });

  return [header, "", ...fields, ""].join("\n");
}

async function main(): Promise<void> {
  await mkdir(snippetsRoot, { recursive: true });

  let generated = 0;

  for (const config of COMPONENTS) {
    const filePath = path.join(uiSdkSrc, config.sourceFile);
    let props: PropInfo[];

    try {
      props = extractProps(filePath, config.interfaceName);
    } catch (error) {
      process.stderr.write(`Error processing ${config.sourceFile}: ${error}\n`);
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
      `  ${config.interfaceName.padEnd(26)} -> snippets/props/${config.outputName}.mdx\n`,
    );
    generated++;
  }

  process.stdout.write(`\nGenerated ${generated} snippet files in snippets/props/\n`);
}

main().catch((error) => {
  process.stderr.write(`${error}\n`);
  process.exitCode = 1;
});
