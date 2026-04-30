import { callAI } from "@/lib/ai/client";
import { loadPrompt } from "@/lib/ai/prompts";

export type FollowUpDecision = {
  needsFollowup: boolean;
  followupQuestion: string;
  reason: string;
};

/**
 * Decides whether to ask one short follow-up after an interview answer.
 * Tier-3 batched call. Falls open (no follow-up) on parse / network error
 * so the user is never blocked by our infra hiccup.
 */
export async function maybeAskFollowUp(opts: {
  userId: string;
  question: string;
  answer: string;
  sectionName: string;
}): Promise<FollowUpDecision> {
  // Quick local heuristic: if the answer is rich, skip the LLM.
  const wordCount = opts.answer.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 8) {
    return {
      needsFollowup: true,
      followupQuestion:
        "Can you make that more specific? Name a tool, a number, or a moment that captures it.",
      reason: "Answer was too short for synthesis.",
    };
  }
  if (wordCount > 120) {
    return { needsFollowup: false, followupQuestion: "", reason: "Answer is rich." };
  }

  const prompt = loadPrompt("interview-followup", {
    question: opts.question,
    answer: opts.answer,
    sectionName: opts.sectionName,
  });

  try {
    const result = await callAI({
      taskType: "interview_followup",
      userId: opts.userId,
      messages: [{ role: "system", content: prompt.system }],
      json: true,
      promptVersion: prompt.meta.version,
    });
    const parsed = JSON.parse(result.content) as FollowUpDecision;
    return {
      needsFollowup: Boolean(parsed.needsFollowup),
      followupQuestion: parsed.followupQuestion ?? "",
      reason: parsed.reason ?? "",
    };
  } catch (err) {
    console.warn("[interview/followup] LLM failed; skipping follow-up.", err);
    return { needsFollowup: false, followupQuestion: "", reason: "fallback" };
  }
}
