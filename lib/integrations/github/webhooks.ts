import { createHmac, timingSafeEqual } from "node:crypto";
import type { SelectedResource } from "@/lib/integrations/shared/types";
import type { GitHubSyncTarget } from "./sync";

export type GitHubWebhookEvent =
  | "push"
  | "pull_request"
  | "installation"
  | "installation_repositories"
  | string;

export type GitHubWebhookRepository = {
  id: number;
  name: string;
  full_name: string;
  html_url?: string;
};

export type GitHubWebhookPayload = {
  action?: string;
  installation?: { id?: number };
  repository?: GitHubWebhookRepository;
  repositories_removed?: GitHubWebhookRepository[];
  commits?: { id?: string; sha?: string }[];
  head_commit?: { id?: string };
  pull_request?: { number?: number };
};

export type GitHubWebhookConnection = {
  id: string;
  userId: string;
  selectedResources: SelectedResource[];
};

export type GitHubWebhookSyncJob = {
  jobId: string;
  userId: string;
  sourceConnectionId: string;
  selectedResource: SelectedResource;
  target: GitHubSyncTarget;
};

export function verifyGitHubWebhookSignature({
  body,
  signature,
  secret = process.env.GITHUB_SOURCE_WEBHOOK_SECRET,
}: {
  body: string;
  signature: string | null;
  secret?: string;
}): boolean {
  if (!signature || !secret) return false;
  const expected =
    "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  const actual = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    actual.length === expectedBuffer.length &&
    timingSafeEqual(actual, expectedBuffer)
  );
}

export function buildWebhookSyncJobs({
  event,
  delivery,
  payload,
  connections,
}: {
  event: GitHubWebhookEvent;
  delivery: string;
  payload: GitHubWebhookPayload;
  connections: GitHubWebhookConnection[];
}): GitHubWebhookSyncJob[] {
  const target = targetFromWebhook(event, payload);
  if (!target) return [];

  return connections.flatMap((connection) => {
    const selectedResource = connection.selectedResources.find((resource) =>
      selectedResourceMatchesRepo(resource, target.repo),
    );
    if (!selectedResource) return [];

    return [
      {
        jobId: buildWebhookJobId({ delivery, connectionId: connection.id, target }),
        userId: connection.userId,
        sourceConnectionId: connection.id,
        selectedResource,
        target,
      },
    ];
  });
}

export function targetFromWebhook(
  event: GitHubWebhookEvent,
  payload: GitHubWebhookPayload,
): GitHubSyncTarget | null {
  const repo = payload.repository;
  if (!repo) return null;
  const baseRepo = { id: String(repo.id), fullName: repo.full_name };

  if (event === "push") {
    const shas = [
      ...(payload.commits ?? []).map((commit) => commit.id ?? commit.sha),
      payload.head_commit?.id,
    ].filter((sha): sha is string => Boolean(sha));
    const uniqueShas = [...new Set(shas)];
    if (!uniqueShas.length) return null;
    return {
      repo: baseRepo,
      commitShas: uniqueShas,
      reason: "push",
    };
  }

  if (event === "pull_request") {
    const number = payload.pull_request?.number;
    if (!number) return null;
    return {
      repo: baseRepo,
      pullRequestNumbers: [number],
      reason: "pull_request",
    };
  }

  return null;
}

export function selectedResourceMatchesRepo(
  resource: SelectedResource,
  repo: { id: string; fullName: string },
) {
  return resource.id === repo.id || (resource.fullName ?? resource.name) === repo.fullName;
}

function buildWebhookJobId({
  delivery,
  connectionId,
  target,
}: {
  delivery: string;
  connectionId: string;
  target: GitHubSyncTarget;
}) {
  const shas = target.commitShas?.join(",") ?? "";
  const prs = target.pullRequestNumbers?.join(",") ?? "";
  return [
    "github-webhook",
    delivery,
    connectionId,
    target.repo.id,
    shas || prs,
  ].join(":");
}
