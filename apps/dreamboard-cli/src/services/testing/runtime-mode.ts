import { IS_PUBLISHED_BUILD } from "../../build-target.js";

export function isRemoteTestEnvironment(
  environment: string | undefined,
): environment is "dev" | "prod" {
  return environment === "dev" || environment === "prod";
}

export function shouldUseRemoteTestRuntime(
  environment: string | undefined,
): boolean {
  return IS_PUBLISHED_BUILD || isRemoteTestEnvironment(environment);
}
