import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const rows = [
  "POSITIONING",
  "PILLARS",
  "CONTRARIAN TAKES",
  "ORIGIN STORY",
  "VOICE PROFILE",
];

export function StrategyDocCard() {
  return (
    <Card className="p-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase text-text-dim">
            Personal Brand Strategy
          </p>
          <p className="mt-3 text-2xl font-medium text-text">
            Builder with receipts
          </p>
        </div>
        <Pill variant="accent">Draft 01</Pill>
      </div>

      <div className="mt-8 space-y-4">
        {rows.map((row, index) => (
          <div
            key={row}
            className="rounded-2xl border border-border bg-bg px-4 py-4"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-xs uppercase text-text-dim">
                {row}
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-text/10">
              <div
                className="h-full rounded-full bg-accent/60"
                style={{ width: `${68 - index * 7}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
