import type {
  ProjectAuthoringState,
  ProjectCompileAttempt,
  ProjectCompileState,
  ProjectConfig,
} from "../../types.js";

export function getProjectAuthoringState(
  projectConfig: ProjectConfig,
): ProjectAuthoringState {
  return projectConfig.authoring ?? {};
}

export function getProjectCompileState(
  projectConfig: ProjectConfig,
): ProjectCompileState {
  return projectConfig.compile ?? {};
}

export function updateProjectAuthoringState(
  projectConfig: ProjectConfig,
  authoring: ProjectAuthoringState,
): ProjectConfig {
  return {
    ...projectConfig,
    authoring: {
      ...getProjectAuthoringState(projectConfig),
      ...authoring,
    },
  };
}

export function updateProjectCompileState(
  projectConfig: ProjectConfig,
  compile: ProjectCompileState,
): ProjectConfig {
  return {
    ...projectConfig,
    compile: {
      ...getProjectCompileState(projectConfig),
      ...compile,
    },
  };
}

export function setLatestCompileAttempt(
  projectConfig: ProjectConfig,
  attempt: ProjectCompileAttempt,
): ProjectConfig {
  return updateProjectCompileState(projectConfig, {
    ...getProjectCompileState(projectConfig),
    latestAttempt: attempt,
    latestSuccessful:
      attempt.status === "successful" && attempt.resultId
        ? {
            resultId: attempt.resultId,
            authoringStateId: attempt.authoringStateId,
          }
        : getProjectCompileState(projectConfig).latestSuccessful,
  });
}

export function clearProjectCompileState(
  projectConfig: ProjectConfig,
): ProjectConfig {
  return {
    ...projectConfig,
    compile: {},
  };
}
