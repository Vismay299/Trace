import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { markComplete, getOrCreateSession } from "@/lib/interview/session";
import { QUESTIONS } from "@/lib/interview/questions";

export const runtime = "nodejs";

export async function POST() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await getOrCreateSession(userId);
  const answers = (session.answers ?? {}) as Record<string, unknown>;
  const answeredCount = Object.keys(answers).length;
  const total = QUESTIONS.length;

  // Allow completion at ≥ 80% answered. The Strategy Doc generator can
  // gracefully say "not enough" for any field that the answers don't cover.
  if (answeredCount < Math.ceil(total * 0.8)) {
    return NextResponse.json(
      {
        error: "Not enough answers yet.",
        answered: answeredCount,
        required: Math.ceil(total * 0.8),
        total,
      },
      { status: 400 },
    );
  }

  const updated = await markComplete(userId);
  return NextResponse.json({ ok: true, isComplete: updated.isComplete });
}
