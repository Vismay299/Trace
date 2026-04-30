import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatedContent } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const format = url.searchParams.get("format");

  const conds = [eq(generatedContent.userId, userId)];
  if (status) conds.push(eq(generatedContent.status, status));
  if (format) conds.push(eq(generatedContent.format, format));

  const rows = await db
    .select()
    .from(generatedContent)
    .where(and(...conds))
    .orderBy(desc(generatedContent.createdAt));
  return NextResponse.json({ content: rows });
}
