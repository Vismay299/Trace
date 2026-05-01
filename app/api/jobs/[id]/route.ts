import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getJobStatus, isJobQueueName } from "@/lib/jobs/queues";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const queue = new URL(req.url).searchParams.get("queue");
  if (!queue || !isJobQueueName(queue)) {
    return NextResponse.json({ error: "Invalid queue" }, { status: 400 });
  }

  const status = await getJobStatus(queue, id);
  if (!status) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (status.data?.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ job: status });
}
