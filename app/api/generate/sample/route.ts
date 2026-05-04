import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { generateSamplePosts } from "@/lib/strategy/samples";
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
    const samples = await generateSamplePosts(userId);
    return NextResponse.json({
      ok: true,
      contentIds: samples.map((sample) => sample.id),
      samples: samples.map((sample) => ({
        id: sample.id,
        format: sample.format,
        content: sample.content,
        contentMetadata: sample.contentMetadata ?? undefined,
        sourceCitation: sample.sourceCitation,
      })),
    });
  } catch (err) {
    if (err instanceof AIBudgetExhaustedError) {
      return NextResponse.json(
        {
          error: "AI_BUDGET_EXHAUSTED",
          message: err.message,
          tier: err.tier,
          periodEnd: err.periodEnd,
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Sample generation failed",
      },
      { status: 500 },
    );
  }
}
