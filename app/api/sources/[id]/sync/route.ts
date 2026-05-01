import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import {
  enqueueSourceSync,
  getSourceConnection,
  toSummary,
} from "@/lib/integrations/shared/connections";
import { captureServerEvent } from "@/lib/analytics/server";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const connection = await getSourceConnection(userId, id);
  if (!connection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    !connection.selectedResources ||
    !Array.isArray(connection.selectedResources) ||
    connection.selectedResources.length === 0
  ) {
    return NextResponse.json(
      { error: "Select at least one resource before syncing." },
      { status: 409 },
    );
  }
  try {
    const result = await enqueueSourceSync(userId, id);
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    captureServerEvent({
      event: "source_sync_started",
      distinctId: userId,
      properties: { sourceType: connection.sourceType, jobId: result.job.id },
    });
    return NextResponse.json({
      connection: toSummary(result.connection),
      job: result.job,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not enqueue sync" },
      { status: 500 },
    );
  }
}
