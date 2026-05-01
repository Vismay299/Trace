import { and, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import {
  sourceChunks,
  sourceConnections,
  uploadedFiles,
} from "@/lib/db/schema";
import { enqueueJob } from "@/lib/jobs/queues";
import {
  isSourceType,
  normalizeConnectionState,
  type ConnectionState,
  type SelectedResource,
  type SourceConnectionSummary,
  type SourceType,
  type UnifiedSourceList,
} from "./types";

export async function listUnifiedSources(
  userId: string,
): Promise<UnifiedSourceList> {
  const [connections, uploads] = await Promise.all([
    db
      .select()
      .from(sourceConnections)
      .where(eq(sourceConnections.userId, userId))
      .orderBy(desc(sourceConnections.createdAt)),
    db
      .select({
        id: uploadedFiles.id,
        filename: uploadedFiles.filename,
        status: uploadedFiles.processingStatus,
        chunkCount: uploadedFiles.chunkCount,
        createdAt: uploadedFiles.createdAt,
      })
      .from(uploadedFiles)
      .where(eq(uploadedFiles.userId, userId))
      .orderBy(desc(uploadedFiles.createdAt)),
  ]);

  return {
    integrations: connections
      .filter((connection) => isSourceType(connection.sourceType))
      .map(toSummary),
    uploads: uploads.map((upload) => ({
      ...upload,
      createdAt: upload.createdAt.toISOString(),
    })),
  };
}

export async function getSourceConnection(userId: string, id: string) {
  const [connection] = await db
    .select()
    .from(sourceConnections)
    .where(
      and(eq(sourceConnections.id, id), eq(sourceConnections.userId, userId)),
    )
    .limit(1);
  return connection ?? null;
}

export async function upsertSourceConnection({
  userId,
  sourceType,
  status,
  accessTokenEncrypted,
  refreshTokenEncrypted,
  tokenExpiresAt,
  providerAccountId,
  providerInstallationId,
  sourceMetadata,
}: {
  userId: string;
  sourceType: SourceType;
  status: ConnectionState;
  accessTokenEncrypted?: string | null;
  refreshTokenEncrypted?: string | null;
  tokenExpiresAt?: Date | null;
  providerAccountId?: string | null;
  providerInstallationId?: string | null;
  sourceMetadata?: Record<string, unknown>;
}) {
  const [existing] = await db
    .select()
    .from(sourceConnections)
    .where(
      and(
        eq(sourceConnections.userId, userId),
        eq(sourceConnections.sourceType, sourceType),
      ),
    )
    .limit(1);

  const values = {
    accessTokenEncrypted,
    refreshTokenEncrypted,
    tokenExpiresAt,
    providerAccountId,
    providerInstallationId,
    connectionStatus: status,
    sourceMetadata: sourceMetadata ?? {},
    isActive: true,
  };

  if (existing) {
    const [updated] = await db
      .update(sourceConnections)
      .set(values)
      .where(eq(sourceConnections.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(sourceConnections)
    .values({
      userId,
      sourceType,
      ...values,
    })
    .returning();
  return created;
}

export async function updateConnectionSelection({
  userId,
  connectionId,
  selectedResources,
  metadata,
}: {
  userId: string;
  connectionId: string;
  selectedResources: SelectedResource[];
  metadata?: Record<string, unknown>;
}) {
  const connection = await getSourceConnection(userId, connectionId);
  if (!connection) return null;

  const previous = (connection.selectedResources ?? []) as SelectedResource[];
  const selectedIds = new Set(selectedResources.map((resource) => resource.id));
  const previousIds = new Set(previous.map((resource) => resource.id));
  const removed = previous.filter((resource) => !selectedIds.has(resource.id));
  const added = selectedResources.filter(
    (resource) => !previousIds.has(resource.id),
  );

  if (removed.length) {
    for (const resource of removed) {
      await db
        .update(sourceChunks)
        .set({ isActive: false })
        .where(
          and(
            eq(sourceChunks.userId, userId),
            eq(sourceChunks.sourceConnectionId, connectionId),
            sql`${sourceChunks.metadata}->>'repoId' = ${resource.id}`,
          ),
        );
    }
  }

  const nextMetadata = {
    ...((connection.sourceMetadata ?? {}) as Record<string, unknown>),
    ...(metadata ?? {}),
    selectedRepos: selectedResources,
  };

  const [updated] = await db
    .update(sourceConnections)
    .set({
      selectedResources,
      sourceMetadata: nextMetadata,
      connectionStatus: selectedResources.length ? "ready" : "needs_selection",
      lastSyncError: null,
    })
    .where(eq(sourceConnections.id, connectionId))
    .returning();

  return { connection: updated, removed, added };
}

export async function disconnectSourceConnection(userId: string, id: string) {
  const [updated] = await db
    .update(sourceConnections)
    .set({
      isActive: false,
      connectionStatus: "not_connected",
      accessTokenEncrypted: null,
      refreshTokenEncrypted: null,
      tokenExpiresAt: null,
      lastSyncError: null,
    })
    .where(
      and(eq(sourceConnections.id, id), eq(sourceConnections.userId, userId)),
    )
    .returning();
  return updated ?? null;
}

export async function enqueueSourceSync(userId: string, id: string) {
  const connection = await getSourceConnection(userId, id);
  if (!connection) return null;

  const job = await enqueueJob("source-sync", {
    userId,
    sourceConnectionId: id,
    traceId: randomUUID(),
    payload: {
      sourceType: connection.sourceType,
      selectedResources: connection.selectedResources ?? [],
    },
  });

  const [updated] = await db
    .update(sourceConnections)
    .set({
      connectionStatus: "syncing",
      lastSyncStartedAt: new Date(),
      lastJobId: job.id,
      lastSyncError: null,
    })
    .where(eq(sourceConnections.id, id))
    .returning();

  return { connection: updated, job };
}

export function toSummary(
  connection: typeof sourceConnections.$inferSelect,
): SourceConnectionSummary {
  return {
    id: connection.id,
    sourceType: connection.sourceType as SourceType,
    status: normalizeConnectionState(connection.connectionStatus),
    selectedCount: ((connection.selectedResources ?? []) as unknown[]).length,
    selectedResources: (connection.selectedResources ??
      []) as SelectedResource[],
    lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
    lastSyncStartedAt: connection.lastSyncStartedAt?.toISOString() ?? null,
    lastSyncSucceededAt: connection.lastSyncSucceededAt?.toISOString() ?? null,
    lastSyncError: connection.lastSyncError,
    lastJobId: connection.lastJobId,
    metadata: (connection.sourceMetadata ?? {}) as Record<string, unknown>,
    syncCursor: (connection.syncCursor ?? null) as Record<
      string,
      unknown
    > | null,
    createdAt: connection.createdAt.toISOString(),
  };
}
