import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Pill } from "@/components/ui/pill";
import { BillingActionButton } from "@/components/billing/billing-action-button";
import { PRICING_TIERS } from "@/content/pricing";
import { cn } from "@/lib/cn";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type PricingBlockProps = {
  intro?: boolean;
};

export async function PricingBlock({ intro = true }: PricingBlockProps) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  let userTier = "free";
  if (userId) {
    const [row] = await db
      .select({ tier: users.tier })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (row) userTier = row.tier;
  }
  return (
    <section className="relative px-5 py-16 sm:py-24 lg:px-8">
      <div
        aria-hidden
        className="absolute right-0 top-0 -z-10 size-[45rem] rounded-full bg-accent/10 blur-3xl"
      />
      <div className="mx-auto max-w-7xl">
        {intro ? (
          <div className="max-w-5xl">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="mt-8 text-5xl font-bold leading-[1.06] text-text sm:text-6xl lg:text-7xl">
              Start with positioning. Pay when Trace becomes your engine.
            </h2>
          </div>
        ) : null}

        <div className={cn("grid gap-6 lg:grid-cols-3", intro && "mt-14")}>
          {PRICING_TIERS.map((tier) => (
            <Card
              key={tier.slug}
              glow={tier.featured}
              className={cn(
                "flex min-h-[35rem] flex-col p-7 sm:p-8",
                tier.featured && "border-accent/70",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-2xl font-medium text-text">{tier.name}</h3>
                {tier.featured ? <Pill variant="accent">Best fit</Pill> : null}
              </div>

              <div className="mt-10 flex items-end gap-2">
                <p className="text-6xl font-bold leading-none text-text">
                  {tier.price}
                </p>
                <p className="pb-2 text-lg text-text-dim">{tier.cadence}</p>
              </div>
              <p className="mt-7 text-lg leading-7 text-text-muted">
                {tier.tagline}
              </p>

              <ul className="mt-10 space-y-5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-4 text-base text-text">
                    <Check
                      aria-hidden
                      className="mt-0.5 size-5 shrink-0 text-accent"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <PricingCta tier={tier} userTier={userTier} loggedIn={!!userId} />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCta({
  tier,
  userTier,
  loggedIn,
}: {
  tier: (typeof PRICING_TIERS)[number];
  userTier: string;
  loggedIn: boolean;
}) {
  if (!loggedIn) {
    return (
      <Button
        href={tier.cta.href}
        variant={tier.featured ? "primary" : "ghost"}
        className="mt-auto w-full"
      >
        {tier.cta.label}
      </Button>
    );
  }

  if (tier.slug === "studio") {
    return (
      <Button variant="ghost" className="mt-auto w-full" disabled>
        Coming soon
      </Button>
    );
  }

  if (tier.slug === "strategy") {
    if (userTier === "free") {
      return (
        <Button variant="ghost" className="mt-auto w-full" disabled>
          Current plan
        </Button>
      );
    }
    return (
      <Button variant="ghost" className="mt-auto w-full" disabled>
        Included
      </Button>
    );
  }

  if (tier.slug === "pro") {
    if (userTier === "pro") {
      return (
        <Button variant="primary" className="mt-auto w-full" disabled>
          Current plan
        </Button>
      );
    }
    return (
      <BillingActionButton action="checkout" className="mt-auto">
        Upgrade
      </BillingActionButton>
    );
  }

  return null;
}
