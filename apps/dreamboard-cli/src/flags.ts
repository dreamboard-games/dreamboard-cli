import { z } from "zod";
import { IS_PUBLISHED_BUILD, PUBLISHED_ENVIRONMENT } from "./build-target.js";

const configFlagsSchema = IS_PUBLISHED_BUILD
  ? z.object({})
  : z.object({
      env: z.enum(["local", "dev", "prod"]).optional(),
      token: z.string().optional(),
    });

const ruleInputFlagsSchema = z.object({
  "rule-file": z.string().optional(),
  rule: z.string().optional(),
});

const playerCountFlagsSchema = z.object({
  players: z.string().optional(),
  "player-count": z.string().optional(),
});

const newCommandArgsSchema = configFlagsSchema.extend({
  slug: z.string().min(1),
  description: z.string().min(1),
  force: z.boolean().default(false),
});

const cloneCommandArgsSchema = configFlagsSchema.extend({
  slug: z.string().min(1),
});

const pullCommandArgsSchema = configFlagsSchema.extend({
  force: z.boolean().default(false),
});

const pushCommandArgsSchema = configFlagsSchema.extend({
  force: z.boolean().default(false),
  debug: z.boolean().default(false),
});

const statusCommandArgsSchema = configFlagsSchema.extend({
  json: z.boolean().default(false),
});

const updateCommandArgsSchema = configFlagsSchema.extend({
  "update-sdk": z.boolean().default(false),
  yes: z.boolean().default(false),
  pull: z.boolean().default(false),
});

const runCommandArgsSchema = configFlagsSchema.extend({
  scenario: z.string().optional(),
  seed: z.string().optional(),
  players: z.string().optional(),
  "player-count": z.string().optional(),
  headless: z.boolean().default(true),
  resume: z.boolean().default(true),
  "new-session": z.boolean().default(false),
  until: z.enum(["YOUR_TURN", "GAME_ENDED", "ANY"]).default("YOUR_TURN"),
  "observe-events": z.enum(["turns", "all"]).default("turns"),
  "scenario-driver": z.enum(["api", "ui"]).default("api"),
  "timeout-ms": z.string().optional(),
  "max-events": z.string().optional(),
  screenshot: z.boolean().default(false),
  output: z.string().optional(),
  delay: z.string().optional(),
  width: z.string().optional(),
  height: z.string().optional(),
});

const loginCommandArgsSchema = configFlagsSchema;

const configCommandArgsSchema = configFlagsSchema.extend({
  action: z.string().optional().default("show"),
});

const authCommandArgsSchema = IS_PUBLISHED_BUILD
  ? z.object({
      action: z.enum(["clear", "login"]),
    })
  : z.object({
      action: z.enum(["set", "clear", "login", "env"]),
      tokenValue: z.string().optional(),
      token: z.string().optional(),
      jwt: z.boolean().optional(),
      env: z.enum(["local", "dev", "prod"]).optional(),
    });

export type ConfigFlags = z.infer<typeof configFlagsSchema>;
export type RuleInputFlags = z.infer<typeof ruleInputFlagsSchema>;
export type PlayerCountFlags = z.infer<typeof playerCountFlagsSchema>;

export type NewCommandArgs = z.infer<typeof newCommandArgsSchema>;
export type CloneCommandArgs = z.infer<typeof cloneCommandArgsSchema>;
export type PullCommandArgs = z.infer<typeof pullCommandArgsSchema>;
export type PushCommandArgs = z.infer<typeof pushCommandArgsSchema>;
export type StatusCommandArgs = z.infer<typeof statusCommandArgsSchema>;
export type UpdateCommandArgs = z.infer<typeof updateCommandArgsSchema>;
export type RunCommandArgs = z.infer<typeof runCommandArgsSchema>;
export type LoginCommandArgs = z.infer<typeof loginCommandArgsSchema>;
export type ConfigCommandArgs = z.infer<typeof configCommandArgsSchema>;
export type AuthCommandArgs = z.infer<typeof authCommandArgsSchema>;

function parseArgs<TOutput>(
  commandName: string,
  schema: z.ZodType<TOutput>,
  args: unknown,
): TOutput {
  const parsed = schema.safeParse(args);
  if (parsed.success) {
    return parsed.data;
  }

  const details = parsed.error.issues
    .map((issue) => {
      const field = issue.path.length > 0 ? issue.path.join(".") : "args";
      return `${field}: ${issue.message}`;
    })
    .join("; ");
  throw new Error(`Invalid arguments for '${commandName}': ${details}`);
}

export function parseConfigFlags(args: unknown): ConfigFlags {
  return parseArgs("config-flags", configFlagsSchema, args);
}

export function parseRuleInputFlags(args: unknown): RuleInputFlags {
  return parseArgs("rule-flags", ruleInputFlagsSchema, args);
}

export function parsePlayerCountFlags(args: unknown): PlayerCountFlags {
  return parseArgs("player-count", playerCountFlagsSchema, args);
}

export function parseNewCommandArgs(args: unknown): NewCommandArgs {
  return parseArgs("new", newCommandArgsSchema, args);
}

export function parseCloneCommandArgs(args: unknown): CloneCommandArgs {
  return parseArgs("clone", cloneCommandArgsSchema, args);
}

export function parsePullCommandArgs(args: unknown): PullCommandArgs {
  return parseArgs("pull", pullCommandArgsSchema, args);
}

export function parsePushCommandArgs(args: unknown): PushCommandArgs {
  return parseArgs("push", pushCommandArgsSchema, args);
}

export function parseStatusCommandArgs(args: unknown): StatusCommandArgs {
  return parseArgs("status", statusCommandArgsSchema, args);
}

export function parseUpdateCommandArgs(args: unknown): UpdateCommandArgs {
  return parseArgs("update", updateCommandArgsSchema, args);
}

export function parseRunCommandArgs(args: unknown): RunCommandArgs {
  return parseArgs("run", runCommandArgsSchema, args);
}

export function parseLoginCommandArgs(args: unknown): LoginCommandArgs {
  return parseArgs("login", loginCommandArgsSchema, args);
}

export function parseConfigCommandArgs(args: unknown): ConfigCommandArgs {
  return parseArgs("config", configCommandArgsSchema, args);
}

export function parseAuthCommandArgs(args: unknown): AuthCommandArgs {
  return parseArgs("auth", authCommandArgsSchema, args);
}
