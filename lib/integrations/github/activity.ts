import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sourceChunks } from "@/lib/db/schema";

export type GitHubActivitySummary = {
  meaningfulCommits: number;
  pullRequests: number;
  issues: number;
  readmes: number;
  topRepos: string[];
};

export async function getRecentGitHubActivitySummary(
  userId: string,
  since = daysAgo(7),
): Promise<GitHubActivitySummary> {
  const rows = await db
    .select({
      artifactType: sql<string>`${sourceChunks.metadata}->>'artifactType'`,
      repoFullName: sql<string>`${sourceChunks.metadata}->>'repoFullName'`,
      count: sql<number>`count(*)::int`,
    })
    .from(sourceChunks)
    .where(
      and(
        eq(sourceChunks.userId, userId),
        eq(sourceChunks.sourceType, "github"),
        eq(sourceChunks.isActive, true),
        gte(sourceChunks.createdAt, since),
      ),
    )
    .groupBy(
      sql`${sourceChunks.metadata}->>'artifactType'`,
      sql`${sourceChunks.metadata}->>'repoFullName'`,
    );

  const summary: GitHubActivitySummary = {
    meaningfulCommits: 0,
    pullRequests: 0,
    issues: 0,
    readmes: 0,
    topRepos: [],
  };
  const repoCounts = new Map<string, number>();

  for (const row of rows) {
    const count = Number(row.count ?? 0);
    if (row.artifactType === "commit") summary.meaningfulCommits += count;
    if (row.artifactType === "pull_request") summary.pullRequests += count;
    if (row.artifactType === "issue") summary.issues += count;
    if (row.artifactType === "readme") summary.readmes += count;
    if (row.repoFullName) {
      repoCounts.set(
        row.repoFullName,
        (repoCounts.get(row.repoFullName) ?? 0) + count,
      );
    }
  }

  summary.topRepos = [...repoCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([repo]) => repo);
  return summary;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}
