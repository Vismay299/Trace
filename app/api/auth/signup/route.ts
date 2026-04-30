/**
 * Email/password signup. NextAuth's Credentials provider doesn't ship a
 * registration endpoint — this one does the create + bcrypt hash + budget
 * provisioning, then the caller can call `signIn("credentials", ...)`.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getOrCreateBudget } from "@/lib/ai/budget";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const [created] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name: parsed.data.name ?? null,
      tier: "free",
    })
    .returning({ id: users.id, email: users.email });

  await getOrCreateBudget(created.id, "free");

  return NextResponse.json({ ok: true, userId: created.id });
}
