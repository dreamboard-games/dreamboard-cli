import consola from "consola";
import type { CompiledResult } from "@dreamboard/api-client";
import type { ProjectConfig } from "../../types.js";
import { findLatestSuccessfulCompiledResult } from "../api/compiled-results-api.js";

export async function resolveCompiledResultForRun(
  projectRoot: string,
  projectConfig: ProjectConfig,
): Promise<CompiledResult> {
  const latestSuccess = await findLatestSuccessfulCompiledResult(
    projectConfig.gameId,
  );
  if (!latestSuccess) {
    throw new Error(
      "No successful compiled result found. Run 'dreamboard push' first.",
    );
  }

  if (latestSuccess.id !== projectConfig.resultId) {
    consola.warn(
      `Local resultId (${projectConfig.resultId}) differs from latest successful (${latestSuccess.id}).`,
    );
  }

  consola.info(
    `Game summary:\n  compiledResultId: ${latestSuccess.id}\n  ruleId: ${latestSuccess.ruleId}\n  manifestId: ${latestSuccess.manifestId}`,
  );

  return latestSuccess;
}
