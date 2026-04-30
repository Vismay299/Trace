import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { findQuestion } from "@/lib/interview/questions";
import { saveAnswer, currentQuestionFor, getOrCreateSession } from "@/lib/interview/session";
import { maybeAskFollowUp } from "@/lib/interview/followup";
import { AIBudgetExhaustedError } from "@/lib/ai/types";

export const runtime = "nodejs";

const schema = z.object({
  questionId: z.string().min(1),
  answer: z.string().min(1).max(8000),
  inputMode: z.enum(["text", "voice"]).default("text"),
  /** If true, skip the LLM follow-up call entirely (e.g. user clicked "skip"). */
  skipFollowup: z.boolean().optional(),
  /** Are we replying to a follow-up? Then we don't ask another. */
  isFollowupReply: z.boolean().optional(),
});

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const q = findQuestion(parsed.data.questionId);
  if (!q) return NextResponse.json({ error: "Unknown question" }, { status: 400 });

  // If this is a follow-up reply, append to the existing entry rather than replacing.
  const session = await getOrCreateSession(userId);
  const existing = ((session.answers ?? {}) as Record<string, { answer: string; followups?: string[]; mode?: "text" | "voice" }>)[q.id];
  let entry: { answer: string; followups?: string[]; mode?: "text" | "voice" };
  if (parsed.data.isFollowupReply && existing) {
    entry = {
      ...existing,
      followups: [...(existing.followups ?? []), parsed.data.answer],
    };
  } else {
    entry = {
      answer: parsed.data.answer,
      mode: parsed.data.inputMode,
    };
  }

  const updated = await saveAnswer(userId, q.id, entry);

  // Decide whether to ask a follow-up. Skip if user opted out, this was already
  // a follow-up reply, or the question disallows follow-ups.
  let followup: { needsFollowup: boolean; followupQuestion: string; reason: string } = {
    needsFollowup: false,
    followupQuestion: "",
    reason: "skipped",
  };
  if (
    !parsed.data.skipFollowup &&
    !parsed.data.isFollowupReply &&
    q.allowFollowUp
  ) {
    try {
      followup = await maybeAskFollowUp({
        userId,
        question: q.prompt,
        answer: parsed.data.answer,
        sectionName: q.sectionName,
      });
    } catch (err) {
      if (err instanceof AIBudgetExhaustedError) {
        followup = {
          needsFollowup: false,
          followupQuestion: "",
          reason: "budget_exhausted",
        };
      } else {
        throw err;
      }
    }
  }

  const state = currentQuestionFor(updated);
  return NextResponse.json({
    saved: true,
    followup,
    nextQuestion: state.question,
    progress: state.progress,
    isComplete: updated.isComplete,
  });
}
