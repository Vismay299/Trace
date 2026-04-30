/**
 * Generate 5 sample posts after Strategy Doc creation. Spec §F1 / journey
 * step 5: the "aha" moment that converts free → paid. No source data
 * required — uses interview answers as the source.
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  generatedContent,
  interviewSessions,
  strategyDocs,
  users,
  type GeneratedContent,
} from "@/lib/db/schema";
import { callAI } from "@/lib/ai/client";
import { loadPrompt } from "@/lib/ai/prompts";
import { getCached, hashKey } from "@/lib/cache";

const sampleSchema = z.object({
  samples: z
    .array(
      z.object({
        format: z.enum(["linkedin", "instagram", "x_thread", "substack"]),
        title: z.string(),
        hooks: z.array(z.string()).optional(),
        body: z.string().optional(),
        tweets: z
          .array(z.object({ index: z.number(), text: z.string() }))
          .optional(),
        slides: z
          .array(
            z.object({
              index: z.number(),
              text: z.string(),
              design_note: z.string().optional(),
            }),
          )
          .optional(),
        subtitle: z.string().optional(),
        citation_line: z.string(),
        sample_origin: z.string().optional(),
      }),
    )
    .min(3),
});

export async function generateSamplePosts(
  userId: string,
): Promise<GeneratedContent[]> {
  const [doc] = await db
    .select()
    .from(strategyDocs)
    .where(eq(strategyDocs.userId, userId))
    .limit(1);
  if (!doc) throw new Error("No Strategy Doc — generate it first.");

  const [session] = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.userId, userId))
    .limit(1);
  const answers = (session?.answers ?? {}) as Record<
    string,
    { answer: string; followups?: string[] }
  >;

  const [user] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const prompt = loadPrompt("sample-posts", {
    userName: user?.name ?? user?.email ?? "the user",
    positioning: doc.positioningStatement ?? "",
    pillar1Topic: doc.pillar1Topic ?? "",
    pillar1Description: doc.pillar1Description ?? "",
    pillar2Topic: doc.pillar2Topic ?? "",
    pillar2Description: doc.pillar2Description ?? "",
    pillar3Topic: doc.pillar3Topic ?? "",
    pillar3Description: doc.pillar3Description ?? "",
    voiceTone: doc.voiceProfile?.tone ?? "",
    voiceRoleModels: (doc.voiceProfile?.role_models ?? []).join(", "),
    voiceAntiPatterns: (doc.voiceProfile?.anti_patterns ?? []).join(", "),
    interviewAnswers: formatAnswersForSamples(answers),
  });

  const cacheKey = hashKey({
    docVersion: doc.version,
    promptVersion: prompt.meta.version,
  });

  const generated = await getCached({
    userId,
    namespace: "sample_posts",
    key: cacheKey,
    ttl: 60 * 60 * 24 * 30,
    fn: async () => {
      const result = await callAI({
        taskType: "sample_posts",
        userId,
        messages: [{ role: "system", content: prompt.system }],
        json: true,
        promptVersion: prompt.meta.version,
        maxOutputTokens: 6000,
      });
      return sampleSchema.parse(JSON.parse(result.content));
    },
  });

  // Persist as generated_content rows (no story_seed_id — these are pre-mining).
  const inserted: GeneratedContent[] = [];
  for (const s of generated.samples) {
    const fullContent = renderSampleContent(s);
    const [row] = await db
      .insert(generatedContent)
      .values({
        userId,
        format: s.format,
        hookVariant: 1,
        content: fullContent,
        contentMetadata: {
          hooks: s.hooks,
          tweets: s.tweets,
          slides: s.slides,
          title: s.title,
          subtitle: s.subtitle,
          sample_origin: s.sample_origin,
        },
        sourceCitation: s.citation_line,
        status: "draft",
        generationPromptVersion: prompt.meta.version,
      })
      .returning();
    inserted.push(row);
  }
  return inserted;
}

function renderSampleContent(
  s: z.infer<typeof sampleSchema>["samples"][number],
): string {
  if (s.format === "x_thread" && s.tweets) {
    return s.tweets
      .sort((a, b) => a.index - b.index)
      .map((t, i) => `${i + 1}/ ${t.text}`)
      .join("\n\n");
  }
  if (s.format === "instagram" && s.slides) {
    return s.slides
      .sort((a, b) => a.index - b.index)
      .map(
        (sl) =>
          `Slide ${sl.index}: ${sl.text}${sl.design_note ? ` [${sl.design_note}]` : ""}`,
      )
      .join("\n\n");
  }
  const hook = s.hooks?.[0] ?? "";
  const parts = [hook, s.body, s.citation_line].filter(Boolean);
  return parts.join("\n\n");
}

function formatAnswersForSamples(
  answers: Record<string, { answer: string }>,
): string {
  return Object.entries(answers)
    .map(([qid, e]) => `[${qid}] ${e.answer}`)
    .join("\n\n");
}
