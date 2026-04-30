import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getSignalStatus } from "@/lib/ai/signal";

export const runtime = "nodejs";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getSignalStatus(userId);
  return NextResponse.json(status);
}
