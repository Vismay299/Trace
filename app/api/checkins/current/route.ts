import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getOrCreateCheckin } from "@/lib/checkin/session";
import { DEFAULT_CHECKIN_QUESTIONS } from "@/lib/checkin/questions";

export const runtime = "nodejs";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await getOrCreateCheckin(userId);
  return NextResponse.json({
    sessionId: session.id,
    weekStartDate: session.weekStartDate,
    isComplete: session.isComplete,
    productStage: session.productStage,
    inputMode: session.inputMode,
    questions: DEFAULT_CHECKIN_QUESTIONS,
    answers: session.answers ?? {},
  });
}
