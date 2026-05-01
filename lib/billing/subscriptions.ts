import { eq, or, type SQL } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { defaultLimitsFor, refreshCurrentBudgetLimits } from "@/lib/ai/budget";
import type { BillingState, BillingStatus, LaunchPlan } from "./types";

type StripeSubscriptionLike = Stripe.Subscription & {
  current_period_start?: number;
  current_period_end?: number;
};

export function planFromStripePrice(priceId?: string | null): LaunchPlan {
  if (priceId && priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  return "free";
}

export function statusFromStripe(status?: string | null): BillingStatus {
  switch (status) {
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
    case "unpaid":
    case "paused":
      return status;
    default:
      return "none";
  }
}

export function tierFromBillingStatus(
  plan: LaunchPlan,
  status: BillingStatus,
): LaunchPlan {
  if (plan !== "pro") return "free";
  return status === "active" || status === "trialing" ? "pro" : "free";
}

export function mapStripeSubscription(
  subscription: Stripe.Subscription,
): BillingState {
  const sub = subscription as StripeSubscriptionLike;
  const priceId = subscription.items.data[0]?.price.id;
  const plan = planFromStripePrice(priceId);
  const status = statusFromStripe(subscription.status);
  return {
    plan,
    tier: tierFromBillingStatus(plan, status),
    status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodStart: sub.current_period_start
      ? new Date(sub.current_period_start * 1000)
      : null,
    currentPeriodEnd: sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : null,
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id ?? null,
    stripeSubscriptionId: subscription.id,
  };
}

export function shouldApplyWebhook(
  lastWebhookAt: Date | string | null | undefined,
  eventCreated: number,
): boolean {
  if (!lastWebhookAt) return true;
  const last = new Date(lastWebhookAt).getTime();
  return eventCreated * 1000 >= last;
}

export async function applyBillingStateToUser({
  state,
  eventCreated,
}: {
  state: BillingState;
  eventCreated: number;
}) {
  const stripeCustomerId = state.stripeCustomerId;
  const stripeSubscriptionId = state.stripeSubscriptionId;
  if (!stripeCustomerId && !stripeSubscriptionId) return null;
  const predicates: SQL[] = [];
  if (stripeCustomerId) predicates.push(eq(users.stripeCustomerId, stripeCustomerId));
  if (stripeSubscriptionId) {
    predicates.push(eq(users.stripeSubscriptionId, stripeSubscriptionId));
  }

  const [existing] = await db
    .select({
      id: users.id,
      lastStripeWebhookAt: users.lastStripeWebhookAt,
    })
    .from(users)
    .where(predicates.length === 1 ? predicates[0] : or(...predicates))
    .limit(1);

  if (!existing || !shouldApplyWebhook(existing.lastStripeWebhookAt, eventCreated)) {
    return existing ?? null;
  }

  const [updated] = await db
    .update(users)
    .set({
      tier: state.tier,
      planCode: state.plan,
      stripeCustomerId,
      stripeSubscriptionId,
      stripeSubscriptionStatus: state.status,
      billingPeriodStart: state.currentPeriodStart,
      billingPeriodEnd: state.currentPeriodEnd,
      cancelAtPeriodEnd: state.cancelAtPeriodEnd,
      lastStripeWebhookAt: new Date(eventCreated * 1000),
      updatedAt: new Date(),
    })
    .where(eq(users.id, existing.id))
    .returning();

  await refreshCurrentBudgetLimits(updated.id, defaultLimitsFor(state.tier));
  return updated;
}

export async function downgradeCustomerAfterPaymentIssue({
  stripeCustomerId,
  eventCreated,
  status,
}: {
  stripeCustomerId: string;
  eventCreated: number;
  status: Extract<BillingStatus, "past_due" | "canceled" | "unpaid">;
}) {
  const [updated] = await db
    .update(users)
    .set({
      tier: "free",
      planCode: "free",
      stripeSubscriptionStatus: status,
      lastStripeWebhookAt: new Date(eventCreated * 1000),
      updatedAt: new Date(),
    })
    .where(eq(users.stripeCustomerId, stripeCustomerId))
    .returning();

  if (updated) {
    await refreshCurrentBudgetLimits(updated.id, defaultLimitsFor("free"));
  }
  return updated ?? null;
}
