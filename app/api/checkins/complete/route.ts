import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { completeCheckin, getOrCreateCheckin } from "@/lib/checkin/session";

export const runtime = "nodejs";

const schema = z.object({
  productStage: z
    .enum(["building", "launching", "operating", "scaling"])
    .nullish(),
});

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const session = await getOrCreateCheckin(userId);
  const answered = Object.keys(
    (session.answers ?? {}) as Record<string, unknown>,
  ).length;
  if (answered < 3) {
    return NextResponse.json(
      { error: "Answer at least 3 questions before submitting." },
      { status: 400 },
    );
  }
  const updated = await completeCheckin(
    userId,
    parsed.data.productStage ?? null,
  );
  return NextResponse.json({ ok: true, checkin: updated });
}
