import { Worker } from "bullmq";
import { syncGitHubConnection } from "@/lib/integrations/github/sync";
import { processShipToPost } from "@/lib/integrations/github/ship-to-post";
import { getRedisConnection } from "@/lib/jobs/connection";
import { JOB_QUEUE_NAMES, type JobQueueName } from "@/lib/jobs/types";

type Processor = (data: unknown) => Promise<unknown>;

const processors: Record<JobQueueName, Processor> = {
  "source-sync": async (data) => syncGitHubConnection(data as never),
  "source-parse": async (data) => ({ ok: true, data }),
  "story-extract": async (data) => ({ ok: true, data }),
  "embed-chunks": async (data) => ({ ok: true, deferred: "phase-2.5", data }),
  "ship-to-post": async (data) => processShipToPost(data as never),
  "calendar-reminders": async (data) => ({ ok: true, data }),
};

const workers = JOB_QUEUE_NAMES.map(
  (queue) =>
    new Worker(
      queue,
      async (job) => {
        await job.updateProgress(10);
        const result = await processors[queue](job.data);
        await job.updateProgress(100);
        return result;
      },
      { connection: getRedisConnection(), concurrency: 3 },
    ),
);

for (const worker of workers) {
  worker.on("failed", (job, error) => {
    console.error(`[worker:${worker.name}] job ${job?.id} failed`, error);
  });
}

console.log(
  `[workers] started queues: ${JOB_QUEUE_NAMES.join(", ")} (${workers.length})`,
);
