import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedContent, storySeeds } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      pillar: storySeeds.pillarMatch,
      count: sql<number>`count(*)::int`,
    })
    .from(generatedContent)
    .leftJoin(storySeeds, eq(generatedContent.storySeedId, storySeeds.id))
    .where(eq(generatedContent.userId, userId))
    .groupBy(storySeeds.pillarMatch)
    .orderBy(desc(sql`count(*)`));

  return NextResponse.json({
    pillars: rows.map((r) => ({
      name: r.pillar ?? "unmapped",
      value: Number(r.count ?? 0),
    })),
  });
}
