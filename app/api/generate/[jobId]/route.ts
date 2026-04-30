import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedContent } from "@/lib/db/schema";

export const runtime = "nodejs";

/**
 * Phase 1 generation is synchronous. This route keeps the Phase 2 job polling
 * contract alive by treating the first generated content id as the job id.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ jobId: string }> },
) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await ctx.params;
  const [content] = await db
    .select()
    .from(generatedContent)
    .where(eq(generatedContent.id, jobId))
    .limit(1);
  if (!content || content.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: "completed",
    contentId: content.id,
    content,
  });
}
