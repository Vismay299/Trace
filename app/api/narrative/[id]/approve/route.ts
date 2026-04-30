import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { narrativePlans } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [plan] = await db
    .select()
    .from(narrativePlans)
    .where(eq(narrativePlans.id, id))
    .limit(1);
  if (!plan || plan.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [updated] = await db
    .update(narrativePlans)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(narrativePlans.id, id))
    .returning();
  return NextResponse.json({ ok: true, plan: updated });
}
