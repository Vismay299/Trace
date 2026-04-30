import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getVoiceScore } from "@/lib/voice/score";

export const runtime = "nodejs";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const score = await getVoiceScore(userId);
  return NextResponse.json(score);
}
