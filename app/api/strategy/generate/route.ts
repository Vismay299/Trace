import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { generateStrategyDoc } from "@/lib/strategy/generate";
import { generateSamplePosts } from "@/lib/strategy/samples";
import { sendStrategyDocReadyEmail } from "@/lib/email";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AIBudgetExhaustedError } from "@/lib/ai/types";
import { captureException } from "@/lib/observability";

export const runtime = "nodejs";
export const maxDuration = 90; // Tier 1 strategy doc + samples can be slow.

export async function POST() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const strategy = await generateStrategyDoc(userId);

    // Kick off sample posts in parallel — but await so the user lands on a
    // page that has them already. Failures here don't block the strategy.
    let samplesGenerated = 0;
    try {
      const samples = await generateSamplePosts(userId);
      samplesGenerated = samples.length;
    } catch (err) {
      console.warn("[strategy/generate] sample posts failed", err);
    }

    const [user] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (user?.email) {
      sendStrategyDocReadyEmail(user.email, user.name).catch(() => {});
    }

    return NextResponse.json({ strategy, samplesGenerated });
  } catch (err) {
    if (err instanceof AIBudgetExhaustedError) {
      return NextResponse.json(
        {
          error: "AI_BUDGET_EXHAUSTED",
          tier: err.tier,
          used: err.used,
          limit: err.limit,
          periodEnd: err.periodEnd,
          message: err.message,
        },
        { status: 429 },
      );
    }
    console.error("[strategy/generate] failed", err);
    captureException(err, "strategy_generate");
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not generate Strategy Doc.",
      },
      { status: 500 },
    );
  }
}
