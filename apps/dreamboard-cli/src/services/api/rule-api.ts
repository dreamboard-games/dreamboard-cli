import { getLatestGameRule, createGameRule } from "@dreamboard/api-client";
import { toDreamboardApiError } from "../../utils/errors.js";

export async function getLatestRuleIdSdk(gameId: string): Promise<string> {
  const { data, error, response } = await getLatestGameRule({
    path: { gameId },
  });
  if (error || !data) {
    throw toDreamboardApiError(error, response, "Failed to get latest rule");
  }
  return data.ruleId;
}

export async function saveRuleSdk(
  gameId: string,
  ruleText: string,
): Promise<{ ruleId: string }> {
  const { data, error, response } = await createGameRule({
    path: { gameId },
    body: { ruleText },
  });
  if (error || !data) {
    throw toDreamboardApiError(error, response, "Failed to save game rule");
  }
  return { ruleId: data.ruleId };
}
