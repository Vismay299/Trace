import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedContent } from "@/lib/db/schema";
import { generateForStory, type ContentFormat } from "@/lib/ai/generate";
import { regenerateSamplePost } from "@/lib/strategy/samples";
import { AIBudgetExhaustedError } from "@/lib/ai/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const schema = z.object({
  guidance: z.string().max(2000).optional(),
  selectedHook: z.string().max(1000).optional(),
  hookVariant: z.number().int().min(1).max(3).optional(),
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
  try {
    if (!existing.storySeedId) {
      const row = await regenerateSamplePost({
        userId,
        existing,
        guidance: parsed.data.guidance,
        selectedHook: parsed.data.selectedHook,
        hookVariant: parsed.data.hookVariant,
      });
      return NextResponse.json({ content: row });
    }

    const [row] = await generateForStory(
      userId,
      existing.storySeedId,
      [existing.format as ContentFormat],
      {
        regenerationGuidance: [
          parsed.data.guidance,
          parsed.data.selectedHook
            ? `Use this selected hook as the opening hook: "${parsed.data.selectedHook}"`
            : null,
        ]
          .filter(Boolean)
          .join("\n\n"),
        existingContentId: existing.id,
        selectedHook: parsed.data.selectedHook,
        hookVariant: parsed.data.hookVariant,
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
