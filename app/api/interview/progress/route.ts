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
      progress: state.progress,
      answeredCount: state.answeredCount,
      isComplete: session.isComplete,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
