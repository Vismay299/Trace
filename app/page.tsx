import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { Origin } from "@/components/sections/origin";
import { PricingBlock } from "@/components/sections/pricing-block";
import { SourceTrust } from "@/components/sections/source-trust";
import { WaitlistStrip } from "@/components/sections/waitlist-strip";
import { SITE } from "@/content/copy";

export const metadata: Metadata = {
  title: "Trace - Content from proof, not prompts.",
  description: SITE.description,
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Origin />
      <SourceTrust />
      <PricingBlock />
      <WaitlistStrip />
    </>
  );
}
