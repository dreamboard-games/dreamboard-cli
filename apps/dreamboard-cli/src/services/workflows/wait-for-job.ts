import {
  cancelConversationJob,
  getJob,
  type JobDetailResponse,
} from "@dreamboard/api-client";
import { sleep } from "../../utils/strings.js";
import { streamJobProgress } from "../../ui/agent-progress.js";
import { formatApiError } from "../../utils/errors.js";

export async function waitForJob(
  jobId: string,
  conversationId?: string,
): Promise<JobDetailResponse> {
  let cancelledByUser = false;
  const abortController = new AbortController();

  const handleSigInt = async () => {
    if (cancelledByUser) return;
    cancelledByUser = true;
    console.log("\nCancelling job...");
    abortController.abort();
    if (conversationId) {
      try {
        await cancelConversationJob({
          path: { conversationId },
        });
      } catch (error) {
        console.error(
          `Failed to cancel job: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  };

  process.once("SIGINT", handleSigInt);

  try {
    if (conversationId) {
      try {
        const streamResult = await streamJobProgress(
          conversationId,
          abortController.signal,
        );
        if (streamResult.cancelled) {
          cancelledByUser = true;
        }
      } catch (error) {
        if (!cancelledByUser) {
          console.error(
            `Failed to stream job progress: ${error instanceof Error ? error.message : String(error)}. Falling back to polling.`,
          );
        }
      }
    }
  } finally {
    process.off("SIGINT", handleSigInt);
  }

  if (cancelledByUser) {
    throw new Error("Job cancelled by user.");
  }

  const maxAttempts = 180;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
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
    if (job.status === "COMPLETED") return job;
    if (job.status === "FAILED" || job.status === "CANCELLED") {
      throw new Error(`Job ${jobId} failed with status ${job.status}`);
    }
    await sleep(1000);
  }
  throw new Error(`Job ${jobId} did not complete in time.`);
}
