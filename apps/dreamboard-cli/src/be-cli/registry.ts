import {
  addSeat,
  assignSeat,
  createGame,
  createGameRule,
  createSession,
  deleteGame,
  findManifests,
  getGame,
  getGameBySlug,
  getGameRule,
  getGameSources,
  getLatestCompiledResult,
  getLatestGameRule,
  getManifest,
  getSessionByShortCode,
  getSessionStatus,
  healthCheck,
  listCompiledResults,
  listGameRules,
  listGames,
  removeSeat,
  restoreHistory,
  saveManifest,
  startGame,
  submitAction,
  unassignSeat,
  updateSeat,
  validateAction,
} from "@dreamboard/api-client";
import type { BeCliArgDefinition, BeCliOperationDefinition } from "./types.js";

function stringArg(description: string): BeCliArgDefinition {
  return {
    type: "string",
    description,
  };
}

function booleanArg(description: string): BeCliArgDefinition {
  return {
    type: "boolean",
    description,
  };
}

function camelFromKebab(value: string): string {
  return value.replace(/-([a-z])/g, (_, letter: string) =>
    letter.toUpperCase(),
  );
}

function getArg(args: Record<string, unknown>, name: string): unknown {
  return args[name] ?? args[camelFromKebab(name)];
}

function requireStringArg(
  args: Record<string, unknown>,
  name: string,
  label = `--${name}`,
): string {
  const value = getArg(args, name);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required argument: ${label}`);
  }
  return value.trim();
}

function optionalStringArg(
  args: Record<string, unknown>,
  name: string,
): string | undefined {
  const value = getArg(args, name);
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function optionalBooleanArg(
  args: Record<string, unknown>,
  name: string,
): boolean | undefined {
  const value = getArg(args, name);
  return typeof value === "boolean" ? value : undefined;
}

function optionalNumberArg(
  args: Record<string, unknown>,
  name: string,
  label = `--${name}`,
): number | undefined {
  const value = optionalStringArg(args, name);
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Expected ${label} to be a number, received '${value}'.`);
  }
  return parsed;
}

function requireBody(context: { body: unknown }): unknown {
  return context.body;
}

const GAME_ID_ARG = stringArg("Unique identifier for the game.");
const RULE_ID_ARG = stringArg("Unique identifier for the game rule.");
const MANIFEST_ID_ARG = stringArg("Unique identifier for the manifest.");
const SESSION_ID_ARG = stringArg("Unique identifier for the session.");
const PLAYER_ID_ARG = stringArg("Unique identifier for the player/seat.");

