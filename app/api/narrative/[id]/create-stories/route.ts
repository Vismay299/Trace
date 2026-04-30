import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { createStoriesFromPlan } from "@/lib/ai/narrative";

export const runtime = "nodejs";

const schema = z.object({
  selectedIndexes: z.array(z.number().int().min(0)).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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
  try {
    const seeds = await createStoriesFromPlan(
      userId,
      id,
      parsed.data.selectedIndexes,
    );
    return NextResponse.json({ ok: true, seeds });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Could not create stories",
      },
      { status: 500 },
    );
  }
}
