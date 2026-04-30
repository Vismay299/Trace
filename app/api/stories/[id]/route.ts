import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { storySeeds } from "@/lib/db/schema";

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
  const [row] = await db
    .select()
    .from(storySeeds)
    .where(eq(storySeeds.id, id))
    .limit(1);
  if (!row || row.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ seed: row });
}

const patchSchema = z.object({
  status: z.enum(["new", "used", "skipped", "archived"]).optional(),
  pillarMatch: z.string().optional(),
  title: z.string().optional(),
  summary: z.string().optional(),
});

export async function PATCH(
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
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  const [existing] = await db
    .select()
    .from(storySeeds)
    .where(eq(storySeeds.id, id))
    .limit(1);
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [updated] = await db
    .update(storySeeds)
    .set(parsed.data)
    .where(eq(storySeeds.id, id))
    .returning();
  return NextResponse.json({ seed: updated });
}
