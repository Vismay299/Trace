/**
 * Story seed extraction. Spec §F4 + §14.
 * Tier 2 batched call: pass all chunks for the user along with their pillars
 * in a single prompt. Cached per (chunk_ids, strategy_version).
 */
import { z } from "zod";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  sourceChunks,
  storySeeds,
  strategyDocs,
  type SourceChunk,
  type StorySeed,
} from "@/lib/db/schema";
import { callAI } from "@/lib/ai/client";
import { loadPrompt } from "@/lib/ai/prompts";
import { getCached, hashKey } from "@/lib/cache";

const STORY_TYPES = [
  "origin",
  "build_decision",
  "mistake_lesson",
  "user_insight",
  "product_pov",
  "launch_distribution",
  "proof",
] as const;

const seedSchema = z.object({
  seeds: z.array(
    z.object({
      source_chunk_id: z.string(),
      title: z.string().min(3),
      summary: z.string(),
      pillar_match: z.string().default("unmapped"),
      story_type: z.enum(STORY_TYPES).default("build_decision"),
      relevance_score: z.number().min(0).max(1).default(0.5),
      source_citation: z.string(),
    }),
  ),
});

export async function extractStorySeeds(userId: string): Promise<StorySeed[]> {
  const [doc] = await db
    .select()
    .from(strategyDocs)
    .where(eq(strategyDocs.userId, userId))
    .limit(1);
  if (!doc) throw new Error("Strategy Doc required before extracting seeds.");

  const chunks = await db
    .select()
    .from(sourceChunks)
    .where(eq(sourceChunks.userId, userId));
  if (!chunks.length) return [];

  const existing = await db
    .select({ title: storySeeds.title, sourceChunkId: storySeeds.sourceChunkId })
    .from(storySeeds)
    .where(eq(storySeeds.userId, userId));

  const existingTitles = existing.map((e) => `- ${e.title}`).join("\n");
  const seenChunkIds = new Set(existing.map((e) => e.sourceChunkId));

  const fresh = chunks.filter((c) => !seenChunkIds.has(c.id));
  if (!fresh.length) {
    return db
      .select()
      .from(storySeeds)
      .where(eq(storySeeds.userId, userId));
  }

  const prompt = loadPrompt("story-extraction", {
    userName: "the user",
    pillar1Topic: doc.pillar1Topic ?? "",
    pillar1Description: doc.pillar1Description ?? "",
    pillar2Topic: doc.pillar2Topic ?? "",
    pillar2Description: doc.pillar2Description ?? "",
    pillar3Topic: doc.pillar3Topic ?? "",
    pillar3Description: doc.pillar3Description ?? "",
    existingTitles: existingTitles || "(none yet)",
    chunks: formatChunks(fresh),
  });

  const cacheKey = hashKey({
    chunkIds: fresh.map((c) => c.id).sort(),
    strategyVersion: doc.version,
    promptVersion: prompt.meta.version,
  });

  const generated = await getCached({
    userId,
    namespace: "story_extraction",
    key: cacheKey,
    ttl: 60 * 60 * 24 * 7,
    fn: async () => {
      const result = await callAI({
        taskType: "story_extraction",
        userId,
        messages: [{ role: "system", content: prompt.system }],
        json: true,
        promptVersion: prompt.meta.version,
        maxOutputTokens: 4000,
      });
      return seedSchema.parse(JSON.parse(result.content));
    },
  });

  // Insert new seeds. Reject any seeds whose source_chunk_id isn't real.
  const validIds = new Set(fresh.map((c) => c.id));
  const validSeeds = generated.seeds.filter((s) =>
    validIds.has(s.source_chunk_id),
  );

  if (validSeeds.length) {
    await db.insert(storySeeds).values(
      validSeeds.map((s) => ({
        userId,
        sourceChunkId: s.source_chunk_id,
        sourceMode: "source_mining",
        title: s.title,
        summary: s.summary,
        pillarMatch: normalizePillar(s.pillar_match, doc),
        relevanceScore: s.relevance_score,
        sourceCitation: s.source_citation,
        storyType: s.story_type,
      })),
    );
  }

  return db
    .select()
    .from(storySeeds)
    .where(eq(storySeeds.userId, userId));
}

function normalizePillar(
  raw: string,
  doc: { pillar1Topic: string | null; pillar2Topic: string | null; pillar3Topic: string | null },
): string {
  const lower = raw.toLowerCase();
  if (lower.includes("pillar_1") || lower === doc.pillar1Topic?.toLowerCase()) return doc.pillar1Topic ?? "pillar_1";
  if (lower.includes("pillar_2") || lower === doc.pillar2Topic?.toLowerCase()) return doc.pillar2Topic ?? "pillar_2";
  if (lower.includes("pillar_3") || lower === doc.pillar3Topic?.toLowerCase()) return doc.pillar3Topic ?? "pillar_3";
  return "unmapped";
}

function formatChunks(chunks: SourceChunk[]): string {
  return chunks
    .map(
      (c) =>
        `[chunk ${c.id}] (${c.sourceReference ?? "unknown"})\n${(c.content ?? "").slice(0, 2200)}`,
    )
    .join("\n\n---\n\n");
}
