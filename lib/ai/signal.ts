import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { callAI } from "@/lib/ai/client";
import { loadPrompt } from "@/lib/ai/prompts";
import { getCached } from "@/lib/cache";
import { db } from "@/lib/db";
import {
  narrativePlans,
  sourceChunks,
  storySeeds,
  strategyDocs,
  uploadedFiles,
  weeklyCheckins,
} from "@/lib/db/schema";
import { getRecentGitHubActivitySummary } from "@/lib/integrations/github/activity";

export type SignalMode = "source_mining" | "low_signal";
export type ProductStage = "building" | "launching" | "operating" | "scaling";

export type SignalInput = {
  newChunks: number;
  newSeeds: number;
  newUploads: number;
  githubActivity?: {
    meaningfulCommits: number;
    pullRequests: number;
    issues: number;
    readmes: number;
    topRepos: string[];
  };
  lastCheckinSummary?: string;
  lastPlanSummary?: string;
  positioning?: string;
  outcomeGoal?: string;
};

export type SignalStatus = {
  mode: SignalMode;
  artifacts_found: number;
  stories_found: number;
  product_stage: ProductStage;
  recommendation: string;
};

const signalSchema = z.object({
  mode: z.enum(["source_mining", "low_signal"]),
  artifacts_found: z.number().int().min(0),
  stories_found: z.number().int().min(0),
  product_stage: z.enum(["building", "launching", "operating", "scaling"]),
  recommendation: z.string().min(1),
});

export function decideSignalStatus(input: SignalInput): SignalStatus {
  const artifacts = input.newChunks + input.newUploads;
  const stories = input.newSeeds;
  const inferredStage = inferProductStage(
    `${input.lastCheckinSummary ?? ""}\n${input.lastPlanSummary ?? ""}\n${input.outcomeGoal ?? ""}`,
  );

  return {
    mode:
      input.newChunks >= 3 || input.newSeeds >= 2
        ? "source_mining"
        : "low_signal",
    artifacts_found: artifacts,
    stories_found: stories,
    product_stage: inferredStage,
    recommendation:
      input.newChunks >= 3 || input.newSeeds >= 2
        ? "Use the fresh source material to mine specific proof-backed stories."
        : "Use focused follow-ups to turn small signals into a credible weekly narrative.",
  };
}

export async function getSignalStatus(userId: string): Promise<SignalStatus> {
  const inputs = await loadSignalInputs(userId);
  const deterministic = decideSignalStatus(inputs);

  return getCached({
    userId,
    namespace: "signal_status",
    key: {
      inputs,
      deterministic,
      week: weekAgoIso().slice(0, 10),
    },
    ttl: 60 * 60 * 24 * 7,
    fn: async () => {
      const prompt = loadPrompt("signal-assessment", {
        newChunks: inputs.newChunks,
        newSeeds: inputs.newSeeds,
        newUploads: inputs.newUploads,
        lastCheckinSummary: inputs.lastCheckinSummary || "(none)",
        lastPlanSummary: inputs.lastPlanSummary || "(none)",
        positioning: inputs.positioning || "(none yet)",
        outcomeGoal: inputs.outcomeGoal || "(none yet)",
      });

      try {
        const result = await callAI({
          taskType: "signal_assessment",
          userId,
          messages: [{ role: "system", content: prompt.system }],
          json: true,
          promptVersion: prompt.meta.version,
          maxOutputTokens: 700,
        });
        return signalSchema.parse(JSON.parse(result.content));
      } catch {
        return deterministic;
      }
    },
  });
}

async function loadSignalInputs(userId: string): Promise<SignalInput> {
  const since = weekAgoDate();
  const [
    [chunkCounts],
    [seedCounts],
    [uploadCounts],
    [doc],
    [checkin],
    [plan],
    githubActivity,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(sourceChunks)
      .where(
        and(
          eq(sourceChunks.userId, userId),
          eq(sourceChunks.isActive, true),
          gte(sourceChunks.createdAt, since),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(storySeeds)
      .where(
        and(eq(storySeeds.userId, userId), gte(storySeeds.createdAt, since)),
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(uploadedFiles)
      .where(
        and(
          eq(uploadedFiles.userId, userId),
          gte(uploadedFiles.createdAt, since),
        ),
      ),
    db
      .select()
      .from(strategyDocs)
      .where(eq(strategyDocs.userId, userId))
      .limit(1),
    db
      .select()
      .from(weeklyCheckins)
      .where(eq(weeklyCheckins.userId, userId))
      .orderBy(desc(weeklyCheckins.weekStartDate))
      .limit(1),
    db
      .select()
      .from(narrativePlans)
      .where(eq(narrativePlans.userId, userId))
      .orderBy(desc(narrativePlans.createdAt))
      .limit(1),
    getRecentGitHubActivitySummary(userId, since).catch(() => undefined),
  ]);

  return {
    newChunks: Number(chunkCounts?.count ?? 0),
    newSeeds: Number(seedCounts?.count ?? 0),
    newUploads: Number(uploadCounts?.count ?? 0),
    githubActivity,
    lastCheckinSummary: checkin ? summarizeAnswers(checkin.answers) : "",
    lastPlanSummary: plan
      ? [plan.mainTheme, plan.contentStrategy].filter(Boolean).join(" ")
      : "",
    positioning: doc?.positioningStatement ?? "",
    outcomeGoal: JSON.stringify(doc?.outcomeGoal ?? {}),
  };
}

function summarizeAnswers(answers: unknown): string {
  if (!answers || typeof answers !== "object") return "";
  return Object.entries(
    answers as Record<string, { answer?: string; followups?: string[] }>,
  )
    .map(([id, entry]) => {
      const followups = entry.followups?.length
        ? ` Follow-ups: ${entry.followups.join(" ")}`
        : "";
      return `${id}: ${entry.answer ?? ""}${followups}`;
    })
    .join("\n")
    .slice(0, 3000);
}

function inferProductStage(text: string): ProductStage {
  const lower = text.toLowerCase();
  if (/(scale|scaling|repeatable|sales team|pipeline|enterprise)/.test(lower)) {
    return "scaling";
  }
  if (
    /(retention|churn|active users|customers|revenue|mrr|growth)/.test(lower)
  ) {
    return "operating";
  }
  if (/(launch|launched|waitlist|beta|public|announcement)/.test(lower)) {
    return "launching";
  }
  return "building";
}

function weekAgoIso(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString();
}

function weekAgoDate(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 7);
  return d;
}
