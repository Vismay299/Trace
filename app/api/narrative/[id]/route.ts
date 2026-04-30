import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { narrativePlans, type RecommendedPost } from "@/lib/db/schema";

export const runtime = "nodejs";

const patchSchema = z.object({
  mainTheme: z.string().min(1).max(2000).optional(),
  contentStrategy: z.string().min(1).max(4000).optional(),
  recommendedPosts: z.array(z.custom<RecommendedPost>()).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [plan] = await db
    .select()
    .from(narrativePlans)
    .where(eq(narrativePlans.id, id))
    .limit(1);
  if (!plan || plan.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ plan });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  const [plan] = await db
    .select()
    .from(narrativePlans)
    .where(eq(narrativePlans.id, id))
    .limit(1);
  if (!plan || plan.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [updated] = await db
    .update(narrativePlans)
    .set({
      mainTheme: parsed.data.mainTheme ?? plan.mainTheme,
      contentStrategy: parsed.data.contentStrategy ?? plan.contentStrategy,
      recommendedPosts:
        parsed.data.recommendedPosts ?? plan.recommendedPosts ?? [],
      updatedAt: new Date(),
    })
    .where(eq(narrativePlans.id, id))
    .returning();
  return NextResponse.json({ ok: true, plan: updated });
}
