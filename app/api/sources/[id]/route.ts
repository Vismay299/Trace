import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  disconnectSourceConnection,
  enqueueSourceSync,
  getSourceConnection,
  toSummary,
  updateConnectionSelection,
} from "@/lib/integrations/shared/connections";
import { repoOptionToSelectedResource } from "@/lib/integrations/github/client";
import { githubRepoSelectionLimitForTier } from "@/lib/integrations/shared/limits";
import { captureServerEvent } from "@/lib/analytics/server";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const repoSchema = z.object({
  id: z.string(),
  name: z.string(),
  fullName: z.string(),
  url: z.string(),
  visibility: z.enum(["public", "private"]),
  language: z.string().nullable(),
  pushedAt: z.string().nullable(),
  isStarred: z.boolean(),
  isPinned: z.boolean(),
  contentPotential: z.enum(["high", "medium", "low"]),
  contentSignals: z.array(z.string()),
  defaultBranch: z.string(),
});

const patchSchema = z.object({
  selectedRepos: z.array(repoSchema).optional(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const result = await withConnection(ctx);
  if (result instanceof NextResponse) return result;
  return NextResponse.json({ connection: toSummary(result.connection) });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const result = await withConnection(ctx);
  if (result instanceof NextResponse) return result;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const selectedRepos = parsed.data.selectedRepos;
  if (selectedRepos && result.connection.sourceType === "github") {
    const selectionLimit = githubRepoSelectionLimitForTier(result.tier);
    if (selectedRepos.length > selectionLimit) {
      return NextResponse.json(
        {
          error: `Your plan allows ${selectionLimit} GitHub repo selection${
            selectionLimit === 1 ? "" : "s"
          }.`,
        },
        { status: 403 },
      );
    }
    const updated = await updateConnectionSelection({
      userId: result.userId,
      connectionId: result.connection.id,
      selectedResources: selectedRepos.map(repoOptionToSelectedResource),
      metadata: { repoSelectionUpdatedAt: new Date().toISOString() },
    });
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    captureServerEvent({
      event: "source_sync_started",
      distinctId: result.userId,
      properties: {
        sourceType: "github",
        reason: "repo_selection_updated",
        removedCount: updated.removed.length,
        addedCount: updated.added.length,
      },
    });
    if (updated.added.length) {
      const sync = await enqueueSourceSync(
        result.userId,
        result.connection.id,
      ).catch(() => null);
      if (sync) {
        return NextResponse.json({
          connection: toSummary(sync.connection),
          job: sync.job,
        });
      }
    }
    return NextResponse.json({ connection: toSummary(updated.connection) });
  }

  return NextResponse.json(
    { error: "No supported update provided" },
    { status: 400 },
  );
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const result = await withConnection(ctx);
  if (result instanceof NextResponse) return result;
  const connection = await disconnectSourceConnection(
    result.userId,
    result.connection.id,
  );
  return NextResponse.json({ ok: true, connection });
}

async function withConnection(ctx: { params: Promise<{ id: string }> }) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const [connection, [user]] = await Promise.all([
    getSourceConnection(userId, id),
    db
      .select({ tier: users.tier })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
  ]);
  if (!connection || !user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return { userId, connection, tier: user.tier };
}
