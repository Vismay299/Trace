import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/billing/stripe";
import { captureServerEvent } from "@/lib/analytics/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const session = await createCheckoutSession({
      userId,
      origin: originFromRequest(req),
    });
    captureServerEvent({
      event: "subscription_started",
      distinctId: userId,
      properties: { source: "checkout_created" },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 },
    );
  }
}

function originFromRequest(req: Request) {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}
