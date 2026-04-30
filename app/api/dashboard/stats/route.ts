import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { getBudgetSnapshot } from "@/lib/ai/budget";
import { db } from "@/lib/db";
import {
  generatedContent,
  voiceSamples,
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

  const [[content], [voice], [checkins], budget] = await Promise.all([
    db
      .select({
        generated: sql<number>`count(*)::int`,
        approved: sql<number>`count(*) filter (where ${generatedContent.status} = 'approved')::int`,
        published: sql<number>`count(*) filter (where ${generatedContent.publishedAt} is not null)::int`,
      })
      .from(generatedContent)
      .where(eq(generatedContent.userId, userId)),
    db
      .select({
        total: sql<number>`count(*)::int`,
        approved: sql<number>`count(*) filter (where ${voiceSamples.feedback} = 'sounds_like_me')::int`,
      })
      .from(voiceSamples)
      .where(eq(voiceSamples.userId, userId)),
    db
      .select({
        completed: sql<number>`count(*) filter (where ${weeklyCheckins.isComplete} = true)::int`,
        voice: sql<number>`count(*) filter (where ${weeklyCheckins.inputMode} = 'voice')::int`,
      })
      .from(weeklyCheckins)
      .where(eq(weeklyCheckins.userId, userId)),
    getBudgetSnapshot(userId),
  ]);

  return NextResponse.json({
    generated: content?.generated ?? 0,
    approved: content?.approved ?? 0,
    published: content?.published ?? 0,
    voiceScore:
      voice?.total && voice.total > 0
        ? Math.round(((voice.approved ?? 0) / voice.total) * 100)
        : null,
    checkinsCompleted: checkins?.completed ?? 0,
    voiceCheckins: checkins?.voice ?? 0,
    budget,
  });
}
