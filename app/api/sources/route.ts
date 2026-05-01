import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { listUnifiedSources } from "@/lib/integrations/shared/connections";

export const runtime = "nodejs";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sources = await listUnifiedSources(userId);
  return NextResponse.json(sources);
}
