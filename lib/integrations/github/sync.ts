import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sourceChunks, sourceConnections } from "@/lib/db/schema";
import { chunkText } from "@/lib/integrations/chunker";
import { getInstallationAccessToken } from "@/lib/integrations/github/auth";
import { enqueueJob } from "@/lib/jobs/queues";
import type { JobEnvelope } from "@/lib/jobs/types";
import type { SelectedResource } from "@/lib/integrations/shared/types";
import {
  getRepoCommitDetail,
  getRepoPullRequestDetail,
  listRepoCommits,
  listRepoPullRequests,
} from "./client";
import {
  assessGitHubArtifact,
  qualifiesForShipToPost,
  type GitHubArtifact,
} from "./filter";
import {
  normalizeCommit,
  normalizePullRequest,
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

export type GitHubSyncTarget = {
  repo: { id: string; fullName: string };
  commitShas?: string[];
  pullRequestNumbers?: number[];
  reason?: "manual" | "push" | "pull_request";
};

export type GitHubSourceSyncPayload = {
  sourceType: string;
  selectedResources?: SelectedResource[];
  enqueueShipToPost?: boolean;
  target?: GitHubSyncTarget;
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
  if (!connection.providerInstallationId) {
    throw new Error("Reconnect GitHub to enable app-based source sync.");
  }

  const selectedResources = selectedResourcesForSync({
    payload: envelope.payload,
    connectionSelected:
      (connection.selectedResources ?? []) as SelectedResource[],
  });

  const token = await getInstallationAccessToken(connection.providerInstallationId);
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
        target: envelope.payload.target,
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
          envelope.payload.enqueueShipToPost === true &&
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
  target,
}: {
  token: string;
  repo: { id: string; fullName: string };
  since?: string;
  target?: GitHubSyncTarget;
}): Promise<GitHubArtifact[]> {
  if (target) {
    const [commits, pulls] = await Promise.all([
      Promise.all(
        (target.commitShas ?? []).slice(0, 20).map((sha) =>
          getRepoCommitDetail({
            token,
            repoFullName: repo.fullName,
            sha,
          }).catch(() => null),
        ),
      ),
      Promise.all(
        (target.pullRequestNumbers ?? []).slice(0, 10).map((number) =>
          getRepoPullRequestDetail({
            token,
            repoFullName: repo.fullName,
            number,
          }).catch(() => null),
        ),
      ),
    ]);

    return [
      ...commits
        .filter((commit): commit is NonNullable<typeof commit> =>
          Boolean(commit),
        )
        .map((commit) => normalizeCommit(repo, commit)),
      ...pulls
        .filter((pull): pull is NonNullable<typeof pull> => Boolean(pull))
        .map((pull) => normalizePullRequest(repo, pull)),
    ];
  }

  const [commits, pulls] = await Promise.all([
    listRepoCommits({ token, repoFullName: repo.fullName, since }).catch(
      () => [],
    ),
    listRepoPullRequests({ token, repoFullName: repo.fullName }).catch(
      () => [],
    ),
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
  ];
}

export function selectedResourcesForSync({
  payload,
  connectionSelected,
}: {
  payload: GitHubSourceSyncPayload;
  connectionSelected: SelectedResource[];
}) {
  const selected =
    payload.selectedResources && payload.selectedResources.length > 0
      ? payload.selectedResources
      : connectionSelected;
  if (!payload.target) return selected;

  return selected.filter((resource) => {
    const fullName = resource.fullName ?? resource.name;
    return (
      resource.id === payload.target?.repo.id ||
      fullName === payload.target?.repo.fullName
    );
  });
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
