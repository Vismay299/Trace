import { SourceQuoteCard } from "@/components/visuals/source-quote-card";
import { PlatformRows } from "@/components/visuals/platform-row";
import { TRUST_ITEMS } from "@/content/copy";

export function SourceTrust() {
  return (
    <section className="px-5 py-16 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
          <SourceQuoteCard />
          <PlatformRows />
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.text} className="flex gap-4">
                <Icon
                  aria-hidden
                  className="mt-1 size-5 shrink-0 text-accent"
                />
                <p className="text-xl leading-8 text-text">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
