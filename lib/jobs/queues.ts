import { Job, Queue, type JobsOptions } from "bullmq";
import { getRedisConnection } from "./connection";
import {
  JOB_QUEUE_NAMES,
  type JobEnvelope,
  type JobQueueName,
  type JobStatus,
  type SerializedJobError,
} from "./types";

declare global {
  var __traceQueues: Partial<Record<JobQueueName, Queue>> | undefined;
}

const retryByQueue: Record<JobQueueName, JobsOptions> = {
  "source-sync": { attempts: 4, backoff: { type: "exponential", delay: 5000 } },
  "source-parse": { attempts: 2, backoff: { type: "fixed", delay: 2000 } },
  "story-extract": { attempts: 2, backoff: { type: "exponential", delay: 3000 } },
  "embed-chunks": { attempts: 2, backoff: { type: "fixed", delay: 5000 } },
  "ship-to-post": { attempts: 3, backoff: { type: "exponential", delay: 5000 } },
  "calendar-reminders": {
    attempts: 3,
    backoff: { type: "exponential", delay: 10_000 },
  },
};

export function getQueue(name: JobQueueName) {
  globalThis.__traceQueues ??= {};
  globalThis.__traceQueues[name] ??= new Queue(name, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      removeOnComplete: { age: 60 * 60 * 24, count: 1000 },
      removeOnFail: { age: 60 * 60 * 24 * 7, count: 5000 },
      ...retryByQueue[name],
    },
  });
  return globalThis.__traceQueues[name]!;
}

export async function enqueueJob<T>(
  queueName: JobQueueName,
  envelope: JobEnvelope<T>,
) {
  const queue = getQueue(queueName);
  const job = await queue.add(queueName, envelope, {
    jobId: envelope.jobId,
  });
  return { id: job.id!, queue: queueName };
}

export async function getJobStatus(
  queueName: JobQueueName,
  jobId: string,
): Promise<JobStatus | null> {
  const job = await Job.fromId(getQueue(queueName), jobId);
  if (!job) return null;
  return {
    id: job.id!,
    queue: queueName,
    state: await job.getState(),
    progress: job.progress,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason,
    data: job.data as JobEnvelope,
  };
}

export function isJobQueueName(value: string): value is JobQueueName {
  return JOB_QUEUE_NAMES.includes(value as JobQueueName);
}

export function serializeJobError(
  error: unknown,
  retryable = true,
): SerializedJobError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      code:
        "code" in error && typeof error.code === "string"
          ? error.code
          : undefined,
      retryable,
    };
  }
  return {
    name: "UnknownJobError",
    message: String(error),
    retryable,
  };
}
