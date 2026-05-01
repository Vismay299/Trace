import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sourceChunks, sourceConnections } from "@/lib/db/schema";
import { chunkText } from "@/lib/integrations/chunker";
import { decryptToken } from "@/lib/integrations/github/crypto";
import { enqueueJob } from "@/lib/jobs/queues";
import type { JobEnvelope } from "@/lib/jobs/types";
import type { SelectedResource } from "@/lib/integrations/shared/types";
import {
  getRepoCommitDetail,
  getRepoReadme,
  listRepoCommits,
  listRepoIssues,
  listRepoPullRequests,
} from "./client";
import {
  assessGitHubArtifact,
  qualifiesForShipToPost,
  type GitHubArtifact,
} from "./filter";
import {
  normalizeCommit,
  normalizeIssue,
  normalizePullRequest,
  normalizeReadme,
  toSourceArtifact,
  type NormalizedSourceArtifact,
} from "./normalize";

export type GitHubSyncStats = {
  reposScanned: number;
  artifactsScanned: number;
  artifactsKept: number;
  chunksCreated: number;
  skippedByRule: Record<string, number>;
  shipToPostEnqueued: number;
};

export type GitHubSourceSyncPayload = {
  sourceType: string;
  selectedResources: SelectedResource[];
  enqueueShipToPost?: boolean;
};

export async function syncGitHubConnection(
  envelope: JobEnvelope<GitHubSourceSyncPayload>,
): Promise<GitHubSyncStats> {
  if (!envelope.sourceConnectionId) {
    throw new Error("sourceConnectionId is required for GitHub sync.");
  }

  const [connection] = await db
    .select()
    .from(sourceConnections)
    .where(
      and(
        eq(sourceConnections.id, envelope.sourceConnectionId),
        eq(sourceConnections.userId, envelope.userId),
      ),
    )
    .limit(1);

  if (!connection) throw new Error("Source connection not found.");
  if (connection.sourceType !== "github") {
    throw new Error(`Unsupported source sync type: ${connection.sourceType}`);
  }
  if (!connection.accessTokenEncrypted) {
    throw new Error("GitHub connection is missing an access token.");
  }

  const selectedResources =
    envelope.payload.selectedResources.length > 0
      ? envelope.payload.selectedResources
      : ((connection.selectedResources ?? []) as SelectedResource[]);

  const token = decryptToken(connection.accessTokenEncrypted);
  const previousCursor = (connection.syncCursor ?? {}) as Record<
    string,
    unknown
  >;
  const repoCursor = (previousCursor.repos ?? {}) as Record<string, string>;
  const stats: GitHubSyncStats = {
    reposScanned: 0,
    artifactsScanned: 0,
    artifactsKept: 0,
    chunksCreated: 0,
    skippedByRule: {},
    shipToPostEnqueued: 0,
  };
  const nextRepoCursor: Record<string, string> = { ...repoCursor };

  try {
    for (const resource of selectedResources) {
      const fullName = resource.fullName ?? resource.name;
      if (!fullName) continue;
      stats.reposScanned += 1;
      const since = repoCursor[resource.id];
      const artifacts = await loadRepoArtifacts({
        token,
        repo: { id: resource.id, fullName },
        since,
      });

      for (const artifact of artifacts) {
        stats.artifactsScanned += 1;
        const signal = assessGitHubArtifact(artifact);
        if (!signal.keep) {
          stats.skippedByRule[signal.reason] =
            (stats.skippedByRule[signal.reason] ?? 0) + 1;
          continue;
        }
        const normalized = toSourceArtifact(artifact, signal);
        const insertedChunks = await upsertSourceArtifact({
          userId: envelope.userId,
          sourceConnectionId: connection.id,
          artifact: normalized,
        });
        stats.artifactsKept += 1;
        stats.chunksCreated += insertedChunks;

        if (
          envelope.payload.enqueueShipToPost !== false &&
          insertedChunks > 0 &&
          qualifiesForShipToPost(artifact, signal)
        ) {
          await enqueueShipToPost({
            userId: envelope.userId,
            sourceConnectionId: connection.id,
            sourceChunkExternalId: normalized.externalId,
          });
          stats.shipToPostEnqueued += 1;
        }
      }

      nextRepoCursor[resource.id] = new Date().toISOString();
    }

    const now = new Date();
    await db
      .update(sourceConnections)
      .set({
        connectionStatus: "ready",
        lastSyncedAt: now,
        lastSyncSucceededAt: now,
        lastSyncError: null,
        syncCursor: {
          ...previousCursor,
          repos: nextRepoCursor,
          lastStats: stats,
        },
      })
      .where(eq(sourceConnections.id, connection.id));

    return stats;
  } catch (error) {
    await db
      .update(sourceConnections)
      .set({
        connectionStatus: "error",
        lastSyncError: error instanceof Error ? error.message : String(error),
      })
      .where(eq(sourceConnections.id, connection.id));
    throw error;
  }
}

