import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { generateSamplePostForFormat } from "@/lib/strategy/samples";
import { AIBudgetExhaustedError } from "@/lib/ai/types";

export const runtime = "nodejs";
export const maxDuration = 90;

const schema = z.object({
  format: z.enum(["linkedin", "instagram", "x_thread", "substack"]),
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
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    const draft = await generateSamplePostForFormat({
      userId,
      format: parsed.data.format,
    });
    return NextResponse.json({ ok: true, draft });
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
        error:
          err instanceof Error ? err.message : "Could not create new draft.",
      },
      { status: 500 },
    );
  }
}
