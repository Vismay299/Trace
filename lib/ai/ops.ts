import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { currentWeekRange, getBudgetSnapshot } from "@/lib/ai/budget";
import { db } from "@/lib/db";
import { aiUsageLog, users } from "@/lib/db/schema";

export type UsageSummary = {
  periodStart: string;
  periodEnd: string;
  totalCalls: number;
  successfulCalls: number;
  cacheHits: number;
  estimatedCostUsd: number;
  averageLatencyMs: number | null;
  byTier: { tier: number; calls: number; costUsd: number }[];
  byTask: { taskType: string; calls: number; costUsd: number }[];
};

export async function getUserAiUsageSummary(
  userId: string,
): Promise<UsageSummary> {
  const { start, end } = currentWeekRange();
  const periodStart = new Date(`${start}T00:00:00.000Z`);
  const periodEnd = new Date(`${end}T23:59:59.999Z`);
  const [totals, byTier, byTask] = await Promise.all([
    usageTotals({ userId, from: periodStart, to: periodEnd }),
    usageByTier({ userId, from: periodStart, to: periodEnd }),
    usageByTask({ userId, from: periodStart, to: periodEnd }),
  ]);

  return {
    periodStart: start,
    periodEnd: end,
    ...totals,
    byTier,
    byTask,
  };
}

export async function getUserAiCredits(userId: string) {
  const [budget, usage] = await Promise.all([
    getBudgetSnapshot(userId),
    getUserAiUsageSummary(userId),
  ]);
  const tiers = [
    {
      name: "Tier 1",
      description: "final content and strategy",
      ...budget.tier1,
    },
    {
      name: "Tier 2",
      description: "plans and story extraction",
      ...budget.tier2,
    },
    {
      name: "Tier 3",
      description: "follow-ups, checks, and classification",
      ...budget.tier3,
    },
  ].map((tier) => ({
    ...tier,
    remaining: Math.max(0, tier.limit - tier.used),
    percentUsed: tier.limit ? Math.round((tier.used / tier.limit) * 100) : 0,
  }));

  return {
    tier: budget.tier,
    periodStart: budget.periodStart,
    periodEnd: budget.periodEnd,
    resetMessage: `Credits reset after ${budget.periodEnd}.`,
    estimatedCostUsd: usage.estimatedCostUsd,
    tiers,
    usage,
  };
}

export async function getAdminAiCostReport({
  from,
  to,
}: {
  from: Date;
  to: Date;
}) {
  const [
    totals,
    byProvider,
    byModel,
    byTask,
    byTier,
    byCohort,
    recentFailures,
  ] = await Promise.all([
    usageTotals({ from, to }),
    groupUsage("provider", { from, to }),
    groupUsage("model_used", { from, to }),
    groupUsage("task_type", { from, to }),
    groupUsage("cost_tier", { from, to }),
    usageByCohort({ from, to }),
    db
      .select({
        id: aiUsageLog.id,
        userId: aiUsageLog.userId,
        taskType: aiUsageLog.taskType,
        provider: aiUsageLog.provider,
        modelUsed: aiUsageLog.modelUsed,
        errorMessage: aiUsageLog.errorMessage,
        createdAt: aiUsageLog.createdAt,
      })
      .from(aiUsageLog)
      .where(
        and(
          eq(aiUsageLog.success, false),
          gte(aiUsageLog.createdAt, from),
          lte(aiUsageLog.createdAt, to),
        ),
      )
      .orderBy(desc(aiUsageLog.createdAt))
      .limit(20),
  ]);

  return {
    window: { from: from.toISOString(), to: to.toISOString() },
    totals,
    byProvider,
    byModel,
    byTask,
    byTier,
    byCohort,
    recentFailures,
  };
}

async function usageTotals({
  userId,
  from,
  to,
}: {
  userId?: string;
  from: Date;
  to: Date;
}) {
  const conditions = [
    gte(aiUsageLog.createdAt, from),
    lte(aiUsageLog.createdAt, to),
  ];
  if (userId) conditions.push(eq(aiUsageLog.userId, userId));
  const [row] = await db
    .select({
      totalCalls: sql<number>`count(*)::int`,
      successfulCalls: sql<number>`count(*) filter (where ${aiUsageLog.success} = true)::int`,
      cacheHits: sql<number>`count(*) filter (where ${aiUsageLog.cached} = true)::int`,
      estimatedCostUsd: sql<string>`coalesce(sum(${aiUsageLog.estimatedCostUsd}), 0)::text`,
      averageLatencyMs: sql<number>`round(avg(${aiUsageLog.latencyMs}))::int`,
    })
    .from(aiUsageLog)
    .where(and(...conditions));

  return {
    totalCalls: Number(row?.totalCalls ?? 0),
    successfulCalls: Number(row?.successfulCalls ?? 0),
    cacheHits: Number(row?.cacheHits ?? 0),
    estimatedCostUsd: Number(row?.estimatedCostUsd ?? 0),
    averageLatencyMs: row?.averageLatencyMs ?? null,
  };
}

