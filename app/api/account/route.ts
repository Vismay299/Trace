import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(1).max(100).nullable().optional(),
  email: z.string().email().max(254).optional(),
});

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      tier: users.tier,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
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

  const email = parsed.data.email?.toLowerCase().trim();
  if (email) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing && existing.id !== userId) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }
  }

  const [updated] = await db
    .update(users)
    .set({
      name: parsed.data.name ?? null,
      ...(email ? { email } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      tier: users.tier,
    });
  return NextResponse.json({ ok: true, user: updated });
}
