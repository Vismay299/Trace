import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { waitlistSignups } from "@/lib/db/schema";
import { sendWaitlistConfirmation } from "@/lib/email";

export type WaitlistSubmission = {
  email: string;
  tier?: string;
  project?: string;
  platform?: string;
  source?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeWaitlistSubmission(
  formData: FormData,
): WaitlistSubmission {
  return {
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    tier: optionalString(formData.get("tier")),
    project: optionalString(formData.get("project")),
    platform: optionalString(formData.get("platform")),
    source: optionalString(formData.get("source")),
  };
}

export function validateWaitlistSubmission(submission: WaitlistSubmission) {
  if (!EMAIL_PATTERN.test(submission.email)) {
    return "Enter a real email address.";
  }
  if (submission.project && submission.project.length > 1000) {
    return "Project description is too long.";
  }
  return null;
}

/**
 * Persist a waitlist signup. Idempotent on email — repeated submissions
 * with the same email update tier/project/platform if filled in.
 * Sends a Resend confirmation on first signup; email failures don't block.
 */
export async function recordWaitlistSignup(
  submission: WaitlistSubmission,
): Promise<{ created: boolean }> {
  const existing = await db
    .select({ id: waitlistSignups.id })
    .from(waitlistSignups)
    .where(eq(waitlistSignups.email, submission.email))
    .limit(1);

  if (existing.length) {
    await db
      .update(waitlistSignups)
      .set({
        tier: submission.tier ?? null,
        project: submission.project ?? null,
        platform: submission.platform ?? null,
        source: submission.source ?? null,
      })
      .where(eq(waitlistSignups.id, existing[0].id));
    return { created: false };
  }

  await db.insert(waitlistSignups).values({
    email: submission.email,
    source: submission.source ?? null,
    tier: submission.tier ?? null,
    project: submission.project ?? null,
    platform: submission.platform ?? null,
  });

  sendWaitlistConfirmation(submission.email).catch((err) => {
    console.error("[waitlist] Resend confirmation failed:", err);
  });

  return { created: true };
}

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}