async function usageByTier({
  userId,
  from,
  to,
}: {
  userId?: string;
  from: Date;
  to: Date;
}) {
  const conditions = [
    gte(aiUsageLog.createdAt, from),
    lte(aiUsageLog.createdAt, to),
  ];
  if (userId) conditions.push(eq(aiUsageLog.userId, userId));
  const rows = await db
    .select({
      tier: aiUsageLog.costTier,
      calls: sql<number>`count(*)::int`,
      costUsd: sql<string>`coalesce(sum(${aiUsageLog.estimatedCostUsd}), 0)::text`,
    })
    .from(aiUsageLog)
    .where(and(...conditions))
    .groupBy(aiUsageLog.costTier)
    .orderBy(aiUsageLog.costTier);
  return rows.map((row) => ({
    tier: row.tier,
    calls: Number(row.calls),
    costUsd: Number(row.costUsd),
  }));
}

async function usageByTask({
  userId,
  from,
  to,
}: {
  userId?: string;
  from: Date;
  to: Date;
}) {
  const conditions = [
    gte(aiUsageLog.createdAt, from),
    lte(aiUsageLog.createdAt, to),
  ];
  if (userId) conditions.push(eq(aiUsageLog.userId, userId));
  const rows = await db
    .select({
      taskType: aiUsageLog.taskType,
      calls: sql<number>`count(*)::int`,
      costUsd: sql<string>`coalesce(sum(${aiUsageLog.estimatedCostUsd}), 0)::text`,
    })
    .from(aiUsageLog)
    .where(and(...conditions))
    .groupBy(aiUsageLog.taskType)
    .orderBy(desc(sql`count(*)`))
    .limit(20);
  return rows.map((row) => ({
    taskType: row.taskType,
    calls: Number(row.calls),
    costUsd: Number(row.costUsd),
  }));
}

async function groupUsage(
  field: "provider" | "model_used" | "task_type" | "cost_tier",
  { from, to }: { from: Date; to: Date },
) {
  const column = sql.identifier(field);
  const rows = await db.execute(sql`
    SELECT coalesce(${column}::text, 'unknown') AS key,
           count(*)::int AS calls,
           coalesce(sum(estimated_cost_usd), 0)::text AS cost_usd,
           round(avg(latency_ms))::int AS avg_latency_ms,
           count(*) filter (where cached = true)::int AS cache_hits,
           count(*) filter (where success = false)::int AS failures
    FROM ai_usage_log
    WHERE created_at >= ${from} AND created_at <= ${to}
    GROUP BY 1
    ORDER BY calls DESC
  `);
  type Row = {
    key: string;
    calls: number | string;
    cost_usd: string;
    avg_latency_ms: number | null;
    cache_hits: number | string;
    failures: number | string;
  };
  const records = (rows as unknown as { rows?: Row[] }).rows ?? [];
  return records.map((row) => ({
    key: row.key,
    calls: Number(row.calls),
    costUsd: Number(row.cost_usd),
    averageLatencyMs: row.avg_latency_ms,
    cacheHits: Number(row.cache_hits),
    failures: Number(row.failures),
  }));
}

async function usageByCohort({ from, to }: { from: Date; to: Date }) {
  const rows = await db
    .select({
      tier: users.tier,
      calls: sql<number>`count(${aiUsageLog.id})::int`,
      costUsd: sql<string>`coalesce(sum(${aiUsageLog.estimatedCostUsd}), 0)::text`,
    })
    .from(aiUsageLog)
    .leftJoin(users, eq(aiUsageLog.userId, users.id))
    .where(and(gte(aiUsageLog.createdAt, from), lte(aiUsageLog.createdAt, to)))
    .groupBy(users.tier);
  return rows.map((row) => ({
    cohort: row.tier ?? "unknown",
    calls: Number(row.calls),
    costUsd: Number(row.costUsd),
  }));
}
