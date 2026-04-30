import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { storySeeds } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const pillar = url.searchParams.get("pillar");
  const status = url.searchParams.get("status");

  const conditions = [eq(storySeeds.userId, userId)];
  if (pillar) conditions.push(eq(storySeeds.pillarMatch, pillar));
  if (status) conditions.push(eq(storySeeds.status, status));

  const rows = await db
    .select()
    .from(storySeeds)
    .where(and(...conditions))
    .orderBy(desc(storySeeds.relevanceScore), desc(storySeeds.createdAt));
  return NextResponse.json({ seeds: rows });
}
