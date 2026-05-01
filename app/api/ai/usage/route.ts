import { NextResponse } from "next/server";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { currentWeekRange } from "@/lib/ai/budget";
import { getUserAiUsageSummary } from "@/lib/ai/ops";
import { db } from "@/lib/db";
import { aiUsageLog } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { start, end } = currentWeekRange();
  const periodStart = new Date(`${start}T00:00:00.000Z`);
  const periodEnd = new Date(`${end}T23:59:59.999Z`);
  const rows = await db
    .select()
    .from(aiUsageLog)
    .where(
      and(
        eq(aiUsageLog.userId, userId),
        gte(aiUsageLog.createdAt, periodStart),
        lte(aiUsageLog.createdAt, periodEnd),
      ),
    )
    .orderBy(desc(aiUsageLog.createdAt));

  const summary = await getUserAiUsageSummary(userId);
  return NextResponse.json({
    usage: rows,
    summary,
    periodStart: start,
    periodEnd: end,
  });
}
