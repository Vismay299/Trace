import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviewSessions, type InterviewSession } from "@/lib/db/schema";
import { findQuestion, QUESTIONS, progressFor } from "./questions";

export type AnswerEntry = {
  answer: string;
  followups?: string[];
  mode?: "text" | "voice";
};

export async function getOrCreateSession(userId: string): Promise<InterviewSession> {
  const [existing] = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.userId, userId))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(interviewSessions)
    .values({
      userId,
      currentSection: 1,
      currentQuestion: 1,
      answers: {},
    })
    .returning();
  return created;
}

export async function saveAnswer(
  userId: string,
  questionId: string,
  entry: AnswerEntry,
): Promise<InterviewSession> {
  const session = await getOrCreateSession(userId);
  const q = findQuestion(questionId);
  if (!q) throw new Error(`Unknown question id: ${questionId}`);
  const merged = {
    ...((session.answers ?? {}) as Record<string, AnswerEntry>),
    [questionId]: entry,
  };
  const next = nextUnansweredAfter(merged, q.globalIndex);
  const [updated] = await db
    .update(interviewSessions)
    .set({
      answers: merged,
      currentSection: next?.section ?? q.section,
      currentQuestion: next?.index ?? q.index,
      isComplete: next == null,
      updatedAt: new Date(),
    })
    .where(eq(interviewSessions.id, session.id))
    .returning();
  return updated;
}

export async function markComplete(userId: string): Promise<InterviewSession> {
  const session = await getOrCreateSession(userId);
  const [updated] = await db
    .update(interviewSessions)
    .set({ isComplete: true, updatedAt: new Date() })
    .where(eq(interviewSessions.id, session.id))
    .returning();
  return updated;
}

export function currentQuestionFor(session: InterviewSession) {
  const answers = (session.answers ?? {}) as Record<string, AnswerEntry>;
  const next = nextUnansweredAfter(answers, 0);
  return {
    question: next ?? null,
    progress: progressFor(next?.id),
    answeredCount: Object.keys(answers).length,
  };
}

function nextUnansweredAfter(
  answers: Record<string, AnswerEntry>,
  afterGlobalIndex: number,
) {
  for (const q of QUESTIONS) {
    if (q.globalIndex <= afterGlobalIndex) continue;
    if (!answers[q.id]) return q;
  }
  // Loop back to find any earlier missed
  for (const q of QUESTIONS) {
    if (!answers[q.id]) return q;
  }
  return null;
}
