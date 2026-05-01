import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import {
  getSourceConnection,
  toSummary,
} from "@/lib/integrations/shared/connections";
import { getJobStatus, isJobQueueName } from "@/lib/jobs/queues";

export const runtime = "nodejs";

export async function GET(
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
  const queue = "source-sync";
  const job =
    connection.lastJobId && isJobQueueName(queue)
      ? await getJobStatus(queue, connection.lastJobId).catch(() => null)
      : null;
  return NextResponse.json({ connection: toSummary(connection), job });
}
