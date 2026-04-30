import { Button } from "@/components/ui/button";

export function TierCard({ tier }: { tier: string }) {
  return (
    <div className="rounded-card border border-border-strong bg-bg-elev p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
        Current tier
      </p>
      <h2 className="mt-2 text-3xl font-medium capitalize text-text">{tier}</h2>
      <p className="mt-3 text-sm text-text-muted">
        Billing arrives in Phase 2 with Stripe. Phase 1 keeps the Pro upgrade
        path visible without blocking the beta workflow.
      </p>
      <Button disabled className="mt-5">
        Get Pro
      </Button>
    </div>
  );
}
