import consola from "consola";
import type { CompiledResult } from "@dreamboard/api-client";
import type { ProjectConfig } from "../../types.js";
import { findCompiledResultsForAuthoringState } from "../api/compiled-results-api.js";
import {
  getProjectAuthoringState,
  getProjectPendingAuthoringSync,
} from "../project/project-state.js";

export async function resolveLatestCompiledResult(
  projectRoot: string,
  projectConfig: ProjectConfig,
): Promise<CompiledResult> {
  void projectRoot;
  const authoring = getProjectAuthoringState(projectConfig);
  if (getProjectPendingAuthoringSync(projectConfig)) {
    throw new Error(
      "Previous sync did not finish updating local scaffold files. Run 'dreamboard sync' again first.",
    );
  }
  if (!authoring.authoringStateId) {
    throw new Error(
      "This workspace does not know its authored base yet. Run 'dreamboard sync' first.",
    );
  }
  const latestSuccess = (
    await findCompiledResultsForAuthoringState({
      gameId: projectConfig.gameId,
      authoringStateId: authoring.authoringStateId,
    })
  ).find((result) => result.success);
  if (!latestSuccess) {
    throw new Error(
      "No successful compile exists for the current authored state. Run 'dreamboard compile' first.",
    );
  }

  if (latestSuccess.authoringStateId !== authoring.authoringStateId) {
    consola.warn(
      `Latest successful compile ${latestSuccess.id} belongs to ${latestSuccess.authoringStateId}, not ${authoring.authoringStateId}.`,
    );
  }

  consola.info(
    `Game summary:\n  compiledResultId: ${latestSuccess.id}\n  ruleId: ${latestSuccess.ruleId}\n  manifestId: ${latestSuccess.manifestId}`,
  );

  return latestSuccess;
}
