import { NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  generatedContent,
  interviewSessions,
  storySeeds,
  strategyDocs,
  voiceSamples,
} from "@/lib/db/schema";
import { invalidateStrategyCache } from "@/lib/strategy/generate";

export const runtime = "nodejs";

export async function POST() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.transaction(async (tx) => {
    await tx.delete(strategyDocs).where(eq(strategyDocs.userId, userId));
    await tx.delete(voiceSamples).where(eq(voiceSamples.userId, userId));
    await tx
      .delete(generatedContent)
      .where(
        and(
          eq(generatedContent.userId, userId),
          isNull(generatedContent.storySeedId),
        ),
      );
    await tx
      .update(storySeeds)
      .set({ status: "needs_rescore" })
      .where(eq(storySeeds.userId, userId));
    await tx
      .update(interviewSessions)
      .set({
        currentSection: 1,
        currentQuestion: 1,
        answers: {},
        isComplete: false,
        updatedAt: new Date(),
      })
      .where(eq(interviewSessions.userId, userId));
  });

  await invalidateStrategyCache(userId);
  return NextResponse.json({ ok: true });
}
