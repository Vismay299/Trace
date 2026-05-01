import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { captureServerEvent } from "@/lib/analytics/server";
import { createCheckoutSession } from "@/lib/billing/stripe";

export const runtime = "nodejs";

export async function GET(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    redirect("/signup?plan=pro");
  }

  const session = await createCheckoutSession({
    userId,
    origin: originFromRequest(req),
  });

  captureServerEvent({
    event: "subscription_started",
    distinctId: userId,
    properties: { source: "checkout_redirect" },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  redirect(session.url);
}

function originFromRequest(req: Request) {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}
