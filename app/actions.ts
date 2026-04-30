"use server";

import {
  normalizeWaitlistSubmission,
  recordWaitlistSignup,
  validateWaitlistSubmission,
} from "@/lib/waitlist";

export type WaitlistActionState = {
  ok: boolean;
  message: string;
};

export async function joinWaitlist(
  _previousState: WaitlistActionState,
  formData: FormData,
): Promise<WaitlistActionState> {
  const submission = normalizeWaitlistSubmission(formData);
  const error = validateWaitlistSubmission(submission);

  if (error) {
    return { ok: false, message: error };
  }

  if (process.env.TRACE_E2E_MOCK_WAITLIST === "true") {
    return {
      ok: true,
      message: "You're in. Watch your inbox for the strategy preview.",
    };
  }

  try {
    const { created } = await recordWaitlistSignup(submission);
    return {
      ok: true,
      message: created
        ? "You're in. Watch your inbox for the strategy preview."
        : "Already on the list — we updated your details.",
    };
  } catch (err) {
    console.error("[waitlist action] failed", err);
    return {
      ok: false,
      message: "Couldn't save right now. Try again in a moment.",
    };
  }
}
