import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { listCheckins } from "@/lib/checkin/session";

export const runtime = "nodejs";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checkins = await listCheckins(userId);
  return NextResponse.json({ checkins });
}
