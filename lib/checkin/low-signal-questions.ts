import { DEFAULT_CHECKIN_QUESTIONS } from "./questions";
import { generateLowSignalPlan, type LowSignalPlan } from "@/lib/ai/low-signal";
import type { SignalStatus } from "@/lib/ai/signal";

export type CheckinQuestion = {
  id: string;
  prompt: string;
};

export async function questionsForWeeklyCheckin(
  userId: string,
  signal: SignalStatus,
): Promise<{ questions: CheckinQuestion[]; lowSignal: LowSignalPlan | null }> {
  if (signal.mode !== "low_signal") {
    return {
      questions: DEFAULT_CHECKIN_QUESTIONS.map(({ id, prompt }) => ({
        id,
        prompt,
      })),
      lowSignal: null,
    };
  }

  const lowSignal = await generateLowSignalPlan(userId);
  if (!lowSignal.questions.length) {
    return {
      questions: DEFAULT_CHECKIN_QUESTIONS.map(({ id, prompt }) => ({
        id,
        prompt,
      })),
      lowSignal,
    };
  }

  return {
    questions: lowSignal.questions.map(({ id, prompt }) => ({ id, prompt })),
    lowSignal,
  };
}
