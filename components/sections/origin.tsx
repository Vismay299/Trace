import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ORIGIN_FEATURES } from "@/content/copy";

export function Origin() {
  return (
    <section className="px-5 py-16 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Eyebrow>The website should tell the same story</Eyebrow>
          <h2 className="mt-8 max-w-lg text-5xl font-bold leading-[1.06] text-text sm:text-6xl lg:text-7xl">
            Every public idea has a private origin.
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {ORIGIN_FEATURES.map((feature) => (
            <Card key={feature.number} className="min-h-72 p-7 sm:p-8">
              <p className="font-mono text-sm text-text-dim">
                {feature.number}
              </p>
              <h3 className="mt-16 text-2xl font-medium leading-tight text-text sm:text-3xl">
                {feature.title}
              </h3>
              <p className="mt-6 text-base leading-7 text-text-muted">
                {feature.body}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
