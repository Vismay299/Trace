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
    return {
      ok: false,
      message: error,
    };
  }

  recordWaitlistSignup(submission);

  return {
    ok: true,
    message: "You're in. Watch your inbox for the strategy preview.",
  };
}
