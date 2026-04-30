import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { voiceSamples } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const samples = await db
    .select()
    .from(voiceSamples)
    .where(eq(voiceSamples.userId, userId))
    .orderBy(desc(voiceSamples.createdAt));

  return NextResponse.json({ samples });
}
