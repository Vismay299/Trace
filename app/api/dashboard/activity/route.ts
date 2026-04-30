import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  generatedContent,
  narrativePlans,
  weeklyCheckins,
} from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [content, checkins, plans] = await Promise.all([
    db
      .select()
      .from(generatedContent)
      .where(eq(generatedContent.userId, userId))
      .orderBy(desc(generatedContent.createdAt))
      .limit(10),
    db
      .select()
      .from(weeklyCheckins)
      .where(eq(weeklyCheckins.userId, userId))
      .orderBy(desc(weeklyCheckins.updatedAt))
      .limit(5),
    db
      .select()
      .from(narrativePlans)
      .where(eq(narrativePlans.userId, userId))
      .orderBy(desc(narrativePlans.updatedAt))
      .limit(5),
  ]);

  const events = [
    ...content.map((c) => ({
      type: "content",
      title: `${c.format} draft ${c.status}`,
      detail: c.sourceCitation ?? c.content.slice(0, 90),
      at: c.createdAt,
      href: `/content/${c.id}`,
    })),
    ...checkins.map((c) => ({
      type: "checkin",
      title: c.isComplete
        ? "Weekly check-in submitted"
        : "Weekly check-in started",
      detail: `Week of ${c.weekStartDate} · ${c.inputMode}`,
      at: c.updatedAt,
      href: "/weekly",
    })),
    ...plans.map((p) => ({
      type: "plan",
      title: `Narrative plan ${p.status}`,
      detail: p.mainTheme ?? `Week of ${p.weekStartDate}`,
      at: p.updatedAt,
      href: "/weekly/plan",
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 20);

  return NextResponse.json({ events });
}
