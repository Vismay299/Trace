export const LAUNCH_PLANS = ["free", "pro"] as const;
export type LaunchPlan = (typeof LAUNCH_PLANS)[number];
export type InternalPlan = LaunchPlan | "studio";

export type BillingStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

export type BillingState = {
  plan: LaunchPlan;
  tier: LaunchPlan;
  status: BillingStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export function isLaunchPlan(value: string | null | undefined): value is LaunchPlan {
  return value === "free" || value === "pro";
}
