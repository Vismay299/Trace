/**
 * Per-user weekly AI budget. Spec §F15.
 *
 * Phase 1 free-tier limits (Mon→Sun, sized for ~3 posts + 1 plan + 1 check-in):
 *   tier1 = 5, tier2 = 8, tier3 = 20.
 *
 * Atomic check-and-decrement via SQL CASE so concurrent calls can't
 * over-spend. On transport failure we restore the count (refundBudget).
 */
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiBudgets, type AiBudget } from "@/lib/db/schema";
import { AIBudgetExhaustedError } from "./types";
import type { Tier } from "./models";

const PHASE1_LIMITS: Record<"free" | "pro" | "studio", Record<Tier, number>> = {
  free: { 1: 5, 2: 8, 3: 20 },
  pro: { 1: 50, 2: 80, 3: 200 },
  studio: { 1: 500, 2: 800, 3: 2000 },
};

export function defaultLimitsFor(tier: "free" | "pro" | "studio") {
  return PHASE1_LIMITS[tier];
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function currentWeekRange(now = new Date()): {
  start: string;
  end: string;
} {
  // Monday → Sunday, UTC. Day 0 (Sunday) → previous Monday.
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { start: isoDate(monday), end: isoDate(sunday) };
}

export async function getOrCreateBudget(
  userId: string,
  tier: "free" | "pro" | "studio" = "free",
): Promise<AiBudget> {
  const { start, end } = currentWeekRange();
  const limits = PHASE1_LIMITS[tier];

  const existing = await db
    .select()
    .from(aiBudgets)
    .where(
      sql`${aiBudgets.userId} = ${userId} AND ${aiBudgets.billingPeriodStart} = ${start}`,
    )
    .limit(1);
  if (existing.length) return existing[0];

  const [created] = await db
    .insert(aiBudgets)
    .values({
      userId,
      billingPeriodStart: start,
      billingPeriodEnd: end,
      tier1RequestsLimit: limits[1],
      tier2RequestsLimit: limits[2],
      tier3RequestsLimit: limits[3],
    })
    .onConflictDoNothing({
      target: [aiBudgets.userId, aiBudgets.billingPeriodStart],
    })
    .returning();
  if (created) return created;

  // Conflict path: someone raced us.
  const [row] = await db
    .select()
    .from(aiBudgets)
    .where(
      sql`${aiBudgets.userId} = ${userId} AND ${aiBudgets.billingPeriodStart} = ${start}`,
    )
    .limit(1);
  return row;
}

const TIER_USED_COL: Record<Tier, "tier1RequestsUsed" | "tier2RequestsUsed" | "tier3RequestsUsed"> = {
  1: "tier1RequestsUsed",
  2: "tier2RequestsUsed",
  3: "tier3RequestsUsed",
};
const TIER_LIMIT_COL: Record<Tier, "tier1RequestsLimit" | "tier2RequestsLimit" | "tier3RequestsLimit"> = {
  1: "tier1RequestsLimit",
  2: "tier2RequestsLimit",
  3: "tier3RequestsLimit",
};

/**
 * Atomic increment. If it would exceed the limit, throws BudgetExhausted.
 * Returns the post-increment used count.
 */
export async function checkAndDecrement(
  userId: string,
  tier: Tier,
  userTier: "free" | "pro" | "studio" = "free",
): Promise<{ used: number; limit: number; periodEnd: string }> {
  const budget = await getOrCreateBudget(userId, userTier);
  const usedKey = TIER_USED_COL[tier];
  const limitKey = TIER_LIMIT_COL[tier];

  // Atomic SQL update — increment only when used < limit.
  const usedColSql = sql.identifier(snakeCase(usedKey));
  const limitColSql = sql.identifier(snakeCase(limitKey));

  const result = await db.execute(sql`
    UPDATE ai_budgets
    SET ${usedColSql} = ${usedColSql} + 1,
        updated_at = now()
    WHERE id = ${budget.id}
      AND ${usedColSql} < ${limitColSql}
    RETURNING ${usedColSql} AS used, ${limitColSql} AS limit_, billing_period_end
  `);

  type BudgetUpdateRow = {
    used: number | string;
    limit_: number | string;
    billing_period_end: string | Date;
  };
  const rows =
    (result as unknown as { rows?: BudgetUpdateRow[] }).rows ??
    (Array.isArray(result) ? (result as unknown as BudgetUpdateRow[]) : []);
  const row = rows[0];
  if (!row) {
    throw new AIBudgetExhaustedError(
      tier,
      budget[usedKey],
      budget[limitKey],
      budget.billingPeriodEnd,
    );
  }
  return {
    used: Number(row.used),
    limit: Number(row.limit_),
    periodEnd: String(row.billing_period_end),
  };
}

/** Refund 1 unit on transport failure so users aren't charged for our bugs. */
export async function refundBudget(
  userId: string,
  tier: Tier,
): Promise<void> {
  const usedKey = TIER_USED_COL[tier];
  const usedCol = sql.identifier(snakeCase(usedKey));
  await db.execute(sql`
    UPDATE ai_budgets
    SET ${usedCol} = GREATEST(${usedCol} - 1, 0), updated_at = now()
    WHERE user_id = ${userId}
      AND billing_period_start = ${currentWeekRange().start}
  `);
}

export type BudgetSnapshot = {
  tier1: { used: number; limit: number };
  tier2: { used: number; limit: number };
  tier3: { used: number; limit: number };
  periodStart: string;
  periodEnd: string;
};

export async function getBudgetSnapshot(
  userId: string,
  userTier: "free" | "pro" | "studio" = "free",
): Promise<BudgetSnapshot> {
  const b = await getOrCreateBudget(userId, userTier);
  return {
    tier1: { used: b.tier1RequestsUsed, limit: b.tier1RequestsLimit },
    tier2: { used: b.tier2RequestsUsed, limit: b.tier2RequestsLimit },
    tier3: { used: b.tier3RequestsUsed, limit: b.tier3RequestsLimit },
    periodStart: b.billingPeriodStart,
    periodEnd: b.billingPeriodEnd,
  };
}

function snakeCase(camel: string): string {
  return camel.replace(/[A-Z0-9]+/g, (m) => "_" + m.toLowerCase());
}
