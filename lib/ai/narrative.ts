import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { callAI } from "@/lib/ai/client";
import { getSignalStatus, type ProductStage } from "@/lib/ai/signal";
import { loadPrompt } from "@/lib/ai/prompts";
import { db } from "@/lib/db";
import {
  generatedContent,
  narrativePlans,
  sourceChunks,
  storySeeds,
  strategyDocs,
  users,
  weeklyCheckins,
  type NarrativePlan,
  type RecommendedPost,
  type SourceChunk,
} from "@/lib/db/schema";
import { currentWeekStart } from "@/lib/checkin/session";

const storyTypes = [
  "origin",
  "build_decision",
  "mistake_lesson",
  "user_insight",
  "product_pov",
  "launch_distribution",
  "proof",
] as const;

const formats = ["linkedin", "instagram", "x_thread", "substack"] as const;

const recommendedPostSchema = z.object({
  format: z.enum(formats),
  story_type: z.enum(storyTypes),
  title: z.string().min(3),
  summary: z.string().min(3),
  pillar_match: z.string().min(1),
  source_note: z.string().min(3),
  source_chunk_id: z.string().optional(),
  is_anchor: z.boolean().optional(),
});

export const narrativePlanOutputSchema = z.object({
  main_theme: z.string().min(3),
  content_strategy: z.string().min(3),
  anchor_story: recommendedPostSchema.extend({
    format: z.enum(["linkedin", "substack"]),
  }),
  recommended_posts: z.array(recommendedPostSchema).min(1).max(8),
  proof_assets: z.array(z.string()).default([]),
  pillar_balance: z.record(z.number().int().min(0)).default({}),
});

export type NarrativePlanOutput = z.infer<typeof narrativePlanOutputSchema>;

export async function generateNarrativePlan(
  userId: string,
): Promise<NarrativePlan> {
  const [doc] = await db
    .select()
    .from(strategyDocs)
    .where(eq(strategyDocs.userId, userId))
    .limit(1);
  if (!doc) throw new Error("Strategy Doc required before weekly planning.");

  const [checkin] = await db
    .select()
    .from(weeklyCheckins)
    .where(
      and(
        eq(weeklyCheckins.userId, userId),
        eq(weeklyCheckins.isComplete, true),
      ),
    )
    .orderBy(desc(weeklyCheckins.weekStartDate))
    .limit(1);
  if (!checkin) throw new Error("Complete a weekly check-in first.");

  const [user] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const signal = await getSignalStatus(userId);
  const previousContent = await recentContentSummary(userId);
  const githubEvidence = await recentGitHubEvidence(userId);
  const prompt = loadPrompt("weekly-narrative-planner", {
    userName: user?.name ?? user?.email ?? "the user",
    positioning: doc.positioningStatement ?? "",
    pillar1Topic: doc.pillar1Topic ?? "",
    pillar1Description: doc.pillar1Description ?? "",
    pillar2Topic: doc.pillar2Topic ?? "",
    pillar2Description: doc.pillar2Description ?? "",
    pillar3Topic: doc.pillar3Topic ?? "",
    pillar3Description: doc.pillar3Description ?? "",
    audience: JSON.stringify(doc.targetAudience ?? {}),
    outcomeGoal: JSON.stringify(doc.outcomeGoal ?? {}),
    sourceActivitySummary: JSON.stringify(signal),
    recentGitHubEvidence: formatGitHubEvidence(githubEvidence),
    checkinAnswers: formatAnswers(checkin.answers),
    productStage: checkin.productStage ?? signal.product_stage,
    previousContent,
  });

  const result = await callAI({
    taskType: "narrative_plan",
    userId,
    messages: [{ role: "system", content: prompt.system }],
    json: true,
    promptVersion: prompt.meta.version,
    maxOutputTokens: 3500,
  });
  const parsed = parseNarrativePlan(result.content);
  const sanitized = sanitizeNarrativePlanSourceIds(
    parsed,
    new Set(githubEvidence.map((chunk) => chunk.id)),
  );

  const [created] = await db
    .insert(narrativePlans)
    .values({
      userId,
      weeklyCheckinId: checkin.id,
      weekStartDate: checkin.weekStartDate ?? currentWeekStart(),
      mainTheme: parsed.main_theme,
      productStage: (checkin.productStage ??
        signal.product_stage) as ProductStage,
      contentStrategy: parsed.content_strategy,
      recommendedPosts: sanitized.recommended_posts as RecommendedPost[],
      anchorStory: sanitized.anchor_story,
      proofAssets: parsed.proof_assets,
      pillarBalance: parsed.pillar_balance,
      status: "draft",
    })
    .returning();

  return created;
}

export function parseNarrativePlan(raw: string): NarrativePlanOutput {
  return narrativePlanOutputSchema.parse(JSON.parse(raw));
}

export function sanitizeNarrativePlanSourceIds(
  plan: NarrativePlanOutput,
  validIds: Set<string>,
): NarrativePlanOutput {
  return {
    ...plan,
    anchor_story: withValidSourceChunkId(plan.anchor_story, validIds),
    recommended_posts: plan.recommended_posts.map((post) =>
      withValidSourceChunkId(post, validIds),
    ),
  };
}

