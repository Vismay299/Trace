import { describe, expect, it, beforeEach } from "vitest";
import type Stripe from "stripe";
import {
  mapStripeSubscription,
  shouldApplyWebhook,
  tierFromBillingStatus,
} from "../subscriptions";

function subscription(
  status: Stripe.Subscription.Status,
  priceId: string,
): Stripe.Subscription {
  return {
    id: "sub_123",
    status,
    customer: "cus_123",
    cancel_at_period_end: false,
    current_period_start: 1777500000,
    current_period_end: 1780178400,
    items: {
      data: [{ price: { id: priceId } }],
    },
  } as unknown as Stripe.Subscription;
}

describe("billing subscription mapping", () => {
  beforeEach(() => {
    process.env.STRIPE_PRO_PRICE_ID = "price_pro";
  });

  it("maps active pro subscriptions to the pro tier", () => {
    const state = mapStripeSubscription(subscription("active", "price_pro"));
    expect(state.plan).toBe("pro");
    expect(state.tier).toBe("pro");
    expect(state.status).toBe("active");
    expect(state.stripeCustomerId).toBe("cus_123");
  });

  it("downgrades pro when payment state is not usable", () => {
    expect(tierFromBillingStatus("pro", "past_due")).toBe("free");
    expect(tierFromBillingStatus("pro", "unpaid")).toBe("free");
    expect(tierFromBillingStatus("pro", "canceled")).toBe("free");
  });

  it("does not expose unknown or studio prices as launch plans", () => {
    const state = mapStripeSubscription(subscription("active", "price_studio"));
    expect(state.plan).toBe("free");
    expect(state.tier).toBe("free");
  });

  it("allows equal or newer webhook events and rejects stale ones", () => {
    const last = new Date("2026-04-30T10:00:00Z");
    expect(shouldApplyWebhook(last, last.getTime() / 1000)).toBe(true);
    expect(shouldApplyWebhook(last, last.getTime() / 1000 + 1)).toBe(true);
    expect(shouldApplyWebhook(last, last.getTime() / 1000 - 1)).toBe(false);
  });
});