export const BE_CLI_OPERATIONS: BeCliOperationDefinition[] = [
  {
    resource: "health",
    action: "check",
    description: "Check backend health.",
    requiresAuth: false,
    buildRequest: () => ({
      url: "/health",
    }),
    invoke: (request) => healthCheck(request),
  },
  {
    resource: "games",
    action: "list",
    description: "List games for the authenticated user.",
    args: {
      "include-not-initialized": booleanArg(
        "Include games that have not completed initialization.",
      ),
    },
    buildRequest: ({ args }) => ({
      query: {
        includeNotInitialized: optionalBooleanArg(
          args,
          "include-not-initialized",
        ),
      },
    }),
    invoke: (request) => listGames(request),
  },
  {
    resource: "games",
    action: "get",
    description: "Fetch a game by ID.",
    args: {
      "game-id": GAME_ID_ARG,
    },
    buildRequest: ({ args }) => ({
      path: {
        gameId: requireStringArg(args, "game-id"),
      },
    }),
    invoke: (request) => getGame(request),
  },
  {
    resource: "games",
    action: "get-by-slug",
    description: "Fetch a game by slug.",
    args: {
      slug: stringArg("URL-safe game slug."),
      "include-deleted": booleanArg("Include soft-deleted games."),
    },
    buildRequest: ({ args }) => ({
      path: {
        slug: requireStringArg(args, "slug"),
      },
      query: {
        includeDeleted: optionalBooleanArg(args, "include-deleted"),
      },
    }),
    invoke: (request) => getGameBySlug(request),
  },
  {
    resource: "games",
    action: "create",
    description: "Create a new game.",
    bodyFileMode: "required",
    buildRequest: (context) => ({
      body: requireBody(context),
    }),
    invoke: (request) => createGame(request),
  },
  {
    resource: "games",
    action: "delete",
    description: "Delete a game.",
    args: {
      "game-id": GAME_ID_ARG,
    },
    buildRequest: ({ args }) => ({
      path: {
        gameId: requireStringArg(args, "game-id"),
      },
    }),
    invoke: (request) => deleteGame(request),
  },
  {
    resource: "rules",
    action: "list",
    description: "List game rule versions.",
    args: {
      "game-id": GAME_ID_ARG,
      limit: stringArg("Maximum number of rules to return."),
    },
    buildRequest: ({ args }) => ({
      path: {
        gameId: requireStringArg(args, "game-id"),
      },
      query: {
        limit: optionalNumberArg(args, "limit"),
      },
    }),
    invoke: (request) => listGameRules(request),
  },
  {
    resource: "rules",
    action: "latest",
    description: "Fetch the latest game rule.",
    args: {
      "game-id": GAME_ID_ARG,
    },
    buildRequest: ({ args }) => ({
      path: {
        gameId: requireStringArg(args, "game-id"),
      },
    }),
    invoke: (request) => getLatestGameRule(request),
  },
  {
    resource: "rules",
    action: "get",
    description: "Fetch a specific rule by ID.",
    args: {
      "rule-id": RULE_ID_ARG,
    },
    buildRequest: ({ args }) => ({
      path: {
        ruleId: requireStringArg(args, "rule-id"),
      },
    }),
    invoke: (request) => getGameRule(request),
  },
  {
    resource: "rules",
    action: "create",
    description: "Create a new rule version.",
    bodyFileMode: "required",
    args: {
      "game-id": GAME_ID_ARG,
    },
    buildRequest: ({ args, body }) => ({
      path: {
        gameId: requireStringArg(args, "game-id"),
      },
      body,
    }),
    invoke: (request) => createGameRule(request),
  },
  {
    resource: "manifests",
    action: "list",
    description: "List manifest versions for a game and rule.",
    args: {
      "game-id": GAME_ID_ARG,
      "rule-id": RULE_ID_ARG,
      limit: stringArg("Maximum number of manifests to return."),
    },
    buildRequest: ({ args }) => ({
      path: {
        gameId: requireStringArg(args, "game-id"),
      },
      query: {
        ruleId: requireStringArg(args, "rule-id"),
        limit: optionalNumberArg(args, "limit"),
      },
    }),
    invoke: (request) => findManifests(request),
  },
  {
    resource: "manifests",
    action: "get",
    description: "Fetch a manifest by ID.",
    args: {
      "manifest-id": MANIFEST_ID_ARG,
    },
    buildRequest: ({ args }) => ({
      path: {
        manifestId: requireStringArg(args, "manifest-id"),
      },
    }),
    invoke: (request) => getManifest(request),
  },
  {
    resource: "manifests",
    action: "save",
    description: "Create a new manifest version.",
    bodyFileMode: "required",
    args: {
      "game-id": GAME_ID_ARG,
    },
    buildRequest: ({ args, body }) => ({
      path: {
        gameId: requireStringArg(args, "game-id"),
      },
      body,
    }),
    invoke: (request) => saveManifest(request),
  },
  {
    resource: "results",
    action: "latest",
    description: "Fetch the latest compiled result.",
    args: {
      "game-id": GAME_ID_ARG,
      "success-only": booleanArg("Only return successful compiled results."),
    },
    buildRequest: ({ args }) => ({
      path: {
        gameId: requireStringArg(args, "game-id"),
      },
      query: {
        successOnly: optionalBooleanArg(args, "success-only"),
      },
    }),
    invoke: (request) => getLatestCompiledResult(request),
  },
  {
    resource: "results",
    action: "list",
    description: "List compiled results for a game.",
    args: {
      "game-id": GAME_ID_ARG,
      limit: stringArg("Maximum number of results to return."),
    },
    buildRequest: ({ args }) => ({
      path: {
        gameId: requireStringArg(args, "game-id"),
      },
      query: {
        limit: optionalNumberArg(args, "limit"),
      },
    }),
    invoke: (request) => listCompiledResults(request),
  },
  {
    resource: "sources",
    action: "get",
    description: "Fetch source files for a game/result.",
    args: {
      "game-id": GAME_ID_ARG,
      "result-id": stringArg("Optional compiled result ID."),
    },
    buildRequest: ({ args }) => ({
      path: {
        gameId: requireStringArg(args, "game-id"),
      },
      query: {
        resultId: optionalStringArg(args, "result-id"),
      },
    }),
    invoke: (request) => getGameSources(request),
  },
  {
    resource: "sessions",
    action: "create",
    description: "Create a new session for a game.",
    bodyFileMode: "required",
    args: {
      "game-id": GAME_ID_ARG,
    },
    buildRequest: ({ args, body }) => ({
      path: {
        gameId: requireStringArg(args, "game-id"),
      },
      body,
    }),
    invoke: (request) => createSession(request),
  },
  {
    resource: "sessions",
    action: "get-by-code",
    description: "Fetch a session by short code.",
    args: {
      "short-code": stringArg("Memorable short code for the session."),
    },
    buildRequest: ({ args }) => ({
      path: {
        shortCode: requireStringArg(args, "short-code"),
      },
    }),
    invoke: (request) => getSessionByShortCode(request),
  },
  {
    resource: "sessions",
    action: "status",
    description: "Fetch current session status.",
    args: {
      "session-id": SESSION_ID_ARG,
    },
    buildRequest: ({ args }) => ({
      path: {
        sessionId: requireStringArg(args, "session-id"),
      },
    }),
    invoke: (request) => getSessionStatus(request),
  },
  {
    resource: "sessions",
    action: "start",
    description: "Start a session.",
    args: {
      "session-id": SESSION_ID_ARG,
    },
    buildRequest: ({ args }) => ({
      path: {
        sessionId: requireStringArg(args, "session-id"),
      },
    }),
    invoke: (request) => startGame(request),
  },
  {
    resource: "sessions",
    action: "validate-action",
    description: "Validate an action against a session.",
    bodyFileMode: "required",
    args: {
      "session-id": SESSION_ID_ARG,
    },
    buildRequest: ({ args, body }) => ({
      path: {
        sessionId: requireStringArg(args, "session-id"),
      },
      body,
    }),
    invoke: (request) => validateAction(request),
  },
  {
    resource: "sessions",
    action: "submit-action",
    description: "Submit an action to a session.",
    bodyFileMode: "required",
    args: {
      "session-id": SESSION_ID_ARG,
    },
    buildRequest: ({ args, body }) => ({
      path: {
        sessionId: requireStringArg(args, "session-id"),
      },
      body,
    }),
    invoke: (request) => submitAction(request),
  },
  {
    resource: "sessions",
    action: "add-seat",
    description: "Add a seat to a session.",
    args: {
      "session-id": SESSION_ID_ARG,
    },
    buildRequest: ({ args }) => ({
      path: {
        sessionId: requireStringArg(args, "session-id"),
      },
    }),
    invoke: (request) => addSeat(request),
  },
  {
    resource: "sessions",
    action: "assign-seat",
    description: "Assign the current user to a seat.",
    args: {
      "session-id": SESSION_ID_ARG,
      "player-id": PLAYER_ID_ARG,
    },
    buildRequest: ({ args }) => ({
      path: {
        sessionId: requireStringArg(args, "session-id"),
        playerId: requireStringArg(args, "player-id"),
      },
    }),
    invoke: (request) => assignSeat(request),
  },
  {
    resource: "sessions",
    action: "remove-seat",
    description: "Remove a seat from a session.",
    args: {
      "session-id": SESSION_ID_ARG,
      "player-id": PLAYER_ID_ARG,
    },
    buildRequest: ({ args }) => ({
      path: {
        sessionId: requireStringArg(args, "session-id"),
        playerId: requireStringArg(args, "player-id"),
      },
    }),
    invoke: (request) => removeSeat(request),
  },
  {
    resource: "sessions",
    action: "unassign-seat",
    description: "Unassign the current user from a seat.",
    args: {
      "session-id": SESSION_ID_ARG,
      "player-id": PLAYER_ID_ARG,
    },
    buildRequest: ({ args }) => ({
      path: {
        sessionId: requireStringArg(args, "session-id"),
        playerId: requireStringArg(args, "player-id"),
      },
    }),
    invoke: (request) => unassignSeat(request),
  },
  {
    resource: "sessions",
    action: "update-seat",
    description: "Update seat metadata for a player.",
    bodyFileMode: "required",
    args: {
      "session-id": SESSION_ID_ARG,
      "player-id": PLAYER_ID_ARG,
    },
    buildRequest: ({ args, body }) => ({
      path: {
        sessionId: requireStringArg(args, "session-id"),
        playerId: requireStringArg(args, "player-id"),
      },
      body,
    }),
    invoke: (request) => updateSeat(request),
  },
  {
    resource: "sessions",
    action: "restore-history",
    description: "Restore a session to a previous history point.",
    bodyFileMode: "required",
    args: {
      "session-id": SESSION_ID_ARG,
    },
    buildRequest: ({ args, body }) => ({
      path: {
        sessionId: requireStringArg(args, "session-id"),
      },
      body,
    }),
    invoke: (request) => restoreHistory(request),
  },
];

export const BE_CLI_OPERATIONS_BY_RESOURCE = BE_CLI_OPERATIONS.reduce<
  Record<string, BeCliOperationDefinition[]>
>((acc, operation) => {
  if (!acc[operation.resource]) {
    acc[operation.resource] = [];
  }
  acc[operation.resource].push(operation);
  return acc;
}, {});
