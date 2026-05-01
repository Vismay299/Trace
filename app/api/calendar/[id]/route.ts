import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { deleteCalendarItem, updateCalendarItem } from "@/lib/calendar";

export const runtime = "nodejs";

const patchSchema = z.object({
  scheduledDate: z.string().min(10).optional(),
  status: z.enum(["scheduled", "done", "cancelled"]).optional(),
  platform: z
    .enum(["linkedin", "instagram", "x_thread", "substack"])
    .optional(),
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
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    const item = await updateCalendarItem({ userId, id, ...parsed.data });
    return NextResponse.json({ item });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update item." },
      { status: 404 },
    );
  }
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
  try {
    const item = await deleteCalendarItem(userId, id);
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not delete item." },
      { status: 404 },
    );
  }
}
