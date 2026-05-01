import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { PricingBlock } from "@/components/sections/pricing-block";
import { Eyebrow } from "@/components/ui/eyebrow";
import { FAQS } from "@/content/copy";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Trace pricing for Strategy Only, Pro, and Studio.",
};

const comparison = [
  {
    feature: "Source integrations",
    strategy: "0",
    pro: "3",
    studio: "Unlimited",
  },
  { feature: "Manual uploads", strategy: "5", pro: "20", studio: "Unlimited" },
  { feature: "Voice calibration", strategy: false, pro: true, studio: true },
  { feature: "Multi-brand", strategy: false, pro: false, studio: "Up to 5" },
];

export default function PricingPage() {
  return (
    <>
      <PricingBlock />
      <section className="px-5 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Eyebrow>Compare</Eyebrow>
          <h2 className="mt-6 text-4xl font-bold leading-tight text-text sm:text-5xl">
            The tiers are split by operating intensity.
          </h2>

          <div className="mt-10 hidden overflow-hidden rounded-card border border-border md:block">
            <table className="w-full border-collapse text-left">
              <thead className="bg-bg-elev text-sm text-text-dim">
                <tr>
                  <th className="px-6 py-5 font-mono uppercase">Feature</th>
                  <th className="px-6 py-5 font-mono uppercase">
                    Strategy Only
                  </th>
                  <th className="px-6 py-5 font-mono uppercase">Pro</th>
                  <th className="px-6 py-5 font-mono uppercase">Studio</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature} className="border-t border-border">
                    <td className="px-6 py-5 text-text">{row.feature}</td>
                    <ComparisonCell value={row.strategy} />
                    <ComparisonCell value={row.pro} />
                    <ComparisonCell value={row.studio} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 grid gap-4 md:hidden">
            {comparison.map((row) => (
              <div
                key={row.feature}
                className="rounded-card border border-border bg-bg-elev p-5"
              >
                <p className="font-medium text-text">{row.feature}</p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <MobileComparison label="Strategy" value={row.strategy} />
                  <MobileComparison label="Pro" value={row.pro} />
                  <MobileComparison label="Studio" value={row.studio} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:pb-28 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Eyebrow>FAQ</Eyebrow>
          <div className="mt-8 space-y-4">
            {FAQS.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-card border border-border bg-bg-elev p-6"
              >
                <summary className="cursor-pointer list-none text-xl font-medium text-text marker:hidden">
                  <span className="flex items-center justify-between gap-5">
                    {faq.question}
                    <span className="text-accent transition group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-5 text-base leading-7 text-text-muted">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function ComparisonCell({ value }: { value: string | boolean }) {
  return (
    <td className="px-6 py-5">
      <ComparisonValue value={value} />
    </td>
  );
}

function MobileComparison({
  label,
  value,
}: {
  label: string;
  value: string | boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg p-3">
      <p className="font-mono text-xs uppercase text-text-dim">{label}</p>
      <div className="mt-2">
        <ComparisonValue value={value} />
      </div>
    </div>
  );
}

function ComparisonValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return <Check aria-label="Included" className="size-5 text-accent" />;
  }

  if (value === false || value === "0") {
    return <Minus aria-label="Not included" className="size-5 text-text-dim" />;
  }

  return (
    <span
      className={cn("text-text-muted", value === "Unlimited" && "text-accent")}
    >
      {value}
    </span>
  );
}