async function loadRepoArtifacts({
  token,
  repo,
  since,
}: {
  token: string;
  repo: { id: string; fullName: string };
  since?: string;
}): Promise<GitHubArtifact[]> {
  const [commits, pulls, issues, readme] = await Promise.all([
    listRepoCommits({ token, repoFullName: repo.fullName, since }).catch(
      () => [],
    ),
    listRepoPullRequests({ token, repoFullName: repo.fullName }).catch(
      () => [],
    ),
    listRepoIssues({ token, repoFullName: repo.fullName }).catch(() => []),
    getRepoReadme({ token, repoFullName: repo.fullName }).catch(() => null),
  ]);

  const detailedCommits = await Promise.all(
    commits.slice(0, 30).map((commit) =>
      getRepoCommitDetail({
        token,
        repoFullName: repo.fullName,
        sha: commit.sha,
      }).catch(() => commit),
    ),
  );

  return [
    ...detailedCommits.map((commit) => normalizeCommit(repo, commit)),
    ...pulls.map((pull) => normalizePullRequest(repo, pull)),
    ...issues
      .map((issue) => normalizeIssue(repo, issue))
      .filter((issue): issue is GitHubArtifact => Boolean(issue)),
    ...(readme ? [normalizeReadme(repo, readme)] : []),
  ];
}

async function upsertSourceArtifact({
  userId,
  sourceConnectionId,
  artifact,
}: {
  userId: string;
  sourceConnectionId: string;
  artifact: NormalizedSourceArtifact;
}) {
  await db
    .delete(sourceChunks)
    .where(
      and(
        eq(sourceChunks.userId, userId),
        eq(sourceChunks.sourceConnectionId, sourceConnectionId),
        sql`${sourceChunks.metadata}->>'externalId' = ${artifact.externalId}`,
      ),
    );

  const chunks = chunkText(artifact.content, artifact.title);
  if (!chunks.length) return 0;

  await db.insert(sourceChunks).values(
    chunks.map((chunk) => ({
      userId,
      sourceConnectionId,
      sourceType: artifact.sourceType,
      sourceReference: artifact.sourceReference,
      sourceDate: artifact.sourceDate,
      title: chunk.title,
      content: chunk.text,
      metadata: {
        ...artifact.metadata,
        chunkIndex: chunk.index,
        tokens: chunk.tokens,
      },
      isActive: true,
    })),
  );

  return chunks.length;
}

async function enqueueShipToPost({
  userId,
  sourceConnectionId,
  sourceChunkExternalId,
}: {
  userId: string;
  sourceConnectionId: string;
  sourceChunkExternalId: string;
}) {
  return enqueueJob("ship-to-post", {
    jobId: `ship-to-post:${sourceConnectionId}:${sourceChunkExternalId}`,
    userId,
    sourceConnectionId,
    payload: { sourceChunkExternalId },
  });
}
