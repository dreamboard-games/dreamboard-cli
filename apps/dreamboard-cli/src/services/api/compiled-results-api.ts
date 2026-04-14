import {
  getCompiledResult,
  getJob,
  getLatestCompiledResult,
  listCompiledResults,
  type CompiledResult,
  type JobDetailResponse,
} from "@dreamboard/api-client";
import { toDreamboardApiError } from "../../utils/errors.js";
import { sleep } from "../../utils/strings.js";

function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function formatTerminalCompileJobMessage(
  job: Pick<
    JobDetailResponse,
    "createdAt" | "errorMessage" | "jobId" | "message" | "phase" | "status"
  >,
): string {
  const detail = firstNonEmpty(job.errorMessage, job.message);
  const phase = firstNonEmpty(job.phase);
  const prefix = `Compile ${job.status.toLowerCase()}${phase ? ` [${phase}]` : ""}`;
  return detail
    ? `${prefix}: ${detail}`
    : `${prefix}: job ${job.jobId} ended before a compiled result was created.`;
}

function compareCreatedAtDesc(
  left: Pick<CompiledResult, "createdAt">,
  right: Pick<CompiledResult, "createdAt">,
): number {
  const leftTime = Date.parse(left.createdAt);
  const rightTime = Date.parse(right.createdAt);
  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
    return rightTime - leftTime;
  }
  if (Number.isFinite(rightTime)) {
    return 1;
  }
  if (Number.isFinite(leftTime)) {
    return -1;
  }
  return 0;
}

async function findFallbackCompiledResultForJob(options: {
  gameId: string;
  job: Pick<JobDetailResponse, "createdAt">;
}): Promise<CompiledResult | null> {
  const { gameId, job } = options;
  const results = await listCompiledResults({
    path: { gameId },
    query: {
      limit: 100,
    },
  });
  if (results.error || !results.data) {
    return null;
  }
  if (results.data.results.length === 0) {
    return null;
  }

  const jobCreatedAtMs = Date.parse(job.createdAt);
  const resultsCreatedAfterJob = Number.isFinite(jobCreatedAtMs)
    ? results.data.results.filter((result) => {
        const resultCreatedAtMs = Date.parse(result.createdAt);
        return (
          !Number.isFinite(resultCreatedAtMs) ||
          resultCreatedAtMs >= jobCreatedAtMs
        );
      })
    : results.data.results;
  const candidateResults =
    resultsCreatedAfterJob.length > 0
      ? resultsCreatedAfterJob
      : results.data.results;

  return [...candidateResults].sort(compareCreatedAtDesc)[0] ?? null;
}

export async function findLatestSuccessfulCompiledResult(
  gameId: string,
): Promise<CompiledResult | null> {
  const { data } = await getLatestCompiledResult({
    path: { gameId },
    query: { successOnly: true },
  });
  return data ?? null;
}

export async function findCompiledResultsForAuthoringState(options: {
  gameId: string;
  authoringStateId: string;
}): Promise<CompiledResult[]> {
  const { gameId, authoringStateId } = options;
  const { data, error, response } = await listCompiledResults({
    path: { gameId },
    query: {
      limit: 100,
      authoringStateId,
    },
  });
  if (error || !data) {
    throw toDreamboardApiError(
      error,
      response,
      "Failed to list compiled results",
    );
  }
  return data.results;
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
    throw toDreamboardApiError(
      error,
      response,
      "Failed to fetch compiled result",
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
      throw toDreamboardApiError(error, response, "Failed to get job");
    }

    const transitionKey = `${job.status}:${job.phase ?? ""}`;
    if (transitionKey !== previousTransitionKey) {
      previousTransitionKey = transitionKey;
      onProgress?.(job);
    }

    if (job.status === "COMPLETED" || job.status === "FAILED") {
      const compiledResultId =
        job.createdCompiledResultId ?? job.createdAppScriptId;
      if (compiledResultId) {
        const compiledResult = await getCompiledResultSdk(
          gameId,
          compiledResultId,
        );
        return { job, compiledResult };
      }

      const fallbackCompiledResult = await findFallbackCompiledResultForJob({
        gameId,
        job,
      });
      if (fallbackCompiledResult) {
        return { job, compiledResult: fallbackCompiledResult };
      }

      throw new Error(formatTerminalCompileJobMessage(job));
    }

    if (job.status === "CANCELLED" || job.status === "INTERRUPTED") {
      throw new Error(formatTerminalCompileJobMessage(job));
    }

    await sleep(1000);
  }

  throw new Error(`Compile job ${jobId} did not complete in time.`);
}
