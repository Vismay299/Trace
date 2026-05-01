import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

declare global {
  var __traceStripe: Stripe | undefined;
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  globalThis.__traceStripe ??= new Stripe(key);
  return globalThis.__traceStripe;
}

export async function getOrCreateStripeCustomer(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      stripeCustomerId: users.stripeCustomerId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) throw new Error("User not found.");
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await getStripe().customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { traceUserId: user.id },
  });

  await db
    .update(users)
    .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return customer.id;
}

export async function createCheckoutSession({
  userId,
  origin,
}: {
  userId: string;
  origin: string;
}) {
  const price = process.env.STRIPE_PRO_PRICE_ID;
  if (!price) throw new Error("STRIPE_PRO_PRICE_ID is not set.");
  const customer = await getOrCreateStripeCustomer(userId);
  return getStripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/settings?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    metadata: { traceUserId: userId, plan: "pro" },
    subscription_data: {
      metadata: { traceUserId: userId, plan: "pro" },
    },
  });
}

export async function createBillingPortalSession({
  userId,
  origin,
}: {
  userId: string;
  origin: string;
}) {
  const customer = await getOrCreateStripeCustomer(userId);
  return getStripe().billingPortal.sessions.create({
    customer,
    return_url: `${origin}/settings`,
  });
}

export async function constructWebhookEvent(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set.");
  const signature = req.headers.get("stripe-signature");
  if (!signature) throw new Error("Missing Stripe signature.");
  const body = await req.text();
  return getStripe().webhooks.constructEvent(body, signature, secret);
}
