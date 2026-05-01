import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { getAdminAiCostReport } from "@/lib/ai/ops";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await requireAdminUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const days = Math.min(
    90,
    Math.max(1, Number(url.searchParams.get("days") ?? 30)),
  );
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(to.getUTCDate() - days);

  const report = await getAdminAiCostReport({ from, to });
  return NextResponse.json(report);
}
