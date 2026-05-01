import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import {
  listCalendarItems,
  listUnscheduledDrafts,
  scheduleGeneratedContent,
} from "@/lib/calendar";

export const runtime = "nodejs";

const platformSchema = z.enum([
  "linkedin",
  "instagram",
  "x_thread",
  "substack",
]);

const postSchema = z.object({
  generatedContentId: z.string().uuid(),
  scheduledDate: z.string().min(10),
  platform: platformSchema.optional(),
});

export async function GET(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const platform = platformSchema.safeParse(url.searchParams.get("platform"));
  const [items, unscheduledDrafts] = await Promise.all([
    listCalendarItems({
      userId,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      platform: platform.success ? platform.data : undefined,
    }),
    listUnscheduledDrafts(userId),
  ]);

  return NextResponse.json({ items, unscheduledDrafts });
}

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    const item = await scheduleGeneratedContent({ userId, ...parsed.data });
    return NextResponse.json({ item });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Could not schedule draft.",
      },
      { status: 500 },
    );
  }
}
