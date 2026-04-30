import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import {
  getOrCreateSession,
  currentQuestionFor,
} from "@/lib/interview/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await requireUserId();
    const session = await getOrCreateSession(userId);
    const state = currentQuestionFor(session);
    return NextResponse.json({
      sessionId: session.id,
      isComplete: session.isComplete,
      currentQuestion: state.question,
      progress: state.progress,
      answers: session.answers ?? {},
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 },
    );
  }
}
