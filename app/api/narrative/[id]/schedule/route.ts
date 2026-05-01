import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { createPlannedCalendarItem } from "@/lib/calendar";
import { createStoriesFromPlan, normalizePlanPosts } from "@/lib/ai/narrative";
import { db } from "@/lib/db";
import { narrativePlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const schema = z.object({
  selectedIndexes: z.array(z.number().int().min(0)).optional(),
  startDate: z.string().min(10),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
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

  try {
    const posts = normalizePlanPosts(plan);
    const selectedIndexes = parsed.data.selectedIndexes?.length
      ? parsed.data.selectedIndexes
      : posts.map((_, index) => index);
    const selected = posts.filter((_, index) =>
      selectedIndexes.includes(index),
    );
    const seeds = await createStoriesFromPlan(userId, id, selectedIndexes);
    const start = new Date(
      `${parsed.data.startDate.slice(0, 10)}T12:00:00.000Z`,
    );
    const items = [];

    for (let index = 0; index < selected.length; index += 1) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index * 2);
      const item = await createPlannedCalendarItem({
        userId,
        narrativePlanId: id,
        storySeedId: seeds[index].id,
        post: selected[index],
        scheduledDate: date.toISOString().slice(0, 10),
      });
      items.push(item);
    }

    return NextResponse.json({ ok: true, seeds, items });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Could not schedule plan.",
      },
      { status: 500 },
    );
  }
}
