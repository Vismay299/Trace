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

  const plans = await db
    .select()
    .from(narrativePlans)
    .where(eq(narrativePlans.userId, userId))
    .orderBy(desc(narrativePlans.weekStartDate));
  return NextResponse.json({ plans });
}
