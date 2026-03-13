import { defineCommand } from "citty";
import { CONFIG_FLAG_ARGS } from "../command-args.js";
import { BE_CLI_OPERATIONS_BY_RESOURCE } from "./registry.js";
import { executeBeCliOperation, renderBeCliEnvelope } from "./runtime.js";
import type { BeCliArgDefinition, BeCliOperationDefinition } from "./types.js";

const SHARED_ARGS: Record<string, BeCliArgDefinition> = {
  ...CONFIG_FLAG_ARGS,
  "base-url": {
    type: "string",
    description: "Override the backend base URL for this request.",
  },
  "body-file": {
    type: "string",
    description: "Path to a JSON file used as the request body.",
  },
  format: {
    type: "enum",
    description: "Output format.",
    options: ["json", "pretty"],
    default: "json",
  },
  write: {
    type: "string",
    description: "Write the response envelope to a JSON file.",
  },
  "expect-status": {
    type: "string",
    description:
      "Expected HTTP status. When provided, matching non-2xx responses are treated as success.",
  },
  assert: {
    type: "string",
    description:
      "JavaScript expression evaluated against the response envelope as 'response'. May be repeated.",
    multiple: true,
  },
};

function buildActionCommand(operation: BeCliOperationDefinition) {
  return defineCommand({
    meta: {
      name: operation.action,
      description: operation.description,
    },
    args: {
      ...SHARED_ARGS,
      ...(operation.args ?? {}),
    },
    async run({ args }) {
      const envelope = await executeBeCliOperation(
        operation,
        args as Record<string, unknown>,
      );
      process.stdout.write(
        `${renderBeCliEnvelope(envelope, args.format as string | undefined)}\n`,
      );
      if (!envelope.ok) {
        process.exitCode = 1;
      }
    },
  });
}

export function buildBeCliCommand() {
  const resourceCommands = Object.fromEntries(
    Object.entries(BE_CLI_OPERATIONS_BY_RESOURCE).map(
      ([resource, operations]) => [
        resource,
        defineCommand({
          meta: {
            name: resource,
            description: `Backend operations for ${resource}.`,
          },
          subCommands: Object.fromEntries(
            operations.map((operation) => [
              operation.action,
              buildActionCommand(operation),
            ]),
          ),
        }),
      ],
    ),
  );

  return defineCommand({
    meta: {
      name: "be-cli",
      description:
        "Internal backend verification CLI built on the generated TypeScript client.",
    },
    subCommands: resourceCommands,
  });
}
