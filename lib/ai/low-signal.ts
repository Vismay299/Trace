import { z } from "zod";
import { callAI } from "@/lib/ai/client";
import { loadPrompt } from "@/lib/ai/prompts";
import { getCached } from "@/lib/cache";
import { db } from "@/lib/db";
import { sourceChunks, strategyDocs, uploadedFiles } from "@/lib/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";

export type LowSignalQuestion = {
  id: string;
  prompt: string;
  rationale?: string;
};

export type LowSignalPlan = {
  banner: string;
  questions: LowSignalQuestion[];
  artifactsFound: number;
};

const lowSignalSchema = z.object({
  banner: z.string().min(1),
  questions: z
    .array(
      z.object({
        id: z.string().min(1),
        prompt: z.string().min(1),
        rationale: z.string().optional(),
      }),
    )
    .min(3)
    .max(5),
});

export async function generateLowSignalPlan(
  userId: string,
): Promise<LowSignalPlan> {
  const [doc] = await db
    .select()
    .from(strategyDocs)
    .where(eq(strategyDocs.userId, userId))
    .limit(1);
  const artifacts = await recentArtifacts(userId);

  if (!artifacts.length) {
    return {
      banner:
        "No fresh source artifacts showed up this week, so we will use the standard founder check-in.",
      questions: [],
      artifactsFound: 0,
    };
  }

  return getCached({
    userId,
    namespace: "signal_status",
    key: {
      kind: "low_signal_questions",
      artifacts,
      strategyVersion: doc?.version,
    },
    ttl: 60 * 60 * 24 * 7,
    fn: async () => {
      const prompt = loadPrompt("low-signal-followup", {
        sourceActivitySummary: artifacts.map((a) => `- ${a}`).join("\n"),
        positioning: doc?.positioningStatement ?? "(none yet)",
        pillar1Topic: doc?.pillar1Topic ?? "",
        pillar2Topic: doc?.pillar2Topic ?? "",
        pillar3Topic: doc?.pillar3Topic ?? "",
      });
      const result = await callAI({
        taskType: "signal_assessment",
        userId,
        messages: [{ role: "system", content: prompt.system }],
        json: true,
        promptVersion: prompt.meta.version,
        maxOutputTokens: 900,
      });
      const parsed = lowSignalSchema.parse(JSON.parse(result.content));
      return { ...parsed, artifactsFound: artifacts.length };
    },
  });
}

async function recentArtifacts(userId: string): Promise<string[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 7);
  const [chunks, uploads] = await Promise.all([
    db
      .select({
        title: sourceChunks.title,
        reference: sourceChunks.sourceReference,
        createdAt: sourceChunks.createdAt,
      })
      .from(sourceChunks)
      .where(
        and(
          eq(sourceChunks.userId, userId),
          gte(sourceChunks.createdAt, since),
        ),
      )
      .orderBy(desc(sourceChunks.createdAt))
      .limit(5),
    db
      .select({
        filename: uploadedFiles.filename,
        status: uploadedFiles.processingStatus,
        createdAt: uploadedFiles.createdAt,
      })
      .from(uploadedFiles)
      .where(
        and(
          eq(uploadedFiles.userId, userId),
          gte(uploadedFiles.createdAt, since),
        ),
      )
      .orderBy(desc(uploadedFiles.createdAt))
      .limit(5),
  ]);

  return [
    ...chunks.map((c) => c.title || c.reference || "Recent source chunk"),
    ...uploads.map((u) => `${u.filename} (${u.status})`),
  ].slice(0, 6);
}
