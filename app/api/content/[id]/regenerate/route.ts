import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedContent } from "@/lib/db/schema";
import { generateForStory, type ContentFormat } from "@/lib/ai/generate";
import { AIBudgetExhaustedError } from "@/lib/ai/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const schema = z.object({
  guidance: z.string().max(2000).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(generatedContent)
    .where(eq(generatedContent.id, id))
    .limit(1);
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!existing.storySeedId) {
    return NextResponse.json(
      { error: "Cannot regenerate sample posts (no story seed)." },
      { status: 400 },
    );
  }

  try {
    const [row] = await generateForStory(
      userId,
      existing.storySeedId,
      [existing.format as ContentFormat],
      {
        regenerationGuidance: parsed.data.guidance,
        existingContentId: existing.id,
      },
    );
    return NextResponse.json({ content: row });
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Regeneration failed" },
      { status: 500 },
    );
  }
}
