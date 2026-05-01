import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { createBillingPortalSession } from "@/lib/billing/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const session = await createBillingPortalSession({
      userId,
      origin: originFromRequest(req),
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Billing portal failed" },
      { status: 500 },
    );
  }
}

function originFromRequest(req: Request) {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}
