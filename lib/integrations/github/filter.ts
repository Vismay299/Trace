export type GitHubArtifactType = "commit" | "pull_request" | "issue" | "readme";

export type GitHubArtifact = {
  id: string;
  type: GitHubArtifactType;
  repoId: string;
  repoFullName: string;
  title: string;
  body: string;
  url?: string;
  author?: string | null;
  authorType?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  metadata?: Record<string, unknown>;
};

export type GitHubFilterResult = {
  keep: boolean;
  reason: string;
  score: number;
};

const botPattern = /\b(bot|dependabot|renovate|github-actions)\b/i;
const dependencyPattern =
  /\b(deps?|dependencies|dependabot|renovate|bump|upgrade package|lockfile|package-lock|pnpm-lock|yarn.lock)\b/i;
const lowSignalPattern =
  /^(wip|fix|fixes|fixed|update|updates|updated|misc|cleanup|changes|stuff|test|tests|typo|lint|format)$/i;

export function assessGitHubArtifact(
  artifact: GitHubArtifact,
): GitHubFilterResult {
  const title = artifact.title.trim();
  const body = artifact.body.trim();
  const combined = `${title}\n${body}`;
  const changedFiles = Number(artifact.metadata?.changedFiles ?? 0);
  const additions = Number(artifact.metadata?.additions ?? 0);
  const deletions = Number(artifact.metadata?.deletions ?? 0);

  if (
    botPattern.test(artifact.author ?? "") ||
    botPattern.test(artifact.authorType ?? "")
  ) {
    return { keep: false, reason: "bot_author", score: 0 };
  }

  if (artifact.type === "commit") {
    if (Boolean(artifact.metadata?.isMergeCommit) || /^merge\b/i.test(title)) {
      return { keep: false, reason: "merge_commit", score: 0 };
    }
    if (dependencyPattern.test(combined)) {
      return { keep: false, reason: "dependency_churn", score: 0.1 };
    }
    if (lowSignalPattern.test(title) && body.length < 120) {
      return { keep: false, reason: "low_information_commit", score: 0.15 };
    }
  }

  if (artifact.type !== "readme" && combined.length < 80 && changedFiles < 3) {
    return { keep: false, reason: "too_short", score: 0.2 };
  }

  let score = 0.35;
  if (title.length >= 28) score += 0.15;
  if (body.length >= 240) score += 0.2;
  if (changedFiles >= 3) score += 0.12;
  if (additions + deletions >= 80) score += 0.12;
  if (
    /\b(launch|ship|debug|refactor|migrate|fix|incident|performance|latency|customer|user|architecture|tradeoff)\b/i.test(
      combined,
    )
  ) {
    score += 0.16;
  }
  if (artifact.type === "readme") score += 0.2;
  if (artifact.type === "pull_request") score += 0.1;

  return {
    keep: score >= 0.45,
    reason: score >= 0.45 ? "meaningful_activity" : "below_signal_threshold",
    score: Math.min(1, Number(score.toFixed(2))),
  };
}

export function qualifiesForShipToPost(
  artifact: GitHubArtifact,
  result = assessGitHubArtifact(artifact),
): boolean {
  if (!result.keep) return false;
  if (artifact.type !== "commit" && artifact.type !== "pull_request")
    return false;
  const changedFiles = Number(artifact.metadata?.changedFiles ?? 0);
  const totalChanged =
    Number(artifact.metadata?.additions ?? 0) +
    Number(artifact.metadata?.deletions ?? 0);
  return result.score >= 0.7 || changedFiles >= 5 || totalChanged >= 180;
}
