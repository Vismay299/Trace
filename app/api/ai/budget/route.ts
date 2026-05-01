import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getUserAiCredits } from "@/lib/ai/ops";

export const runtime = "nodejs";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credits = await getUserAiCredits(userId);
  return NextResponse.json(credits);
}
