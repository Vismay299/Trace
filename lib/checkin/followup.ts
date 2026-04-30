import { callAI } from "@/lib/ai/client";
import { loadPrompt } from "@/lib/ai/prompts";

export type CheckinFollowUp = {
  needsFollowup: boolean;
  followupQuestion: string;
  reason: string;
};

export async function maybeAskCheckinFollowUp(opts: {
  userId: string;
  question: string;
  answer: string;
  followupsAsked: number;
}): Promise<CheckinFollowUp> {
  const wordCount = opts.answer.trim().split(/\s+/).filter(Boolean).length;
  if (opts.followupsAsked >= 4 || wordCount > 90) {
    return { needsFollowup: false, followupQuestion: "", reason: "skipped" };
  }
  if (wordCount < 6) {
    return {
      needsFollowup: true,
      followupQuestion:
        "Make that more specific — name a person, a number, or a moment that captures it.",
      reason: "too short",
    };
  }
  const prompt = loadPrompt("checkin-followup", {
    question: opts.question,
    answer: opts.answer,
    followupsAsked: opts.followupsAsked,
  });
  try {
    const r = await callAI({
      taskType: "checkin_followup",
      userId: opts.userId,
      messages: [{ role: "system", content: prompt.system }],
      json: true,
      promptVersion: prompt.meta.version,
    });
    const parsed = JSON.parse(r.content) as CheckinFollowUp;
    return {
      needsFollowup: Boolean(parsed.needsFollowup),
      followupQuestion: parsed.followupQuestion ?? "",
      reason: parsed.reason ?? "",
    };
  } catch (err) {
    console.warn("[checkin/followup] LLM failed; skipping.", err);
    return { needsFollowup: false, followupQuestion: "", reason: "fallback" };
  }
}
