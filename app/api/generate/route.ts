import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { generateForStory } from "@/lib/ai/generate";
import { AIBudgetExhaustedError } from "@/lib/ai/types";
import { captureServerEvent } from "@/lib/analytics/server";
import { captureException } from "@/lib/observability";

export const runtime = "nodejs";
export const maxDuration = 120;

const schema = z.object({
  storySeedId: z.string().uuid(),
  formats: z
    .array(z.enum(["linkedin", "instagram", "x_thread", "substack"]))
    .min(1),
  guidance: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const rows = await generateForStory(
      userId,
      parsed.data.storySeedId,
      parsed.data.formats,
      { regenerationGuidance: parsed.data.guidance },
    );
    for (const row of rows) {
      captureServerEvent({
        event: "content_generated",
        distinctId: userId,
        properties: { format: row.format },
      });
    }
    return NextResponse.json({
      ok: true,
      contentIds: rows.map((r) => r.id),
      contentId: rows[0]?.id,
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
    console.error("[generate] failed", err);
    captureException(err, "content_generate");
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 },
    );
  }
}
