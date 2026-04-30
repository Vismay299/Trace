import type { Metadata } from "next";
import { Logo } from "@/components/site/logo";
import {
  WaitlistForm,
  SelectedTierPill,
} from "@/components/sections/waitlist-form";
import { Eyebrow } from "@/components/ui/eyebrow";
import { TIER_LABELS } from "@/content/pricing";

export const metadata: Metadata = {
  title: "Waitlist",
  description: "Join the Trace waitlist for proof-based content generation.",
};

type WaitlistPageProps = {
  searchParams: Promise<{
    tier?: string;
  }>;
};

export default async function WaitlistPage({
  searchParams,
}: WaitlistPageProps) {
  const params = await searchParams;
  const selectedTier =
    params.tier && TIER_LABELS.has(params.tier) ? params.tier : undefined;
  const selectedTierLabel = selectedTier
    ? TIER_LABELS.get(selectedTier)
    : undefined;

  return (
    <div className="px-5 py-16 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <Eyebrow className="mt-12 justify-center">Waitlist</Eyebrow>
        <h1 className="mt-8 text-5xl font-bold leading-[1.06] text-text sm:text-6xl">
          Get in line for proof-based content.
        </h1>
        <p className="mt-6 text-lg leading-8 text-text-muted">
          Tell us where your public story needs to land first. Trace will start
          with positioning, then turn the work behind it into publish-ready
          drafts.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl rounded-card border border-border bg-bg-elev/80 p-6 sm:p-8">
        {selectedTier && selectedTierLabel ? (
          <SelectedTierPill label={selectedTierLabel} />
        ) : null}
        <WaitlistForm mode="full" selectedTier={selectedTier} />
      </div>
    </div>
  );
}
