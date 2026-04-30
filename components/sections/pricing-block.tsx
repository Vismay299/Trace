import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Pill } from "@/components/ui/pill";
import { PRICING_TIERS } from "@/content/pricing";
import { cn } from "@/lib/cn";

type PricingBlockProps = {
  intro?: boolean;
};

export function PricingBlock({ intro = true }: PricingBlockProps) {
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

              <Button
                href={tier.cta.href}
                variant={tier.featured ? "primary" : "ghost"}
                className="mt-auto w-full"
              >
                {tier.cta.label}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
