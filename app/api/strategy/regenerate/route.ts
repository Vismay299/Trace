import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { callAI } from "@/lib/ai/client";
import { AIBudgetExhaustedError } from "@/lib/ai/types";
import { db } from "@/lib/db";
import { strategyDocs } from "@/lib/db/schema";
import { getStrategy, invalidateStrategyCache } from "@/lib/strategy/generate";

export const runtime = "nodejs";
export const maxDuration = 90;

const sectionSchema = z.enum([
  "positioningStatement",
  "pillar1Description",
  "pillar2Description",
  "pillar3Description",
  "contrarianTakes",
  "originStory",
  "targetAudience",
  "outcomeGoal",
  "voiceProfile",
  "postingCadence",
]);

const bodySchema = z.object({
  section: sectionSchema,
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
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const doc = await getStrategy(userId);
  if (!doc) {
    return NextResponse.json({ error: "No strategy doc to regenerate" }, { status: 404 });
  }

  try {
    const result = await callAI({
      taskType: "strategy_doc",
      userId,
      messages: [
        {
          role: "system",
          content: buildSectionPrompt({
            section: parsed.data.section,
            guidance: parsed.data.guidance,
            strategy: doc,
          }),
        },
      ],
      json: true,
      maxOutputTokens: 1800,
      promptVersion: "strategy-section-regenerate-v1",
    });
    const { value } = z.object({ value: z.unknown() }).parse(JSON.parse(result.content));
    const patch = patchForSection(parsed.data.section, value, doc.version);
    const [updated] = await db
      .update(strategyDocs)
      .set(patch)
      .where(eq(strategyDocs.id, doc.id))
      .returning();
    await invalidateStrategyCache(userId);
    return NextResponse.json({ strategy: updated });
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
      { error: err instanceof Error ? err.message : "Regeneration failed" },
      { status: 500 },
    );
  }
}

function buildSectionPrompt(opts: {
  section: z.infer<typeof sectionSchema>;
  guidance?: string;
  strategy: Awaited<ReturnType<typeof getStrategy>>;
}) {
  return [
    "ROLE",
    "You are regenerating exactly one section of a Trace Personal Brand Strategy Document.",
    "",
    "TASK",
    `Rewrite only this section: ${opts.section}.`,
    'Return strict JSON with a single key: {"value": ...}.',
    "For array/object sections, value must be the same JSON shape as the current section.",
    "",
    "RULES",
    "- Keep the user's voice specific and non-generic.",
    "- Do not introduce claims unsupported by the existing strategy.",
    "- Follow any user guidance without changing unrelated sections.",
    "",
    "USER GUIDANCE",
    opts.guidance || "(none)",
    "",
    "CURRENT STRATEGY JSON",
    JSON.stringify(opts.strategy),
  ].join("\n");
}

function patchForSection(
  section: z.infer<typeof sectionSchema>,
  value: unknown,
  version: number,
) {
  return {
    [section]: value,
    version: version + 1,
    updatedAt: new Date(),
  };
}
