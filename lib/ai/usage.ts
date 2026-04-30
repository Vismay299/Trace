import { db } from "@/lib/db";
import { aiUsageLog } from "@/lib/db/schema";
import type { TaskType, Tier } from "./models";

export type UsageRow = {
  userId: string;
  taskType: TaskType;
  costTier: Tier;
  modelUsed: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number;
  cached: boolean;
  success: boolean;
  errorMessage?: string | null;
};

export async function logUsage(row: UsageRow): Promise<void> {
  try {
    await db.insert(aiUsageLog).values({
      userId: row.userId,
      taskType: row.taskType,
      costTier: row.costTier,
      modelUsed: row.modelUsed,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      estimatedCostUsd: row.estimatedCostUsd.toString(),
      cached: row.cached,
      success: row.success,
      errorMessage: row.errorMessage ?? null,
    });
  } catch (err) {
    // Telemetry must never block the user-facing call.
    console.error("[ai/usage] failed to log usage row", err);
  }
}
