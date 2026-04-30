import type { SignalStatus } from "@/lib/ai/signal";

export function SignalBanner({
  signal,
  banner,
}: {
  signal: SignalStatus;
  banner?: string;
}) {
  const low = signal.mode === "low_signal";
  return (
    <aside
      className={`rounded-card border p-4 ${
        low
          ? "border-accent/30 bg-accent-soft"
          : "border-border-strong bg-bg-elev"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-text-dim">
        {low ? "Focused check-in" : "Source-backed week"}
      </p>
      <p className="mt-2 text-sm text-text">
        {banner ?? signal.recommendation}
      </p>
      <p className="mt-2 text-xs text-text-dim">
        {signal.artifacts_found} artifacts, {signal.stories_found} story seeds,
        stage: {signal.product_stage}
      </p>
    </aside>
  );
}
