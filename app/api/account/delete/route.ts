import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadedFiles, users } from "@/lib/db/schema";
import { deleteObject } from "@/lib/storage/supabase";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (parsed.data.email.toLowerCase().trim() !== user.email) {
    return NextResponse.json(
      { error: "Email confirmation does not match." },
      { status: 400 },
    );
  }

  const files = await db
    .select({ storageKey: uploadedFiles.storageKey })
    .from(uploadedFiles)
    .where(eq(uploadedFiles.userId, userId));

  await Promise.allSettled(files.map((f) => deleteObject(f.storageKey)));
  await db.delete(users).where(eq(users.id, userId));
  return NextResponse.json({ ok: true });
}
