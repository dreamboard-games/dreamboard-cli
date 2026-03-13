import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { loadProjectConfig } from "../src/config/project-config.js";
import { startEmbeddedHarnessSession } from "../src/services/testing/embedded-harness.js";

type HarnessHealth = {
  status: string;
  gameId: string;
};

const DEFAULT_EXAMPLE = "examples/things-in-rings";

function resolveRepoRoot(): string {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(scriptDir, "../../..");
}

async function main(): Promise<void> {
  const repoRoot = resolveRepoRoot();
  const exampleRel = process.env.HARNESS_EXAMPLE ?? DEFAULT_EXAMPLE;
  const projectRoot = path.join(repoRoot, exampleRel);

  if (!existsSync(projectRoot)) {
    throw new Error(`Harness example not found: ${exampleRel}`);
  }

  const projectConfig = await loadProjectConfig(projectRoot);
  const harness = await startEmbeddedHarnessSession({
    projectRoot,
    projectConfig,
    configureClient: false,
  });

  try {
    const response = await fetch(`${harness.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(
        `Embedded harness health check failed with HTTP ${response.status}.`,
      );
    }

    const health = (await response.json()) as HarnessHealth;
    if (health.status !== "ready") {
      throw new Error(
        `Embedded harness reported unexpected status '${health.status}'.`,
      );
    }
    if (health.gameId !== harness.gameId) {
      throw new Error(
        `Embedded harness reported gameId ${health.gameId}, expected ${harness.gameId}.`,
      );
    }

    console.log(
      `Embedded harness smoke passed for ${exampleRel} at ${harness.baseUrl}`,
    );
  } finally {
    await harness.stop();
  }
}

await main();
