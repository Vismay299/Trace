import type { BudgetSnapshot } from "@/lib/ai/budget";

export function BudgetIndicator({ budget }: { budget: BudgetSnapshot }) {
  const rows = [
    ["Tier 1", budget.tier1],
    ["Tier 2", budget.tier2],
    ["Tier 3", budget.tier3],
  ] as const;

  return (
    <div className="space-y-4">
      {rows.map(([label, item]) => {
        const pct = item.limit ? Math.round((item.used / item.limit) * 100) : 0;
        const warning = pct >= 80;
        return (
          <div key={label}>
            <div className="mb-1 flex justify-between text-xs uppercase tracking-[0.18em]">
              <span className={warning ? "text-danger" : "text-text-dim"}>
                {label}
              </span>
              <span className="text-text-muted">
                {item.used}/{item.limit}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-border">
              <div
                className={`h-full ${warning ? "bg-danger" : "bg-accent"}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        );
      })}
      <p className="text-xs text-text-dim">Resets {budget.periodEnd}</p>
    </div>
  );
}
