import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { weeklyCheckins, type WeeklyCheckin } from "@/lib/db/schema";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function currentWeekStart(now = new Date()): string {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return isoDate(d);
}

export type CheckinAnswerEntry = {
  answer: string;
  followups?: string[];
  mode?: "text" | "voice";
};

export async function getOrCreateCheckin(userId: string): Promise<WeeklyCheckin> {
  const week = currentWeekStart();
  const [existing] = await db
    .select()
    .from(weeklyCheckins)
    .where(
      and(
        eq(weeklyCheckins.userId, userId),
        eq(weeklyCheckins.weekStartDate, week),
      ),
    )
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(weeklyCheckins)
    .values({
      userId,
      weekStartDate: week,
      answers: {},
      isComplete: false,
      inputMode: "text",
    })
    .returning();
  return created;
}

export async function saveCheckinAnswer(
  userId: string,
  qid: string,
  entry: CheckinAnswerEntry,
): Promise<WeeklyCheckin> {
  const session = await getOrCreateCheckin(userId);
  const merged: Record<string, CheckinAnswerEntry> = {
    ...((session.answers ?? {}) as Record<string, CheckinAnswerEntry>),
    [qid]: entry,
  };
  const inputMode =
    entry.mode === "voice" || session.inputMode === "voice" ? "voice" : "text";
  const [updated] = await db
    .update(weeklyCheckins)
    .set({ answers: merged, inputMode, updatedAt: new Date() })
    .where(eq(weeklyCheckins.id, session.id))
    .returning();
  return updated;
}

export async function appendFollowupReply(
  userId: string,
  qid: string,
  reply: string,
): Promise<WeeklyCheckin> {
  const session = await getOrCreateCheckin(userId);
  const answers = (session.answers ?? {}) as Record<string, CheckinAnswerEntry>;
  const existing = answers[qid] ?? { answer: "" };
  answers[qid] = {
    ...existing,
    followups: [...(existing.followups ?? []), reply],
  };
  const [updated] = await db
    .update(weeklyCheckins)
    .set({ answers, updatedAt: new Date() })
    .where(eq(weeklyCheckins.id, session.id))
    .returning();
  return updated;
}

export async function completeCheckin(
  userId: string,
  productStage?: "building" | "launching" | "operating" | "scaling" | null,
): Promise<WeeklyCheckin> {
  const session = await getOrCreateCheckin(userId);
  const [updated] = await db
    .update(weeklyCheckins)
    .set({
      isComplete: true,
      productStage: productStage ?? session.productStage ?? null,
      updatedAt: new Date(),
    })
    .where(eq(weeklyCheckins.id, session.id))
    .returning();
  return updated;
}

export async function listCheckins(userId: string): Promise<WeeklyCheckin[]> {
  return db
    .select()
    .from(weeklyCheckins)
    .where(eq(weeklyCheckins.userId, userId))
    .orderBy(desc(weeklyCheckins.weekStartDate));
}

export async function recentCheckinsSince(
  userId: string,
  isoSince: string,
): Promise<WeeklyCheckin[]> {
  return db
    .select()
    .from(weeklyCheckins)
    .where(
      and(
        eq(weeklyCheckins.userId, userId),
        gte(weeklyCheckins.weekStartDate, isoSince),
      ),
    );
}

export function totalFollowupsAcross(answers: Record<string, CheckinAnswerEntry>) {
  return Object.values(answers).reduce(
    (acc, e) => acc + (e.followups?.length ?? 0),
    0,
  );
}
