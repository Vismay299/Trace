export const JOB_QUEUE_NAMES = [
  "source-sync",
  "source-parse",
  "story-extract",
  "embed-chunks",
  "ship-to-post",
  "calendar-reminders",
] as const;

export type JobQueueName = (typeof JOB_QUEUE_NAMES)[number];

export type JobEnvelope<T = Record<string, unknown>> = {
  jobId?: string;
  userId: string;
  sourceConnectionId?: string;
  traceId?: string;
  attempt?: number;
  payload: T;
};

export type SerializedJobError = {
  name: string;
  message: string;
  code?: string;
  retryable: boolean;
};

export type JobStatus = {
  id: string;
  queue: JobQueueName;
  state: string;
  progress: unknown;
  attemptsMade: number;
  failedReason?: string;
  data?: JobEnvelope;
};