export async function createStoriesFromPlan(
  userId: string,
  planId: string,
  selectedIndexes?: number[],
) {
  const [plan] = await db
    .select()
    .from(narrativePlans)
    .where(eq(narrativePlans.id, planId))
    .limit(1);
  if (!plan || plan.userId !== userId)
    throw new Error("Narrative plan not found.");

  const posts = normalizePlanPosts(plan);
  const selected =
    selectedIndexes?.length == null
      ? posts
      : posts.filter((_, index) => selectedIndexes.includes(index));
  if (!selected.length) return [];

  const citation = `Based on your weekly founder check-in, Week of ${plan.weekStartDate}`;
  const sourceChunkMap = await loadValidSourceChunksForPosts(userId, selected);
  const rows = selected.map((post) => {
    const sourceChunk = post.source_chunk_id
      ? sourceChunkMap.get(post.source_chunk_id)
      : null;
    return {
      userId,
      sourceChunkId: sourceChunk?.id ?? null,
      weeklyCheckinId: plan.weeklyCheckinId,
      narrativePlanId: plan.id,
      sourceMode: "narrative_plan",
      storyType: post.story_type,
      title: post.title,
      summary: `${post.summary}\n\nSource note: ${post.source_note}`,
      pillarMatch: post.pillar_match,
      relevanceScore: post.is_anchor ? 0.95 : 0.82,
      sourceCitation: sourceChunk?.sourceReference ?? citation,
      status: "new",
    };
  });

  return db.insert(storySeeds).values(rows).returning();
}

type GitHubEvidenceChunk = {
  id: string;
  title: string | null;
  sourceReference: string | null;
  content: string;
  createdAt: Date;
  metadata: unknown;
};

async function recentGitHubEvidence(userId: string): Promise<GitHubEvidenceChunk[]> {
  const rows = await db
    .select({
      id: sourceChunks.id,
      title: sourceChunks.title,
      sourceReference: sourceChunks.sourceReference,
      content: sourceChunks.content,
      createdAt: sourceChunks.createdAt,
      metadata: sourceChunks.metadata,
    })
    .from(sourceChunks)
    .where(
      and(
        eq(sourceChunks.userId, userId),
        eq(sourceChunks.sourceType, "github"),
        eq(sourceChunks.isActive, true),
      ),
    )
    .orderBy(desc(sourceChunks.createdAt))
    .limit(24);

  return rows
    .sort((a, b) => {
      const scoreA = signalScore(a.metadata);
      const scoreB = signalScore(b.metadata);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .slice(0, 8);
}

function formatGitHubEvidence(chunks: GitHubEvidenceChunk[]) {
  if (!chunks.length) return "(none)";
  return chunks
    .map((chunk) => {
      const metadata = metadataObject(chunk.metadata);
      const artifactType = String(metadata.artifactType ?? "github_activity");
      const repo = String(metadata.repoFullName ?? "GitHub");
      const url = metadata.url ? `\nURL: ${String(metadata.url)}` : "";
      return [
        `[source_chunk_id: ${chunk.id}]`,
        `Repository: ${repo}`,
        `Artifact: ${artifactType.replaceAll("_", " ")}`,
        `Reference: ${chunk.sourceReference ?? chunk.title ?? "GitHub activity"}${url}`,
        chunk.content.slice(0, 1400),
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

function withValidSourceChunkId<T extends { source_chunk_id?: string }>(
  post: T,
  validIds: Set<string>,
): T {
  if (!post.source_chunk_id || validIds.has(post.source_chunk_id)) return post;
  const rest = { ...post };
  delete rest.source_chunk_id;
  return rest as T;
}

async function loadValidSourceChunksForPosts(
  userId: string,
  posts: RecommendedPost[],
) {
  const ids = [
    ...new Set(posts.map((post) => post.source_chunk_id).filter(Boolean)),
  ] as string[];
  if (!ids.length) return new Map<string, SourceChunk>();
  const rows = await db
    .select()
    .from(sourceChunks)
    .where(
      and(
        inArray(sourceChunks.id, ids),
        eq(sourceChunks.userId, userId),
        eq(sourceChunks.sourceType, "github"),
        eq(sourceChunks.isActive, true),
      ),
    );
  return new Map(rows.map((row) => [row.id, row]));
}

function signalScore(metadata: unknown) {
  return Number(metadataObject(metadata).signalScore ?? 0);
}

function metadataObject(metadata: unknown): Record<string, unknown> {
  return metadata && typeof metadata === "object"
    ? (metadata as Record<string, unknown>)
    : {};
}

export function normalizePlanPosts(plan: NarrativePlan): RecommendedPost[] {
  const anchor = plan.anchorStory as RecommendedPost | null;
  const recommended = (plan.recommendedPosts ?? []) as RecommendedPost[];
  return [
    ...(anchor ? [{ ...anchor, is_anchor: true }] : []),
    ...recommended.map((p) => ({ ...p, is_anchor: Boolean(p.is_anchor) })),
  ];
}

async function recentContentSummary(userId: string): Promise<string> {
  const rows = await db
    .select({
      format: generatedContent.format,
      status: generatedContent.status,
      title: generatedContent.contentMetadata,
      citation: generatedContent.sourceCitation,
      createdAt: generatedContent.createdAt,
    })
    .from(generatedContent)
    .where(eq(generatedContent.userId, userId))
    .orderBy(desc(generatedContent.createdAt))
    .limit(12);

  if (!rows.length) return "(none yet)";
  return rows
    .map((r) => {
      const title =
        typeof r.title === "object" && r.title && "title" in r.title
          ? String((r.title as { title?: unknown }).title ?? "")
          : "";
      return `- ${r.format} / ${r.status}: ${title || r.citation || "Untitled"}`;
    })
    .join("\n");
}

function formatAnswers(answers: unknown): string {
  if (!answers || typeof answers !== "object") return "(none)";
  return Object.entries(
    answers as Record<string, { answer?: string; followups?: string[] }>,
  )
    .map(([id, entry]) => {
      const followups = entry.followups?.length
        ? `\n  Follow-ups: ${entry.followups.join(" ")}`
        : "";
      return `- ${id}: ${entry.answer ?? ""}${followups}`;
    })
    .join("\n")
    .slice(0, 6000);
}
