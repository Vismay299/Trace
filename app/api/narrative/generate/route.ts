import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { generateNarrativePlan } from "@/lib/ai/narrative";
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
    const plan = await generateNarrativePlan(userId);
    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    if (err instanceof AIBudgetExhaustedError) {
      return NextResponse.json(
        { error: "AI_BUDGET_EXHAUSTED", message: err.message },
        { status: 429 },
      );
    }
    console.error("[narrative/generate] failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Plan generation failed" },
      { status: 500 },
    );
  }
}
