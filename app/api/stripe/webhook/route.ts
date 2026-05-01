import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, constructWebhookEvent } from "@/lib/billing/stripe";
import {
  applyBillingStateToUser,
  downgradeCustomerAfterPaymentIssue,
  mapStripeSubscription,
} from "@/lib/billing/subscriptions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let event: Stripe.Event;
  try {
    event = await constructWebhookEvent(req);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid webhook" },
      { status: 400 },
    );
  }

  try {
    await handleStripeEvent(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook] failed", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (typeof session.subscription !== "string") return;
      const subscription = await getStripe().subscriptions.retrieve(
        session.subscription,
      );
      await applyBillingStateToUser({
        state: mapStripeSubscription(subscription),
        eventCreated: event.created,
      });
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await applyBillingStateToUser({
        state: mapStripeSubscription(subscription),
        eventCreated: event.created,
      });
      return;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customer =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
      if (customer) {
        await downgradeCustomerAfterPaymentIssue({
          stripeCustomerId: customer,
          status: "past_due",
          eventCreated: event.created,
        });
      }
      return;
    }
    case "invoice.paid":
      return;
    default:
      return;
  }
}
