import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedContent } from "@/lib/db/schema";

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
    .from(generatedContent)
    .where(eq(generatedContent.id, id))
    .limit(1);
  if (!row || row.userId !== userId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ content: row });
}

const updateSchema = z.object({
  editedContent: z.string().nullable().optional(),
  hookVariant: z.number().int().min(1).max(3).optional(),
  status: z.enum(["draft", "approved", "published", "rejected"]).optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
});

export async function PUT(
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
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  const [existing] = await db
    .select()
    .from(generatedContent)
    .where(eq(generatedContent.id, id))
    .limit(1);
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const patch: Record<string, unknown> = {
    ...parsed.data,
    updatedAt: new Date(),
  };
  if (parsed.data.scheduledFor)
    patch.scheduledFor = new Date(parsed.data.scheduledFor);
  if (parsed.data.status === "published" && !existing.publishedAt) {
    patch.publishedAt = new Date();
  }
  const [updated] = await db
    .update(generatedContent)
    .set(patch)
    .where(eq(generatedContent.id, id))
    .returning();
  return NextResponse.json({ content: updated });
}

export async function DELETE(
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
  const [existing] = await db
    .select()
    .from(generatedContent)
    .where(eq(generatedContent.id, id))
    .limit(1);
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.delete(generatedContent).where(eq(generatedContent.id, id));
  return NextResponse.json({ ok: true });
}
