import {
  getLatestCompiledResult,
  type CompiledResult,
} from "@dreamboard/api-client";

export async function findLatestSuccessfulCompiledResult(
  gameId: string,
): Promise<CompiledResult | null> {
  const { data } = await getLatestCompiledResult({
    path: { gameId },
    query: { successOnly: true },
  });
  return data ?? null;
}
