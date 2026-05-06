import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { captureServerEvent } from "@/lib/analytics/server";
import { db } from "@/lib/db";
import { sourceChunks, sourceConnections } from "@/lib/db/schema";
import { enqueueJob } from "@/lib/jobs/queues";
import type { SelectedResource } from "@/lib/integrations/shared/types";
import {
  buildWebhookSyncJobs,
  verifyGitHubWebhookSignature,
  type GitHubWebhookPayload,
} from "@/lib/integrations/github/webhooks";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  if (!verifyGitHubWebhookSignature({ body, signature })) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = req.headers.get("x-github-event") ?? "";
  const delivery = req.headers.get("x-github-delivery") ?? randomUUID();
  const payload = JSON.parse(body) as GitHubWebhookPayload;
  const installationId = payload.installation?.id;

  if (!installationId) {
    return NextResponse.json({ ok: true, ignored: "missing_installation" });
  }

  if (event === "installation") {
    const result = await handleInstallationEvent(String(installationId), payload);
    return NextResponse.json({ ok: true, ...result });
  }

  if (event === "installation_repositories") {
    const result = await handleInstallationRepositories(
      String(installationId),
      payload,
    );
    return NextResponse.json({ ok: true, ...result });
  }

  const connections = await loadInstallationConnections(String(installationId));
  const jobs = buildWebhookSyncJobs({
    event,
    delivery,
    payload,
    connections,
  });

  for (const job of jobs) {
    const queued = await enqueueJob("source-sync", {
      jobId: job.jobId,
      userId: job.userId,
      sourceConnectionId: job.sourceConnectionId,
      traceId: delivery,
      payload: {
        sourceType: "github",
        selectedResources: [job.selectedResource],
        enqueueShipToPost: false,
        target: job.target,
      },
    });

    await db
      .update(sourceConnections)
      .set({
        connectionStatus: "syncing",
        lastSyncStartedAt: new Date(),
        lastJobId: queued.id,
        lastSyncError: null,
      })
      .where(eq(sourceConnections.id, job.sourceConnectionId));

    captureServerEvent({
      event: "source_sync_started",
      distinctId: job.userId,
      properties: {
        sourceType: "github",
        reason: job.target.reason ?? event,
        repo: job.target.repo.fullName,
        delivery,
      },
    });
  }

  return NextResponse.json({ ok: true, enqueued: jobs.length });
}

async function loadInstallationConnections(installationId: string) {
  const rows = await db
    .select({
      id: sourceConnections.id,
      userId: sourceConnections.userId,
      selectedResources: sourceConnections.selectedResources,
    })
    .from(sourceConnections)
    .where(
      and(
        eq(sourceConnections.sourceType, "github"),
        eq(sourceConnections.providerInstallationId, installationId),
        eq(sourceConnections.isActive, true),
      ),
    );

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    selectedResources: (row.selectedResources ?? []) as SelectedResource[],
  }));
}

async function handleInstallationEvent(
  installationId: string,
  payload: GitHubWebhookPayload,
) {
  if (payload.action !== "deleted" && payload.action !== "suspend") {
    return { ignored: `installation_${payload.action ?? "unknown"}` };
  }

  const rows = await db
    .update(sourceConnections)
    .set({
      isActive: false,
      connectionStatus: "revoked",
      lastSyncError: "GitHub App installation access was removed.",
    })
    .where(
      and(
        eq(sourceConnections.sourceType, "github"),
        eq(sourceConnections.providerInstallationId, installationId),
      ),
    )
    .returning({ id: sourceConnections.id });

  for (const row of rows) {
    await db
      .update(sourceChunks)
      .set({ isActive: false })
      .where(eq(sourceChunks.sourceConnectionId, row.id));
  }

  return { revoked: rows.length };
}

async function handleInstallationRepositories(
  installationId: string,
  payload: GitHubWebhookPayload,
) {
  const removed = payload.repositories_removed ?? [];
  if (!removed.length) return { removed: 0 };
  const removedIds = new Set(removed.map((repo) => String(repo.id)));

  const rows = await db
    .select()
    .from(sourceConnections)
    .where(
      and(
        eq(sourceConnections.sourceType, "github"),
        eq(sourceConnections.providerInstallationId, installationId),
      ),
    );

  for (const connection of rows) {
    const previous = (connection.selectedResources ?? []) as SelectedResource[];
    const next = previous.filter((resource) => !removedIds.has(resource.id));
    await db
      .update(sourceConnections)
      .set({
        selectedResources: next,
        connectionStatus: next.length ? "ready" : "needs_selection",
        lastSyncError: removed.length
          ? "Some selected repos were removed from the GitHub App installation."
          : null,
      })
      .where(eq(sourceConnections.id, connection.id));

    for (const repo of removed) {
      await db
        .update(sourceChunks)
        .set({ isActive: false })
        .where(
          and(
            eq(sourceChunks.sourceConnectionId, connection.id),
            sql`${sourceChunks.metadata}->>'repoId' = ${String(repo.id)}`,
          ),
        );
    }
  }

  return { removed: removed.length, connectionsUpdated: rows.length };
}
