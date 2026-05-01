import type {
  GitHubCommit,
  GitHubIssue,
  GitHubPullRequest,
  GitHubReadme,
} from "./client";
import type { GitHubArtifact } from "./filter";

export type NormalizedSourceArtifact = {
  externalId: string;
  sourceType: "github";
  sourceReference: string;
  sourceDate: Date;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
};

export function normalizeCommit(
  repo: { id: string; fullName: string },
  commit: GitHubCommit,
): GitHubArtifact {
  const [title, ...rest] = commit.commit.message.split(/\n+/);
  return {
    id: `github:commit:${repo.fullName}:${commit.sha}`,
    type: "commit",
    repoId: repo.id,
    repoFullName: repo.fullName,
    title: title || commit.sha,
    body: rest.join("\n").trim(),
    url: commit.html_url,
    author: commit.author?.login ?? commit.commit.author.name ?? null,
    authorType: commit.author?.type ?? null,
    createdAt: commit.commit.author.date ?? null,
    updatedAt: commit.commit.author.date ?? null,
    metadata: {
      sha: commit.sha,
      additions: commit.stats?.additions ?? 0,
      deletions: commit.stats?.deletions ?? 0,
      changedFiles: commit.files?.length ?? 0,
      files: commit.files?.map((file) => file.filename).slice(0, 20) ?? [],
      isMergeCommit: (commit.parents?.length ?? 0) > 1,
    },
  };
}

export function normalizePullRequest(
  repo: { id: string; fullName: string },
  pr: GitHubPullRequest,
): GitHubArtifact {
  return {
    id: `github:pr:${repo.fullName}:${pr.number}`,
    type: "pull_request",
    repoId: repo.id,
    repoFullName: repo.fullName,
    title: `PR #${pr.number}: ${pr.title}`,
    body: pr.body ?? "",
    url: pr.html_url,
    author: pr.user?.login ?? null,
    authorType: pr.user?.type ?? null,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    metadata: {
      number: pr.number,
      state: pr.state,
      mergedAt: pr.merged_at,
      additions: pr.additions ?? 0,
      deletions: pr.deletions ?? 0,
      changedFiles: pr.changed_files ?? 0,
    },
  };
}

export function normalizeIssue(
  repo: { id: string; fullName: string },
  issue: GitHubIssue,
): GitHubArtifact | null {
  if (issue.pull_request) return null;
  return {
    id: `github:issue:${repo.fullName}:${issue.number}`,
    type: "issue",
    repoId: repo.id,
    repoFullName: repo.fullName,
    title: `Issue #${issue.number}: ${issue.title}`,
    body: issue.body ?? "",
    url: issue.html_url,
    author: issue.user?.login ?? null,
    authorType: issue.user?.type ?? null,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    metadata: { number: issue.number, state: issue.state },
  };
}

export function normalizeReadme(
  repo: { id: string; fullName: string },
  readme: GitHubReadme,
): GitHubArtifact {
  const content = Buffer.from(readme.content, "base64").toString("utf8").trim();
  return {
    id: `github:readme:${repo.fullName}:${readme.path}`,
    type: "readme",
    repoId: repo.id,
    repoFullName: repo.fullName,
    title: `${repo.fullName} README`,
    body: content,
    url: readme.html_url,
    updatedAt: new Date().toISOString(),
    metadata: { path: readme.path, filename: readme.name },
  };
}

export function toSourceArtifact(
  artifact: GitHubArtifact,
  signal: { score: number; reason: string },
): NormalizedSourceArtifact {
  const date =
    artifact.updatedAt ?? artifact.createdAt ?? new Date().toISOString();
  const body = [
    `Repository: ${artifact.repoFullName}`,
    `Artifact: ${artifact.type.replaceAll("_", " ")}`,
    `Title: ${artifact.title}`,
    artifact.author ? `Author: ${artifact.author}` : null,
    artifact.url ? `URL: ${artifact.url}` : null,
    "",
    artifact.body,
  ]
    .filter((line) => line !== null)
    .join("\n");

  return {
    externalId: artifact.id,
    sourceType: "github",
    sourceReference: `${artifact.repoFullName} ${artifact.type.replaceAll("_", " ")}: ${artifact.title}`,
    sourceDate: new Date(date),
    title: artifact.title,
    content: body,
    metadata: {
      ...artifact.metadata,
      externalId: artifact.id,
      artifactType: artifact.type,
      repoId: artifact.repoId,
      repoFullName: artifact.repoFullName,
      url: artifact.url,
      author: artifact.author,
      signalScore: signal.score,
      signalReason: signal.reason,
    },
  };
}
