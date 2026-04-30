import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { narrativePlans } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [plan] = await db
    .select()
    .from(narrativePlans)
    .where(eq(narrativePlans.userId, userId))
    .orderBy(desc(narrativePlans.createdAt))
    .limit(1);
  return NextResponse.json({ plan: plan ?? null });
}
