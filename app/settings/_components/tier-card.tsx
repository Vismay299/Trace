import { Button } from "@/components/ui/button";
import { BillingActionButton } from "@/components/billing/billing-action-button";

export function TierCard({
  tier,
  status,
  cancelAtPeriodEnd,
}: {
  tier: string;
  status?: string | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const isPro = tier === "pro";
  const hasBilling = status && status !== "none";
  return (
    <div className="rounded-card border border-border-strong bg-bg-elev p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
        Current tier
      </p>
      <h2 className="mt-2 text-3xl font-medium capitalize text-text">{tier}</h2>
      <p className="mt-3 text-sm text-text-muted">
        {isPro
          ? "Pro is active through Stripe. Your higher weekly AI budget is available across generation flows."
          : "Free keeps the core workflow available. Pro adds higher weekly AI capacity and Phase 2 convenience features."}
      </p>
      {hasBilling ? (
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-text-dim">
          {status}
          {cancelAtPeriodEnd ? " / cancels at period end" : ""}
        </p>
      ) : null}
      {isPro ? (
        <BillingActionButton action="portal" className="mt-5">
          Manage billing
        </BillingActionButton>
      ) : (
        <BillingActionButton action="checkout" className="mt-5">
          Get Pro
        </BillingActionButton>
      )}
      <Button disabled variant="ghost" className="mt-3 w-full">
        Studio coming soon
      </Button>
    </div>
  );
}
