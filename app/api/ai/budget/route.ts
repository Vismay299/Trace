import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { getBudgetSnapshot } from "@/lib/ai/budget";

export const runtime = "nodejs";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const budget = await getBudgetSnapshot(userId);
  return NextResponse.json(budget);
}
