import {
  normalizeWaitlistSubmission,
  recordWaitlistSignup,
  validateWaitlistSubmission,
} from "@/lib/waitlist";

export const runtime = "nodejs";

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

  try {
    const { created } = await recordWaitlistSignup(submission);
    return Response.json({ ok: true, created });
  } catch (err) {
    console.error("[waitlist] persistence failed", err);
    return Response.json(
      { ok: false, error: "Could not save right now. Try again in a sec." },
      { status: 500 },
    );
  }
}

function jsonToFormData(input: unknown) {
  const formData = new FormData();
  if (typeof input !== "object" || input === null) return formData;
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") formData.set(key, value);
  }
  return formData;
}
