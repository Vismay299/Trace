/**
 * Generate 5 sample posts after Strategy Doc creation. Spec §F1 / journey
 * step 5: the "aha" moment that converts free → paid. No source data
 * required — uses interview answers as the source.
 */
import { z } from "zod";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  generatedContent,
  interviewSessions,
  strategyDocs,
  users,
  type GeneratedContent,
  type StrategyDoc,
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
  const existing = await existingSampleDrafts(userId);
  if (existing.length >= 5) return existing;

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
      try {
        const result = await callAI({
          taskType: "sample_posts",
          userId,
          messages: [{ role: "system", content: prompt.system }],
          json: true,
          promptVersion: prompt.meta.version,
          maxOutputTokens: 6000,
        });
        return sampleSchema.parse(JSON.parse(result.content));
      } catch (err) {
        console.warn("[strategy/samples] AI sample generation failed", err);
        return buildFallbackSamples(doc, answers);
      }
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
          origin: "strategy_sample",
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

async function existingSampleDrafts(userId: string) {
  return db
    .select()
    .from(generatedContent)
    .where(
      and(
        eq(generatedContent.userId, userId),
        isNull(generatedContent.storySeedId),
        sql`${generatedContent.contentMetadata}->>'origin' = 'strategy_sample'`,
      ),
    )
    .orderBy(desc(generatedContent.createdAt))
    .limit(5);
}

export function buildFallbackSamples(
  doc: StrategyDoc,
  answers: Record<string, { answer: string }>,
): z.infer<typeof sampleSchema> {
  const answerLines = Object.values(answers)
    .map((entry) => entry.answer)
    .filter(Boolean);
  const proof = answerLines[0] ?? doc.positioningStatement ?? "your interview";
  const pillar1 = doc.pillar1Topic ?? "Positioning";
  const pillar2 = doc.pillar2Topic ?? "Systems";
  const pillar3 = doc.pillar3Topic ?? "Credibility";

  return {
    samples: [
      {
        format: "linkedin",
        title: `${pillar1}: why signal comes first`,
        hooks: [
          "Most content problems are positioning problems in disguise.",
          "More output will not fix unclear signal.",
          "The hard part is not writing. It is knowing what only you can say.",
        ],
        body: `${doc.positioningStatement}\n\nThe lesson: start with lived evidence, then write. When content begins from a real trade-off, mistake, artifact, or belief, it stops sounding like generic advice and starts sounding earned.`,
        citation_line: `Based on your interview answer: "${clip(proof)}"`,
        sample_origin: proof,
      },
      {
        format: "linkedin",
        title: `${pillar2}: build the system before scaling`,
        hooks: [
          "Scaling fuzzy messaging only spreads confusion faster.",
          "A content system is only useful if it preserves specificity.",
          "Distribution is part of product, not a side quest.",
        ],
        body: `${doc.pillar2Description ?? doc.positioningStatement}\n\nThis is why I care about systems that capture context before generation. The better the inputs, the less the output has to pretend.`,
        citation_line: `Based on your interview answer: "${clip(answerLines[1] ?? proof)}"`,
        sample_origin: answerLines[1] ?? proof,
      },
      {
        format: "x_thread",
        title: `${pillar3}: depth beats volume`,
        tweets: [
          {
            index: 1,
            text: "1/ Most AI content tools optimize for more output. I think that is the wrong scoreboard.",
          },
          {
            index: 2,
            text: `2/ The real bottleneck is signal: ${doc.pillar3Description ?? "knowing what makes your perspective credible."}`,
          },
          {
            index: 3,
            text: "3/ Better content starts upstream: sharper positioning, real source material, stronger narrative memory.",
          },
          {
            index: 4,
            text: "4/ Once the system understands the builder, generation becomes useful. Before that, it is decoration.",
          },
        ],
        citation_line: `Based on your interview answer: "${clip(answerLines[2] ?? proof)}"`,
        sample_origin: answerLines[2] ?? proof,
      },
      {
        format: "instagram",
        title: "From raw work to real content",
        slides: [
          {
            index: 1,
            text: "Your best content is already hiding in your work.",
            design_note: "Large claim, minimal background.",
          },
          {
            index: 2,
            text: "Look for trade-offs, mistakes, artifacts, and beliefs with stakes.",
          },
          {
            index: 3,
            text: `Your angle: ${doc.positioningStatement ?? pillar1}`,
          },
          {
            index: 4,
            text: "Do not scale output until the signal is clear.",
          },
        ],
        citation_line: `Based on your interview answer: "${clip(answerLines[3] ?? proof)}"`,
        sample_origin: answerLines[3] ?? proof,
      },
      {
        format: "substack",
        title: "Why the future of AI content is upstream of generation",
        subtitle: "The durable edge is not faster drafts. It is better signal.",
        body: `Most teams treat AI content as a generation problem. I think that misses the more important layer.\n\nThe useful work happens before the model writes: capturing experience, naming the credible edge, and connecting real proof to a point of view.\n\n${doc.positioningStatement}\n\nThat is why the workflow matters. If the system starts from vague prompts, it creates vague content. If it starts from lived experience, strategy, and source material, the output has a chance to sound specific.\n\nThe goal is not to publish more for its own sake. The goal is to become more legible, more credible, and easier for the right people to trust.`,
        citation_line: `Based on your interview answer: "${clip(answerLines[4] ?? proof)}"`,
        sample_origin: answerLines[4] ?? proof,
      },
    ],
  };
}

function clip(value: string) {
  return value.length > 140 ? `${value.slice(0, 137)}...` : value;
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
