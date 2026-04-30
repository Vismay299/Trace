export type WaitlistSubmission = {
  email: string;
  tier?: string;
  project?: string;
  platform?: string;
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
  };
}

export function validateWaitlistSubmission(submission: WaitlistSubmission) {
  if (!EMAIL_PATTERN.test(submission.email)) {
    return "Enter a real email address.";
  }

  return null;
}

export function recordWaitlistSignup(submission: WaitlistSubmission) {
  console.info("[waitlist]", {
    email: submission.email,
    tier: submission.tier ?? null,
    platform: submission.platform ?? null,
    hasProject: Boolean(submission.project),
  });
}

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}
