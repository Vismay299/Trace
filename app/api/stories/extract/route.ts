import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { extractStorySeeds } from "@/lib/ai/extract";
import { AIBudgetExhaustedError } from "@/lib/ai/types";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const seeds = await extractStorySeeds(userId);
    return NextResponse.json({ ok: true, seeds });
  } catch (err) {
    if (err instanceof AIBudgetExhaustedError) {
      return NextResponse.json(
        {
          error: "AI_BUDGET_EXHAUSTED",
          message: err.message,
          periodEnd: err.periodEnd,
        },
        { status: 429 },
      );
    }
    console.error("[stories/extract] failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Extraction failed" },
      { status: 500 },
    );
  }
}
