import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { strategyDocs } from "@/lib/db/schema";
import { getStrategy, invalidateStrategyCache } from "@/lib/strategy/generate";

export const runtime = "nodejs";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const doc = await getStrategy(userId);
  return NextResponse.json({ strategy: doc });
}

const updateSchema = z.object({
  positioningStatement: z.string().optional(),
  pillar1Topic: z.string().optional(),
  pillar1Description: z.string().optional(),
  pillar2Topic: z.string().optional(),
  pillar2Description: z.string().optional(),
  pillar3Topic: z.string().optional(),
  pillar3Description: z.string().optional(),
  contrarianTakes: z.array(z.string()).optional(),
  originStory: z.record(z.string()).optional(),
  targetAudience: z.record(z.unknown()).optional(),
  outcomeGoal: z.record(z.unknown()).optional(),
  voiceProfile: z.record(z.unknown()).optional(),
  postingCadence: z.record(z.unknown()).optional(),
});

export async function PUT(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const [updated] = await db
    .update(strategyDocs)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(strategyDocs.userId, userId))
    .returning();
  if (!updated) {
    return NextResponse.json(
      { error: "No strategy doc to update" },
      { status: 404 },
    );
  }
  await invalidateStrategyCache(userId);
  return NextResponse.json({ strategy: updated });
}
