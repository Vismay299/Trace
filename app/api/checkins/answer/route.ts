import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import {
  appendFollowupReply,
  saveCheckinAnswer,
  totalFollowupsAcross,
  getOrCreateCheckin,
} from "@/lib/checkin/session";
import { maybeAskCheckinFollowUp } from "@/lib/checkin/followup";
import { DEFAULT_CHECKIN_QUESTIONS } from "@/lib/checkin/questions";
import { AIBudgetExhaustedError } from "@/lib/ai/types";

export const runtime = "nodejs";

const schema = z.object({
  questionId: z.string().min(1),
  answer: z.string().min(1).max(8000),
  inputMode: z.enum(["text", "voice"]).default("text"),
  isFollowupReply: z.boolean().optional(),
  skipFollowup: z.boolean().optional(),
});

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const question = DEFAULT_CHECKIN_QUESTIONS.find(
    (q) => q.id === parsed.data.questionId,
  );

  let updated;
  if (parsed.data.isFollowupReply) {
    updated = await appendFollowupReply(
      userId,
      parsed.data.questionId,
      parsed.data.answer,
    );
  } else {
    updated = await saveCheckinAnswer(userId, parsed.data.questionId, {
      answer: parsed.data.answer,
      mode: parsed.data.inputMode,
    });
  }

  const session = await getOrCreateCheckin(userId);
  const followupsAsked = totalFollowupsAcross(
    (session.answers ?? {}) as Record<string, { followups?: string[] }>,
  );

  let followup = { needsFollowup: false, followupQuestion: "", reason: "skipped" };
  if (
    !parsed.data.skipFollowup &&
    !parsed.data.isFollowupReply &&
    question
  ) {
    try {
      followup = await maybeAskCheckinFollowUp({
        userId,
        question: question.prompt,
        answer: parsed.data.answer,
        followupsAsked,
      });
    } catch (err) {
      if (err instanceof AIBudgetExhaustedError) {
        followup = { needsFollowup: false, followupQuestion: "", reason: "budget_exhausted" };
      } else {
        throw err;
      }
    }
  }

  return NextResponse.json({
    saved: true,
    followup,
    answers: updated.answers ?? {},
  });
}
