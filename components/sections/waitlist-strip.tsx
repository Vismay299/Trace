import { Eyebrow } from "@/components/ui/eyebrow";
import { WaitlistForm } from "@/components/sections/waitlist-form";

export function WaitlistStrip() {
  return (
    <section className="px-5 py-16 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 rounded-card border border-border bg-bg-elev/80 p-7 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <Eyebrow>Waitlist</Eyebrow>
          <h2 className="mt-5 text-4xl font-bold leading-tight text-text sm:text-5xl">
            The waitlist is open.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-text-muted">
            Get the first look at the Strategy Doc flow and the proof-backed
            content engine.
          </p>
        </div>
        <WaitlistForm />
      </div>
    </section>
  );
}
