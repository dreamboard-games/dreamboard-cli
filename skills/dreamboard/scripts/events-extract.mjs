#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";

const DEFAULT_EVENTS_PATH = ".dreamboard/run/events.ndjson";

function printHelp() {
  console.log(`Extract fields from dreamboard run artifacts.

Usage:
  node .agents/skills/dreamboard/scripts/events-extract.mjs [options]

Options:
  --file, -f <path>       NDJSON file path (default: ${DEFAULT_EVENTS_PATH})
  --type <eventType>      Filter by event type (repeatable)
  --field <path>          Dot path to extract (e.g. message.reason)
  --player <playerId>     Filter by player ID across common message fields
  --limit <number>        Limit output records
  --no-index              Omit line index in output
  --help, -h              Show this help

Examples:
  node .agents/skills/dreamboard/scripts/events-extract.mjs --type YOUR_TURN
  node .agents/skills/dreamboard/scripts/events-extract.mjs --type ACTION_REJECTED --field message.reason
  node .agents/skills/dreamboard/scripts/events-extract.mjs --player player-2 --field message.availableActions
`);
}

function parseCliArgs(argv) {
  const options = {
    filePath: DEFAULT_EVENTS_PATH,
    types: new Set(),
    includeIndex: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const nextToken = argv[index + 1];

    if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    }
    if (token === "--no-index") {
      options.includeIndex = false;
      continue;
    }
    if (token === "--file" || token === "-f") {
      if (!nextToken) {
        throw new Error("--file requires a value");
      }
      options.filePath = nextToken;
      index += 1;
      continue;
    }
    if (token === "--type") {
      if (!nextToken) {
        throw new Error("--type requires a value");
      }
      options.types.add(nextToken);
      index += 1;
      continue;
    }
    if (token === "--field") {
      if (!nextToken) {
        throw new Error("--field requires a value");
      }
      options.fieldPath = nextToken;
      index += 1;
      continue;
    }
    if (token === "--player") {
      if (!nextToken) {
        throw new Error("--player requires a value");
      }
      options.playerId = nextToken;
      index += 1;
      continue;
    }
    if (token === "--limit") {
      if (!nextToken) {
        throw new Error("--limit requires a value");
      }
      const parsed = Number.parseInt(nextToken, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error("--limit must be a positive integer");
      }
      options.limit = parsed;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return options;
}

function getByPath(value, path) {
  const segments = path.split(".").filter(Boolean);
  let current = value;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== "object") {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

function extractPlayerCandidates(record) {
  const message = record.message ?? {};
  const players = new Set();

  const singleCandidates = [
    message.playerId,
    message.targetPlayer,
    message.toUser,
  ];
  for (const candidate of singleCandidates) {
    if (typeof candidate === "string") {
      players.add(candidate);
    }
  }

  const listCandidates = [
    message.activePlayers,
    message.previousPlayers,
    message.currentPlayers,
    message.controllablePlayerIds,
    message.eligiblePlayerIds,
  ];
  for (const candidate of listCandidates) {
    if (!Array.isArray(candidate)) {
      continue;
    }
    for (const item of candidate) {
      if (typeof item === "string") {
        players.add(item);
      }
    }
  }

  return [...players];
}

function toOutputRecord(record, lineIndex, options) {
  const output = {};

  if (options.includeIndex) {
    output.index = lineIndex;
  }
  output.observedAt = record.observedAt ?? null;
  output.sessionId = record.sessionId ?? null;
  output.eventId = record.eventId ?? null;
  output.type = record.type ?? null;

  if (options.fieldPath) {
    output.field = options.fieldPath;
    output.value = getByPath(record, options.fieldPath);
  } else {
    output.message = record.message ?? null;
  }

  return output;
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  await access(options.filePath);

  const text = await readFile(options.filePath, "utf8");
  const lines = text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let emitted = 0;
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }

    if (options.types.size > 0 && !options.types.has(record.type ?? "")) {
      continue;
    }

    if (options.playerId) {
      const players = extractPlayerCandidates(record);
      if (!players.includes(options.playerId)) {
        continue;
      }
    }

    const output = toOutputRecord(record, lineIndex + 1, options);
    console.log(JSON.stringify(output));
    emitted += 1;

    if (options.limit !== undefined && emitted >= options.limit) {
      break;
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`events-extract failed: ${message}`);
  process.exit(1);
});
