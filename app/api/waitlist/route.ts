import {
  normalizeWaitlistSubmission,
  recordWaitlistSignup,
  validateWaitlistSubmission,
} from "@/lib/waitlist";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const formData = contentType.includes("application/json")
    ? jsonToFormData(await request.json())
    : await request.formData();

  const submission = normalizeWaitlistSubmission(formData);
  const error = validateWaitlistSubmission(submission);

  if (error) {
    return Response.json({ ok: false, error }, { status: 400 });
  }

  // TODO(spec): Wire this to durable waitlist storage plus Resend/Supabase in the main implementation plan.
  recordWaitlistSignup(submission);

  return Response.json({ ok: true });
}

function jsonToFormData(input: unknown) {
  const formData = new FormData();

  if (typeof input !== "object" || input === null) {
    return formData;
  }

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      formData.set(key, value);
    }
  }

  return formData;
}
