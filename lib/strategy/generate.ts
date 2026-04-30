/**
 * Strategy Doc generation. Tier 1 call. Cached under namespace
 * `strategy_doc_generation`, key=hash(answers). Invalidated on user edit.
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  interviewSessions,
  strategyDocs,
  users,
  type StrategyDoc,
} from "@/lib/db/schema";
import { callAI } from "@/lib/ai/client";
import { loadPrompt } from "@/lib/ai/prompts";
import { getCached, hashKey, invalidateNamespace } from "@/lib/cache";

const strategySchema = z.object({
  positioning_statement: z.string(),
  pillar_1_topic: z.string(),
  pillar_1_description: z.string(),
  pillar_2_topic: z.string(),
  pillar_2_description: z.string(),
  pillar_3_topic: z.string(),
  pillar_3_description: z.string(),
  contrarian_takes: z.array(z.string()).default([]),
  origin_story: z.object({
    beat1: z.string().optional(),
    beat2: z.string().optional(),
    beat3: z.string().optional(),
    beat4: z.string().optional(),
    beat5: z.string().optional(),
  }),
  target_audience: z.object({
    job_title: z.string().optional(),
    experience: z.string().optional(),
    company_type: z.string().optional(),
    interests: z.array(z.string()).optional(),
    platforms: z.array(z.string()).optional(),
  }),
  outcome_goal: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    ninety_day_metric: z.string().optional(),
  }),
  voice_profile: z.object({
    tone: z.string().optional(),
    format_pref: z.string().optional(),
    anti_patterns: z.array(z.string()).optional(),
    role_models: z.array(z.string()).optional(),
  }),
  posting_cadence: z.object({
    linkedin_per_week: z.number().optional(),
    ig_per_week: z.number().optional(),
    x_per_day: z.number().optional(),
    substack_per_month: z.number().optional(),
  }),
});

export type GeneratedStrategy = z.infer<typeof strategySchema>;

export async function generateStrategyDoc(
  userId: string,
): Promise<StrategyDoc> {
  const [session] = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.userId, userId))
    .limit(1);
  if (!session) throw new Error("No interview session for user.");

  const [user] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const answers = (session.answers ?? {}) as Record<
    string,
    { answer: string; followups?: string[]; mode?: string }
  >;
  const prompt = loadPrompt("strategy-generation", {
    userName: user?.name ?? user?.email ?? "the user",
    interviewAnswers: formatAnswers(answers),
  });

  const cacheKey = hashKey({ answers, version: prompt.meta.version });

  const generated = await getCached<GeneratedStrategy>({
    userId,
    namespace: "strategy_doc_generation",
    key: cacheKey,
    ttl: 60 * 60 * 24 * 30, // 30 days; explicit invalidate on edit
    fn: async () => {
      const result = await callAI({
        taskType: "strategy_doc",
        userId,
        messages: [{ role: "system", content: prompt.system }],
        json: true,
        promptVersion: prompt.meta.version,
        maxOutputTokens: 4000,
      });
      return strategySchema.parse(JSON.parse(result.content));
    },
  });

  // Upsert into strategy_docs.
  const [existing] = await db
    .select()
    .from(strategyDocs)
    .where(eq(strategyDocs.userId, userId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(strategyDocs)
      .set({
        version: existing.version + 1,
        positioningStatement: generated.positioning_statement,
        pillar1Topic: generated.pillar_1_topic,
        pillar1Description: generated.pillar_1_description,
        pillar2Topic: generated.pillar_2_topic,
        pillar2Description: generated.pillar_2_description,
        pillar3Topic: generated.pillar_3_topic,
        pillar3Description: generated.pillar_3_description,
        contrarianTakes: generated.contrarian_takes,
        originStory: generated.origin_story,
        targetAudience: generated.target_audience,
        outcomeGoal: generated.outcome_goal,
        voiceProfile: generated.voice_profile,
        postingCadence: generated.posting_cadence,
        rawInterviewAnswers: answers,
        updatedAt: new Date(),
      })
      .where(eq(strategyDocs.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(strategyDocs)
    .values({
      userId,
      positioningStatement: generated.positioning_statement,
      pillar1Topic: generated.pillar_1_topic,
      pillar1Description: generated.pillar_1_description,
      pillar2Topic: generated.pillar_2_topic,
      pillar2Description: generated.pillar_2_description,
      pillar3Topic: generated.pillar_3_topic,
      pillar3Description: generated.pillar_3_description,
      contrarianTakes: generated.contrarian_takes,
      originStory: generated.origin_story,
      targetAudience: generated.target_audience,
      outcomeGoal: generated.outcome_goal,
      voiceProfile: generated.voice_profile,
      postingCadence: generated.posting_cadence,
      rawInterviewAnswers: answers,
    })
    .returning();
  return created;
}

export async function invalidateStrategyCache(userId: string) {
  await invalidateNamespace(userId, "strategy_doc_generation");
}

function formatAnswers(
  answers: Record<string, { answer: string; followups?: string[] }>,
): string {
  return Object.entries(answers)
    .map(([qid, entry]) => {
      const fu = entry.followups?.length
        ? `\n   Follow-up replies: ${entry.followups.join(" | ")}`
        : "";
      return `[${qid}] ${entry.answer}${fu}`;
    })
    .join("\n\n");
}

export async function getStrategy(userId: string): Promise<StrategyDoc | null> {
  const [doc] = await db
    .select()
    .from(strategyDocs)
    .where(eq(strategyDocs.userId, userId))
    .limit(1);
  return doc ?? null;
}
