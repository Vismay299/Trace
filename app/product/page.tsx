import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PRODUCT_FEATURES } from "@/content/copy";
import { AntiSlopList } from "@/components/visuals/anti-slop-list";
import { PlatformRows } from "@/components/visuals/platform-row";
import { SourceQuoteCard } from "@/components/visuals/source-quote-card";
import { StrategyDocCard } from "@/components/visuals/strategy-doc-card";
import { VoiceBar } from "@/components/visuals/voice-bar";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Product",
  description:
    "A walkthrough of Trace's strategy-first, source-backed content engine.",
};

export default function ProductPage() {
  return (
    <div className="px-5 py-16 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <Eyebrow>Product</Eyebrow>
          <h1 className="mt-8 text-5xl font-bold leading-[1.06] text-text sm:text-6xl lg:text-7xl">
            The content engine starts before the content.
          </h1>
          <p className="mt-8 max-w-2xl text-xl leading-8 text-text-muted">
            Trace is built around a simple sequence: find the positioning, mine
            the proof, generate in your voice, and reject anything that sounds
            manufactured.
          </p>
        </div>

        <div className="mt-20 space-y-20">
          {PRODUCT_FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            const reverse = index % 2 === 1;

            return (
              <section
                key={feature.title}
                className={cn(
                  "grid items-center gap-10 lg:grid-cols-2",
                  reverse && "lg:[&>div:first-child]:order-2",
                )}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full border border-border-strong text-accent">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <Eyebrow>{feature.eyebrow}</Eyebrow>
                  </div>
                  <h2 className="mt-6 text-4xl font-medium leading-tight text-text sm:text-5xl">
                    {feature.title}
                  </h2>
                  <p className="mt-6 text-lg leading-8 text-text-muted">
                    {feature.body}
                  </p>
                </div>
                <FeatureVisual name={feature.visual} />
              </section>
            );
          })}
        </div>

        <div className="mt-24 rounded-card border border-border bg-bg-elev/80 p-8 text-center sm:p-12">
          <Eyebrow className="justify-center">Start</Eyebrow>
          <h2 className="mt-5 text-4xl font-bold leading-tight text-text">
            Start with strategy.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-text-muted">
            The first useful artifact Trace creates is not a post. It is the
            lens that makes every post worth writing.
          </p>
          <Button href="/signup" size="lg" className="mt-8">
            Start with strategy
          </Button>
        </div>
      </div>
    </div>
  );
}

function FeatureVisual({ name }: { name: string }) {
  switch (name) {
    case "strategy":
      return <StrategyDocCard />;
    case "source":
      return <SourceQuoteCard />;
    case "voice":
      return <VoiceBar />;
    case "slop":
      return <AntiSlopList />;
    case "formats":
      return <PlatformRows compact />;
    default:
      return null;
  }
}
