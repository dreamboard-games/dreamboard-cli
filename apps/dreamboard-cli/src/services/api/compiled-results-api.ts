import {
  getCompiledResult,
  getJob,
  getLatestCompiledResult,
  type CompiledResult,
  type JobDetailResponse,
} from "@dreamboard/api-client";
import { formatApiError } from "../../utils/errors.js";
import { sleep } from "../../utils/strings.js";

export async function findLatestSuccessfulCompiledResult(
  gameId: string,
): Promise<CompiledResult | null> {
  const { data } = await getLatestCompiledResult({
    path: { gameId },
    query: { successOnly: true },
  });
  return data ?? null;
}

export async function getCompiledResultSdk(
  gameId: string,
  compiledResultId: string,
): Promise<CompiledResult> {
  const { data, error, response } = await getCompiledResult({
    path: {
      gameId,
      compiledResultId,
    },
  });
  if (error || !data) {
    throw new Error(
      formatApiError(error, response, "Failed to fetch compiled result"),
    );
  }
  return data;
}

export async function waitForCompiledResultJobSdk(options: {
  gameId: string;
  jobId: string;
  onProgress?: (job: JobDetailResponse) => void;
}): Promise<{
  job: JobDetailResponse;
  compiledResult: CompiledResult;
}> {
  const { gameId, jobId, onProgress } = options;
  let previousTransitionKey: string | null = null;

  for (let attempt = 0; attempt < 180; attempt += 1) {
    const {
      data: job,
      error,
      response,
    } = await getJob({
      path: { jobId },
    });
    if (error || !job) {
      throw new Error(formatApiError(error, response, "Failed to get job"));
    }

    const transitionKey = `${job.status}:${job.phase ?? ""}`;
    if (transitionKey !== previousTransitionKey) {
      previousTransitionKey = transitionKey;
      onProgress?.(job);
    }

    if (job.status === "COMPLETED" || job.status === "FAILED") {
      const compiledResultId =
        job.createdCompiledResultId ?? job.createdAppScriptId;
      if (!compiledResultId) {
        throw new Error(
          job.errorMessage ?? `Compile job ${jobId} finished without a result.`,
        );
      }

      const compiledResult = await getCompiledResultSdk(
        gameId,
        compiledResultId,
      );
      return { job, compiledResult };
    }

    if (job.status === "CANCELLED" || job.status === "INTERRUPTED") {
      throw new Error(
        job.errorMessage ?? `Compile job ${jobId} ${job.status.toLowerCase()}.`,
      );
    }

    await sleep(1000);
  }

  throw new Error(`Compile job ${jobId} did not complete in time.`);
}
