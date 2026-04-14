import { defineCommand } from "citty";
import consola from "consola";
import { CONFIG_FLAG_ARGS } from "../command-args.js";
import { resolveProjectContext } from "../config/resolve.js";
import { parseConfigFlags } from "../flags.js";
import {
  generateReducerNativeArtifacts,
  isReducerNativeTestingWorkspace,
  runReducerNativeScenarios,
} from "../services/testing/reducer-native-test-harness.js";
import { shouldUseRemoteTestRuntime } from "../services/testing/runtime-mode.js";
import { resolveLatestCompiledResult } from "../services/workflows/resolve-latest-compiled-result.js";
import type { ProjectConfig } from "../types.js";

type RequestedTestRunner = "reducer" | "embedded" | "browser";

export const REDUCER_NATIVE_TEST_WORKSPACE_ERROR =
  "dreamboard test now requires a reducer-native workspace with app/game.ts, shared/generated/ui-contract.ts, test/bases/*.base.ts, and test/scenarios/*.scenario.ts. Legacy test/base-scenarios.json workspaces are no longer supported.";

export const NO_REDUCER_NATIVE_BASES_FOUND_ERROR =
  "No bases found under test/bases/*.base.ts";

export const NO_REDUCER_NATIVE_SCENARIOS_FOUND_ERROR =
  "No scenarios found under test/scenarios/*.scenario.ts";

export function resolveRequestedRunner(
  value: unknown,
): RequestedTestRunner | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  if (value === "reducer" || value === "embedded" || value === "browser") {
    return value;
  }
  throw new Error(
    `Unsupported test runner '${String(value)}'. Expected one of reducer, embedded, browser.`,
  );
}

async function assertReducerNativeTestingWorkspace(
  projectRoot: string,
): Promise<void> {
  if (await isReducerNativeTestingWorkspace(projectRoot)) {
    return;
  }

  throw new Error(REDUCER_NATIVE_TEST_WORKSPACE_ERROR);
}

async function resolveReducerNativeRuntimeIdentity(options: {
  projectRoot: string;
  projectConfig: ProjectConfig;
  useRemoteRuntime: boolean;
  runner?: RequestedTestRunner;
}): Promise<{
  gameId: string;
  compiledResultId?: string;
}> {
  if (options.useRemoteRuntime || options.runner === "browser") {
    const latestCompiledResult = await resolveLatestCompiledResult(
      options.projectRoot,
      options.projectConfig,
    );
    return {
      gameId: options.projectConfig.gameId,
      compiledResultId: latestCompiledResult.id,
    };
  }

  return {
    gameId: options.projectConfig.gameId,
    compiledResultId: options.projectConfig.compile?.latestSuccessful?.resultId,
  };
}

const generateCommand = defineCommand({
  meta: {
    name: "generate",
    description: "Generate reducer-native base artifacts for typed scenarios",
  },
  args: {
    scenario: {
      type: "string",
      description: "Optional scenario file path under test/scenarios",
    },
    ...CONFIG_FLAG_ARGS,
  },
  async run({ args }) {
    const parsedFlags = parseConfigFlags(args);
    const useRemoteRuntime = shouldUseRemoteTestRuntime(parsedFlags.env);
    const { projectRoot, projectConfig } = await resolveProjectContext(
      parsedFlags,
      { requireAuth: useRemoteRuntime },
    );

    await assertReducerNativeTestingWorkspace(projectRoot);

    const runtimeIdentity = await resolveReducerNativeRuntimeIdentity({
      projectRoot,
      projectConfig,
      useRemoteRuntime,
    });
    const { bases, scenarios } = await generateReducerNativeArtifacts({
      projectRoot,
      scenarioPath: args.scenario,
      compiledResultId: runtimeIdentity.compiledResultId,
      gameId: runtimeIdentity.gameId,
    });

    if (bases.length === 0) {
      throw new Error(NO_REDUCER_NATIVE_BASES_FOUND_ERROR);
    }
    if (scenarios.length === 0) {
      throw new Error(NO_REDUCER_NATIVE_SCENARIOS_FOUND_ERROR);
    }

    consola.success(
      `Generated ${bases.length} base state(s) for ${scenarios.length} scenario(s).`,
    );
  },
});

const runCommand = defineCommand({
  meta: {
    name: "run",
    description: "Run reducer-native scenarios from test/scenarios",
  },
  args: {
    scenario: {
      type: "string",
      description: "Optional scenario file path under test/scenarios",
    },
    runner: {
      type: "string",
      valueHint: "internal-lane",
      description:
        "Internal source-checkout parity lane override. Public installs should omit this flag.",
    },
    ...CONFIG_FLAG_ARGS,
  },
  async run({ args }) {
    const parsedFlags = parseConfigFlags(args);
    const useRemoteRuntime = shouldUseRemoteTestRuntime(parsedFlags.env);
    const runner = resolveRequestedRunner(args.runner) ?? "reducer";
    const { projectRoot, projectConfig, config } = await resolveProjectContext(
      parsedFlags,
      {
        requireAuth: useRemoteRuntime || runner === "browser",
      },
    );

    await assertReducerNativeTestingWorkspace(projectRoot);

    const runtimeIdentity = await resolveReducerNativeRuntimeIdentity({
      projectRoot,
      projectConfig,
      useRemoteRuntime,
      runner,
    });
    const summary = await runReducerNativeScenarios({
      projectRoot,
      projectConfig,
      resolvedConfig: config,
      runner,
      scenarioPath: args.scenario,
      compiledResultId: runtimeIdentity.compiledResultId,
      gameId: runtimeIdentity.gameId,
    });

    for (const result of summary.results) {
      if (result.success) {
        consola.success(`PASS ${result.id}`);
      } else {
        consola.error(
          `FAIL ${result.id}: ${result.error ?? "Scenario failed"}`,
        );
      }
    }

    consola.info(
      `Test summary: ${summary.passed} passed, ${summary.failed} failed.`,
    );
    if (summary.failed > 0) {
      process.exitCode = 1;
    }
  },
});

export default defineCommand({
  meta: {
    name: "test",
    description: "Reducer-native test runner with typed bases and scenarios",
  },
  subCommands: {
    generate: generateCommand,
    run: runCommand,
  },
});
